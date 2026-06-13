-- 026: classify financial records to a hierarchy body so they can be filtered by level
-- (Yasana / Tikina / Koro / Soqosoqo / Mataqali). Mirrors the Minutes classification_node_id pattern.
alter table fin_transactions   add column if not exists classification_node_id uuid references scope_nodes(id);
alter table village_assets      add column if not exists classification_node_id uuid references scope_nodes(id);
alter table village_investments add column if not exists classification_node_id uuid references scope_nodes(id);

-- representative body per filterable level + the 5-level ring used to spread the seed
-- ring index order matches the filter order: Province, District, Village, Club, Clan.
-- fin_transactions
update fin_transactions f set classification_node_id = rep.id
from (
  select id, (row_number() over (order by tx_date, id) - 1) % 5 ring
  from fin_transactions
) ord
join (values (0,'provincial_council'),(1,'district'),(2,'village'),(3,'soqosoqo'),(4,'mataqali')) ll(ring, level)
  on ll.ring = ord.ring
join (
  select distinct on (level) level::text level, id from scope_nodes
  where level in ('provincial_council','district','village','soqosoqo','mataqali')
  order by level, label
) rep on rep.level = ll.level
where f.id = ord.id and f.classification_node_id is null;

-- village_assets
update village_assets a set classification_node_id = rep.id
from (
  select id, (row_number() over (order by sort_order, id) - 1) % 5 ring
  from village_assets
) ord
join (values (0,'provincial_council'),(1,'district'),(2,'village'),(3,'soqosoqo'),(4,'mataqali')) ll(ring, level)
  on ll.ring = ord.ring
join (
  select distinct on (level) level::text level, id from scope_nodes
  where level in ('provincial_council','district','village','soqosoqo','mataqali')
  order by level, label
) rep on rep.level = ll.level
where a.id = ord.id and a.classification_node_id is null;

-- village_investments
update village_investments i set classification_node_id = rep.id
from (
  select id, (row_number() over (order by sort_order, id) - 1) % 5 ring
  from village_investments
) ord
join (values (0,'provincial_council'),(1,'district'),(2,'village'),(3,'soqosoqo'),(4,'mataqali')) ll(ring, level)
  on ll.ring = ord.ring
join (
  select distinct on (level) level::text level, id from scope_nodes
  where level in ('provincial_council','district','village','soqosoqo','mataqali')
  order by level, label
) rep on rep.level = ll.level
where i.id = ord.id and i.classification_node_id is null;
