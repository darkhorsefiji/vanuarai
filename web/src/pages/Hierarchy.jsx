import { useEffect, useState } from 'react'
import { get } from '../api'
import { LevelBadge } from '../levels'

const CHILD_NAME = {
  vanua: 'Yavusa', yavusa: 'Mataqali', mataqali: 'Tokatoka', tokatoka: 'Vuvale',
  provincial_council: 'District', district: 'Village',
}
const BLANK = { full_name: '', gender: '', relationship: '', dob: '', dod: '' }

function buildTree(nodes) {
  const kids = {}
  nodes.forEach(n => { (kids[n.parent_id] = kids[n.parent_id] || []).push(n) })
  Object.values(kids).forEach(a => a.sort((x, y) => x.label.localeCompare(y.label)))
  const ids = new Set(nodes.map(n => n.id))
  const root = nodes.find(n => !n.parent_id || !ids.has(n.parent_id))
  return { kids, root }
}

function Node({ n, kids, depth, sel, onSelect, edit, onAdd, onRename, onDel }) {
  const has = kids[n.id] && kids[n.id].length
  const [open, setOpen] = useState(depth < 2)
  const isVuvale = n.level === 'vuvale'
  const child = CHILD_NAME[n.level]
  return (
    <li>
      {has
        ? <button className="caret" onClick={() => setOpen(o => !o)} aria-label="toggle">{open ? '−' : '+'}</button>
        : <span className="caret spacer" />}
      <LevelBadge level={n.level} />
      <span className={'nodelabel' + (isVuvale ? ' clickable' : '') + (sel === n.id ? ' selected' : '')}
        onClick={isVuvale ? () => onSelect(n.id) : undefined}>{n.label}</span>
      {edit && (
        <span className="rowacts">
          <button className="mini" onClick={() => onRename(n)} title="Rename">✎</button>
          {child && <button className="mini" onClick={() => onAdd(n, child)}>+ {child}</button>}
          <button className="mini danger" onClick={() => onDel(n)} title="Delete">🗑</button>
        </span>
      )}
      {has && open && <ul className="tree">{kids[n.id].map(c => <Node key={c.id} n={c} kids={kids} depth={depth + 1} sel={sel} onSelect={onSelect} edit={edit} onAdd={onAdd} onRename={onRename} onDel={onDel} />)}</ul>}
    </li>
  )
}

function GenderSelect({ value, onChange }) {
  return (
    <select value={value || ''} onChange={onChange} style={{ width: '100%' }}>
      <option value="">—</option><option value="Male">Male</option><option value="Female">Female</option>
    </select>
  )
}

