// ───────────────────────────────────────────────────────────────────────────
// Meda Matata Mada — Cakaudrove's child-centric, trickle-up strategy model.
// Single source of truth: VScorecard renders it by BSC perspective; the
// Government view re-groups the SAME KPIs by TAB Platform (the "tag & roll up"
// mapping). Each KPI carries `p` = the TAB Platform (1–5) it maps to.
// Defined in code for now (a proposal for discussion) — not yet live data.
// ───────────────────────────────────────────────────────────────────────────

// Strategy-map perspectives, ordered BOTTOM → TOP so the board reads as the
// "trickle up" causal chain: a strong family is the root; wealth is the fruit.
export const PERSPECTIVES = [
  {
    key: 'wealth', tier: 'Financial', accent: 'var(--clay)',
    title: 'Wealth Creation',
    objective: 'Rising family income and a growing Gross Village Product (GVP).',
    kpis: [
      { t: 'Gross Village Product (GVP) — headline indicator', p: 3, u: 'FJD' },
      { t: 'Average family income', p: 3, u: 'FJD', r: 'avg' },
      { t: 'Co-operative revenue (FJD captured of the 42.7M target)', p: 3, u: 'FJD' },
      { t: 'Reinvestment into the Trust / child-welfare fund', p: 5, u: 'FJD' },
      { t: 'Member savings & co-operative shares', p: 3, u: 'FJD' },
    ],
  },
  {
    key: 'vanua', tier: 'Stakeholder / Community', accent: 'var(--pop)',
    title: 'Vanua & Nation',
    objective: 'Import substitution delivered; dependency replaced by abundance.',
    kpis: [
      { t: 'Share of the 10%-in-10-years target captured', p: 3, u: 'FJD' },
      { t: 'Volume supplied to the Co-operative / miller', p: 3, u: 'kg' },
      { t: "Children's welfare outcomes (the Trust's mandate)", p: 2, u: 'index', r: 'avg' },
      { t: 'Government collaboration outputs (Provincial Office, TAB)', p: 5, u: 'count' },
      { t: 'Households with a disaster-preparedness plan', p: 4, u: 'households' },
      { t: 'Wellbeing & reduced-dependency index', p: 2, u: 'index', r: 'avg' },
    ],
  },
  {
    key: 'process', tier: 'Internal Process', accent: 'var(--sea)',
    title: 'Productive Capability',
    objective: 'Every family and clan excels in its chosen focus commodities.',
    kpis: [
      { t: 'Households cultivating a target commodity', p: 3, u: 'households' },
      { t: 'Land area under target crops (ha)', p: 4, u: 'ha' },
      { t: 'Land under climate-resilient planting (ha)', p: 4, u: 'ha' },
      { t: 'Sustainable marine & forest harvest practices adopted', p: 4, u: 'practices' },
      { t: 'Production volume per commodity', p: 3, u: 'kg' },
      { t: 'Members trained (agronomy, food processing)', p: 3, u: 'people' },
      { t: "Conformance to the Trust's quality standards", p: 1, u: '%', r: 'avg' },
    ],
  },
  {
    key: 'family', tier: 'Foundation · Learning & Growth', accent: 'var(--sage)',
    title: 'The Strengthened Family',
    objective: 'A cohesive, child-centric family — the root of all growth.',
    kpis: [
      { t: 'Parental obligations fulfilled', p: 1, u: 'families' },
      { t: 'Academic achievement by child', p: 2, u: 'children' },
      { t: 'Religious instruction by child (Lotu)', p: 2, u: 'children' },
      { t: 'Agricultural achievement by child', p: 2, u: 'children' },
      { t: 'Fishing achievement by child', p: 2, u: 'children' },
      { t: 'Financial stewardship taught to child', p: 2, u: 'children' },
      { t: 'Family cohesion — weekly soli & family devotion', p: 2, u: 'people' },
    ],
  },
]

// Flat list of the framework KPIs — used to seed the live catalogue (registry)
// so all of them become enterable. perspective/name/unit/rollup/tier shape
// matches POST /api/scorecard/kpis.
export const FRAMEWORK_KPIS = PERSPECTIVES.flatMap(persp =>
  persp.kpis.map(k => ({ perspective: persp.title, name: k.t, unit: k.u || null, rollup: k.r || 'sum', tier: 'core', platform: k.p })))

// The five TAB Platforms (from the National Development Plan), each feeding one
// of the two government strategic thrusts. Names per the TAB framework diagram.
export const PLATFORMS = [
  { n: 1, name: 'Good Governance of iTaukei', thrust: 'inclusive' },
  { n: 2, name: 'Wellbeing of iTaukei', thrust: 'inclusive' },
  { n: 3, name: 'Economic Empowerment', thrust: 'transformational' },
  { n: 4, name: 'Conservation of Natural Resources & Climate Change Adaptation', thrust: 'transformational' },
  { n: 5, name: 'Leadership & Vanua Empowerment', thrust: 'inclusive' },
]

