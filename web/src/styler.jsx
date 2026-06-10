// DEV Style mode: in-page theming. Toggle on, hover highlights themeable
// elements, click one and a popover with that element's theme controls opens
// beside it — changes apply live via the same CSS-variable mechanism as /dev.
import { useEffect, useRef, useState } from 'react'
import { THEME_GROUPS, loadOverrides, setVar, clearVars, ensureFont, fontStack, familyFromStack } from './theme'
import { GOOGLE_FONTS } from './googleFonts'
import { useAuth } from './auth'

// Most-specific first: the first selector that matches via closest() wins.
const TARGETS = [
  { sel: '.lchip, .pill', group: 'Status pills' },
  { sel: '.bar', group: 'Progress bars' },
  { sel: 'header.top .badge', group: 'Village badge' },
  { sel: '.rolepill', group: 'Role pill' },
  { sel: 'header.top nav a', group: 'Nav links' },
  { sel: '.btn, .paybtn, .mini', group: 'Buttons' },
  { sel: '.hero, .profilehero', group: 'Welcome banner' },
  { sel: '.card, .postbox, .checkout', group: 'Cards' },
  { sel: '.sidebar', group: 'Sidebar' },
  { sel: 'header.top', group: 'Top navigation' },
  { sel: 'h1, h2, h3, p, td, th, li, label, b, span', group: 'Typography' },
  { sel: 'main', group: 'Surfaces & accents' },
]

const groupByName = name => THEME_GROUPS.find(g => g.group === name)

function findTarget(el) {
  if (!el || el.closest('.styler-pop, .devedit-fab, .devstyle-fab, .styler-hint')) return null
  for (const t of TARGETS) {
    const hit = el.closest(t.sel)
    if (hit && groupByName(t.group)) return { group: t.group, el: hit }
  }
  return null
}

function Control({ it, value, onChange }) {
  const [fontText, setFontText] = useState(null)
  if (it.t === 'color') return <input type="color" value={value || it.d} onChange={e => onChange(e.target.value)} />
  if (it.t === 'range') return (
    <span className="styler-range">
      <input type="range" min={it.min} max={it.max} step={it.step || 1}
        value={parseFloat(value != null ? value : it.d)} onChange={e => onChange(e.target.value + (it.unit || ''))} />
      <code>{value != null ? value : it.d + (it.unit || '')}</code>
    </span>
  )
  if (it.t === 'toggle') return <input type="checkbox" checked={(value || it.d) === it.on} onChange={e => onChange(e.target.checked ? it.on : 'normal')} />
  if (it.t === 'font') return (
    <input className="fontinput" list="gfonts-styler" placeholder="Search fonts…"
      value={fontText ?? familyFromStack(value || it.d)}
      onChange={e => {
        setFontText(e.target.value)
        if (GOOGLE_FONTS.includes(e.target.value)) { ensureFont(e.target.value); onChange(fontStack(e.target.value)) }
      }} />
  )
  return null
}

export default function DevStyler() {
  const auth = useAuth()
  const official = !!auth?.user && (auth.user.isAppAdmin || auth.user.role === 'official')
  const [on, setOn] = useState(false)
  const [pop, setPop] = useState(null)        // { group }
  const [pos, setPos] = useState({ x: 0, y: 0, dragged: false })
  const [, bump] = useState(0)                 // re-render after setVar
  const hovered = useRef(null)
  const popRef = useRef(null)
  const pinned = useRef(false)                 // once dragged, keep the box where the user put it
  const selected = useRef(null)                // the element being styled (solid highlight)

  const clearSelected = () => { selected.current?.classList.remove('style-selected'); selected.current = null }
  const close = () => { setPop(null); pinned.current = false; clearSelected() }

  function startDrag(e) {
    if (e.target.closest('button, input, select')) return
    const r = popRef.current.getBoundingClientRect()
    const off = { dx: e.clientX - r.left, dy: e.clientY - r.top }
    document.body.classList.add('styler-dragging')
    const move = ev => {
      pinned.current = true
      setPos({ x: ev.clientX - off.dx, y: ev.clientY - off.dy, dragged: true })
    }
    const up = () => {
      document.body.classList.remove('styler-dragging')
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    e.preventDefault()
  }

  // hover highlight + click-to-open (capture phase so we beat links/buttons)
  useEffect(() => {
    if (!on || !official) { document.body.classList.remove('styling'); return }
    document.body.classList.add('styling')
    const over = e => {
      const t = findTarget(e.target)
      if (hovered.current && hovered.current !== t?.el) hovered.current.classList.remove('style-hover')
      if (t && t.el !== selected.current) { t.el.classList.add('style-hover'); hovered.current = t.el }
    }
    const click = e => {
      const t = findTarget(e.target)
      if (!t) return
      e.preventDefault(); e.stopPropagation()
      selected.current?.classList.remove('style-selected')
      t.el.classList.remove('style-hover')
      t.el.classList.add('style-selected')
      selected.current = t.el
      setPop({ group: t.group })
      if (!pinned.current) setPos({ x: e.clientX, y: e.clientY, dragged: false })
    }
    const esc = e => { if (e.key === 'Escape') { setPop(null); pinned.current = false; clearSelected() } }
    document.addEventListener('mouseover', over, true)
    document.addEventListener('click', click, true)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mouseover', over, true)
      document.removeEventListener('click', click, true)
      document.removeEventListener('keydown', esc)
      hovered.current?.classList.remove('style-hover')
      selected.current?.classList.remove('style-selected')
      selected.current = null
      document.body.classList.remove('styling')
    }
  }, [on, official])

  if (!official) return null

  const ov = loadOverrides()
  const g = pop ? groupByName(pop.group) : null
  const W = window.innerWidth || 1200, H = window.innerHeight || 800
  const popStyle = pop ? {
    left: Math.max(8, Math.min(pos.x, W - 330)) + 'px',
    top: Math.max(8, Math.min(pos.dragged ? pos.y : pos.y + 14, H - 440)) + 'px',
  } : null

  return (
    <>
      <div className="devedit-fab devstyle-fab">
        <button className={on ? 'on' : ''} onClick={() => { setOn(o => !o); close() }}
          title="Style the page by clicking elements">
          🎨 DEV Style: {on ? 'On' : 'Off'}
        </button>
      </div>

      {on && !pop && <div className="styler-hint">🎨 Click any element to style it · Esc closes the panel · toggle off to navigate</div>}

      {pop && g && (
        <div className="styler-pop" style={popStyle} ref={popRef}>
          <div className="styler-pop-head" onMouseDown={startDrag} title="Drag to move">
            <b><span className="styler-grip">⠿</span>{g.group}</b>
            <span>
              <button className="mini" onClick={() => { clearVars(g.items.map(i => i.k)); bump(n => n + 1) }} title="Reset this group to defaults">↺</button>{' '}
              <button className="mini" onClick={close}>✕</button>
            </span>
          </div>
          <datalist id="gfonts-styler">{GOOGLE_FONTS.map(f => <option key={f} value={f} />)}</datalist>
          {g.items.map(it => (
            <div className="styler-row" key={it.k}>
              <label>{it.l}</label>
              <Control it={it} value={ov[it.k]} onChange={v => { setVar(it.k, v); bump(n => n + 1) }} />
            </div>
          ))}
          <div className="meta" style={{ marginTop: 8 }}>Changes save instantly · full editor on the Dev page</div>
        </div>
      )}
    </>
  )
}
