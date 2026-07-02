// Demo seed for the Fundraising view: adds "money-in" contributions
// (ledger_entries, direction='in') to the existing fundraising efforts so the
// cards show progress and the Contributions chart / Contributors table populate.
// Contributions are attributed to Vuvale (donor lineage) so they roll up to
// Tokatoka / Mataqali. Idempotent: re-running clears its own rows first
// (receipt_ref like 'DEMO-%'). Run: node seed_fundraising_demo.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DONORS = [
  "Apaitia Koroidibale",
  "Kesaia Koroidibale",
  "Lino Colaitiniyara",
  "Taia Colaitiniyara",
  "Sela Vakarau",
  "Josefa Rokovono",
  "Mere Tuivaga",
  "Viliame Nainima",
  "Litia Baleirotuma",
  "Ratu Meli Ganilau",
  "Adi Salote Rasova",
  "Peni Ravai",
  "Sereana Vasu",
  "Timoci Bola",
];
const SOURCES = ["gateway", "on_behalf_cash"];
// how funded each effort should look (fraction of its goal)
const TARGET = {
  "Aquaculture Ponds": 0.6,
  "Bagasau Church Restoration": 0.35,
  "Catering Equipment Fund": 0.8,
  "Coastal Seawall": 0.45,
  "Mataqali Farm Access Road": 0.5,
  "Village Hall Renovation": 0.7,
  "Water Supply Upgrade": 0.4,
  "Women's Sewing Centre": 0.65,
  "Youth Rugby Gear": 0.9,
};

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const round10 = (cents) => Math.max(2000, Math.round(cents / 1000) * 1000); // nearest $10, min $20

(async () => {
  await c.connect();
  const vv = (
    await c.query(
      "select id, label from scope_nodes where level='vuvale' and axis='traditional' and archived_at is null"
    )
  ).rows;
  if (!vv.length)
    throw new Error("no vuvale nodes to attribute contributions to");
  const projs = (
    await c.query(
      "select p.name, p.pot_id, po.goal_cents from projects p join pots po on po.id=p.pot_id where p.archived_at is null order by p.name"
    )
  ).rows;

  await c.query(
    "delete from ledger_entries where direction='in' and receipt_ref like 'DEMO-%'"
  );

  let count = 0,
    total = 0;
  for (const p of projs) {
    const goal = Number(p.goal_cents) || 0;
    let remaining = Math.round(goal * (TARGET[p.name] ?? 0.5));
    const nC = rnd(3, 5);
    const parts = [];
    for (let i = 0; i < nC - 1; i++) {
      const part = Math.round(
        (remaining / (nC - i)) * (0.7 + Math.random() * 0.6)
      );
      parts.push(part);
      remaining -= part;
    }
    parts.push(remaining);
    for (const raw of parts) {
      const amt = round10(raw);
      const v = pick(vv);
      const when = new Date(Date.now() - rnd(3, 120) * 86400000);
      await c.query(
        `insert into ledger_entries
           (pot_id, direction, amount_cents, source, contributor_vuvale_id, contributor_name, receipt_ref, created_at)
         values ($1,'in',$2,$3,$4,$5,$6,$7)`,
        [
          p.pot_id,
          amt,
          pick(SOURCES),
          v.id,
          pick(DONORS),
          "DEMO-" + p.name.replace(/[^A-Za-z]/g, "").slice(0, 8),
          when.toISOString(),
        ]
      );
      count++;
      total += amt;
    }
  }
  console.log(
    `Seeded ${count} contributions across ${projs.length} efforts — total $${(total / 100).toLocaleString()}.`
  );
  await c.end();
})().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
