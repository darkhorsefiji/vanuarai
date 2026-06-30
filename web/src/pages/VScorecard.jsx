import { useLevels } from '../levels'
import { COMMODITIES, TOT_IMP, TOT_TGT, CASCADE, fjm } from '../strategy'
import Scorecard from '../Scorecard'

// The single Scorecard view — "Meda Matata Mada", Cakaudrove's child-centric,
// trickle-up Balanced Scorecard. The live, editable, rolled-up scorecard sits on
// top (By Perspective / By TAB Platform lenses); the strategy framework below it
// is the context. Strategy model lives in strategy.js.
export default function VScorecard() {
  const { map } = useLevels()
  const lv = k => map[k] || {}

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Scorecard</h1>
          <p className="sub">Meda Matata Mada — Cakaudrove’s child-centric, trickle-up Balanced Scorecard. Enter data at the Mataqali, Tokatoka &amp; Vuvale; it rolls up to the Vanua.</p>
        </div>
      </div>

      {/* The live, editable, rolled-up scorecard (lens toggle + per-node entry). */}
      <Scorecard axis="traditional" />

      {/* ── Strategy framework (the "why" behind the numbers) ───────────────── */}
      <div className="card vsc-vision" style={{ marginTop: 26 }}>
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

      {/* Action plans — equal-sized boxes, each prefixed by its hierarchy level. */}
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
