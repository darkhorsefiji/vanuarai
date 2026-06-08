-- 005: project start/end dates + use uploaded local photos for the Seawall project.
alter table projects add column if not exists start_date date;
alter table projects add column if not exists end_date   date;

-- varied demo timelines (spaced ~41 days apart, ~11 month duration)
with d as (select id, row_number() over (order by name) rn from projects)
update projects p set
  start_date = date '2025-01-15' + ((d.rn - 1) * 41)::int,
  end_date   = date '2025-01-15' + ((d.rn - 1) * 41 + 330)::int
from d where d.id = p.id;

-- Coastal Seawall: replace photos with the uploaded local set (/project-photos/seawall-NN.jpg)
delete from project_photos
where project_id = (select id from projects where name = 'Coastal Seawall');

insert into project_photos(project_id, image_ref, caption)
select (select id from projects where name = 'Coastal Seawall'),
       '/project-photos/seawall-' || lpad(g::text, 2, '0') || '.jpg',
       'Coastal Seawall — photo ' || g
from generate_series(1, 12) g;
