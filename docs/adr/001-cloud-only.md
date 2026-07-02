# ADR 1 — Cloud-only deployment (no edge server)

**Date:** 2026-06-05
**Status:** Accepted

## Context

VanuaRai needs to serve rural Fijian villages with limited infrastructure. Two options:

1. Cloud-only — backend runs behind Starlink, accessed via WiFi
2. Edge box — per-village server hardware for local processing

## Decision

Cloud-only at launch. The captive portal + backend run behind Starlink; no per-village server hardware.

## Rationale

- Simpler provisioning: one deployment, zero field hardware maintenance
- Village AP MAC maps to village via database table — no per-village config
- Architecture allows an edge box to be added later without breaking changes
- Starlink provides sufficient bandwidth for the pilot

## Consequences

- Full Starlink outage takes the village entirely offline (accepted risk for pilot)
- Captive portal walled garden handles the "no active plan" state without full internet
- All data lives in Neon Postgres; no local caching or offline sync
