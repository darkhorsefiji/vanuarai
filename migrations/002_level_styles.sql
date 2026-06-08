-- 002_level_styles: editable styling (colour + label) per hierarchy level.
create table if not exists level_styles (
  level       text primary key,
  label       text not null,
  color       text not null,        -- hex
  sort_order  int  not null default 0
);

insert into level_styles(level,label,color,sort_order) values
  ('vanua','Vanua','#27545c',1),
  ('yavusa','Yavusa','#6f8fb0',2),
  ('mataqali','Mataqali','#3a8f9c',3),
  ('tokatoka','Tokatoka','#7fae93',4),
  ('vuvale','Vuvale','#cf9a86',5),
  ('provincial_council','Provincial Council','#27545c',6),
  ('district','District','#4f93a0',7),
  ('village','Village','#5b9bb0',8),
  ('soqosoqo','Soqosoqo','#c98a9a',9)
on conflict (level) do nothing;
