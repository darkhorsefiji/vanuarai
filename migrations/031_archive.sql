-- 031: soft-delete (archive/void) support. "Deleting" sets archived_at; rows are
-- kept for audit and excluded from every view. Covers nodes, fundraising efforts,
-- contributions, and the three Financials ledgers.
alter table scope_nodes         add column if not exists archived_at timestamptz;
alter table projects            add column if not exists archived_at timestamptz;
alter table ledger_entries      add column if not exists archived_at timestamptz;
alter table fin_transactions    add column if not exists archived_at timestamptz;
alter table village_assets      add column if not exists archived_at timestamptz;
alter table village_investments add column if not exists archived_at timestamptz;
