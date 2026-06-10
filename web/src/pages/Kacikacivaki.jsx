import { useEffect, useState } from 'react'
import { get, send } from '../api'
import { useAuth } from '../auth'
import { EditableText } from '../copy'

const plusDays = d => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

function PostBox({ channel, defaultAuthor, onPosted }) {
  const [body, setBody] = useState('')
  const [expires, setExpires] = useState(() => plusDays(14))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function post() {
    if (!body.trim()) return
    setBusy(true); setMsg('')
    try {
      await send('POST', '/notices', { channel, author: defaultAuthor, body, expires_at: expires || null })
      setBody(''); setExpires(plusDays(14)); setMsg('Posted ✓'); onPosted()
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setBusy(false) }
  }
  return (
    <div className="postbox">
      <textarea rows={2} placeholder={channel === 'koro' ? 'Post an official notice…' : 'Share something with the village…'}
        value={body} onChange={e => setBody(e.target.value)} />
      <div className="postbox-foot">
        <span className="meta">Posting as <b>{defaultAuthor}</b></span>
        <label className="postbox-expiry meta">Expires <input type="date" value={expires} onChange={e => setExpires(e.target.value)} /></label>
        <button className="btn secondary" disabled={busy || !body.trim()} onClick={post}>Post</button>
      </div>
      {msg && <span className="status">{msg}</span>}
    </div>
  )
}

function NoticeCard({ n }) {
  const active = n.status === 'Active'
  return (
    <div className="card notice">
      <div className="notice-head">
        <span className="notice-author">{n.author}</span>
        {n.author_role && <span className="notice-role">{n.author_role}</span>}
        <span className="notice-date">
          {n.expires_at && <>Expires {n.expires_at} </>}
          <span className={'lchip ' + (active ? 'active' : 'expired')}>{n.status}</span>
        </span>
      </div>
      <p className="notice-body">{n.body}</p>
    </div>
  )
}

export default function Kacikacivaki() {
  const { user } = useAuth()
  const [notices, setNotices] = useState(null)
  const load = () => get('/notices').then(setNotices)
  useEffect(() => { load().catch(() => {}) }, [])

  const author = user?.name || user?.email || 'Anonymous'
  const koro = notices ? notices.filter(n => n.channel === 'koro') : null
  const lewe = notices ? notices.filter(n => n.channel === 'lewe') : null

  return (
    <>
      <h1>Kacikacivaki</h1>
      <EditableText id="kacikacivaki.sub" className="sub">Village announcements — official notices from the Vanua and Government on the left, community postings from any member on the right.</EditableText>

      <div className="cols cols-even">
        <div className="col">
          <h3 style={{ marginTop: 8 }}>Nai Tukutuku in Koro</h3>
          <p className="sub">Official — Vanua &amp; Government hierarchies.</p>
          <PostBox channel="koro" defaultAuthor={author} onPosted={load} />
          <div className="noticelist">
            {!koro ? <p className="loading">Loading…</p> : koro.map(n => <NoticeCard key={n.id} n={n} />)}
            {koro && koro.length === 0 && <p className="meta">No official notices yet.</p>}
          </div>
        </div>

        <div className="col">
          <h3 style={{ marginTop: 8 }}>Nai Tukutuku in Lewe ni Vanua</h3>
          <p className="sub">Community — postings from any village member.</p>
          <PostBox channel="lewe" defaultAuthor={author} onPosted={load} />
          <div className="noticelist">
            {!lewe ? <p className="loading">Loading…</p> : lewe.map(n => <NoticeCard key={n.id} n={n} />)}
            {lewe && lewe.length === 0 && <p className="meta">Nothing posted yet — be the first.</p>}
          </div>
        </div>
      </div>
    </>
  )
}
