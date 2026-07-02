# Contributing

## Development

```bash
npm run dev          # API + Vite dev servers
npm run build        # Production frontend build
npm start            # API only (production)
node db.js test      # Test database connection
node db.js apply     # Apply schema.sql
```

## Code Style

- **Backend:** Standard Node.js conventions, 2-space indent
- **Frontend:** ESLint (`npm --prefix web run lint`)
- Migrations follow numeric naming: `migrations/NNN_description.sql`

## Pre-commit

Husky + lint-staged runs ESLint on staged frontend files before commit.

## Domain Language

See `CONTEXT.md` for the canonical domain glossary. Use Fijian customary terms
as-is in code and documentation — they are the ubiquitous language.
