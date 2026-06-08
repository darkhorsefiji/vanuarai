import { useData, fjd } from '../api'
import { EditableText } from '../copy'

export default function Financials() {
  const { data } = useData('/financials')
  if (!data) return <p className="loading">Loading…</p>
  const tin = data.reduce((s, r) => s + r.tin, 0)
  const tout = data.reduce((s, r) => s + r.tout, 0)
  return (
    <>
      <h1>Village Financials</h1>
      <EditableText id="financials.sub" className="sub">Auto-generated from the Tobu ledger (Village body pots). Member-tier view.</EditableText>
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
