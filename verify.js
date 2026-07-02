// Quick read-only check of seeded data. Usage: node verify.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();
  const byLevel = await c.query(
    "select axis, level, count(*)::int n from scope_nodes group by axis, level order by axis, n desc, level"
  );
  console.log("Nodes by axis/level:");
  byLevel.rows.forEach((r) =>
    console.log("  " + r.axis.padEnd(12) + r.level.padEnd(20) + r.n)
  );

  const tree = await c.query(`
    with recursive t as (
      select id, label, parent_id, 0 d from scope_nodes where axis='traditional' and parent_id is null
      union all
      select s.id, s.label, s.parent_id, t.d+1 from scope_nodes s join t on s.parent_id = t.id)
    select d, label from t order by label`);
  console.log("\nTraditional tree (indented):");
  tree.rows.forEach((r) => console.log("  " + "    ".repeat(r.d) + r.label));

  // Only print the data sections if users have been seeded.
  if ((await c.query("select 1 from users limit 1")).rowCount) {
    const plans = await c.query(
      "select name, volume_mb, validity, price_cents from plans order by price_cents"
    );
    console.log("\nPlans:");
    plans.rows.forEach((p) =>
      console.log(
        `  ${p.name.padEnd(12)} ${(p.volume_mb + "MB").padEnd(9)} ${p.validity.padEnd(12)} FJD ${(p.price_cents / 100).toFixed(2)}`
      )
    );

    const proj = await c.query(`
      select p.name, p.physical_progress prog, p.budget_cents,
             coalesce(sum(le.amount_cents) filter (where le.direction='in'),0) raised_in,
             coalesce(sum(le.amount_cents) filter (where le.direction='out'),0) spent_out
      from projects p left join ledger_entries le on le.pot_id = p.pot_id
      group by p.id, p.name, p.physical_progress, p.budget_cents order by p.name`);
    console.log("\nProjects/fundraisers (FJD):");
    proj.rows.forEach((r) =>
      console.log(
        `  ${r.name.padEnd(28)} budget ${(r.budget_cents / 100).toFixed(0).padStart(7)}  raised ${(r.raised_in / 100).toFixed(0).padStart(6)}  spent ${(r.spent_out / 100).toFixed(0).padStart(5)}  ${r.prog}%`
      )
    );

    const appr = await c.query(
      "select action, status, count(*)::int n from approvals group by action,status order by status"
    );
    console.log("\nMaker-checker approvals:");
    appr.rows.forEach((r) =>
      console.log(`  ${r.action.padEnd(14)} ${r.status.padEnd(10)} ${r.n}`)
    );
  }

  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
