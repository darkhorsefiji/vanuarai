import { useEffect, useState } from 'react'
import { get, send } from '../api'
import { useAuth } from '../auth'
import { EditableText } from '../copy'

const plusDays = d => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().slice(0, 10) }

function PostBox({ channel, onPosted }) {
  const [body, setBody] = useState('')
  const [expires, setExpires] = useState(() => plusDays(14))
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  async function post() {
    if (!body.trim()) return
    setBusy(true); setMsg('')
    try {
      await send('POST', '/notices', { channel, body, expires_at: expires || null })
      setBody(''); setExpires(plusDays(14)); setMsg('Posted ✓'); onPosted()
    } catch (e) { setMsg('⚠ ' + e.message) } finally { setBusy(false) }
  }
  return (
    <div className="postbox">
      <textarea rows={2} placeholder={channel === 'koro' ? 'Post an official notice…' : 'Share something with the village…'}
        value={body} onChange={e => setBody(e.target.value)} />
      <div className="postbox-foot">
        <label className="postbox-expiry meta">Ends <input type="date" value={expires} onChange={e => setExpires(e.target.value)} /></label>
        <button className="btn secondary" disabled={busy || !body.trim()} onClick={post}>Post</button>
      </div>
      {msg && <span className="status">{msg}</span>}
    </div>
  )
}

function NoticeCard({ n, canManage, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(n.body)
  const [exp, setExp] = useState(n.expires_at || '')
  const [msg, setMsg] = useState('')
  const active = n.status === 'Active'

  async function save() {
    try { await send('PATCH', '/notices/' + n.id, { body, expires_at: exp || null }); setEditing(false); onChanged() }
    catch (e) { setMsg('⚠ ' + e.message) }
  }
  async function del() {
    if (!window.confirm('Delete this post?')) return
    try { await send('DELETE', '/notices/' + n.id); onChanged() }
    catch (e) { setMsg('⚠ ' + e.message) }
  }

  return (
    <div className={'card notice' + (active ? '' : ' expired')}>
      <div className="notice-head">
        <span className="notice-author">{n.author}</span>
        {n.author_role && <span className="notice-role">{n.author_role}</span>}
        <span className="notice-date">
          {n.expires_at && <>Ends {n.expires_at} </>}
          <span className={'lchip ' + (active ? 'active' : 'expired')}>{n.status}</span>
          {canManage && !editing && (
            <span className="notice-acts">
              <button className="mini" title="Edit" onClick={() => { setBody(n.body); setExp(n.expires_at || ''); setEditing(true) }}>✎</button>
              <button className="mini danger" title="Delete" onClick={del}>🗑</button>
            </span>
          )}
        </span>
      </div>
      {editing ? (
        <div className="notice-edit">
          <textarea rows={3} value={body} onChange={e => setBody(e.target.value)} />
          <div className="postbox-foot">
            <label className="postbox-expiry meta">Ends <input type="date" value={exp} onChange={e => setExp(e.target.value)} /></label>
            <span>
              <button className="mini" onClick={save}>Save</button>{' '}
              <button className="mini" onClick={() => setEditing(false)}>Cancel</button>
            </span>
          </div>
        </div>
      ) : <p className="notice-body">{n.body}</p>}
      {msg && <span className="status">{msg}</span>}
    </div>
  )
}

function NoticeColumn({ title, subtitle, subId, channel, notices, user, official, onChanged }) {
  const [showExpired, setShowExpired] = useState(false)
  const mine = n => user && (official || n.created_by === user.id)
  const activeList = notices ? notices.filter(n => n.status === 'Active') : null
  const expiredList = notices ? notices.filter(n => n.status !== 'Active') : []
  const canPost = channel === 'koro' ? official : !!user

  return (
    <div className="col">
      <h3 style={{ marginTop: 8 }}>{title}</h3>
      <EditableText id={subId} className="sub">{subtitle}</EditableText>
      {canPost
        ? <PostBox channel={channel} onPosted={onChanged} />
        : <p className="meta postlock">🔒 {channel === 'koro' ? 'Only village officials can post official notices.' : 'Sign in to post.'}</p>}
      <div className="noticelist">
        {!activeList ? <p className="loading">Loading…</p> : activeList.map(n => (
          <NoticeCard key={n.id} n={n} canManage={mine(n)} onChanged={onChanged} />
        ))}
        {activeList && activeList.length === 0 && <p className="meta">No active posts.</p>}
        {expiredList.length > 0 && (
          <>
            <button className="expired-toggle" onClick={() => setShowExpired(s => !s)}>
              {showExpired ? '▾ Hide' : '▸ Show'} expired ({expiredList.length})
            </button>
            {showExpired && expiredList.map(n => (
              <NoticeCard key={n.id} n={n} canManage={mine(n)} onChanged={onChanged} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

export default function Kacikacivaki() {
  const { user } = useAuth()
  const [notices, setNotices] = useState(null)
  const load = () => get('/notices').then(setNotices)
  useEffect(() => { load().catch(() => {}) }, [])

  const official = !!user && (user.isAppAdmin || user.role === 'official')
  const koro = notices ? notices.filter(n => n.channel === 'koro') : null
  const lewe = notices ? notices.filter(n => n.channel === 'lewe') : null

  return (
    <>
      <div className="pagetop">
        <h1>Kacikacivaki</h1>
        <EditableText id="kacikacivaki.sub" className="sub">Village announcements — official notices from the Vanua and Government on the left, community postings from any member on the right.</EditableText>
      </div>

      <div className="cols cols-even">
        <NoticeColumn title="Nai Tukutuku in Koro" subtitle="Official — Vanua & Government hierarchies." subId="kacikacivaki.koro.sub"
          channel="koro" notices={koro} user={user} official={official} onChanged={load} />
        <NoticeColumn title="Nai Tukutuku in Lewe ni Vanua" subtitle="Community — postings from any village member." subId="kacikacivaki.lewe.sub"
          channel="lewe" notices={lewe} user={user} official={official} onChanged={load} />
      </div>
    </>
  )
}
