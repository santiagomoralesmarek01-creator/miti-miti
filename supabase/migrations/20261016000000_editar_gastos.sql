-- Editar gastos: cualquier integrante puede corregir un gasto de su grupo
-- (por ejemplo, sumar a alguien que entró después). El grupo no se puede
-- cambiar y quienes pagan y participan tienen que ser del mismo grupo.

create policy "integrantes editan gastos" on public.expenses
  for update using (is_member(group_id))
  with check (
    is_member(group_id) and members_belong(group_id, participant_ids || payer_id)
  );

grant update (description, emoji, amount, payer_id, participant_ids) on public.expenses to authenticated;

-- Nadie puede figurar dos veces en el mismo gasto (pagaría doble).
create function public.no_repeats(ids uuid[]) returns boolean
language sql immutable as $$
  select cardinality(ids) = (select count(distinct x) from unnest(ids) as x);
$$;

alter table public.expenses
  add constraint expenses_participants_unique check (public.no_repeats(participant_ids));
