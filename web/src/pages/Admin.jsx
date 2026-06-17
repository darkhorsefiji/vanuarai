import { useState } from 'react'
import { useData, send, getToken } from '../api'
import { LevelBadge } from '../levels'
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
  const [impMsg, setImpMsg] = useState('')
  const bump = () => setRefresh(r => r + 1)

  async function downloadTemplate() {
    setImpMsg('Preparing…')
    try {
      const r = await fetch('/api/hierarchy-template', { headers: { Authorization: 'Bearer ' + getToken() } })
      if (!r.ok) throw new Error('Download failed')
      const url = URL.createObjectURL(await r.blob())
      const a = document.createElement('a'); a.href = url; a.download = 'vanuarai-families.xlsx'; a.click(); URL.revokeObjectURL(url)
      setImpMsg('Downloaded ✓ — edit it, then upload.')
    } catch (e) { setImpMsg('⚠ ' + e.message) }
  }
  async function uploadFile(file) {
    setImpMsg('Importing…')
    try {
      const buf = await file.arrayBuffer()
      const r = await fetch('/api/hierarchy-import', { method: 'POST', headers: { Authorization: 'Bearer ' + getToken(), 'Content-Type': 'application/octet-stream' }, body: buf })
      const j = await r.json(); if (!r.ok) throw new Error(j.error || 'Import failed')
      setImpMsg(`Imported ✓ — ${j.nodesCreated} new node(s), ${j.membersAdded} member(s) added, ${j.membersUpdated} updated.`)
      bump()
    } catch (e) { setImpMsg('⚠ ' + e.message) }
  }

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

      <div className="card impbox">
        <h3 style={{ marginTop: 0 }}>Families &amp; members — bulk download / import</h3>
        <p className="sub">Download the spreadsheet (pre-filled with the current hierarchy), edit it, and upload to add or update families and members. Column headings are locked; uploaded rows override matching records.</p>
        <div className="impbtns">
          <button className="btn secondary" onClick={downloadTemplate}>⬇ Download template</button>
          <label className="btn impupload">⬆ Upload filled template
            <input type="file" accept=".xlsx" onChange={e => { const f = e.target.files[0]; if (f) uploadFile(f); e.target.value = '' }} />
          </label>
        </div>
        {impMsg && <p className="status">{impMsg}</p>}
      </div>

      {!data ? <p className="loading">Loading…</p> : (
        <>
          <BodyFilterBar filter={filter} setFilter={setFilter} bodiesByLevel={bodiesByLevel} />

          <h3>Entity officers</h3>
          <p className="sub">Pick a member to fill each role. Reassigning ends the current term and records the change in the log below.</p>
          <div className="officer-grid">
            {data.bodies.filter(b => matchBody(filter, { level: b.level, body_id: b.id })).map(b => (
              <div className="card officer-card" key={b.id}>
                <div className="officer-head"><LevelBadge level={b.level} /><b>{b.label}</b></div>
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
                      <td><LevelBadge level={r.level} /></td>
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
