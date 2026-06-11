-- 017: Trade page — seller produce listings, buyer directory, key contacts.
create table if not exists trade_listings (
  id             uuid primary key default gen_random_uuid(),
  village_id     uuid references villages(id),
  seller         text not null,
  produce        text not null,
  qty_kg         numeric(8,1) not null default 0,
  available_from date,
  available_to   date,
  created_by     uuid references users(id),
  created_at     timestamptz default now()
);
create table if not exists trade_buyers (
  id         uuid primary key default gen_random_uuid(),
  village_id uuid references villages(id),
  name       text not null,
  buys       text,
  location   text,
  mobile     text,
  email      text,
  sort_order int default 0
);
create table if not exists trade_contacts (
  id         uuid primary key default gen_random_uuid(),
  village_id uuid references villages(id),
  category   text not null,        -- Carrier | Bus | Boat | Hostel | Venue | School
  name       text not null,
  detail     text,
  mobile     text,
  location   text,
  sort_order int default 0
);

insert into trade_listings (village_id, seller, produce, qty_kg, available_from, available_to)
select vlg.id, x.* from villages vlg, (values
  ('Semi Rabuka','Tavioka',120.0,date '2026-06-14',date '2026-06-20'),
  ('Mereani Tuwai','Dalo',80.0,date '2026-06-13',date '2026-06-18'),
  ('Asenaca Bola','Fish',25.0,date '2026-06-13',null),
  ('Pita Vuki','Kumala',60.0,date '2026-06-16',date '2026-06-22'),
  ('Litia Saukuru','Rourou',12.0,date '2026-06-12',date '2026-06-14'),
  ('Joeli Naidu','Duruka',30.0,date '2026-06-15',null),
  ('Wati Tora','Bele',15.0,date '2026-06-12',date '2026-06-19')
) as x(seller,produce,qty_kg,available_from,available_to)
where vlg.name='Bagasau' and not exists (select 1 from trade_listings);

insert into trade_buyers (village_id, name, buys, location, mobile, email, sort_order)
select vlg.id, x.* from villages vlg, (values
  ('Savusavu Market Vendors','Root crops, leafy greens','Savusavu','+679 927 1101','vendors@savusavumarket.fj',1),
  ('Vika Wati — Suva Market Agent','Dalo, Tavioka (bulk)','Suva','+679 928 2202','vika.agent@gmail.com',2),
  ('Coral Coast Resorts F&B','Fish, vegetables, fruit','Korolevu','+679 929 3303','procurement@ccresorts.fj',3),
  ('FRIEND Fiji Processing','Duruka, Bele, chillies','Lautoka','+679 926 4404','supply@friendfiji.com',4),
  ('Waisali Eco Lodge','Fish, Rourou, fruit','Wailevu','+679 925 5505','kitchen@waisali.fj',5)
) as x(name,buys,location,mobile,email,sort_order)
where vlg.name='Bagasau' and not exists (select 1 from trade_buyers);

insert into trade_contacts (village_id, category, name, detail, mobile, location, sort_order)
select vlg.id, x.* from villages vlg, (values
  ('Carrier','Waqa''s Carrier','Wailevu–Savusavu run, Mon/Wed/Fri mornings; market deliveries','+679 921 1110','Wailevu',1),
  ('Carrier','Tui''s 3-Tonne','Charter trips, produce + building materials','+679 921 2220','Bagasau',2),
  ('Bus','Vunika Transport','Daily 6:15am + 1:30pm to Savusavu via Wailevu junction','+679 922 3330','Savusavu',3),
  ('Boat','MV Rogovoka','Weekly cargo/passenger run to Taveuni (Thursdays)','+679 923 4440','Natuvu Landing',4),
  ('Boat','Bagasau Punt Charter','Fiberglass punt with outboard — fishing & transfers','+679 923 5550','Bagasau',5),
  ('Hostel','Bagasau Community Hostel','12 beds; visiting teams & workshop groups','+679 924 6660','Bagasau',6),
  ('Venue','Village Hall','Functions, workshops, fundraisers — book via Vunivola','+679 924 7770','Bagasau',7),
  ('School','Bagasau Primary School','Head Teacher''s office','+679 925 8880','Bagasau',8),
  ('School','Wailevu District Secondary','Principal''s office; boarding enquiries','+679 925 9990','Wailevu',9)
) as x(category,name,detail,mobile,location,sort_order)
where vlg.name='Bagasau' and not exists (select 1 from trade_contacts);
