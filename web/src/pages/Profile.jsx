import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { get } from '../api'
import { makeBaseLayers, pinIcon } from '../map'
import { EditableText } from '../copy'

function Rate({ label, score, kind }) {
  return (
    <div style={{ marginTop: 6 }}>
      <div className="meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span><span>{score}/5</span>
      </div>
      <div className={'bar' + (kind === 'resource' ? ' fin' : '')}>
        <i style={{ width: (score / 5 * 100) + '%' }} />
      </div>
    </div>
  )
}

export default function Profile() {
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ introduction: '', background: '', how_to_get_there: '' })
  const [coords, setCoords] = useState(null)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState('')
  const mapDiv = useRef(null), mapObj = useRef(null), markerObj = useRef(null), editingRef = useRef(false)

  useEffect(() => {
    get('/profile').then(d => {
      setData(d)
      setForm({ introduction: d.introduction || '', background: d.background || '', how_to_get_there: d.how_to_get_there || '' })
      if (d.latitude != null) setCoords({ lat: d.latitude, lon: d.longitude })
    })
  }, [])

  // init map once (data + coords available)
  useEffect(() => {
    if (!data || !coords || !mapDiv.current || mapObj.current) return
    const map = L.map(mapDiv.current, { scrollWheelZoom: false }).setView([coords.lat, coords.lon], 12)
    const layers = makeBaseLayers(); layers.Street.addTo(map); L.control.layers(layers, null, { collapsed: false }).addTo(map)
    const marker = L.marker([coords.lat, coords.lon], { draggable: false, icon: pinIcon }).addTo(map)
    marker.on('dragend', () => { const ll = marker.getLatLng(); setCoords({ lat: ll.lat, lon: ll.lng }) })
    map.on('click', e => { if (editingRef.current) { marker.setLatLng(e.latlng); setCoords({ lat: e.latlng.lat, lon: e.latlng.lng }) } })
    mapObj.current = map; markerObj.current = marker
    return () => { map.remove(); mapObj.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // enable/disable pin dragging with edit mode
  useEffect(() => {
    editingRef.current = editing
    const m = markerObj.current
    if (m) { editing ? m.dragging.enable() : m.dragging.disable() }
  }, [editing])

  function cancel() {
    setForm({ introduction: data.introduction || '', background: data.background || '', how_to_get_there: data.how_to_get_there || '' })
    if (data.latitude != null) { setCoords({ lat: data.latitude, lon: data.longitude }); markerObj.current?.setLatLng([data.latitude, data.longitude]) }
    setEditing(false); setStatus('')
  }
  async function save() {
    setStatus('Saving…')
    try {
      const r = await fetch('/api/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, latitude: coords?.lat, longitude: coords?.lon }),
      })
      if (r.ok) { setStatus('Saved ✓'); setData(d => ({ ...d, ...form, latitude: coords?.lat, longitude: coords?.lon })); setEditing(false) }
      else setStatus('Error saving')
    } catch { setStatus('Network error') }
  }

  if (!data) return <p className="loading">Loading…</p>
  const c = data.counts
  const res = data.resources || []
  const avg = arr => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0)
  const avgR = avg(res.map(r => r.resource)), avgP = avg(res.map(r => r.participation))
  const overall = Math.round((avgR + avgP) / 2 / 5 * 100)

  return (
    <>
      <div className="profilehero">
        <div className="pagehead">
          <div>
            <div className="tagline">Village Profile</div>
            <h1>{data.name}</h1>
            <p className="sub" style={{ color: '#eafaf7', margin: '6px 0 0' }}>{
              data.district && data.province ? `District of ${data.district} in the Province of ${data.province}`
                : data.district ? `District of ${data.district}`
                  : data.province ? `Province of ${data.province}`
                    : 'Location not set in Government'
            }</p>
          </div>
          <div className="editrow">
            {editing
              ? (<><button className="btn" onClick={save}>Save</button><button className="mini" onClick={cancel}>Cancel</button><span className="status" style={{ color: '#eafaf7' }}>{status}</span></>)
              : <button className="btn secondary" onClick={() => setEditing(true)}>✎ Edit</button>}
          </div>
        </div>
      </div>

      <div className="cols">
        <div className="col">
          <h3>Introduction</h3>
          {editing
            ? <textarea className="inlineedit" rows={4} value={form.introduction} onChange={e => setForm(f => ({ ...f, introduction: e.target.value }))} />
            : <p style={{ marginBottom: 18 }}>{form.introduction}</p>}

          <h3>Background</h3>
          {editing
            ? <textarea className="inlineedit" rows={5} value={form.background} onChange={e => setForm(f => ({ ...f, background: e.target.value }))} />
            : <p>{form.background}</p>}

          <h3 style={{ marginTop: 24 }}>Resources &amp; Participation</h3>
          <EditableText id="profile.resources.sub" className="sub">Each sector is scored 0–5 for resource endowment (blue) and the village’s level of participation (green).</EditableText>
          <div className="totrow">
            <div className="tot"><b>{avgR.toFixed(1)}/5</b>Avg resource</div>
            <div className="tot"><b>{avgP.toFixed(1)}/5</b>Avg participation</div>
            <div className="tot"><b>{overall}/100</b>Overall index</div>
          </div>
          <div className="grid">
            {res.map(r => (
              <div className="card" key={r.sector}>
                <h3>{r.sector}</h3>
                <Rate label="Resource" score={r.resource} kind="resource" />
                <Rate label="Participation" score={r.participation} kind="participation" />
                {r.notes && <div className="meta" style={{ marginTop: 8 }}>{r.notes}</div>}
              </div>
            ))}
          </div>
        </div>

        <aside className="col side sticky">
          <div className="card">
            <h3>At a glance</h3>
            <div className="kv"><span>Yavusa</span><b>{c.yavusa}</b></div>
            <div className="kv"><span>Mataqali</span><b>{c.mataqali}</b></div>
            <div className="kv"><span>Tokatoka</span><b>{c.tokatoka}</b></div>
            <div className="kv"><span>Vuvale</span><b>{c.vuvale}</b></div>
            <div className="kv"><span>Soqosoqo</span><b>{c.soqosoqo}</b></div>
            <div className="kv"><span>Members</span><b>{c.members}</b></div>
          </div>

          <h3>Location</h3>
          {coords ? (
            <>
              <div className="mapview" ref={mapDiv} />
              <p className="meta">
                {editing
                  ? <>Click the map or drag the pin · {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</>
                  : <><a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=13/${coords.lat}/${coords.lon}`}>View larger map ↗</a> · {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</>}
              </p>
            </>
          ) : <p className="meta">Location not set.</p>}

          <h3>How to get there</h3>
          {editing
            ? <textarea className="inlineedit" rows={4} value={form.how_to_get_there} onChange={e => setForm(f => ({ ...f, how_to_get_there: e.target.value }))} />
            : <p>{form.how_to_get_there}</p>}
        </aside>
      </div>
    </>
  )
}
