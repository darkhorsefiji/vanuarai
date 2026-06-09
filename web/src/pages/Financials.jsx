import { useState } from 'react'
import { useData, fjd } from '../api'
import { EditableText } from '../copy'

const TABS = ['Funds', 'Transactions', 'Asset Register', 'Investments']

export default function Financials() {
  const [tab, setTab] = useState('Funds')
  return (
    <>
      <h1>Village Financials</h1>
      <EditableText id="financials.sub" className="sub">Member-tier view of the village's funds, transactions, assets and investments.</EditableText>
      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Funds' && <Funds />}
      {tab === 'Transactions' && <Transactions />}
      {tab === 'Asset Register' && <Assets />}
      {tab === 'Investments' && <Investments />}
    </>
  )
}

function Funds() {
  const { data } = useData('/financials')
  if (!data) return <p className="loading">Loading…</p>
  const tin = data.reduce((s, r) => s + r.tin, 0)
  const tout = data.reduce((s, r) => s + r.tout, 0)
  return (
    <>
      <p className="sub">Auto-generated from the Tobu ledger (Village body pots).</p>
      <div className="totrow">
        <div className="tot"><b>{fjd(tin)}</b>Inflows</div>
        <div className="tot"><b>{fjd(tout)}</b>Outflows</div>
        <div className="tot"><b>{fjd(tin - tout)}</b>Net balance</div>
      </div>
      <table>
        <tbody>
          <tr><th>Fund / pot</th><th>Inflows</th><th>Outflows</th><th>Balance</th></tr>
          {data.map(r => (
            <tr key={r.purpose}><td>{r.purpose}</td><td>{fjd(r.tin)}</td><td>{fjd(r.tout)}</td><td>{fjd(r.tin - r.tout)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Transactions() {
  const { data } = useData('/fin-transactions')
  if (!data) return <p className="loading">Loading…</p>
  const tin = data.filter(t => t.type === 'In').reduce((s, t) => s + t.amount_cents, 0)
  const tout = data.filter(t => t.type === 'Out').reduce((s, t) => s + t.amount_cents, 0)
  return (
    <>
      <p className="sub">Recent money in and out across the village funds.</p>
      <div className="totrow">
        <div className="tot"><b>{fjd(tin)}</b>Total in</div>
        <div className="tot"><b>{fjd(tout)}</b>Total out</div>
        <div className="tot"><b>{fjd(tin - tout)}</b>Net</div>
      </div>
      <table className="tight">
        <thead><tr><th>Date</th><th>Description</th><th>Fund</th><th>Method</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
        <tbody>
          {data.map(t => (
            <tr key={t.id}>
              <td>{t.tx_date}</td>
              <td>{t.description}</td>
              <td>{t.fund}</td>
              <td>{t.method}</td>
              <td><span className={'lchip ' + (t.type === 'In' ? 'approved' : 'declined')}>{t.type}</span></td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.type === 'Out' ? '−' : '+'}{fjd(t.amount_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Assets() {
  const { data } = useData('/assets')
  if (!data) return <p className="loading">Loading…</p>
  const total = data.reduce((s, a) => s + a.value_cents, 0)
  return (
    <>
      <p className="sub">Village-owned buildings, equipment and infrastructure.</p>
      <div className="totrow">
        <div className="tot"><b>{data.length}</b>Assets</div>
        <div className="tot"><b>{fjd(total)}</b>Total book value</div>
      </div>
      <table className="tight">
        <thead><tr><th>Asset</th><th>Category</th><th>Acquired</th><th>Condition</th><th>Custodian</th><th style={{ textAlign: 'right' }}>Value</th></tr></thead>
        <tbody>
          {data.map(a => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.category}</td>
              <td>{a.acquired}</td>
              <td>{a.condition}</td>
              <td>{a.custodian}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fjd(a.value_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function Investments() {
  const { data } = useData('/investments')
  if (!data) return <p className="loading">Loading…</p>
  const invested = data.reduce((s, i) => s + i.amount_cents, 0)
  const current = data.reduce((s, i) => s + i.current_value_cents, 0)
  const gain = current - invested
  return (
    <>
      <p className="sub">Village funds placed in trusts, deposits and enterprise.</p>
      <div className="totrow">
        <div className="tot"><b>{fjd(invested)}</b>Invested</div>
        <div className="tot"><b>{fjd(current)}</b>Current value</div>
        <div className="tot"><b>{gain >= 0 ? '+' : ''}{fjd(gain)}</b>Unrealised gain</div>
      </div>
      <table className="tight">
        <thead><tr><th>Investment</th><th>Type</th><th style={{ textAlign: 'right' }}>Invested</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>Return</th><th>Notes</th></tr></thead>
        <tbody>
          {data.map(i => {
            const g = i.current_value_cents - i.amount_cents
            return (
              <tr key={i.id}>
                <td>{i.name}</td>
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
        </tbody>
      </table>
    </>
  )
}
