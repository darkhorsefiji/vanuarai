-- 007: Soqosoqo shown in the Government view.
-- Match the women's soqosoqo to the preferred label, and add Mataveitokani.
update scope_nodes set label = 'Soqosoqo vaka Marama'
where axis = 'soqosoqo' and label = 'Soqosoqo Vakamarama (Women)';

insert into scope_nodes(axis, level, label, parent_id, village_id, is_body)
select 'soqosoqo', 'soqosoqo', 'Soqosoqo Mataveitokani', vlg.village_node_id, vlg.id, true
from villages vlg
where vlg.name = 'Bagasau'
  and not exists (select 1 from scope_nodes where axis = 'soqosoqo' and label = 'Soqosoqo Mataveitokani');
