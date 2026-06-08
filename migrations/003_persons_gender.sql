-- 003: add gender to persons; backfill from seeded first names.
alter table persons add column if not exists gender text;

update persons set gender = case
    when split_part(full_name, ' ', 1) in
      ('Mere','Litia','Asenaca','Salote','Maria','Ana','Vasiti','Kelera') then 'Female'
    else 'Male' end
where gender is null;
