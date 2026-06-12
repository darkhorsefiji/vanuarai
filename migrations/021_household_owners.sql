-- 021: household owners on the Vuvale composition.
alter table persons add column if not exists is_owner boolean not null default false;

-- owners are the Head + Spouse pair where recorded
update persons set is_owner = true where relationship in ('Head', 'Spouse');

-- Colaitiniyara's couple has no relationship recorded — they are the household owners
update persons set is_owner = true
where vuvale_node_id = (select id from scope_nodes where label = 'Colaitiniyara' and level = 'vuvale')
  and full_name in ('Apaitia Koroidibale', 'Kesaia Koroidibale');
