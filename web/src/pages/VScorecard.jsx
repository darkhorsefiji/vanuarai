import { useLevels } from '../levels'
import { PERSPECTIVES, COMMODITIES, TOT_IMP, TOT_TGT, CASCADE, fjm } from '../strategy'

// VScorecard — "Meda Matata Mada": Cakaudrove's child-centric, trickle-up
// Balanced Scorecard. Renders the shared strategy model (see strategy.js) by BSC
// perspective; the Government view re-groups the same KPIs by TAB Platform.
// A proposed framework for discussion — not yet wired to live data.

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
                {p.kpis.map(k => <li key={k.t}>{k.t}</li>)}
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

      {/* Action plans — equal-sized boxes, each prefixed by its hierarchy level
          on the left. Ordered foundation-first (Vuvale → Vanua). */}
      <h3>Action plans by level</h3>
      <p className="sub">What each level of the Vanua does to deliver the strategy — the family at the base, accountability rising to the Turaga ni Yavusa and the Vanua.</p>
      <div className="vsc-cascade">
        {CASCADE.map(c => {
          const s = lv(c.level)
          return (
            <div className="card vsc-step" key={c.level} style={{ '--accent': s.color || 'var(--ocean)' }}>
              <div className="vsc-step-name">
                <span className="vsc-level">{s.label || c.level}</span>
                {s.label_en ? <span className="vsc-level-en">{s.label_en}</span> : null}
                <span className="vsc-role">{c.role}</span>
              </div>
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
