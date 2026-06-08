import { useMemo, useState } from 'react'
import { THEME_GROUPS, loadOverrides, setVar, resetVars, ensureFont, fontStack, familyFromStack } from '../theme'
import { GOOGLE_FONTS } from '../googleFonts'

const SYSTEM_FONTS = ['System UI', 'Georgia', 'Arial', 'Times New Roman', 'Courier New', 'Verdana', 'Tahoma']

export default function Dev() {
  const [ov, setOv] = useState(loadOverrides())
  const [fontText, setFontText] = useState({})
  const known = useMemo(() => new Set([...GOOGLE_FONTS, ...SYSTEM_FONTS]), [])
  const options = useMemo(() => [...SYSTEM_FONTS, ...GOOGLE_FONTS], [])

  const change = (k, v) => { setVar(k, v); setOv(o => ({ ...o, [k]: v })) }
  const reset = () => { resetVars(); setOv({}); setFontText({}) }

  function onFont(k, v) {
    setFontText(t => ({ ...t, [k]: v }))
    if (known.has(v)) { ensureFont(v); change(k, fontStack(v)) }
  }

  return (
    <>
      <h1>Developer settings</h1>
      <p className="sub">Live theme editor — changes apply instantly across VanuaRai and persist in this browser. Fonts are the full Google Fonts library (type to search). Use “Reset” to return to the built-in defaults.</p>
      <div className="savebar">
        <button className="btn secondary" onClick={reset}>Reset to defaults</button>
        <span className="status">{Object.keys(ov).length ? `${Object.keys(ov).length} override(s) active` : 'Using defaults'}</span>
      </div>

      <datalist id="gfonts">{options.map(f => <option key={f} value={f} />)}</datalist>

      {THEME_GROUPS.map(g => (
        <div key={g.group}>
          <h3>{g.group}</h3>
          <div className="themegrid">
            {g.items.map(it => {
              const cur = ov[it.k] != null ? ov[it.k] : (it.t === 'range' ? it.d + (it.unit || '') : it.d)
              return (
                <div className="themerow" key={it.k}>
                  <label>{it.l}</label>
                  {it.t === 'color' && <input type="color" value={ov[it.k] || it.d} onChange={e => change(it.k, e.target.value)} />}
                  {it.t === 'range' && <input type="range" min={it.min} max={it.max} step={it.step || 1} value={parseInt(ov[it.k] != null ? ov[it.k] : it.d, 10)} onChange={e => change(it.k, e.target.value + (it.unit || ''))} />}
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
