# Domain Docs

**Layout:** Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root.

Consumer rules for skills that read domain docs:

- `CONTEXT.md` at the repo root is the canonical domain glossary.
- `docs/adr/` contains Architectural Decision Records (one per decision, numbered sequentially).
- Skills that need domain context read `CONTEXT.md` first, then any relevant ADRs.
