// ── THROWAWAY PROTOTYPE ──────────────────────────────────────────────────────
// Layout exploration for the re-designed Scorecard: one page-wide card holding a
// horizontal tree, left→right:
//   Key Focus Area → Strategic Objective (+Target vs Actual) → Strategic Lever
//     → Intervention (Initiative | Project) → KPI (with unit) → Target vs Actual
// "Strategic Lever" is a NEW layer with no data model yet — shown as a dashed
// placeholder. Uses hardcoded sample data (real Meda Matata Mada themes), NOT the
// live DB. Three radically different layouts, switchable via ?variant=A|B|C.
// When a layout wins: fold it into OutcomeBoard and DELETE this file + the switcher.

const LEVELS = [
  "Key Focus Area",
  "Strategic Objective",
  "Strategic Lever",
  "Intervention",
  "KPI",
  "Target vs Actual",
];

const TREE = [
  {
    focus: "Child Development & Family Cohesion",
    accent: "var(--sage)",
    objectives: [
      {
        name: "Every child achieves at school",
        ta: { a: 6, t: 8, u: "children" },
        levers: [
          {
            name: "Home learning environment",
            interventions: [
              {
                type: "initiative",
                name: "After-school study circles",
                kpis: [
                  {
                    name: "Children attending",
                    u: "children",
                    a: 18,
                    t: 25,
                    f: "weekly",
                  },
                  {
                    name: "Homework completion",
                    u: "%",
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
        name: "Strong, cohesive families",
        ta: { a: 6, t: 9, u: "people" },
        levers: [
          {
            name: "Weekly soli & family devotion",
            interventions: [
              {
                type: "initiative",
                name: "Soli attendance drive",
                kpis: [
                  {
                    name: "Members at weekly soli",
                    u: "people",
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
  {
    focus: "Economic Empowerment · 10% in 10 years",
    accent: "var(--clay)",
    objectives: [
      {
        name: "Substitute 10% of Kumala flour imports",
        ta: { a: 2.1, t: 14.5, u: "FJD m" },
        levers: [
          {
            name: "Co-operative aggregation (VCDCL)",
            interventions: [
              {
                type: "project",
                name: "Kumala mill supply chain",
                kpis: [
                  {
                    name: "Kumala supplied to miller",
                    u: "tonnes",
                    a: 120,
                    t: 850,
                    f: "monthly",
                  },
                  {
                    name: "Co-op revenue",
                    u: "FJD",
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
];

const pct = (a, t) => (t ? Math.min(100, Math.round((a / t) * 100)) : 0);
const num = (n) => Number(n).toLocaleString();

function TA({ ta, sm }) {
  const p = pct(ta.a, ta.t);
  return (
    <div className={"pt-ta" + (sm ? " pt-ta-sm" : "")}>
      <span className="pt-ta-val">
        {num(ta.a)} / {num(ta.t)} {ta.u} · <b>{p}%</b>
      </span>
      <div className="pt-bar">
        <i style={{ width: p + "%" }} />
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
        {TREE.map((fa) => (
          <div className="pt-a-row" key={fa.focus}>
            <div className="pt-node pt-a-focus" style={{ "--acc": fa.accent }}>
              <span className="pt-cap">Key Focus Area</span>
              {fa.focus}
            </div>
            <div className="pt-a-kids">
              {fa.objectives.map((o) => (
                <div className="pt-a-row" key={o.name}>
                  <div className="pt-node pt-a-obj">
                    <span className="pt-cap">Strategic Objective</span>
                    {o.name}
                    <TA ta={o.ta} sm />
                  </div>
                  <div className="pt-a-kids">
                    {o.levers.map((l) => (
                      <div className="pt-a-row" key={l.name}>
                        <div className="pt-node pt-a-lever">
                          <span className="pt-cap">
                            Strategic Lever <em>· new</em>
                          </span>
                          {l.name}
                        </div>
                        <div className="pt-a-kids">
                          {l.interventions.map((iv) => (
                            <div className="pt-a-row" key={iv.name}>
                              <div className="pt-node pt-a-iv">
                                <TypePill t={iv.type} />
                                <span className="pt-iv-name">{iv.name}</span>
                              </div>
                              <div className="pt-a-kids">
                                {iv.kpis.map((k) => (
                                  <div className="pt-a-leaf" key={k.name}>
                                    <div className="pt-kpi-name">
                                      {k.name}{" "}
                                      <span className="pt-unit">({k.u})</span>{" "}
                                      <Freq f={k.f} />
                                    </div>
                                    <TA ta={{ a: k.a, t: k.t, u: k.u }} sm />
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

// ── Variant B — nested containment panels (no connector lines) ────────────────
function VariantB() {
  return (
    <div className="card pt-card">
      <LevelLegend />
      <div className="pt-b">
        {TREE.map((fa) => (
          <section
            className="pt-b-fa"
            style={{ "--acc": fa.accent }}
            key={fa.focus}
          >
            <div className="pt-b-h">
              <span className="pt-cap">Key Focus Area</span>
              {fa.focus}
            </div>
            {fa.objectives.map((o) => (
              <div className="pt-b-obj" key={o.name}>
                <div className="pt-b-h2">
                  <span className="pt-cap">Strategic Objective</span>
                  <span>{o.name}</span>
                  <TA ta={o.ta} sm />
                </div>
                {o.levers.map((l) => (
                  <div className="pt-b-lever" key={l.name}>
                    <div className="pt-b-h3">
                      <span className="pt-cap">
                        Strategic Lever <em>· new</em>
                      </span>
                      {l.name}
                    </div>
                    <div className="pt-b-ivs">
                      {l.interventions.map((iv) => (
                        <div className="pt-b-iv" key={iv.name}>
                          <div className="pt-b-iv-h">
                            <TypePill t={iv.type} />
                            {iv.name}
                          </div>
                          {iv.kpis.map((k) => (
                            <div className="pt-b-kpi" key={k.name}>
                              <span className="pt-kpi-name">
                                {k.name}{" "}
                                <span className="pt-unit">({k.u})</span>{" "}
                                <Freq f={k.f} />
                              </span>
                              <TA ta={{ a: k.a, t: k.t, u: k.u }} sm />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
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
  const leaves = (iv) => iv.kpis.length;
  const ivLeaves = (l) => l.interventions.reduce((s, iv) => s + leaves(iv), 0);
  const objLeaves = (o) => o.levers.reduce((s, l) => s + ivLeaves(l), 0);
  const faLeaves = (fa) => fa.objectives.reduce((s, o) => s + objLeaves(o), 0);
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
          {TREE.map((fa) => {
            let faFirst = true;
            return fa.objectives.map((o) => {
              let oFirst = true;
              return o.levers.map((l) => {
                let lFirst = true;
                return l.interventions.map((iv) => {
                  let ivFirst = true;
                  return iv.kpis.map((k) => {
                    const row = (
                      <tr key={fa.focus + o.name + l.name + iv.name + k.name}>
                        {faFirst && (
                          <td
                            className="pt-c-fa"
                            rowSpan={faLeaves(fa)}
                            style={{ "--acc": fa.accent }}
                          >
                            {fa.focus}
                          </td>
                        )}
                        {oFirst && (
                          <td className="pt-c-obj" rowSpan={objLeaves(o)}>
                            {o.name}
                            <TA ta={o.ta} sm />
                          </td>
                        )}
                        {lFirst && (
                          <td className="pt-c-lever" rowSpan={ivLeaves(l)}>
                            {l.name}
                            <span className="pt-cap"> new layer</span>
                          </td>
                        )}
                        {ivFirst && (
                          <td className="pt-c-iv" rowSpan={leaves(iv)}>
                            <TypePill t={iv.type} />
                            <div>{iv.name}</div>
                          </td>
                        )}
                        <td>
                          {k.name} <span className="pt-unit">({k.u})</span>{" "}
                          <Freq f={k.f} />
                        </td>
                        <td>
                          <TA ta={{ a: k.a, t: k.t, u: k.u }} sm />
                        </td>
                      </tr>
                    );
                    faFirst = oFirst = lFirst = ivFirst = false;
                    return row;
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
