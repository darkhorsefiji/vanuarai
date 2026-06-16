import { useState, useRef } from 'react'
import { useData, fjd, send } from '../api'
import { LevelBadge } from '../levels'
import { BodyFilterBar, useBodyFilter, matchBody } from '../bodyfilter'
import { useAuth, isVillageAdmin } from '../auth'
import { EditableText } from '../copy'

const TABS = ['Funds', 'Transactions', 'Asset Register', 'Investments']

function BodyCell({ r }) {
  return r.level ? <span className="body-cell"><LevelBadge level={r.level} /> <span className="body-name" title={r.body}>{r.body}</span></span> : <span className="meta">—</span>
}
function noneRow(cols) {
  return <tr><td colSpan={cols} className="meta">No records for this body.</td></tr>
}

// Hover popover: who initiated vs who approved a transaction (maker-checker).
function WhoBlock({ kind, who }) {
  return (
    <div className={'who-block ' + kind}>
      <div className="who-h">{kind === 'init' ? '✎ Initiated by' : kind === 'appr' ? '✓ Approved by' : kind === 'donor' ? '↘ Received from' : '🧾 Recorded by'}</div>
      <div className="who-name">{who.name}</div>
      <div className="who-meta">{who.role}</div>
      <div className="who-sub"><span className="who-entity">{who.entity}</span>{who.body ? ' · ' + who.body : ''}</div>
      <div className="who-when">{who.at || '—'}</div>
    </div>
  )
}
function WhoPopover({ tx }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  if (!tx.initiator && !tx.approver && !tx.donor) return <span className="meta">—</span>
  // position:fixed so the popover escapes the table's overflow:hidden clipping;
  // align its right edge to the icon, and flip above when there's no room below.
  const W = 240, gap = 8
  const place = () => {
    const r = ref.current?.getBoundingClientRect(); if (!r) return
    const left = Math.max(8, Math.min(r.right - W, window.innerWidth - W - 8))
    if (window.innerHeight - r.bottom < 240) setPos({ left, bottom: window.innerHeight - r.top + gap })
    else setPos({ left, top: r.bottom + gap })
  }
  const style = pos
    ? { position: 'fixed', left: pos.left + 'px', right: 'auto', ...(pos.top != null ? { top: pos.top + 'px' } : { bottom: pos.bottom + 'px' }) }
    : undefined
  return (
    <span ref={ref} className="txwho" tabIndex={0} onMouseEnter={place} onFocus={place}>
      <span className="txwho-ic" aria-label="Who initiated / approved">ⓘ</span>
      <span className="txwho-pop" style={style}>
        {tx.type === 'In'
          ? <>
              {tx.donor && <WhoBlock kind="donor" who={tx.donor} />}
              {tx.initiator && <WhoBlock kind="recorded" who={tx.initiator} />}
            </>
          : <>
              {tx.initiator && <WhoBlock kind="init" who={tx.initiator} />}
              {tx.approver && <WhoBlock kind="appr" who={tx.approver} />}
            </>}
      </span>
    </span>
  )
}

// Void (archive) a record — hidden everywhere but kept in the DB for records.
function ArchiveBtn({ path, label, onDone }) {
  async function go() {
    if (!window.confirm(`Void this ${label}? It will be hidden from all views but kept for records.`)) return
    try { await send('DELETE', path); onDone() }
    catch (e) { window.alert(e.message || 'Could not archive') }
  }
  return <button className="mini danger" title="Void (archive)" onClick={go}>🗑</button>
}

export default function Financials() {
  const { user } = useAuth()
  const canEdit = isVillageAdmin(user)
  const [tab, setTab] = useState('Funds')
  const { filter, setFilter, bodiesByLevel } = useBodyFilter()
  const [refresh, setRefresh] = useState(0)
  const bump = () => setRefresh(r => r + 1)
  const shared = { filter, canEdit, refresh, onArchive: bump }
  return (
    <div className="page-financials">
      <div className="pagetop">
        <h1>Village Financials</h1>
        <EditableText id="financials.sub" className="sub">Member-tier view of the village's funds, transactions, assets and investments.</EditableText>
      </div>
      <BodyFilterBar filter={filter} setFilter={setFilter} bodiesByLevel={bodiesByLevel} />
      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={'tab' + (tab === t ? ' active' : '')} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Funds' && <Funds filter={filter} refresh={refresh} />}
      {tab === 'Transactions' && <Transactions {...shared} />}
      {tab === 'Asset Register' && <Assets {...shared} />}
      {tab === 'Investments' && <Investments {...shared} />}
    </div>
  )
}

