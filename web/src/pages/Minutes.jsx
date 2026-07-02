import { useEffect, useState } from "react";
import { useData } from "../api";
import { LevelBadge, useLevels } from "../levels";
import { BodyFilterBar, useBodyFilter, matchBody } from "../bodyfilter";
import { EditableText } from "../copy";

const PILL = {
  Approved: "approved",
  Rejected: "declined",
  Deferred: "voting",
  Withdrawn: "pending",
  Noted: "itltb",
};
const ACTIONABLE = new Set(["Approved", "Rejected"]);

// Asks what action to take on a resolution. The real workflow (routing the
// question to the Vunivola) comes with the workflows build; the list of
// actions is DEV-administered on the Dev page.
function ActionModal({ resolution, onClose }) {
  const { data: actions } = useData("/resolution-action-types");
  const [chosen, setChosen] = useState(null);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Action — {resolution.ref}</h3>
        {!chosen ? (
          <>
            <p className="sub">What action is to be taken?</p>
            <div className="actionlist">
              {!actions ? (
                <p className="loading">Loading…</p>
              ) : (
                actions.map((a) => (
                  <button
                    key={a.id}
                    className="btn secondary"
                    onClick={() => setChosen(a.label)}
                  >
                    {a.label}
                  </button>
                ))
              )}
              {actions && actions.length === 0 && (
                <p className="meta">
                  No actions configured — DEV can add them on the Dev page.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="sub">
            “<b>{chosen}</b>” selected. The workflow that asks the Vunivola to
            carry this out will be wired when workflows land.
          </p>
        )}
        <div style={{ textAlign: "right", marginTop: 10 }}>
          <button className="mini" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const COLS = [
  ["d", "Date"],
  ["level", "Level"],
  ["label", "Body"],
  ["title", "Title"],
];

export default function Minutes() {
  const { data } = useData("/minutes");
  const { map: levelMap } = useLevels();
  const { filter, setFilter, bodiesByLevel } = useBodyFilter();
  const [sel, setSel] = useState(null);
  const [actionFor, setActionFor] = useState(null);
  const [sort, setSort] = useState({ key: "d", dir: -1 });
  const [filters, setFilters] = useState({
    d: "",
    level: "",
    label: "",
    title: "",
  });
  useEffect(() => {
    if (data && data.length && sel == null) setSel(data[0].id);
  }, [data, sel]);

  if (!data) return <p className="loading">Loading…</p>;
  const cur = data.find((m) => m.id === sel);

  const colText = (r, k) =>
    k === "level" ? levelMap[r.level]?.label || r.level : r[k] || "";
  const rows = data
    .filter((r) => matchBody(filter, r))
    .filter((r) =>
      COLS.every(
        ([k]) =>
          !filters[k].trim() ||
          colText(r, k).toLowerCase().includes(filters[k].trim().toLowerCase())
      )
    )
    .sort(
      (a, b) =>
        colText(a, sort.key).localeCompare(colText(b, sort.key)) * sort.dir
    );
  const toggleSort = (k) =>
    setSort((s) => ({ key: k, dir: s.key === k ? -s.dir : 1 }));

  return (
    <>
      <div className="pagetop">
        <h1>Meeting Minutes</h1>
        <EditableText id="minutes.sub" className="sub">
          Classified by level. Select a meeting to view its resolutions.
        </EditableText>
      </div>

      <BodyFilterBar
        filter={filter}
        setFilter={setFilter}
        bodiesByLevel={bodiesByLevel}
      />

      <div className="cols">
        <div className="col">
          <table className="minutes-table">
            <tbody>
              <tr>
                {COLS.map(([k, name]) => (
                  <th
                    key={k}
                    className="th-sort"
                    onClick={() => toggleSort(k)}
                    title="Click to sort"
                  >
                    {name}
                    {sort.key === k ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                  </th>
                ))}
              </tr>
              <tr className="filterrow">
                {COLS.map(([k]) => (
                  <td key={k}>
                    <input
                      placeholder="Filter…"
                      value={filters[k]}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, [k]: e.target.value }))
                      }
                    />
                  </td>
                ))}
              </tr>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={"rowsel" + (r.id === sel ? " sel" : "")}
                  onClick={() => setSel(r.id)}
                >
                  <td>{r.d}</td>
                  <td>
                    <LevelBadge level={r.level} />
                  </td>
                  <td>{r.label}</td>
                  <td className="title-cell" title={r.title}>
                    {r.title}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="meta">
                    No meetings match the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="col">
          <h3 style={{ marginTop: 0 }}>Resolutions</h3>
          {!cur ? (
            <p className="sub">Select a meeting in the table.</p>
          ) : (
            <div className="card">
              <h3>{cur.title}</h3>
              <div className="meta">
                {cur.d} · {cur.label}
              </div>
              {cur.resolutions.length === 0 ? (
                <p className="meta" style={{ marginTop: 10 }}>
                  No resolutions recorded for this meeting.
                </p>
              ) : (
                <div className="ressubs">
                  {cur.resolutions.map((r, i) => {
                    const actionable = ACTIONABLE.has(r.status);
                    return (
                      <div
                        key={i}
                        className={
                          "rescard" + (actionable ? " actionable" : "")
                        }
                        title={
                          actionable ? "Click to choose an action" : undefined
                        }
                        onClick={actionable ? () => setActionFor(r) : undefined}
                      >
                        <div className="res-head">
                          <b>{r.ref}</b>
                          <span
                            className={"lchip " + (PILL[r.status] || "pending")}
                          >
                            {r.status || "Noted"}
                          </span>
                        </div>
                        <span className="res-summary">{r.summary}</span>
                        {actionable && (
                          <span className="res-hint">▸ click for actions</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {actionFor && (
        <ActionModal
          resolution={actionFor}
          onClose={() => setActionFor(null)}
        />
      )}
    </>
  );
}
