import { useState } from 'react'
import { useData, fjd } from '../api'
import { useLevels } from '../levels'
import { BodyFilterBar, useBodyFilter, matchBody } from '../bodyfilter'
import { EditableText } from '../copy'

// lineage levels the contributions chart can be grouped by
const CHART_LEVELS = ['mataqali', 'tokatoka', 'vuvale']

function ContributionsChart() {
  const [lvl, setLvl] = useState('mataqali')
  const { data } = useData('/contributions?level=' + lvl)
  const { map } = useLevels()
  const max = data && data.length ? Math.max(...data.map(d => d.total)) : 1
  return (
    <div className="fundchart card">
      <h3 style={{ marginTop: 0 }}>Contributions</h3>
      <p className="sub">Donations grouped by contributor lineage.</p>
      <div className="finfilter">
        {CHART_LEVELS.map(l => (
          <button key={l} className={'fchip' + (lvl === l ? ' active' : '')} onClick={() => setLvl(l)}>{map[l]?.label || l}</button>
        ))}
      </div>
      {!data ? <p className="loading">Loading…</p>
        : data.length === 0 ? <p className="meta">No contributions recorded at this level.</p>
          : (
            // stagger labels (one low, one high, repeat) once bars get congested
            <div className={'barchart' + (data.length > 6 ? ' stagger' : '')}>
              {data.map(d => (
                <div className="barcol" key={d.label} title={`${d.label} — ${fjd(d.total)}`}>
                  <span className="barval">{fjd(d.total)}</span>
                  <div className="chartbar" style={{ height: Math.round((d.total / max) * 200) + 6 + 'px' }} />
                  <span className="barlbl">{d.label}</span>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

export default function Fundraising() {
  const { data } = useData('/fundraising')
  const { filter, setFilter, bodiesByLevel } = useBodyFilter()
  const [msg, setMsg] = useState('')
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(r => matchBody(filter, r))
  const totRaised = rows.reduce((s, r) => s + r.raised, 0)
  const totGoal = rows.reduce((s, r) => s + (r.goal_cents || 0), 0)
  return (
    <>
      <div className="pagetop">
        <h1>Fundraising</h1>
        <EditableText id="fundraising.sub" className="sub">Endorsed efforts across the village. Contributions are village-wide transparent.</EditableText>
      </div>
      <BodyFilterBar filter={filter} setFilter={setFilter} bodiesByLevel={bodiesByLevel} />
      <div className="totrow">
        <div className="tot"><b>{fjd(totRaised)}</b>Total raised</div>
        <div className="tot"><b>{fjd(totGoal)}</b>Total goals</div>
        <div className="tot"><b>{rows.length}</b>Active efforts</div>
      </div>
      {msg && <p className="note">{msg}</p>}

      <div className="cols fund-cols">
        <div className="col">
          {rows.length === 0 && <p className="meta">No fundraising efforts for this body.</p>}
          <div className="fundcards">
            {rows.map(r => {
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
        </div>
        <aside className="col">
          <ContributionsChart />
        </aside>
      </div>
    </>
  )
}
