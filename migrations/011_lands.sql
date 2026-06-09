-- 011: Lands — request pipeline + allocation register.
create table if not exists land_requests (
  id              uuid primary key default gen_random_uuid(),
  village_id      uuid references villages(id),
  requester       text,
  purpose         text,
  size            text,
  est_rent_cents  int default 0,
  status          text default 'Pending',   -- Pending | Voting | Approved | Declined
  votes_for       int default 0,
  voters_eligible int default 0,            -- VKB-registered Mataqali members 18+
  sort_order      int default 0,
  created_at      timestamptz default now()
);

create table if not exists land_allocations (
  id               uuid primary key default gen_random_uuid(),
  village_id       uuid references villages(id),
  leasee           text,
  purpose          text,
  term             text,
  expiry           date,
  lease_mgt        text,                    -- 'Village' | 'iTLTB'
  premium_cents    int default 0,
  rent_year_cents  int default 0,
  sort_order       int default 0,
  created_at       timestamptz default now()
);

insert into land_requests (village_id, requester, purpose, size, est_rent_cents, status, votes_for, voters_eligible, sort_order)
select vlg.id, x.* from villages vlg, (values
  ('Semi Rabuka','Residential lease (new home)','800 m²',45000,'Voting',18,40,1),
  ('Wati Tora','Market garden plot','1.2 ha',30000,'Approved',32,40,2),
  ('Pita Vuki','Shop / canteen site','400 m²',120000,'Voting',9,40,3),
  ('Asenaca Bola','Aquaculture pond extension','0.5 ha',60000,'Pending',0,40,4),
  ('Joeli Naidu','Church meeting hall','600 m²',0,'Approved',38,40,5),
  ('Litia Saukuru','Homestead lease','700 m²',40000,'Declined',12,40,6)
) as x(requester,purpose,size,est_rent_cents,status,votes_for,voters_eligible,sort_order)
where vlg.name='Bagasau' and not exists (select 1 from land_requests);

insert into land_allocations (village_id, leasee, purpose, term, expiry, lease_mgt, premium_cents, rent_year_cents, sort_order)
select vlg.id, x.* from villages vlg, (values
  ('Sera Vakacegu','Residential','99 yrs',date '2087-06-30','iTLTB',250000,48000,1),
  ('Tomasi Drau','Agricultural (dalo)','30 yrs',date '2049-12-31','iTLTB',80000,32000,2),
  ('Bagasau Co-op','Retail (village shop)','21 yrs',date '2041-03-15','Village',0,150000,3),
  ('Mereoni Lewa','Residential','75 yrs',date '2071-09-01','iTLTB',180000,45000,4),
  ('Ratu Apisai','Homestead','50 yrs',date '2058-05-20','Village',0,25000,5),
  ('Northern Aqua Ltd','Aquaculture','25 yrs',date '2046-08-10','iTLTB',300000,110000,6),
  ('Wesley Church','Religious (community)','99 yrs',date '2095-01-01','Village',0,0,7)
) as x(leasee,purpose,term,expiry,lease_mgt,premium_cents,rent_year_cents,sort_order)
where vlg.name='Bagasau' and not exists (select 1 from land_allocations);
