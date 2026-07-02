-- 040: Seed the Outcome Framework from the existing Meda Matata Mada strategy
-- (Phase 1b). The strategy content that lived only in strategy.js (a presentation
-- layer) is entered as REAL data in the new scorecard: each (focus area × TAB
-- platform) cluster of the old KPIs becomes one Outcome, its KPIs become that
-- Outcome's indicators. 11 Outcomes cover all 25 framework KPIs. See
-- docs/outcome-framework-spec.md § "Porting the existing framework".
--
-- Idempotent: guarded by "where not exists" on Outcome title / (outcome,indicator).
-- ISIC codes are best-fit and editable via the UI later.

do $$
declare apex uuid;
begin
  -- Author Outcomes at the traditional-axis Vanua apex (D2: authored once, roll up).
  select id into apex from scope_nodes
    where axis = 'traditional' and level = 'vanua'
    order by created_at limit 1;

  -- ── Outcomes ────────────────────────────────────────────────────────────────
  insert into outcomes (node_id, axis, title, description, focus_area_id, gov_pillar_id, isic_code, sort_order)
  select apex, 'traditional', o.title, o.descr, fa.id, gp.id, o.isic, o.ord
  from (values
    ('Rising family income and a growing Gross Village Product',
       'Wealth Creation objective: rising family income and a growing GVP.', 'wealth', 3, 'A', 1),
    ('Reinvestment into the Trust / child-welfare fund',
       'Surplus reinvested into the Trust that raises the child.', 'wealth', 5, 'Q', 2),
    ('Import substitution delivered (10% in 10 years)',
       'Dependency replaced by abundance — the 10%-in-10-years campaign.', 'vanua', 3, 'C', 3),
    ('Children''s welfare and reduced dependency',
       'The Trust''s mandate: children''s welfare and a falling dependency index.', 'vanua', 2, 'Q', 4),
    ('Government collaboration and partnership outputs',
       'Collaboration with Government via the Provincial Office and TAB.', 'vanua', 5, 'O', 5),
    ('Household disaster preparedness',
       'Resilient households with a disaster-preparedness plan.', 'vanua', 4, 'O', 6),
    ('Commodity production and productive capability',
       'Every family and clan excels in its chosen focus commodities.', 'process', 3, 'A', 7),
    ('Climate-resilient land and sustainable harvest',
       'Land and marine/forest resources managed for resilience.', 'process', 4, 'A', 8),
    ('Conformance to the Trust''s quality standards',
       'Produce meets the Trust''s quality standards.', 'process', 1, 'C', 9),
    ('Parental obligations fulfilled',
       'Parents fulfil their obligations — the root of a strong family.', 'family', 1, 'T', 10),
    ('Child development and family cohesion',
       'A cohesive, child-centric family across the six achievement domains.', 'family', 2, 'P', 11)
  ) as o(title, descr, focus_code, pillar_no, isic, ord)
  join outcome_focus_areas fa on fa.code = o.focus_code
  join gov_pillars gp on gp.platform_no = o.pillar_no
  where not exists (select 1 from outcomes x where x.title = o.title);

  -- ── Outcome indicators (the old KPIs, hung under their Outcome) ───────────────
  insert into outcome_indicators (outcome_id, name, unit, rollup, sort_order)
  select oc.id, i.name, i.unit, i.rollup, i.ord
  from (values
    -- 1 · Rising family income & GVP
    ('Rising family income and a growing Gross Village Product', 'Gross Village Product (GVP) — headline indicator', 'FJD', 'sum', 1),
    ('Rising family income and a growing Gross Village Product', 'Average family income', 'FJD', 'avg', 2),
    ('Rising family income and a growing Gross Village Product', 'Co-operative revenue (FJD captured of the 42.7M target)', 'FJD', 'sum', 3),
    ('Rising family income and a growing Gross Village Product', 'Member savings & co-operative shares', 'FJD', 'sum', 4),
    -- 2 · Reinvestment into the Trust
    ('Reinvestment into the Trust / child-welfare fund', 'Reinvestment into the Trust / child-welfare fund', 'FJD', 'sum', 1),
    -- 3 · Import substitution
    ('Import substitution delivered (10% in 10 years)', 'Share of the 10%-in-10-years target captured', 'FJD', 'sum', 1),
    ('Import substitution delivered (10% in 10 years)', 'Volume supplied to the Co-operative / miller', 'kg', 'sum', 2),
    -- 4 · Children's welfare & reduced dependency
    ('Children''s welfare and reduced dependency', 'Children''s welfare outcomes (the Trust''s mandate)', 'index', 'avg', 1),
    ('Children''s welfare and reduced dependency', 'Wellbeing & reduced-dependency index', 'index', 'avg', 2),
    -- 5 · Government collaboration
    ('Government collaboration and partnership outputs', 'Government collaboration outputs (Provincial Office, TAB)', 'count', 'sum', 1),
    -- 6 · Household disaster preparedness
    ('Household disaster preparedness', 'Households with a disaster-preparedness plan', 'households', 'sum', 1),
    -- 7 · Commodity production & capability
    ('Commodity production and productive capability', 'Households cultivating a target commodity', 'households', 'sum', 1),
    ('Commodity production and productive capability', 'Production volume per commodity', 'kg', 'sum', 2),
    ('Commodity production and productive capability', 'Members trained (agronomy, food processing)', 'people', 'sum', 3),
    -- 8 · Climate-resilient land & sustainable harvest
    ('Climate-resilient land and sustainable harvest', 'Land area under target crops (ha)', 'ha', 'sum', 1),
    ('Climate-resilient land and sustainable harvest', 'Land under climate-resilient planting (ha)', 'ha', 'sum', 2),
    ('Climate-resilient land and sustainable harvest', 'Sustainable marine & forest harvest practices adopted', 'practices', 'sum', 3),
    -- 9 · Quality conformance
    ('Conformance to the Trust''s quality standards', 'Conformance to the Trust''s quality standards', '%', 'avg', 1),
    -- 10 · Parental obligations
    ('Parental obligations fulfilled', 'Parental obligations fulfilled', 'families', 'sum', 1),
    -- 11 · Child development & family cohesion
    ('Child development and family cohesion', 'Academic achievement by child', 'children', 'sum', 1),
    ('Child development and family cohesion', 'Religious instruction by child (Lotu)', 'children', 'sum', 2),
    ('Child development and family cohesion', 'Agricultural achievement by child', 'children', 'sum', 3),
    ('Child development and family cohesion', 'Fishing achievement by child', 'children', 'sum', 4),
    ('Child development and family cohesion', 'Financial stewardship taught to child', 'children', 'sum', 5),
    ('Child development and family cohesion', 'Family cohesion — weekly soli & family devotion', 'people', 'sum', 6)
  ) as i(otitle, name, unit, rollup, ord)
  join outcomes oc on oc.title = i.otitle
  where not exists (
    select 1 from outcome_indicators y
    join outcomes oc2 on y.outcome_id = oc2.id
    where oc2.title = i.otitle and y.name = i.name
  );
end $$;
