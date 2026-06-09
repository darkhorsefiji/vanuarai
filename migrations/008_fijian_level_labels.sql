-- 008: Fijian level labels (English equivalent in brackets) for the Government / Soqosoqo hierarchy.
update level_styles set label = 'Yasana (Province)' where level = 'provincial_council';
update level_styles set label = 'Tikina (District)' where level = 'district';
update level_styles set label = 'Koro (Village)'    where level = 'village';
update level_styles set label = 'Soqosoqo (Club)'   where level = 'soqosoqo';
