# Architecture

## Stack

| Concern        | Choice                                              | Rationale                                                                                                                                    |
| -------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Language       | Node.js (backend) / JavaScript + JSX (frontend)     | Single language across stack; mature ecosystem for REST APIs and SPAs                                                                        |
| Framework      | Express.js 5 (backend) / React 19 + Vite (frontend) | Express is minimal and widely understood; React is the most portable SPA framework; Vite provides fast HMR and build                         |
| Data Store     | PostgreSQL on Neon (serverless)                     | Full relational model needed for hierarchy, lineage, money; Neon provides managed Postgres with connection pooling and branching             |
| Auth           | Google OAuth 2.0 + JWT (jsonwebtoken)               | Google is the dominant identity provider in Fiji; JWT avoids server-side sessions; stateless tokens simplify the captive-portal architecture |
| Object Storage | (not yet implemented; certs/PDFs planned)           | Encrypted-at-rest blobs referenced by `*_ref` columns; non-downloadable cert viewer (PRD Q11)                                                |
| Hosting        | PM2 process manager on Linux VPS                    | Single-node deployment for pilot village; cloud-only (PRD Q1); no per-village hardware                                                       |
| Maps           | Leaflet                                             | Open-source, offline-capable tiles; vector/renderer choice shared with Hakwa project                                                         |

## System Topology

```
┌─────────────────────────────────────────────────────────┐
│                    Village WiFi                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐          │
│  │ Device 1 │    │ Device 2 │    │ Device N │          │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘          │
│       │               │               │                 │
│  ┌────▼───────────────▼───────────────▼────┐            │
│  │        UniFi Access Point               │            │
│  │   (L4 redirect → captive portal)        │            │
│  └────────────────────┬───────────────────┘            │
│                       │                                 │
│              ┌────────▼────────┐                       │
│              │  Starlink WAN   │                       │
│              └────────┬────────┘                       │
└───────────────────────┼────────────────────────────────┘
                        │ Internet
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌─────▼──────┐   ┌───▼──────────┐
   │ Google   │    │  Payment   │   │  VanuaRai     │
   │ OAuth    │    │  Gateways  │   │  (Express.js) │
   │          │    │ M-PAiSA,   │   │  :3000        │
   │          │    │ MyCash,    │   │               │
   │          │    │ Card       │   │  ┌──────────┐ │
   └──────────┘    └────────────┘   │  │  Neon     │ │
                                    │  │  Postgres │ │
   ┌──────────┐                     │  └──────────┘ │
   │ RADIUS   │◄────────────────────│               │
   │ (CoA)    │                     │  ┌──────────┐ │
   └──────────┘                     │  │  Static   │ │
                                    │  │  /dist    │ │
                                    │  │  (Vite    │ │
                                    │  │  SPA)     │ │
                                    │  └──────────┘ │
                                    └───────────────┘
```

**Key boundaries:**

- The Express server serves both the API (`/api/*`) and the built frontend SPA (`web/dist`)
- Village AP MAC maps to village ID via `access_points` table
- L4 redirect on session expiry lands the client on the captive portal (same app, different state)
- RADIUS accounting + CoA enforces plan volume/time limits (UniFi external RADIUS)
- All four payment gateways are merchant-model: VanuaRai receives payment, not a stored-value issuer

## API / IPC Contracts

**Protocol:** REST/JSON over HTTPS. The server is a monolith Express app consuming `DATABASE_URL` directly.

**Auth:** Bearer JWT in `Authorization` header, minted after Google OAuth verification (`POST /api/auth/google`).
Public endpoints need no token. JWT payload: `{ uid, email, name }`, 30-day expiry.

**Key routes** (see `API.md` for full v1 design):

