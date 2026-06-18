-- 035: Vanua scorecard — KPI targets grouped by BSC perspective, attached to a
-- hierarchy node. Values roll UP the tree (a node's figure = its own + descendants').
-- Count/amount KPIs so summing is meaningful.
create table if not exists scorecard_targets (
  id            uuid primary key default gen_random_uuid(),
  node_id       uuid not null references scope_nodes(id),
  perspective   text not null,        -- BSC perspective
  name          text not null,        -- KPI
  unit          text,                 -- people | households | children | FJD | events ...
  target_value  numeric(12,1) not null default 0,
  actual_value  numeric(12,1) not null default 0,
  period        text,                 -- e.g. '2026'
  sort_order    int not null default 0,
  archived_at   timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists scorecard_targets_node on scorecard_targets(node_id);

-- seed (Vanua axis). Same KPI name on sibling nodes demonstrates roll-up.
insert into scorecard_targets (node_id, perspective, name, unit, target_value, actual_value, period)
select n.id, s.perspective, s.name, s.unit, s.tgt, s.act, '2026' from (values
  -- Vuvale level (roll up to Navuni)
  ('Colaitiniyara','vuvale','Vanua Wellbeing','Members at weekly soli','people',5,4),
  ('Colaitiniyara','vuvale','Learning & Culture','Children in school','children',3,3),
  ('Dakuitoga','vuvale','Vanua Wellbeing','Members at weekly soli','people',4,2),
  ('Dakuitoga','vuvale','Learning & Culture','Children in school','children',2,2),
  -- Tokatoka
  ('Navuni','tokatoka','Finances','Quarterly soli','FJD',600,450),
  -- Mataqali
  ('Mataikoro','mataqali','Development','Households with piped water','households',8,5),
  ('Mataikoro','mataqali','Learning & Culture','Adults completed training','people',6,3),
  -- Yavusa
  ('Cakaudrove','yavusa','Vanua Wellbeing','Community events held','events',4,2),
  -- Vanua apex (node label is 'Viti')
  ('Viti','vanua','Finances','Annual village income','FJD',50000,28000)
) as s(node_label, node_level, perspective, name, unit, tgt, act)
join scope_nodes n on n.label=s.node_label and n.level=s.node_level::scope_level and n.axis='traditional'
where not exists (select 1 from scorecard_targets);
