-- M1 · Foundation: Ventures and candidate windows.
-- Implementation plan 5.3 (data model) and 5.4 (access model); D2, D9, D10; PRD v0.26.
-- Columns arrive with the milestone that uses them: M5 adds featured_decision_id and plans,
-- M8 adds parent_venture_id and client_request_id.

-- Ventures -------------------------------------------------------------------------------

create table public.ventures (
  id uuid primary key default gen_random_uuid(),
  planner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,

  title text not null default '',
  destination text not null default '',
  region text not null default '',
  -- D10: an IANA zone. Dates and times below are clock times in this zone.
  time_zone text not null,

  schedule_mode text not null default 'fixed' check (schedule_mode in ('fixed', 'decision')),
  -- The date phase only. A draft is a Venture with no launched_at, never a status (#50).
  status text not null default 'planning' check (status in ('voting', 'planning')),

  -- The fixed or locked schedule. On a single date, an end time before the start time
  -- ends the next day (PRD v0.25), so times are not compared here.
  schedule_start_date date,
  schedule_end_date date,
  schedule_start_time time,
  schedule_end_time time,

  -- Date Decision: the Opt in by cutoff is an exact moment (D10); the window is in Venture time.
  opt_in_by timestamptz,
  window_earliest date,
  window_latest date,
  ideal_length text not null default '',
  max_opt_ins integer check (max_opt_ins is null or max_opt_ins > 0),

  planning_headcount integer not null default 1 check (planning_headcount >= 1),

  -- The budget entry as the Planner typed it. The group target is derived on read
  -- (group_budget below) and never stored (plan 5.3, budget rule on the server).
  budget_amount numeric(12, 2) check (budget_amount is null or budget_amount > 0),
  budget_basis text not null default 'total' check (budget_basis in ('total', 'per_person')),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  cushion_pct numeric(5, 2) not null default 0 check (cushion_pct >= 0 and cushion_pct <= 100),

  -- Venture brief (BOARD-08). Imported Shape it answers arrive with brief_shared false (5.5).
  brief_feel text not null default '',
  brief_avoid text not null default '',
  brief_notes text not null default '',
  brief_shared boolean not null default false,

  -- Transitional: the existing planning tabs' data (candidates, itinerary, notes) until M5
  -- moves it into plans, decisions and options under D8. Planner-only, like the row.
  planning_data jsonb not null default '{}'::jsonb check (jsonb_typeof(planning_data) = 'object'),

  -- D9: the browser ID of an imported Venture, so importing twice changes nothing.
  legacy_local_id text,

  -- Empty while the Venture is a draft only its Planner sees (#50). Launch sets it once.
  launched_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ventures_schedule_dates check (
    schedule_start_date is null or schedule_end_date is null or schedule_end_date >= schedule_start_date
  ),
  constraint ventures_window_dates check (
    window_earliest is null or window_latest is null or window_latest >= window_earliest
  ),
  constraint ventures_legacy_local_id unique (planner_id, legacy_local_id)
);

create index ventures_planner_id on public.ventures (planner_id);

comment on table public.ventures is 'One Venture per row. Planner-only in M1; members arrive in M2 and see launched Ventures only.';
comment on column public.ventures.planning_data is 'Transitional until M5: the browser planning tabs'' data. Never shown to anyone but the Planner.';

-- D10: only IANA zone names (UTC included).
create function public.ventures_check_time_zone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone) then
    raise exception 'D10: "%" is not an IANA time zone', new.time_zone using errcode = '22023';
  end if;
  return new;
end;
$$;

-- The lookup costs a few milliseconds, so updates only check a zone that actually changed.
create trigger ventures_check_time_zone_on_insert
before insert on public.ventures
for each row execute function public.ventures_check_time_zone();

create trigger ventures_check_time_zone_on_change
before update of time_zone on public.ventures
for each row when (old.time_zone is distinct from new.time_zone)
execute function public.ventures_check_time_zone();

-- Keep updated_at current, and keep a launched Venture launched (#50).
create function public.ventures_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.launched_at is not null and new.launched_at is distinct from old.launched_at then
    raise exception 'A launched Venture stays launched' using errcode = '23514';
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger ventures_before_update
before update on public.ventures
for each row execute function public.ventures_before_update();

-- The group budget target, derived when read (BUDGET-01 on the server). With a per-person
-- basis it is the amount times the planning headcount; numeric(12,2) times an integer is exact,
-- so it matches the browser's withBudgetTotal. Exposed to the API as a computed column.
create function public.group_budget(v public.ventures)
returns numeric
language sql
stable
set search_path = ''
as $$
  select case when v.budget_basis = 'per_person' then v.budget_amount * v.planning_headcount else v.budget_amount end;
$$;

-- Candidate windows (ready for M2) ------------------------------------------------------

create table public.candidate_windows (
  id uuid primary key default gen_random_uuid(),
  venture_id uuid not null references public.ventures (id) on delete cascade,
  -- Stable across edits, so answers keep pointing at the same window (DATE-02).
  slot_key text not null check (slot_key <> ''),
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  -- Revising a window bumps this and prompts fresh answers (DATE-02).
  revision integer not null default 1 check (revision >= 1),
  created_at timestamptz not null default now(),
  constraint candidate_windows_slot unique (venture_id, slot_key),
  constraint candidate_windows_dates check (end_date >= start_date)
);

-- Access (plan 5.4) ---------------------------------------------------------------------
-- Row-level security on every table. In M1 only a Venture's Planner can read or change it,
-- which also keeps drafts Planner-only. M2's member policies must require launched_at.

alter table public.ventures enable row level security;
alter table public.candidate_windows enable row level security;

revoke all on public.ventures, public.candidate_windows from anon;
grant select, insert, update, delete on public.ventures, public.candidate_windows to authenticated;

create policy "Planners read their own Ventures" on public.ventures
  for select to authenticated using (planner_id = (select auth.uid()));
create policy "Planners create their own Ventures" on public.ventures
  for insert to authenticated with check (planner_id = (select auth.uid()));
create policy "Planners change their own Ventures" on public.ventures
  for update to authenticated
  using (planner_id = (select auth.uid()))
  with check (planner_id = (select auth.uid()));
create policy "Planners delete their own Ventures" on public.ventures
  for delete to authenticated using (planner_id = (select auth.uid()));

create policy "Planners manage their Ventures' windows" on public.candidate_windows
  for all to authenticated
  using (exists (
    select 1 from public.ventures v where v.id = venture_id and v.planner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.ventures v where v.id = venture_id and v.planner_id = (select auth.uid())
  ));
