-- 001_profile: village profile fields + resource/participation ratings.
-- Idempotent-ish: guarded so re-running won't duplicate resource rows.

alter table villages
  add column if not exists introduction      text,
  add column if not exists background        text,
  add column if not exists latitude          numeric(9,6),
  add column if not exists longitude         numeric(9,6),
  add column if not exists how_to_get_there  text;

create table if not exists village_resources (
  id                   uuid primary key default gen_random_uuid(),
  village_id           uuid not null references villages(id),
  sector               text not null,             -- Agriculture, Aquaculture, ...
  resource_score       smallint not null default 0,  -- 0-5 endowment
  participation_score  smallint not null default 0,  -- 0-5 level of participation
  notes                text,
  sort_order           int not null default 0
);

-- Seed Bagasau profile (PLACEHOLDER text/coords — replace with real data).
update villages set
  introduction = 'Bagasau is an iTaukei village set between coastal flats and forested interior. Home to two yavusa and four mataqali, it blends subsistence farming, inshore fishing and a growing interest in small enterprise and village-based tourism.',
  background = 'The village traces its lineage through the Vanua and is administered by the Turaga ni Koro alongside the customary mataqali heads. Land is held by the mataqali and leased in part through the iTaukei Land Trust Board. Households (vuvale) are organised under eight tokatoka across the two yavusa.',
  latitude = -17.800000,
  longitude = 178.200000,
  how_to_get_there = 'From Suva, follow Kings Road approx. 1.5 hours, then turn inland at the district junction onto the gravel feeder road for ~25 minutes. 4WD recommended in the wet season. A village carrier runs on market days (see Key Contacts); boats serve the coastal landing at high tide.'
where name = 'Bagasau';

insert into village_resources(village_id, sector, resource_score, participation_score, notes, sort_order)
select v.id, x.sector, x.r, x.p, x.notes, x.so
from villages v,
 (values
   ('Agriculture', 5, 4, 'Dalo, cassava and yaqona (kava) — the mainstay', 1),
   ('Aquaculture', 3, 2, 'Tilapia ponds at an early stage', 2),
   ('Forestry',    4, 3, 'Native hardwood plus a pine lease', 3),
   ('Fisheries',   4, 3, 'Inshore reef and river fishing', 4),
   ('Tourism',     3, 1, 'Waterfall and village-stay potential, largely untapped', 5),
   ('Commerce',    2, 2, 'Canteens and market-day trade', 6),
   ('Minerals',    2, 0, 'Unsurveyed; not currently exploited', 7),
   ('Bottling',    3, 1, 'Spring-water source identified', 8)
 ) as x(sector, r, p, notes, so)
where v.name = 'Bagasau'
  and not exists (select 1 from village_resources vr where vr.village_id = v.id);
