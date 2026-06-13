-- 029: remove the literal "FJD " from displayed seed content — currency is implied
-- app-wide (amounts show as bare numbers). Targeted so only affected rows change.
update notices     set body    = replace(body,    'FJD ', '') where body    like '%FJD %';
update resolutions set summary = replace(summary, 'FJD ', '') where summary like '%FJD %';
