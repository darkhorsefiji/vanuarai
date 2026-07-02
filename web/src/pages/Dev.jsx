import { useEffect, useMemo, useState } from "react";
import {
  THEME_GROUPS,
  loadOverrides,
  setVar,
  resetVars,
  ensureFont,
  fontStack,
  familyFromStack,
} from "../theme";
import { GOOGLE_FONTS } from "../googleFonts";
import { ICON_SETS, ICON_ITEMS, Icon, useIconSet } from "../icons";
import { resetNavOrder } from "../nav";
import { useAuth } from "../auth";
import { useLevels } from "../levels";
import { get, send } from "../api";
import PlansEditor from "../PlansEditor";

const SYSTEM_FONTS = [
  "System UI",
  "Georgia",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Tahoma",
];

// DEV-administered Fijian + English names for the Vanua/Government hierarchy levels.
function LevelNamesEditor() {
  const { list, refresh } = useLevels();
  const [rows, setRows] = useState(null);
  const [add, setAdd] = useState({ level: "", label: "", label_en: "" });
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (list.length) setRows(list.map((s) => ({ ...s })));
  }, [list]);

  const upd = (i, k, v) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  async function saveRow(r) {
    try {
      await send("PATCH", "/level-styles", {
        styles: [
          {
            level: r.level,
            label: r.label,
            label_en: r.label_en || "",
            color: r.color,
          },
        ],
      });
      setMsg("Saved ✓");
      refresh();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }
  async function delRow(r) {
    if (
      !window.confirm(
        `Remove the “${r.label}” level name? Badges for it fall back to the raw key.`
      )
    )
      return;
    try {
      await send("DELETE", "/level-styles/" + r.level);
      setMsg("Removed ✓");
      refresh();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }
  async function addRow() {
    if (!add.level.trim() || !add.label.trim()) {
      setMsg("Level key and Fijian name are required");
      return;
    }
    try {
      await send("POST", "/level-styles", add);
      setAdd({ level: "", label: "", label_en: "" });
      setMsg("Added ✓");
      refresh();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }

  if (!rows) return <p className="loading">Loading…</p>;
  return (
    <div className="lvlnames">
      <div className="lvlnames-head">
        <span>Level</span>
        <span>Colour</span>
        <span>Fijian name (pill)</span>
        <span>English (bracket)</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div className="lvlnames-row" key={r.level}>
          <span className="lvl" style={{ background: r.color }}>
            {r.label}
          </span>
          <input
            type="color"
            value={r.color}
            onChange={(e) => upd(i, "color", e.target.value)}
          />
          <input
            value={r.label}
            onChange={(e) => upd(i, "label", e.target.value)}
          />
          <input
            value={r.label_en || ""}
            onChange={(e) => upd(i, "label_en", e.target.value)}
            placeholder="(none)"
          />
          <span className="lvlnames-acts">
            <button className="mini" onClick={() => saveRow(r)}>
              Save
            </button>
            <button
              className="mini danger"
              title="Remove"
              onClick={() => delRow(r)}
            >
              🗑
            </button>
          </span>
        </div>
      ))}
      <div className="lvlnames-row">
        <input
          placeholder="level key…"
          value={add.level}
          onChange={(e) => setAdd((a) => ({ ...a, level: e.target.value }))}
        />
        <span />
        <input
          placeholder="Fijian name…"
          value={add.label}
          onChange={(e) => setAdd((a) => ({ ...a, label: e.target.value }))}
        />
        <input
          placeholder="English…"
          value={add.label_en}
          onChange={(e) => setAdd((a) => ({ ...a, label_en: e.target.value }))}
        />
        <span className="lvlnames-acts">
          <button className="mini" onClick={addRow}>
            + Add
          </button>
        </span>
      </div>
      {msg && <span className="status">{msg}</span>}
    </div>
  );
}

