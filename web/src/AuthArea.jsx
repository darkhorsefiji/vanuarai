import { useEffect, useRef, useState } from 'react'
import { useAuth } from './auth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export function GoogleButton() {
  const { loginWithGoogle } = useAuth()
  const ref = useRef(null)
  useEffect(() => {
    if (!CLIENT_ID) return
    let cancelled = false
    const init = () => {
      if (cancelled || !window.google || !ref.current) return
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: r => loginWithGoogle(r.credential) })
      window.google.accounts.id.renderButton(ref.current, { theme: 'filled_blue', size: 'medium', type: 'standard', shape: 'pill' })
    }
    if (window.google) { init(); return }
    let s = document.getElementById('gsi')
    if (!s) { s = document.createElement('script'); s.id = 'gsi'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true; document.body.appendChild(s) }
    s.addEventListener('load', init)
    return () => { cancelled = true; s.removeEventListener('load', init) }
  }, [loginWithGoogle])

  if (!CLIENT_ID) return <span className="authnote">Google login not configured</span>
  return <div ref={ref} />
}

function initials(name, email) {
  const s = (name || email || '?').trim()
  const parts = s.split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || s[0].toUpperCase()
}

export default function AuthArea() {
  const { user, ready, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [imgOk, setImgOk] = useState(true)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDoc = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    const onEsc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open])

  if (!ready) return null
  if (!user) return <span className="authbox"><GoogleButton /></span>

  const role = user.role || (user.isAppAdmin ? 'admin' : 'member')
  const openModal = t => { setModal(t); setOpen(false) }

  return (
    <span className="authbox" ref={wrapRef}>
      <span className="rolepill" title="Your role">{role}</span>
      <button className="avatar" onClick={() => setOpen(o => !o)} title={user.name || user.email} aria-label="Account menu" aria-haspopup="menu" aria-expanded={open}>
        {user.photo && imgOk
          ? <img src={user.photo} alt="" referrerPolicy="no-referrer" onError={() => setImgOk(false)} />
          : <span className="avatar-initials">{initials(user.name, user.email)}</span>}
      </button>

      {open && (
        <div className="usermenu" role="menu">
          <div className="usermenu-head">
            <div className="usermenu-name">{user.name || user.email}</div>
            {user.name && <div className="usermenu-email">{user.email}</div>}
          </div>
          <button className="usermenu-item" role="menuitem" onClick={() => openModal('Change Password')}>Change Password</button>
          <div className="usermenu-group">Settings</div>
          <button className="usermenu-item sub" role="menuitem" onClick={() => openModal('Payment Preferences')}>Payment Preferences</button>
          <button className="usermenu-item sub" role="menuitem" onClick={() => openModal('Notification Settings')}>Notification Settings</button>
          <div className="usermenu-sep" />
          <button className="usermenu-item danger" role="menuitem" onClick={() => { setOpen(false); logout() }}>Logout</button>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{modal}</h3>
            <p className="sub">This section is being set up.</p>
            <div style={{ textAlign: 'right' }}><button className="btn secondary" onClick={() => setModal(null)}>Close</button></div>
          </div>
        </div>
      )}
    </span>
  )
}
