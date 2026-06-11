-- 015: resolution status pill + DEV-administered action types for the Action workflow (workflows later).
alter table resolutions add column if not exists status text;

update resolutions set status = case
  when summary ilike 'approved%' or summary ilike 'adopted%' then 'Approved'
  when summary ilike 'deferred%'  then 'Deferred'
  when summary ilike 'rejected%'  then 'Rejected'
  when summary ilike 'withdrawn%' then 'Withdrawn'
  else 'Noted' end
where status is null;

-- demo variety so all pill states are visible
update resolutions set status='Deferred' where ref_label='VR-2025/3';
update resolutions set status='Noted'    where ref_label='VR-2025/4';
update resolutions set status='Rejected' where ref_label='MR-B2-2026/1';

create table if not exists resolution_action_types (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,
  sort_order int not null default 0
);
insert into resolution_action_types(label, sort_order) values
  ('Notification', 1), ('Make Payment', 2), ('Schedule Works', 3), ('Refer to iTLTB', 4), ('Update Register', 5)
on conflict (label) do nothing;
