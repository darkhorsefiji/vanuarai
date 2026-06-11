import { useEffect, useState } from 'react'
import { useData } from '../api'
import { LevelBadge } from '../levels'
import { EditableText } from '../copy'

const PILL = { Approved: 'approved', Rejected: 'declined', Deferred: 'voting', Withdrawn: 'pending', Noted: 'itltb' }
const ACTIONABLE = new Set(['Approved', 'Rejected'])

// Asks what action to take on a resolution. The real workflow (routing the
// question to the Vunivola) comes with the workflows build; the list of
// actions is DEV-administered on the Dev page.
function ActionModal({ resolution, onClose }) {
  const { data: actions } = useData('/resolution-action-types')
  const [chosen, setChosen] = useState(null)
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Action — {resolution.ref}</h3>
        {!chosen ? (
          <>
            <p className="sub">What action is to be taken?</p>
            <div className="actionlist">
              {!actions ? <p className="loading">Loading…</p> : actions.map(a => (
                <button key={a.id} className="btn secondary" onClick={() => setChosen(a.label)}>{a.label}</button>
              ))}
              {actions && actions.length === 0 && <p className="meta">No actions configured — DEV can add them on the Dev page.</p>}
            </div>
          </>
        ) : (
          <p className="sub">“<b>{chosen}</b>” selected. The workflow that asks the Vunivola to carry this out will be wired when workflows land.</p>
        )}
        <div style={{ textAlign: 'right', marginTop: 10 }}><button className="mini" onClick={onClose}>Close</button></div>
      </div>
    </div>
  )
}

export default function Minutes() {
  const { data } = useData('/minutes')
  const [sel, setSel] = useState(null)
  const [actionFor, setActionFor] = useState(null)
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
                      <li key={i}>
                        <div className="res-head">
                          <b>{r.ref}</b>
                          <span className="res-right">
                            <span className={'lchip ' + (PILL[r.status] || 'pending')}>{r.status || 'Noted'}</span>
                            {ACTIONABLE.has(r.status) && <button className="mini" onClick={() => setActionFor(r)}>Action</button>}
                          </span>
                        </div>
                        <span>{r.summary}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          )}
        </aside>
      </div>

      {actionFor && <ActionModal resolution={actionFor} onClose={() => setActionFor(null)} />}
    </>
  )
}
