// DEV Edit: inline editing of otherwise-static copy (page subtitles, captions, …).
// Overrides + edit-mode flag persist in localStorage; EditableText renders the
// override when present, falling back to the default passed as children.
import { createContext, useContext, useState, useCallback } from 'react'

const COPY_KEY = 'vr_copy'
const MODE_KEY = 'vr_copy_edit'
const load = () => { try { return JSON.parse(localStorage.getItem(COPY_KEY)) || {} } catch { return {} } }

const CopyCtx = createContext(null)
export const useCopy = () => useContext(CopyCtx)

export function CopyProvider({ children }) {
  const [edit, setEdit] = useState(() => localStorage.getItem(MODE_KEY) === '1')
  const [overrides, setOverrides] = useState(load)

  const save = useCallback((id, value) => {
    setOverrides(prev => {
      const next = { ...prev, [id]: value }
      localStorage.setItem(COPY_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const toggle = useCallback(() => {
    setEdit(e => { const v = !e; localStorage.setItem(MODE_KEY, v ? '1' : '0'); return v })
  }, [])

  const resetCopy = useCallback(() => {
    localStorage.removeItem(COPY_KEY)
    setOverrides({})
  }, [])

  const get = useCallback((id, def) => (overrides[id] != null ? overrides[id] : def), [overrides])

  return (
    <CopyCtx.Provider value={{ edit, toggle, overrides, get, save, resetCopy }}>
      {children}
    </CopyCtx.Provider>
  )
}

// <EditableText id="projects.sub" as="p" className="sub">Default copy…</EditableText>
// Pass html when the default contains markup (e.g. <b>…</b>).
export function EditableText({ id, as: Tag = 'p', className, html = false, children, ...rest }) {
  const ctx = useCopy()
  const def = typeof children === 'string' ? children : (children == null ? '' : String(children))
  const text = ctx ? ctx.get(id, def) : def
  const editing = !!ctx && ctx.edit
  const cls = (className || '') + (editing ? ' copy-edit' : '')

  if (editing) {
    return (
      <Tag
        {...rest}
        className={cls}
        data-copy-id={id}
        contentEditable
        suppressContentEditableWarning
        title="DEV Edit — type to change, click away to save"
        onBlur={e => ctx.save(id, html ? e.currentTarget.innerHTML : e.currentTarget.innerText)}
        {...(html ? { dangerouslySetInnerHTML: { __html: text } } : {})}
      >
        {html ? undefined : text}
      </Tag>
    )
  }
  return html
    ? <Tag {...rest} className={cls || undefined} dangerouslySetInnerHTML={{ __html: text }} />
    : <Tag {...rest} className={cls || undefined}>{text}</Tag>
}

export function DevEditButton() {
  const ctx = useCopy()
  if (!ctx) return null
  return (
    <div className="devedit-fab">
      {ctx.edit && (
        <button className="devedit-reset" title="Clear all copy edits"
          onClick={() => { if (confirm('Reset all DEV copy edits to defaults?')) ctx.resetCopy() }}>
          ↺ Reset copy
        </button>
      )}
      <button className={ctx.edit ? 'on' : ''} onClick={ctx.toggle}
        title="Toggle inline editing of page text">
        ✎ DEV Edit: {ctx.edit ? 'On' : 'Off'}
      </button>
    </div>
  )
}
