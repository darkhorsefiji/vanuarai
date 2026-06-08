import { useEffect, useState } from 'react'
import { useData, get } from '../api'
import { LevelBadge } from '../levels'

function buildTree(nodes) {
  const kids = {}
  nodes.forEach(n => { (kids[n.parent_id] = kids[n.parent_id] || []).push(n) })
  Object.values(kids).forEach(a => a.sort((x, y) => x.label.localeCompare(y.label)))
  const ids = new Set(nodes.map(n => n.id))
  const root = nodes.find(n => !n.parent_id || !ids.has(n.parent_id))
  return { kids, root }
}

function Node({ n, kids, depth, onSelect, selected }) {
  const has = kids[n.id] && kids[n.id].length
  const [open, setOpen] = useState(depth < 2)
  const isVuvale = n.level === 'vuvale'
  return (
    <li>
      {has
        ? <button className="caret" onClick={() => setOpen(o => !o)} aria-label="toggle">{open ? '−' : '+'}</button>
        : <span className="caret spacer" />}
      <LevelBadge level={n.level} />
      <span
        className={'nodelabel' + (isVuvale ? ' clickable' : '') + (selected === n.id ? ' selected' : '')}
        onClick={isVuvale ? () => onSelect(n.id) : undefined}
      >{n.label}</span>
      {has && open && <ul className="tree">{kids[n.id].map(c => <Node key={c.id} n={c} kids={kids} depth={depth + 1} onSelect={onSelect} selected={selected} />)}</ul>}
    </li>
  )
}

function Tree({ nodes, onSelect, selected }) {
  const { kids, root } = buildTree(nodes)
  return <ul className="tree">{root && <Node n={root} kids={kids} depth={0} onSelect={onSelect} selected={selected} />}</ul>
}

export default function Hierarchy() {
  const { data: nodes } = useData('/hierarchy')
  const [sel, setSel] = useState(null)
  const [people, setPeople] = useState(null)

  // default-select the first Vuvale once nodes are loaded
  useEffect(() => {
    if (nodes && !sel) {
      const v = nodes.filter(n => n.level === 'vuvale').sort((a, b) => a.label.localeCompare(b.label))[0]
      if (v) setSel(v.id)
    }
  }, [nodes, sel])

  // (re)load the selected family's members
  useEffect(() => {
    if (!sel) return
    setPeople(null)
    get(`/vuvale/${sel}/persons`).then(setPeople)
  }, [sel])

  if (!nodes) return <p className="loading">Loading…</p>
  const trad = nodes.filter(n => n.axis === 'traditional')
  const gov = nodes.filter(n => n.axis === 'government')
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  const vnode = sel ? byId[sel] : null
  const tok = vnode ? byId[vnode.parent_id] : null
  const mat = tok ? byId[tok.parent_id] : null

  return (
    <>
      <h1>Hierarchy</h1>
      <p className="sub">Traditional Vanua lineage and government administrative structure. Use + / − to expand or collapse; click a Vuvale to view its family.</p>
      <div className="cols cols-13">
        <div className="col">
          <h3 style={{ marginTop: 0 }}>Vanua Hierarchy</h3>
          <Tree nodes={trad} onSelect={setSel} selected={sel} />
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Provincial Hierarchy</h3>
          <Tree nodes={gov} onSelect={setSel} selected={sel} />

          <h3 style={{ marginTop: 24 }}>Family (Vuvale) Composition</h3>
          {!vnode ? <p className="sub">Select a Vuvale in the tree.</p> : (
            <div className="card comp">
              <h3>{vnode.label}</h3>
              <div className="meta">{mat?.label} · {tok?.label}</div>
              {!people ? <p className="loading">Loading…</p>
                : people.length === 0 ? <p className="meta" style={{ marginTop: 10 }}>No members recorded.</p>
                  : (
                    <table style={{ marginTop: 12 }}>
                      <tbody>
                        <tr><th>Name</th><th>Gender</th><th>Relationship</th><th>Birth date</th><th>Age</th><th>Death date</th></tr>
                        {people.map(p => (
                          <tr key={p.id}>
                            <td>{p.full_name}{p.is_deceased ? ' †' : ''}</td>
                            <td>{p.gender || ''}</td>
                            <td>{p.relationship || ''}</td>
                            <td>{p.dob || ''}</td>
                            <td>{p.age != null ? p.age : ''}</td>
                            <td>{p.dod || ''}</td>
                          </tr>
                        ))}
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
