-- 028: contributor display name + spread dates so the contributions detail list
-- (date, name, lineage body, amount) has real-looking data. on-behalf-of giving (Q19)
-- means a display name is recorded independent of any member link.
alter table ledger_entries add column if not exists contributor_name text;

with ins as (
  select id, row_number() over (order by created_at, id) - 1 rn
  from ledger_entries where direction='in'
)
update ledger_entries le set
  contributor_name = (array[
    'Apaitia Koroidibale','Vasiti Delai','Sefanaia Ravia','Manasa Naivalu',
    'Litia Saukuru','Joeli Naidu','Wati Tora','Mereani Tuwai','Pita Vuki',
    'Asenaca Bola','Inoke Delai','Salote Naivalu'
  ])[(ins.rn % 12) + 1],
  created_at = (timestamp '2026-06-08 09:00' - (ins.rn * 5 || ' days')::interval)
from ins
where le.id = ins.id and le.direction = 'in';
