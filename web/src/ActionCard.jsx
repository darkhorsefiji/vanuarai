import { useState, useEffect, useRef } from 'react'
import { send } from './api'
import { ActionRow, STATUSES, human } from './actionbits'

// The right-column card: interventions/projects related to ONE Outcome, sitting
// beside that Outcome's scorecard. `autoOpen` (from a "Raise action" click on a
// variance) opens the create form pre-filled.
export default function ActionCard({ outcome, nodeId, actions, childrenOf, govContacts, canEdit, onChange, autoOpen, prefillTitle, prefillIndicator, onConsume }) {
  const [showCreate, setShowCreate] = useState(false)
  const blank = { kind: 'intervention', title: '', description: '', target_due_date: '', actual_due_date: '', status: 'not_started', indicator_id: null }
  const [f, setF] = useState(blank)
  const ref = useRef(null)

  useEffect(() => {
    if (autoOpen) {
      setShowCreate(true)
      setF({ ...blank, title: prefillTitle || '', description: `Addresses a shortfall under “${outcome.title}”.`, indicator_id: prefillIndicator || null })
      onConsume && onConsume()
      ref.current?.scrollIntoView({ block: 'center' })
    }
  }, [autoOpen]) // eslint-disable-line

  async function create() {
    if (!f.title.trim()) return
    try {
      await send('POST', '/of/actions', {
        kind: f.kind, title: f.title.trim(), description: f.description || null,
        outcome_id: outcome.id, indicator_id: f.indicator_id || null, node_id: nodeId || null,
        target_due_date: f.target_due_date || null, actual_due_date: f.actual_due_date || null, status: f.status,
      })
      setF(blank); setShowCreate(false); onChange()
    } catch (e) { alert(e.message) }
  }

  return (
    <div className="card of-ic" ref={ref}>
      <div className="of-ic-head">
        <span className="of-ic-title">Interventions <span className="meta">({actions.length})</span></span>
        {canEdit && <button className={'mini ' + (showCreate ? '' : 'secondary')} onClick={() => setShowCreate(s => !s)}>{showCreate ? 'Cancel' : '＋ New'}</button>}
      </div>

      {showCreate && canEdit && (
        <div className="of-ic-create">
          <div className="of-create-row">
            <select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}>
              <option value="intervention">Initiative</option>
              <option value="project">Project</option>
            </select>
            <input className="of-grow" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Title" />
          </div>
          <div className="of-create-row">
            <label className="meta">target due <input type="date" value={f.target_due_date} onChange={e => setF({ ...f, target_due_date: e.target.value })} /></label>
            <select value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s}>{human(s)}</option>)}
            </select>
            <button className="mini" onClick={create} disabled={!f.title.trim()}>Create</button>
          </div>
        </div>
      )}

      {actions.length === 0
        ? <p className="meta of-ic-empty">No interventions yet{canEdit ? ' — use “＋ New”, or “Raise action” on a gap.' : '.'}</p>
        : actions.map(a => (
          <ActionRow key={a.id} action={a} childrenOf={childrenOf} govContacts={govContacts} canEdit={canEdit} onChange={onChange} />
        ))}
    </div>
  )
}
