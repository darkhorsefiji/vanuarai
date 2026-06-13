import { useEffect, useState } from 'react'
import { get, send } from './api'

const VALIDITY = ['daily', 'weekly', 'fortnightly', 'monthly']
const blank = () => ({ id: null, name: '', volume_mb: 1024, validity: 'weekly', priceStr: '0', active: true, _dirty: true })

export default function PlansEditor() {
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => get('/plans').then(d => setRows(d.map(p => ({ ...p, priceStr: String(p.price_cents / 100), _dirty: false }))))
  useEffect(() => { load().catch(e => setMsg(e.message)) }, [])

  const upd = (i, k, v) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, [k]: v, _dirty: true } : r)))
  const addRow = () => setRows(rs => [...rs, blank()])

  async function saveRow(i) {
    const r = rows[i]
    if (!r.name.trim()) { setMsg('A plan name is required'); return }
    const body = {
      name: r.name.trim(),
      volume_mb: parseInt(r.volume_mb, 10) || 0,
      validity: r.validity,
      price_cents: Math.round(parseFloat(r.priceStr || '0') * 100),
      active: r.active !== false,
    }
    setBusy(true); setMsg('')
    try {
      if (r.id) await send('PATCH', '/plans/' + r.id, body)
      else await send('POST', '/plans', body)
      await load(); setMsg('Saved ✓')
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setBusy(false) }
  }

  async function delRow(i) {
    const r = rows[i]
    if (!r.id) { setRows(rs => rs.filter((_, j) => j !== i)); return }
    if (!confirm(`Delete plan “${r.name}”?`)) return
    setBusy(true); setMsg('')
    try { await send('DELETE', '/plans/' + r.id); await load(); setMsg('Deleted ✓') }
    catch (e) { setMsg('⚠ ' + e.message) } finally { setBusy(false) }
  }

  if (!rows) return <p className="loading">Loading plans…</p>
  return (
    <div className="plansedit">
      <div className="plansedit-head">
        <span>Name</span><span>Data (MB)</span><span>Validity</span><span>Price ($)</span><span>Active</span><span />
      </div>
      {rows.map((r, i) => (
        <div className={'plansedit-row' + (r._dirty ? ' dirty' : '')} key={r.id || 'new' + i}>
          <input value={r.name} onChange={e => upd(i, 'name', e.target.value)} placeholder="Plan name" />
          <input type="number" min="0" step="1" value={r.volume_mb} onChange={e => upd(i, 'volume_mb', e.target.value)} />
          <select value={r.validity} onChange={e => upd(i, 'validity', e.target.value)}>
            {VALIDITY.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <input type="number" min="0" step="0.5" value={r.priceStr} onChange={e => upd(i, 'priceStr', e.target.value)} />
          <label className="plansedit-active">
            <input type="checkbox" checked={r.active !== false} onChange={e => upd(i, 'active', e.target.checked)} />
          </label>
          <div className="plansedit-actions">
            <button className="btn" disabled={busy} onClick={() => saveRow(i)}>Save</button>
            <button className="mini" disabled={busy} onClick={() => delRow(i)}>Delete</button>
          </div>
        </div>
      ))}
      <div className="plansedit-foot">
        <button className="btn secondary" onClick={addRow}>+ Add plan</button>
        <span className="plansedit-hint">Tip: 1 GB = 1024 MB. Price is in dollars.</span>
        {msg && <span className="status">{msg}</span>}
      </div>
    </div>
  )
}
