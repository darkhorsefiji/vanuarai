// ── THROWAWAY PROTOTYPE ──────────────────────────────────────────────────────
// Layout exploration for the re-designed Scorecard. The 6-level strategy chain
// (locked 2026-07-09, docs/scorecard-concept-2026-07.md), left→right / outer→inner:
//   Key Focus Area → Strategic Objective (+target) → Strategic Lever (a "how", no
//     target) → Specific Objective (mandatory, +target) → Intervention (Initiative
//     | Project) → KPI (+target)
// Uses hardcoded sample data (real Meda Matata Mada themes), NOT the live DB.
// Three layouts, switchable via ?variant=A|B|C. Variant B (nested panels) is the
// chosen layout: interventions stack one after another, and every performance
// gauge is pinned to a right-hand rail for readability.
//
// Every text label is an EditableText keyed by a STABLE path id (sc.t.<focus>.<obj>
// …). All three variants reuse the same ids, so editing a label in one layout (via
// the header ✎ DEV pencil) updates it in the others. Edits persist per-browser.
// When B is folded into OutcomeBoard: DELETE this file + the switcher.

import { useEffect, useState } from "react";
import { EditableText, useCopy } from "./copy";

// RAG colouring is opt-in, controlled by the App Admin via the 🎨 style editor
// ("Scorecard gauge" group → "RAG colouring" toggle, CSS var --ptg-rag). Off by
// default so the themeable single fill colour (--ptg-fill) surfaces. Re-reads on
// the "vr:theme" event dispatched when any theme variable changes.
function useRagEnabled() {
  const read = () =>
    typeof document !== "undefined" &&
    getComputedStyle(document.documentElement)
      .getPropertyValue("--ptg-rag")
      .trim() === "on";
  const [on, setOn] = useState(read);
  useEffect(() => {
    const h = () => setOn(read());
    window.addEventListener("vr:theme", h);
    return () => window.removeEventListener("vr:theme", h);
  }, []);
  return on;
}

// Editable text node with a stable id (shared across variants).
const ET = ({ id, children }) => (
  <EditableText as="span" id={id}>
    {children}
  </EditableText>
);

const LEVELS = [
  "Key Focus Area",
  "Strategic Objective",
  "Strategic Lever",
  "Specific Objective",
  "Intervention",
  "KPI",
  "Performance",
];

