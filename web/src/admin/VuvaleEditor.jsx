import { useEffect, useState } from 'react'
import { get } from '../api'

const BLANK = { full_name: '', gender: '', relationship: '', dob: '', dod: '' }

function GenderSelect({ value, onChange }) {
  return (
    <select value={value || ''} onChange={onChange} style={{ width: '100%' }}>
      <option value="">—</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
    </select>
  )
}

export default function VuvaleEditor() {
  const [vuvales, setVuvales] = useState([])
  const [sel, setSel] = useState('')
  const [people, setPeople] = useState([])
  const [add, setAdd] = useState(BLANK)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    get('/hierarchy').then(all => {
      const v = all.filter(n => n.level === 'vuvale').sort((a, b) => a.label.localeCompare(b.label))
      setVuvales(v)
      if (v[0]) setSel(v[0].id)
    })
  }, [])

  const loadPeople = id => get(`/vuvale/${id}/persons`).then(setPeople)
  useEffect(() => { if (sel) loadPeople(sel) }, [sel])

  const updP = (i, k, v) => setPeople(arr => arr.map((p, idx) => idx === i ? { ...p, [k]: v } : p))
  const body = p => ({ full_name: p.full_name, gender: p.gender || null, relationship: p.relationship, date_of_birth: p.dob || null, date_of_death: p.dod || null })

  async function savePerson(p) {
    const r = await fetch('/api/persons/' + p.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body(p)) })
    setMsg(r.ok ? 'Saved ✓' : 'Error'); if (r.ok) loadPeople(sel)
  }
  async function delPerson(p) {
    if (!window.confirm(`Remove ${p.full_name}?`)) return
    await fetch('/api/persons/' + p.id, { method: 'DELETE' })
    setMsg('Removed ✓'); loadPeople(sel)
  }
  async function addPerson() {
    if (!add.full_name) return
    const r = await fetch('/api/persons', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vuvale_node_id: sel, ...body(add) }),
    })
    if (r.ok) { setAdd(BLANK); loadPeople(sel); setMsg('Added ✓') } else setMsg('Error')
  }

  return (
    <div>
      <h3 style={{ marginTop: 28 }}>Vuvale details</h3>
      <p className="sub">Select a family and edit its members.</p>
      <div className="field" style={{ maxWidth: 320 }}>
        <label>Vuvale</label>
        <select value={sel} onChange={e => setSel(e.target.value)}>
          {vuvales.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>
      <table>
        <tbody>
          <tr><th>Name</th><th>Gender</th><th>Relationship</th><th>Birth date</th><th>Age</th><th>Death date</th><th></th></tr>
          {people.map((p, i) => (
            <tr key={p.id}>
              <td><input value={p.full_name || ''} onChange={e => updP(i, 'full_name', e.target.value)} /></td>
              <td><GenderSelect value={p.gender} onChange={e => updP(i, 'gender', e.target.value)} /></td>
              <td><input value={p.relationship || ''} onChange={e => updP(i, 'relationship', e.target.value)} /></td>
              <td><input type="date" value={p.dob || ''} onChange={e => updP(i, 'dob', e.target.value)} /></td>
              <td className="meta">{p.age != null ? p.age : ''}</td>
              <td><input type="date" value={p.dod || ''} onChange={e => updP(i, 'dod', e.target.value)} /></td>
              <td className="rowacts">
                <button className="mini" onClick={() => savePerson(p)}>Save</button>
                <button className="mini danger" onClick={() => delPerson(p)}>🗑</button>
              </td>
            </tr>
          ))}
          <tr>
            <td><input placeholder="Add name" value={add.full_name} onChange={e => setAdd({ ...add, full_name: e.target.value })} /></td>
            <td><GenderSelect value={add.gender} onChange={e => setAdd({ ...add, gender: e.target.value })} /></td>
            <td><input placeholder="Relationship" value={add.relationship} onChange={e => setAdd({ ...add, relationship: e.target.value })} /></td>
            <td><input type="date" value={add.dob} onChange={e => setAdd({ ...add, dob: e.target.value })} /></td>
            <td className="meta">—</td>
            <td><input type="date" value={add.dod} onChange={e => setAdd({ ...add, dod: e.target.value })} /></td>
            <td><button className="mini" onClick={addPerson}>+ Add</button></td>
          </tr>
        </tbody>
      </table>
      {msg && <p className="status">{msg}</p>}
    </div>
  )
}
