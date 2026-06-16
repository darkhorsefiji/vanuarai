-- 034: donor / source attribution for incoming ('In') transactions. The donor may
-- be a village member, the Provincial Council, a District officer, or another entity.
-- The Dau ni yau who logged it stays as the recorder (initiator_office_id).
alter table fin_transactions add column if not exists donor_name   text;
alter table fin_transactions add column if not exists donor_role   text;
alter table fin_transactions add column if not exists donor_entity text;
alter table fin_transactions add column if not exists donor_body   text;

update fin_transactions set donor_name='iTaukei Land Trust Board', donor_role='Lands authority',  donor_entity='Government', donor_body='TLTB (National)'
  where type='In' and description ilike '%lease distribution%';
update fin_transactions set donor_name='Cakaudrove Provincial Council', donor_role='Provincial Council', donor_entity='Government', donor_body='Cakaudrove'
  where type='In' and (description ilike '%church fundraiser%' or description ilike '%Soli%');
update fin_transactions set donor_name='Wailevu District Office', donor_role='District officer', donor_entity='Government', donor_body='Wailevu'
  where type='In' and description ilike '%rugby registration%';
update fin_transactions set donor_name='Apaitia Koroidibale', donor_role='Village member', donor_entity='Vanua', donor_body='Mataikoro'
  where type='In' and description ilike '%farm produce%';
update fin_transactions set donor_name='Bagasau villagers', donor_role='Village members', donor_entity='Vanua', donor_body='Bagasau'
  where type='In' and description ilike '%plan top-ups%';
-- fallback for any other incoming row
update fin_transactions set donor_name='Village members', donor_role='Village members', donor_entity='Vanua', donor_body='Bagasau'
  where type='In' and donor_name is null;
