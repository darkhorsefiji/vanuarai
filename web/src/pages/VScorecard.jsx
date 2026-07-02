import { useLevels } from '../levels'
import { COMMODITIES, TOT_IMP, TOT_TGT, CASCADE, fjm } from '../strategy'
import { EditableText } from '../copy'
import Scorecard from '../Scorecard'

// The single Scorecard view — "Meda Matata Mada", Cakaudrove's child-centric,
// trickle-up Balanced Scorecard. The live, editable, rolled-up scorecard sits on
// top (By Perspective / By TAB Platform lenses); the strategy framework below it
// is the context. Framework prose is EditableText (DEV ✎ pencil edits it; edits
// persist per-browser in localStorage). Strategy data model lives in strategy.js.
export default function VScorecard() {
  const { map } = useLevels()
  const lv = k => map[k] || {}

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Strategy</h1>
          <EditableText as="p" className="sub" id="sc.page.sub">Meda Matata Mada — Cakaudrove’s child-centric, trickle-up Balanced Scorecard. Enter data at the Mataqali, Tokatoka &amp; Vuvale; it rolls up to the Vanua.</EditableText>
        </div>
      </div>

      {/* The live, editable, rolled-up scorecard (lens toggle + per-node entry). */}
      <Scorecard axis="traditional" />

      {/* ── Strategy framework (the "why" behind the numbers) ───────────────── */}
      <div className="card vsc-vision" style={{ marginTop: 26 }}>
        <div className="vsc-vision-main">
          <EditableText as="span" className="vsc-eyebrow" id="sc.vision.eyebrow">Our objective</EditableText>
          <EditableText as="h2" id="sc.vision.title">Peace and prosperity prevails across Cakaudrove.</EditableText>
          <EditableText as="p" className="vsc-strategy" id="sc.vision.strategy" html>{'Strategy: <b>Child-Centric</b>. We replace the spirit of lack and dependency by working our way toward abundance — growing the economy from the grassroots up. A strengthened family is the foundation; the family enables the trickle-up economy.'}</EditableText>
        </div>
        <div className="vsc-pillars">
          {['Vuvale', 'Vanua', 'Lotu', 'Matanitu'].map((p, i) => <EditableText as="span" className="vsc-pillar" id={`sc.pillar.${i}`} key={i}>{p}</EditableText>)}
        </div>
      </div>

      {/* Two delivery engines */}
      <EditableText as="h3" id="sc.engines.heading">Two engines</EditableText>
      <div className="vsc-engines">
        <div className="card vsc-engine">
          <EditableText as="h4" id="sc.engine.coop.title" html>{'The Co-operative <span class="meta">· VCDCL</span>'}</EditableText>
          <EditableText as="p" id="sc.engine.coop.body" html>{'Supports <b>family income</b>. Runs the <b>10% in 10 years</b> import-substitution campaign, aggregates produce, and links growers to market (e.g. the Kumala flour miller).'}</EditableText>
        </div>
        <div className="card vsc-engine">
          <EditableText as="h4" id="sc.engine.trust.title">The Trust</EditableText>
          <EditableText as="p" id="sc.engine.trust.body" html>{'Supports <b>raising the child</b>. Holds the standards, norms, plans and dashboard — the monitoring &amp; evaluation platform — and records the welfare of our children.'}</EditableText>
        </div>
      </div>

      {/* 10% in 10 years */}
      <EditableText as="h3" id="sc.tenpct.heading">10% in 10 years · import-substitution targets</EditableText>
      <EditableText as="p" className="sub" id="sc.tenpct.sub">Grow locally 10% of Fiji’s imports that can be grown here — over ten years.</EditableText>
      <div className="card vsc-tablewrap">
        <table className="vsc-table">
          <thead>
            <tr><th>#</th><th>Product category</th><th className="num">Annual import</th><th className="num">10% target</th><th>Basis</th></tr>
          </thead>
          <tbody>
            {COMMODITIES.map(c => (
              <tr key={c.rank}>
                <td className="meta">{c.rank}</td>
                <td><EditableText as="b" id={`sc.commodity.${c.rank}.product`}>{c.product}</EditableText></td>
                <td className="num">{fjm(c.imp)}</td>
                <td className="num vsc-tgt">{fjm(c.imp * 0.1)}</td>
                <td className="meta"><EditableText as="span" id={`sc.commodity.${c.rank}.note`}>{c.note}</EditableText></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><td></td><td><b>Total</b></td><td className="num"><b>{fjm(TOT_IMP)}</b></td><td className="num vsc-tgt"><b>{fjm(TOT_TGT)}</b></td><td className="meta">per year, at full ramp</td></tr>
          </tfoot>
        </table>
      </div>

      {/* Action plans — equal-sized boxes, each prefixed by its hierarchy level. */}
      <EditableText as="h3" id="sc.actions.heading">Action plans by level</EditableText>
      <EditableText as="p" className="sub" id="sc.actions.sub">What each level of the Vanua does to deliver the strategy — the family at the base, accountability rising to the Turaga ni Yavusa and the Vanua.</EditableText>
      <div className="vsc-cascade">
        {CASCADE.map(c => {
          const s = lv(c.level)
          return (
            <div className="card vsc-step" key={c.level} style={{ '--accent': s.color || 'var(--ocean)' }}>
              <div className="vsc-step-name">
                <span className="vsc-level">{s.label || c.level}</span>
                {s.label_en ? <span className="vsc-level-en">{s.label_en}</span> : null}
                <EditableText as="span" className="vsc-role" id={`sc.cascade.${c.level}.role`}>{c.role}</EditableText>
              </div>
              <ul className="vsc-actions">
                {c.actions.map((a, i) => <EditableText as="li" id={`sc.cascade.${c.level}.action.${i}`} key={i}>{a}</EditableText>)}
              </ul>
            </div>
          )
        })}
      </div>
    </>
  )
}
