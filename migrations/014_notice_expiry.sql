-- 014: notices get an expiry date; status (Active/Expired) derives from it.
alter table notices add column if not exists expires_at date;

update notices set expires_at = date '2026-06-14' where body like 'Village clean-up%';
update notices set expires_at = date '2026-06-24' where body like 'Bose ni Yasana%';
update notices set expires_at = date '2026-06-10' where body like 'Water supply maintenance%';
update notices set expires_at = date '2026-06-07' where body like 'Mataqali meeting Sunday%';      -- expired
update notices set expires_at = date '2026-07-01' where body like 'Cyclone-season%';
update notices set expires_at = date '2026-06-30' where body like 'Rugby training%';
update notices set expires_at = date '2026-06-11' where body like 'Women''s fellowship%';
update notices set expires_at = date '2026-06-13' where body like 'Car wash fundraiser%';
update notices set expires_at = date '2026-06-15' where body like 'Sewing classes%';
update notices set expires_at = date '2026-06-06' where body like 'Talanoa and grog%';             -- expired
update notices set expires_at = date '2026-06-12' where body like 'Found: one small brown piglet%';
