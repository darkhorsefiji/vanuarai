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
  const gov = nodes.filter(n => n.axis === 'government')
  const soqo = nodes.filter(n => n.axis === 'soqosoqo').sort((a, b) => a.label.localeCompare(b.label))
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
        ? <ul className="tree"><TreeNode n={tree.root} kids={tree.kids} depth={0} edit={edit} onAdd={addNode} onRename={renameNode} onDel={nd => delNode(nd)} forceOpen={!!q.trim()} /></ul>
        : <p className="meta">No matches.</p>}

      <h3 style={{ marginTop: 26 }}>Soqosoqo</h3>
      <p className="sub">Community bodies that cross-cut the village — women’s, youth and fellowship groups.</p>
      <div className="soqolist">
        {soqo.map(s => (
          <span className="soqochip" key={s.id}>
            <span>{s.label}</span>
            {edit && (
              <span className="soqochip-acts">
                <button className="mini" title="Rename" onClick={() => renameNode(s)}>✎</button>
                <button className="mini danger" title="Delete" onClick={() => delNode(s)}>🗑</button>
              </span>
            )}
          </span>
        ))}
        {soqo.length === 0 && <span className="meta">None yet.</span>}
        {edit && <button className="btn secondary soqoadd" onClick={addSoqosoqo}>+ Soqosoqo</button>}
      </div>
    </>
  )
}
