import { useData } from '../api'

function buildTree(nodes) {
  const kids = {}
  nodes.forEach(n => { (kids[n.parent_id] = kids[n.parent_id] || []).push(n) })
  Object.values(kids).forEach(a => a.sort((x, y) => x.label.localeCompare(y.label)))
  const ids = new Set(nodes.map(n => n.id))
  const root = nodes.find(n => !n.parent_id || !ids.has(n.parent_id))
  return { kids, root }
}

function Node({ n, kids }) {
  return (
    <li>
      <span className={'lvl ' + n.level}>{n.level}</span>{n.label}
      {kids[n.id] && <ul className="tree">{kids[n.id].map(c => <Node key={c.id} n={c} kids={kids} />)}</ul>}
    </li>
  )
}

function Tree({ nodes }) {
  const { kids, root } = buildTree(nodes)
  return <ul className="tree">{root && <Node n={root} kids={kids} />}</ul>
}

export default function Hierarchy() {
  const { data: nodes } = useData('/hierarchy')
  const { data: comp } = useData('/composition')
  if (!nodes) return <p className="loading">Loading…</p>
  const trad = nodes.filter(n => n.axis === 'traditional')
  const gov = nodes.filter(n => n.axis === 'government')

  return (
    <>
      <h1>Hierarchy</h1>
      <p className="sub">The village seen two ways — the traditional Vanua lineage and the government administrative structure. Public view shows structure only.</p>
      <div className="cols">
        <div className="col">
          <h3 style={{ marginTop: 0 }}>Vanua Hierarchy</h3>
          <Tree nodes={trad} />
        </div>
        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Provincial Hierarchy</h3>
          <Tree nodes={gov} />

          <h3 style={{ marginTop: 24 }}>Vuvale Composition</h3>
          {!comp ? <p className="loading">Loading…</p> : comp.map((v, i) => (
            <div className="card comp" key={i}>
              <h3>{v.vuvale}</h3>
              <div className="meta">{v.mataqali} · {v.tokatoka}</div>
              <ul className="people">
                {v.persons.map((p, j) => (
                  <li key={j}>
                    <span>{p.name}</span>
                    <span className="meta">{p.relationship}{p.yob ? ` · b.${p.yob}` : ''}{p.deceased ? ' · †' : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>
      </div>
    </>
  )
}
