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
const NEXT_LEVEL = { vanua: 'yavusa', yavusa: 'mataqali', mataqali: 'tokatoka', tokatoka: 'vuvale', matanitu: 'provincial_council', provincial_council: 'district', district: 'village' };
const BODY_LEVELS = new Set(['mataqali', 'village', 'soqosoqo']);
const VALIDITY = new Set(['daily', 'weekly', 'fortnightly', 'monthly']);
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const gclient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Resilience: a single bad request (e.g. malformed input -> rejected DB query in
// an async handler) must never take down the whole API process.
process.on("unhandledRejection", (err) => console.error("unhandledRejection:", err && err.message ? err.message : err));
process.on("uncaughtException", (err) => console.error("uncaughtException:", err && err.message ? err.message : err));

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
      `insert into users(google_sub, email, display_name, photo_url) values($1,$2,$3,$4)
       on conflict (google_sub) do update set email=excluded.email, display_name=excluded.display_name, photo_url=excluded.photo_url
       returning id, email, display_name, is_app_admin`,
      [p.sub, p.email, p.name || p.email, p.picture || null]);
    const token = jwt.sign({ uid: u.id, email: u.email, name: u.display_name }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: "invalid Google token" });
  }
});

app.get("/api/me", async (req, res) => {
  if (!req.user) return res.json({ user: null });
  const [u] = await q(`select id, email, display_name, is_app_admin, photo_url from users where id=$1`, [req.user.uid]);
  if (!u) return res.json({ user: null });
  const [mem] = await q(
    `select m.role, m.status from memberships m join villages v on v.id=m.village_id
     where m.user_id=$1 and v.name=$2`, [u.id, VILLAGE]);
  const offices = await q(`select office, body_node_id from body_offices where user_id=$1 and active=true`, [u.id]);
  res.json({ user: { id: u.id, email: u.email, name: u.display_name, photo: u.photo_url, isAppAdmin: u.is_app_admin, role: mem?.role || null, status: mem?.status || null, offices } });
});

app.get("/api/plans", async (req, res) => {
  const rows = await q(`select p.id, p.name, p.volume_mb, p.validity, p.price_cents, p.active from plans p
    join villages v on p.village_id=v.id where v.name=$1 order by p.price_cents`, [VILLAGE]);
  res.json(rows.map(r => ({ ...r, price_cents: n(r.price_cents), volume_mb: n(r.volume_mb) })));
});

