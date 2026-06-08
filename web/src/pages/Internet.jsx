import { Link } from 'react-router-dom'
import { useData, fjd } from '../api'

export default function Internet() {
  const { data: plans } = useData('/plans')
  return (
    <>
      <h1>Get online at Bagasau</h1>
      <p className="sub">Your session has ended. Choose a plan to reconnect — pay with M-PAiSA, MyCash or card.</p>
      {!plans ? <p className="loading">Loading…</p> : (
        <div className="grid">
          {plans.map(p => (
            <div className="card" key={p.name}>
              <h3>{p.name}</h3>
              <div className="meta">{p.volume_mb >= 1024 ? (p.volume_mb / 1024) + ' GB' : p.volume_mb + ' MB'} · valid {p.validity}</div>
              <div className="price">{fjd(p.price_cents)}</div>
              <a className="btn" href="#">Buy plan</a>
            </div>
          ))}
        </div>
      )}
      <div className="note">💬 No funds? When your plan is expired you get a free 5&nbsp;MB pass to message a friend on WhatsApp / Messenger / Viber and ask them to pay for a plan for you.</div>
      <p><Link className="btn secondary" to="/profile">Browse the Village portal (free) →</Link></p>
    </>
  )
}
