// VanuaRai API — JSON endpoints over the live Neon data; consumed by the React app.
// Run: node server.js  (serves /api/* on :3000, and web/dist if built)
require("dotenv").config({ path: __dirname + "/.env" });
const path = require("path");
const express = require("express");
const { Pool } = require("pg");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const app = express();
const VILLAGE = "Bagasau";
const q = (sql, p = []) => pool.query(sql, p).then(r => r.rows);
const n = v => Number(v);
const NEXT_LEVEL = { vanua: 'yavusa', yavusa: 'mataqali', mataqali: 'tokatoka', tokatoka: 'vuvale', provincial_council: 'district', district: 'village' };
const BODY_LEVELS = new Set(['mataqali', 'village', 'soqosoqo']);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const gclient = new OAuth2Client(GOOGLE_CLIENT_ID);

// permissive CORS for local dev (Vite on :5173)
app.use((req, res, next) => { res.set("Access-Control-Allow-Origin", "*"); res.set("Access-Control-Allow-Headers", "Content-Type, Authorization"); next(); });
app.use(express.json());
// decode a Bearer session token (if present) onto req.user
app.use((req, res, next) => {
  const m = (req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (m) { try { req.user = jwt.verify(m[1], JWT_SECRET); } catch { /* ignore invalid token */ } }
  next();
});

app.get("/api/health", (req, res) => res.json({ ok: true, googleConfigured: !!GOOGLE_CLIENT_ID }));

// ---- Auth ----
app.post("/api/auth/google", async (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: "Google login not configured on the server" });
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: "credential required" });
  try {
    const ticket = await gclient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    const [u] = await q(
      `insert into users(google_sub, email, display_name) values($1,$2,$3)
       on conflict (google_sub) do update set email=excluded.email, display_name=excluded.display_name
       returning id, email, display_name, is_app_admin`,
      [p.sub, p.email, p.name || p.email]);
    const token = jwt.sign({ uid: u.id, email: u.email, name: u.display_name }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: "invalid Google token" });
  }
});

app.get("/api/me", async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const [u] = await q(`select id, email, display_name, is_app_admin from users where id=$1`, [req.user.uid]);
  if (!u) return res.json({ user: null });
  const [mem] = await q(
    `select m.role, m.status from memberships m join villages v on v.id=m.village_id
     where m.user_id=$1 and v.name=$2`, [u.id, VILLAGE]);
  const offices = await q(`select office, body_node_id from body_offices where user_id=$1 and active=true`, [u.id]);
  res.json({ user: { id: u.id, email: u.email, name: u.display_name, isAppAdmin: u.is_app_admin, role: mem?.role || null, status: mem?.status || null, offices } });
});

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
    name: v.name, district: "Tikina / District (TBD)", province: "Province (TBD)",
    introduction: v.introduction, background: v.background,
    latitude: v.latitude != null ? n(v.latitude) : null,
    longitude: v.longitude != null ? n(v.longitude) : null,
    how_to_get_there: v.how_to_get_there,
    counts,
    resources: resources.map(r => ({ sector: r.sector, resource: n(r.resource_score), participation: n(r.participation_score), notes: r.notes })),
  });
});

// Admin: update profile text + pinned location. (No auth yet — gate to official/admin later.)
app.patch("/api/profile", async (req, res) => {
  const b = req.body || {};
  const lat = b.latitude != null && b.latitude !== "" ? Number(b.latitude) : null;
  const lon = b.longitude != null && b.longitude !== "" ? Number(b.longitude) : null;
  const [v] = await q(
    `update villages set introduction=$1, background=$2, how_to_get_there=$3, latitude=$4, longitude=$5
     where name=$6 returning name`,
    [b.introduction ?? null, b.background ?? null, b.how_to_get_there ?? null, lat, lon, VILLAGE]);
  res.json({ ok: !!v });
});

app.get("/api/hierarchy", async (req, res) => {
  const rows = await q(`select id,label,parent_id,level,axis from scope_nodes`);
  res.json(rows);
});

app.get("/api/composition", async (req, res) => {
  const rows = await q(`select vu.id vuvale_id, vu.label vuvale, tok.label tokatoka, mat.label mataqali,
      p.full_name, p.relationship, to_char(p.date_of_birth,'YYYY') yob, p.is_deceased
    from scope_nodes vu
      join scope_nodes tok on tok.id = vu.parent_id
      join scope_nodes mat on mat.id = tok.parent_id
      left join persons p on p.vuvale_node_id = vu.id
    where vu.level='vuvale'
    order by mat.label, tok.label, vu.label, p.relationship`);
  const byVuvale = new Map();
  for (const r of rows) {
    if (!byVuvale.has(r.vuvale_id))
      byVuvale.set(r.vuvale_id, { vuvale: r.vuvale, tokatoka: r.tokatoka, mataqali: r.mataqali, persons: [] });
    if (r.full_name)
      byVuvale.get(r.vuvale_id).persons.push({ name: r.full_name, relationship: r.relationship, yob: r.yob, deceased: r.is_deceased });
  }
  res.json([...byVuvale.values()]);
});

app.get("/api/level-styles", async (req, res) => {
  res.json(await q(`select level, label, color, sort_order from level_styles order by sort_order`));
});

