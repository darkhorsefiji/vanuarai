import { useState } from 'react'
import { useData } from './api'
import { useLevels } from './levels'

// KPI targets grouped by BSC perspective, rolled up the hierarchy. Reusable across
// the Vanua (axis=traditional) and Government (axis=government) views.
export default function Scorecard({ axis = 'traditional' }) {
  const [level, setLevel] = useState('')
  const { data } = useData(`/scorecard?axis=${axis}${level ? '&level=' + level : ''}`)
  const { map } = useLevels()
  if (!data) return <p className="loading">Loading…</p>
  const lvl = level || data.level
  const fmt = (v, unit) => unit === 'FJD' ? '$' + Number(v).toLocaleString() : Number(v).toLocaleString()

  // group rows -> node -> perspective
  const byNode = {}
  for (const r of data.rows) {
    const node = (byNode[r.node_id] ||= { label: r.node_label, persp: {} })
    ;(node.persp[r.perspective] ||= []).push(r)
  }
  const nodes = Object.values(byNode)

  return (
    <div className="scorecard">
      <div className="finfilter">
        <span className="finfilter-lbl">Level</span>
        {data.levels.map(l => (
          <button key={l} className={'fchip' + (lvl === l ? ' active' : '')} onClick={() => setLevel(l)}>{map[l]?.label || l}</button>
        ))}
      </div>
      {nodes.length === 0
        ? <p className="meta">No targets recorded at this level.</p>
        : (
          <div className="sc-nodes">
            {nodes.map((nd, i) => (
              <div className="card sc-card" key={i}>
                <h4 className="sc-node">{nd.label}</h4>
                <div className="sc-persps">
                {Object.entries(nd.persp).map(([persp, kpis]) => (
                  <div className="sc-persp" key={persp}>
                    <div className="sc-persp-h">{persp}</div>
                    {kpis.map((k, j) => {
                      const pct = k.target ? Math.min(100, Math.round((k.actual / k.target) * 100)) : 0
                      return (
                        <div className="sc-kpi" key={j}>
                          <div className="sc-kpi-top">
                            <span>{k.name}</span>
                            <span className="sc-kpi-val">{fmt(k.actual, k.unit)} / {fmt(k.target, k.unit)}{k.unit && k.unit !== 'FJD' ? ' ' + k.unit : ''} · {pct}%</span>
                          </div>
                          <div className="bar"><i style={{ width: pct + '%' }} /></div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