// Government Strategic Priorities, grouped under their two thrusts (as drawn in
// the TAB framework diagram).
export const THRUSTS = [
  {
    key: 'inclusive', name: 'Inclusive Socio-Economic Development',
    priorities: [
      'Women in Development',
      'Youth & Sports Development',
      'Promoting Social Inclusion Empowerment',
      'Culture & Heritage',
      'Water & Sanitation',
    ],
  },
  {
    key: 'transformational', name: 'Transformational Thrust',
    priorities: [
      'Micro, Small & Microfinance Enterprise',
      'Promoting equal opportunities, access to basic services & resilient communities',
      'Sustainable management & development of forestry resources',
      'Sustainably managed fisheries resources',
    ],
  },
]

// All KPIs tagged to a given TAB Platform, each carrying its source perspective
// (title + accent) so the Government view can colour-key them back to VScorecard.
export function kpisForPlatform(n) {
  const out = []
  for (const persp of PERSPECTIVES)
    for (const k of persp.kpis)
      if (k.p === n) out.push({ t: k.t, perspective: persp.title, accent: persp.accent })
  return out
}

// 10% in 10 years — import-substitution target list (FJD millions).
export const COMMODITIES = [
  { rank: 1, product: 'Wheat flour & baked goods', imp: 145.0, note: 'Wheat flour, bread, biscuits, pasta' },
  { rank: 2, product: 'Coconut oil & milk (lolo)', imp: 92.0, note: 'Vegetable oils + canned coconut' },
  { rank: 3, product: 'Coffee', imp: 18.5, note: 'Roasted, instant & ground' },
  { rank: 4, product: 'Cocoa & chocolate', imp: 12.8, note: 'Cocoa powder, chocolate, confectionery' },
  { rank: 5, product: 'Kava (Yaqona)', imp: 9.4, note: 'Mainly lower-grade imported kava' },
  { rank: 6, product: 'Cassava flour & starch', imp: 27.0, note: 'Starches, tapioca & flour substitutes' },
  { rank: 7, product: 'Ginger & turmeric', imp: 6.2, note: 'Dried spices & fresh rhizomes' },
  { rank: 8, product: 'Tropical fruit purees & juices', imp: 48.0, note: 'Juices, concentrates & purees' },
  { rank: 9, product: 'Vanilla', imp: 3.1, note: 'Cured beans & extracts' },
  { rank: 10, product: 'Root-crop snacks & chips', imp: 65.0, note: 'Potato chips, extruded snacks & crisps' },
]
export const TOT_IMP = COMMODITIES.reduce((s, c) => s + c.imp, 0)
export const TOT_TGT = TOT_IMP * 0.1

// Action-plan cascade, foundation-first (Vuvale → Vanua). Figures roll UP: every
// level's result is the sum of those below it — that is the trickle up.
export const CASCADE = [
  {
    level: 'vuvale', role: 'The production cell & nursery of character',
    actions: [
      'Adopt 1–2 focus commodities; keep a home plot productive',
      'Nurture each child across the six achievement domains; log parental obligations',
      'Keep the weekly soli and family devotion (Lotu)',
      'Record produce & income in Rai Vanua',
    ],
  },
  {
    level: 'tokatoka', role: 'Mutual support & mentoring',
    actions: [
      'Pool labour, tools and seedlings; share best practice',
      'Mentor young families; recognise children’s achievements',
      'Aggregate household produce for collection',
    ],
  },
  {
    level: 'mataqali', role: 'Land & coordination',
    actions: [
      'Allocate clan land to target commodities; agree the planting calendar',
      'Run communal / demonstration plots',
      'Uphold the Trust’s quality standards; consolidate volumes',
    ],
  },
  {
    level: 'yavusa', role: 'Accountability & delivery — the Turaga ni Yavusa',
    actions: [
      'Turaga ni Yavusa is responsible & accountable for outcomes',
      'Set yavusa commodity targets; consolidate Gross Village Product',
      'Liaise with the VCDCL Co-operative and the Kumala miller',
      'Resolve bottlenecks; report to the Vanua',
    ],
  },
  {
    level: 'vanua', role: 'Strategy, platforms & partnerships — Cakaudrove',
    actions: [
      'Own Meda Matata Mada; set the 10%-in-10-years and GVP goals',
      'Operate the Co-operative (income) and the Trust (the child)',
      'Collaborate with Government via the Provincial Office; secure endorsement (Tui Cakau, GCC) and funding',
      'Monitor & evaluate via Rai Vanua; report GVP as a share of GDP',
    ],
  },
]

export const fjm = v => '$' + v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M'
