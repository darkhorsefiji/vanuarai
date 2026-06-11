import { useEffect, useState } from 'react'
import { get, send } from '../api'
import { useAuth, isOfficialRole } from '../auth'
import { EditableText } from '../copy'

const PRODUCE = ['Tavioka', 'Dalo', 'Kumala', 'Rourou', 'Bele', 'Duruka', 'Fish', 'Kava', 'Coconut', 'Vudi', 'Uvi', 'Baigani', 'Pawpaw', 'Banana']

// Days from the viewer's "today" to a yyyy-mm-dd date (0 = today).
const daysTo = s => {
  const d = new Date(s + 'T00:00:00'); const t = new Date(); t.setHours(0, 0, 0, 0)
  return Math.round((d - t) / 86400000)
}
// e.g. "in 3–6 days", "now – 4 days", "available now", "ended"
function availabilityHint(l) {
  const f = l.available_from ? daysTo(l.available_from) : null
  const t = l.available_to ? daysTo(l.available_to) : null
  const day = n => `${n} day${n === 1 ? '' : 's'}`
  if (t != null && t < 0) return 'ended'
  if (f != null && t != null) return f <= 0 ? `now – ${day(t)}` : `in ${f}–${t} days`
  if (f != null) return f <= 0 ? 'available now' : `in ${day(f)}`
  if (t != null) return `${day(t)} left`
  return null
}
const CAT_ICON = { Carrier: '🚚', Bus: '🚌', Boat: '🛥', Hostel: '🛏', Venue: '🏛', School: '🏫' }

function ListingForm({ authorName, onPosted }) {
  const [produce, setProduce] = useState('')
  const [qty, setQty] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [seller, setSeller] = useState(authorName || '')
  const [mobile, setMobile] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (!seller && authorName) setSeller(authorName) }, [authorName, seller])
  async function post() {
    setBusy(true); setMsg('')
    try {
      await send('POST', '/trade-listings', { produce, qty_kg: Number(qty), seller: seller || null, available_from: from || null, available_to: to || null, mobile: mobile || null })
      setProduce(''); setQty(''); setFrom(''); setTo(''); setSeller(authorName || ''); setMobile(''); setMsg('Posted ✓'); onPosted()
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setBusy(false) }
  }
  return (
    <div className="postbox">
      <datalist id="producelist">{PRODUCE.map(p => <option key={p} value={p} />)}</datalist>
      <div className="sellform">
        <input list="producelist" placeholder="Produce…" value={produce} onChange={e => setProduce(e.target.value)} />
        <input type="number" min="0" step="0.5" placeholder="kg" value={qty} onChange={e => setQty(e.target.value)} />
      </div>
      <div className="sellform" style={{ marginTop: 7 }}>
        <input placeholder="Seller name…" title="Posting on behalf of someone? Put their name here." style={{ flex: 1 }}
          value={seller} onChange={e => setSeller(e.target.value)} />
        <input type="tel" placeholder="Mobile (+679…)" value={mobile} onChange={e => setMobile(e.target.value)} style={{ width: 124 }} />
      </div>
      <div className="sellform dates">
        <label className="meta">From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label className="meta">To <input type="date" value={to} onChange={e => setTo(e.target.value)} /></label>
        <button className="btn secondary" disabled={busy || !produce.trim() || !(Number(qty) > 0)} onClick={post}>Post</button>
      </div>
      {msg && <span className="status">{msg}</span>}
    </div>
  )
}

