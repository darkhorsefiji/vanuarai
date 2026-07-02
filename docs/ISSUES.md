# Backlog

Dependency graph of remaining work for VanuaRai. Each issue is a vertical slice.
Issues with `Blocked by` must wait for their dependencies.

## Core Infrastructure (Tracer Bullet Dependencies)

### [#1] Captive Portal Walled Garden

**Status:** Not started · **Blocked by:** None

- UniFi L4 redirect integration: AP MAC → village lookup → captive portal page
- Walled-garden allowlist: Google OAuth domains, payment gateway domains
- Entry point: `GET /v1/portal/context?ap=<mac>&client=<mac>`
- Plan menu with context-aware display (no plan, expired, active)
  **Acceptance:** Device connects to WiFi → redirected to portal → sees plan options

### [#2] RADIUS Accounting + CoA Enforcement

**Status:** Not started · **Blocked by:** #1

- RADIUS accounting listen: track client MAC byte counters
- CoA on plan expiry: terminate session when volume or time cap hit
- CoA on plan purchase/gift: authorize client MAC
- ~90% consumed soft interstitial warning
  **Acceptance:** Plan volume exhausted → CoA disconnect → L4 redirect back to portal

### [#3] Payment Gateway Integration (M-PAiSA / MyCash / Card)

**Status:** Not started · **Blocked by:** #1 (needs walled garden for pre-payment access)

- Direct merchant checkout: in-browser over data (no USSD)
- Four rails: M-PAiSA, MyCash, Credit card, Visa Debit
- Server-side payment confirmation webhook → create access_grant
- Payer pays plan cost + provider transaction fee
  **Acceptance:** User selects plan → pays via gateway → device gets access

### [#4] Gift-a-Plan Flow

**Status:** Not started · **Blocked by:** #2, #3

- Pending grant object: nonce, target MAC, plan, 20-min expiry
- Zero-rated 5MB messaging pass (only when account is expired)
- Self-send deep-links: WhatsApp / Messenger / Viber
- Payer pays → CoA-authorize target MAC or park entitlement
  **Acceptance:** Expired user sends gift link → friend pays → original device comes online

### [#5] User Registration + Membership Approval

**Status:** Partial — Google OAuth + `/api/me` exist; registration forms missing

- Registration form: role selection, lineage selections, BC fields, cert upload
- TIN + TIN image only for Official role
- Admin review queue: approve (assign vuvale placement) or reject with reason
- Cert viewer: viewable but NOT downloadable; Vuvale-scoped post-approval
  **Acceptance:** Villager registers → Admin reviews → approved member sees Vuvale-scoped content

### [#6] Access Control Enforcement

**Status:** Partial — member/official checks on notices, nodes, officers

- Full tier enforcement per PRD §6: Public, Member, Official, Village Admin
- Scope filtering: Vuvale-only for family composition, Mataqali-only for land
- API middleware: `requireMember`, `requireOfficial`, `requireVillageAdmin`
  **Acceptance:** Unauthenticated → 401 on protected routes; wrong scope → 403

## Feature Backlog

### [#7] Lands Module (Mataqali-Scoped)

**Status:** Not started · **Blocked by:** #6

- GeoJSON parcel drawing over Leaflet/satellite tiles
- Lease/rental/contract register (Official-only)
- Land-use application pipeline → maker-checker + resolution citation
- "Not a legal survey" disclaimer
  **Acceptance:** Mataqali official draws parcel → saves → Mataqali members see it

### [#8] Meeting Minutes + Resolutions

**Status:** Not started · **Blocked by:** #6

- Classification filter: {axis, level, body-instance} — shared generic component
- Native editor + interim PDF upload
- Resolutions with ref labels (e.g. "Res 2026-04/3") linked to maker-checker
  **Acceptance:** Vunivola writes minutes → cites resolution → maker-checker references it

### [#9] Tobu Ledger (Money Module)

**Status:** Feature-flagged OFF until RBF clearance

- Pots: body-owned (permanent) + temporary (fundraiser/project)
- Give-direct contributions: gateway → custodial account → ledger entry
- On-behalf-of cash recording (Dau ni Yau)
- Disbursement via maker-checker + receipts
- Temporary pot lifecycle: expiry, reminders, freeze, disposition
  **Acceptance:** Contribution flows through gateway → appears in body's ledger → visible to scoped members

### [#10] Financials Report Engine

**Status:** Partial — transactions, assets, investments exist; journals missing

- Auto statement: opening → inflows → outflows → closing, period-selectable
- Manual journals (external/TLTB/in-kind/opening balances)
- PDF export (shared acquittal-report engine)
- Body-scoped visibility
  **Acceptance:** Member selects period → sees statement → exports PDF

### [#11] Fundraising + Projects

**Status:** Not started · **Blocked by:** #8, #9

- Project = Fundraiser = one entity, one shared Tobu pot
- Two-tier endorsement: body resolution → Village Admin publishes
- Physical milestone progress + financial burn auto-derived from disbursements
- Photo archive (thumbnail free, full-res on plan)
  **Acceptance:** Body creates draft → endorsed → contributions flow in → progress tracked

### [#12] Emergency + Key Contacts (Public)

**Status:** Not started

- Layered content: platform-generic (bilingual) + village-specific
- No login required (public)
- Key contacts: categorized directory + light schedules
  **Acceptance:** Public user browses emergency info and contacts without login

### [#13] Notifications

**Status:** Partial — Kacikacivaki notices exist; inbox/email not implemented

- Email backbone (always-on push)
- Login-gated in-portal inbox (durable record)
- WhatsApp opt-in for action-required + scheduled reminders
  **Acceptance:** User gets email for co-sign request → sees it in inbox when logged in

### [#14] i18n Architecture (iTaukei)

**Status:** Not started

- English-first at launch; iTaukei phased later
- Externalized strings; no auto-translation of user content
- iTaukei customary terms stay canonical in English mode
  **Acceptance:** Language toggle → iTaukei labels replace English; custom terms preserved

### [#15] Audit / History Log

**Status:** Partial — `audit_log` table exists; surfacing not implemented

- Append-only immutable log on CRUD/approve/disburse
- Per-record history surfaced at same access scope as record
- Corrections = new entries, never edits
  **Acceptance:** Official clicks "History" on a record → sees changelog with actor + timestamps
