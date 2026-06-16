-- 033: officer assignment history. body_offices becomes an append-only log:
-- started_at / ended_at bound each holder's term; ended_at IS NULL = the current
-- (Active) holder. Reassigning ends the incumbent and inserts a new row.
alter table body_offices add column if not exists started_at timestamptz;
alter table body_offices add column if not exists ended_at   timestamptz;
update body_offices set started_at = created_at where started_at is null;
-- any pre-existing inactive rows are treated as ended terms
update body_offices set ended_at = created_at where active = false and ended_at is null;
