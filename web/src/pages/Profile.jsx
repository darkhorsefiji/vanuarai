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

      <h3>Introduction</h3>
      <p style={{ maxWidth: 760, marginBottom: 18 }}>{data.introduction}</p>

      <h3>Background</h3>
      <p style={{ maxWidth: 760 }}>{data.background}</p>
      <div className="totrow" style={{ marginTop: 14 }}>
        <div className="tot"><b>{c.yavusa}</b>Yavusa</div>
        <div className="tot"><b>{c.mataqali}</b>Mataqali</div>
        <div className="tot"><b>{c.tokatoka}</b>Tokatoka</div>
        <div className="tot"><b>{c.vuvale}</b>Vuvale</div>
        <div className="tot"><b>{c.soqosoqo}</b>Soqosoqo</div>
        <div className="tot"><b>{c.members}</b>Members</div>
      </div>

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

      <h3 style={{ marginTop: 28 }}>Location</h3>
      {bbox ? (
        <>
          <iframe
            title="Village location" width="100%" height="320" loading="lazy"
            style={{ border: 0, borderRadius: 12 }}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
          />
          <p className="meta">
            <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=13/${lat}/${lon}`}>View larger map ↗</a>
            &nbsp;·&nbsp;{Number(lat).toFixed(4)}, {Number(lon).toFixed(4)} (placeholder coordinates)
          </p>
        </>
      ) : <p className="meta">Location not set.</p>}

      <h3 style={{ marginTop: 28 }}>How to get there</h3>
      <p style={{ maxWidth: 760 }}>{data.how_to_get_there}</p>
    </>
  )
}
