import { useState, useEffect, useCallback } from 'react'
import { get, send } from './api'
import { LevelBadge, LevelEn } from './levels'

export const CHILD_NAME = {
  vanua: 'Yavusa', yavusa: 'Mataqali', mataqali: 'Tokatoka', tokatoka: 'Vuvale',
  matanitu: 'Province', provincial_council: 'District', district: 'Village',
}


export function buildTree(nodes) {
  const kids = {}
  nodes.forEach(n => { (kids[n.parent_id] = kids[n.parent_id] || []).push(n) })
  Object.values(kids).forEach(a => a.sort((x, y) => x.label.localeCompare(y.label)))
  const ids = new Set(nodes.map(n => n.id))
  const root = nodes.find(n => !n.parent_id || !ids.has(n.parent_id))
  return { kids, root }
}

export function filterNodes(nodes, q) {
  if (!q || !q.trim()) return nodes
  const ql = q.toLowerCase()
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const keep = new Set()
  nodes.forEach(n => { if (n.label.toLowerCase().includes(ql)) { let x = n; while (x) { keep.add(x.id); x = byId[x.parent_id] } } })
  return nodes.filter(n => keep.has(n.id))
}

export function TreeNode({ n, kids, depth, sel, onSelect, edit, onAdd, onRename, onDel, forceOpen, pathSet, openDepth = 2 }) {
  const has = kids[n.id] && kids[n.id].length
  const [open, setOpen] = useState(depth < openDepth)
  const onPath = pathSet && pathSet.has(n.id)
  // Default view: expand the branch leading to the selected Vuvale (the first one).
  // Depends on the boolean so the user can still collapse a path branch afterwards.
  useEffect(() => { if (onPath) setOpen(true) }, [onPath])
  const isOpen = forceOpen || open
  const selectable = n.level === 'vuvale' && onSelect
  const child = CHILD_NAME[n.level]
  return (
    <li>
      {has
        ? <button className={'caret' + (isOpen ? ' open' : '')} onClick={() => setOpen(o => !o)} aria-label="toggle"><span className="chev">›</span></button>
        : <span className="caret spacer" />}
      <LevelBadge level={n.level} />
      <LevelEn level={n.level} />
      <span className={'nodelabel' + (selectable ? ' clickable' : '') + (sel === n.id ? ' selected' : (onPath ? ' onpath' : ''))}
        onClick={selectable ? () => onSelect(n.id) : undefined}>{n.label}</span>
      {edit && (
        <span className="rowacts">
          <button className="mini" onClick={() => onRename(n)} title="Rename">✎</button>
          {child && <button className="mini" onClick={() => onAdd(n, child)}>+ {child}</button>}
          <button className="mini danger" onClick={() => onDel(n)} title="Archive (retire)">🗑</button>
        </span>
      )}
      {has && isOpen && <ul className="tree">{kids[n.id].map(c => <TreeNode key={c.id} n={c} kids={kids} depth={depth + 1} sel={sel} onSelect={onSelect} edit={edit} onAdd={onAdd} onRename={onRename} onDel={onDel} forceOpen={forceOpen} pathSet={pathSet} openDepth={openDepth} />)}</ul>}
    </li>
  )
}

// Shared loader + node CRUD over /api/nodes
export function useNodes() {
  const [nodes, setNodes] = useState(null)
  const [msg, setMsg] = useState('')
  const load = useCallback(() => get('/hierarchy').then(setNodes), [])
  useEffect(() => { load() }, [load])

  const addNode = async (parent, childName) => {
    const label = window.prompt(`New ${childName} name:`); if (!label) return
    try { await send('POST', '/nodes', { parent_id: parent.id, label }); setMsg('Added ✓') }
    catch (e) { setMsg(e.message || 'Add failed') }
    load()
  }
  const renameNode = async (nd) => {
    const label = window.prompt('Rename to:', nd.label); if (!label || label === nd.label) return
    try { await send('PATCH', '/nodes/' + nd.id, { label }); setMsg('Renamed ✓') }
    catch (e) { setMsg(e.message || 'Rename failed') }
    load()
  }
  const delNode = async (nd, onDeleted) => {
    if (!window.confirm(`Archive "${nd.label}" and everything under and linked to it (efforts, contributions, transactions)?\n\nIt will be hidden from all views but kept for records. Members are not removed.`)) return
    try { await send('DELETE', '/nodes/' + nd.id); setMsg('Archived ✓'); if (onDeleted) onDeleted(nd) }
    catch (e) {
      const m = e.message || 'Delete failed'
      setMsg('⚠ ' + m)
      window.alert(m)   // surface the reason — a buried status line was easy to miss
    }
    load()
  }
  return { nodes, msg, setMsg, load, addNode, renameNode, delNode }
}
