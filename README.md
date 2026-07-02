# VanuaRai (RAIVANUA)

Village administration and internet access platform for rural iTaukei villages in Fiji.

## Overview

VanuaRai is a two-part platform delivered over village WiFi:

1. **Internet Access** — captive portal that meters and sells internet plans (M-PAiSA/MyCash/card)
2. **Village Administration** — transparent record-keeping for lineage, land, minutes, fundraising, financials

## Stack

- **Backend:** Node.js / Express.js on Neon (PostgreSQL)
- **Frontend:** React + Vite (Material UI)
- **Auth:** Google OAuth + JWT
- **Deployment:** PM2 process manager

## Quick Start

```bash
# Install dependencies
npm install
npm --prefix web install

# Create .env with DATABASE_URL and GOOGLE_CLIENT_ID
cp .env.example .env

# Apply database schema
node db.js apply

# Run development servers (API on :3000, Vite on :5173)
npm run dev
```

## Documentation

- `VanuaRai_PRD.md` — Product Requirements & Design Specification
- `API.md` — API endpoint contracts
- `docs/ARCHITECTURE.md` — Stack & topology decisions
- `docs/outcome-framework-spec.md` — Outcome framework spec
- `CONTEXT.md` — Domain glossary (iTaukei terms, concepts)
