import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { get, setToken } from './api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() =>
    get('/me').then(d => setUser(d.user || null)).catch(() => setUser(null)).finally(() => setReady(true)), [])

  useEffect(() => { refresh() }, [refresh])

  async function loginWithGoogle(credential) {
    const r = await fetch('/api/auth/google', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }),
    })
    if (!r.ok) return false
    const { token } = await r.json()
    setToken(token)
    await refresh()
    return true
  }

  function logout() { setToken(null); setUser(null) }

  return <Ctx.Provider value={{ user, ready, loginWithGoogle, logout, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
