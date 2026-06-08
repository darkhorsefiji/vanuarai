// Seed 5-10 placeholder photos per project (picsum.photos). Re-runnable (clears first).
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  await c.connect();
  const projects = (await c.query("select id, name from projects order by name")).rows;
  await c.query("delete from project_photos");
  let total = 0;
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const count = 5 + (i % 6); // 5..10
    for (let n = 1; n <= count; n++) {
      const seed = p.id.slice(0, 8) + '-' + n;
      const url = `https://picsum.photos/seed/${seed}/640/420`;
      await c.query("insert into project_photos(project_id, image_ref, caption) values($1,$2,$3)",
        [p.id, url, `${p.name} — photo ${n}`]);
      total++;
    }
  }
  console.log(`Seeded ${total} photos across ${projects.length} projects.`);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
