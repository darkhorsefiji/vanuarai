import { useState } from "react";
import { useData, fjd, send } from "../api";
import { useLevels } from "../levels";
import { BodyFilterBar, useBodyFilter, matchBody } from "../bodyfilter";
import { useAuth, isVillageAdmin } from "../auth";
import { EditableText } from "../copy";

// lineage levels the contributions chart can be grouped by
const CHART_LEVELS = ["mataqali", "tokatoka", "vuvale"];

function ContributionsChart({
  projectIds,
  selName,
  onClearSel,
  canEdit,
  refresh,
  onArchive,
}) {
  const [lvl, setLvl] = useState("mataqali");
  const scopeQ =
    (projectIds != null ? "&projects=" + projectIds.join(",") : "") +
    "&_r=" +
    refresh;
  const { data } = useData("/contributions?level=" + lvl + scopeQ);
  const { data: detail } = useData(
    "/contributions-detail?level=" + lvl + scopeQ
  );
  const { map } = useLevels();
  async function voidContribution(id) {
    if (
      !window.confirm(
        "Void this contribution? It will be hidden but kept for records."
      )
    )
      return;
    try {
      await send("DELETE", "/contributions/" + id);
      onArchive();
    } catch (e) {
      window.alert(e.message || "Could not archive");
    }
  }
  const max = data && data.length ? Math.max(...data.map((d) => d.total)) : 1;
  const total = data ? data.reduce((s, d) => s + d.total, 0) : 0;
  return (
    <div className="fundchart card">
      <h3 style={{ marginTop: 0 }}>Contributions</h3>
      {selName && (
        <p className="contrib-scope">
          Showing <b>{selName}</b>{" "}
          <button className="linkbtn" onClick={onClearSel}>
            × clear
          </button>
        </p>
      )}
      <div className="finfilter">
        {CHART_LEVELS.map((l) => (
          <button
            key={l}
            className={"fchip" + (lvl === l ? " active" : "")}
            onClick={() => setLvl(l)}
          >
            {map[l]?.label || l}
          </button>
        ))}
        {data && <span className="contrib-total">Total {fjd(total)}</span>}
      </div>
      {!data ? (
        <p className="loading">Loading…</p>
      ) : data.length === 0 ? (
        <p className="meta">No contributions recorded at this level.</p>
      ) : (
        // stagger labels (one low, one high, repeat) once bars get congested
        <div className={"barchart" + (data.length > 6 ? " stagger" : "")}>
          {data.map((d) => (
            <div
              className="barcol"
              key={d.label}
              title={`${d.label} — ${fjd(d.total)}`}
            >
              <div
                className="chartbar"
                style={{
                  height: Math.round((d.total / max) * 130) + 26 + "px",
                }}
              >
                <span className="barval">{fjd(d.total)}</span>
              </div>
              <span className="barlbl">{d.label}</span>
            </div>
          ))}
        </div>
      )}

      <h4 className="contrib-h">Contributors</h4>
      <div className="contrib-detail">
        <table className="tight">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>{map[lvl]?.label || lvl}</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {!detail ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="loading">
                  Loading…
                </td>
              </tr>
            ) : detail.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="meta">
                  No contributions recorded.
                </td>
              </tr>
            ) : (
              detail.map((r, i) => (
                <tr key={r.id || i}>
                  <td>{r.date}</td>
                  <td>{r.name}</td>
                  <td>{r.body}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {fjd(r.amount)}
                  </td>
                  {canEdit && (
                    <td>
                      <button
                        className="mini danger"
                        title="Void (archive)"
                        onClick={() => voidContribution(r.id)}
                      >
                        🗑
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Fundraising() {
  const { user } = useAuth();
  const canEdit = isVillageAdmin(user);
  const [refresh, setRefresh] = useState(0);
  const { data } = useData("/fundraising?_r=" + refresh);
  const { filter, setFilter: setFilterRaw, bodiesByLevel } = useBodyFilter();
  const [selProject, setSelProject] = useState(null);
  const [msg, setMsg] = useState("");
  // changing the body filter clears any card selection
  const setFilter = (f) => {
    setSelProject(null);
    setFilterRaw(f);
  };
  const bump = () => setRefresh((r) => r + 1);
  async function archiveEffort(e, r) {
    e.stopPropagation();
    if (
      !window.confirm(
        `Void the “${r.name}” effort? It and its contributions will be hidden but kept for records.`
      )
    )
      return;
    try {
      await send("DELETE", "/fundraising/" + r.id);
      setSelProject(null);
      bump();
    } catch (err) {
      window.alert(err.message || "Could not archive");
    }
  }
  if (!data) return <p className="loading">Loading…</p>;
  const rows = data.filter((r) => matchBody(filter, r));
  const totRaised = rows.reduce((s, r) => s + r.raised, 0);
  const totGoal = rows.reduce((s, r) => s + (r.goal_cents || 0), 0);
  // chart/contributors scope: a selected card → just it; a body filter → its visible
  // efforts; otherwise null = all contributions village-wide.
  const projectIds = selProject
    ? [selProject]
    : filter.level !== "all"
      ? rows.map((r) => r.id)
      : null;
  const selName = selProject
    ? data.find((r) => r.id === selProject)?.name || null
    : null;
  return (
    <>
      <div className="pagetop">
        <h1>Fundraising</h1>
        <EditableText id="fundraising.sub" className="sub">
          Endorsed efforts across the village. Contributions are village-wide
          transparent.
        </EditableText>
      </div>
      <BodyFilterBar
        filter={filter}
        setFilter={setFilter}
        bodiesByLevel={bodiesByLevel}
      />
      <div className="totrow">
        <div className="tot">
          <b>{fjd(totRaised)}</b>Total raised
        </div>
        <div className="tot">
          <b>{fjd(totGoal)}</b>Total goals
        </div>
        <div className="tot">
          <b>{rows.length}</b>Active efforts
        </div>
      </div>
      {msg && <p className="note">{msg}</p>}

      <div className="cols fund-cols">
        <div className="col">
          {rows.length === 0 && (
            <p className="meta">No fundraising efforts for this body.</p>
          )}
          <div className="fundcards">
            {rows.map((r) => {
              const pct = r.goal_cents
                ? Math.min(100, Math.round((r.raised / r.goal_cents) * 100))
                : 0;
              return (
                <div
                  className={
                    "card fundcard" + (selProject === r.id ? " sel" : "")
                  }
                  key={r.id}
                  onClick={() =>
                    setSelProject(selProject === r.id ? null : r.id)
                  }
                  title="Click to show this effort's contributions"
                >
                  <div className="fundcard-top">
                    <h3>{r.name}</h3>
                    {canEdit && (
                      <button
                        className="mini danger"
                        title="Void (archive) this effort"
                        onClick={(e) => archiveEffort(e, r)}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  <div className="meta">{r.owner}</div>
                  <div className="bar">
                    <i style={{ width: pct + "%" }} />
                  </div>
                  <div className="meta">
                    {fjd(r.raised)} of {fjd(r.goal_cents)} goal
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span className="chip pop">{pct}% funded</span>
                    <button
                      className="paybtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMsg(
                          `Contributions for “${r.name}” open once the Tobu wallet goes live (pending RBF clearance).`
                        );
                      }}
                    >
                      Contribute
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <aside className="col">
          <ContributionsChart
            projectIds={projectIds}
            selName={selName}
            onClearSel={() => setSelProject(null)}
            canEdit={canEdit}
            refresh={refresh}
            onArchive={bump}
          />
        </aside>
      </div>
    </>
  );
}
