-- 009: pill labels show the Fijian word only; English equivalent is rendered
-- outside the pill (see tree.jsx LEVEL_EN). Supersedes 008's bracketed labels.
update level_styles set label = 'Yasana'   where level = 'provincial_council';
update level_styles set label = 'Tikina'   where level = 'district';
update level_styles set label = 'Koro'     where level = 'village';
update level_styles set label = 'Soqosoqo' where level = 'soqosoqo';
