import { useState } from 'react'
import { useData, send } from '../api'
import { EditableText } from '../copy'

const POSITIONS = [['liuliu', 'Liuliu'], ['vunivola', 'Vunivola'], ['dauniyau', 'Dau ni yau']]

export default function Admin() {
  const [refresh, setRefresh] = useState(0)
  const { data } = useData('/officers?_r=' + refresh)
  const { data: log } = useData('/officer-log?_r=' + refresh)
  const [msg, setMsg] = useState('')
  const bump = () => setRefresh(r => r + 1)

  async function assign(body_node_id, office, user_id) {
    setMsg('')
    try { await send('POST', '/officers/assign', { body_node_id, office, user_id: user_id || null }); setMsg('Saved ✓'); bump() }
    catch (e) { setMsg('⚠ ' + (e.message || 'Could not save')) }
  }
  // candidates: the entity's roster where one exists, else all village members;
  // always include the current holders so their name shows even if off-roster.
  const candidates = b => {
    const base = (data.rosterByBody && data.rosterByBody[b.id]) || data.allMembers
    const ids = new Set(base.map(m => m.user_id))
    const extra = POSITIONS.map(([k]) => b.officers[k]).filter(o => o && !ids.has(o.user_id)).map(o => ({ user_id: o.user_id, name: o.name }))
    return [...base, ...extra]
  }

  return (
    <>
      <div className="pagetop">
        <h1>Village Admin</h1>
        <EditableText id="admin.sub" className="sub" html>{'Assign and track the officers — <b>Liuliu</b>, <b>Vunivola</b> and <b>Dau ni yau</b> — for each entity.'}</EditableText>
      </div>

      {!data ? <p className="loading">Loading…</p> : (
        <>
          <h3>Entity officers</h3>
          <p className="sub">Pick a member to fill each role. Reassigning ends the current term and records the change in the log below.</p>
          <div className="officer-grid">
            {data.bodies.map(b => (
              <div className="card officer-card" key={b.id}>
                <div className="officer-head"><b>{b.label}</b><span className="lchip itltb">{b.entity}</span></div>
                {POSITIONS.map(([k, label]) => (
                  <label className="officer-row" key={k}>
                    <span className="officer-role">{label}</span>
                    <select value={b.officers[k]?.user_id || ''} onChange={e => assign(b.id, k, e.target.value)}>
                      <option value="">— vacant —</option>
                      {candidates(b).map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ))}
          </div>
          {msg && <p className="status">{msg}</p>}

          <h3 style={{ marginTop: 26 }}>Officer change log</h3>
          <p className="sub">Every assignment, current and past, with its term and status.</p>
          <table className="tight">
            <thead><tr><th>Entity</th><th>Type</th><th>Position</th><th>Officer</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {!log ? <tr><td colSpan={7} className="loading">Loading…</td></tr>
                : log.length === 0 ? <tr><td colSpan={7} className="meta">No assignments yet.</td></tr>
                  : log.map((r, i) => (
                    <tr key={i}>
                      <td>{r.entity}</td>
                      <td>{r.axis}</td>
                      <td>{r.office}</td>
                      <td>{r.name}</td>
                      <td>{r.start_date || '—'}</td>
                      <td>{r.end_date || '—'}</td>
                      <td><span className={'lchip ' + (r.status === 'Active' ? 'approved' : 'pending')}>{r.status}</span></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}
