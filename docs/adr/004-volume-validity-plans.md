# ADR 4 — Volume + validity internet plans

**Date:** 2026-06-05
**Status:** Accepted

## Context

Rural Fijian villages access internet via metered Starlink. Plans need to be
both affordable and sustainable for the operator. Options: pure time-based,
pure volume-based, or combined.

## Decision

Combined volume + validity-window plans. Each plan = data bucket + time window
(daily/weekly/fortnightly/monthly). Whichever runs out first triggers the L4 redirect.

## Rationale

- Volume is the primary cost lever (protects metered Starlink bandwidth)
- Time is the backstop (prevents indefinite use of a single bucket)
- One device per plan (binds to client MAC) — prevents sharing
- No rollover (volume dies with the window) — predictable costs
- One active plan at a time — buying more tops up current bucket
- ~90% used soft warning before hard cutoff

## Consequences

- RADIUS accounting must track byte counters per client MAC
- CoA disconnect when either volume or time cap is hit
- Per-village pricing capability built but may launch flat
- Fair for both villagers (affordable tiers) and operator (predictable bandwidth)