- `GET /api/health` — liveness probe, returns `{ ok, googleConfigured }`
- `POST /api/auth/google` — Google OAuth credential verification → JWT
- `GET /api/me` — current user + membership + offices
- `GET /api/hierarchy` — scope_nodes tree (bare structure for public, offices for members)
- `GET /api/profile` — village profile with counts, resources, government context
- `GET /api/composition` — family composition by vuvale
- `GET /api/notices` / `POST /api/notices` — kacikacivaki announcements (koro=official, lewe=community)
- `GET /api/fin-transactions` — financial transactions with initiator/approver attribution
- `GET /api/scorecard` — BSC KPI roll-up (sum/avg/none over hierarchy)
- `GET /api/of/*` — Outcome framework (Outcomes, Indicators, Measurements, Actions, RACI)
- `GET /api/officers` — body officer assignments with roster
- `GET /api/hierarchy-template` — Excel download for bulk import
- `POST /api/hierarchy-import` — Excel upload for bulk lineage + family import

**Maker-checker pattern:** Initiator creates (maker) → checker approves/rejects. Never self-approve.
Financial records (transactions, assets, investments) carry initiator and approver offices.
Archiving is always soft (`archived_at` set) — never hard deletes.

**Error format:** `{ error: "message" }` with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).

## UI / UX

### Design Tokens

| Token          | Value                                                   | Notes                                         |
| -------------- | ------------------------------------------------------- | --------------------------------------------- |
| Primary        | `#0C4651` (dark teal)                                   | Header, primary buttons, brand accent         |
| Surface        | `#FFFFFF` / `#F5F7F8`                                   | Cards and page backgrounds                    |
| Text           | `#1A1A1A`                                               | Primary text; high contrast on white (15.4:1) |
| Text secondary | `#6B7280`                                               | Muted/helper text                             |
| Spacing scale  | Material UI defaults (8px base)                         | `0, 8, 16, 24, 32, 48, 64`                    |
| Typography     | System sans-serif stack + Google Fonts (dev-selectable) | System fonts for offline reliability          |
| Border radius  | 8px (cards, buttons), 4px (inputs)                      | Material UI defaults                          |
| Shadows        | MUI elevation system                                    | Subtle depth for cards and dialogs            |

### Component Library

| Component            | States Covered                          | Accessibility Notes                       |
| -------------------- | --------------------------------------- | ----------------------------------------- |
| EditableText         | view, edit, saving, error               | Inline editing with click-to-edit pattern |
| ActionCard           | loading, empty, error, populated        | Expandable cards for outcome actions      |
| BodyFilter           | selected, unselected, hierarchy levels  | Dropdown/tabs for body classification     |
| NoticeCard           | active, expired, edit, delete           | Channel-tagged (koro/lewe)                |
| ActionRow            | view, edit, RACI assignments            | Inline RACI management                    |
| Scorecard/VScorecard | loading, empty, per-node, roll-up view  | Hierarchical KPI display                  |
| OutcomeBoard         | outcome → indicator → action cascade    | Expand/collapse tree                      |
| Hierarchy tree       | public bare, member offices, admin edit | Three-tier visibility per access ladder   |

### Layout

- **Max content width:** 1200px app default, 72ch for prose/markdown
- **Breakpoints:** mobile-first — sm (600px), md (960px), lg (1280px)
- **Navigation pattern:** Left sidebar nav (collapsible) with section groups
- **Responsive strategy:** Single-column stack on mobile; two-column (tree + detail) on desktop

### UX Patterns

- **Forms:** Inline editing via EditableText; validation on blur; error below field
- **Data display:** Cards for entities (projects, notices), tables for financials, trees for hierarchy
- **Feedback:** Snackbar/toast for save/error; inline loading spinners
- **Empty states:** Context-appropriate CTAs ("No notices posted yet", "Add first KPI")
- **Error states:** Error boundary at page level; retry button on fetch failures
- **Action sheet:** Contextual actions appear as icon buttons on card hover (not on mobile — always visible)

### Accessibility Baseline

- **Standard:** WCAG 2.1 AA (targeted, not fully verified)
- **Color contrast:** Primary `#0C4651` on white = 10.2:1 (passes AAA). Dark-on-light themes dominant.
- **Keyboard:** Tab navigation through interactive elements; Enter/Space to activate
- **Screen reader:** Semantic HTML (headings, lists, buttons); aria-label on icon-only buttons
- **Motion:** Minimal animations; no `prefers-reduced-motion` detection yet
- **Touch targets:** Material UI's minimum 36px (below 44px recommendation)
