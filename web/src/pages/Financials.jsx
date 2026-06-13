import { useState } from 'react'
import { useData, fjd } from '../api'
import { LevelBadge, useLevels } from '../levels'
import { EditableText } from '../copy'

const TABS = ['Funds', 'Transactions', 'Asset Register', 'Investments']
// filterable body levels, in the order requested: Yasana, Tikina, Koro, Soqosoqo, Mataqali
const FILTER_LEVELS = ['provincial_council', 'district', 'village', 'soqosoqo', 'mataqali']

function FilterBar({ level, setLevel }) {
  const { map } = useLevels()
  return (
    <div className="finfilter">
      <span className="finfilter-lbl">Filter by body</span>
      <button className={'fchip' + (level === 'all' ? ' active' : '')} onClick={() => setLevel('all')}>All</button>
      {FILTER_LEVELS.map(lv => (
        <button key={lv} className={'fchip' + (level === lv ? ' active' : '')} onClick={() => setLevel(lv)}>
          {map[lv]?.label || lv}
        </button>
      ))}
    </div>
  )
}

// shared body cell + filter helper
const matchLevel = (level, r) => level === 'all' || r.level === level
function BodyCell({ r }) {
  return r.level ? <span className="body-cell"><LevelBadge level={r.level} /> {r.body}</span> : <span className="meta">—</span>
}
function noneRow(cols) {
  return <tr><td colSpan={cols} className="meta">No records for this body.</td></tr>
}

export default function Financials() {
  const [tab, setTab] = useState('Funds')
  const [level, setLevel] = useState('all')
  return (
    <>
      <div className="pagetop">
        <h1>Village Financials</h1>
        <EditableText id="financials.sub" className="sub">Member-tier view of the village's funds, transactions, assets and investments.</EditableText>
      </div>
      <FilterBar level={level} setLevel={setLevel} />
      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Funds' && <Funds level={level} />}
      {tab === 'Transactions' && <Transactions level={level} />}
      {tab === 'Asset Register' && <Assets level={level} />}
      {tab === 'Investments' && <Investments level={level} />}
    </>
  )
}

function Funds({ level }) {
  const { data } = useData('/financials')
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(r => matchLevel(level, r))
  const tin = rows.reduce((s, r) => s + r.tin, 0)
  const tout = rows.reduce((s, r) => s + r.tout, 0)
  return (
    <>
      <p className="sub">Auto-generated from the Tobu ledger (body pots).</p>
      <div className="totrow">
        <div className="tot"><b>{fjd(tin)}</b>Inflows</div>
        <div className="tot"><b>{fjd(tout)}</b>Outflows</div>
        <div className="tot"><b>{fjd(tin - tout)}</b>Net balance</div>
      </div>
      <table>
        <tbody>
          <tr><th>Fund / pot</th><th>Body</th><th>Inflows</th><th>Outflows</th><th>Balance</th></tr>
          {rows.map(r => (
            <tr key={r.purpose}><td>{r.purpose}</td><td><BodyCell r={r} /></td><td>{fjd(r.tin)}</td><td>{fjd(r.tout)}</td><td>{fjd(r.tin - r.tout)}</td></tr>
          ))}
          {rows.length === 0 && noneRow(5)}
        </tbody>
      </table>
    </>
  )
}

function Transactions({ level }) {
  const { data } = useData('/fin-transactions')
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(t => matchLevel(level, t))
  const tin = rows.filter(t => t.type === 'In').reduce((s, t) => s + t.amount_cents, 0)
  const tout = rows.filter(t => t.type === 'Out').reduce((s, t) => s + t.amount_cents, 0)
  return (
    <>
      <p className="sub">Recent money in and out across the body funds.</p>
      <div className="totrow">
        <div className="tot"><b>{fjd(tin)}</b>Total in</div>
        <div className="tot"><b>{fjd(tout)}</b>Total out</div>
        <div className="tot"><b>{fjd(tin - tout)}</b>Net</div>
      </div>
      <table className="tight">
        <thead><tr><th>Date</th><th>Description</th><th>Body</th><th>Fund</th><th>Method</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id}>
              <td>{t.tx_date}</td>
              <td>{t.description}</td>
              <td><BodyCell r={t} /></td>
              <td>{t.fund}</td>
              <td>{t.method}</td>
              <td><span className={'lchip ' + (t.type === 'In' ? 'approved' : 'declined')}>{t.type}</span></td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.type === 'Out' ? '−' : '+'}{fjd(t.amount_cents)}</td>
            </tr>
          ))}
          {rows.length === 0 && noneRow(7)}
        </tbody>
      </table>
    </>
  )
}

function Assets({ level }) {
  const { data } = useData('/assets')
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(a => matchLevel(level, a))
  const total = rows.reduce((s, a) => s + a.value_cents, 0)
  return (
    <>
      <p className="sub">Body-owned buildings, equipment and infrastructure.</p>
      <div className="totrow">
        <div className="tot"><b>{rows.length}</b>Assets</div>
        <div className="tot"><b>{fjd(total)}</b>Total book value</div>
      </div>
      <table className="tight">
        <thead><tr><th>Asset</th><th>Body</th><th>Category</th><th>Acquired</th><th>Condition</th><th>Custodian</th><th style={{ textAlign: 'right' }}>Value</th></tr></thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td><BodyCell r={a} /></td>
              <td>{a.category}</td>
              <td>{a.acquired}</td>
              <td>{a.condition}</td>
              <td>{a.custodian}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fjd(a.value_cents)}</td>
            </tr>
          ))}
          {rows.length === 0 && noneRow(7)}
        </tbody>
      </table>
    </>
  )
}

function Investments({ level }) {
  const { data } = useData('/investments')
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(i => matchLevel(level, i))
  const invested = rows.reduce((s, i) => s + i.amount_cents, 0)
  const current = rows.reduce((s, i) => s + i.current_value_cents, 0)
  const gain = current - invested
  return (
    <>
      <p className="sub">Body funds placed in trusts, deposits and enterprise.</p>
      <div className="totrow">
        <div className="tot"><b>{fjd(invested)}</b>Invested</div>
        <div className="tot"><b>{fjd(current)}</b>Current value</div>
        <div className="tot"><b>{gain >= 0 ? '+' : ''}{fjd(gain)}</b>Unrealised gain</div>
      </div>
      <table className="tight">
        <thead><tr><th>Investment</th><th>Body</th><th>Type</th><th style={{ textAlign: 'right' }}>Invested</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>Return</th><th>Notes</th></tr></thead>
        <tbody>
          {rows.map(i => {
            const g = i.current_value_cents - i.amount_cents
            return (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td><BodyCell r={i} /></td>
                <td>{i.type}</td>
                <td style={{ textAlign: 'right' }}>{fjd(i.amount_cents)}</td>
                <td style={{ textAlign: 'right' }}>{fjd(i.current_value_cents)}</td>
                <td style={{ textAlign: 'right', color: g >= 0 ? '#2f7a52' : '#a83b25', fontWeight: 600 }}>
                  {i.return_pct != null ? i.return_pct + '%' : (g >= 0 ? '+' : '') + fjd(g)}
                </td>
                <td>{i.notes}</td>
              </tr>
            )
          })}
          {rows.length === 0 && noneRow(7)}
        </tbody>
      </table>
    </>
  )
}
