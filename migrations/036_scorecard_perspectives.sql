-- 036: align the live scorecard_targets to the Meda Matata Mada (MMM) BSC
-- perspectives, so the data-driven Vanua › Scorecard and the strategic VScorecard
-- share one taxonomy. Re-tags the 9 seeded items by KPI name (node-agnostic).
--   Vanua Wellbeing / Finances / Development / Learning & Culture  →  the MMM four.
update scorecard_targets set perspective = case name
    when 'Members at weekly soli'       then 'The Strengthened Family'
    when 'Children in school'           then 'The Strengthened Family'
    when 'Community events held'        then 'Vanua & Nation'
    when 'Households with piped water'  then 'Vanua & Nation'
    when 'Adults completed training'    then 'Productive Capability'
    when 'Quarterly soli'               then 'Wealth Creation'
    when 'Annual village income'        then 'Wealth Creation'
    else perspective
  end
where archived_at is null;
