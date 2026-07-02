import { useState, useEffect } from "react";
import { get, send } from "./api";
import { useLevels } from "./levels";
import { useAuth, isVillageAdmin } from "./auth";
import ActionCard from "./ActionCard";

// Data is entered at the operational levels and only viewed (rolled up) above.
const EDITABLE_LEVELS = [
  "mataqali",
  "tokatoka",
  "vuvale",
  "district",
  "village",
];
const LEVEL_ORDER = [
  "vanua",
  "yavusa",
  "mataqali",
  "tokatoka",
  "vuvale",
  "matanitu",
  "provincial_council",
  "district",
  "village",
  "soqosoqo",
];
const fmt = (v, unit) =>
  unit === "FJD"
    ? "$" + Number(v).toLocaleString()
    : Number(v).toLocaleString();

function EditRow({ row, onSave, onDel }) {
  const [act, setAct] = useState(row.actual);
  const [tgt, setTgt] = useState(row.target);
  return (
    <tr>
      <td>
        {row.name} {row.unit ? <span className="meta">{row.unit}</span> : null}
      </td>
      <td>
        <input
          type="number"
          value={act}
          onChange={(e) => setAct(e.target.value)}
        />
      </td>
      <td>
        <input
          type="number"
          value={tgt}
          onChange={(e) => setTgt(e.target.value)}
        />
      </td>
      <td className="rowacts">
        <button
          className="mini"
          onClick={() => onSave(row, Number(tgt) || 0, Number(act) || 0)}
        >
          Save
        </button>
        <button
          className="mini danger"
          onClick={() => onDel(row)}
          title="Remove"
        >
          🗑
        </button>
      </td>
    </tr>
  );
}

