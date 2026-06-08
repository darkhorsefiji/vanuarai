import { useState } from 'react'
import { buildTree, filterNodes, TreeNode, useNodes } from '../tree'
import { EditableText } from '../copy'

export default function Government() {
  const { nodes, msg, addNode, renameNode, delNode } = useNodes()
  const [edit, setEdit] = useState(false)
  const [q, setQ] = useState('')

  if (!nodes) return <p className="loading">Loading…</p>
  const gov = nodes.filter(n => n.axis === 'government')
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
    </>
  )
}
