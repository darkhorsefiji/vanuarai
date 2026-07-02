# VanuaRai — Product Requirements & Design Specification

**Status:** Design complete (decisions Q1–Q33 locked) · pre-build
**Date:** 2026-06-05
**Owner:** Founder (Innov8 Pacific)
**Market:** Fiji — rural iTaukei villages

> This document consolidates a branch-by-branch design grilling. Each decision is traceable to a numbered question (Q#). It is a design spec, **not legal advice** — items marked ⚖️ require Fiji counsel / regulator pre-consultation before build commitment.

---

## 1. Executive summary

VanuaRai is a two-part platform delivered over village WiFi (Ubiquiti/UniFi access points backed by Starlink terminals):

1. **Internet Access management** — a captive portal that meters and sells internet plans (paid directly via M-PAiSA / MyCash / card), with an "ask a friend to pay" gift flow.
2. **Village Administration portal** — transparent customary record-keeping for each village (family/lineage, land, minutes, fundraising, projects, financials, emergency, key contacts), governed by the Fijian social hierarchy.

A supporting **Tobu ledger** handles village/fundraising money as record-keeping over a custodial pool (no stored-value wallets — see §7).

**Go-to-market:** one pilot village, built end-to-end, with a two-switch go-live (connectivity + records first; real money once RBF clears).

---

## 2. System overview

| Subsystem              | Purpose                   | Money rail                    | Regulatory gate             |
| ---------------------- | ------------------------- | ----------------------------- | --------------------------- |
| **1. Internet Access** | Sell/meter connectivity   | Direct gateway pay (merchant) | TAF/FCCC telecom licence    |
| **2. Village Admin**   | Customary record-keeping  | (records; money via Tobu)     | Data-protection self-regime |
| **3. Tobu ledger**     | Village/fundraising money | Ledger over custodial account | ⚖️ RBF (NPS Act)            |

**Shared infrastructure:** UniFi AP + Starlink + a single unified cloud web app (sections: "Internet" + "Village"). The L4 redirect on session expiry lands the user on this app.

---

## 3. Architecture & topology

- **Q1 — Pure cloud.** Portal + backend run behind Starlink; no per-village server hardware. (Architected so an edge box _could_ be added later, but cloud-only at launch.)
- **Q2 — "Offline" = no paid plan, link still up.** Handled entirely by the **captive-portal walled garden**: portal, payment gateways, and auth endpoints are reachable pre-payment. Surviving a _Starlink outage_ is explicitly **out of scope**.
- **Village identifier:** the UniFi redirect's **AP MAC (`ap=`)** maps to a village in a provisioning table. No extra hardware.
- **Enforcement:** RADIUS accounting + **CoA/Disconnect** to terminate a session when a time or volume cap is hit (UniFi external RADIUS).
- **PWA / device offline:** explicitly **rejected** (Q25) — the captive mini-browser cannot reliably cache; false-safety risk. The product is cloud-online only.

---

## 4. Subsystem 1 — Internet Access (captive portal)

### 4.1 Authentication

- **Q3/Q4 — Google login.** Identity = Google account. No phone/SMS-OTP (villages may lack cellular coverage, so SMS is unreliable).
- **Q5 — OAuth in the captive context.** Google blocks OAuth in embedded webviews (`disallowed_useragent`). Standard flow = an **"Open in system browser"** hop (whitelist Google auth domains). **Plus a non-Google fallback** (email magic-link / portal-native account) so no device is ever locked out.

### 4.2 Plans

- **Q8 — Combined volume + validity-window plans.** Each plan = a **data bucket + validity window** (daily / weekly / fortnightly / monthly); whichever runs out first triggers the L4 redirect. Volume is the primary cost lever (protects metered Starlink); time is the backstop.
- **One device per plan** (binds to client MAC).
- **Per-village pricing capability** to be built (may launch flat). Bucket sizes & prices = pricing decision _(open)_.
- **Q9 — Lifecycle.** No rollover (volume dies with the window). One active plan at a time — buying more **tops up the current bucket**, keeping the window (no stacked/concurrent plans). One **~90%-used** soft interstitial warning; at cutoff, redirect to the plan menu with context.

### 4.3 Payments

- **Direct, per-purchase** via **M-PAiSA, MyCash, Credit card, Visa Debit** only. No personal wallet.
- VanuaRai holds the **M-PAiSA & MyCash gateway APIs** → full checkout runs **in-browser over data** (no USSD/cellular). All four rails work in-village.
- Payer pays **plan cost + that provider's transaction fee**.
- Legally: VanuaRai is a **merchant** receiving payment (including the gift flow) — **not** a licensable payment service.

### 4.4 "Ask a friend to pay" (gift a plan)

- **Q7 — Grant binding.** A server-side **pending-grant object** keyed by a one-time nonce holds `{village/AP, target client MAC, plan, status, 20-min expiry}`. On payment-confirm: CoA-authorize the target MAC if still associated, else **park the entitlement** for reconnect (a paid plan is never lost). Links are **20-min, one-time, MAC-bound** — a forwarded link can only bring the _original_ requester's device online.
- **Ask-a-friend send (supersedes Q10):** the villager **self-sends** via native deep-links (**WhatsApp / Messenger / Viber**) from their **own account** — VanuaRai pays **nothing per message**. Enabled by a **zero-rated messaging pass: 5 MB, context-gated to the ask-for-help flow, daily re-grant, granted ONLY when the access account is EXPIRED and in that state.** This structurally eliminates cannibalisation (free messaging exists only when there is no active plan). The portal prefills the message/link; the villager picks contacts in their own app (a web portal cannot read contacts).
  - _Ops caveat:_ zero-rating scope = allowlist Meta/Viber domains (CDN ranges drift) → the 5 MB cap is the real guard.

---

## 5. Subsystem 2 — Village Administration portal

### 5.1 The core abstraction — "governance body"

The portal is built around a single **governance body** node that repeats at every scope. Each body = `{a head, a vunivola (secretary), a dau ni yau (treasurer), its own minutes, its own money pool, its own maker-checker}`. Vunivola/Dau ni yau are **per-body** roles, not per-village.

| Body                        | Head               | Owns / controls                                                                                                                                                |
| --------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Village** (one)           | Turaga ni Koro     | Village treasury, village minutes, village-wide projects, village-wide fundraising, **Emergency & Disaster Management**, **Government Administration Liaison** |
| **Mataqali** (per Mataqali) | Turaga ni Mataqali | **Land, zoning, allocation, rentals, leases, contracts, lease income**, Mataqali minutes                                                                       |
| **Soqosoqo** (per group)    | Liuliu             | Group projects, fundraising, group funds                                                                                                                       |

> **Land is Mataqali business, not village business** (corrected): land decisions go by **Mataqali vote + Mataqali minutes**, ratified by the **Turaga ni Mataqali** with the Mataqali's Vunivola & Dau ni yau — the **Turaga ni Koro is not involved**.

### 5.2 Two orthogonal groupings

- **Lineage hierarchy** (by blood): **Vanua → Yavusa → Mataqali → Tokatoka → Vuvale**. _(Note: "Vanua" = the Fiji-wide/national apex node — see §9.)_
- **Soqosoqo** (function/interest groups, e.g. Soqosoqo Vakamarama) — **cut across** the lineage hierarchy. A person sits in one lineage branch and zero-or-more Soqosoqo.

### 5.3 Three money pools

1. **Village treasury** — Treasurer + Turaga ni Koro; visible to all Members.
2. **Mataqali lease rentals** — TLTB lease income, owned at Mataqali level, **Mataqali-scoped**.
3. **Soqosoqo funds** — per-group, from Province/sponsors, run by group officers.

### 5.4 Enrolment & roles (Q11)

- Registrant picks **Village Member** or **Village Official**.
- All registrants supply: full Vanua-hierarchy selections; **full name per Birth Certificate, BC number, BC country, BC image** (universal — lineage/membership).
- **TIN + TIN-card image only for Village Officials / custodial signatories** (Q20b) — give-only members are not asked (their payments are KYC'd at the licensed gateway).
- **Village Administrator** examines (may consult others) and approves.
- Village-level fields: **VKB reference id + TIN**.

### 5.5 Named offices & maker-checker (Q11/Q29)

Dual-consent ("maker-checker") governs land approvals, financial disbursements, and wallet dispositions:

- **Secretary (vunivola)** writes minutes & registers land-use requests.
- **Treasurer (dau ni yau)** owns financial records; withdrawals/corrections need dual consent; receipts uploaded.
- **Heads** (Turaga ni Koro / Turaga ni Mataqali / Liuliu) co-sign for their body.
- **Lifecycle:** maker initiates + attaches artifacts + **cites the Minutes resolution as a real linked reference** → pending approval to checker (notified) → action/funds **held** → approve (execute + audit) or reject-with-reason → **reminders + escalation to Village Admin** for stuck items → **never auto-approve**.
- **No self-approval ever; a fallback checker** per body lets the head initiate while another officer co-signs.

### 5.6 Certificate handling (Q11)

- Birth **and** Death certificates: **encrypted at rest**.
- During registration: **viewable for verification but NOT downloadable by anyone, including the Village Administrator.**
- After approval: **viewable only by Vuvale members** (non-Vuvale cannot click/view).

### 5.7 Pages

| Page                 | Notes                                                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Village Profile**  | Public landing; aggregate-only (name, hierarchy placement, history, boundary map snippet, photos, highlights). No individuals/financials/family data.                                                                                                                                                                                      |
| **Family**           | 2-col: **Vanua Hierarchy** (left) + **Family Composition** (right). Self-service per-Vuvale maintenance (family head edits own Vuvale; Mataqali vunivola fallback). Hierarchy structure configured at onboarding; registrations auto-place living members; **VKB/TLFC import = later reconcile**.                                          |
| **Lands**            | Left = parcel/lease listing; right = map (boundary + parcel/building overlays); click a row → highlight parcel. **Manual capture baseline** (officials draw **GeoJSON** over satellite tiles + key lease terms + upload contract PDFs); TLTB import/reconcile later. **"Not a legal survey" disclaimer.** Entire page **Mataqali-scoped**. |
| **Meeting Minutes**  | Classified by `{axis, level, body-instance}` (see §5.8); generic reusable filter; vunivola of the body writes.                                                                                                                                                                                                                             |
| **Fundraising**      | Cards of **endorsed** projects (goal/raised); totals across all → click card → that card; right col contributions filtered Mataqali/Yavusa/Tokatoka/Vuvale + list by Vuvale. **Village-wide transparent** (communal/honour-based). Capture: online (gateways → enables diaspora giving) + Dau ni yau on-behalf-of for cash.                |
| **Projects**         | A project + its fundraiser = **one entity, one shared Tobu pot** (Fundraising = money-in view; Projects = money-out + progress). Budget fixed in resolution; **spent auto-derives from disbursements**; **two progress indicators** (physical/milestone manual + financial burn auto); picture archive.                                    |
| **Financials**       | **Read-only auto-statement from each body's Tobu ledger** + maker-checker-governed manual journals (external/TLTB lease, in-kind, opening balances). Opening→inflows→outflows→closing, period-selectable, **PDF export** (shared acquittal-report engine). Body-scoped.                                                                    |
| **Emergency**        | Online-only, **PUBLIC, no-login**. Layered content: platform-authored generic (first-aid, disaster responses) bilingual EN/iTaukei + village-specific (evacuation centres, local contacts). No offline/PWA.                                                                                                                                |
| **Key Contacts**     | Categorized directory (buses/carriers/boats; produce buyers; shipping) + **light schedules** (text/PDF, not a timetable engine). Village-maintained.                                                                                                                                                                                       |
| **Soqosoqo Profile** | Public profile + summaries; detailed ledger to group members/officers; Village Admin read-only oversight.                                                                                                                                                                                                                                  |

### 5.8 Classification taxonomy (Minutes + filters)

Every minutes record / project / fundraiser carries `classification = {axis, level, body-instance}`:

- **Traditional axis:** Vanua (Fiji-wide apex) → Yavusa → Mataqali → Tokatoka → Vuvale
- **Government axis:** Provincial Council → District (Tikina) → Village
- **Soqosoqo:** cross-cutting, merged into the same filter
- One **generic reusable filter** component across Minutes / Fundraising / Projects.

### 5.9 Endorsement (Q22)

Two-tier: (1) owning body authorises via a **Minutes resolution**; (2) **Village Administrator endorses + creates the Temporary Tobu pot + publishes** the public card. Pre-endorsement = draft, visible only to the owning body. Gates both public visibility and the ability to collect.

### 5.10 Supra-village records (Q14/Q16)

- **Shared scope-hierarchy (target model):** each record stored **once at its true level**, cascading down to member villages.
- **Phased:** until upper nodes are onboarded, a village uses **interim local-upload**, re-homing later. Bottom-up rollout; dedicated upper-node administration deferred.

---

## 6. Access control model (cross-cutting)

**Ladder:** ① **Public — no login, freely accessible** → ② **Member** (Google login, approved member of that village) → ③ **Official** (office-holder).
Google login is _not_ a browse gate — only an identity step for Member/Official content, all edits, and Internet payments.

| Page / content                                                                                            | View                                                        | Scope                                     |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| Village Profile · Projects (summary) · Fundraising (totals) · Emergency · Key Contacts · Soqosoqo Profile | ① Public                                                    | Village-wide / aggregate                  |
| **Vanua Hierarchy**                                                                                       | ① Public = **bare structure only** (no names, no positions) | Village-wide                              |
| Vanua Hierarchy office-holder **name + position**                                                         | ② Member                                                    | Village-wide                              |
| Projects detail · Fundraising contribution detail · Meeting Minutes                                       | ② Member                                                    | Minutes: Mataqali/Soqosoqo minutes scoped |
| **Family Composition + certs**                                                                            | ② Member, **Vuvale-only**                                   | Vuvale (certs non-downloadable)           |
| Financials — Village                                                                                      | ② Member                                                    | Village-wide                              |
| Financials — Mataqali                                                                                     | ② Member of that Mataqali                                   | Mataqali-only                             |
| Financials — Soqosoqo                                                                                     | ② group members (+ Admin read-only)                         | Soqosoqo-only                             |
| **Lands** (all: map, parcels, applications)                                                               | ② Member of that Mataqali                                   | Mataqali-only                             |
| Lands — Lease/Rental/Contracts · Consultancy Reports                                                      | ③ Official                                                  | Mataqali-only (land)                      |
| Internet — buy plans                                                                                      | Google login + payment                                      | —                                         |

**Administration:** per-village administrator + App-Developer **break-glass (audited)** fallback. Developer fallback to sensitive data must be logged/time-boxed, never routine.

---

## 7. Subsystem 3 — Tobu ledger (money)

- **Q20 (final) — pots-only, give-direct.** **No personal wallets.** Contributors pay **directly from their own licensed instrument (M-PAiSA/MyCash/card) into the specific fundraiser/body custodial account.** Tobu is a **ledger over a custodial pool**, not a stored-value issuer.
- **Pots:** body nodes (Village / Mataqali / Soqosoqo) + **Temporary fundraiser/project pots** (Village Admin creates; expiry + reminders + unspent-balance process).
- **Cash-out:** maker-checker payout (Dau ni yau + body head, receipts), **never anonymous**.
- **On-behalf-of:** Dau ni yau banks received cash into the custodial account and logs the ledger entry (attributed to a person/Vuvale).
- **Q21 — Temporary pot lifecycle:** creation sets purpose/goal/expiry + nominated default disposition (sweep-to-owning-body / carry-forward). Reminders T-14/7/1d + on expiry. **At expiry → freeze read-only**; unspent funds **held**, moved only via **maker-checker citing a Minutes resolution**. Refund-to-contributors = manual ops only.
- **Why pots-only:** the personal held-balance wallet is the single feature that would have forced full RBF e-money licensing. Pots that only receive + disburse plausibly fit the **closed-loop merchant-acquiring exemption** ⚖️ (confirm with RBF).

---

## 8. Cross-cutting

- **Notifications (Q28):** **Email + login-gated in-portal inbox = free backbone.** Email = always-on push that pulls members back; inbox = durable record (requires login; public users have none). **WhatsApp = opt-in, reserved for action-required + scheduled reminders** (only channel with per-message cost). No SMS/push.
- **Audit / history (Q30):** **append-only immutable** log on all create/update/disburse/approve `{actor, timestamp, before→after, linked resolution, evidence}`; corrections = new entries, never delete. **Per-record "history" surfaced at the same access scope as the record** (accountability feature). Public sees current state only.
- **i18n (Q31):** **English-first at launch; iTaukei phased in later; no Fiji Hindi.** Build i18n-architected (externalized strings). User-generated content never auto-translated. **iTaukei customary terms stay canonical** even in English mode.

---

## 9. Terminology note — "Vanua"

In VanuaRai, **Vanua = the Fiji-wide / national apex** (one platform-owned node where national/generic content lives, e.g. the Emergency first-aid set). The highest _real_ multi-village customary node a village belongs to is the **Yavusa**.

---

## 10. ⚖️ Compliance & regulatory (Fiji)

| Domain                            | Finding                                                                                                                                                                                                                                        | Action                                                                                                                            |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Payments — NPS Act 2021 (RBF)** | Licensing is activity-based. Personal wallets = e-money issuance (needs licence). **Pots-only/give-direct** plausibly fits the **closed-loop merchant-acquiring exemption** (still under oversight). Internet-plan payments = merchant (fine). | **RBF pre-licensing consultation** to confirm the closed-loop path; pick custodial-account holder.                                |
| **Data & privacy**                | No comprehensive Act, but **Constitution s24** (privacy + "private and family life" — covers genealogy), **Cybercrime Act 2021**, **RBF Guideline 4** (if licensed/partnered). Cert handling + Vuvale-scoping already align.                   | **Self-impose international-standard data protection**; legal counsel; read Guideline 4.                                          |
| **Telecom**                       | Reselling Starlink WiFi for money = regulated under **Telecommunications Act 2008** (TAF + FCCC).                                                                                                                                              | **TAF/FCCC licensing consult**; Starlink reseller agreement; UniFi type-approval.                                                 |
| **iTaukei land/Vanua**            | iTaukei Lands Act / iTaukei Land Trust Act (TLTB) / iTaukei Affairs Act. VanuaRai is a record-keeper, not an authority.                                                                                                                        | Keep "not a legal survey" disclaimer; consent before displaying Mataqali land data; don't supersede TLTB / _i Vola ni Kawa Bula_. |
| **AML/CFT**                       | Financial Transactions Reporting Act.                                                                                                                                                                                                          | AML programme if licensed (TIN/BC KYC already collected for signatories).                                                         |

---

## 11. Pilot plan & phasing (Q32–Q33)

- **Rollout-phased, not feature-phased: pilot ONE village end-to-end → build the full feature set.**
- **Two-switch go-live:** build everything but **feature-flag the money layer**. Pilot **starts on connectivity + records** (needs TAF + data-protection regime); **Tobu/contributions/disbursements run in record-only mode** until **RBF clears**, then flip real-money on. Decouples the pilot from the least-controllable dependency.
- **Pilot scope:** both classification axes present in structure (Traditional + Government); upper-level records via **interim local-upload**; **dedicated upper-node admin deferred**; Vanua/Fiji-wide apex platform-administered; actively self-administered = the village + its Mataqali/Tokatoka/Soqosoqo. English-only, pots-only Tobu.
- **Pre-pilot blockers:** TAF/FCCC + Starlink + UniFi type-approval (connectivity); RBF + custodial account + AML (money); data-protection regime + counsel (records).

---

## 12. Open items (need 3rd parties / pricing — not design decisions)

- RBF e-money path confirmation + **custodial-account holder** (company vs bank trust vs PSP partner)
- **Map provider** (Mapbox / MapLibre vs Google) — shared decision with the Hakwa project
- **Plan bucket sizes & prices** (per-village pricing capability built)
- Starlink reseller agreement; UniFi equipment type-approval
- WhatsApp BSP onboarding — only if WhatsApp is chosen for _platform_ notifications
- **API surface mapping** — translate these decisions into endpoint contracts (next synthesis step)

---

## Appendix A — Glossary (iTaukei terms)

- **Vanua** — here, the Fiji-wide/national apex (see §9); traditionally a confederation of yavusa.
- **Yavusa** — group of related mataqali; highest real multi-village customary node here.
- **Mataqali** — landowning unit (owns land, receives TLTB lease income).
- **Tokatoka** — sub-unit of a mataqali.
- **Vuvale** — family / household.
- **Turaga ni Koro** — village headman (government liaison); heads the Village body.
- **Turaga ni Mataqali** — head of a mataqali.
- **Vunivola** — secretary (per body).
- **Dau ni yau** — treasurer (per body).
- **Liuliu** — president (of a Soqosoqo).
- **Soqosoqo** — functional/interest group (e.g. Soqosoqo Vakamarama, women's group).
- **VKB / i Vola ni Kawa Bula** — official register of native landowners (TLFC).
- **TLTB** — iTaukei Land Trust Board. **TLFC** — iTaukei Lands & Fisheries Commission.

## Appendix B — Decision log

Q1 cloud topology · Q2 walled-garden offline · Q3 Google identity · Q4 Google login · Q5 OAuth open-in-browser + fallback · Q6 gateway online checkout · Q7 grant binding · Q8 volume+validity plans · Q9 plan lifecycle · Q10 ask-a-friend (superseded → self-send pass) · Q11 enrolment/roles/certs · Q12 Mataqali scoping · Q13 Soqosoqo governance · Q14 shared scope-hierarchy · Q15 free village portal · Q16 upper-node admin deferred · Q17 Lands manual capture · Q18 Family self-service · Q19 Fundraising capture · Q20/20b Tobu pots-only + TIN scope · Q21 temp-pot lifecycle · Q22 endorsement · Q23 project=fundraiser shared pot · Q24 financials report-over-ledger · Q25 Emergency public/no-offline · Q26 Key Contacts · Q27 Village Profile · Q28 notifications · Q29 maker-checker · Q30 audit · Q31 i18n · Q32 rollout pilot · Q33 two-switch go-live.
