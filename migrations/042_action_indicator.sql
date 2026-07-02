-- 042: link an action to the specific KPI (indicator) it addresses, alongside
-- its Objective (outcome_id). Both nullable — a manually-created action may not
-- target a single KPI. Lets the Scorecard show "Objective · KPI" on each action.
alter table actions add column if not exists indicator_id uuid references outcome_indicators(id);
create index if not exists actions_indicator on actions(indicator_id);
