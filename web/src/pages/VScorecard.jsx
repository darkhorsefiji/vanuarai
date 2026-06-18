import { useLevels } from '../levels'

// ───────────────────────────────────────────────────────────────────────────
// VScorecard — "Meda Matata Mada": Cakaudrove's child-centric, trickle-up
// Balanced Scorecard. A proposed strategic framework (defined in code for now,
// for discussion) — not yet wired to live data. The data-driven roll-up lives
// separately under Vanua › Scorecard.
// ───────────────────────────────────────────────────────────────────────────

// Strategy-map perspectives, ordered BOTTOM → TOP so the board reads as the
// "trickle up" causal chain: a strong family is the root; wealth is the fruit.
const PERSPECTIVES = [
  {
    key: 'wealth', tier: 'Financial', accent: 'var(--clay)',
    title: 'Wealth Creation',
    objective: 'Rising family income and a growing Gross Village Product (GVP).',
    kpis: [
      'Gross Village Product (GVP) — headline indicator',
      'Average family income',
      'Co-operative revenue (FJD captured of the 42.7M target)',
      'Reinvestment into the Trust / child-welfare fund',
      'Member savings & co-operative shares',
    ],
  },
  {
    key: 'vanua', tier: 'Stakeholder / Community', accent: 'var(--pop)',
    title: 'Vanua & Nation',
    objective: 'Import substitution delivered; dependency replaced by abundance.',
    kpis: [
      'Share of the 10%-in-10-years target captured',
      'Volume supplied to the Co-operative / miller',
      "Children's welfare outcomes (the Trust's mandate)",
      'Government collaboration outputs (Provincial Office, TAB)',
      'Wellbeing & reduced-dependency index',
    ],
  },
  {
    key: 'process', tier: 'Internal Process', accent: 'var(--sea)',
    title: 'Productive Capability',
    objective: 'Every family and clan excels in its chosen focus commodities.',
    kpis: [
      'Households cultivating a target commodity',
      'Land area under target crops (ha)',
      'Production volume per commodity',
      'Members trained (agronomy, food processing)',
      "Conformance to the Trust's quality standards",
    ],
  },
  {
    key: 'family', tier: 'Foundation · Learning & Growth', accent: 'var(--sage)',
    title: 'The Strengthened Family',
    objective: 'A cohesive, child-centric family — the root of all growth.',
    kpis: [
      'Parental obligations fulfilled',
      'Academic achievement by child',
      'Religious instruction by child (Lotu)',
      'Agricultural achievement by child',
      'Fishing achievement by child',
      'Financial stewardship taught to child',
      'Family cohesion — weekly soli & family devotion',
    ],
  },
]

// 10% in 10 years — import-substitution target list (FJD millions).
const COMMODITIES = [
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
const TOT_IMP = COMMODITIES.reduce((s, c) => s + c.imp, 0)
const TOT_TGT = TOT_IMP * 0.1

// Action-plan cascade, foundation-first (Vuvale → Vanua). The figures roll UP:
// every level's result is the sum of those below it — that is the trickle up.
const CASCADE = [
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

const fjm = v => '$' + v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M'

export default function VScorecard() {
  const { map } = useLevels()
  const lv = k => map[k] || {}

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>VScorecard</h1>
          <p className="sub">Meda Matata Mada — Cakaudrove’s child-centric, trickle-up Balanced Scorecard. A proposed framework for discussion.</p>
        </div>
      </div>

      {/* Vision + strategy */}
      <div className="card vsc-vision">
        <div className="vsc-vision-main">
          <span className="vsc-eyebrow">Our objective</span>
          <h2>Peace and prosperity prevails across Cakaudrove.</h2>
          <p className="vsc-strategy">
            Strategy: <b>Child-Centric</b>. We replace the spirit of lack and dependency by working our way
            toward abundance — growing the economy from the grassroots up. A strengthened family is the
            foundation; the family enables the trickle-up economy.
          </p>
        </div>
        <div className="vsc-pillars">
          {['Vuvale', 'Vanua', 'Lotu', 'Matanitu'].map(p => <span key={p} className="vsc-pillar">{p}</span>)}
        </div>
      </div>

      {/* Two delivery engines */}
      <h3>Two engines</h3>
      <div className="vsc-engines">
        <div className="card vsc-engine">
          <h4>The Co-operative <span className="meta">· VCDCL</span></h4>
          <p>Supports <b>family income</b>. Runs the <b>10% in 10 years</b> import-substitution campaign, aggregates produce, and links growers to market (e.g. the Kumala flour miller).</p>
        </div>
        <div className="card vsc-engine">
          <h4>The Trust</h4>
          <p>Supports <b>raising the child</b>. Holds the standards, norms, plans and dashboard — the monitoring &amp; evaluation platform — and records the welfare of our children.</p>
        </div>
      </div>

      {/* Strategy map — read bottom-up */}
      <h3>Strategy map · the trickle-up chain</h3>
      <p className="sub">Read from the bottom up: a strong family drives productive capability, which delivers import substitution, which builds wealth.</p>
      <div className="vsc-map">
        <div className="vsc-rail"><span>Trickle&nbsp;Up</span></div>
        <div className="vsc-bands">
          {PERSPECTIVES.map(p => (
            <div className="card vsc-band" key={p.key} style={{ '--accent': p.accent }}>
              <div className="vsc-band-head">
                <span className="vsc-tier">{p.tier}</span>
                <h4>{p.title}</h4>
                <p className="vsc-obj">{p.objective}</p>
              </div>
              <ul className="vsc-kpis">
                {p.kpis.map(k => <li key={k}>{k}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 10% in 10 years */}
      <h3>10% in 10 years · import-substitution targets</h3>
      <p className="sub">Grow locally 10% of Fiji’s imports that can be grown here — over ten years.</p>
      <div className="card vsc-tablewrap">
        <table className="vsc-table">
          <thead>
            <tr><th>#</th><th>Product category</th><th className="num">Annual import</th><th className="num">10% target</th><th>Basis</th></tr>
          </thead>
          <tbody>
            {COMMODITIES.map(c => (
              <tr key={c.rank}>
                <td className="meta">{c.rank}</td>
                <td><b>{c.product}</b></td>
                <td className="num">{fjm(c.imp)}</td>
                <td className="num vsc-tgt">{fjm(c.imp * 0.1)}</td>
                <td className="meta">{c.note}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td></td><td><b>Total</b></td><td className="num"><b>{fjm(TOT_IMP)}</b></td><td className="num vsc-tgt"><b>{fjm(TOT_TGT)}</b></td><td className="meta">per year, at full ramp</td></tr>
          </tfoot>
        </table>
      </div>

      {/* Cascade of action plans */}
      <h3>Action plans · cascaded Vuvale → Vanua</h3>
      <p className="sub">Each level’s results roll up into the one above it — accountability rises with the Turaga ni Yavusa.</p>
      <div className="vsc-cascade">
        {CASCADE.map((c, i) => {
          const s = lv(c.level)
          return (
            <div className="card vsc-step" key={c.level} style={{ '--accent': s.color || 'var(--ocean)' }}>
              <div className="vsc-step-head">
                <span className="vsc-level">{s.label || c.level}{s.label_en ? <em> · {s.label_en}</em> : null}</span>
                {i < CASCADE.length - 1 && <span className="vsc-up" title="rolls up to the next level">↑</span>}
              </div>
              <div className="vsc-role">{c.role}</div>
              <ul className="vsc-actions">
                {c.actions.map(a => <li key={a}>{a}</li>)}
              </ul>
            </div>
          )
        })}
      </div>
    </>
  )
}