function Funds({ filter, refresh }) {
  const { data } = useData('/financials?_r=' + refresh)
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(r => matchBody(filter, r))
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
          <tr><th>Fund</th><th>Body</th><th style={{ textAlign: 'right' }}>Inflows</th><th style={{ textAlign: 'right' }}>Outflows</th><th style={{ textAlign: 'right' }}>Balance</th></tr>
          {rows.map(r => (
            <tr key={r.purpose}><td>{r.purpose}</td><td><BodyCell r={r} /></td><td style={{ textAlign: 'right' }}>{fjd(r.tin)}</td><td style={{ textAlign: 'right' }}>{fjd(r.tout)}</td><td style={{ textAlign: 'right' }}>{fjd(r.tin - r.tout)}</td></tr>
          ))}
          {rows.length === 0 && noneRow(5)}
        </tbody>
      </table>
    </>
  )
}

function Transactions({ filter, canEdit, refresh, onArchive }) {
  const { data } = useData('/fin-transactions?_r=' + refresh)
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(t => matchBody(filter, t))
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
      <table className="tight txtable">
        <thead><tr><th>Date</th><th>Description</th><th>Body</th><th>Fund</th><th>Method</th><th>Type</th><th style={{ textAlign: 'right' }}>Amount</th><th style={{ textAlign: 'center' }}>Audit</th></tr></thead>
        <tbody>
          {rows.map(t => (
            <tr key={t.id}>
              <td className="nowrap">{t.tx_date}</td>
              <td><span className="desc-cell" title={t.description}>{t.description}</span></td>
              <td><BodyCell r={t} /></td>
              <td>{t.fund}</td>
              <td>{t.method}</td>
              <td><span className={'lchip ' + (t.type === 'In' ? 'approved' : 'declined')}>{t.type}</span></td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{t.type === 'Out' ? '−' : '+'}{fjd(t.amount_cents)}</td>
              <td><span className="tx-actions"><WhoPopover tx={t} />{canEdit && <ArchiveBtn path={'/fin-transactions/' + t.id} label="transaction" onDone={onArchive} />}</span></td>
            </tr>
          ))}
          {rows.length === 0 && noneRow(8)}
        </tbody>
      </table>
    </>
  )
}

function Assets({ filter, canEdit, refresh, onArchive }) {
  const { data } = useData('/assets?_r=' + refresh)
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(a => matchBody(filter, a))
  const total = rows.reduce((s, a) => s + a.value_cents, 0)
  return (
    <>
      <p className="sub">Body-owned buildings, equipment and infrastructure.</p>
      <div className="totrow">
        <div className="tot"><b>{rows.length}</b>Assets</div>
        <div className="tot"><b>{fjd(total)}</b>Total book value</div>
      </div>
      <table className="tight">
        <thead><tr><th>Asset</th><th>Body</th><th>Category</th><th>Acquired</th><th>Condition</th><th>Custodian</th><th style={{ textAlign: 'right' }}>Value</th>{canEdit && <th></th>}</tr></thead>
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
              {canEdit && <td><ArchiveBtn path={'/assets/' + a.id} label="asset" onDone={onArchive} /></td>}
            </tr>
          ))}
          {rows.length === 0 && noneRow(canEdit ? 8 : 7)}
        </tbody>
      </table>
    </>
  )
}

function Investments({ filter, canEdit, refresh, onArchive }) {
  const { data } = useData('/investments?_r=' + refresh)
  if (!data) return <p className="loading">Loading…</p>
  const rows = data.filter(i => matchBody(filter, i))
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
        <thead><tr><th>Investment</th><th>Body</th><th>Type</th><th style={{ textAlign: 'right' }}>Invested</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>Return</th><th>Notes</th>{canEdit && <th></th>}</tr></thead>
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
                {canEdit && <td><ArchiveBtn path={'/investments/' + i.id} label="investment" onDone={onArchive} /></td>}
              </tr>
            )
          })}
          {rows.length === 0 && noneRow(canEdit ? 8 : 7)}
        </tbody>
      </table>
    </>
  )
}
