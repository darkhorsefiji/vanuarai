// Seed the pilot village "Bagasau" hierarchy into Neon.
// Run once: node seed.js   (guards against duplicate seeding)
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Vuvale per tokatoka (2–4 range), cycled across the 8 tokatoka:
const VUVALE_COUNTS = [3, 2, 4, 3, 2, 4, 3, 2]; // total 23

(async () => {
  await c.connect();
  const exists = await c.query("select 1 from villages where name=$1", [
    "Bagasau",
  ]);
  if (exists.rowCount) {
    console.error("Bagasau already seeded — aborting to avoid duplicates.");
    await c.end();
    process.exit(1);
  }

  async function node(axis, level, label, parent, opts = {}) {
    const r = await c.query(
      `insert into scope_nodes(axis,level,label,parent_id,village_id,vkb_ref,is_body,is_platform)
       values($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [
        axis,
        level,
        label,
        parent,
        opts.village_id ?? null,
        opts.vkb ?? null,
        opts.is_body ?? false,
        opts.is_platform ?? false,
      ]
    );
    return r.rows[0].id;
  }

  try {
    await c.query("BEGIN");

    // Village tenant
    const vid = (
      await c.query("insert into villages(name) values($1) returning id", [
        "Bagasau",
      ])
    ).rows[0].id;

    // Traditional apex (platform-owned, Fiji-wide)
    const vanua = await node(
      "traditional",
      "vanua",
      "Vanua (Fiji-wide)",
      null,
      { is_platform: true }
    );

    // Government axis: Provincial Council -> District -> Village(Bagasau)
    const prov = await node(
      "government",
      "provincial_council",
      "Province (TBD)",
      null
    );
    const dist = await node(
      "government",
      "district",
      "Tikina / District (TBD)",
      prov
    );
    const govVillage = await node("government", "village", "Bagasau", dist, {
      village_id: vid,
      is_body: true,
    });
    await c.query("update villages set village_node_id=$1 where id=$2", [
      govVillage,
      vid,
    ]);

    // Traditional lineage: 2 Yavusa -> 4 Mataqali -> 8 Tokatoka -> Vuvale
    let tokIdx = 0,
      counts = { yavusa: 0, mataqali: 0, tokatoka: 0, vuvale: 0 };
    for (const yl of ["A", "B"]) {
      const y = await node("traditional", "yavusa", `Yavusa ${yl}`, vanua, {
        village_id: vid,
      });
      counts.yavusa++;
      for (const mi of [1, 2]) {
        const mlabel = `${yl}${mi}`;
        const m = await node(
          "traditional",
          "mataqali",
          `Mataqali ${mlabel}`,
          y,
          { village_id: vid, is_body: true, vkb: `VKB-BAG-${mlabel}` }
        );
        counts.mataqali++;
        for (const tl of ["a", "b"]) {
          const t = await node(
            "traditional",
            "tokatoka",
            `Tokatoka ${mlabel}${tl}`,
            m,
            { village_id: vid }
          );
          counts.tokatoka++;
          const n = VUVALE_COUNTS[tokIdx % VUVALE_COUNTS.length];
          tokIdx++;
          for (let v = 1; v <= n; v++) {
            await node(
              "traditional",
              "vuvale",
              `Vuvale ${mlabel}${tl}-${v}`,
              t,
              { village_id: vid }
            );
            counts.vuvale++;
          }
        }
      }
    }

    await c.query("COMMIT");
    console.log("Seeded Bagasau:");
    console.log(`  Yavusa:   ${counts.yavusa}`);
    console.log(`  Mataqali: ${counts.mataqali}`);
    console.log(`  Tokatoka: ${counts.tokatoka}`);
    console.log(`  Vuvale:   ${counts.vuvale}`);
  } catch (e) {
    await c.query("ROLLBACK");
    console.error("Seed failed (rolled back): " + e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error("Connection error: " + e.message);
  process.exit(1);
});
