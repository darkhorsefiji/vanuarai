# RAIVANUA Scorecard — Extended Concept (locked 2026-07-09)

Source: **RaiVanua Scorecard Concepts – 20260705.pdf**. This concept **extends** the live
Outcome Framework (`docs/outcome-framework-spec.md`, `/api/of/*`, `OutcomeBoard.jsx`); it does
**not** replace it. It was grilled and locked question-by-question with the founder over
2026-07-08 → 2026-07-09. This doc is the single source of truth for the reshape.

---

## 1. Strategy hierarchy (6 levels)

A strict, always-materialised chain. Each Initiative/Project sits under a **mandatory** Specific
Objective.

```
Key Focus Area
  └─ Strategic Objective        ← target (X→Y, multi-year), TOP-DOWN
       └─ Strategic Lever       ← a "how" (mechanism/approach/method); NO target; roll-up only
            └─ Specific Objective   ← MANDATORY; scope + expected results; target (X→Y); parent of actions
                 └─ Initiative | Project   (an "Action")
                      └─ KPI     ← target + actual; targets BOTTOM-UP
```

Cardinality:

- 1 Strategic Objective → **many** Strategic Levers.
- 1 Strategic Lever → **many** Specific Objectives.
- A Specific Objective _could_ sit under >1 Lever — treat as one-to-many for now (no case yet).
- 1 Specific Objective → **many** Actions (Initiative and/or Project).
- 1 Action → **many** KPIs.

Definitions locked:

- **Strategic Lever = a mechanism / approach / method (a "how")**, not an aim. It carries **no
  target of its own** — it only rolls up the actuals beneath it.
- **Specific Objective is mandatory** — it defines the scope of what is being done and the results
  expected; it is the direct parent of Actions.

---

## 2. Targets — who sets them, and which direction

| Level                   | Carries a target?         | Set direction                                           |
| ----------------------- | ------------------------- | ------------------------------------------------------- |
| Key Focus Area          | rolled-up view only       | —                                                       |
| **Strategic Objective** | **yes (X→Y)**             | **top-down** (Vanua sets, cascades down)                |
| Strategic Lever         | **no**                    | — (roll-up/actuals only)                                |
| **Specific Objective**  | **yes (X→Y)**             | **top-down**                                            |
| Initiative / Project    | via its KPIs              | —                                                       |
| **KPI**                 | **yes (target + actual)** | **bottom-up** (operating level proposes, aggregates up) |

**The meet-in-the-middle model:** Objective targets flow **down** from the Vanua; KPI targets are
proposed **up** by those doing the work; they reconcile at the Specific Objective / Initiative seam.

Targets are **per-year values** (a trajectory, e.g. 2026→2030), **set by the Vanua** and **reviewed
& reset annually** at Vanua level. They cascade **down the org hierarchy** and **across the
weekly time-base** at every level.

---

## 3. Organisation hierarchy (the roll-up ladder)

Every node must **exist and be named — no pass-throughs**. Even a single-child intermediate level is
a named container.

```
Vanua
  └─ Yavusa
       └─ Mataqali
            └─ Tokatoka
                 └─ Vuvale        ← actuals logged HERE (bottom-most)
```

- **Actuals are logged at the Vuvale** and **aggregate upward**; each higher level sees how the
  levels below it are performing.
- **Drill up/down and sideways:** navigate the same KPIs/charts by hierarchical level **and compare
  same-level siblings** (Vuvale-vs-Vuvale, Tokatoka-vs-Tokatoka…) — transparency as grounds for
  discussion and decision-making.
- **Data-model note:** current seed has `Mataqali Mataikoro → 3 Vuvale` directly. The reshape must
  insert the missing **Yavusa** and **Tokatoka** named nodes so the ladder is complete.

---

## 4. Aggregation (actuals up) and cascade (targets down)

**Aggregate up:**

- **Count** KPIs (Participants, Joiners, Drop-Outs) → **sum**.
- **Rate / %** KPIs (Ave. Marks %, attendance %) → **weighted average** (denominator-aware; i.e.
  recompute from summed numerator ÷ summed denominator, never a naive mean of rates). The system must
  therefore know each rate's denominator.

**Cascade down** — **configurable by the Vanua Admin, per KPI:**

- **Same value copied** to each child (natural for rates), **or**
- **Negotiated contribution** — each lower body proposes its share; children must **sum to the
  parent** target.

