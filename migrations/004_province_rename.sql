-- 004: rename "Provincial Council" -> "Province" in labels.
update scope_nodes set label = 'Province (TBD)' where level = 'provincial_council';
update level_styles set label = 'Province' where level = 'provincial_council';
