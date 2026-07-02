import { useState } from 'react'
import OutcomeBoard from '../OutcomeBoard'
import ActionsRegister from '../ActionsRegister'

// The Outcome Framework — the new results/M&E scorecard. Two columns: the left
// tracks long-term Outcomes (tagged on 3 axes) with indicators rolled UP the
// hierarchy; the right is the Actions register that turns variances into tasks /
// interventions / projects and logs the impediments (challenges). "Raise action"
// on a left-column variance pre-fills the right-column create form.
export default function Outcomes() {
  const [prefill, setPrefill] = useState(null)
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Scorecard</h1>
          <p className="sub">Long-term Outcomes classified by Vanua focus area, Government (TAB) pillar and industry (ISIC) — indicators roll up every level. Variances are closed by tasks, interventions and projects; impediments are logged as challenges.</p>
        </div>
      </div>

      <div className="of-cols">
        <section className="of-col of-col-left">
          <h3 className="of-col-h">Outcome tracking</h3>
          <OutcomeBoard onRaiseAction={setPrefill} />
        </section>
        <section className="of-col of-col-right">
          <h3 className="of-col-h">Interventions &amp; actions</h3>
          <ActionsRegister prefill={prefill} onConsumePrefill={() => setPrefill(null)} />
        </section>
      </div>
    </>
  )
}
