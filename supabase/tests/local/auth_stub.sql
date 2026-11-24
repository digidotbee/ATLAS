-- A minimal stand-in for the parts of Supabase that the migrations and tests use, so the
-- database tests also run on a plain Postgres with no Docker (scripts/db-test-local.sh).
-- Never applied to a Supabase database: there the real auth schema and roles exist.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id uuid primary key,
  email text
);

-- Same definition as Supabase's: the signed-in user's ID from the request's JWT claims.
create function auth.uid()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid;
$$;

grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