export default function Trade() {
  const { user } = useAuth()
  const [listings, setListings] = useState(null)
  const [buyers, setBuyers] = useState(null)
  const [contacts, setContacts] = useState(null)
  const [qBuyer, setQBuyer] = useState('')
  const [qContact, setQContact] = useState('')
  const [msg, setMsg] = useState('')

  const loadListings = () => get('/trade-listings').then(setListings)
  useEffect(() => {
    loadListings().catch(() => {})
    get('/trade-buyers').then(setBuyers).catch(() => {})
    get('/trade-contacts').then(setContacts).catch(() => {})
  }, [])

  const mine = l => user && (isOfficialRole(user) || l.created_by === user.id)
  async function delListing(l) {
    if (!window.confirm(`Remove the ${l.produce} listing?`)) return
    try { await send('DELETE', '/trade-listings/' + l.id); setMsg('Removed ✓'); loadListings() }
    catch (e) { setMsg('⚠ ' + e.message) }
  }

  const fB = qBuyer.trim().toLowerCase()
  const buyersShown = buyers ? buyers.filter(b => !fB || [b.name, b.buys, b.location].join(' ').toLowerCase().includes(fB)) : null
  const fC = qContact.trim().toLowerCase()
  const contactsShown = contacts ? contacts.filter(c => !fC || [c.category, c.name, c.detail, c.location].join(' ').toLowerCase().includes(fC)) : null

  return (
    <>
      <div className="pagetop">
        <h1>Trade</h1>
        <EditableText id="trade.sub" className="sub">Village enterprise and exchange — produce for sale, buyers, and the contacts that move things.</EditableText>
      </div>

      <div className="cols cols3">
        <div className="col">
          <h3 style={{ marginTop: 8 }}>Sellers</h3>
          <EditableText id="trade.sellers.sub" className="sub">Produce available from the village.</EditableText>
          {user ? <ListingForm authorName={user.name || user.email || ''} onPosted={loadListings} /> : <p className="meta postlock">🔒 Sign in to post what you have for sale.</p>}
          {msg && <span className="status">{msg}</span>}
          <div className="tradelist">
            {!listings ? <p className="loading">Loading…</p> : listings.map(l => (
              <div className="card tradecard" key={l.id}>
                <div className="res-head">
                  <b>{l.produce}</b>
                  <span className="res-right">
                    <span className="lchip approved">{Number(l.qty_kg)} kg</span>
                    {availabilityHint(l) && <span className="avail-hint">{availabilityHint(l)}</span>}
                  </span>
                </div>
                <div className="meta seller-line">
                  <span>{l.seller}</span>
                  {l.mobile && <a className="seller-mob" href={'tel:' + l.mobile.replace(/\s/g, '')}>{l.mobile}</a>}
                </div>
                {(l.available_from || l.available_to || mine(l)) && (
                  <div className="meta seller-line">
                    <span>{(l.available_from || l.available_to) ? `${l.available_from || '…'}${l.available_to ? ` → ${l.available_to}` : ''}` : ''}</span>
                    {mine(l) && <button className="mini danger" title="Remove" onClick={() => delListing(l)}>🗑</button>}
                  </div>
                )}
              </div>
            ))}
            {listings && listings.length === 0 && <p className="meta">Nothing listed yet.</p>}
          </div>
        </div>

        <div className="col">
          <h3 style={{ marginTop: 8 }}>Buyers</h3>
          <EditableText id="trade.buyers.sub" className="sub">Who's buying village produce.</EditableText>
          <input className="treesearch" placeholder="Search buyers…" value={qBuyer} onChange={e => setQBuyer(e.target.value)} />
          <div className="tradelist">
            {!buyersShown ? <p className="loading">Loading…</p> : buyersShown.map(b => (
              <div className="card govcontact" key={b.id}>
                <div className="gc-name">{b.name}</div>
                <div className="gc-role">Buys: {b.buys}</div>
                <div className="gc-rows">
                  <div><span>Location</span><em style={{ fontStyle: 'normal' }}>{b.location}</em></div>
                  <div><span>Mobile</span>{b.mobile ? <a href={'tel:' + b.mobile.replace(/\s/g, '')}>{b.mobile}</a> : <em>—</em>}</div>
                  <div><span>Email</span>{b.email ? <a href={'mailto:' + b.email}>{b.email}</a> : <em>—</em>}</div>
                </div>
              </div>
            ))}
            {buyersShown && buyersShown.length === 0 && <p className="meta">No buyers match.</p>}
          </div>
        </div>

        <div className="col">
          <h3 style={{ marginTop: 8 }}>Key Contacts</h3>
          <EditableText id="trade.contacts.sub" className="sub">Carriers, buses, boats, hostels, venues and schools.</EditableText>
          <input className="treesearch" placeholder="Search contacts…" value={qContact} onChange={e => setQContact(e.target.value)} />
          <div className="tradelist">
            {!contactsShown ? <p className="loading">Loading…</p> : contactsShown.map(c => (
              <div className="card govcontact" key={c.id}>
                <div className="gc-title">{CAT_ICON[c.category] || '📍'} {c.category}</div>
                <div className="gc-name">{c.name}</div>
                {c.detail && <div className="gc-role">{c.detail}</div>}
                <div className="gc-rows">
                  <div><span>Location</span><em style={{ fontStyle: 'normal' }}>{c.location}</em></div>
                  <div><span>Mobile</span>{c.mobile ? <a href={'tel:' + c.mobile.replace(/\s/g, '')}>{c.mobile}</a> : <em>—</em>}</div>
                </div>
              </div>
            ))}
            {contactsShown && contactsShown.length === 0 && <p className="meta">No contacts match.</p>}
          </div>
        </div>
      </div>
    </>
  )
}
