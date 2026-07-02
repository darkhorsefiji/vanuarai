import { useState, useEffect } from 'react'
import { get, send } from './api'

// Shared building blocks for the Actions UI (used by the per-Outcome ActionCard).
export const STATUSES = ['not_started', 'in_progress', 'on_hold', 'cancelled', 'completed']
export const CH_STATUSES = ['open', 'in_progress', 'on_hold', 'resolved', 'cancelled']
export const KIND_LABEL = { task: 'Task', intervention: 'Initiative', project: 'Project' }
const dOnly = d => (d ? String(d).slice(0, 10) : '')
export const RACI_ABBR = { responsible: 'R', accountable: 'A', consulted: 'C', informed: 'I' }
export const human = s => (s || '').replace(/_/g, ' ')

export function RaciChips({ raci, onDel }) {
  if (!raci || !raci.length) return <span className="meta">—</span>
  return <span className="of-raci">{raci.map(r => (
    <span className="of-chip" key={r.id} title={r.raci + ' · ' + r.assignee_kind}>
      <b>{RACI_ABBR[r.raci]}</b> {r.label}
      {onDel && <button className="of-chip-x" onClick={() => onDel(r)} title="Remove">×</button>}
    </span>
  ))}</span>
}

// Assign a RACI role to an agency, a Government contact, or free text (person/role).
export function AddRaci({ parent_kind, parent_id, govContacts, onDone }) {
  const [raci, setRaci] = useState('responsible')
  const [kind, setKind] = useState('agency')
  const [val, setVal] = useState('')
  async function add() {
    if (!val) return
    const body = { parent_kind, parent_id, raci, assignee_kind: kind }
    if (kind === 'agency') body.agency_label = val
    else if (kind === 'free') body.free_label = val
    else if (kind === 'gov_contact') body.gov_contact_id = val
    try { await send('POST', '/of/raci', body); setVal(''); onDone() } catch (e) { alert(e.message) }
  }
  return (
    <div className="of-addraci">
      <select value={raci} onChange={e => setRaci(e.target.value)} title="RACI role">
        {Object.entries(RACI_ABBR).map(([k, v]) => <option key={k} value={k}>{v} · {k}</option>)}
      </select>
      <select value={kind} onChange={e => { setKind(e.target.value); setVal('') }}>
        <option value="agency">Agency</option>
        <option value="free">Person / role</option>
        <option value="gov_contact">Gov contact</option>
      </select>
      {kind === 'gov_contact'
        ? <select value={val} onChange={e => setVal(e.target.value)}><option value="">Select…</option>{govContacts.map(g => <option key={g.id} value={g.id}>{g.title}{g.name ? ' · ' + g.name : ''}</option>)}</select>
        : <input value={val} onChange={e => setVal(e.target.value)} placeholder={kind === 'agency' ? 'e.g. Ministry of Agriculture' : 'name or role'} />}
      <button className="mini" onClick={add} disabled={!val}>Assign</button>
    </div>
  )
}

