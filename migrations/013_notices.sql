-- 013: Kacikacivaki (announcements) — two channels:
--   'koro'  = Nai Tukutuku in Koro (official: Vanua + Government hierarchies)
--   'lewe'  = Nai Tukutuku in Lewe ni Vanua (any village member)
create table if not exists notices (
  id          uuid primary key default gen_random_uuid(),
  village_id  uuid references villages(id),
  channel     text not null,            -- 'koro' | 'lewe'
  author      text,
  author_role text,                     -- e.g. Turaga ni Koro, District Officer; null for members
  body        text not null,
  posted_at   timestamptz default now(),
  created_by  uuid references users(id)
);
create index if not exists notices_channel_idx on notices(channel, posted_at desc);

insert into notices (village_id, channel, author, author_role, body, posted_at)
select vlg.id, x.* from villages vlg, (values
  ('koro','Inoke Bainivalu','Turaga ni Koro','Village clean-up this Saturday from 7am — all vuvale to send at least one member. The Yasana inspection team visits the following week.',timestamptz '2026-06-09 08:10+12'),
  ('koro','Provincial Office','Yasana Cakaudrove','Bose ni Yasana (Provincial Council meeting) at Somosomo, 24 June. Village submissions due to the District Officer by 18 June.',timestamptz '2026-06-07 14:00+12'),
  ('koro','Village Council','Bagasau Village Council','Water supply maintenance Wednesday — tanks shut 9am to 1pm. Please store water beforehand.',timestamptz '2026-06-05 16:45+12'),
  ('koro','Mataqali Mataikoro','Land-owning unit','Mataqali meeting Sunday after church re the pending land requests — VKB members 18+ please attend to vote.',timestamptz '2026-06-03 09:30+12'),
  ('koro','Litia Vakacegu','District Officer','Cyclone-season preparedness briefing at the village hall, 1 July 10am. Evacuation wardens to attend.',timestamptz '2026-06-01 11:00+12'),
  ('lewe','Semi Rabuka',null,'Rugby training Tuesday and Thursday 5pm on the village green — bring boots if you have them. Under-19s welcome!',timestamptz '2026-06-09 17:20+12'),
  ('lewe','Litia Saukuru',null,'Women''s fellowship prayer meeting Wednesday 7pm at Mere''s house. All welcome.',timestamptz '2026-06-08 19:05+12'),
  ('lewe','Youth Group',null,'Car wash fundraiser this Saturday by the shop — FJD 10 per car, proceeds to the rugby gear fund. Tell your cousins in town!',timestamptz '2026-06-07 10:15+12'),
  ('lewe','Mereani Tuwai',null,'Sewing classes start Monday at the new centre — 12 spots, sign up with me after church.',timestamptz '2026-06-06 13:40+12'),
  ('lewe','Pita Vuki',null,'Talanoa and grog session Friday night at my place to welcome the visitors from Suva. Kerekere bring your own bilo.',timestamptz '2026-06-05 18:55+12'),
  ('lewe','Asenaca Bola',null,'Found: one small brown piglet near the seawall on Tuesday. Describe it and it''s yours.',timestamptz '2026-06-04 07:50+12')
) as x(channel,author,author_role,body,posted_at)
where vlg.name='Bagasau' and not exists (select 1 from notices);
