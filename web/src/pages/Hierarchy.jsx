import { useEffect, useState } from 'react'
import { get } from '../api'
import { buildTree, filterNodes, TreeNode, useNodes } from '../tree'

const BLANK = { full_name: '', gender: '', relationship: '', dob: '', dod: '' }

function GenderSelect({ value, onChange }) {
  return (
    <select value={value || ''} onChange={onChange} style={{ width: '100%' }}>
      <option value="">—</option><option value="Male">Male</option><option value="Female">Female</option>
    </select>
  )
}

export default function Hierarchy() {
  const { nodes, msg, setMsg, addNode, renameNode, delNode } = useNodes()
  const [sel, setSel] = useState(null)
  const [people, setPeople] = useState(null)
  const [edit, setEdit] = useState(false)
  const [add, setAdd] = useState(BLANK)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (nodes && !sel) {
      const v = nodes.filter(n => n.level === 'vuvale').sort((a, b) => a.label.localeCompare(b.label))[0]
      if (v) setSel(v.id)
    }
  }, [nodes, sel])
  const loadPeople = id => get(`/vuvale/${id}/persons`).then(setPeople)
  useEffect(() => { if (sel) { setPeople(null); loadPeople(sel) } }, [sel])

  const onDel = nd => delNode(nd, d => { if (sel === d.id) setSel(null) })

  const pbody = p => ({ full_name: p.full_name, gender: p.gender || null, relationship: p.relationship, date_of_birth: p.dob || null, date_of_death: p.dod || null })
  const updP = (i, k, v) => setPeople(arr => arr.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  async function savePerson(p) { const r = await fetch('/api/persons/' + p.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pbody(p)) }); setMsg(r.ok ? 'Saved ✓' : 'Error'); if (r.ok) loadPeople(sel) }
  async function delPerson(p) { if (!window.confirm(`Remove ${p.full_name}?`)) return; await fetch('/api/persons/' + p.id, { method: 'DELETE' }); setMsg('Removed ✓'); loadPeople(sel) }
  async function addPerson() { if (!add.full_name) return; const r = await fetch('/api/persons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vuvale_node_id: sel, ...pbody(add) }) }); if (r.ok) { setAdd(BLANK); loadPeople(sel); setMsg('Added ✓') } else setMsg('Error') }

  if (!nodes) return <p className="loading">Loading…</p>
  const trad = nodes.filter(n => n.axis === 'traditional')
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const vnode = sel ? byId[sel] : null
  const tok = vnode ? byId[vnode.parent_id] : null
  const mat = tok ? byId[tok.parent_id] : null
  const pathSet = new Set()
  if (vnode) { let x = vnode; while (x) { pathSet.add(x.id); x = byId[x.parent_id] } }
  const tree = buildTree(filterNodes(trad, q))

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Vanua</h1>
          <p className="sub">Traditional lineage. Click a Vuvale to view its family.{edit ? ' Editing on.' : ''}</p>
        </div>
        <div className="editrow">
          <button className={edit ? 'btn' : 'btn secondary'} onClick={() => setEdit(e => !e)}>{edit ? 'Done' : '✎ Edit'}</button>
          {msg && <span className="status">{msg}</span>}
        </div>
      </div>

      <div className="cols cols-13">
        <div className="col">
          <input className="treesearch" placeholder="Search the tree…" value={q} onChange={e => setQ(e.target.value)} />
          {tree.root
            ? <ul className="tree"><TreeNode n={tree.root} kids={tree.kids} depth={0} sel={sel} onSelect={setSel} edit={edit} onAdd={addNode} onRename={renameNode} onDel={onDel} forceOpen={!!q.trim()} pathSet={pathSet} /></ul>
            : <p className="meta">No matches.</p>}
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Family (Vuvale) Composition</h3>
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