// Admin: plan configuration + pricing (surfaced on the Dev page). No auth gate yet — gate to admin later.
const planFields = b => [
  String(b.name || '').trim(),
  Math.max(0, parseInt(b.volume_mb, 10) || 0),
  b.validity,
  Math.max(0, parseInt(b.price_cents, 10) || 0),
  b.active !== false,
];
app.post("/api/plans", async (req, res) => {
  const b = req.body || {};
  if (!b.name || !VALIDITY.has(b.validity)) return res.status(400).json({ error: "name and validity (daily/weekly/fortnightly/monthly) required" });
  try {
    const [v] = await q(`select id from villages where name=$1`, [VILLAGE]);
    const [row] = await q(
      `insert into plans(village_id, name, volume_mb, validity, price_cents, active)
       values($1,$2,$3,$4,$5,$6) returning id`,
      [v.id, ...planFields(b)]);
    res.json({ ok: true, id: row.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.patch("/api/plans/:id", async (req, res) => {
  const b = req.body || {};
  if (!b.name || !VALIDITY.has(b.validity)) return res.status(400).json({ error: "name and validity (daily/weekly/fortnightly/monthly) required" });
  try {
    await q(`update plans set name=$1, volume_mb=$2, validity=$3, price_cents=$4, active=$5 where id=$6`,
      [...planFields(b), req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete("/api/plans/:id", async (req, res) => {
  try {
    await q(`delete from plans where id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: "Can't delete a plan that already has payments/sessions — set it inactive instead." });
  }
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
  // District + Province sourced live from the Government (provincial) hierarchy:
  // village node -> parent (district/Tikina) -> grandparent (provincial council).
  const [gov] = await q(`select dist.label district, prov.label province
    from villages vlg
      join scope_nodes vil on vil.id = vlg.village_node_id
      left join scope_nodes dist on dist.id = vil.parent_id
      left join scope_nodes prov on prov.id = dist.parent_id
    where vlg.name=$1`, [VILLAGE]);
  res.json({
    name: v.name, district: gov?.district || null, province: gov?.province || null,
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
  const rows = await q(`select id,label,parent_id,level,axis from scope_nodes where archived_at is null`);
  res.json(rows);
});

// Add a Soqosoqo (cross-cutting community body) under the village. Rename/delete
// reuse the generic /api/nodes/:id handlers.
app.post("/api/soqosoqo", async (req, res) => {
  const label = String((req.body || {}).label || "").trim();
  if (!label) return res.status(400).json({ error: "label required" });
  try {
    const [v] = await q(`select id village_id, village_node_id from villages where name=$1`, [VILLAGE]);
    if (!v || !v.village_node_id) return res.status(404).json({ error: "village node not found" });
    const [row] = await q(
      `insert into scope_nodes(axis, level, label, parent_id, village_id, is_body)
       values('soqosoqo','soqosoqo',$1,$2,$3,true) returning id`,
      [label, v.village_node_id, v.village_id]);
    res.json({ ok: true, id: row.id });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Government contact directory (provincial + divisional officers).
app.get("/api/gov-contacts", async (req, res) => {
  const rows = await q(`select gc.id, gc.title, gc.name, gc.role, gc.mobile, gc.office, gc.email
    from gov_contacts gc join villages v on v.id=gc.village_id
    where v.name=$1 order by gc.sort_order, gc.title`, [VILLAGE]);
  res.json(rows);
});
app.patch("/api/gov-contacts/:id", async (req, res) => {
  const b = req.body || {};
  try {
    await q(`update gov_contacts set name=$1, role=$2, mobile=$3, office=$4, email=$5 where id=$6`,
      [b.name || null, b.role || null, b.mobile || null, b.office || null, b.email || null, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Lands: request pipeline + allocation register.
app.get("/api/land-requests", async (req, res) => {
  res.json(await q(`select lr.id, lr.requester, lr.purpose, lr.size, lr.est_rent_cents, lr.status, lr.votes_for, lr.voters_eligible
    from land_requests lr join villages v on v.id=lr.village_id where v.name=$1 order by lr.sort_order`, [VILLAGE]));
});
app.get("/api/land-allocations", async (req, res) => {
  res.json(await q(`select la.id, la.leasee, la.purpose, la.term, to_char(la.expiry,'YYYY-MM-DD') expiry,
      la.lease_mgt, la.premium_cents, la.rent_year_cents
    from land_allocations la join villages v on v.id=la.village_id where v.name=$1 order by la.sort_order`, [VILLAGE]));
});

// Financials tabs: transactions, asset register, investments.
app.get("/api/fin-transactions", async (req, res) => {
  res.json(await q(`select t.id, to_char(t.tx_date,'YYYY-MM-DD') tx_date, t.description, t.fund, t.type, t.method, t.amount_cents,
      sn.level, sn.label body, sn.id body_id
    from fin_transactions t join villages v on v.id=t.village_id
    left join scope_nodes sn on sn.id=t.classification_node_id
    where v.name=$1 and t.archived_at is null order by t.tx_date desc`, [VILLAGE]));
});
app.get("/api/assets", async (req, res) => {
  res.json(await q(`select a.id, a.name, a.category, to_char(a.acquired,'YYYY-MM-DD') acquired, a.value_cents, a.condition, a.custodian,
      sn.level, sn.label body, sn.id body_id
    from village_assets a join villages v on v.id=a.village_id
    left join scope_nodes sn on sn.id=a.classification_node_id
    where v.name=$1 and a.archived_at is null order by a.sort_order`, [VILLAGE]));
});
app.get("/api/investments", async (req, res) => {
  res.json(await q(`select i.id, i.name, i.type, i.amount_cents, i.current_value_cents, i.return_pct, i.notes,
      sn.level, sn.label body, sn.id body_id
    from village_investments i join villages v on v.id=i.village_id
    left join scope_nodes sn on sn.id=i.classification_node_id
    where v.name=$1 and i.archived_at is null order by i.sort_order`, [VILLAGE]));
});

// Kacikacivaki (announcements): channel 'koro' = official, 'lewe' = community.
// First role-gated surface: posting requires sign-in; 'koro' requires the
// 'official' membership role (or app admin); edit/delete = owner or official.
async function noticeActor(req) {
  if (!req.user) return null;
  const [u] = await q(`select id, display_name, is_app_admin from users where id=$1`, [req.user.uid]);
  if (!u) return null;
  const [mem] = await q(`select m.role from memberships m join villages v on v.id=m.village_id
    where m.user_id=$1 and v.name=$2`, [u.id, VILLAGE]);
  return { id: u.id, name: u.display_name, isAppAdmin: u.is_app_admin, role: mem?.role || null };
}
const isOfficial = a => !!a && (a.isAppAdmin || a.role === "official");

// app_admin (DEV) only — the top tier.
async function isAppAdminReq(req) {
  if (!req.user) return false;
  const [u] = await q(`select is_app_admin from users where id=$1`, [req.user.uid]);
  return !!(u && u.is_app_admin);
}

// village_admin tier: app admin OR holds an active village_admin body office.
// Mirrors the frontend isVillageAdmin so node editing is enforced, not just hidden.
async function isVillageAdminReq(req) {
  if (!req.user) return false;
  const [u] = await q(`select is_app_admin from users where id=$1`, [req.user.uid]);
  if (!u) return false;
  if (u.is_app_admin) return true;
  const off = await q(`select 1 from body_offices where user_id=$1 and office='village_admin' and active=true limit 1`, [req.user.uid]);
  return off.length > 0;
}

app.get("/api/notices", async (req, res) => {
  res.json(await q(`select n.id, n.channel, n.author, n.author_role, n.body, n.created_by,
      to_char(n.posted_at at time zone 'Pacific/Fiji','YYYY-MM-DD HH24:MI') posted_at,
      to_char(n.expires_at,'YYYY-MM-DD') expires_at,
      case when n.expires_at is null or n.expires_at >= (now() at time zone 'Pacific/Fiji')::date
           then 'Active' else 'Expired' end status
    from notices n join villages v on v.id=n.village_id where v.name=$1
    order by n.posted_at desc`, [VILLAGE]));
});
app.post("/api/notices", async (req, res) => {
  const b = req.body || {};
  const channel = b.channel === 'koro' ? 'koro' : 'lewe';
  const body = String(b.body || '').trim();
  if (!body) return res.status(400).json({ error: "body required" });
  try {
    const actor = await noticeActor(req);
    if (!actor) return res.status(401).json({ error: "sign in to post" });
    if (channel === 'koro' && !isOfficial(actor)) return res.status(403).json({ error: "only village officials can post official notices" });
    const [v] = await q(`select id from villages where name=$1`, [VILLAGE]);
    const [row] = await q(
      `insert into notices(village_id, channel, author, author_role, body, expires_at, created_by)
       values($1,$2,$3,$4,$5,$6,$7) returning id`,
      [v.id, channel, actor.name, channel === 'koro' ? (b.author_role || 'Official') : null, body.slice(0, 2000), b.expires_at || null, actor.id]);
    res.json({ ok: true, id: row.id });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
async function noticePermission(req, res) {
  const actor = await noticeActor(req);
  if (!actor) { res.status(401).json({ error: "sign in first" }); return null; }
  const [n] = await q(`select created_by from notices where id=$1`, [req.params.id]);
  if (!n) { res.status(404).json({ error: "post not found" }); return null; }
  if (!isOfficial(actor) && !(n.created_by && n.created_by === actor.id)) {
    res.status(403).json({ error: "you can only change your own posts" }); return null;
  }
  return actor;
}
app.patch("/api/notices/:id", async (req, res) => {
  try {
    if (!(await noticePermission(req, res))) return;
    const b = req.body || {};
    const body = String(b.body || '').trim();
    if (!body) return res.status(400).json({ error: "body required" });
    await q(`update notices set body=$1, expires_at=$2 where id=$3`, [body.slice(0, 2000), b.expires_at || null, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/notices/:id", async (req, res) => {
  try {
    if (!(await noticePermission(req, res))) return;
    await q(`delete from notices where id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
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
  res.json(await q(`select level, label, label_en, color, sort_order from level_styles order by sort_order`));
});

// DEV: add / remove hierarchy level name rows.
app.post("/api/level-styles", async (req, res) => {
  const b = req.body || {};
  const level = String(b.level || "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!level || !b.label) return res.status(400).json({ error: "level key and Fijian label required" });
  try {
    const [row] = await q(`insert into level_styles(level, label, label_en, color, sort_order)
      values($1,$2,$3,$4, coalesce((select max(sort_order) from level_styles),0)+1)
      on conflict (level) do nothing returning level`,
      [level, String(b.label).slice(0, 40), (b.label_en || null), b.color || "#6f8a8f"]);
    if (!row) return res.status(409).json({ error: "that level already exists" });
    res.json({ ok: true, level: row.level });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/level-styles/:level", async (req, res) => {
  try {
    await q(`delete from level_styles where level=$1`, [req.params.level]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Admin/DEV: update hierarchy level styling + names. Body: { styles:[{level,color,label,label_en?}] }
// label_en only updates when supplied, so the Admin colour editor doesn't wipe it.
app.patch("/api/level-styles", async (req, res) => {
  const styles = (req.body && req.body.styles) || [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const s of styles) {
      await client.query(`update level_styles set color=coalesce($1,color), label=coalesce($2,label),
          label_en=coalesce($3,label_en) where level=$4`,
        [s.color ?? null, s.label ?? null, s.label_en ?? null, s.level]);
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

// ---- Hierarchy node CRUD (village_admin only) ----
app.post("/api/nodes", async (req, res) => {
  if (!(await isVillageAdminReq(req))) return res.status(403).json({ error: "village admin access required" });
  const { parent_id, label } = req.body || {};
  if (!parent_id || !label) return res.status(400).json({ error: "parent_id and label required" });
  try {
    const [p] = await q(`select id, axis, level, village_id from scope_nodes where id=$1`, [parent_id]);
    if (!p) return res.status(404).json({ error: "parent not found" });
    const childLevel = NEXT_LEVEL[p.level];
    if (!childLevel) return res.status(400).json({ error: `cannot add a child under ${p.level}` });
    const [row] = await q(
      `insert into scope_nodes(axis, level, label, parent_id, village_id, is_body)
       values($1,$2,$3,$4,$5,$6) returning id`,
      [p.axis, childLevel, label, parent_id, p.village_id, BODY_LEVELS.has(childLevel)]);
    res.json({ ok: true, id: row.id, level: childLevel });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.patch("/api/nodes/:id", async (req, res) => {
  if (!(await isVillageAdminReq(req))) return res.status(403).json({ error: "village admin access required" });
  const { label } = req.body || {};
  if (!label) return res.status(400).json({ error: "label required" });
  try {
    await q(`update scope_nodes set label=$1 where id=$2`, [label, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Archive (retire) a node and its whole subtree, cascade-archiving every linked
// fundraising/financial record. Soft: rows are kept (audit), hidden from all views.
// Memberships are left intact — members of a retired household stay members and
// can be reassigned separately.
app.delete("/api/nodes/:id", async (req, res) => {
  if (!(await isVillageAdminReq(req))) return res.status(403).json({ error: "village admin access required" });
  const id = req.params.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sub = await client.query(`with recursive d as (
        select id from scope_nodes where id=$1
        union all select sn.id from scope_nodes sn join d on sn.parent_id=d.id
      ) select id from d`, [id]);
    const ids = sub.rows.map(r => r.id);
    const A = `set archived_at=now() where`;
    await client.query(`update scope_nodes ${A} id = any($1::uuid[]) and archived_at is null`, [ids]);
    await client.query(`update projects ${A} owner_body_node_id = any($1::uuid[]) and archived_at is null`, [ids]);
    await client.query(`update ledger_entries ${A} (contributor_vuvale_id = any($1::uuid[])
        or pot_id in (select id from pots where owner_body_node_id = any($1::uuid[]))) and archived_at is null`, [ids]);
    await client.query(`update fin_transactions ${A} classification_node_id = any($1::uuid[]) and archived_at is null`, [ids]);
    await client.query(`update village_assets ${A} classification_node_id = any($1::uuid[]) and archived_at is null`, [ids]);
    await client.query(`update village_investments ${A} classification_node_id = any($1::uuid[]) and archived_at is null`, [ids]);
    await client.query("COMMIT");
    res.json({ ok: true, archivedNodes: ids.length });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ---- Archive (void) individual financial & fundraising records (village_admin) ----
async function archiveRow(req, res, table) {
  if (!(await isVillageAdminReq(req))) return res.status(403).json({ error: "village admin access required" });
  try { await q(`update ${table} set archived_at=now() where id=$1`, [req.params.id]); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
}
app.delete("/api/fin-transactions/:id", (req, res) => archiveRow(req, res, "fin_transactions"));
app.delete("/api/assets/:id", (req, res) => archiveRow(req, res, "village_assets"));
app.delete("/api/investments/:id", (req, res) => archiveRow(req, res, "village_investments"));
app.delete("/api/contributions/:id", (req, res) => archiveRow(req, res, "ledger_entries"));
app.delete("/api/fundraising/:id", (req, res) => archiveRow(req, res, "projects"));

// ---- DEV reset: clear the demo "activity" data, keep the village structure ----
// Wipes money/efforts/notices/trade/minutes/lands/approvals. Keeps villages,
// scope_nodes (hierarchy), users/memberships/offices, persons, plans, styling,
// gov contacts and config. app_admin (DEV) only. Empty external tables that
// reference resolutions (audit_log, land_use_applications) get cascaded too.
const RESET_TABLES = [
  "ledger_entries", "pots", "projects", "project_photos",
  "fin_transactions", "village_assets", "village_investments",
  "notices", "trade_listings", "trade_buyers", "trade_contacts",
  "minutes", "resolutions", "land_requests", "land_allocations", "approvals",
];
app.post("/api/dev/reset", async (req, res) => {
  if (!(await isAppAdminReq(req))) return res.status(403).json({ error: "app admin (DEV) access required" });
  const client = await pool.connect();
  try {
    const counts = {};
    for (const t of RESET_TABLES) counts[t] = (await client.query(`select count(*)::int c from "${t}"`)).rows[0].c;
    await client.query("BEGIN");
    await client.query(`TRUNCATE ${RESET_TABLES.join(", ")} RESTART IDENTITY CASCADE`);
    await client.query("COMMIT");
    const clearedRows = Object.values(counts).reduce((s, n) => s + n, 0);
    res.json({ ok: true, clearedRows, tables: counts });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ---- Vuvale persons CRUD (Admin) ----
app.get("/api/vuvale/:id/persons", async (req, res) => {
  // household owners first (male then female), then everyone else oldest-first
  res.json(await q(
    `select id, full_name, gender, relationship, is_owner,
       to_char(date_of_birth,'YYYY-MM-DD') dob, to_char(date_of_death,'YYYY-MM-DD') dod, is_deceased,
       case when date_of_birth is null then null
            when date_of_death is not null then extract(year from age(date_of_death, date_of_birth))::int
            else extract(year from age(date_of_birth))::int end age
     from persons where vuvale_node_id=$1
     order by is_owner desc,
       case when is_owner and gender='Male' then 0 when is_owner then 1 else 2 end,
       date_of_birth asc nulls last, full_name`, [req.params.id]));
});

app.post("/api/persons", async (req, res) => {
  const b = req.body || {};
  if (!b.vuvale_node_id || !b.full_name) return res.status(400).json({ error: "vuvale_node_id and full_name required" });
  const [row] = await q(
    `insert into persons(vuvale_node_id, full_name, gender, relationship, date_of_birth, date_of_death, is_deceased, is_owner)
     values($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
    [b.vuvale_node_id, b.full_name, b.gender || null, b.relationship || null, b.date_of_birth || null, b.date_of_death || null, !!b.is_deceased, !!b.is_owner]);
  res.json({ ok: true, id: row.id });
});

app.patch("/api/persons/:id", async (req, res) => {
  const b = req.body || {};
  await q(`update persons set full_name=$1, gender=$2, relationship=$3, date_of_birth=$4, date_of_death=$5, is_deceased=$6, is_owner=$7 where id=$8`,
    [b.full_name, b.gender || null, b.relationship || null, b.date_of_birth || null, b.date_of_death || null, !!b.is_deceased, !!b.is_owner, req.params.id]);
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
      coalesce(sum(le.amount_cents) filter (where le.direction='out' and le.archived_at is null),0)::bigint spent
    from projects p join scope_nodes sn on sn.id=p.owner_body_node_id
    left join ledger_entries le on le.pot_id=p.pot_id and le.archived_at is null
    where p.archived_at is null group by p.id, sn.label order by p.name`);
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
  const rows = await q(`select p.id, p.name, sn.label owner, sn.level, sn.id body_id, po.goal_cents,
      coalesce(sum(le.amount_cents) filter (where le.direction='in'),0)::bigint raised
    from projects p join pots po on po.id=p.pot_id join scope_nodes sn on sn.id=p.owner_body_node_id
    left join ledger_entries le on le.pot_id=p.pot_id and le.archived_at is null
    where p.archived_at is null group by p.id, sn.label, sn.level, sn.id, po.goal_cents order by raised desc`);
  res.json(rows.map(r => ({ ...r, goal_cents: n(r.goal_cents), raised: n(r.raised) })));
});

// optional scope to a set of fundraising projects (their pots). A present-but-empty
// `projects` param means "no matching efforts" → no contributions (not "all").
function projectScope(req, params) {
  if (req.query.projects === undefined) return '';
  const ids = String(req.query.projects).split(',').filter(Boolean);
  params.push(ids);
  return `and le.pot_id in (select pot_id from projects where id = any($${params.length}::uuid[]))`;
}

// exclude voided contributions and contributions to an archived effort
const ACTIVE_LEDGER = `and le.archived_at is null and not exists (select 1 from projects pr where pr.pot_id=le.pot_id and pr.archived_at is not null)`;

// Contributions (money in) grouped by the donor's lineage ancestor at a chosen
// level — Mataqali / Tokatoka / Vuvale. Walks contributor_vuvale_id up the tree.
app.get("/api/contributions", async (req, res) => {
  const level = ['mataqali', 'tokatoka', 'vuvale'].includes(req.query.level) ? req.query.level : 'mataqali';
  const params = [level];
  const scope = projectScope(req, params);
  const rows = await q(`with recursive up as (
      select le.id le_id, le.amount_cents, sn.id node_id, sn.level::text lvl, sn.label, sn.parent_id
      from ledger_entries le join scope_nodes sn on sn.id=le.contributor_vuvale_id
      where le.direction='in' ${ACTIVE_LEDGER} ${scope}
      union all
      select up.le_id, up.amount_cents, p.id, p.level::text, p.label, p.parent_id
      from up join scope_nodes p on p.id=up.parent_id
    )
    select label, sum(amount_cents)::bigint total
    from up where lvl=$1 group by node_id, label order by total desc`, params);
  res.json(rows.map(r => ({ label: r.label, total: n(r.total) })));
});

// Individual contributions with the donor's ancestor body at the chosen level.
app.get("/api/contributions-detail", async (req, res) => {
  const level = ['mataqali', 'tokatoka', 'vuvale'].includes(req.query.level) ? req.query.level : 'mataqali';
  const params = [level];
  const scope = projectScope(req, params);
  const rows = await q(`with recursive up as (
      select le.id le_id, le.amount_cents, le.contributor_name, le.created_at,
             sn.level::text lvl, sn.label, sn.parent_id
      from ledger_entries le join scope_nodes sn on sn.id=le.contributor_vuvale_id
      where le.direction='in' ${ACTIVE_LEDGER} ${scope}
      union all
      select up.le_id, up.amount_cents, up.contributor_name, up.created_at, p.level::text, p.label, p.parent_id
      from up join scope_nodes p on p.id=up.parent_id
    )
    select le_id id, to_char(created_at,'YYYY-MM-DD') date, contributor_name name, label body, amount_cents amount
    from up where lvl=$1 order by created_at desc, amount_cents desc`, params);
  res.json(rows);
});

app.get("/api/financials", async (req, res) => {
  // all body pots in the village's world (village + its soqosoqo + mataqali), tagged with level
  // so the Funds tab can be filtered by Yasana/Tikina/Koro/Soqosoqo/Mataqali like the other tabs.
  const rows = await q(`select po.purpose, sn.level, sn.label body, sn.id body_id,
      coalesce(sum(le.amount_cents) filter (where le.direction='in'),0)::bigint tin,
      coalesce(sum(le.amount_cents) filter (where le.direction='out'),0)::bigint tout
    from pots po
    join scope_nodes sn on sn.id=po.owner_body_node_id
    left join ledger_entries le on le.pot_id=po.id and le.archived_at is null
    where sn.archived_at is null
      and not exists (select 1 from projects pr where pr.pot_id=po.id and pr.archived_at is not null)
    group by po.id, po.purpose, sn.level, sn.label, sn.id order by po.purpose`);
  res.json(rows.map(r => ({ purpose: r.purpose, level: r.level, body: r.body, body_id: r.body_id, tin: n(r.tin), tout: n(r.tout) })));
});

app.get("/api/minutes", async (req, res) => {
  const rows = await q(`select m.id, m.title, to_char(m.meeting_date,'YYYY-MM-DD') d, sn.level, sn.label, sn.id body_id,
      coalesce(json_agg(json_build_object('ref', r.ref_label, 'summary', r.summary, 'status', r.status) order by r.ref_label)
               filter (where r.id is not null), '[]') resolutions
    from minutes m join scope_nodes sn on sn.id=m.classification_node_id
    left join resolutions r on r.minutes_id=m.id group by m.id, sn.level, sn.label, sn.id order by m.meeting_date desc`);
  res.json(rows);
});

// Trade: seller listings (members post), buyer directory, key contacts.
app.get("/api/trade-listings", async (req, res) => {
  res.json(await q(`select t.id, t.group_id, t.seller, t.produce, t.qty_kg, t.created_by, t.mobile,
      to_char(t.available_from,'YYYY-MM-DD') available_from, to_char(t.available_to,'YYYY-MM-DD') available_to
    from trade_listings t join villages v on v.id=t.village_id where v.name=$1
    order by t.created_at desc, t.id`, [VILLAGE]));
});
app.post("/api/trade-listings", async (req, res) => {
  const b = req.body || {};
  // one posting = one group; accepts items:[{produce, qty_kg}] or a legacy single produce/qty_kg
  const items = (Array.isArray(b.items) ? b.items : [{ produce: b.produce, qty_kg: b.qty_kg }])
    .map(it => ({ produce: String(it.produce || '').trim().slice(0, 60), qty: Number(it.qty_kg) }))
    .filter(it => it.produce && it.qty > 0);
  if (!items.length) return res.status(400).json({ error: "at least one produce with a quantity (kg) is required" });
  try {
    const actor = await noticeActor(req);
    if (!actor) return res.status(401).json({ error: "sign in to post a listing" });
    // seller is editable (posting on behalf of someone without access); defaults to the poster
    const seller = String(b.seller || '').trim().slice(0, 80) || actor.name;
    const [v] = await q(`select id from villages where name=$1`, [VILLAGE]);
    const gid = require("crypto").randomUUID();
    for (const it of items) {
      await q(
        `insert into trade_listings(village_id, group_id, seller, produce, qty_kg, available_from, available_to, mobile, created_by)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [v.id, gid, seller, it.produce, it.qty, b.available_from || null, b.available_to || null, (b.mobile || '').slice(0, 25) || null, actor.id]);
    }
    res.json({ ok: true, group_id: gid, count: items.length });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/trade-listing-groups/:gid", async (req, res) => {
  try {
    const actor = await noticeActor(req);
    if (!actor) return res.status(401).json({ error: "sign in first" });
    const [t] = await q(`select created_by from trade_listings where group_id=$1 limit 1`, [req.params.gid]);
    if (!t) return res.status(404).json({ error: "listing not found" });
    if (!isOfficial(actor) && !(t.created_by && t.created_by === actor.id))
      return res.status(403).json({ error: "you can only remove your own listings" });
    await q(`delete from trade_listings where group_id=$1`, [req.params.gid]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/trade-listings/:id", async (req, res) => {
  try {
    const actor = await noticeActor(req);
    if (!actor) return res.status(401).json({ error: "sign in first" });
    const [t] = await q(`select created_by from trade_listings where id=$1`, [req.params.id]);
    if (!t) return res.status(404).json({ error: "listing not found" });
    if (!isOfficial(actor) && !(t.created_by && t.created_by === actor.id))
      return res.status(403).json({ error: "you can only remove your own listings" });
    await q(`delete from trade_listings where id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get("/api/trade-buyers", async (req, res) => {
  res.json(await q(`select b.id, b.name, b.buys, b.location, b.mobile, b.email
    from trade_buyers b join villages v on v.id=b.village_id where v.name=$1 order by b.sort_order, b.name`, [VILLAGE]));
});
app.get("/api/trade-contacts", async (req, res) => {
  res.json(await q(`select c.id, c.category, c.name, c.detail, c.mobile, c.location
    from trade_contacts c join villages v on v.id=c.village_id where v.name=$1 order by c.sort_order, c.name`, [VILLAGE]));
});

// Resolution action types (DEV-administered list offered by the Action button / future workflow).
app.get("/api/resolution-action-types", async (req, res) => {
  res.json(await q(`select id, label from resolution_action_types order by sort_order, label`));
});
app.post("/api/resolution-action-types", async (req, res) => {
  const label = String((req.body || {}).label || "").trim();
  if (!label) return res.status(400).json({ error: "label required" });
  try {
    const [row] = await q(`insert into resolution_action_types(label, sort_order)
      values($1, coalesce((select max(sort_order) from resolution_action_types),0)+1)
      on conflict (label) do nothing returning id`, [label]);
    res.json({ ok: true, id: row?.id || null });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete("/api/resolution-action-types/:id", async (req, res) => {
  try {
    await q(`delete from resolution_action_types where id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Serve built React app if present (production); dev uses the Vite server with a proxy.
const dist = path.join(__dirname, "web", "dist");
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, "index.html"), err => { if (err) res.status(404).end(); }));

// API_PORT wins over PORT: dev tooling (e.g. the preview launcher) injects PORT
// for the front-end; the API must stay on 3000 to match Vite's /api proxy.
const PORT = process.env.API_PORT || (process.env.npm_lifecycle_event === "dev" ? 3000 : process.env.PORT) || 3000;
app.listen(PORT, () => console.log("VanuaRai API on http://localhost:" + PORT));
