// VanuaRai API — JSON endpoints over the live Neon data; consumed by the React app.
// Run: node server.js  (serves /api/* on :3000, and web/dist if built)
require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const express = require("express");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const app = express();
const VILLAGE = "Bagasau";
const q = (sql, p = []) => pool.query(sql, p).then(r => r.rows);
const n = v => Number(v);

// permissive CORS for local dev (Vite on :5173)
app.use((req, res, next) => { res.set("Access-Control-Allow-Origin", "*"); next(); });

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/plans", async (req, res) => {
  const rows = await q(`select p.name, p.volume_mb, p.validity, p.price_cents from plans p
    join villages v on p.village_id=v.id where v.name=$1 order by p.price_cents`, [VILLAGE]);
  res.json(rows.map(r => ({ ...r, price_cents: n(r.price_cents), volume_mb: n(r.volume_mb) })));
});

app.get("/api/profile", async (req, res) => {
  const [v] = await q(`select name, introduction, background, latitude, longitude, how_to_get_there
    from villages where name=$1`, [VILLAGE]);
  const [counts] = await q(`select
    (select count(*) from scope_nodes where level='yavusa')::int yavusa,
    (select count(*) from scope_nodes where level='mataqali')::int mataqali,
    (select count(*) from scope_nodes where level='tokatoka')::int tokatoka,
    (select count(*) from scope_nodes where level='vuvale')::int vuvale,
    (select count(*) from scope_nodes where axis='soqosoqo')::int soqosoqo,
    (select count(*) from memberships)::int members`);
  const resources = await q(`select sector, resource_score, participation_score, notes
    from village_resources vr join villages vi on vi.id=vr.village_id
    where vi.name=$1 order by sort_order`, [VILLAGE]);
  res.json({
    name: v.name, district: "Tikina / District (TBD)", province: "Provincial Council (TBD)",
    introduction: v.introduction, background: v.background,
    latitude: v.latitude != null ? n(v.latitude) : null,
    longitude: v.longitude != null ? n(v.longitude) : null,
    how_to_get_there: v.how_to_get_there,
    counts,
    resources: resources.map(r => ({ sector: r.sector, resource: n(r.resource_score), participation: n(r.participation_score), notes: r.notes })),
  });
});

app.get("/api/hierarchy", async (req, res) => {
  const rows = await q(`select id,label,parent_id,level from scope_nodes where axis='traditional'`);
  res.json(rows);
});

app.get("/api/projects", async (req, res) => {
  const rows = await q(`select p.name, p.budget_cents, p.physical_progress prog, p.status, sn.label owner,
      coalesce(sum(le.amount_cents) filter (where le.direction='in'),0)::bigint raised,
      coalesce(sum(le.amount_cents) filter (where le.direction='out'),0)::bigint spent
    from projects p join scope_nodes sn on sn.id=p.owner_body_node_id
    left join ledger_entries le on le.pot_id=p.pot_id group by p.id, sn.label order by p.name`);
  res.json(rows.map(r => ({ ...r, budget_cents: n(r.budget_cents), prog: n(r.prog), raised: n(r.raised), spent: n(r.spent) })));
});

app.get("/api/fundraising", async (req, res) => {
  const rows = await q(`select p.name, sn.label owner, po.goal_cents,
      coalesce(sum(le.amount_cents) filter (where le.direction='in'),0)::bigint raised
    from projects p join pots po on po.id=p.pot_id join scope_nodes sn on sn.id=p.owner_body_node_id
    left join ledger_entries le on le.pot_id=p.pot_id group by p.id, sn.label, po.goal_cents order by raised desc`);
  res.json(rows.map(r => ({ ...r, goal_cents: n(r.goal_cents), raised: n(r.raised) })));
});

app.get("/api/financials", async (req, res) => {
  const rows = await q(`select po.purpose,
      coalesce(sum(le.amount_cents) filter (where le.direction='in'),0)::bigint tin,
      coalesce(sum(le.amount_cents) filter (where le.direction='out'),0)::bigint tout
    from pots po left join ledger_entries le on le.pot_id=po.id
    where po.owner_body_node_id=(select village_node_id from villages where name=$1)
    group by po.id, po.purpose order by po.purpose`, [VILLAGE]);
  res.json(rows.map(r => ({ purpose: r.purpose, tin: n(r.tin), tout: n(r.tout) })));
});

app.get("/api/minutes", async (req, res) => {
  const rows = await q(`select m.title, to_char(m.meeting_date,'YYYY-MM-DD') d, sn.level, sn.label,
      string_agg(r.ref_label||': '||r.summary,' • ') res
    from minutes m join scope_nodes sn on sn.id=m.classification_node_id
    left join resolutions r on r.minutes_id=m.id group by m.id, sn.level, sn.label order by m.meeting_date desc`);
  res.json(rows);
});

// Serve built React app if present (production); dev uses the Vite server with a proxy.
const dist = path.join(__dirname, "web", "dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, "index.html"), err => { if (err) res.status(404).end(); }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("VanuaRai API on http://localhost:" + PORT));