// Intervention indicators (short-term) — self-loads for its action.
export function InterventionIndicators({ actionId, canEdit }) {
  const [rows, setRows] = useState(null)
  const [f, setF] = useState({ name: '', unit: '', target_value: '', actual_value: '' })
  const load = () => get(`/of/actions/${actionId}/intervention-indicators`).then(setRows).catch(() => setRows([]))
  useEffect(() => { load() }, [actionId])
  async function add() {
    if (!f.name.trim()) return
    try { await send('POST', '/of/intervention-indicators', { action_id: actionId, ...f }); setF({ name: '', unit: '', target_value: '', actual_value: '' }); load() } catch (e) { alert(e.message) }
  }
  async function del(id) { try { await send('DELETE', '/of/intervention-indicators/' + id); load() } catch (e) { alert(e.message) } }
  if (rows == null) return <p className="loading">Loading…</p>
  return (
    <div className="of-ii">
      <div className="of-sub-h">Intervention indicators <span className="meta">(short-term)</span></div>
      {rows.length === 0 && <p className="meta">None yet.</p>}
      {rows.map(r => (
        <div className="of-ii-row" key={r.id}>
          <span>{r.name} {r.unit ? <span className="meta">{r.unit}</span> : null}</span>
          <span className="sc-kpi-val">{Number(r.actual_value).toLocaleString()} / {Number(r.target_value).toLocaleString()}</span>
          {canEdit && <button className="of-chip-x" onClick={() => del(r.id)} title="Remove">×</button>}
        </div>
      ))}
      {canEdit && (
        <div className="of-ii-add">
          <input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Indicator name" />
          <input value={f.unit} onChange={e => setF({ ...f, unit: e.target.value })} placeholder="unit" className="of-unit" />
          <input type="number" value={f.actual_value} onChange={e => setF({ ...f, actual_value: e.target.value })} placeholder="actual" />
          <input type="number" value={f.target_value} onChange={e => setF({ ...f, target_value: e.target.value })} placeholder="target" />
          <button className="mini" onClick={add} disabled={!f.name.trim()}>Add</button>
        </div>
      )}
    </div>
  )
}

// Quick add-task under an intervention (inherits the parent's Outcome).
export function AddTask({ parentId, parentOutcomeId, onDone }) {
  const [t, setT] = useState('')
  async function add() {
    if (!t.trim()) return
    try { await send('POST', '/of/actions', { kind: 'task', title: t.trim(), parent_intervention_id: parentId, outcome_id: parentOutcomeId || null }); setT(''); onDone() }
    catch (e) { alert(e.message) }
  }
  return (
    <div className="of-addtask">
      <input value={t} onChange={e => setT(e.target.value)} placeholder="+ New task" onKeyDown={e => e.key === 'Enter' && add()} />
      <button className="mini" onClick={add} disabled={!t.trim()}>Add task</button>
    </div>
  )
}

