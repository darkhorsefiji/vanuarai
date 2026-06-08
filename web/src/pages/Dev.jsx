import { useState } from 'react'
import { THEME_GROUPS, FONT_OPTIONS, loadOverrides, setVar, resetVars } from '../theme'

export default function Dev() {
  const [ov, setOv] = useState(loadOverrides())
  const change = (k, v) => { setVar(k, v); setOv(o => ({ ...o, [k]: v })) }
  const reset = () => { resetVars(); setOv({}) }

  const display = (it, cur) => {
    if (it.t === 'font') {
      const m = FONT_OPTIONS.find(([, v]) => v === cur)
      return m ? m[0] : cur.split(',')[0].replace(/"/g, '')
    }
    return cur
  }

  return (
    <>
      <h1>Developer settings</h1>
      <p className="sub">Live theme editor — changes apply instantly across VanuaRai and persist in this browser. Use “Reset” to return to the built-in defaults.</p>
      <div className="savebar">
        <button className="btn secondary" onClick={reset}>Reset to defaults</button>
        <span className="status">{Object.keys(ov).length ? `${Object.keys(ov).length} override(s) active` : 'Using defaults'}</span>
      </div>

      {THEME_GROUPS.map(g => (
        <div key={g.group}>
          <h3>{g.group}</h3>
          <div className="themegrid">
            {g.items.map(it => {
              const cur = ov[it.k] != null ? ov[it.k] : (it.t === 'range' ? it.d + (it.unit || '') : it.d)
              return (
                <div className="themerow" key={it.k}>
                  <label>{it.l}</label>
                  {it.t === 'color' && (
                    <input type="color" value={ov[it.k] || it.d} onChange={e => change(it.k, e.target.value)} />
                  )}
                  {it.t === 'range' && (
                    <input type="range" min={it.min} max={it.max}
                      value={parseInt(ov[it.k] != null ? ov[it.k] : it.d, 10)}
                      onChange={e => change(it.k, e.target.value + (it.unit || ''))} />
                  )}
                  {it.t === 'font' && (
                    <select value={cur} onChange={e => change(it.k, e.target.value)} style={{ flex: 1, minWidth: 0 }}>
                      {FONT_OPTIONS.map(([name, stack]) => <option key={name} value={stack}>{name}</option>)}
                    </select>
                  )}
                  <code className="themeval">{display(it, cur)}</code>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}