export default function Hierarchy() {
  const [nodes, setNodes] = useState(null)
  const [sel, setSel] = useState(null)
  const [people, setPeople] = useState(null)
  const [edit, setEdit] = useState(false)
  const [add, setAdd] = useState(BLANK)
  const [msg, setMsg] = useState('')

  const loadNodes = () => get('/hierarchy').then(setNodes)
  useEffect(() => { loadNodes() }, [])
  useEffect(() => {
    if (nodes && !sel) {
      const v = nodes.filter(n => n.level === 'vuvale').sort((a, b) => a.label.localeCompare(b.label))[0]
      if (v) setSel(v.id)
    }
  }, [nodes, sel])
  const loadPeople = id => get(`/vuvale/${id}/persons`).then(setPeople)
  useEffect(() => { if (sel) { setPeople(null); loadPeople(sel) } }, [sel])

  // ---- node CRUD ----
  async function onAdd(parent, childName) {
    const label = window.prompt(`New ${childName} name:`); if (!label) return
    const r = await fetch('/api/nodes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parent_id: parent.id, label }) })
    setMsg(r.ok ? 'Added ✓' : 'Add failed'); loadNodes()
  }
  async function onRename(nd) {
    const label = window.prompt('Rename to:', nd.label); if (!label || label === nd.label) return
    const r = await fetch('/api/nodes/' + nd.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) })
    setMsg(r.ok ? 'Renamed ✓' : 'Rename failed'); loadNodes()
  }
  async function onDel(nd) {
    if (!window.confirm(`Delete "${nd.label}"?`)) return
    const r = await fetch('/api/nodes/' + nd.id, { method: 'DELETE' }); const j = await r.json().catch(() => ({}))
    setMsg(r.ok ? 'Deleted ✓' : (j.error || 'Delete failed'))
    if (r.ok && sel === nd.id) setSel(null)
    loadNodes()
  }

  // ---- person CRUD ----
  const body = p => ({ full_name: p.full_name, gender: p.gender || null, relationship: p.relationship, date_of_birth: p.dob || null, date_of_death: p.dod || null })
  const updP = (i, k, v) => setPeople(arr => arr.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  async function savePerson(p) { const r = await fetch('/api/persons/' + p.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body(p)) }); setMsg(r.ok ? 'Saved ✓' : 'Error'); if (r.ok) loadPeople(sel) }
  async function delPerson(p) { if (!window.confirm(`Remove ${p.full_name}?`)) return; await fetch('/api/persons/' + p.id, { method: 'DELETE' }); setMsg('Removed ✓'); loadPeople(sel) }
  async function addPerson() { if (!add.full_name) return; const r = await fetch('/api/persons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vuvale_node_id: sel, ...body(add) }) }); if (r.ok) { setAdd(BLANK); loadPeople(sel); setMsg('Added ✓') } else setMsg('Error') }

  if (!nodes) return <p className="loading">Loading…</p>
  const trad = nodes.filter(n => n.axis === 'traditional')
  const gov = nodes.filter(n => n.axis === 'government')
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const vnode = sel ? byId[sel] : null
  const tok = vnode ? byId[vnode.parent_id] : null
  const mat = tok ? byId[tok.parent_id] : null
  const tradTree = buildTree(trad), govTree = buildTree(gov)

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Hierarchy</h1>
          <p className="sub">Use + / − to expand; click a Vuvale to view its family.{edit ? ' Editing on — add / rename / delete nodes and members.' : ''}</p>
        </div>
        <div className="editrow">
          <button className={edit ? 'btn' : 'btn secondary'} onClick={() => setEdit(e => !e)}>{edit ? 'Done' : '✎ Edit'}</button>
          {msg && <span className="status">{msg}</span>}
        </div>
      </div>

      <div className="cols cols-13">
        <div className="col">
          <h3 style={{ marginTop: 0 }}>Vanua Hierarchy</h3>
          <ul className="tree">{tradTree.root && <Node n={tradTree.root} kids={tradTree.kids} depth={0} sel={sel} onSelect={setSel} edit={edit} onAdd={onAdd} onRename={onRename} onDel={onDel} />}</ul>
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Provincial Hierarchy</h3>
          <ul className="tree">{govTree.root && <Node n={govTree.root} kids={govTree.kids} depth={0} sel={sel} onSelect={setSel} edit={edit} onAdd={onAdd} onRename={onRename} onDel={onDel} />}</ul>

          <h3 style={{ marginTop: 24 }}>Family (Vuvale) Composition</h3>
          {!vnode ? <p className="sub">Select a Vuvale in the tree.</p> : (
            <div className="card comp">
              <h3>{vnode.label}</h3>
              <div className="meta">{mat?.label} · {tok?.label}</div>
              {!people ? <p className="loading">Loading…</p> : (
                <table style={{ marginTop: 12 }}>
                  <tbody>
                    <tr><th>Name</th><th>Gender</th><th>Relationship</th><th>Birth date</th><th>Age</th><th>Death date</th>{edit && <th></th>}</tr>
                    {people.map((p, i) => edit ? (
                      <tr key={p.id}>
                        <td><input value={p.full_name || ''} onChange={e => updP(i, 'full_name', e.target.value)} /></td>
                        <td><GenderSelect value={p.gender} onChange={e => updP(i, 'gender', e.target.value)} /></td>
                        <td><input value={p.relationship || ''} onChange={e => updP(i, 'relationship', e.target.value)} /></td>
                        <td><input type="date" value={p.dob || ''} onChange={e => updP(i, 'dob', e.target.value)} /></td>
                        <td className="meta">{p.age != null ? p.age : ''}</td>
                        <td><input type="date" value={p.dod || ''} onChange={e => updP(i, 'dod', e.target.value)} /></td>
                        <td className="rowacts"><button className="mini" onClick={() => savePerson(p)}>Save</button><button className="mini danger" onClick={() => delPerson(p)}>🗑</button></td>
                      </tr>
                    ) : (
                      <tr key={p.id}>
                        <td>{p.full_name}{p.is_deceased ? ' †' : ''}</td>
                        <td>{p.gender || ''}</td>
                        <td>{p.relationship || ''}</td>
                        <td>{p.dob || ''}</td>
                        <td>{p.age != null ? p.age : ''}</td>
                        <td>{p.dod || ''}</td>
                      </tr>
                    ))}
                    {edit && (
                      <tr>
                        <td><input placeholder="Add name" value={add.full_name} onChange={e => setAdd({ ...add, full_name: e.target.value })} /></td>
                        <td><GenderSelect value={add.gender} onChange={e => setAdd({ ...add, gender: e.target.value })} /></td>
                        <td><input placeholder="Relationship" value={add.relationship} onChange={e => setAdd({ ...add, relationship: e.target.value })} /></td>
                        <td><input type="date" value={add.dob} onChange={e => setAdd({ ...add, dob: e.target.value })} /></td>
                        <td className="meta">—</td>
                        <td><input type="date" value={add.dod} onChange={e => setAdd({ ...add, dod: e.target.value })} /></td>
                        <td><button className="mini" onClick={addPerson}>+ Add</button></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
