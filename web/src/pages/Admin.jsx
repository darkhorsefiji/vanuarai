import { useEffect, useState } from 'react'
import { useLevels } from '../levels'

export default function Admin() {
  const { list: levelList, refresh } = useLevels()
  const [styles, setStyles] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => { setStyles(levelList.map(s => ({ ...s }))) }, [levelList])
  const updStyle = (i, k, v) => setStyles(arr => arr.map((s, idx) => idx === i ? { ...s, [k]: v } : s))

  async function save() {
    setStatus('Saving…')
    try {
      const r = await fetch('/api/level-styles', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styles: styles.map(s => ({ level: s.level, color: s.color, label: s.label })) }),
      })
      if (r.ok) { setStatus('Saved ✓'); refresh() } else setStatus('Error saving')
    } catch { setStatus('Network error') }
  }

  return (
    <>
      <h1>Village Admin</h1>
      <p className="sub">Portal-wide settings. Records (Profile notes &amp; location, Vanua/Provincial hierarchy, Family composition) are edited <b>inline on their own pages</b> — open the page and use its <b>Edit</b> button.</p>

      <h3>Hierarchy element styling</h3>
      <p className="sub">Set the colour and label for each hierarchy level. Changes apply across the whole portal.</p>
      <div className="lvlgrid">
        {styles.map((s, i) => (
          <div className="lvlrow" key={s.level}>
            <input type="color" value={s.color} onChange={e => updStyle(i, 'color', e.target.value)} />
            <input type="text" value={s.label} onChange={e => updStyle(i, 'label', e.target.value)} />
            <span className="lvl" style={{ background: s.color }}>{s.label}</span>
            <span className="meta">{s.level}</span>
          </div>
        ))}
      </div>
      <div className="savebar">
        <button className="btn" onClick={save}>Save styling</button>
        <span className="status">{status}</span>
      </div>
    </>
  )
}
