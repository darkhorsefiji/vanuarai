# Deployment

Single-command launch for the VanuaRai API.

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon connection string)
- Google Cloud project with OAuth 2.0 client ID
- PM2 (for production process management): `npm install -g pm2`

## Environment

Create `.env` in the project root:

```
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
JWT_SECRET=a-random-secret-string
```

## Build

```bash
npm install
npm --prefix web install
npm run build          # builds frontend to web/dist/
```

## Run

### Development (two servers)

```bash
npm run dev
```

- API: `http://localhost:3000`
- Vite HMR: `http://localhost:5173`

### Production (PM2)

```bash
npm run serve          # starts via PM2, saves for auto-restart on reboot
npm run serve:logs     # tail logs
npm run serve:restart  # graceful restart
npm run serve:stop     # stop
```

## Database

```bash
node db.js test        # verify connectivity
node db.js apply       # apply schema.sql (idempotent — uses IF NOT EXISTS)
```

Migrations in `migrations/` are incremental. Apply in numeric order:

```bash
for f in migrations/*.sql; do node db.js apply "$f"; done
```

## Health Check

```bash
curl http://localhost:3000/api/health
# { "ok": true, "googleConfigured": true }
```

## Shutdown

```bash
pm2 stop raivanua-api
```

PM2 handles graceful drain of in-flight requests.

## Backup

Neon provides point-in-time recovery. For logical backup:

```bash
pg_dump "$DATABASE_URL" --no-owner --clean > backup.sql
```

## Environment File Template

```
# .env.example — copy to .env and fill in values
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/vanuarai?sslmode=require
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
JWT_SECRET=generate-a-random-64-char-string
```
