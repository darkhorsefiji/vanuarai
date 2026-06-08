// Seed Family Composition (persons) for each Vuvale. Run once: node seed_persons.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const MALE = ["Jone", "Viliame", "Sefanaia", "Inoke", "Manasa", "Eroni", "Peni", "Sakiusa"];
const FEMALE = ["Mere", "Litia", "Asenaca", "Salote", "Maria", "Ana", "Vasiti", "Kelera"];
const SURNAMES = ["Naivalu", "Tabua", "Ravia", "Delai", "Vakanawa", "Saukuru", "Loaloadravu",
  "Matanitobua", "Rokovesa", "Driti", "Bolatagane", "Naqase"];

(async () => {
  await c.connect();
  if ((await c.query("select 1 from persons limit 1")).rowCount) {
    console.error("persons already seeded — aborting."); await c.end(); process.exit(1);
  }
  const vuvales = (await c.query(
    "select id,label from scope_nodes where level='vuvale' order by label")).rows;

  const add = (vid, name, rel, dob, dod) =>
    c.query(`insert into persons(vuvale_node_id,full_name,relationship,date_of_birth,date_of_death,is_deceased)
             values($1,$2,$3,$4,$5,$6)`, [vid, name, rel, dob, dod || null, !!dod]);

  let n = 0;
  for (let i = 0; i < vuvales.length; i++) {
    const v = vuvales[i];
    const sur = SURNAMES[i % SURNAMES.length];
    const m = MALE[i % MALE.length], f = FEMALE[(i + 3) % FEMALE.length];
    const headMale = i % 2 === 0;
    // Head + spouse
    await add(v.id, `${headMale ? m : f} ${sur}`, "Head", `${1976 + (i % 9)}-0${1 + (i % 8)}-12`); n++;
    await add(v.id, `${headMale ? f : m} ${sur}`, "Spouse", `${1979 + (i % 7)}-0${1 + ((i + 2) % 8)}-05`); n++;
    // Children (1-3)
    const kids = 1 + (i % 3);
    for (let k = 0; k < kids; k++) {
      const boy = (i + k) % 2 === 0;
      const nm = boy ? MALE[(i + k + 1) % MALE.length] : FEMALE[(i + k + 2) % FEMALE.length];
      await add(v.id, `${nm} ${sur}`, boy ? "Son" : "Daughter", `${2006 + k * 3 + (i % 3)}-0${1 + (k % 8)}-20`); n++;
    }
    // Occasional deceased elder
    if (i % 3 === 0) {
      await add(v.id, `${MALE[(i + 4) % MALE.length]} ${sur}`, "Elder",
        `${1944 + (i % 10)}-03-09`, `${2018 + (i % 6)}-07-15`); n++;
    }
  }
  console.log(`Seeded ${n} persons across ${vuvales.length} vuvale.`);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
