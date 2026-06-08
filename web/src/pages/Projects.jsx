import { useEffect, useState } from 'react'
import { useData, fjd } from '../api'

export default function Projects() {
  const { data } = useData('/projects')
  const [box, setBox] = useState(null) // { photos: [...], i }

  // keyboard navigation for the lightbox
  useEffect(() => {
    if (!box) return
    const h = e => {
      if (e.key === 'Escape') setBox(null)
      else if (e.key === 'ArrowLeft') setBox(b => (b && b.i > 0 ? { ...b, i: b.i - 1 } : b))
      else if (e.key === 'ArrowRight') setBox(b => (b && b.i < b.photos.length - 1 ? { ...b, i: b.i + 1 } : b))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [box])

  if (!data) return <p className="loading">Loading…</p>
  const cur = box ? box.photos[box.i] : null

  return (
    <>
      <h1>Projects</h1>
      <p className="sub">“Spent” auto-derives from disbursements; physical progress is set by the owning body. Click a photo to enlarge; use ‹ › to browse.</p>
      <div className="grid3">
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
                      <img key={i} className={'thumb' + (i === 0 ? ' spotlight' : '')}
                        src={p.src} alt={p.caption} title={p.caption} loading="lazy"
                        onClick={() => setBox({ photos: r.photos, i })} />
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
          {box.i > 0 && (
            <button className="lb-arrow left" onClick={e => { e.stopPropagation(); setBox(b => ({ ...b, i: b.i - 1 })) }} aria-label="Previous">‹</button>
          )}
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={cur.src.replace('/640/420', '/1200/800')} alt={cur.caption} />
            <div className="lightbox-cap">
              <span>{cur.caption} · {box.i + 1} / {box.photos.length}</span>
              <button className="mini" onClick={() => setBox(null)}>Close ✕</button>
            </div>
          </div>
          {box.i < box.photos.length - 1 && (
            <button className="lb-arrow right" onClick={e => { e.stopPropagation(); setBox(b => ({ ...b, i: b.i + 1 })) }} aria-label="Next">›</button>
          )}
        </div>
      )}
    </>
  )
}
