import { useState } from 'react'
import { useData, fjd } from '../api'

export default function Projects() {
  const { data } = useData('/projects')
  const [box, setBox] = useState(null) // { src, caption }
  if (!data) return <p className="loading">Loading…</p>

  return (
    <>
      <h1>Projects</h1>
      <p className="sub">“Spent” auto-derives from disbursements; physical progress is set by the owning body. Click a photo to enlarge.</p>
      <div className="grid">
        {data.map(r => {
          const burn = r.budget_cents ? Math.round(r.spent / r.budget_cents * 100) : 0
          return (
            <div className="card" key={r.id}>
              <h3>{r.name}</h3>
              <div className="meta">{r.owner} · <span className={'chip ' + r.status}>{r.status}</span></div>
              <div className="meta" style={{ marginTop: 8 }}>Physical progress</div>
              <div className="bar"><i style={{ width: r.prog + '%' }} /></div>
              <div className="meta">{r.prog}%</div>
              <div className="meta" style={{ marginTop: 8 }}>Financial burn</div>
              <div className="bar fin"><i style={{ width: burn + '%' }} /></div>
              <div className="meta">{fjd(r.spent)} of {fjd(r.budget_cents)} · raised {fjd(r.raised)}</div>

              {r.photos && r.photos.length > 0 && (
                <>
                  <div className="meta" style={{ marginTop: 10 }}>Photos ({r.photos.length})</div>
                  <div className="gallery">
                    {r.photos.map((p, i) => (
                      <img key={i} className="thumb" src={p.src} alt={p.caption} title={p.caption} loading="lazy" onClick={() => setBox(p)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {box && (
        <div className="lightbox" onClick={() => setBox(null)}>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={box.src.replace('/640/420', '/1200/800')} alt={box.caption} />
            <div className="lightbox-cap"><span>{box.caption}</span><button className="mini" onClick={() => setBox(null)}>Close ✕</button></div>
          </div>
        </div>
      )}
    </>
  )
}
