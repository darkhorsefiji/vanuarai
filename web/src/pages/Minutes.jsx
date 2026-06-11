import { useEffect, useState } from 'react'
import { useData } from '../api'
import { LevelBadge } from '../levels'
import { EditableText } from '../copy'

export default function Minutes() {
  const { data } = useData('/minutes')
  const [sel, setSel] = useState(null)
  useEffect(() => { if (data && data.length && sel == null) setSel(data[0].id) }, [data, sel])

  if (!data) return <p className="loading">Loading…</p>
  const cur = data.find(m => m.id === sel)

  return (
    <>
      <div className="pagetop">
        <h1>Meeting Minutes</h1>
        <EditableText id="minutes.sub" className="sub">Classified by level. Select a meeting to view its resolutions.</EditableText>
      </div>

      <div className="cols">
        <div className="col">
          <table>
            <tbody>
              <tr><th>Date</th><th>Level</th><th>Body</th><th>Title</th></tr>
              {data.map(r => (
                <tr key={r.id} className={'rowsel' + (r.id === sel ? ' sel' : '')} onClick={() => setSel(r.id)}>
                  <td>{r.d}</td>
                  <td><LevelBadge level={r.level} /></td>
                  <td>{r.label}</td>
                  <td>{r.title}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Resolutions</h3>
          {!cur ? <p className="sub">Select a meeting in the table.</p> : (
            <div className="card">
              <h3>{cur.title}</h3>
              <div className="meta">{cur.d} · {cur.label}</div>
              {cur.resolutions.length === 0
                ? <p className="meta" style={{ marginTop: 10 }}>No resolutions recorded for this meeting.</p>
                : (
                  <ul className="reslist">
                    {cur.resolutions.map((r, i) => (
                      <li key={i}><b>{r.ref}</b><span>{r.summary}</span></li>
                    ))}
                  </ul>
                )}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
