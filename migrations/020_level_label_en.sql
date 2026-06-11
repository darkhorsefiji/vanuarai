-- 020: English equivalents for hierarchy levels live in level_styles (DEV-editable),
-- replacing the hardcoded map; traditional (Vanua) levels gain glosses too.
alter table level_styles add column if not exists label_en text;

update level_styles set label_en = x.en
from (values
  ('vanua', 'Land'),
  ('yavusa', 'Tribe'),
  ('mataqali', 'Clan'),
  ('tokatoka', 'Sub-clan'),
  ('vuvale', 'Family'),
  ('provincial_council', 'Province'),
  ('district', 'District'),
  ('village', 'Village'),
  ('soqosoqo', 'Club')
) as x(level, en)
where level_styles.level = x.level and level_styles.label_en is null;
