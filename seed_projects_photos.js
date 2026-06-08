// Add topical projects + seed project photos with REAL Pacific/Fiji images from
// Wikimedia Commons (keyless API). Re-runnable. Run: node seed_projects_photos.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Commons search query per project topic (Pacific/Fiji focused)
function query(name) {
  const n = name.toLowerCase();
  if (n.includes("seawall")) return "Fiji coast seawall beach";
  if (n.includes("aquacultur") || n.includes("pond")) return "Fiji fishing fish";
  if (n.includes("sewing")) return "Fiji women Pacific";
  if (n.includes("water")) return "Fiji village water";
  if (n.includes("church")) return "Fiji church";
  if (n.includes("hall")) return "Fiji village meeting";
  if (n.includes("rugby")) return "Fiji rugby";
  if (n.includes("road")) return "Fiji village road";
  if (n.includes("catering") || n.includes("kitchen")) return "Fiji food feast";
  return "Fiji village";
}

async function commons(search, limit) {
  const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(search)}&gsrlimit=${limit}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&iiurlwidth=800&format=json`;
  try {
    const j = await (await fetch(u)).json();
    if (!j.query) return [];
    return Object.values(j.query.pages)
      .map(p => p.imageinfo && p.imageinfo[0])
      .filter(ii => ii && (ii.mime === "image/jpeg" || ii.mime === "image/png") && ii.thumburl)
      .map(ii => ii.thumburl);
  } catch (e) { return []; }
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
    await c.query(`insert into projects(owner_body_node_id,pot_id,name,budget_cents,physical_progress,status)
       values($1,$2,$3,$4,$5,'active')`, [np.owner, pot, np.name, np.budget, np.prog]);
  }

  const general = await commons("Fiji village OR Pacific island village OR Fiji people", 45);
  const projects = (await c.query("select id, name from projects order by name")).rows;
  await c.query("delete from project_photos");
  let total = 0;
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const count = 5 + (i % 6); // 5..10
    let imgs = await commons(query(p.name), count + 8);
    // rotate the general pool per project, pad to count
    const pool = general.slice(i * 3).concat(general.slice(0, i * 3));
    let pi = 0;
    while (imgs.length < count && pi < pool.length) { if (!imgs.includes(pool[pi])) imgs.push(pool[pi]); pi++; }
    imgs = imgs.slice(0, count);
    for (let n = 0; n < imgs.length; n++) {
      await c.query("insert into project_photos(project_id, image_ref, caption) values($1,$2,$3)",
        [p.id, imgs[n], `${p.name} — photo ${n + 1}`]);
      total++;
    }
  }
  console.log(`Projects: ${projects.length}. Seeded ${total} Pacific/Fiji photos from Commons.`);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
