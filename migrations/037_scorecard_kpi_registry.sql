-- 037: scorecard KPI registry — make KPIs first-class so each can carry a
-- roll-up rule and a tier, and so measurements reference a catalog rather than
-- free text. Foundation for the live roll-up engine.
--   rollup: how a parent aggregates its children for this KPI
--           'sum'  — additive (counts, FJD, volumes)        [default]
--           'avg'  — mean of contributing nodes (rates/indices)
--           'none' — local only; does not roll past its node (spinoff metrics)
--   tier:   'core'    — Vanua-mandated, rolls up the whole hierarchy [default]
--           'spinoff' — locally authored, lives at its level
create table if not exists scorecard_kpis (
  id           uuid primary key default gen_random_uuid(),
  perspective  text not null,
  name         text not null,
  unit         text,
  rollup       text not null default 'sum',
  tier         text not null default 'core',
  sort_order   int  not null default 0,
  archived_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (perspective, name)
);

-- seed from the KPIs that already have measurements (keep their exact name/unit)
insert into scorecard_kpis (perspective, name, unit)
select distinct perspective, name, unit
from scorecard_targets
where archived_at is null
on conflict (perspective, name) do nothing;

-- link each measurement to its registry KPI
alter table scorecard_targets add column if not exists kpi_id uuid references scorecard_kpis(id);
update scorecard_targets t
set kpi_id = k.id
from scorecard_kpis k
where t.kpi_id is null and t.perspective = k.perspective and t.name = k.name;
