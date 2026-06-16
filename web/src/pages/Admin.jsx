import { useState } from 'react'
import { useData, send } from '../api'
import { BodyFilterBar, useBodyFilter, matchBody } from '../bodyfilter'
import { EditableText } from '../copy'

// fixed left→right order: Liuliu, Dau ni yau, Vunivola
const POSITIONS = [['liuliu', 'Liuliu'], ['dauniyau', 'Dau ni yau'], ['vunivola', 'Vunivola']]

export default function Admin() {
  const [refresh, setRefresh] = useState(0)
  const { data } = useData('/officers?_r=' + refresh)
  const { data: log } = useData('/officer-log?_r=' + refresh)
  const { filter, setFilter, bodiesByLevel } = useBodyFilter()
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
          <BodyFilterBar filter={filter} setFilter={setFilter} bodiesByLevel={bodiesByLevel} />

          <h3>Entity officers</h3>
          <p className="sub">Pick a member to fill each role. Reassigning ends the current term and records the change in the log below.</p>
          <div className="officer-grid">
            {data.bodies.filter(b => matchBody(filter, { level: b.level, body_id: b.id })).map(b => (
              <div className="card officer-card" key={b.id}>
                <div className="officer-head"><span className="lchip itltb">{b.entity}</span><b>{b.label}</b></div>
                <div className="officer-positions">
                  {POSITIONS.map(([k, label]) => (
                    <label className="officer-pos" key={k}>
                      <span className="officer-role">{label}</span>
                      <select value={b.officers[k]?.user_id || ''} onChange={e => assign(b.id, k, e.target.value)}>
                        <option value="">— vacant —</option>
                        {candidates(b).map(m => <option key={m.user_id} value={m.user_id}>{m.name}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {data.bodies.filter(b => matchBody(filter, { level: b.level, body_id: b.id })).length === 0 && <p className="meta">No entities for this filter.</p>}
          </div>
          {msg && <p className="status">{msg}</p>}

          <h3 style={{ marginTop: 26 }}>Officer change log</h3>
          <p className="sub">Every assignment, current and past, with its term and status.</p>
          <table className="tight">
            <thead><tr><th>Type</th><th>Entity</th><th>Position</th><th>Officer</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {!log ? <tr><td colSpan={7} className="loading">Loading…</td></tr>
                : (() => { const fl = log.filter(r => matchBody(filter, { level: r.level, body_id: r.body_id })); return fl.length === 0
                  ? <tr><td colSpan={7} className="meta">No assignments for this filter.</td></tr>
                  : fl.map((r, i) => (
                    <tr key={i}>
                      <td>{r.axis}</td>
                      <td>{r.entity}</td>
                      <td>{r.office}</td>
                      <td>{r.name}</td>
                      <td>{r.start_date || '—'}</td>
                      <td>{r.end_date || '—'}</td>
                      <td><span className={'lchip ' + (r.status === 'Active' ? 'approved' : 'pending')}>{r.status}</span></td>
                    </tr>
                  )) })()}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}
