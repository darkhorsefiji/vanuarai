import { useState, useEffect } from "react";
import { useData, get, send } from "./api";
import { useLevels } from "./levels";
import { useAuth, isVillageAdmin } from "./auth";
import { FRAMEWORK_KPIS, PLATFORMS } from "./strategy";

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
const PERSP_TITLES = [
  "The Strengthened Family",
  "Productive Capability",
  "Vanua & Nation",
  "Wealth Creation",
];
// Data is entered at the operational levels and only viewed (rolled up) above.
const EDITABLE_LEVELS = ["mataqali", "tokatoka", "vuvale"];
const PLATFORM_NAME = Object.fromEntries(PLATFORMS.map((p) => [p.n, p.name]));
const platLabel = (p) =>
  p ? `Platform ${p} · ${PLATFORM_NAME[p] || ""}`.trim() : "Unmapped";
const BLANK_KPI = {
  perspective: "The Strengthened Family",
  name: "",
  unit: "",
  rollup: "sum",
  tier: "core",
};

// One editable measurement row (local draft of actual/target).
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

// KPI targets grouped by BSC perspective, rolled up the hierarchy. Reusable across
// the Vanua (axis=traditional) and Government (axis=government) views. Village
// admins get an inline editor to enter a node's own values, which roll up live.
export default function Scorecard({ axis = "traditional" }) {
  const { user } = useAuth();
  const canEdit = isVillageAdmin(user);
  const [level, setLevel] = useState("");
  const [lens, setLens] = useState("perspective"); // 'perspective' | 'platform'
  const [refresh, setRefresh] = useState(0);
  const { data } = useData(
    `/scorecard?axis=${axis}${level ? "&level=" + level : ""}&_r=${refresh}`
  );
  const { map } = useLevels();

  // editor state (lazy-loaded the first time it opens)
  const [editing, setEditing] = useState(false);
  const [nodeList, setNodeList] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [pickNode, setPickNode] = useState("");
  const [own, setOwn] = useState(null);
  const [addKpi, setAddKpi] = useState("");
  const [addTgt, setAddTgt] = useState("");
  const [addAct, setAddAct] = useState("");
  const [msg, setMsg] = useState("");
  const [catMode, setCatMode] = useState("data"); // 'data' | 'catalogue'
  const [nk, setNk] = useState(BLANK_KPI); // new-KPI form

  useEffect(() => {
    if (editing && nodeList.length === 0) {
      get("/hierarchy")
        .then(setNodeList)
        .catch(() => {});
      get("/scorecard/kpis")
        .then(setKpis)
        .catch(() => {});
    }
  }, [editing, nodeList.length]);
  const loadOwn = (id) =>
    get("/scorecard/node/" + id)
      .then(setOwn)
      .catch(() => setOwn([]));
  useEffect(() => {
    if (pickNode) {
      setOwn(null);
      loadOwn(pickNode);
    }
  }, [pickNode]);

  const bump = () => setRefresh((r) => r + 1);
  async function upsert(kpiId, tgt, act) {
    await send("POST", "/scorecard/targets", {
      node_id: pickNode,
      kpi_id: kpiId,
      target_value: tgt,
      actual_value: act,
    });
    loadOwn(pickNode);
    bump();
  }
  const saveRow = (r, tgt, act) =>
    upsert(r.kpi_id, tgt, act)
      .then(() => setMsg("Saved ✓"))
      .catch((e) => setMsg("⚠ " + e.message));
  async function delRow(r) {
    if (!window.confirm("Remove this measurement?")) return;
    try {
      await send("DELETE", "/scorecard/targets/" + r.id);
      setMsg("Removed ✓");
      loadOwn(pickNode);
      bump();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }
  function addRow() {
    if (!addKpi) return;
    upsert(addKpi, Number(addTgt) || 0, Number(addAct) || 0)
      .then(() => {
        setAddKpi("");
        setAddTgt("");
        setAddAct("");
        setMsg("Added ✓");
      })
      .catch((e) => setMsg("⚠ " + e.message));
  }

  const reloadKpis = () =>
    get("/scorecard/kpis")
      .then(setKpis)
      .catch(() => {});
  async function importFramework() {
    setMsg("Importing…");
    let ok = 0;
    for (const k of FRAMEWORK_KPIS) {
      try {
        await send("POST", "/scorecard/kpis", k);
        ok++;
      } catch {
        /* skip */
      }
    }
    await reloadKpis();
    setMsg(`Imported ${ok} framework KPIs ✓`);
  }
  function createKpi() {
    if (!nk.perspective || !nk.name.trim()) return;
    send("POST", "/scorecard/kpis", { ...nk, name: nk.name.trim() })
      .then(reloadKpis)
      .then(() => {
        setNk(BLANK_KPI);
        setMsg("KPI added ✓");
      })
      .catch((e) => setMsg("⚠ " + e.message));
  }
  async function archiveKpi(k) {
    if (
      !window.confirm(`Archive "${k.name}"? Its measurements stop rolling up.`)
    )
      return;
    try {
      await send("DELETE", "/scorecard/kpis/" + k.id);
      await reloadKpis();
      bump();
      setMsg("Archived ✓");
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }

  if (!data) return <p className="loading">Loading…</p>;
  const lvl = level || data.level;
  const fmt = (v, unit) =>
    unit === "FJD"
      ? "$" + Number(v).toLocaleString()
      : Number(v).toLocaleString();

  // group rows -> node -> {group} where the group is the current lens
  const groupLabel = (r) =>
    lens === "platform" ? platLabel(r.platform) : r.perspective;
  const groupSort =
    lens === "platform"
      ? (a, b) =>
          (a === "Unmapped" ? 99 : Number(a.match(/\d+/)?.[0] || 99)) -
          (b === "Unmapped" ? 99 : Number(b.match(/\d+/)?.[0] || 99))
      : (a, b) => a.localeCompare(b);
  const byNode = {};
  for (const r of data.rows) {
    const node = (byNode[r.node_id] ||= { label: r.node_label, persp: {} });
    (node.persp[groupLabel(r)] ||= []).push(r);
  }
  const nodes = Object.values(byNode);
  // Editing happens at the operational levels only; upper levels are view-only.
  const axisNodes = nodeList
    .filter((n) => n.axis === axis && EDITABLE_LEVELS.includes(n.level))
    .sort(
      (a, b) =>
        LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
        a.label.localeCompare(b.label)
    );

  return (
    <div className="scorecard">
      <div className="finfilter">
        <span className="finfilter-lbl">Level</span>
        {data.levels.map((l) => (
          <button
            key={l}
            className={"fchip" + (lvl === l ? " active" : "")}
            onClick={() => setLevel(l)}
          >
            {map[l]?.label || l}
          </button>
        ))}
        <span className="sc-lens">
          <button
            className={"fchip" + (lens === "perspective" ? " active" : "")}
            onClick={() => setLens("perspective")}
          >
            By Perspective
          </button>
          <button
            className={"fchip" + (lens === "platform" ? " active" : "")}
            onClick={() => setLens("platform")}
          >
            By TAB Platform
          </button>
        </span>
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

      {editing && (
        <div className="card sc-editor">
          <div className="sc-ed-tabs">
            <button
              className={"mini" + (catMode === "data" ? "" : " secondary")}
              onClick={() => setCatMode("data")}
            >
              Node data
            </button>
            <button
              className={"mini" + (catMode === "catalogue" ? "" : " secondary")}
              onClick={() => setCatMode("catalogue")}
            >
              Catalogue ({kpis.length})
            </button>
            {msg && <span className="status">{msg}</span>}
          </div>

          {catMode === "data" ? (
            <>
              <div className="sc-ed-head">
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
                        <th>KPI</th>
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
                            value={addKpi}
                            onChange={(e) => setAddKpi(e.target.value)}
                          >
                            <option value="">+ Add a KPI…</option>
                            {kpis
                              .filter(
                                (k) => !own.some((o) => o.kpi_id === k.id)
                              )
                              .map((k) => (
                                <option key={k.id} value={k.id}>
                                  {k.perspective} · {k.name}
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
                            disabled={!addKpi}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ))}
              <p className="meta sc-ed-hint">
                Data is entered at the Mataqali, Tokatoka &amp; Vuvale levels —
                figures roll up to the Yavusa and Vanua automatically (those
                upper levels are view-only).
              </p>
            </>
          ) : (
            <div className="sc-catalogue">
              <div className="sc-cat-actions">
                <button className="btn secondary" onClick={importFramework}>
                  ⬇ Import framework KPIs ({FRAMEWORK_KPIS.length})
                </button>
                <span className="meta">
                  Seeds the Meda Matata Mada KPIs so they’re enterable.
                  Re-running just updates them.
                </span>
              </div>
              <div className="sc-cat-create">
                <select
                  value={nk.perspective}
                  onChange={(e) =>
                    setNk({ ...nk, perspective: e.target.value })
                  }
                >
                  {PERSP_TITLES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  value={nk.name}
                  onChange={(e) => setNk({ ...nk, name: e.target.value })}
                  placeholder="New KPI name"
                />
                <input
                  value={nk.unit}
                  onChange={(e) => setNk({ ...nk, unit: e.target.value })}
                  placeholder="unit"
                  className="sc-cat-unit"
                />
                <select
                  value={nk.rollup}
                  onChange={(e) => setNk({ ...nk, rollup: e.target.value })}
                  title="roll-up rule"
                >
                  <option value="sum">sum</option>
                  <option value="avg">avg</option>
                  <option value="none">none</option>
                </select>
                <select
                  value={nk.tier}
                  onChange={(e) => setNk({ ...nk, tier: e.target.value })}
                  title="tier"
                >
                  <option value="core">core</option>
                  <option value="spinoff">spinoff</option>
                </select>
                <button
                  className="mini"
                  onClick={createKpi}
                  disabled={!nk.name.trim()}
                >
                  Add KPI
                </button>
              </div>
              {kpis.length === 0 ? (
                <p className="meta">
                  No KPIs catalogued yet — import the framework above.
                </p>
              ) : (
                <table className="sc-cat-table">
                  <tbody>
                    <tr>
                      <th>KPI</th>
                      <th>Unit</th>
                      <th>Roll-up</th>
                      <th>Tier</th>
                      <th></th>
                    </tr>
                    {kpis.map((k) => (
                      <tr key={k.id}>
                        <td>
                          {k.name}
                          <span className="meta"> · {k.perspective}</span>
                        </td>
                        <td>{k.unit || "—"}</td>
                        <td>{k.rollup}</td>
                        <td>{k.tier}</td>
                        <td>
                          <button
                            className="mini danger"
                            onClick={() => archiveKpi(k)}
                            title="Archive"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {nodes.length === 0 ? (
        <p className="meta">No targets recorded at this level.</p>
      ) : (
        <div className="sc-nodes">
          {nodes.map((nd, i) => (
            <div className="card sc-card" key={i}>
              <h4 className="sc-node">{nd.label}</h4>
              <div className="sc-persps">
                {Object.entries(nd.persp)
                  .sort((a, b) => groupSort(a[0], b[0]))
                  .map(([persp, kpiRows]) => (
                    <div className="sc-persp" key={persp}>
                      <div className="sc-persp-h">{persp}</div>
                      {kpiRows.map((k, j) => {
                        const pct = k.target
                          ? Math.min(
                              100,
                              Math.round((k.actual / k.target) * 100)
                            )
                          : 0;
                        return (
                          <div className="sc-kpi" key={j}>
                            <div className="sc-kpi-top">
                              <span>{k.name}</span>
                              <span className="sc-kpi-val">
                                {fmt(k.actual, k.unit)} /{" "}
                                {fmt(k.target, k.unit)}
                                {k.unit && k.unit !== "FJD"
                                  ? " " + k.unit
                                  : ""}{" "}
                                · {pct}%
                              </span>
                            </div>
                            <div className="bar">
                              <i style={{ width: pct + "%" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
