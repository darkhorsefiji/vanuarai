-- 041: relate an Action directly to the Outcome it serves (actions.outcome_id),
-- so the scorecard UI can show a card of related interventions beside each
-- Outcome. The finer outcome_measurement_id link (the specific gap) stays as-is.
-- Backfill outcome_id from the measurement link where one exists.
alter table actions add column if not exists outcome_id uuid references outcomes(id);

update actions a set outcome_id = o.id
  from outcome_measurements m
  join outcome_indicators i on i.id = m.indicator_id
  join outcomes o on o.id = i.outcome_id
  where a.outcome_measurement_id = m.id and a.outcome_id is null;

create index if not exists actions_outcome on actions(outcome_id);
