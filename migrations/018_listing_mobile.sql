-- 018: seller mobile contact on trade listings.
alter table trade_listings add column if not exists mobile text;

update trade_listings set mobile = x.mobile
from (values
  ('Semi Rabuka','+679 930 1101'),
  ('Mereani Tuwai','+679 930 2202'),
  ('Asenaca Bola','+679 930 3303'),
  ('Pita Vuki','+679 930 4404'),
  ('Litia Saukuru','+679 930 5505'),
  ('Joeli Naidu','+679 930 6606'),
  ('Wati Tora','+679 930 7707')
) as x(seller, mobile)
where trade_listings.seller = x.seller and trade_listings.mobile is null;
