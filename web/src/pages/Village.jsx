import { useData, fjd } from '../api'

export default function Village() {
  const { data } = useData('/village')
  if (!data) return <p className="loading">Loading…</p>
  const c = data.counts
  return (
    <>
      <h1>{data.name}</h1>
      <p className="sub">{data.district} · part of {data.province}</p>
      <div className="totrow">
        <div className="tot"><b>{c.yavusa}</b>Yavusa</div>
        <div className="tot"><b>{c.mataqali}</b>Mataqali</div>
        <div className="tot"><b>{c.tokatoka}</b>Tokatoka</div>
        <div className="tot"><b>{c.vuvale}</b>Vuvale</div>
        <div className="tot"><b>{c.soqosoqo}</b>Soqosoqo</div>
        <div className="tot"><b>{c.members}</b>Members</div>
      </div>
      <h3>Highlights — active fundraising</h3>
      <div className="grid">
        {data.highlights.map(h => (
          <div className="card" key={h.name}>
            <h3>{h.name}</h3>
            <div className="meta">Raised {fjd(h.raised)}</div>
            <div className="bar"><i style={{ width: h.prog + '%' }} /></div>
            <div className="meta">{h.prog}% complete</div>
          </div>
        ))}
      </div>
    </>
  )
}
