# RaiVanua — Outcome Framework (Results / M&E model)

**Status:** Phase 1 (schema) — design locked 2026-07-02.
**Supersedes:** the perspective/platform BSC scorecard (CHG-0003…CHG-0023). Those
tables are *deprecated, not dropped* — kept for rollback until the cutover (Phase 4).

A single results framework that exists **at every level of both hierarchies**
(the Vanua/traditional axis and the Government axis, already modelled in
`scope_nodes`). It replaces the old "KPI-by-perspective" scorecard with a proper
**Outcome → Indicator → Variance → Action → Challenge** chain.

---

## Locked decisions (2026-07-02)

| # | Decision | Choice |
|---|----------|--------|
| D1 | Relationship to old BSC scorecard | **Replace.** Outcomes + 3-axis classification is the single model. Old `scorecard_*` tables retained read-only until cutover. |
| D2 | How an Outcome cascades | **Shared outcome + rolling indicators.** An Outcome is authored once (at an apex node); every level reports the *same* indicators against its own node, and figures roll UP via the existing `sum/avg/none` engine. One source of truth. |
| D3 | Government "Pillars" axis | **TAB Platforms** (the 5 platforms + 2 thrusts already in `strategy.js`). No new gov taxonomy. |
| A1 | ISIC axis (assumption) | **ISIC Rev.4, section-level (A–U) required**, optional deeper class later. |
| A2 | Vanua "Focus Areas" (assumption) | Editable taxonomy seeded from the 4 Meda Matata Mada perspectives. |

---

## Entity model

```
                        ┌──────────────────────────────────────────┐
   3 classification     │  OUTCOME  (long-term goal, authored once) │
   axes tag each ──────▶│   (a) focus_area  (Vanua)                 │
   Outcome              │   (b) gov_pillar  (TAB Platform)          │
                        │   (c) isic_sector (ISIC Rev.4)            │
                        └───────────────┬──────────────────────────┘
                                        │ 1..*
                        ┌───────────────▼──────────────┐
                        │  OUTCOME_INDICATOR (registry) │  rollup: sum|avg|none
                        └───────────────┬──────────────┘
                                        │ measured per node/period
                        ┌───────────────▼──────────────────────────┐
                        │  OUTCOME_MEASUREMENT                       │
                        │   node_id · period · target · actual      │
                        │   variance = actual − target  (generated) │  ◀── rolls UP the tree
                        └───────────────┬──────────────────────────┘
                                        │ a gap (variance) is closed by…
                        ┌───────────────▼──────────────────────────┐
                        │  ACTION  (kind = task | intervention | project)
                        │   ref_code · title · target/actual due · status
                        │   RACI (R/A/C/I)                          │
                        └──┬───────────────┬────────────────────┬───┘
             task ─────────┘   intervention┘          project ──┘ (→ existing projects table)
             must attach to an           │ 1..*
             IN-PROGRESS intervention     ▼
             or spawn a new one    INTERVENTION_INDICATOR  (short-term, initiative-specific —
             (never a completed one)                        tracked DISTINCTLY from outcome indicators)

   Any ACTION overdue past its target due date →
                        ┌──────────────────────────────────────────┐
                        │  CHALLENGE (impediment log)                │
                        │   description · target/actual due · status │
                        │   RACI — assignable to person/role/agency  │  ◀── same monitoring structure
                        └──────────────────────────────────────────┘
```

### Tables (Phase 1)

**Classification axes**
- `outcome_focus_areas` — (a) Vanua axis. `code, label, accent`. Seeded from the 4 MMM perspectives.
- `gov_pillars` — (b) Government axis = TAB Platforms. `platform_no (1–5), name, thrust`.
- `isic_sectors` — (c) ISIC Rev.4. `code, parent_code, level, title`. Seeded with the 21 sections A–U.

**Outcomes & indicators**
- `outcomes` — `node_id, axis, title, description, focus_area_id, gov_pillar_id, isic_code, status`.
- `outcome_indicators` — `outcome_id, name, unit, rollup (sum|avg|none)`.
- `outcome_measurements` — `indicator_id, node_id, period, target_value, actual_value, variance (generated)`. `UNIQUE(indicator_id, node_id, period)`. **Rolls up the tree** — same engine as today.

