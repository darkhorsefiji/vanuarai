-- 027: re-distribute classified financial records across ALL specific bodies
-- (not one representative per level) so the per-body drill-down (each Mataqali,
-- each Soqosoqo) has data. Round-robins each table over the 10 filterable bodies.
update fin_transactions f set classification_node_id = b.id
from (
  select id, (row_number() over (order by tx_date, id) - 1) rn from fin_transactions
) ord
join (
  select id, (row_number() over (order by
    case level when 'provincial_council' then 1 when 'district' then 2 when 'village' then 3
               when 'soqosoqo' then 4 when 'mataqali' then 5 end, label) - 1) bn
  from scope_nodes where level in ('provincial_council','district','village','soqosoqo','mataqali')
) b on b.bn = ord.rn % (select count(*) from scope_nodes where level in ('provincial_council','district','village','soqosoqo','mataqali'))
where f.id = ord.id;

update village_assets a set classification_node_id = b.id
from (
  select id, (row_number() over (order by sort_order, id) - 1) rn from village_assets
) ord
join (
  select id, (row_number() over (order by
    case level when 'provincial_council' then 1 when 'district' then 2 when 'village' then 3
               when 'soqosoqo' then 4 when 'mataqali' then 5 end, label) - 1) bn
  from scope_nodes where level in ('provincial_council','district','village','soqosoqo','mataqali')
) b on b.bn = ord.rn % (select count(*) from scope_nodes where level in ('provincial_council','district','village','soqosoqo','mataqali'))
where a.id = ord.id;

update village_investments i set classification_node_id = b.id
from (
  select id, (row_number() over (order by sort_order, id) - 1) rn from village_investments
) ord
join (
  select id, (row_number() over (order by
    case level when 'provincial_council' then 1 when 'district' then 2 when 'village' then 3
               when 'soqosoqo' then 4 when 'mataqali' then 5 end, label) - 1) bn
  from scope_nodes where level in ('provincial_council','district','village','soqosoqo','mataqali')
) b on b.bn = ord.rn % (select count(*) from scope_nodes where level in ('provincial_council','district','village','soqosoqo','mataqali'))
where i.id = ord.id;
