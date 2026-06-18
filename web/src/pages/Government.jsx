import { useState, useEffect } from 'react'
import { buildTree, filterNodes, TreeNode, useNodes } from '../tree'
import { EditableText } from '../copy'
import { get, send } from '../api'
import { useAuth, isVillageAdmin } from '../auth'
import { PLATFORMS, THRUSTS, PERSPECTIVES, kpisForPlatform } from '../strategy'

// Distinct accent per TAB Platform (1–5).
const PCOLOR = ['var(--deep)', 'var(--sage)', 'var(--clay)', 'var(--logo-green)', 'var(--pop)']

export default function Government() {
  const { user } = useAuth()
  const canEdit = isVillageAdmin(user)   // page-level editing is village_admin tier
  const { nodes, msg, setMsg, load, addNode, renameNode, delNode } = useNodes()
  const [edit, setEdit] = useState(false)
  const [q, setQ] = useState('')
  const [contacts, setContacts] = useState(null)

  const loadContacts = () => get('/gov-contacts').then(setContacts)
  useEffect(() => { loadContacts().catch(() => {}) }, [])
  const updC = (i, k, v) => setContacts(cs => cs.map((c, j) => (j === i ? { ...c, [k]: v } : c)))
  async function saveContact(c) {
    try {
      await send('PATCH', '/gov-contacts/' + c.id, { name: c.name, role: c.role, mobile: c.mobile, office: c.office, email: c.email })
      setMsg('Saved ✓'); loadContacts()
    } catch (e) { setMsg('⚠ ' + e.message) }
  }

  const addSoqosoqo = async () => {
    const label = window.prompt('New Soqosoqo name:'); if (!label) return
    const r = await fetch('/api/soqosoqo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label }) })
    setMsg(r.ok ? 'Added ✓' : 'Add failed'); load()
  }

  if (!nodes) return <p className="loading">Loading…</p>
  // Soqosoqo are parented to the Village node, so include them to render as branches under it.
  const gov = nodes.filter(n => n.axis === 'government' || n.axis === 'soqosoqo')
  const tree = buildTree(filterNodes(gov, q))

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>Government</h1>
          <p className="sub"><EditableText as="span" id="government.sub">Provincial administrative structure — Province → District (Tikina) → Village.</EditableText>{edit ? ' Editing on.' : ''}</p>
        </div>
        <div className="editrow">
          {canEdit && <button className={edit ? 'btn' : 'btn secondary'} onClick={() => setEdit(e => !e)}>{edit ? 'Done' : '✎ Edit'}</button>}
          {msg && <span className="status">{msg}</span>}
        </div>
      </div>

      <div className="cols">
        <div className="col">
          <input className="treesearch" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
          {tree.root
            ? <ul className="tree"><TreeNode n={tree.root} kids={tree.kids} depth={0} edit={edit} onAdd={addNode} onRename={renameNode} onDel={nd => delNode(nd)} forceOpen={!!q.trim()} openDepth={4} /></ul>
            : <p className="meta">No matches.</p>}
          {edit && <button className="btn secondary" style={{ marginTop: 14 }} onClick={addSoqosoqo}>+ Soqosoqo (under Village)</button>}
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Government contacts</h3>
          <p className="sub">Provincial &amp; divisional officers serving the village.</p>
          {!contacts ? <p className="loading">Loading…</p> : contacts.map((c, i) => (
            <div className="card govcontact" key={c.id}>
              <div className="gc-title">{c.title}</div>
              {edit ? (
                <div className="gc-edit">
                  <label>Name<input value={c.name || ''} onChange={e => updC(i, 'name', e.target.value)} /></label>
                  <label>Role<input value={c.role || ''} onChange={e => updC(i, 'role', e.target.value)} /></label>
                  <label>Mobile<input value={c.mobile || ''} onChange={e => updC(i, 'mobile', e.target.value)} /></label>
                  <label>Office<input value={c.office || ''} onChange={e => updC(i, 'office', e.target.value)} /></label>
                  <label>Email<input value={c.email || ''} onChange={e => updC(i, 'email', e.target.value)} /></label>
                  <button className="mini" onClick={() => saveContact(c)}>Save</button>
                </div>
              ) : (
                <>
                  <div className="gc-name">{c.name}</div>
                  <div className="gc-role">{c.role}</div>
                  <div className="gc-rows">
                    <div><span>Mobile</span>{c.mobile ? <a href={'tel:' + c.mobile.replace(/\s/g, '')}>{c.mobile}</a> : <em>—</em>}</div>
                    <div><span>Office</span>{c.office ? <a href={'tel:' + c.office.replace(/\s/g, '')}>{c.office}</a> : <em>—</em>}</div>
                    <div><span>Email</span>{c.email ? <a href={'mailto:' + c.email}>{c.email}</a> : <em>—</em>}</div>
                  </div>
                </>
              )}
            </div>
          ))}
        </aside>
      </div>

      {/* National alignment — the Vanua's Meda Matata Mada KPIs mapped up to the
          TAB Platforms, so the plan aggregates into the government framework. */}
      <h2 className="sc-heading">National alignment · TAB Platforms</h2>
      <p className="sub">Each <a href="/vscorecard">Meda Matata Mada</a> objective maps up to a TAB Platform, so the Vanua’s plan aggregates into the government framework through the Provincial Office. Same KPIs as the VScorecard — grouped here by Platform.</p>

      <div className="tab-legend">
        {PERSPECTIVES.map(p => <span key={p.key}><i style={{ background: p.accent }} />{p.title}</span>)}
      </div>

      <div className="tab-grid">
        {PLATFORMS.map((pf, i) => {
          const kpis = kpisForPlatform(pf.n)
          return (
            <div className="card tab-card" key={pf.n} style={{ '--accent': PCOLOR[i] }}>
              <div className="tab-head">
                <span className="tab-num">Platform {pf.n}</span>
                <span className={'tab-thrust-chip ' + pf.thrust}>{pf.thrust === 'inclusive' ? 'Inclusive' : 'Transformational'}</span>
              </div>
              <h4>{pf.name}</h4>
              {kpis.length
                ? <ul className="tab-kpis">{kpis.map(k => <li key={k.t}><span className="tab-dot" style={{ background: k.accent }} title={k.perspective} />{k.t}</li>)}</ul>
                : <p className="meta tab-gap">No Vanua KPIs map here yet.</p>}
            </div>
          )
        })}
      </div>

      <h3>Government Strategic Priorities</h3>
      <p className="sub">The national priorities each thrust delivers (per the TAB framework).</p>
      <div className="tab-thrusts">
        {THRUSTS.map(t => (
          <div className="card tab-thrust-card" key={t.key}>
            <h4>{t.name}</h4>
            <ul className="tab-prio">{t.priorities.map(p => <li key={p}>{p}</li>)}</ul>
          </div>
        ))}
      </div>
    </>
  )
}
