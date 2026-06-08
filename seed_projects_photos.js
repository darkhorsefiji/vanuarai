// Add a couple of topical projects + re-seed project photos with subject-matched
// images (loremflickr keyword search). Re-runnable. Run: node seed_projects_photos.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// single, common keywords work most reliably on loremflickr (combos/niche tags 500)
function keywords(name) {
  const n = name.toLowerCase();
  if (n.includes("seawall")) return "ocean";
  if (n.includes("aquacultur") || n.includes("pond")) return "fish";
  if (n.includes("sewing")) return "sewing";
  if (n.includes("water")) return "water";
  if (n.includes("church")) return "church";
  if (n.includes("hall")) return "building";
  if (n.includes("rugby")) return "rugby";
  if (n.includes("road")) return "road";
  if (n.includes("catering") || n.includes("kitchen")) return "kitchen";
  return "village";
}

(async () => {
  await c.connect();
  const v = (await c.query("select id, village_node_id from villages where name='Bagasau'")).rows[0];
  const mataqali = (await c.query("select id from scope_nodes where level='mataqali' order by label limit 1")).rows[0].id;

  const extra = [
    { name: "Coastal Seawall", owner: v.village_node_id, budget: 1800000, prog: 35 },
    { name: "Aquaculture Ponds", owner: mataqali, budget: 900000, prog: 55 },
  ];
  for (const np of extra) {
    if ((await c.query("select 1 from projects where name=$1", [np.name])).rowCount) continue;
    const pot = (await c.query(
      `insert into pots(type,owner_body_node_id,purpose,goal_cents,default_disposition,custodial_account_ref)
       values('temporary',$1,$2,$3,'sweep_to_parent',$4) returning id`,
      [np.owner, np.name, np.budget, "CUST-BAG-" + np.name.slice(0, 4)])).rows[0].id;
    await c.query(
      `insert into projects(owner_body_node_id,pot_id,name,budget_cents,physical_progress,status)
       values($1,$2,$3,$4,$5,'active')`, [np.owner, pot, np.name, np.budget, np.prog]);
  }

  const projects = (await c.query("select id, name from projects order by name")).rows;
  await c.query("delete from project_photos");
  let total = 0;
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const count = 5 + (i % 6); // 5..10
    const k = keywords(p.name);
    for (let n = 1; n <= count; n++) {
      const url = `https://loremflickr.com/640/420/${k}?lock=${n}`;
      await c.query("insert into project_photos(project_id, image_ref, caption) values($1,$2,$3)",
        [p.id, url, `${p.name} — photo ${n}`]);
      total++;
    }
  }
  console.log(`Projects: ${projects.length}. Seeded ${total} topical photos.`);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
