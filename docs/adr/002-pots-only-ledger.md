# ADR 2 — Pots-only ledger (no personal wallets)

**Date:** 2026-06-05
**Status:** Accepted

## Context

Villages need to collect and track money for body treasuries and fundraising projects.
A personal wallet feature would let members hold balances. However, stored-value
issuance triggers full e-money licensing under Fiji's NPS Act 2021 (RBF).

## Decision

Pots-only, give-direct. Contributors pay directly from their own licensed instrument
(M-PAiSA/MyCash/card) into the specific fundraiser/body custodial account. Tobu is
a ledger over a custodial pool, not a stored-value issuer.

## Rationale

- Avoids the single feature (personal wallet) that would force full RBF e-money licensing
- Pots that only receive + disburse plausibly fit the closed-loop merchant-acquiring exemption
- Simpler mental model for villagers: "I give to the seawall fund" vs "I have a balance"
- Money is always in a regulated custodial account, never in the platform

## Consequences

- No stored balances for members — every contribution is a direct payment
- Disbursements require maker-checker + receipts (never anonymous)
- On-behalf-of cash recording: Dau ni Yau banks cash then logs the ledger entry
- Temporary pot expiry: unspent funds held, moved only via resolution
- Requires RBF pre-licensing consultation to confirm closed-loop path
