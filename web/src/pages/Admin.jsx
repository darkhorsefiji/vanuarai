import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { get } from '../api'

const pin = L.divIcon({ className: '', html: '<div class="pinDot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })

export default function Admin() {
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState({ introduction: '', background: '', how_to_get_there: '' })
  const [coords, setCoords] = useState({ lat: -17.8, lon: 178.2 })
  const [status, setStatus] = useState('')
  const mapDiv = useRef(null)
  const mapObj = useRef(null)

  // load current profile
  useEffect(() => {
    get('/profile').then(d => {
      setForm({
        introduction: d.introduction || '',
        background: d.background || '',
        how_to_get_there: d.how_to_get_there || '',
      })
      if (d.latitude != null) setCoords({ lat: d.latitude, lon: d.longitude })
      setLoaded(true)
    })
  }, [])

  // init the Leaflet map once the profile is loaded
  useEffect(() => {
    if (!loaded || !mapDiv.current || mapObj.current) return
    const map = L.map(mapDiv.current).setView([coords.lat, coords.lon], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap contributors',
    }).addTo(map)
    const marker = L.marker([coords.lat, coords.lon], { draggable: true, icon: pin }).addTo(map)
    marker.on('dragend', () => { const ll = marker.getLatLng(); setCoords({ lat: ll.lat, lon: ll.lng }) })
    map.on('click', e => { marker.setLatLng(e.latlng); setCoords({ lat: e.latlng.lat, lon: e.latlng.lng }) })
    mapObj.current = map
    return () => { map.remove(); mapObj.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded])

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    setStatus('Saving…')
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, latitude: coords.lat, longitude: coords.lon }),
      })
      setStatus(r.ok ? 'Saved ✓' : 'Error saving')
    } catch {
      setStatus('Network error')
    }
  }

  if (!loaded) return <p className="loading">Loading…</p>

  return (
    <>
      <h1>Village Admin</h1>
      <p className="sub">Edit the village profile and pin its location on the map. (Open for now — will be limited to officials once login is added.)</p>

      <h3>Profile content</h3>
      <div className="field">
        <label>Introduction</label>
        <textarea rows={4} value={form.introduction} onChange={upd('introduction')} />
      </div>
      <div className="field">
        <label>Background</label>
        <textarea rows={5} value={form.background} onChange={upd('background')} />
      </div>
      <div className="field">
        <label>How to get there</label>
        <textarea rows={4} value={form.how_to_get_there} onChange={upd('how_to_get_there')} />
      </div>

      <h3>Pin the village location</h3>
      <p className="sub">Click the map or drag the pin to set the village’s coordinates.</p>
      <div id="mapedit" ref={mapDiv} />
      <p className="coordbox">📍 {coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</p>

      <div className="savebar">
        <button className="btn" onClick={save}>Save changes</button>
        <span className="status">{status}</span>
      </div>
    </>
  )
}
