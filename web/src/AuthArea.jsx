import { useEffect, useRef } from 'react'
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

export default function AuthArea() {
  const { user, ready, logout } = useAuth()
  if (!ready) return null
  if (user) {
    return (
      <span className="authbox">
        <span className="authuser">{user.name || user.email}{user.role ? ` · ${user.role}` : (user.isAppAdmin ? ' · admin' : '')}</span>
        <button className="mini" onClick={logout}>Logout</button>
      </span>
    )
  }
  return <span className="authbox"><GoogleButton /></span>
}
