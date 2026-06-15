-- 032: maker-checker attribution on financial transactions. Each references the
-- initiator's and approver's body_office (→ person, role/office, and entity axis),
-- plus the initiated/approved timestamps. Seeded by 033 (node script).
alter table fin_transactions add column if not exists initiator_office_id uuid references body_offices(id);
alter table fin_transactions add column if not exists approver_office_id  uuid references body_offices(id);
alter table fin_transactions add column if not exists initiated_at timestamptz;
alter table fin_transactions add column if not exists approved_at  timestamptz;
