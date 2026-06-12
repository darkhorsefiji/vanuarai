-- 025: minutes title convention tweak — "<year> Q<q> Bose ni <Level> <Body>".
update minutes m set title =
  extract(year from m.meeting_date) || ' Q' || extract(quarter from m.meeting_date) ||
  ' Bose ni ' ||
  case when sn.label ilike ls.label || '%' then sn.label
       else ls.label || ' ' || sn.label end
from scope_nodes sn
join level_styles ls on ls.level = sn.level::text
where sn.id = m.classification_node_id and m.meeting_date is not null;
