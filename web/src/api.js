import { useEffect, useState } from 'react'

export function getToken() { return localStorage.getItem('vr_token') }
export function setToken(t) { if (t) localStorage.setItem('vr_token', t); else localStorage.removeItem('vr_token') }
function authHeaders(extra) { const t = getToken(); return t ? { ...extra, Authorization: 'Bearer ' + t } : (extra || {}) }

export async function get(path) {
  const r = await fetch('/api' + path, { headers: authHeaders() })
  if (!r.ok) throw new Error('API ' + r.status)
  return r.json()
}

export const fjd = c => 'FJD ' + (Number(c) / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })

export function useData(path) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  useEffect(() => {
    let on = true
    get(path).then(d => on && setData(d)).catch(e => on && setErr(e))
    return () => { on = false }
  }, [path])
  return { data, err }
}
