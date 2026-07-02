import OutcomeBoard from '../OutcomeBoard'

// The Outcome Framework scorecard. Full-width filters up top; then each Outcome
// is a row — its indicators (rolled up the hierarchy, Actual/Target/Variance) on
// the left, and a card of the interventions/projects closing its gaps on the
// right. Replaces the old BSC scorecard at cutover.
export default function Outcomes() {
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Scorecard</h1>
          <p className="sub">Long-term Outcomes classified by Vanua focus area, Government (TAB) pillar and industry (ISIC) — indicators roll up every level. Variances are closed by tasks, interventions and projects; impediments are logged as challenges.</p>
        </div>
      </div>
      <OutcomeBoard />
    </>
  )
}
