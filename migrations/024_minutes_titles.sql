-- 024: minutes titles follow "<year> Q<q> <Level> <Body> Bose"
-- (level word omitted when the body label already starts with it).
update minutes m set title =
  extract(year from m.meeting_date) || ' Q' || extract(quarter from m.meeting_date) || ' ' ||
  case when sn.label ilike ls.label || '%' then sn.label
       else ls.label || ' ' || sn.label end || ' Bose'
from scope_nodes sn
join level_styles ls on ls.level = sn.level::text
where sn.id = m.classification_node_id and m.meeting_date is not null;
