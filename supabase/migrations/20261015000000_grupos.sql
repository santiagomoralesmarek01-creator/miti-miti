-- Miti-Miti: grupos privados. Solo los integrantes ven y modifican un grupo;
-- para entrar hace falta el código de invitación.

-- Código de invitación al azar: 32 caracteres hexadecimales (122 bits).
create function public.new_invite_code() returns text
language sql volatile as $$
  select replace(gen_random_uuid()::text, '-', '');
$$;

-- ============ Tablas ============

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  emoji text not null default '💸',
  currency text not null default 'ARS' check (currency in ('ARS', 'USD', 'EUR', 'UYU', 'CLP', 'BRL')),
  invite_code text not null unique default public.new_invite_code(),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Un integrante puede no tener cuenta todavía (user_id nulo): se "reclama"
-- cuando esa persona entra con el link de invitación.
create table public.members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  description text not null check (char_length(description) between 1 and 60),
  emoji text not null default '💸',
  amount bigint not null check (amount > 0), -- en centavos
  payer_id uuid not null references public.members (id) on delete cascade,
  participant_ids uuid[] not null check (cardinality(participant_ids) > 0),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  from_id uuid not null references public.members (id) on delete cascade,
  to_id uuid not null references public.members (id) on delete cascade,
  amount bigint not null check (amount > 0),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);

create index on public.members (user_id);
create index on public.members (group_id);
create index on public.expenses (group_id);
create index on public.payments (group_id);

-- ============ Permisos ============

-- security definer evita que las políticas de members se llamen a sí mismas.
create function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where group_id = gid and user_id = auth.uid());
$$;

-- Que los ids de un gasto o pago pertenezcan al mismo grupo.
create function public.members_belong(gid uuid, ids uuid[]) returns boolean
language sql stable security definer set search_path = public as $$
  select count(*) = (select count(distinct x) from unnest(ids) as x)
    from members where group_id = gid and id = any(ids);
$$;

alter table public.groups enable row level security;
alter table public.members enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;

-- Los grupos se crean con create_group(); acá solo se leen, editan y borran.
create policy "integrantes ven el grupo" on public.groups
  for select using (is_member(id));
create policy "integrantes editan el grupo" on public.groups
  for update using (is_member(id)) with check (is_member(id));
create policy "quien lo creó lo borra" on public.groups
  for delete using (created_by = auth.uid());

create policy "integrantes ven integrantes" on public.members
  for select using (is_member(group_id));
-- Se pueden sumar personas sin cuenta; vincular cuentas solo con join_group().
create policy "integrantes suman personas" on public.members
  for insert with check (is_member(group_id) and user_id is null);
create policy "integrantes renombran" on public.members
  for update using (is_member(group_id)) with check (is_member(group_id));

create policy "integrantes ven gastos" on public.expenses
  for select using (is_member(group_id));
create policy "integrantes cargan gastos" on public.expenses
  for insert with check (
    is_member(group_id) and members_belong(group_id, participant_ids || payer_id)
  );
create policy "integrantes borran gastos" on public.expenses
  for delete using (is_member(group_id));

create policy "integrantes ven pagos" on public.payments
  for select using (is_member(group_id));
create policy "integrantes registran pagos" on public.payments
  for insert with check (
    is_member(group_id) and members_belong(group_id, array[from_id, to_id])
  );
create policy "integrantes borran pagos" on public.payments
  for delete using (is_member(group_id));

-- ============ Funciones ============

-- Crea el grupo, a quien lo crea (vinculado a su cuenta) y al resto.
create function public.create_group(
  p_name text, p_emoji text, p_currency text, p_my_name text, p_other_names text[] default '{}'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Hay que iniciar sesión';
  end if;
  insert into groups (name, emoji, currency, created_by)
    values (trim(p_name), p_emoji, p_currency, auth.uid())
    returning id into gid;
  insert into members (group_id, name, user_id) values (gid, trim(p_my_name), auth.uid());
  -- Todo pasa en la misma transacción (mismo now()): se escalona created_at
  -- para que el orden de llegada, y con él los colores, quede fijo.
  insert into members (group_id, name, created_at)
    select gid, trim(n), now() + i * interval '1 millisecond'
    from unnest(p_other_names) with ordinality as t(n, i)
    where trim(n) <> '';
  return gid;
end;
$$;

-- Lo que ve alguien que abre un link de invitación, sin ser integrante aún.
create function public.get_invite(p_code text)
returns table (group_id uuid, name text, emoji text, already_member boolean, open_members jsonb)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.emoji,
    exists (select 1 from members m where m.group_id = g.id and m.user_id = auth.uid()),
    coalesce(
      (select jsonb_agg(jsonb_build_object('id', m.id, 'name', m.name) order by m.created_at)
         from members m where m.group_id = g.id and m.user_id is null),
      '[]'::jsonb)
  from groups g
  where g.invite_code = p_code and auth.uid() is not null;
$$;

-- Entra al grupo: reclama un integrante sin cuenta o se suma con un nombre nuevo.
create function public.join_group(p_code text, p_member_id uuid default null, p_name text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Hay que iniciar sesión';
  end if;
  select id into gid from groups where invite_code = p_code;
  if gid is null then
    raise exception 'El link de invitación no es válido';
  end if;
  if exists (select 1 from members where group_id = gid and user_id = auth.uid()) then
    return gid;
  end if;

  if p_member_id is not null then
    update members set user_id = auth.uid()
      where id = p_member_id and group_id = gid and user_id is null;
    if not found then
      raise exception 'Esa persona ya tiene cuenta en el grupo';
    end if;
  elsif coalesce(trim(p_name), '') <> '' then
    insert into members (group_id, name, user_id) values (gid, trim(p_name), auth.uid());
  else
    raise exception 'Falta elegir quién sos';
  end if;
  return gid;
end;
$$;

-- Invalida el link anterior y genera uno nuevo.
create function public.reset_invite(p_group_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  code text;
begin
  if not is_member(p_group_id) then
    raise exception 'No sos integrante de este grupo';
  end if;
  update groups set invite_code = public.new_invite_code()
    where id = p_group_id returning invite_code into code;
  return code;
end;
$$;

-- ============ Acceso desde la API ============

-- Solo usuarios con sesión. Las columnas que se pueden editar son las de nombre
-- y apariencia: invite_code, created_by y user_id cambian únicamente a través
-- de las funciones de arriba.
revoke all on public.groups, public.members, public.expenses, public.payments from anon, authenticated;
grant select, delete on public.groups, public.members, public.expenses, public.payments to authenticated;
grant insert on public.members, public.expenses, public.payments to authenticated;
grant update (name, emoji, currency) on public.groups to authenticated;
grant update (name) on public.members to authenticated;

revoke execute on function public.new_invite_code, public.is_member, public.members_belong, public.create_group,
  public.get_invite, public.join_group, public.reset_invite from public, anon, authenticated;
grant execute on function public.is_member, public.members_belong, public.create_group, public.get_invite,
  public.join_group, public.reset_invite to authenticated;

-- ============ Tiempo real ============

alter publication supabase_realtime add table public.groups, public.members, public.expenses, public.payments;