// Left = an Outcome's indicators rolled up to the chosen level (Actual/Target/
// Variance). Right (per row) = the interventions related to that Outcome.
export default function OutcomeBoard() {
  const { user } = useAuth();
  const canEdit = isVillageAdmin(user);
  const { map } = useLevels();
  const [axis, setAxis] = useState("traditional");
  const [level, setLevel] = useState("");
  const [focus, setFocus] = useState("");
  const [pillar, setPillar] = useState("");
  const [isic, setIsic] = useState("");
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((r) => r + 1);

  const [tax, setTax] = useState(null);
  const [outcomes, setOutcomes] = useState(null);
  const [sc, setSc] = useState(null);
  const [actions, setActions] = useState([]);
  const [govContacts, setGovContacts] = useState([]);
  const [raiseFor, setRaiseFor] = useState(null); // `${node_id}:${outcome_id}` to open its create form

  useEffect(() => {
    get("/of/taxonomies")
      .then(setTax)
      .catch(() => {});
    get("/gov-contacts")
      .then(setGovContacts)
      .catch(() => {});
  }, []);
  const qs = `axis=${axis}${focus ? "&focus=" + focus : ""}${pillar ? "&pillar=" + pillar : ""}${isic ? "&isic=" + isic : ""}`;
  useEffect(() => {
    setOutcomes(null);
    get("/of/outcomes?" + qs)
      .then(setOutcomes)
      .catch(() => setOutcomes([]));
  }, [qs, refresh]);
  useEffect(() => {
    setSc(null);
    get(`/of/scorecard?${qs}${level ? "&level=" + level : ""}`)
      .then(setSc)
      .catch(() => setSc({ rows: [], levels: [] }));
  }, [qs, level, refresh]);
  const loadActions = () =>
    get("/of/actions")
      .then(setActions)
      .catch(() => setActions([]));
  useEffect(() => {
    loadActions();
  }, [refresh]);

  // editor state
  const [editing, setEditing] = useState(false);
  const [nodeList, setNodeList] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [pickNode, setPickNode] = useState("");
  const [own, setOwn] = useState(null);
  const [addInd, setAddInd] = useState("");
  const [addTgt, setAddTgt] = useState("");
  const [addAct, setAddAct] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (editing && nodeList.length === 0) {
      get("/hierarchy")
        .then(setNodeList)
        .catch(() => {});
      get("/of/indicators")
        .then(setIndicators)
        .catch(() => {});
    }
  }, [editing, nodeList.length]);
  const loadOwn = (id) =>
    get("/of/node/" + id)
      .then(setOwn)
      .catch(() => setOwn([]));
  useEffect(() => {
    if (pickNode) {
      setOwn(null);
      loadOwn(pickNode);
    }
  }, [pickNode]);

  async function upsert(indId, tgt, act) {
    await send("POST", "/of/measurements", {
      indicator_id: indId,
      node_id: pickNode,
      target_value: tgt,
      actual_value: act,
    });
    loadOwn(pickNode);
    bump();
  }
  const saveRow = (r, tgt, act) =>
    upsert(r.indicator_id, tgt, act)
      .then(() => setMsg("Saved ✓"))
      .catch((e) => setMsg("⚠ " + e.message));
  async function delRow(r) {
    if (!window.confirm("Remove this measurement?")) return;
    try {
      await send("DELETE", "/of/measurements/" + r.id);
      setMsg("Removed ✓");
      loadOwn(pickNode);
      bump();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }
  function addRow() {
    if (!addInd) return;
    upsert(addInd, Number(addTgt) || 0, Number(addAct) || 0)
      .then(() => {
        setAddInd("");
        setAddTgt("");
        setAddAct("");
        setMsg("Added ✓");
      })
      .catch((e) => setMsg("⚠ " + e.message));
  }

  if (!sc || !outcomes || !tax) return <p className="loading">Loading…</p>;
  const lvl = level || sc.level;
  const meta = Object.fromEntries(outcomes.map((o) => [o.id, o]));

  // group rolled-up rows: node -> outcome -> [indicator rows]
  const byNode = {};
  for (const r of sc.rows) {
    const node = (byNode[r.node_id] ||= {
      id: r.node_id,
      label: r.node_label,
      outcomes: {},
    });
    (node.outcomes[r.outcome_id] ||= []).push(r);
  }
  const nodes = Object.values(byNode);
  const multiNode = nodes.length > 1;
  const axisNodes = nodeList
    .filter((n) => n.axis === axis && EDITABLE_LEVELS.includes(n.level))
    .sort(
      (a, b) =>
        LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
        a.label.localeCompare(b.label)
    );
  // interventions/projects grouped by their Outcome (tasks live nested under them)
  const topFor = (oid) =>
    actions.filter(
      (a) =>
        a.outcome_id === oid && (a.kind !== "task" || !a.parent_intervention_id)
    );
  const childrenOf = (id) =>
    actions.filter((a) => a.parent_intervention_id === id);

  return (
    <div className="scorecard of-board">
      {/* ── Full-width filters ─────────────────────────────────────────────── */}
      <div className="finfilter">
        <span className="finfilter-lbl">Axis</span>
        <button
          className={"fchip" + (axis === "traditional" ? " active" : "")}
          onClick={() => {
            setAxis("traditional");
            setLevel("");
          }}
        >
          Vanua
        </button>
        <button
          className={"fchip" + (axis === "government" ? " active" : "")}
          onClick={() => {
            setAxis("government");
            setLevel("");
          }}
        >
          Government
        </button>
        <span className="finfilter-lbl" style={{ marginLeft: 14 }}>
          Level
        </span>
        {sc.levels.map((l) => (
          <button
            key={l}
            className={"fchip" + (lvl === l ? " active" : "")}
            onClick={() => setLevel(l)}
          >
            {map[l]?.label || l}
          </button>
        ))}
        {canEdit && (
          <button
            className={"btn " + (editing ? "" : "secondary")}
            style={{ marginLeft: "auto" }}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Done" : "✎ Enter data"}
          </button>
        )}
      </div>

      <div className="finfilter of-classfilter">
        <span className="finfilter-lbl">Focus</span>
        <button
          className={"fchip" + (focus === "" ? " active" : "")}
          onClick={() => setFocus("")}
        >
          All
        </button>
        {tax.focus_areas.map((f) => (
          <button
            key={f.id}
            className={"fchip" + (focus === f.id ? " active" : "")}
            style={focus === f.id ? { borderColor: f.accent } : null}
            onClick={() => setFocus(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="finfilter of-classfilter">
        <span className="finfilter-lbl">Platform</span>
        <button
          className={"fchip" + (pillar === "" ? " active" : "")}
          onClick={() => setPillar("")}
        >
          All
        </button>
        {tax.pillars.map((p) => (
          <button
            key={p.id}
            className={"fchip of-tip" + (pillar === p.id ? " active" : "")}
            data-tip={`P${p.platform_no} · ${p.name}`}
            aria-label={p.name}
            onClick={() => setPillar(p.id)}
          >
            P{p.platform_no}
          </button>
        ))}
        <label className="of-isicsel" style={{ marginLeft: 14 }}>
          ISIC&nbsp;
          <select value={isic} onChange={(e) => setIsic(e.target.value)}>
            <option value="">All sectors</option>
            {tax.isic.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} · {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {editing && (
        <div className="card sc-editor">
          <div className="sc-ed-head">
            {msg && <span className="status">{msg}</span>}
            <label>
              Node&nbsp;
              <select
                value={pickNode}
                onChange={(e) => setPickNode(e.target.value)}
              >
                <option value="">Select a node…</option>
                {axisNodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {map[n.level]?.label || n.level} · {n.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {pickNode &&
            (own == null ? (
              <p className="loading">Loading…</p>
            ) : (
              <table className="sc-ed-table">
                <tbody>
                  <tr>
                    <th>Indicator</th>
                    <th>Actual</th>
                    <th>Target</th>
                    <th></th>
                  </tr>
                  {own.map((r) => (
                    <EditRow
                      key={r.id}
                      row={r}
                      onSave={saveRow}
                      onDel={delRow}
                    />
                  ))}
                  <tr className="sc-ed-add">
                    <td>
                      <select
                        value={addInd}
                        onChange={(e) => setAddInd(e.target.value)}
                      >
                        <option value="">+ Add an indicator…</option>
                        {indicators
                          .filter(
                            (k) => !own.some((o) => o.indicator_id === k.id)
                          )
                          .map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.outcome_title} · {k.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={addAct}
                        onChange={(e) => setAddAct(e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={addTgt}
                        onChange={(e) => setAddTgt(e.target.value)}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <button
                        className="mini"
                        onClick={addRow}
                        disabled={!addInd}
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          <p className="meta sc-ed-hint">
            Enter each node's own Actual/Target; figures roll up to the parent
            levels automatically (sum / avg / local).
          </p>
        </div>
      )}

      {/* ── Per-Outcome rows: scorecard (left) · interventions (right) ──────── */}
      {nodes.length === 0 ? (
        <p className="meta">
          No measurements recorded at this level yet
          {focus || pillar || isic ? " for this filter" : ""}.{" "}
          {canEdit ? "Use “✎ Enter data”." : ""}
        </p>
      ) : (
        nodes.map((nd) => (
          <div key={nd.id}>
            {multiNode && <h4 className="of-node-h">{nd.label}</h4>}
            {Object.entries(nd.outcomes).map(([oid, rows]) => {
              const o = meta[oid] || { id: oid, title: rows[0].outcome_title };
              const rowKey = nd.id + ":" + oid;
              return (
                <div className="of-row" key={rowKey}>
                  <div className="card of-oc">
                    <div className="sc-persp-h of-outcome-h">
                      <span>{o.title}</span>
                      <span className="of-badges">
                        {o.focus_label && (
                          <span
                            className="of-badge"
                            style={{ "--b": o.accent || "var(--ocean)" }}
                          >
                            {o.focus_label}
                          </span>
                        )}
                        {o.platform_no && (
                          <span
                            className="of-badge of-badge-p of-tip"
                            data-tip={`P${o.platform_no} · ${o.pillar_name}`}
                            aria-label={o.pillar_name}
                          >
                            P{o.platform_no}
                          </span>
                        )}
                        {o.isic_code && (
                          <span
                            className="of-badge of-badge-i"
                            title={o.isic_title}
                          >
                            {o.isic_code}
                          </span>
                        )}
                      </span>
                    </div>
                    {rows.map((k, j) => {
                      const pct = k.target
                        ? Math.min(100, Math.round((k.actual / k.target) * 100))
                        : 0;
                      const varc = k.variance ?? k.actual - k.target;
                      return (
                        <div className="sc-kpi" key={j}>
                          <div className="sc-kpi-top">
                            <span>{k.name}</span>
                            <span className="sc-kpi-val">
                              {fmt(k.actual, k.unit)} / {fmt(k.target, k.unit)}
                              {k.unit && k.unit !== "FJD"
                                ? " " + k.unit
                                : ""} · {pct}%
                              <span
                                className={
                                  "of-var " + (varc < 0 ? "neg" : "pos")
                                }
                              >
                                {varc < 0 ? "▾" : "▴"}{" "}
                                {fmt(Math.abs(varc), k.unit)}
                              </span>
                            </span>
                          </div>
                          <div className="bar">
                            <i style={{ width: pct + "%" }} />
                          </div>
                          {canEdit && varc < 0 && (
                            <button
                              className="mini of-raise"
                              onClick={() =>
                                setRaiseFor({
                                  key: rowKey,
                                  title: `Close gap: ${k.name}`,
                                  indicator_id: k.indicator_id,
                                })
                              }
                            >
                              ＋ Raise action to close gap
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <ActionCard
                    outcome={o}
                    nodeId={nd.id}
                    actions={topFor(oid)}
                    childrenOf={childrenOf}
                    govContacts={govContacts}
                    canEdit={canEdit}
                    onChange={bump}
                    autoOpen={raiseFor?.key === rowKey}
                    prefillTitle={
                      raiseFor?.key === rowKey ? raiseFor.title : ""
                    }
                    prefillIndicator={
                      raiseFor?.key === rowKey ? raiseFor.indicator_id : null
                    }
                    onConsume={() => setRaiseFor(null)}
                  />
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
