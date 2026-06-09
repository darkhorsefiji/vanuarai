-- 010: Government contact directory shown on the Government page.
create table if not exists gov_contacts (
  id          uuid primary key default gen_random_uuid(),
  village_id  uuid references villages(id),
  title       text not null,          -- card heading / office
  name        text,
  role        text,
  mobile      text,
  office      text,
  email       text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

insert into gov_contacts (village_id, title, name, role, mobile, office, email, sort_order)
select vlg.id, x.title, x.name, x.role, x.mobile, x.office, x.email, x.sort_order
from villages vlg, (values
  ('Provincial Administrator','Inoke Bainivalu','Provincial Administrator - Cakaudrove','+679 990 1123','+679 888 0101','padmin@cakaudrove.gov.fj',1),
  ('District Officer','Litia Vakacegu','District Officer - Tikina','+679 991 2210','+679 888 0145','do@cakaudrove.gov.fj',2),
  ('Agriculture','Apisai Naivalu','Agriculture Officer','+679 992 3344','+679 881 2200','northern@agriculture.gov.fj',3),
  ('Forestry','Joeli Ratu','Divisional Forestry Officer','+679 993 4455','+679 881 3300','northern@forestry.gov.fj',4),
  ('Fisheries','Mereani Tuwai','Fisheries Officer','+679 994 5566','+679 881 4400','northern@fisheries.gov.fj',5),
  ('Tourism','Salote Driu','Tourism Officer','+679 995 6677','+679 881 5500','northern@tourism.gov.fj',6),
  ('Mineral Resources','Viliame Koroi','Mineral Resources Officer','+679 996 7788','+679 881 6600','info@mrd.gov.fj',7)
) as x(title,name,role,mobile,office,email,sort_order)
where vlg.name = 'Bagasau'
  and not exists (select 1 from gov_contacts gc where gc.title = x.title);
