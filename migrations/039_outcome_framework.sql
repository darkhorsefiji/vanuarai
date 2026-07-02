-- 039: Outcome Framework (Phase 1 schema). A results/M&E model that replaces the
-- perspective/platform BSC scorecard: Outcome → Indicator → Variance → Action →
-- Challenge, cascading over the existing scope_nodes tree (both axes) via the
-- established sum/avg/none roll-up. See docs/outcome-framework-spec.md.
--
-- Non-destructive: the old scorecard_* tables are left in place for rollback and
-- are ported/retired in a later cutover migration. Idempotent (create if not
-- exists / guarded enum creation) and safe inside db.js's single transaction.

-- ── enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type action_kind   as enum ('task','intervention','project');
exception when duplicate_object then null; end $$;
do $$ begin
  create type action_status as enum ('not_started','in_progress','on_hold','cancelled','completed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type raci_role     as enum ('responsible','accountable','consulted','informed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type assignee_kind as enum ('person','office','membership','gov_contact','agency','free');
exception when duplicate_object then null; end $$;
do $$ begin
  create type monitored_kind as enum ('action','challenge');
exception when duplicate_object then null; end $$;
do $$ begin
  create type challenge_status as enum ('open','in_progress','on_hold','resolved','cancelled');
exception when duplicate_object then null; end $$;

-- ── (a) Vanua Focus Areas — seeded from the 4 Meda Matata Mada perspectives ────
create table if not exists outcome_focus_areas (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  label       text not null,
  accent      text,
  sort_order  int  not null default 0,
  archived_at timestamptz
);
insert into outcome_focus_areas (code, label, accent, sort_order) values
  ('family',  'The Strengthened Family', 'var(--sage)', 1),
  ('process', 'Productive Capability',   'var(--sea)',  2),
  ('vanua',   'Vanua & Nation',          'var(--pop)',  3),
  ('wealth',  'Wealth Creation',         'var(--clay)', 4)
on conflict (code) do nothing;

-- ── (b) Government Pillars = TAB Platforms (from strategy.js PLATFORMS) ─────────
create table if not exists gov_pillars (
  id          uuid primary key default gen_random_uuid(),
  platform_no int  unique not null,        -- 1..5
  name        text not null,
  thrust      text not null,               -- 'inclusive' | 'transformational'
  sort_order  int  not null default 0,
  archived_at timestamptz
);
insert into gov_pillars (platform_no, name, thrust, sort_order) values
  (1, 'Good Governance of iTaukei',                                                 'inclusive',        1),
  (2, 'Wellbeing of iTaukei',                                                       'inclusive',        2),
  (3, 'Economic Empowerment',                                                       'transformational', 3),
  (4, 'Conservation of Natural Resources & Climate Change Adaptation',              'transformational', 4),
  (5, 'Leadership & Vanua Empowerment',                                             'inclusive',        5)
on conflict (platform_no) do nothing;

-- ── (c) ISIC Rev.4 sectors — section level A–U (deeper classes added later) ────
create table if not exists isic_sectors (
  code        text primary key,            -- 'A'..'U' (section) or n-digit class
  parent_code text references isic_sectors(code),
  level       text not null,               -- 'section' | 'division' | 'group' | 'class'
  title       text not null,
  sort_order  int  not null default 0
);
insert into isic_sectors (code, parent_code, level, title, sort_order) values
  ('A', null, 'section', 'Agriculture, forestry and fishing', 1),
  ('B', null, 'section', 'Mining and quarrying', 2),
  ('C', null, 'section', 'Manufacturing', 3),
  ('D', null, 'section', 'Electricity, gas, steam and air conditioning supply', 4),
  ('E', null, 'section', 'Water supply; sewerage, waste management and remediation', 5),
  ('F', null, 'section', 'Construction', 6),
  ('G', null, 'section', 'Wholesale and retail trade; repair of motor vehicles', 7),
  ('H', null, 'section', 'Transportation and storage', 8),
  ('I', null, 'section', 'Accommodation and food service activities', 9),
  ('J', null, 'section', 'Information and communication', 10),
  ('K', null, 'section', 'Financial and insurance activities', 11),
  ('L', null, 'section', 'Real estate activities', 12),
  ('M', null, 'section', 'Professional, scientific and technical activities', 13),
  ('N', null, 'section', 'Administrative and support service activities', 14),
  ('O', null, 'section', 'Public administration and defence; compulsory social security', 15),
  ('P', null, 'section', 'Education', 16),
  ('Q', null, 'section', 'Human health and social work activities', 17),
  ('R', null, 'section', 'Arts, entertainment and recreation', 18),
  ('S', null, 'section', 'Other service activities', 19),
  ('T', null, 'section', 'Activities of households as employers / own use', 20),
  ('U', null, 'section', 'Activities of extraterritorial organizations and bodies', 21)
on conflict (code) do nothing;

-- ── Outcomes (authored once at an apex node; D2 shared-outcome model) ──────────
create table if not exists outcomes (
  id            uuid primary key default gen_random_uuid(),
  node_id       uuid references scope_nodes(id),          -- authoring/apex node
  axis          scope_axis,                               -- traditional | government
  title         text not null,
  description   text,
  focus_area_id uuid references outcome_focus_areas(id),  -- (a)
  gov_pillar_id uuid references gov_pillars(id),          -- (b)
  isic_code     text references isic_sectors(code),       -- (c)
  status        text not null default 'active',           -- active | achieved | archived
  sort_order    int  not null default 0,
  archived_at   timestamptz,
  created_by    uuid references users(id),
  created_at    timestamptz not null default now()
);
create index if not exists outcomes_node   on outcomes(node_id);
create index if not exists outcomes_focus   on outcomes(focus_area_id);
create index if not exists outcomes_pillar  on outcomes(gov_pillar_id);
create index if not exists outcomes_isic    on outcomes(isic_code);

-- ── Outcome indicators (long-term) + their measurements (roll UP the tree) ─────
create table if not exists outcome_indicators (
  id          uuid primary key default gen_random_uuid(),
  outcome_id  uuid not null references outcomes(id) on delete cascade,
  name        text not null,
  unit        text,
  rollup      text not null default 'sum',   -- sum | avg | none
  sort_order  int  not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists outcome_indicators_outcome on outcome_indicators(outcome_id);

create table if not exists outcome_measurements (
  id           uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references outcome_indicators(id) on delete cascade,
  node_id      uuid not null references scope_nodes(id),
  period       text,                                  -- e.g. '2026'
  target_value numeric(14,2) not null default 0,
  actual_value numeric(14,2) not null default 0,
  variance     numeric(14,2) generated always as (actual_value - target_value) stored,
  created_at   timestamptz not null default now(),
  unique (indicator_id, node_id, period)
);
create index if not exists outcome_measurements_node on outcome_measurements(node_id);

-- ── Actions: Task | Intervention | Project (unified monitoring) ────────────────
create table if not exists actions (
  id                     uuid primary key default gen_random_uuid(),
  ref_code               text unique,                 -- INT-#### / TSK-#### / PRJ-####
  kind                   action_kind not null,
  title                  text not null,
  description            text,
  outcome_measurement_id uuid references outcome_measurements(id),  -- the gap it closes
  node_id                uuid references scope_nodes(id),
  target_due_date        date,
  actual_due_date        date,
  status                 action_status not null default 'not_started',
  parent_intervention_id uuid references actions(id),  -- tasks only
  project_id             uuid references projects(id), -- projects only
  created_by             uuid references users(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index if not exists actions_measurement on actions(outcome_measurement_id);
create index if not exists actions_parent       on actions(parent_intervention_id);
create index if not exists actions_status       on actions(status);

-- Enforce: a task may attach only to a non-completed intervention (spec rule 3).
create or replace function enforce_task_intervention() returns trigger as $$
begin
  if new.kind = 'task' and new.parent_intervention_id is not null then
    if not exists (
      select 1 from actions a
      where a.id = new.parent_intervention_id
        and a.kind = 'intervention'
        and a.status <> 'completed'
    ) then
      raise exception 'Task % may only attach to a non-completed intervention (parent %).',
        coalesce(new.ref_code, new.id::text), new.parent_intervention_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_task_intervention on actions;
create trigger trg_task_intervention before insert or update on actions
  for each row execute function enforce_task_intervention();

-- ── Intervention indicators (short-term) — deliberately separate registry ──────
create table if not exists intervention_indicators (
  id           uuid primary key default gen_random_uuid(),
  action_id    uuid not null references actions(id) on delete cascade,  -- intervention/project
  name         text not null,
  unit         text,
  target_value numeric(14,2) not null default 0,
  actual_value numeric(14,2) not null default 0,
  period       text,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists intervention_indicators_action on intervention_indicators(action_id);

-- ── Challenges / impediment log (raised when an action goes overdue) ───────────
create table if not exists challenges (
  id              uuid primary key default gen_random_uuid(),
  ref_code        text unique,                 -- CHL-####
  action_id       uuid not null references actions(id) on delete cascade,
  description     text not null,
  raised_on       date not null default current_date,
  target_due_date date,
  actual_due_date date,
  status          challenge_status not null default 'open',
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists challenges_action on challenges(action_id);

-- ── RACI — polymorphic over actions and challenges (shared monitoring) ─────────
create table if not exists raci_assignments (
  id            uuid primary key default gen_random_uuid(),
  parent_kind   monitored_kind not null,        -- 'action' | 'challenge'
  parent_id     uuid not null,
  raci          raci_role not null,             -- responsible | accountable | consulted | informed
  assignee_kind assignee_kind not null,
  person_id     uuid references persons(id),
  office_id     uuid references body_offices(id),
  membership_id uuid references memberships(id),
  gov_contact_id uuid references gov_contacts(id),
  agency_label  text,
  free_label    text,
  created_at    timestamptz not null default now()
);
create index if not exists raci_parent on raci_assignments(parent_kind, parent_id);

-- ── Overdue view — drives the "raise a challenge" prompt (spec rule 5) ─────────
create or replace view actions_overdue as
  select a.*
  from actions a
  where a.target_due_date is not null
    and a.target_due_date < current_date
    and a.status not in ('completed','cancelled');
