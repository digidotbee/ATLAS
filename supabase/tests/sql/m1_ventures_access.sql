-- M1 access tests (plan 5.4): one Planner can't read or change another's Venture,
-- drafts stay Planner-only (#50), and candidate windows follow their Venture.
-- Runs in one transaction and rolls back. Each check prints "ok - <name>" or stops the run.

begin;

create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.ok(passed boolean, name text) returns void
language plpgsql as $$
begin
  if passed is not true then
    raise exception 'FAILED: %', name;
  end if;
  raise notice 'ok - %', name;
end;
$$;

create function tests.fails(statement text, expected_state text, name text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate <> expected_state then
      raise exception 'FAILED: % (expected error %, got %: %)', name, expected_state, sqlstate, sqlerrm;
    end if;
    raise notice 'ok - %', name;
    return;
  end;
  raise exception 'FAILED: % (the statement succeeded)', name;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'planner-a@example.test'),
  ('00000000-0000-4000-8000-00000000000b', 'planner-b@example.test');

-- Planner A creates a launched Venture, a draft, and a window.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

insert into public.ventures (id, title, time_zone, launched_at) values
  ('10000000-0000-4000-8000-00000000000a', 'Cabin weekend', 'America/Los_Angeles', now());
insert into public.ventures (id, title, time_zone) values
  ('10000000-0000-4000-8000-0000000000aa', 'Draft dinner', 'America/Los_Angeles');
insert into public.candidate_windows (venture_id, slot_key, start_date, end_date) values
  ('10000000-0000-4000-8000-00000000000a', 'w1', '2027-06-04', '2027-06-06');

do $$
begin
  perform tests.ok((select count(*) from public.ventures) = 2, 'M1 RLS: a Planner reads their own Ventures, drafts included');
  perform tests.ok(
    (select planner_id from public.ventures where title = 'Cabin weekend') = '00000000-0000-4000-8000-00000000000a',
    'M1 RLS: a new Venture belongs to the signed-in Planner by default'
  );
  perform tests.ok((select count(*) from public.candidate_windows) = 1, 'M1 RLS: a Planner reads their own Venture''s windows');
end;
$$;

-- Planner B sees and changes nothing of A's.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000b","role":"authenticated"}', true);

do $$
declare
  changed integer;
begin
  perform tests.ok((select count(*) from public.ventures) = 0, 'M1 RLS: another Planner can''t read a launched Venture or a draft');
  perform tests.ok((select count(*) from public.candidate_windows) = 0, 'M1 RLS: another Planner can''t read a Venture''s windows');

  update public.ventures set title = 'Taken over' where id = '10000000-0000-4000-8000-00000000000a';
  get diagnostics changed = row_count;
  perform tests.ok(changed = 0, 'M1 RLS: another Planner can''t change a Venture');

  delete from public.ventures where id = '10000000-0000-4000-8000-00000000000a';
  get diagnostics changed = row_count;
  perform tests.ok(changed = 0, 'M1 RLS: another Planner can''t delete a Venture');

  delete from public.candidate_windows;
  get diagnostics changed = row_count;
  perform tests.ok(changed = 0, 'M1 RLS: another Planner can''t delete a Venture''s windows');
end;
$$;

select tests.fails(
  $sql$insert into public.ventures (planner_id, title, time_zone) values ('00000000-0000-4000-8000-00000000000a', 'Forged', 'UTC')$sql$,
  '42501',
  'M1 RLS: a Planner can''t create a Venture owned by someone else'
);
select tests.fails(
  $sql$insert into public.candidate_windows (venture_id, slot_key, start_date, end_date) values ('10000000-0000-4000-8000-00000000000a', 'w2', '2027-06-11', '2027-06-13')$sql$,
  '42501',
  'M1 RLS: a Planner can''t add a window to someone else''s Venture'
);

-- B's own Venture can't be handed to A.
insert into public.ventures (id, title, time_zone) values ('10000000-0000-4000-8000-00000000000b', 'B''s picnic', 'UTC');
select tests.fails(
  $sql$update public.ventures set planner_id = '00000000-0000-4000-8000-00000000000a' where id = '10000000-0000-4000-8000-00000000000b'$sql$,
  '42501',
  'M1 RLS: a Planner can''t give a Venture to someone else'
);

-- Signed out: nothing at all.
reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);
select tests.fails($sql$select count(*) from public.ventures$sql$, '42501', 'M1 RLS: a signed-out visitor can''t read Ventures');
select tests.fails($sql$select count(*) from public.candidate_windows$sql$, '42501', 'M1 RLS: a signed-out visitor can''t read windows');

-- Back to A: the Venture is untouched by B's attempts.
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);
do $$
begin
  perform tests.ok(
    (select title from public.ventures where id = '10000000-0000-4000-8000-00000000000a') = 'Cabin weekend',
    'M1 RLS: the Venture is unchanged after another Planner''s attempts'
  );
end;
$$;

rollback;
