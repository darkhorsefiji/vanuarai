import { useData } from '../api'

function Node({ n, kids }) {
  return (
    <li>
      <span className={'lvl ' + n.level}>{n.level}</span>{n.label}
      {kids[n.id] && <ul className="tree">{kids[n.id].map(c => <Node key={c.id} n={c} kids={kids} />)}</ul>}
    </li>
  )
}

export default function Hierarchy() {
  const { data } = useData('/hierarchy')
  if (!data) return <p className="loading">Loading…</p>
  const kids = {}
  data.forEach(n => { (kids[n.parent_id] = kids[n.parent_id] || []).push(n) })
  Object.values(kids).forEach(a => a.sort((x, y) => x.label.localeCompare(y.label)))
  const root = data.find(n => !n.parent_id)
  return (
    <>
      <h1>Vanua Hierarchy</h1>
      <p className="sub">Public view — structure only. Office-holder names appear once you sign in as a member.</p>
      <ul className="tree">{root && <Node n={root} kids={kids} />}</ul>
    </>
  )
}
