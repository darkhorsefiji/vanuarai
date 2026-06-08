import { useData } from '../api'

export default function Minutes() {
  const { data } = useData('/minutes')
  if (!data) return <p className="loading">Loading…</p>
  return (
    <>
      <h1>Meeting Minutes</h1>
      <p className="sub">Classified by level. Member-tier view.</p>
      <table>
        <tbody>
          <tr><th>Date</th><th>Level</th><th>Body</th><th>Title</th><th>Resolutions</th></tr>
          {data.map((r, i) => (
            <tr key={i}>
              <td>{r.d}</td>
              <td><span className={'lvl ' + r.level}>{r.level}</span></td>
              <td>{r.label}</td>
              <td>{r.title}</td>
              <td className="meta">{r.res || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
