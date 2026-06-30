-- 038: add the TAB Platform (1–5) to the KPI registry so the live scorecard can
-- be grouped "By TAB Platform" as well as "By Perspective" (one scorecard, two
-- lenses). Framework KPIs get their platform via re-import (carries strategy.js
-- `p`); the legacy seeded KPIs are backfilled here by name.
alter table scorecard_kpis add column if not exists platform int;

update scorecard_kpis set platform = case name
    when 'Members at weekly soli'      then 2
    when 'Children in school'          then 2
    when 'Community events held'       then 2
    when 'Households with piped water' then 2
    when 'Adults completed training'   then 3
    when 'Quarterly soli'              then 3
    when 'Annual village income'       then 3
    else platform
  end
where platform is null;
