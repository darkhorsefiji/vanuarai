import { useEffect, useState } from 'react'
import { get } from '../api'
import { LevelBadge } from '../levels'

const CHILD_NAME = {
  vanua: 'Yavusa', yavusa: 'Mataqali', mataqali: 'Tokatoka', tokatoka: 'Vuvale',
  provincial_council: 'District', district: 'Village',
}

function build(nodes) {
  const kids = {}
  nodes.forEach(n => { (kids[n.parent_id] = kids[n.parent_id] || []).push(n) })
  Object.values(kids).forEach(a => a.sort((x, y) => x.label.localeCompare(y.label)))
  const ids = new Set(nodes.map(n => n.id))
  const root = nodes.find(n => !n.parent_id || !ids.has(n.parent_id))
  return { kids, root }
}

function ENode({ n, kids, onAdd, onRename, onDel }) {
  const child = CHILD_NAME[n.level]
  return (
    <li>
      <LevelBadge level={n.level} /> {n.label}
      <span className="rowacts">
        <button className="mini" onClick={() => onRename(n)} title="Rename">✎</button>
        {child && <button className="mini" onClick={() => onAdd(n, child)}>+ {child}</button>}
        <button className="mini danger" onClick={() => onDel(n)} title="Delete">🗑</button>
      </span>
      {kids[n.id] && <ul className="tree">{kids[n.id].map(c => <ENode key={c.id} n={c} kids={kids} onAdd={onAdd} onRename={onRename} onDel={onDel} />)}</ul>}
    </li>
  )
}

export default function HierarchyEditor({ axis, title }) {
  const [nodes, setNodes] = useState(null)
  const [msg, setMsg] = useState('')
  const load = () => get('/hierarchy').then(all => setNodes(all.filter(n => n.axis === axis)))
  useEffect(() => { load() /* eslint-disable-next-line */ }, [axis])

  async function onAdd(parent, childName) {
    const label = window.prompt(`New ${childName} name:`)
    if (!label) return
    const r = await fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parent_id: parent.id, label }) })
    setMsg(r.ok ? 'Added ✓' : 'Add failed'); load()
  }
  async function onRename(n) {
    const label = window.prompt('Rename to:', n.label)
    if (!label || label === n.label) return
    const r = await fetch('/api/nodes/' + n.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) })
    setMsg(r.ok ? 'Renamed ✓' : 'Rename failed'); load()
  }
  async function onDel(n) {
    if (!window.confirm(`Delete "${n.label}"?`)) return
    const r = await fetch('/api/nodes/' + n.id, { method: 'DELETE' })
    const j = await r.json().catch(() => ({}))
    setMsg(r.ok ? 'Deleted ✓' : (j.error || 'Delete failed')); load()
  }

  if (!nodes) return <p className="loading">Loading…</p>
  const { kids, root } = build(nodes)
  return (
    <div className="treeedit">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ul className="tree">{root && <ENode n={root} kids={kids} onAdd={onAdd} onRename={onRename} onDel={onDel} />}</ul>
      {msg && <p className="status">{msg}</p>}
    </div>
  )
}
