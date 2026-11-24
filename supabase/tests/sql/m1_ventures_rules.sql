-- M1 data rules: the time zone (D10), the derived group budget (BUDGET-01 on the server),
-- launch state (#50), import idempotency (D9) and the table constraints.
-- Runs in one transaction and rolls back. Each check prints "ok - <name>" or stops the run.

begin;

create schema tests;
grant usage on schema tests to authenticated;

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

grant execute on all functions in schema tests to authenticated;

insert into auth.users (id, email) values ('00000000-0000-4000-8000-00000000000a', 'planner-a@example.test');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000000000a","role":"authenticated"}', true);

-- D10: IANA zones only.
select tests.fails(
  $sql$insert into public.ventures (title, time_zone) values ('Moon base', 'Mars/Olympus_Mons')$sql$,
  '22023',
  'D10: a Venture''s time zone must be an IANA name'
);
insert into public.ventures (id, title, time_zone) values
  ('20000000-0000-4000-8000-000000000001', 'Tokyo dinner', 'Asia/Tokyo'),
  ('20000000-0000-4000-8000-000000000002', 'Online game night', 'UTC');
select tests.ok(true, 'D10: IANA zones, UTC included, are accepted');
select tests.fails(
  $sql$update public.ventures set time_zone = 'Nowhere/Land' where id = '20000000-0000-4000-8000-000000000001'$sql$,
  '22023',
  'D10: changing to a non-IANA time zone is rejected'
);

-- BUDGET-01 on the server: the group target is derived when read, never stored.
insert into public.ventures (id, title, time_zone, budget_amount, budget_basis, planning_headcount) values
  ('20000000-0000-4000-8000-000000000003', 'Per person', 'UTC', 150, 'per_person', 4),
  ('20000000-0000-4000-8000-000000000004', 'Total', 'UTC', 600, 'total', 4),
  ('20000000-0000-4000-8000-000000000005', 'Thirds', 'UTC', 33.33, 'per_person', 3),
  ('20000000-0000-4000-8000-000000000006', 'No target', 'UTC', null, 'per_person', 5);

do $$
begin
  perform tests.ok(
    (select public.group_budget(v) from public.ventures v where id = '20000000-0000-4000-8000-000000000003') = 600,
    'BUDGET-01 server: $150 per person for 4 is a $600 group target'
  );
  perform tests.ok(
    (select public.group_budget(v) from public.ventures v where id = '20000000-0000-4000-8000-000000000004') = 600,
    'BUDGET-01 server: a $600 total stays $600 whatever the headcount'
  );
  perform tests.ok(
    (select public.group_budget(v) from public.ventures v where id = '20000000-0000-4000-8000-000000000005') = 99.99,
    'BUDGET-01 server: $33.33 per person for 3 is exactly $99.99'
  );
  perform tests.ok(
    (select public.group_budget(v) from public.ventures v where id = '20000000-0000-4000-8000-000000000006') is null,
    'BUDGET-01 server: no budget entry means no target'
  );
end;
$$;

update public.ventures set planning_headcount = 6 where id = '20000000-0000-4000-8000-000000000003';
select tests.ok(
  (select public.group_budget(v) from public.ventures v where id = '20000000-0000-4000-8000-000000000003') = 900,
  'BUDGET-01 server: a headcount change moves a per-person target with no stale total'
);
select tests.ok(
  (select budget_amount from public.ventures where id = '20000000-0000-4000-8000-000000000003') = 150,
  'BUDGET-01 server: the saved entry is what the Planner typed'
);

-- #50: drafts, and a launched Venture stays launched.
select tests.ok(
  (select launched_at from public.ventures where id = '20000000-0000-4000-8000-000000000001') is null,
  '#50: a new Venture starts as a draft'
);
update public.ventures set launched_at = now() where id = '20000000-0000-4000-8000-000000000001';
select tests.fails(
  $sql$update public.ventures set launched_at = null where id = '20000000-0000-4000-8000-000000000001'$sql$,
  '23514',
  '#50: a launched Venture can''t go back to being a draft'
);

-- updated_at follows changes.
do $$
declare
  before_update timestamptz;
begin
  update public.ventures set updated_at = '2000-01-01' where id = '20000000-0000-4000-8000-000000000002';
  select updated_at into before_update from public.ventures where id = '20000000-0000-4000-8000-000000000002';
  perform tests.ok(before_update > '2000-01-02', 'M1: updated_at is set by the database, not the client');
end;
$$;

-- D9: importing the same browser Venture twice makes one row.
insert into public.ventures (title, time_zone, legacy_local_id) values ('Imported', 'UTC', 'local-123')
  on conflict (planner_id, legacy_local_id) do nothing;
insert into public.ventures (title, time_zone, legacy_local_id) values ('Imported again', 'UTC', 'local-123')
  on conflict (planner_id, legacy_local_id) do nothing;
select tests.ok(
  (select count(*) from public.ventures where legacy_local_id = 'local-123') = 1,
  'D9: importing the same browser Venture twice creates one Venture'
);

-- Constraints.
select tests.fails(
  $sql$insert into public.ventures (title, time_zone, schedule_start_date, schedule_end_date) values ('Backwards', 'UTC', '2027-06-06', '2027-06-04')$sql$,
  '23514',
  'M1: an end date before the start date is rejected'
);
insert into public.ventures (title, time_zone, schedule_start_date, schedule_end_date, schedule_start_time, schedule_end_time)
  values ('Rooftop countdown', 'UTC', '2027-12-31', '2027-12-31', '21:00', '01:00');
select tests.ok(true, 'LAUNCH-02 server: a single evening may end after midnight (PRD v0.25)');
select tests.fails(
  $sql$insert into public.ventures (title, time_zone, window_earliest, window_latest) values ('Window', 'UTC', '2027-06-10', '2027-06-01')$sql$,
  '23514',
  'M1: a date window that ends before it starts is rejected'
);
select tests.fails(
  $sql$insert into public.ventures (title, time_zone, currency) values ('Lowercase', 'UTC', 'usd')$sql$,
  '23514',
  'M1: currency is a three-letter code in capitals'
);
select tests.fails(
  $sql$insert into public.ventures (title, time_zone, planning_headcount) values ('Nobody', 'UTC', 0)$sql$,
  '23514',
  'M1: the planning headcount includes at least the Planner'
);
select tests.fails(
  $sql$insert into public.ventures (title, time_zone, planning_data) values ('List', 'UTC', '[]')$sql$,
  '23514',
  'M1: planning data is a JSON object'
);
select tests.fails(
  $sql$insert into public.candidate_windows (venture_id, slot_key, start_date, end_date) values ('20000000-0000-4000-8000-000000000001', 'w1', '2027-06-06', '2027-06-04')$sql$,
  '23514',
  'M1: a candidate window can''t end before it starts'
);
insert into public.candidate_windows (venture_id, slot_key, start_date, end_date) values
  ('20000000-0000-4000-8000-000000000001', 'w1', '2027-06-04', '2027-06-06');
select tests.fails(
  $sql$insert into public.candidate_windows (venture_id, slot_key, start_date, end_date) values ('20000000-0000-4000-8000-000000000001', 'w1', '2027-06-11', '2027-06-13')$sql$,
  '23505',
  'DATE-02 server: a window''s slot key is unique within its Venture'
);

-- Deleting a Venture removes its windows.
delete from public.ventures where id = '20000000-0000-4000-8000-000000000001';
select tests.ok(
  (select count(*) from public.candidate_windows where venture_id = '20000000-0000-4000-8000-000000000001') = 0,
  'M1: deleting a Venture removes its windows'
);

rollback;
