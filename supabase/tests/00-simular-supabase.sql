-- Imita lo mínimo de Supabase para probar la migración en un Postgres común:
-- el esquema auth, auth.uid(), los roles y la publicación de tiempo real.
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  -- Los roles son de todo el servidor: pueden existir de una corrida anterior.
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
set client_min_messages = error; -- sin aviso por wal_level
create publication supabase_realtime;
