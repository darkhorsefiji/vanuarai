// Quick read-only check of seeded data. Usage: node verify.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  await c.connect();
  const byLevel = await c.query(
    "select axis, level, count(*)::int n from scope_nodes group by axis, level order by axis, n desc, level");
  console.log("Nodes by axis/level:");
  byLevel.rows.forEach(r => console.log("  " + r.axis.padEnd(12) + r.level.padEnd(20) + r.n));

  const tree = await c.query(`
    with recursive t as (
      select id, label, parent_id, 0 d from scope_nodes where axis='traditional' and parent_id is null
      union all
      select s.id, s.label, s.parent_id, t.d+1 from scope_nodes s join t on s.parent_id = t.id)
    select d, label from t order by label`);
  console.log("\nTraditional tree (indented):");
  tree.rows.forEach(r => console.log("  " + "    ".repeat(r.d) + r.label));

  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