**Input vs Outcome** is a **label only** (effort vs results) — everything rolls up regardless.
Convention: Participants/Joiners/Drop-Outs = _input/effort_; bespoke KPI = _outcome/result_.

---

## 5. Standard KPI spine + the roster identity

Every Initiative/Project is born with a fixed spine of three **input** KPIs, plus ≥1 bespoke
**outcome** KPI added by the planner:

- **Participants** (count) · **Joiners** (count) · **Drop-Outs** (count)

**Roster identity (self-reconciling stock-flow):**

```
Participants(t) + Joiners(t) − Drop-Outs(t) = Participants(t+1)
```

Participants is a **stock** carried forward; Joiners and Drop-Outs are **flows** within the period.
The system can validate this identity and carry the roster forward each period.

---

## 6. The KPI gauge

- **Time-base selector:** Year / Half-Year / Quarter / Month / Week.
- **Baseline = the actual at the _start of the year_** that the selected period falls within.
- **Target & Actual shown are for the selected period.**
- Bar **starts from zero**; the fill and the **% are always relative to zero** (not the baseline);
  the **baseline is a marker** placed where it falls.
- **RAG colouring** (share of target achieved):
  - **Green ≥ 100%**
  - **Amber 80–99%**
  - **Red < 80%** (with a **60%** critical reference line)
  - Drawn as **guide bands at 100% / 80% / 60%**.

## 7. Monitoring-period chart

A line chart of **Targets / Actuals / Joiners / Drop-Outs** over the monitoring period, with the same
**100 / 80 / 60%** reference bands. Available at **every level** (rolled-up) and per entity, and
navigable across levels + siblings like the gauge.

---

## 8. AI-assisted Target Setting ("Target Assistant") — first-class pillar

A wizard the planner opens on any Objective or KPI. **AI proposes; the planner (and ultimately the
Vanua) decides** — output is always a _draft for discussion_, editable, with rationale shown.

Flow:

1. **Trajectory** — from Baseline + end-target + N years, propose interim yearly milestones and offer
   shapes with reasoning: **linear / front-loaded / back-loaded / S-curve**.
2. **Cascade approach** — top-down vs bottom-up vs negotiated (default: Objectives top-down, KPIs
   bottom-up); overridable per KPI.
3. **Distribution basis** — apportion by total population, male/female population, school-aged
   children, households, land area, resource type, etc.
4. **Distribute + reconcile** — pro-rata to the chosen basis, shown as an editable table, with
   **largest-remainder rounding so children exactly sum to the parent** (no leakage).
5. **Sanity flags** — infeasibility ("share exceeds this Vuvale's school-aged children"),
   off-trajectory nodes, suggested re-weighting.

**Architectural rule (non-negotiable):**

- **LLM reasons/advises** — trajectory shapes, sensible basis, plain-language rationale, outlier
  spotting.
- **Deterministic code distributes** — pro-rata + largest-remainder reconciliation, fully auditable.
  Never let the LLM do multi-node apportionment arithmetic.

**Precursor dependency:** distribution by demographic basis needs **per-node demographic data**
(population, school-aged children, women's population, resource type…). This data does not yet exist
in the model — capturing a light version of it is the real first task before the assistant is useful.

---

## 9. Relationship to what exists

- **Extends, does not replace** the Outcome Framework (Outcome → Indicators → Actions) and the earlier
  Meda Matata Mada scorecard items — those remain and map into this richer hierarchy.
- Reuses the existing recursive roll-up engine (`sum`/`avg`/`none`) — extend `avg` to the
  denominator-aware weighted average above.

---

## 10. Build sequence (proposed)

- **P0 — Demographics precursor:** add per-node demographic fields (population, school-aged children,
  women's pop, resource type). Unblocks the Target Assistant's distribution basis.
- **P1 — Data model:** the 6-level strategy hierarchy + the 5-level org ladder (materialise Yavusa +
  Tokatoka); per-year targets; weighted-average roll-up; standard KPI spine + roster identity.
- **P2 — Gauge:** time-base selector + year-start baseline + RAG bands (fold the prototype gauge in).
- **P3 — Drill views:** level + sibling navigation for gauge and monitoring chart.
- **P4 — Target Assistant:** wizard over the deterministic distribution engine.

Prototype today: `web/src/ScorecardTreePrototype.jsx` (3 layouts + `TA` gauge), hosted at
`/outcomes?variant=A|B|C`.
