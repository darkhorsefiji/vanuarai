# ADR 5 — Soft archive (never hard delete)

**Date:** 2026-06-07
**Status:** Accepted

## Context

Village governance data (lineage, land, money, minutes) has legal and customary
significance. Deleting data could destroy audit trails and violate the principle
of transparent record-keeping that underlies the platform's value proposition.

## Decision

All deletes are soft archives — `archived_at` column set to now(), never
`DELETE FROM`. Archived rows are hidden from all views but preserved for audit.

## Rationale

- Accountability: village members must be able to trace all changes
- Legal: financial records must be retained (Fiji AML/CFT obligations)
- Reversibility: mistaken archives can be reversed by Village Admin
- Cascade archiving: archiving a node archives its subtree + linked financial records
- Corrections are new entries, never edits (append-only audit_log)

## Consequences

- Every mutable table needs an `archived_at` column
- Queries must filter `WHERE archived_at IS NULL` for live data
- Cascade archive logic must handle recursive subtrees (scope_nodes) + linked records
- Hard deletes are reserved for seeding/development only
- Database grows monotonically — eventual archiving/purging strategy needed at scale