// DEV-administered list of actions offered by the resolution Action button (Minutes page).
function ActionTypesEditor() {
  const [items, setItems] = useState(null);
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => get("/resolution-action-types").then(setItems);
  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function add() {
    if (!label.trim()) return;
    try {
      await send("POST", "/resolution-action-types", { label: label.trim() });
      setLabel("");
      setMsg("Added ✓");
      load();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }
  async function del(it) {
    if (!window.confirm(`Remove “${it.label}”?`)) return;
    try {
      await send("DELETE", "/resolution-action-types/" + it.id);
      setMsg("Removed ✓");
      load();
    } catch (e) {
      setMsg("⚠ " + e.message);
    }
  }

  return (
    <div className="actiontypes">
      {!items ? (
        <p className="loading">Loading…</p>
      ) : (
        items.map((it) => (
          <span className="atchip" key={it.id}>
            <span>{it.label}</span>
            <button
              className="mini danger"
              title="Remove"
              onClick={() => del(it)}
            >
              ✕
            </button>
          </span>
        ))
      )}
      <span className="actiontypes-add">
        <input
          placeholder="New action…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button className="mini" onClick={add}>
          + Add
        </button>
      </span>
      {msg && <span className="status">{msg}</span>}
    </div>
  );
}
const ORDER_KEY = "vr_theme_order";
const loadOrder = () => {
  try {
    return JSON.parse(localStorage.getItem(ORDER_KEY)) || {};
  } catch {
    return {};
  }
};
const saveOrder = (o) => localStorage.setItem(ORDER_KEY, JSON.stringify(o));

// DEV-only: clear the demo activity data (type-to-confirm guard).
function ResetDemoData() {
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  async function reset() {
    if (confirm !== "RESET") return;
    if (
      !window.confirm(
        "Clear ALL demo activity (money, efforts, notices, trade, minutes, lands)?\n\nThe village, hierarchy, people and users are KEPT. This cannot be undone."
      )
    )
      return;
    setBusy(true);
    setResult(null);
    try {
      const r = await send("POST", "/dev/reset");
      setResult(r);
      setConfirm("");
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="resetbox">
      <input
        placeholder="type RESET to enable"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <button
        className="btn resetbtn"
        disabled={busy || confirm !== "RESET"}
        onClick={reset}
      >
        {busy ? "Clearing…" : "Reset demo data"}
      </button>
      {result &&
        (result.error ? (
          <span className="status">⚠ {result.error}</span>
        ) : (
          <span className="status">
            Cleared {result.clearedRows} rows ✓ — reload to see empty pages.
          </span>
        ))}
    </div>
  );
}

export default function Dev() {
  const [ov, setOv] = useState(loadOverrides());
  const [fontText, setFontText] = useState({});
  const [order, setOrder] = useState(loadOrder());
  const [drag, setDrag] = useState(null); // { group, key }
  const [over, setOver] = useState(null); // key currently hovered
  const known = useMemo(() => new Set([...GOOGLE_FONTS, ...SYSTEM_FONTS]), []);
  const options = useMemo(() => [...SYSTEM_FONTS, ...GOOGLE_FONTS], []);

  const iconSet = useIconSet();
  const { user } = useAuth();
  const isDev = !!user && user.isAppAdmin;
  const change = (k, v) => {
    setVar(k, v);
    setOv((o) => ({ ...o, [k]: v }));
  };
  const reset = () => {
    resetVars();
    setOv({});
    setFontText({});
    localStorage.removeItem(ORDER_KEY);
    setOrder({});
  };

  function onFont(k, v) {
    setFontText((t) => ({ ...t, [k]: v }));
    if (known.has(v)) {
      ensureFont(v);
      change(k, fontStack(v));
    }
  }

  // items for a group in the user's saved order (new items appended)
  function orderedItems(g) {
    const keys = order[g.group];
    if (!keys) return g.items;
    const byKey = Object.fromEntries(g.items.map((it) => [it.k, it]));
    const seen = new Set(),
      out = [];
    keys.forEach((k) => {
      if (byKey[k] && !seen.has(k)) {
        out.push(byKey[k]);
        seen.add(k);
      }
    });
    g.items.forEach((it) => {
      if (!seen.has(it.k)) out.push(it);
    });
    return out;
  }

  function onDrop(g, targetKey) {
    if (!drag || drag.group !== g.group || drag.key === targetKey) {
      setDrag(null);
      setOver(null);
      return;
    }
    const cur = orderedItems(g).map((it) => it.k);
    cur.splice(cur.indexOf(drag.key), 1);
    cur.splice(cur.indexOf(targetKey), 0, drag.key);
    const next = { ...order, [g.group]: cur };
    setOrder(next);
    saveOrder(next);
    setDrag(null);
    setOver(null);
  }

  return (
    <>
      <div className="pagetop">
        <h1>Developer settings</h1>
        <p className="sub">
          Live theme editor — changes apply instantly across RAIVANUA and
          persist in this browser. Drag the ⠿ handle to reorder cards within a
          section. Use “Reset” to return to the built-in defaults &amp; order.
        </p>
      </div>
      <div className="savebar">
        <button className="btn secondary" onClick={reset}>
          Reset to defaults
        </button>
        <span className="status">
          {Object.keys(ov).length
            ? `${Object.keys(ov).length} override(s) active`
            : "Using defaults"}
        </span>
      </div>

      <datalist id="gfonts">
        {options.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <h3>Sidebar icon set</h3>
      <div className="iconsets">
        {Object.entries(ICON_SETS).map(([id, s]) => {
          const active = iconSet?.setId === id;
          return (
            <div
              key={id}
              className={"iconset-card" + (active ? " on" : "")}
              onClick={() => iconSet?.choose(id)}
            >
              <div className="iconset-top">
                <label className="iconset-radio">
                  <input
                    type="radio"
                    name="iconset"
                    checked={active}
                    onChange={() => iconSet?.choose(id)}
                  />
                  <b>{s.label}</b>
                </label>
                <span className="iconset-hint">{s.hint}</span>
              </div>
              <div className="iconset-grid">
                {ICON_ITEMS.map(([key, lbl]) => (
                  <div className="iconset-cell" key={key} title={lbl}>
                    <Icon name={key} set={id} size={26} />
                    <span>{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {isDev && (
        <>
          <h3>Sidebar menu order</h3>
          <p className="sub">
            Drag the items directly <b>in the sidebar</b> to re-arrange (DEV
            role only) — applies immediately.{" "}
            <button className="mini" onClick={resetNavOrder}>
              ↺ Reset order
            </button>
          </p>

          <h3>Hierarchy level styling &amp; names</h3>
          <p className="sub">
            Pill colour, Fijian name and the English equivalent shown in
            brackets — applies across the Vanua and Government trees
            portal-wide.
          </p>
          <LevelNamesEditor />

          <h3>Resolution actions</h3>
          <p className="sub">
            The actions offered when an Approved/Rejected resolution’s{" "}
            <b>Action</b> button is pressed (Minutes page). Saved to the
            database.
          </p>
          <ActionTypesEditor />

          <h3>Reset demo data</h3>
          <p className="sub">
            Clears the demo <b>activity</b> — contributions, transactions,
            assets, investments, fundraising efforts, notices, trade listings,
            minutes and land records. <b>Keeps</b> the village, full hierarchy,
            people, users, plans and styling. DEV only; <b>cannot be undone</b>.
          </p>
          <ResetDemoData />
        </>
      )}

      <h3>Internet plans</h3>
      <p className="sub">
        Configure the plans &amp; pricing shown on the Internet page. Saved to
        the database — changes are live for everyone. Inactive plans stay hidden
        from buyers.
      </p>
      <PlansEditor />

      {THEME_GROUPS.map((g) => (
        <div key={g.group}>
          <h3>{g.group}</h3>
          <div className="themegrid">
            {orderedItems(g).map((it) => {
              const cur =
                ov[it.k] != null
                  ? ov[it.k]
                  : it.t === "range"
                    ? it.d + (it.unit || "")
                    : it.d;
              const cls =
                "themerow" +
                (drag && drag.key === it.k ? " dragging" : "") +
                (over === it.k && drag && drag.key !== it.k ? " over" : "");
              return (
                <div
                  className={cls}
                  key={it.k}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setOver(it.k)}
                  onDrop={() => onDrop(g, it.k)}
                >
                  <span
                    className="draghandle"
                    draggable
                    onDragStart={() => setDrag({ group: g.group, key: it.k })}
                    onDragEnd={() => {
                      setDrag(null);
                      setOver(null);
                    }}
                    title="Drag to reorder"
                  >
                    ⠿
                  </span>
                  <label>{it.l}</label>
                  {it.t === "color" && (
                    <input
                      type="color"
                      value={ov[it.k] || it.d}
                      onChange={(e) => change(it.k, e.target.value)}
                    />
                  )}
                  {it.t === "range" && (
                    <input
                      type="range"
                      min={it.min}
                      max={it.max}
                      step={it.step || 1}
                      value={parseFloat(ov[it.k] != null ? ov[it.k] : it.d)}
                      onChange={(e) =>
                        change(it.k, e.target.value + (it.unit || ""))
                      }
                    />
                  )}
                  {it.t === "toggle" && (
                    <input
                      type="checkbox"
                      checked={(ov[it.k] || it.d) === it.on}
                      onChange={(e) =>
                        change(it.k, e.target.checked ? it.on : "normal")
                      }
                    />
                  )}
                  {it.t === "font" && (
                    <input
                      className="fontinput"
                      list="gfonts"
                      placeholder="Search fonts…"
                      value={fontText[it.k] ?? familyFromStack(cur)}
                      onChange={(e) => onFont(it.k, e.target.value)}
                    />
                  )}
                  {it.t !== "font" && <code className="themeval">{cur}</code>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
