-- 012: Financials tabs — transactions, asset register, investments.
create table if not exists fin_transactions (
  id           uuid primary key default gen_random_uuid(),
  village_id   uuid references villages(id),
  tx_date      date,
  description  text,
  fund         text,
  type         text,                 -- 'In' | 'Out'
  method       text,                 -- M-PAiSA | MyCash | Cash | Bank | Card
  amount_cents int default 0,
  created_at   timestamptz default now()
);
create table if not exists village_assets (
  id           uuid primary key default gen_random_uuid(),
  village_id   uuid references villages(id),
  name         text,
  category     text,
  acquired     date,
  value_cents  int default 0,
  condition    text,
  custodian    text,
  sort_order   int default 0
);
create table if not exists village_investments (
  id                 uuid primary key default gen_random_uuid(),
  village_id         uuid references villages(id),
  name               text,
  type               text,
  amount_cents       int default 0,
  current_value_cents int default 0,
  return_pct         numeric(5,1),
  notes              text,
  sort_order         int default 0
);

insert into fin_transactions (village_id, tx_date, description, fund, type, method, amount_cents)
select vlg.id, x.* from villages vlg, (values
  (date '2026-06-01','Village hall electricity','Operations','Out','Bank',6400),
  (date '2026-05-28','Youth rugby registration','Youth Rugby Gear','In','M-PAiSA',9000),
  (date '2026-05-24','Water pump repair','Water Supply','Out','Cash',12500),
  (date '2026-05-21','iTLTB lease distribution','Lease Income','In','Bank',78000),
  (date '2026-05-18','Sewing machines (3)','Women''s Sewing Centre','Out','Card',39000),
  (date '2026-05-15','Soli — church fundraiser','Church Restoration','In','Cash',56000),
  (date '2026-05-12','Diesel for generator','Operations','Out','Cash',8500),
  (date '2026-05-08','Mataqali farm produce sales','Farm Access','In','Cash',21000),
  (date '2026-05-05','Seawall materials — cement & rock','Coastal Seawall','Out','Bank',145000),
  (date '2026-05-02','M-PAiSA plan top-ups (April)','Internet','In','M-PAiSA',32000)
) as x(tx_date,description,fund,type,method,amount_cents)
where vlg.name='Bagasau' and not exists (select 1 from fin_transactions);

insert into village_assets (village_id, name, category, acquired, value_cents, condition, custodian, sort_order)
select vlg.id, x.* from villages vlg, (values
  ('Village Hall','Building',date '2009-03-01',18000000,'Good','Village Council',1),
  ('Methodist Church','Building',date '1998-09-12',9000000,'Needs repair','Methodist Church',2),
  ('Community Tractor','Equipment',date '2019-07-15',4500000,'Fair','Mataqali Mataikoro',3),
  ('Generator (20kVA)','Equipment',date '2020-06-20',1500000,'Fair','Village Council',4),
  ('Fibreglass Punt','Vessel',date '2021-02-10',1200000,'Good','Fisheries Group',5),
  ('Water Tanks (x4)','Infrastructure',date '2017-11-05',800000,'Good','Village Council',6),
  ('Sewing Machines (6)','Equipment',date '2026-05-18',78000,'New','Women''s Group',7)
) as x(name,category,acquired,value_cents,condition,custodian,sort_order)
where vlg.name='Bagasau' and not exists (select 1 from village_assets);

insert into village_investments (village_id, name, type, amount_cents, current_value_cents, return_pct, notes, sort_order)
select vlg.id, x.* from villages vlg, (values
  ('Fijian Holdings Unit Trust','Unit Trust',5000000,6200000,6.5,'Quarterly dividends',1),
  ('BSP Term Deposit','Term Deposit',3000000,3180000,3.0,'Matures 2027-03-31',2),
  ('Village Shop (co-op equity)','Enterprise',2000000,2600000,null,'Co-op shares',3),
  ('iTaukei Trust Fund','Trust',1500000,1620000,4.0,'Long-term',4),
  ('Coconut replanting (copra)','Agriculture',1200000,1500000,null,'3-year maturity',5)
) as x(name,type,amount_cents,current_value_cents,return_pct,notes,sort_order)
where vlg.name='Bagasau' and not exists (select 1 from village_investments);