// Admin: update hierarchy level styling (colour + label). Body: { styles:[{level,color,label}] }
app.patch("/api/level-styles", async (req, res) => {
  const styles = (req.body && req.body.styles) || [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const s of styles) {
      await client.query(`update level_styles set color=$1, label=$2 where level=$3`,
        [s.color, s.label, s.level]);
    }
    await client.query("COMMIT");
    res.json({ ok: true, updated: styles.length });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ ok: false, error: e.message });
  } finally {
    client.release();
  }
});

// ---- Hierarchy node CRUD (Admin) ----
app.post("/api/nodes", async (req, res) => {
  const { parent_id, label } = req.body || {};
  if (!parent_id || !label) return res.status(400).json({ error: "parent_id and label required" });
  const [p] = await q(`select id, axis, level, village_id from scope_nodes where id=$1`, [parent_id]);
  if (!p) return res.status(404).json({ error: "parent not found" });
  const childLevel = NEXT_LEVEL[p.level];
  if (!childLevel) return res.status(400).json({ error: `cannot add a child under ${p.level}` });
  const [row] = await q(
    `insert into scope_nodes(axis, level, label, parent_id, village_id, is_body)
     values($1,$2,$3,$4,$5,$6) returning id`,
    [p.axis, childLevel, label, parent_id, p.village_id, BODY_LEVELS.has(childLevel)]);
  res.json({ ok: true, id: row.id, level: childLevel });
});

app.patch("/api/nodes/:id", async (req, res) => {
  const { label } = req.body || {};
  if (!label) return res.status(400).json({ error: "label required" });
  await q(`update scope_nodes set label=$1 where id=$2`, [label, req.params.id]);
  res.json({ ok: true });
});

app.delete("/api/nodes/:id", async (req, res) => {
  const id = req.params.id;
  if ((await q(`select 1 from scope_nodes where parent_id=$1 limit 1`, [id])).length)
    return res.status(400).json({ error: "has child nodes — remove them first" });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`delete from persons where vuvale_node_id=$1`, [id]);
    await client.query(`delete from scope_nodes where id=$1`, [id]);
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(409).json({ error: "cannot delete — still referenced by members or records" });
  } finally {
    client.release();
  }
});

// ---- Vuvale persons CRUD (Admin) ----
app.get("/api/vuvale/:id/persons", async (req, res) => {
  res.json(await q(
    `select id, full_name, gender, relationship,
       to_char(date_of_birth,'YYYY-MM-DD') dob, to_char(date_of_death,'YYYY-MM-DD') dod, is_deceased,
       case when date_of_birth is null then null
            when date_of_death is not null then extract(year from age(date_of_death, date_of_birth))::int
            else extract(year from age(date_of_birth))::int end age
     from persons where vuvale_node_id=$1 order by relationship, full_name`, [req.params.id]));
});

app.post("/api/persons", async (req, res) => {
  const b = req.body || {};
  if (!b.vuvale_node_id || !b.full_name) return res.status(400).json({ error: "vuvale_node_id and full_name required" });
  const [row] = await q(
    `insert into persons(vuvale_node_id, full_name, gender, relationship, date_of_birth, date_of_death, is_deceased)
     values($1,$2,$3,$4,$5,$6,$7) returning id`,
    [b.vuvale_node_id, b.full_name, b.gender || null, b.relationship || null, b.date_of_birth || null, b.date_of_death || null, !!b.date_of_death]);
  res.json({ ok: true, id: row.id });
});

app.patch("/api/persons/:id", async (req, res) => {
  const b = req.body || {};
  await q(`update persons set full_name=$1, gender=$2, relationship=$3, date_of_birth=$4, date_of_death=$5, is_deceased=$6 where id=$7`,
    [b.full_name, b.gender || null, b.relationship || null, b.date_of_birth || null, b.date_of_death || null, !!b.date_of_death, req.params.id]);
  res.json({ ok: true });
});

app.delete("/api/persons/:id", async (req, res) => {
  await q(`delete from persons where id=$1`, [req.params.id]);
  res.json({ ok: true });
});

app.get("/api/projects", async (req, res) => {
  const rows = await q(`select p.id, p.name, p.budget_cents, p.physical_progress prog, p.status, sn.label owner,
      to_char(p.start_date,'YYYY-MM-DD') start_date, to_char(p.end_date,'YYYY-MM-DD') end_date,
      coalesce(sum(le.amount_cents) filter (where le.direction='in'),0)::bigint raised,
      coalesce(sum(le.amount_cents) filter (where le.direction='out'),0)::bigint spent
    from projects p join scope_nodes sn on sn.id=p.owner_body_node_id
    left join ledger_entries le on le.pot_id=p.pot_id group by p.id, sn.label order by p.name`);
  const photos = await q(`select project_id, image_ref, caption from project_photos order by id`);
  const byProj = {};
  for (const ph of photos) (byProj[ph.project_id] = byProj[ph.project_id] || []).push({ src: ph.image_ref, caption: ph.caption });
  res.json(rows.map(r => ({
    id: r.id, name: r.name, owner: r.owner, status: r.status,
    start_date: r.start_date, end_date: r.end_date,
    budget_cents: n(r.budget_cents), prog: n(r.prog), raised: n(r.raised), spent: n(r.spent),
    photos: byProj[r.id] || [],
  })));
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