**Actions (the 3 forms)**
- `actions` — unifies Task + Intervention, bridges to Project.
  - `ref_code` (INT-#### / TSK-#### / PRJ-####), `kind`, `title`, `description`
  - `outcome_measurement_id` — the variance gap this closes (nullable)
  - `node_id`, `target_due_date`, `actual_due_date`, `status`
  - `parent_intervention_id` — **tasks only**; must reference a non-completed intervention (DB trigger enforces)
  - `project_id` — **projects only**; links to the existing `projects` table
- `action_status` enum: `not_started | in_progress | on_hold | cancelled | completed`.
- `intervention_indicators` — `action_id, name, unit, target_value, actual_value, period`. Separate table so they can **never** be confused with outcome indicators.

**RACI + Challenges (shared monitoring)**
- `raci_assignments` — polymorphic over both actions and challenges: `parent_kind (action|challenge), parent_id, raci (responsible|accountable|consulted|informed), assignee_kind (person|office|membership|gov_contact|agency|free) + the matching FK`.
- `challenges` — `ref_code (CHL-####), action_id, description, target_due_date, actual_due_date, status`. Reuses `raci_assignments`.
- `actions_overdue` (view) — actions past `target_due_date` still open; drives the "raise a challenge" prompt.

---

## Business rules

1. **Cascade (D2).** An Outcome is authored once at an apex node. Its indicators are
   enterable at every descendant node; actuals **roll UP** (`sum`/`avg`) or stay local
   (`none`). "Cascade down" = the same indicator appears as an enterable row at each
   level; "cascade up" = the roll-up. Works identically on the traditional and
   government axes because both live in `scope_nodes`.
2. **Variance → Action.** A measurement whose `actual < target` surfaces a gap; an
   Action (task/intervention/project) is raised against that `outcome_measurement_id`.
3. **Task ↔ Intervention (hard rule).** A Task may attach to an intervention only while
   that intervention's status ≠ `completed`; otherwise it must spawn a new intervention.
   Enforced by DB trigger `enforce_task_intervention`. *API rule:* an intervention with
   open (non-completed/cancelled) tasks cannot itself be marked `completed`.
4. **Indicator separation.** Outcome indicators (long-term) and intervention indicators
   (short-term, initiative-specific) live in different tables and never share a registry.
5. **Overdue → Challenge.** When an Action passes its `target_due_date` unfinished, it
   appears in `actions_overdue`; the responsible person is prompted to author a
   `challenge`, which is then monitored with its own RACI + due dates + status.

---

## Porting the existing framework (D-port, 2026-07-02)

The strategy content that lived only in `strategy.js` (a presentation layer) is
**entered as real data** in the new scorecard — that's the whole reason for D1
(Replace). Grain decision: **finer-grained Outcomes, one pillar each.** Each
(focus area × TAB platform) cluster of the old KPIs becomes one Outcome; its KPIs
become that Outcome's indicators. **11 Outcomes cover all 25 framework KPIs:**

| # | Outcome | Focus area | TAB pillar | ISIC | # ind. |
|---|---------|-----------|-----------|------|--------|
| 1 | Rising family income & GVP | Wealth Creation | 3 | A | 4 |
| 2 | Reinvestment into the Trust / child-welfare fund | Wealth Creation | 5 | Q | 1 |
| 3 | Import substitution delivered (10% in 10 yrs) | Vanua & Nation | 3 | C | 2 |
| 4 | Children's welfare & reduced dependency | Vanua & Nation | 2 | Q | 2 |
| 5 | Government collaboration & partnership | Vanua & Nation | 5 | O | 1 |
| 6 | Household disaster preparedness | Vanua & Nation | 4 | O | 1 |
| 7 | Commodity production & productive capability | Productive Capability | 3 | A | 3 |
| 8 | Climate-resilient land & sustainable harvest | Productive Capability | 4 | A | 3 |
| 9 | Conformance to the Trust's quality standards | Productive Capability | 1 | C | 1 |
| 10 | Parental obligations fulfilled | Strengthened Family | 1 | T | 1 |
| 11 | Child development & family cohesion | Strengthened Family | 2 | P | 6 |

Seeded by `migrations/040_seed_outcomes_from_framework.sql`. ISIC codes are
best-fit and editable. The old per-KPI TAB-platform tag is thus *preserved* as
the parent Outcome's pillar (no nuance lost). Live `scorecard_targets`
measurements are ported → `outcome_measurements` at cutover (Phase 4).

## Phased build

| Phase | CHG | Scope | State |
|-------|-----|-------|-------|
| **1a — Schema** | CHG-0024 | migration 039: all tables/enums/trigger/view + seed 3 taxonomies. Old scorecard untouched. | written |
| **1b — Seed** | CHG-0025 | migration 040: enter the 11 framework Outcomes + their 25 indicators. | written |
| 2 — API | CHG-0026 | Express routes: outcome CRUD, indicator + measurement CRUD (roll-up), action + RACI CRUD, intervention-indicator CRUD, challenge CRUD, overdue sweep. Gated to current scorecard roles. | next |
| 3 — UI | CHG-0027+ | Outcome board (filter by any of the 3 axes), target/actual/variance grid w/ roll-up, action + RACI editor, intervention-indicator panel, challenge log. | |
| 4 — Cutover | CHG-00xx | Port live `scorecard_targets` → `outcome_measurements`; retire the old scorecard route; archive `strategy.js` framework constants. | |
```
