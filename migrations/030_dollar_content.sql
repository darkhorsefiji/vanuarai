-- 030: add the $ symbol to the dollar amounts in displayed seed content
-- (matches the app-wide "$" convention). Targeted + guarded so edits aren't clobbered.
update notices     set body    = replace(body,    '10 per car', '$10 per car')
  where body like '%10 per car%' and body not like '%$10 per car%';
update resolutions set summary = replace(summary, 'contribution to 5.', 'contribution to $5.')
  where summary like '%contribution to 5.%' and summary not like '%$5.%';
