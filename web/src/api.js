import { useEffect, useState } from 'react'

export async function get(path) {
  const r = await fetch('/api' + path)
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
