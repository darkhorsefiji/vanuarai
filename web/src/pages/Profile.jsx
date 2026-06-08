import { useData } from '../api'

function Rate({ label, score, kind }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div className="meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span><span>{score}/5</span>
      </div>
      <div className={'bar' + (kind === 'resource' ? ' fin' : '')}>
        <i style={{ width: (score / 5 * 100) + '%' }} />
      </div>
    </div>
  )
}

export default function Profile() {
  const { data } = useData('/profile')
  if (!data) return <p className="loading">Loading…</p>
  const c = data.counts
  const res = data.resources || []
  const avg = arr => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0)
  const avgR = avg(res.map(r => r.resource))
  const avgP = avg(res.map(r => r.participation))
  const overall = Math.round((avgR + avgP) / 2 / 5 * 100)
  const { latitude: lat, longitude: lon } = data
  const d = 0.06
  const bbox = lon != null ? `${lon - d},${lat - d},${lon + d},${lat + d}` : null

  return (
    <>
      <h1>{data.name}</h1>
      <p className="sub">{data.district} · part of {data.province}</p>

      <div className="cols">
        {/* ---- Left: narrative + ratings ---- */}
        <div className="col">
          <h3>Introduction</h3>
          <p style={{ marginBottom: 18 }}>{data.introduction}</p>

          <h3>Background</h3>
          <p>{data.background}</p>

          <h3 style={{ marginTop: 24 }}>Resources &amp; Participation</h3>
          <p className="sub">Each sector is scored 0–5 for resource endowment (blue) and the village’s level of participation (green).</p>
          <div className="totrow">
            <div className="tot"><b>{avgR.toFixed(1)}/5</b>Avg resource</div>
            <div className="tot"><b>{avgP.toFixed(1)}/5</b>Avg participation</div>
            <div className="tot"><b>{overall}/100</b>Overall index</div>
          </div>
          <div className="grid">
            {res.map(r => (
              <div className="card" key={r.sector}>
                <h3>{r.sector}</h3>
                <Rate label="Resource" score={r.resource} kind="resource" />
                <Rate label="Participation" score={r.participation} kind="participation" />
                {r.notes && <div className="meta" style={{ marginTop: 8 }}>{r.notes}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ---- Right: at-a-glance, map, directions ---- */}
        <aside className="col side">
          <div className="card">
            <h3>At a glance</h3>
            <div className="kv"><span>Yavusa</span><b>{c.yavusa}</b></div>
            <div className="kv"><span>Mataqali</span><b>{c.mataqali}</b></div>
            <div className="kv"><span>Tokatoka</span><b>{c.tokatoka}</b></div>
            <div className="kv"><span>Vuvale</span><b>{c.vuvale}</b></div>
            <div className="kv"><span>Soqosoqo</span><b>{c.soqosoqo}</b></div>
            <div className="kv"><span>Members</span><b>{c.members}</b></div>
          </div>

          <h3>Location</h3>
          {bbox ? (
            <>
              <iframe
                title="Village location" width="100%" height="240" loading="lazy"
                style={{ border: 0, borderRadius: 12 }}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
              />
              <p className="meta">
                <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`}>View larger map ↗</a>
                &nbsp;·&nbsp;{Number(lat).toFixed(4)}, {Number(lon).toFixed(4)} (placeholder)
              </p>
            </>
          ) : <p className="meta">Location not set.</p>}

          <h3>How to get there</h3>
          <p>{data.how_to_get_there}</p>
        </aside>
      </div>
    </>
  )
}
