-- Prueba los permisos (RLS) y las funciones de invitación.
-- Correr: npm run test:db  (necesita un Postgres local; ver README)
\set ON_ERROR_STOP on
\set QUIET on

create function pg_temp.check(ok boolean, msg text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FALLÓ: %', msg; end if;
  raise notice 'ok: %', msg;
end $$;

create function pg_temp.fails(q text, msg text) returns void language plpgsql as $$
begin
  execute q;
  raise exception 'FALLÓ (tendría que haber dado error): %', msg;
exception when others then
  if sqlerrm like 'FALLÓ%' then raise; end if;
  raise notice 'ok: % (%)', msg, sqlerrm;
end $$;

grant execute on all functions in schema pg_temp to authenticated;

insert into auth.users values
  ('00000000-0000-0000-0000-00000000000a'),  -- Ana, crea el grupo
  ('00000000-0000-0000-0000-00000000000b'),  -- Beto, entra por invitación
  ('00000000-0000-0000-0000-00000000000c');  -- Caro, no está invitada

create temp table ctx (gid uuid, code text, ana uuid, beto uuid, caro uuid, nico uuid);
grant all on ctx to authenticated;

-- Ana crea un grupo con dos personas sin cuenta.
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into ctx (gid) select create_group('Asado', '🍖', 'ARS', 'Ana', array['Beto', 'Nico']);
update ctx set code = (select invite_code from groups where id = ctx.gid);
select pg_temp.check((select count(*) from members) = 3, 'Ana ve a los 3 integrantes');
select pg_temp.check((select user_id from members where name = 'Ana') = auth.uid(), 'Ana queda vinculada a su cuenta');
update ctx set ana = (select id from members where name = 'Ana'),
               beto = (select id from members where name = 'Beto'),
               nico = (select id from members where name = 'Nico');

insert into expenses (group_id, description, amount, payer_id, participant_ids)
  select gid, 'Carne', 3000000, ana, array[ana, beto, nico] from ctx;
select pg_temp.check((select count(*) from expenses) = 1, 'Ana carga un gasto (el que paga también participa)');

-- Caro no fue invitada: no ve nada y no puede escribir.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.check((select count(*) from groups) = 0, 'Caro no ve el grupo');
select pg_temp.check((select count(*) from members) = 0, 'Caro no ve integrantes');
select pg_temp.check((select count(*) from expenses) = 0, 'Caro no ve gastos');
select pg_temp.fails(format(
  'insert into expenses (group_id, description, amount, payer_id, participant_ids) values (%L, ''x'', 100, %L, array[%L]::uuid[])',
  (select gid from ctx), (select ana from ctx), (select ana from ctx)), 'Caro no puede cargar gastos');
select pg_temp.fails(format('select reset_invite(%L)', (select gid from ctx)), 'Caro no puede regenerar el link');
update expenses set amount = 1 where description = 'Carne';
reset role;
select pg_temp.check((select amount from expenses where description = 'Carne') = 3000000, 'Caro no puede editar gastos ajenos');
set role authenticated;
select pg_temp.fails('select join_group(''codigo-falso'', null, ''Caro'')', 'Un código falso no sirve');

-- Beto abre el link: ve el grupo y quiénes faltan reclamar.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.check((select jsonb_array_length(open_members) from get_invite((select code from ctx))) = 2, 'La invitación muestra 2 personas sin cuenta');
select pg_temp.check((select count(*) from groups) = 0, 'Antes de unirse, Beto no ve el grupo');
select join_group((select code from ctx), (select beto from ctx));
select pg_temp.check((select count(*) from expenses) = 1, 'Después de unirse, Beto ve los gastos');
select pg_temp.check((select already_member from get_invite((select code from ctx))), 'La invitación sabe que Beto ya es integrante');

-- Nadie puede apropiarse de otro integrante ni vincular cuentas a mano.
select pg_temp.fails(format('update members set user_id = auth.uid() where id = %L', (select nico from ctx)), 'No se puede cambiar user_id directamente');
select pg_temp.fails(format('insert into members (group_id, name, user_id) values (%L, ''Truco'', %L)',
  (select gid from ctx), '00000000-0000-0000-0000-00000000000c'), 'No se puede sumar a alguien con cuenta ajena');
select pg_temp.fails(format('update groups set invite_code = ''elegido-a-mano'' where id = %L', (select gid from ctx where code is not null)),
  'No se puede elegir el código de invitación a mano');
select pg_temp.fails('insert into groups (name) values (''Sin función'')', 'Los grupos solo se crean con create_group()');
update members set name = 'Nicolás' where id = (select nico from ctx);
select pg_temp.check((select name from members where id = (select nico from ctx)) = 'Nicolás', 'Se puede renombrar a un integrante');

-- Lo que cargó otra persona no se edita ni se borra.
update expenses set amount = 1 where description = 'Carne';
delete from expenses where description = 'Carne';
select pg_temp.check((select amount from expenses where description = 'Carne') = 3000000,
  'Beto no puede editar ni borrar el gasto que cargó Ana');
select pg_temp.fails(format(
  'insert into expenses (group_id, description, amount, payer_id, participant_ids, created_by) values (%L, ''Trucho'', 100, %L, array[%L]::uuid[], %L)',
  (select gid from ctx where code is not null), (select beto from ctx where code is not null), (select beto from ctx where code is not null),
  '00000000-0000-0000-0000-00000000000a'), 'Beto no puede cargar un gasto a nombre de Ana');
insert into expenses (group_id, description, amount, payer_id, participant_ids)
  select gid, 'Hielo', 50000, beto, array[ana, beto] from ctx where code is not null;
update expenses set amount = 60000 where description = 'Hielo';
select pg_temp.check((select amount from expenses where description = 'Hielo') = 60000, 'Beto edita el gasto que cargó él');
delete from expenses where description = 'Hielo';
select pg_temp.check((select count(*) from expenses where description = 'Hielo') = 0, 'Beto borra el gasto que cargó él');

-- Ana edita lo suyo: puede sacar y volver a sumar gente.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
update expenses set participant_ids = array_remove(participant_ids, (select nico from ctx where code is not null))
  where description = 'Carne';
update expenses set participant_ids = participant_ids || (select nico from ctx where code is not null)
  where description = 'Carne';
select pg_temp.check((select cardinality(participant_ids) from expenses where description = 'Carne') = 3,
  'Ana edita su gasto para sacar y volver a sumar a alguien');
select pg_temp.fails(format('update expenses set participant_ids = participant_ids || %L::uuid where description = %L',
  (select nico from ctx where code is not null), 'Carne'), 'Nadie puede figurar dos veces en un gasto');
select pg_temp.fails(format('update expenses set group_id = gen_random_uuid() where description = %L', 'Carne'),
  'No se puede mover un gasto a otro grupo');
select pg_temp.fails(format('update expenses set created_by = %L where description = %L', '00000000-0000-0000-0000-00000000000b', 'Carne'),
  'No se puede cambiar quién cargó un gasto');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';

-- Gastos y pagos solo con integrantes del mismo grupo.
insert into ctx (gid) select create_group('Otro', '🏠', 'USD', 'Beto solo', '{}');
select pg_temp.fails(format(
  'insert into expenses (group_id, description, amount, payer_id, participant_ids) values (%L, ''x'', 100, %L, array[%L]::uuid[])',
  (select gid from ctx where code is not null), (select beto from ctx where code is not null),
  (select id from members where name = 'Beto solo')), 'No se mezclan integrantes de otro grupo');
insert into expenses (group_id, description, amount, payer_id, participant_ids)
  select gid, 'Pan', 20000, beto, array[ana, beto] from ctx where code is not null;
select pg_temp.fails(format('update expenses set participant_ids = array[%L]::uuid[] where description = %L',
  (select id from members where name = 'Beto solo'), 'Pan'), 'No se puede editar un gasto con gente de otro grupo');
select pg_temp.fails(format('insert into payments (group_id, from_id, to_id, amount) values (%L, %L, %L, 0)',
  (select gid from ctx where code is not null), (select beto from ctx where code is not null), (select ana from ctx where code is not null)), 'Un pago tiene que ser mayor a cero');
insert into payments (group_id, from_id, to_id, amount)
  select gid, beto, ana, 1000000 from ctx where code is not null;
select pg_temp.check((select count(*) from payments) = 1, 'Beto registra un pago');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from payments;
select pg_temp.check((select count(*) from payments) = 1, 'Ana no puede deshacer el pago que registró Beto');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
delete from payments;
select pg_temp.check((select count(*) from payments) = 0, 'Beto deshace el pago que registró él');
select pg_temp.fails(format('insert into payments (group_id, from_id, to_id, amount, created_by) values (%L, %L, %L, 100, %L)',
  (select gid from ctx where code is not null), (select beto from ctx where code is not null), (select ana from ctx where code is not null),
  '00000000-0000-0000-0000-00000000000a'), 'Beto no puede registrar un pago a nombre de Ana');

-- Regenerar el link invalida el anterior.
select reset_invite((select gid from ctx where code is not null));
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select pg_temp.fails(format('select join_group(%L, null, ''Caro'')', (select code from ctx where code is not null)), 'El link viejo deja de servir');

-- Solo quien creó el grupo lo puede borrar.
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
delete from groups where id = (select gid from ctx where code is not null);
reset role;
select pg_temp.check((select count(*) from groups where name = 'Asado') = 1, 'Beto no puede borrar el grupo de Ana');
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
delete from groups where id = (select gid from ctx where code is not null);
reset role;
select pg_temp.check((select count(*) from groups where name = 'Asado') = 0, 'Ana sí puede borrarlo');
select pg_temp.check((select count(*) from expenses) = 0, 'Al borrar el grupo se borran sus gastos');

-- Sin sesión no se puede crear nada.
set role anon;
reset request.jwt.claim.sub;
select pg_temp.fails('select public.create_group(''x'', ''x'', ''ARS'', ''x'')', 'Sin sesión no se crean grupos');
select pg_temp.fails('select count(*) from public.groups', 'Sin sesión no se lee nada');
reset role;

\echo 'Todos los tests de permisos pasaron.'
