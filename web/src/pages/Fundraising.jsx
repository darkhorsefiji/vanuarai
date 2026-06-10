import { useState } from 'react'
import { useData, fjd } from '../api'
import { EditableText } from '../copy'

export default function Fundraising() {
  const { data } = useData('/fundraising')
  const [msg, setMsg] = useState('')
  if (!data) return <p className="loading">Loading…</p>
  const totRaised = data.reduce((s, r) => s + r.raised, 0)
  const totGoal = data.reduce((s, r) => s + (r.goal_cents || 0), 0)
  return (
    <>
      <div className="pagetop">
        <h1>Fundraising</h1>
        <EditableText id="fundraising.sub" className="sub">Endorsed efforts across the village. Contributions are village-wide transparent.</EditableText>
      </div>
      <div className="totrow">
        <div className="tot"><b>{fjd(totRaised)}</b>Total raised</div>
        <div className="tot"><b>{fjd(totGoal)}</b>Total goals</div>
        <div className="tot"><b>{data.length}</b>Active efforts</div>
      </div>
      {msg && <p className="note">{msg}</p>}
      <div className="grid">
        {data.map(r => {
          const pct = r.goal_cents ? Math.min(100, Math.round(r.raised / r.goal_cents * 100)) : 0
          return (
            <div className="card" key={r.name}>
              <h3>{r.name}</h3>
              <div className="meta">{r.owner}</div>
              <div className="bar"><i style={{ width: pct + '%' }} /></div>
              <div className="meta">{fjd(r.raised)} of {fjd(r.goal_cents)} goal</div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="chip pop">{pct}% funded</span>
                <button className="paybtn" onClick={() => setMsg(`Contributions for “${r.name}” open once the Tobu wallet goes live (pending RBF clearance).`)}>Contribute</button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
