import { useState } from 'react'
import { buildTree, filterNodes, TreeNode, useNodes } from '../tree'
import { EditableText } from '../copy'

export default function Government() {
  const { nodes, msg, setMsg, load, addNode, renameNode, delNode } = useNodes()
  const [edit, setEdit] = useState(false)
  const [q, setQ] = useState('')

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
          <button className={edit ? 'btn' : 'btn secondary'} onClick={() => setEdit(e => !e)}>{edit ? 'Done' : '✎ Edit'}</button>
          {msg && <span className="status">{msg}</span>}
        </div>
      </div>

      <input className="treesearch" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
      {tree.root
        ? <ul className="tree"><TreeNode n={tree.root} kids={tree.kids} depth={0} edit={edit} onAdd={addNode} onRename={renameNode} onDel={nd => delNode(nd)} forceOpen={!!q.trim()} openDepth={4} /></ul>
        : <p className="meta">No matches.</p>}

      {edit && <button className="btn secondary" style={{ marginTop: 14 }} onClick={addSoqosoqo}>+ Soqosoqo (under Village)</button>}
    </>
  )
}