// Challenges (impediment log) for one action — self-loads.
export function Challenges({ action, canEdit }) {
  const [list, setList] = useState(null)
  const [desc, setDesc] = useState('')
  const [due, setDue] = useState('')
  const [adding, setAdding] = useState(false)
  const load = () => get('/of/challenges?action=' + action.id).then(setList).catch(() => setList([]))
  useEffect(() => { load() }, [action.id])
  async function raise() {
    if (!desc.trim()) return
    try { await send('POST', '/of/challenges', { action_id: action.id, description: desc.trim(), target_due_date: due || null }); setDesc(''); setDue(''); setAdding(false); load() }
    catch (e) { alert(e.message) }
  }
  async function setStatus(c, status) { try { await send('PATCH', '/of/challenges/' + c.id, { status }); load() } catch (e) { alert(e.message) } }
  if (list == null) return null
  return (
    <div className="of-challenges">
      <div className="of-sub-h">Challenges <span className="meta">(impediments)</span></div>
      {list.length === 0 && <p className="meta">None logged.</p>}
      {list.map(c => (
        <div className="of-ch-row" key={c.id}>
          <span className="of-ref">{c.ref_code}</span>
          <span className="of-title">{c.description}</span>
          {c.target_due_date && <span className="meta">due {c.target_due_date.slice(0, 10)}</span>}
          <select className={'of-status of-s-' + c.status} value={c.status} onChange={e => setStatus(c, e.target.value)} disabled={!canEdit}>
            {CH_STATUSES.map(s => <option key={s} value={s}>{human(s)}</option>)}
          </select>
          <RaciChips raci={c.raci} />
        </div>
      ))}
      {canEdit && (adding ? (
        <div className="of-ch-add">
          <input className="of-grow" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is blocking result achievement?" />
          <label className="meta">due <input type="date" value={due} onChange={e => setDue(e.target.value)} /></label>
          <button className="mini" onClick={raise} disabled={!desc.trim()}>Log</button>
          <button className="mini secondary" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : <button className="mini secondary" onClick={() => setAdding(true)}>＋ Log a challenge</button>)}
    </div>
  )
}

// One action row (intervention / project / task) with an expandable drawer.
export function ActionRow({ action: a, childrenOf, govContacts, canEdit, onChange, nested }) {
  const [open, setOpen] = useState(false)
  async function setStatus(status) { try { await send('PATCH', '/of/actions/' + a.id, { status }); onChange() } catch (e) { alert(e.message) } }
  async function del() {
    if (!window.confirm(`Delete ${a.ref_code} “${a.title}”?`)) return
    try { await send('DELETE', '/of/actions/' + a.id); onChange() } catch (e) { alert(e.message) }
  }
  async function delRaci(r) { try { await send('DELETE', '/of/raci/' + r.id); onChange() } catch (e) { alert(e.message) } }
  async function setDue(field, val) { try { await send('PATCH', '/of/actions/' + a.id, { [field]: val || null }); onChange() } catch (e) { alert(e.message) } }
  const kids = childrenOf ? childrenOf(a.id) : []
  return (
    <>
      <div className={'of-action' + (nested ? ' nested' : '')}>
        {/* click the id/title area to expand; type on top, id beneath it */}
        <div className="of-head" onClick={() => setOpen(o => !o)} title={open ? 'Collapse' : 'Expand'}>
          <span className="of-idcol">
            <span className={'of-kind of-k-' + a.kind}>{KIND_LABEL[a.kind]}</span>
            <span className="of-ref">{a.ref_code}</span>
          </span>
          <span className="of-titlecol">
            <span className="of-title">{a.title}</span>
            {(a.outcome_title || a.kpi_name) && (
              <span className="of-link">↳ {a.outcome_title || '—'}{a.kpi_name ? <> · <b>{a.kpi_name}</b></> : null}</span>
            )}
            <span className="of-dues">
              <span className="meta">Target due: <b>{dOnly(a.target_due_date) || '—'}</b></span>
              <span className="meta">Actual due: <b>{dOnly(a.actual_due_date) || '—'}</b></span>
            </span>
          </span>
        </div>
        <RaciChips raci={a.raci} />
        <select className={'of-status of-s-' + a.status} value={a.status} onChange={e => setStatus(e.target.value)} disabled={!canEdit}>
          {STATUSES.map(s => <option key={s} value={s}>{human(s)}</option>)}
        </select>
        {canEdit && <button className="mini danger" onClick={del} title="Delete">🗑</button>}
      </div>
      {open && (
        <div className="of-drawer">
          {a.description && <p className="of-desc">{a.description}</p>}
          {canEdit && (
            <div className="of-dueedit">
              <label className="meta">Target due <input type="date" value={dOnly(a.target_due_date)} onChange={e => setDue('target_due_date', e.target.value)} /></label>
              <label className="meta">Actual due <input type="date" value={dOnly(a.actual_due_date)} onChange={e => setDue('actual_due_date', e.target.value)} /></label>
            </div>
          )}
          <div className="of-sub-h">RACI</div>
          <RaciChips raci={a.raci} onDel={canEdit ? delRaci : null} />
          {canEdit && <AddRaci parent_kind="action" parent_id={a.id} govContacts={govContacts} onDone={onChange} />}
          {(a.kind === 'intervention' || a.kind === 'project') && <InterventionIndicators actionId={a.id} canEdit={canEdit} />}
          {a.kind === 'intervention' && (
            <div className="of-tasks">
              <div className="of-sub-h">Tasks</div>
              {kids.length === 0 && <p className="meta">No tasks.</p>}
              {kids.map(t => <ActionRow key={t.id} action={t} childrenOf={childrenOf} govContacts={govContacts} canEdit={canEdit} onChange={onChange} nested />)}
              {canEdit && a.status !== 'completed' && <AddTask parentId={a.id} parentOutcomeId={a.outcome_id} onDone={onChange} />}
              {canEdit && a.status === 'completed' && <p className="meta">Completed — no new tasks can be added.</p>}
            </div>
          )}
          <Challenges action={a} canEdit={canEdit} />
        </div>
      )}
    </>
  )
}
