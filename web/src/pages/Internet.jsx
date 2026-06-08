import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData, fjd } from '../api'
import { useAuth } from '../auth'
import { GoogleButton } from '../AuthArea'
import { EditableText } from '../copy'

const POPULAR = 'Weekly'
const vol = mb => (mb >= 1024 ? (mb / 1024) + ' GB' : mb + ' MB')

export default function Internet() {
  const { data: plans } = useData('/plans')
  const { user } = useAuth()
  const [sel, setSel] = useState(null)
  const [payMsg, setPayMsg] = useState('')
  const selected = plans?.find(p => p.name === sel)

  return (
    <>
      <div className="hero">
        <EditableText as="div" id="hero.tagline" className="tagline">Digital Village WiFi</EditableText>
        <EditableText as="h1" id="hero.title">Welcome to Bagasau</EditableText>
        <EditableText as="p" id="hero.body">Buy an internet plan to get online — then explore your village’s records: family, land, projects, fundraising and more.</EditableText>
        <div className="cta">
          {user
            ? <span style={{ color: '#eafaf7' }}>Signed in as <b>{user.name || user.email}</b></span>
            : <GoogleButton />}
          <Link className="btn secondary" to="/profile">Explore the village →</Link>
        </div>
      </div>

      <h1>Get online</h1>
      <EditableText id="internet.sub" className="sub">Choose a plan to reconnect — pay with M-PAiSA, MyCash or card.</EditableText>
      {!plans ? <p className="loading">Loading…</p> : (
        <div className="grid">
          {plans.filter(p => p.active !== false).map(p => (
            <div className={'card plan' + (sel === p.name ? ' selected' : '')} key={p.name}
              onClick={() => { setSel(p.name); setPayMsg('') }}>
              {p.name === POPULAR && <span className="popular">Most popular</span>}
              <h3>{p.name}</h3>
              <div className="meta">{vol(p.volume_mb)} · valid {p.validity}</div>
              <div className="price">{fjd(p.price_cents)}</div>
              <span className="chip">{sel === p.name ? '✓ Selected' : 'Tap to select'}</span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="checkout">
          <h3 style={{ marginTop: 0 }}>Checkout — {selected.name}</h3>
          <div className="meta">{vol(selected.volume_mb)} · valid {selected.validity} · <b>{fjd(selected.price_cents)}</b></div>
          <div className="pays">
            {['M-PAiSA', 'MyCash', 'Card'].map(m => (
              <button className="paybtn" key={m} onClick={() => setPayMsg(`Demo only — ${m} payment is not wired yet (M-PAiSA / MyCash gateway integration pending).`)}>{m}</button>
            ))}
          </div>
          {payMsg && <p className="note" style={{ marginBottom: 0 }}>{payMsg}</p>}
        </div>
      )}

      <div className="note">💬 No funds? When your plan is expired you get a free 5&nbsp;MB pass to message a friend on WhatsApp / Messenger / Viber and ask them to pay for a plan for you.</div>
    </>
  )
}
