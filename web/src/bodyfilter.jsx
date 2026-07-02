import { useState } from "react";
import { useData } from "./api";
import { useLevels } from "./levels";

// Filterable body levels, in the order requested: Yasana, Tikina, Koro, Soqosoqo, Mataqali.
export const FILTER_LEVELS = [
  "provincial_council",
  "district",
  "village",
  "soqosoqo",
  "mataqali",
];

// A specific body wins; otherwise match by level. Rows need { level, body_id }.
export const matchBody = (filter, r) => {
  if (filter.body && filter.body !== "all") return r.body_id === filter.body;
  return filter.level === "all" || r.level === filter.level;
};

// State + the per-level body lists (pulled live from the hierarchy).
export function useBodyFilter() {
  const [filter, setFilter] = useState({ level: "all", body: "all" });
  const { data: nodes } = useData("/hierarchy");
  const bodiesByLevel = {};
  if (nodes) {
    for (const nd of nodes)
      (bodiesByLevel[nd.level] = bodiesByLevel[nd.level] || []).push({
        id: nd.id,
        label: nd.label,
      });
    for (const k of Object.keys(bodiesByLevel))
      bodiesByLevel[k].sort((a, b) => a.label.localeCompare(b.label));
  }
  return { filter, setFilter, bodiesByLevel };
}

// Two-tier filter bar: level row, plus a body sub-row for multi-body levels (Soqosoqo, Mataqali).
export function BodyFilterBar({ filter, setFilter, bodiesByLevel }) {
  const { map } = useLevels();
  const setLevel = (lv) => setFilter({ level: lv, body: "all" });
  const bodies =
    filter.level !== "all" ? bodiesByLevel[filter.level] || [] : [];
  const showBodies = bodies.length > 1;
  return (
    <>
      <div className="finfilter">
        <span className="finfilter-lbl">Filter by body</span>
        <button
          className={"fchip" + (filter.level === "all" ? " active" : "")}
          onClick={() => setLevel("all")}
        >
          All
        </button>
        {FILTER_LEVELS.map((lv) => (
          <button
            key={lv}
            className={"fchip" + (filter.level === lv ? " active" : "")}
            onClick={() => setLevel(lv)}
          >
            {map[lv]?.label || lv}
          </button>
        ))}
      </div>
      {showBodies && (
        <div className="finfilter finfilter-sub">
          <span className="finfilter-lbl">
            {map[filter.level]?.label || filter.level}
          </span>
          <button
            className={"fchip" + (filter.body === "all" ? " active" : "")}
            onClick={() => setFilter({ ...filter, body: "all" })}
          >
            All
          </button>
          {bodies.map((b) => (
            <button
              key={b.id}
              className={"fchip" + (filter.body === b.id ? " active" : "")}
              onClick={() => setFilter({ ...filter, body: b.id })}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
