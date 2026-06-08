import { useData, fjd } from '../api'

export default function Projects() {
  const { data } = useData('/projects')
  if (!data) return <p className="loading">Loading…</p>
  return (
    <>
      <h1>Projects</h1>
      <p className="sub">“Spent” auto-derives from disbursements; physical progress is set by the owning body.</p>
      <div className="grid">
        {data.map(r => {
          const burn = r.budget_cents ? Math.round(r.spent / r.budget_cents * 100) : 0
          return (
            <div className="card" key={r.name}>
              <h3>{r.name}</h3>
              <div className="meta">{r.owner} · <span className={'pill ' + (r.status === 'completed' ? 'green' : '')}>{r.status}</span></div>
              <div className="meta" style={{ marginTop: 8 }}>Physical progress</div>
              <div className="bar"><i style={{ width: r.prog + '%' }} /></div>
              <div className="meta">{r.prog}%</div>
              <div className="meta" style={{ marginTop: 8 }}>Financial burn</div>
              <div className="bar fin"><i style={{ width: burn + '%' }} /></div>
              <div className="meta">{fjd(r.spent)} of {fjd(r.budget_cents)} · raised {fjd(r.raised)}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}
