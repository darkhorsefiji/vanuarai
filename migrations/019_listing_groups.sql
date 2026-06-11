-- 019: group multi-produce postings into one card.
alter table trade_listings add column if not exists group_id uuid;
update trade_listings set group_id = id where group_id is null;

-- merge the existing Eugene Singh batch (posted as one supply list) into a single group
update trade_listings
set group_id = (select id from trade_listings where seller='Eugene Singh' and produce='Tavioka' and mobile='9997888' limit 1)
where seller='Eugene Singh' and mobile='9997888';
