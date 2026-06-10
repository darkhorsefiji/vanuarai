import { useMemo, useState } from 'react'
import { THEME_GROUPS, loadOverrides, setVar, resetVars, ensureFont, fontStack, familyFromStack } from '../theme'
import { GOOGLE_FONTS } from '../googleFonts'
import { ICON_SETS, ICON_ITEMS, Icon, useIconSet } from '../icons'
import PlansEditor from '../PlansEditor'

const SYSTEM_FONTS = ['System UI', 'Georgia', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma']
const ORDER_KEY = 'vr_theme_order'
const loadOrder = () => { try { return JSON.parse(localStorage.getItem(ORDER_KEY)) || {} } catch { return {} } }
const saveOrder = o => localStorage.setItem(ORDER_KEY, JSON.stringify(o))

export default function Dev() {
  const [ov, setOv] = useState(loadOverrides())
  const [fontText, setFontText] = useState({})
  const [order, setOrder] = useState(loadOrder())
  const [drag, setDrag] = useState(null)   // { group, key }
  const [over, setOver] = useState(null)    // key currently hovered
  const known = useMemo(() => new Set([...GOOGLE_FONTS, ...SYSTEM_FONTS]), [])
  const options = useMemo(() => [...SYSTEM_FONTS, ...GOOGLE_FONTS], [])

  const iconSet = useIconSet()
  const change = (k, v) => { setVar(k, v); setOv(o => ({ ...o, [k]: v })) }
  const reset = () => { resetVars(); setOv({}); setFontText({}); localStorage.removeItem(ORDER_KEY); setOrder({}) }

  function onFont(k, v) {
    setFontText(t => ({ ...t, [k]: v }))
    if (known.has(v)) { ensureFont(v); change(k, fontStack(v)) }
  }

  // items for a group in the user's saved order (new items appended)
  function orderedItems(g) {
    const keys = order[g.group]
    if (!keys) return g.items
    const byKey = Object.fromEntries(g.items.map(it => [it.k, it]))
    const seen = new Set(), out = []
    keys.forEach(k => { if (byKey[k] && !seen.has(k)) { out.push(byKey[k]); seen.add(k) } })
    g.items.forEach(it => { if (!seen.has(it.k)) out.push(it) })
    return out
  }

  function onDrop(g, targetKey) {
    if (!drag || drag.group !== g.group || drag.key === targetKey) { setDrag(null); setOver(null); return }
    const cur = orderedItems(g).map(it => it.k)
    cur.splice(cur.indexOf(drag.key), 1)
    cur.splice(cur.indexOf(targetKey), 0, drag.key)
    const next = { ...order, [g.group]: cur }
    setOrder(next); saveOrder(next); setDrag(null); setOver(null)
  }

  return (
    <>
      <div className="pagetop">
        <h1>Developer settings</h1>
        <p className="sub">Live theme editor — changes apply instantly across VanuaRai and persist in this browser. Drag the ⠿ handle to reorder cards within a section. Use “Reset” to return to the built-in defaults &amp; order.</p>
      </div>
      <div className="savebar">
        <button className="btn secondary" onClick={reset}>Reset to defaults</button>
        <span className="status">{Object.keys(ov).length ? `${Object.keys(ov).length} override(s) active` : 'Using defaults'}</span>
      </div>

      <datalist id="gfonts">{options.map(f => <option key={f} value={f} />)}</datalist>

      <h3>Sidebar icon set</h3>
      <div className="iconsets">
        {Object.entries(ICON_SETS).map(([id, s]) => {
          const active = iconSet?.setId === id
          return (
            <div key={id} className={'iconset-card' + (active ? ' on' : '')} onClick={() => iconSet?.choose(id)}>
              <div className="iconset-top">
                <label className="iconset-radio">
                  <input type="radio" name="iconset" checked={active} onChange={() => iconSet?.choose(id)} />
                  <b>{s.label}</b>
                </label>
                <span className="iconset-hint">{s.hint}</span>
              </div>
              <div className="iconset-grid">
                {ICON_ITEMS.map(([key, lbl]) => (
                  <div className="iconset-cell" key={key} title={lbl}>
                    <Icon name={key} set={id} size={26} />
                    <span>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <h3>Internet plans</h3>
      <p className="sub">Configure the plans &amp; pricing shown on the Internet page. Saved to the database — changes are live for everyone. Inactive plans stay hidden from buyers.</p>
      <PlansEditor />

      {THEME_GROUPS.map(g => (
        <div key={g.group}>
          <h3>{g.group}</h3>
          <div className="themegrid">
            {orderedItems(g).map(it => {
              const cur = ov[it.k] != null ? ov[it.k] : (it.t === 'range' ? it.d + (it.unit || '') : it.d)
              const cls = 'themerow' + (drag && drag.key === it.k ? ' dragging' : '') + (over === it.k && drag && drag.key !== it.k ? ' over' : '')
              return (
                <div className={cls} key={it.k}
                  onDragOver={e => e.preventDefault()}
                  onDragEnter={() => setOver(it.k)}
                  onDrop={() => onDrop(g, it.k)}>
                  <span className="draghandle" draggable
                    onDragStart={() => setDrag({ group: g.group, key: it.k })}
                    onDragEnd={() => { setDrag(null); setOver(null) }}
                    title="Drag to reorder">⠿</span>
                  <label>{it.l}</label>
                  {it.t === 'color' && <input type="color" value={ov[it.k] || it.d} onChange={e => change(it.k, e.target.value)} />}
                  {it.t === 'range' && <input type="range" min={it.min} max={it.max} step={it.step || 1} value={parseFloat(ov[it.k] != null ? ov[it.k] : it.d)} onChange={e => change(it.k, e.target.value + (it.unit || ''))} />}
                  {it.t === 'toggle' && <input type="checkbox" checked={(ov[it.k] || it.d) === it.on} onChange={e => change(it.k, e.target.checked ? it.on : 'normal')} />}
                  {it.t === 'font' && <input className="fontinput" list="gfonts" placeholder="Search fonts…" value={fontText[it.k] ?? familyFromStack(cur)} onChange={e => onFont(it.k, e.target.value)} />}
                  {it.t !== 'font' && <code className="themeval">{cur}</code>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