// ta / kpi values are { b: baseline, a: actual, t: target, u: unit }.
// Levers carry NO target (roll-up only); Objectives, Specific Objectives + KPIs do.
const TREE = [
  {
    focus: "Child Development & Family Cohesion",
    accent: "var(--sage)",
    objectives: [
      {
        name: "Every child achieves at school",
        ta: { b: 4, a: 6, t: 8, u: "children" },
        levers: [
          {
            name: "Home learning environment",
            specifics: [
              {
                name: "Lift primary literacy in the koro",
                ta: { b: 55, a: 68, t: 85, u: "%" },
                interventions: [
                  {
                    type: "initiative",
                    name: "After-school study circles",
                    kpis: [
                      {
                        name: "Children attending",
                        u: "children",
                        b: 10,
                        a: 18,
                        t: 25,
                        f: "weekly",
                      },
                      {
                        name: "Homework completion",
                        u: "%",
                        b: 60,
                        a: 72,
                        t: 90,
                        f: "weekly",
                      },
                    ],
                  },
                  {
                    type: "project",
                    name: "Village library build",
                    kpis: [
                      {
                        name: "Construction complete",
                        u: "%",
                        b: 0,
                        a: 40,
                        t: 100,
                        f: "monthly",
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            name: "Parental engagement",
            specifics: [
              {
                name: "Parents present on school days",
                ta: { b: 20, a: 35, t: 60, u: "parents" },
                interventions: [
                  {
                    type: "initiative",
                    name: "Parent–teacher talanoa",
                    kpis: [
                      {
                        name: "Parents attending",
                        u: "parents",
                        b: 12,
                        a: 28,
                        t: 50,
                        f: "monthly",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Strong, cohesive families",
        ta: { b: 3, a: 6, t: 9, u: "people" },
        levers: [
          {
            name: "Weekly soli & family devotion",
            specifics: [
              {
                name: "Every household at weekly soli",
                ta: { b: 3, a: 6, t: 9, u: "households" },
                interventions: [
                  {
                    type: "initiative",
                    name: "Soli attendance drive",
                    kpis: [
                      {
                        name: "Members at weekly soli",
                        u: "people",
                        b: 4,
                        a: 6,
                        t: 9,
                        f: "weekly",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    focus: "Economic Empowerment · 10% in 10 years",
    accent: "var(--clay)",
    objectives: [
      {
        name: "Substitute 10% of Kumala flour imports",
        ta: { b: 0.5, a: 2.1, t: 14.5, u: "FJD m" },
        levers: [
          {
            name: "Co-operative aggregation (VCDCL)",
            specifics: [
              {
                name: "Reliable kumala supply to the miller",
                ta: { b: 20, a: 120, t: 850, u: "tonnes" },
                interventions: [
                  {
                    type: "project",
                    name: "Kumala mill supply chain",
                    kpis: [
                      {
                        name: "Kumala supplied to miller",
                        u: "tonnes",
                        b: 20,
                        a: 120,
                        t: 850,
                        f: "monthly",
                      },
                      {
                        name: "Co-op revenue",
                        u: "FJD",
                        b: 50000,
                        a: 210000,
                        t: 1450000,
                        f: "monthly",
                      },
                    ],
                  },
                  {
                    type: "initiative",
                    name: "Grower training programme",
                    kpis: [
                      {
                        name: "Households cultivating kumala",
                        u: "households",
                        b: 12,
                        a: 34,
                        t: 120,
                        f: "monthly",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

// Stable id builders (path by index — independent of the editable text itself).
const idFocus = (fi) => `sc.t.${fi}`;
const idObj = (fi, oi) => `sc.t.${fi}.o${oi}`;
const idLever = (fi, oi, li) => `sc.t.${fi}.o${oi}.l${li}`;
const idSpec = (fi, oi, li, si) => `sc.t.${fi}.o${oi}.l${li}.s${si}`;
const idIv = (fi, oi, li, si, ii) => `sc.t.${fi}.o${oi}.l${li}.s${si}.i${ii}`;
const idKpi = (fi, oi, li, si, ii, ki) =>
  `sc.t.${fi}.o${oi}.l${li}.s${si}.i${ii}.k${ki}`;

const clamp = (n) => Math.max(0, Math.min(100, n));
const num = (n) => Number(n).toLocaleString();

// Progress gauge. Baseline / Actual / Target / Unit are all editable (✎ pencil),
// read from the copy store (override) or the sample default; everything recomputes
// live. The bar is scaled 0→target with the % inside it, a baseline tick + value,
// a target tick + value, and a taller "actual" marker with its value above it.
// Fill colour is RAG by share-of-target: green (≥100, the themeable --ptg-fill),
// amber (80–99), red (<80). Colours + height themeable via --ptg-* (DEV 🎨).
function TA({ ta, id }) {
  const ctx = useCopy();
  const ragOn = useRagEnabled();
  const eff = (suf, def) => {
    const r = ctx && id ? ctx.get(id + suf, def) : def;
    const n = Number(r);
    return Number.isFinite(n) ? n : def;
  };
  const b = eff(".b", ta.b ?? 0);
  const a = eff(".a", ta.a);
  const t = eff(".t", ta.t);
  // 0 → Target scale: the bar (and its fill/percentage) always start from zero
  // and are measured against the target, not the baseline. The baseline is just a
  // marker placed at its point along the bar (b/target).
  const prog = t ? clamp(Math.round((a / t) * 100)) : 0;
  const basePos = t ? clamp((b / t) * 100) : 0;
  const actPos = prog;
  const rag = prog >= 100 ? "g" : prog >= 80 ? "a" : "r";
  const N = (suf, def) =>
    id ? (
      <EditableText as="span" id={id + suf}>
        {def}
      </EditableText>
    ) : (
      <span>{num(def)}</span>
    );
  return (
    <div
      className={"pt-gauge" + (ragOn && rag !== "g" ? " pt-rag-" + rag : "")}
    >
      <div className="pt-gauge-units">Units: {N(".u", ta.u)}</div>
      <div className="pt-gauge-top">
        <span className="pt-gn pt-gn-act" style={{ left: actPos + "%" }}>
          {N(".a", ta.a)}
        </span>
      </div>
      <div className="pt-gauge-bar">
        <i className="pt-gfill" style={{ left: 0, width: actPos + "%" }} />
        <span
          className={"pt-gpct" + (actPos > 72 ? " pt-gpct-left" : "")}
          style={{ left: actPos + "%" }}
        >
          {prog}%
        </span>
        <span className="pt-gmk pt-gmk-base" style={{ left: basePos + "%" }} />
        <span className="pt-gmk pt-gmk-act" style={{ left: actPos + "%" }} />
        <span className="pt-gmk pt-gmk-tgt" style={{ left: "100%" }} />
      </div>
      <div className="pt-gauge-bot">
        <span className="pt-gn pt-gn-base" style={{ left: basePos + "%" }}>
          {N(".b", ta.b)}
        </span>
        <span className="pt-gn pt-gn-tgt" style={{ left: "100%" }}>
          {N(".t", ta.t)}
        </span>
      </div>
    </div>
  );
}
const TypePill = ({ t }) => (
  <span className={"pt-type pt-type-" + t}>
    {t === "project" ? "Project" : "Initiative"}
  </span>
);
const Freq = ({ f }) => <span className="pt-freq">{f}</span>;
// KPI name (editable) + frequency badge. The unit now lives in the gauge ("Units:").
const KpiLabel = ({ id, k }) => (
  <>
    <ET id={id}>{k.name}</ET> <Freq f={k.f} />
  </>
);
const LevelLegend = () => (
  <div className="pt-legend">
    {LEVELS.map((l, i) => (
      <span key={l}>
        {l}
        {i < LEVELS.length - 1 ? <em> →</em> : null}
      </span>
    ))}
  </div>
);

// ── Variant A — connector tree (explicit left→right branches) ─────────────────
function VariantA() {
  return (
    <div className="card pt-card">
      <LevelLegend />
      <div className="pt-a">
        {TREE.map((fa, fi) => (
          <div className="pt-a-row" key={fi}>
            <div className="pt-node pt-a-focus" style={{ "--acc": fa.accent }}>
              <span className="pt-cap">Key Focus Area</span>
              <ET id={idFocus(fi)}>{fa.focus}</ET>
            </div>
            <div className="pt-a-kids">
              {fa.objectives.map((o, oi) => (
                <div className="pt-a-row" key={oi}>
                  <div className="pt-node pt-a-obj">
                    <span className="pt-cap">Strategic Objective</span>
                    <ET id={idObj(fi, oi)}>{o.name}</ET>
                    <TA ta={o.ta} id={idObj(fi, oi)} />
                  </div>
                  <div className="pt-a-kids">
                    {o.levers.map((l, li) => (
                      <div className="pt-a-row" key={li}>
                        <div className="pt-node pt-a-lever">
                          <span className="pt-cap">
                            Strategic Lever <em>· new</em>
                          </span>
                          <ET id={idLever(fi, oi, li)}>{l.name}</ET>
                        </div>
                        <div className="pt-a-kids">
                          {l.specifics.map((sp, si) => (
                            <div className="pt-a-row" key={si}>
                              <div className="pt-node pt-a-spec">
                                <span className="pt-cap">
                                  Specific Objective
                                </span>
                                <ET id={idSpec(fi, oi, li, si)}>{sp.name}</ET>
                                <TA ta={sp.ta} id={idSpec(fi, oi, li, si)} />
                              </div>
                              <div className="pt-a-kids">
                                {sp.interventions.map((iv, ii) => (
                                  <div className="pt-a-row" key={ii}>
                                    <div className="pt-node pt-a-iv">
                                      <TypePill t={iv.type} />
                                      <span className="pt-iv-name">
                                        <ET id={idIv(fi, oi, li, si, ii)}>
                                          {iv.name}
                                        </ET>
                                      </span>
                                    </div>
                                    <div className="pt-a-kids">
                                      {iv.kpis.map((k, ki) => (
                                        <div className="pt-a-leaf" key={ki}>
                                          <div className="pt-kpi-name">
                                            <KpiLabel
                                              id={idKpi(fi, oi, li, si, ii, ki)}
                                              k={k}
                                            />
                                          </div>
                                          <TA
                                            ta={{
                                              b: k.b,
                                              a: k.a,
                                              t: k.t,
                                              u: k.u,
                                            }}
                                            id={idKpi(fi, oi, li, si, ii, ki)}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Variant B — nested panels, interventions stacked, gauges on a right rail ──
function VariantB() {
  return (
    <div className="card pt-card">
      <LevelLegend />
      <div className="pt-b">
        {TREE.map((fa, fi) => (
          <section className="pt-b-fa" style={{ "--acc": fa.accent }} key={fi}>
            <div className="pt-b-h">
              <span className="pt-cap">Key Focus Area</span>
              <ET id={idFocus(fi)}>{fa.focus}</ET>
            </div>
            {fa.objectives.map((o, oi) => (
              <div className="pt-b-obj" key={oi}>
                <div className="pt-row pt-b-h2">
                  <div className="pt-row-lbl">
                    <span className="pt-cap">Strategic Objective</span>
                    <ET id={idObj(fi, oi)}>{o.name}</ET>
                  </div>
                  <div className="pt-row-gauge">
                    <TA ta={o.ta} id={idObj(fi, oi)} />
                  </div>
                </div>
                {o.levers.map((l, li) => (
                  <div className="pt-b-lever" key={li}>
                    <div className="pt-row pt-b-h3">
                      <div className="pt-row-lbl">
                        <span className="pt-cap">
                          Strategic Lever <em>· how</em>
                        </span>
                        <ET id={idLever(fi, oi, li)}>{l.name}</ET>
                      </div>
                      <div className="pt-row-gauge pt-row-gauge-empty">
                        rolls up
                      </div>
                    </div>
                    {l.specifics.map((sp, si) => (
                      <div className="pt-b-spec" key={si}>
                        <div className="pt-row pt-b-h4">
                          <div className="pt-row-lbl">
                            <span className="pt-cap">Specific Objective</span>
                            <ET id={idSpec(fi, oi, li, si)}>{sp.name}</ET>
                          </div>
                          <div className="pt-row-gauge">
                            <TA ta={sp.ta} id={idSpec(fi, oi, li, si)} />
                          </div>
                        </div>
                        <div className="pt-b-ivs">
                          {sp.interventions.map((iv, ii) => (
                            <div className="pt-b-iv" key={ii}>
                              <div className="pt-b-iv-h">
                                <TypePill t={iv.type} />
                                <ET id={idIv(fi, oi, li, si, ii)}>{iv.name}</ET>
                              </div>
                              {iv.kpis.map((k, ki) => (
                                <div className="pt-row pt-b-kpi" key={ki}>
                                  <div className="pt-row-lbl pt-kpi-name">
                                    <KpiLabel
                                      id={idKpi(fi, oi, li, si, ii, ki)}
                                      k={k}
                                    />
                                  </div>
                                  <div className="pt-row-gauge">
                                    <TA
                                      ta={{ b: k.b, a: k.a, t: k.t, u: k.u }}
                                      id={idKpi(fi, oi, li, si, ii, ki)}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

// ── Variant C — aligned outline grid (table with row-spans per level) ─────────
function VariantC() {
  const kpiCount = (iv) => iv.kpis.length;
  const specCount = (sp) =>
    sp.interventions.reduce((s, iv) => s + kpiCount(iv), 0);
  const leverCount = (l) => l.specifics.reduce((s, sp) => s + specCount(sp), 0);
  const objCount = (o) => o.levers.reduce((s, l) => s + leverCount(l), 0);
  const faCount = (fa) => fa.objectives.reduce((s, o) => s + objCount(o), 0);
  return (
    <div className="card pt-card pt-c-wrap">
      <table className="pt-c">
        <thead>
          <tr>
            {LEVELS.map((l) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TREE.map((fa, fi) => {
            let faFirst = true;
            return fa.objectives.map((o, oi) => {
              let oFirst = true;
              return o.levers.map((l, li) => {
                let lFirst = true;
                return l.specifics.map((sp, si) => {
                  let spFirst = true;
                  return sp.interventions.map((iv, ii) => {
                    let ivFirst = true;
                    return iv.kpis.map((k, ki) => {
                      const row = (
                        <tr key={`${fi}.${oi}.${li}.${si}.${ii}.${ki}`}>
                          {faFirst && (
                            <td
                              className="pt-c-fa"
                              rowSpan={faCount(fa)}
                              style={{ "--acc": fa.accent }}
                            >
                              <ET id={idFocus(fi)}>{fa.focus}</ET>
                            </td>
                          )}
                          {oFirst && (
                            <td className="pt-c-obj" rowSpan={objCount(o)}>
                              <ET id={idObj(fi, oi)}>{o.name}</ET>
                              <TA ta={o.ta} id={idObj(fi, oi)} />
                            </td>
                          )}
                          {lFirst && (
                            <td className="pt-c-lever" rowSpan={leverCount(l)}>
                              <ET id={idLever(fi, oi, li)}>{l.name}</ET>
                              <span className="pt-cap"> how · rolls up</span>
                            </td>
                          )}
                          {spFirst && (
                            <td className="pt-c-spec" rowSpan={specCount(sp)}>
                              <ET id={idSpec(fi, oi, li, si)}>{sp.name}</ET>
                              <TA ta={sp.ta} id={idSpec(fi, oi, li, si)} />
                            </td>
                          )}
                          {ivFirst && (
                            <td className="pt-c-iv" rowSpan={kpiCount(iv)}>
                              <TypePill t={iv.type} />
                              <div>
                                <ET id={idIv(fi, oi, li, si, ii)}>{iv.name}</ET>
                              </div>
                            </td>
                          )}
                          <td>
                            <KpiLabel
                              id={idKpi(fi, oi, li, si, ii, ki)}
                              k={k}
                            />
                          </td>
                          <td>
                            <TA
                              ta={{ b: k.b, a: k.a, t: k.t, u: k.u }}
                              id={idKpi(fi, oi, li, si, ii, ki)}
                            />
                          </td>
                        </tr>
                      );
                      faFirst = oFirst = lFirst = spFirst = ivFirst = false;
                      return row;
                    });
                  });
                });
              });
            });
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ScorecardTreePrototype({ variant }) {
  if (variant === "B") return <VariantB />;
  if (variant === "C") return <VariantC />;
  return <VariantA />;
}

// Floating switcher — localhost-only (the app is browsed as a prod build on :3000,
// so gate on hostname rather than NODE_ENV). Cycles Live → A → B → C.
const OPTIONS = [
  { key: "", label: "Live board" },
  { key: "A", label: "A — Connector tree" },
  { key: "B", label: "B — Nested panels" },
  { key: "C", label: "C — Aligned grid" },
];
export function PrototypeSwitcher({ current, onPick }) {
  const host = typeof location !== "undefined" ? location.hostname : "";
  if (host !== "localhost" && host !== "127.0.0.1") return null;
  const idx = Math.max(
    0,
    OPTIONS.findIndex((o) => o.key === (current || ""))
  );
  const go = (d) =>
    onPick(OPTIONS[(idx + d + OPTIONS.length) % OPTIONS.length].key);
  return (
    <div className="pt-switch">
      <button onClick={() => go(-1)} aria-label="Previous">
        ‹
      </button>
      <span className="pt-switch-lbl">{OPTIONS[idx].label}</span>
      <button onClick={() => go(1)} aria-label="Next">
        ›
      </button>
    </div>
  );
}
