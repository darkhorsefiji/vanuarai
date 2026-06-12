-- 023: Matanitu (Government) level above Province in the Government tree.
insert into level_styles(level, label, label_en, color, sort_order)
select 'matanitu', 'Matanitu', 'Government', '#1f3a52',
  coalesce((select sort_order from level_styles where level = 'provincial_council'), 6)
where not exists (select 1 from level_styles where level = 'matanitu');

-- keep the editor list ordered: shift the levels below Matanitu down one slot
update level_styles set sort_order = sort_order + 1
where level in ('provincial_council', 'district', 'village', 'soqosoqo')
  and (select sort_order from level_styles where level = 'matanitu')
      = (select sort_order from level_styles where level = 'provincial_council');

-- the root node, with the Province re-parented under it
insert into scope_nodes(axis, level, label, parent_id, village_id, is_body)
select 'government', 'matanitu', 'Fiji', null, null, false
where not exists (select 1 from scope_nodes where level = 'matanitu');

update scope_nodes set parent_id = (select id from scope_nodes where level = 'matanitu' limit 1)
where level = 'provincial_council' and parent_id is null;
