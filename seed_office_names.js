// Give office-holder seed users real personal names (they were created with their
// office title as the display name). The office/role is shown separately in the UI.
// Skips the real account (Eugene Singh). Run: node seed_office_names.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const NAMES = [
  "Apaitia Koroidibale",
  "Vasiti Delai",
  "Sefanaia Ravia",
  "Manasa Naivalu",
  "Litia Saukuru",
  "Joeli Naidu",
  "Watisoni Tora",
  "Mereani Tuwai",
  "Pita Vuki",
  "Asenaca Bola",
  "Inoke Tawake",
  "Salote Naivosa",
  "Meli Tuilevu",
  "Ana Vakuru",
  "Josefa Bose",
  "Timoci Rakai",
  "Kelera Vatu",
  "Epeli Naqica",
  "Akanisi Cava",
  "Waisake Dau",
  "Maraia Lewatu",
  "Semi Koroi",
  "Filipe Vodo",
  "Talei Rokobau",
];

(async () => {
  await c.connect();
  const holders = (
    await c.query(
      `select distinct u.id from users u join body_offices bo on bo.user_id=u.id
     where u.display_name <> 'Eugene Singh' order by u.id`
    )
  ).rows;
  let i = 0;
  for (const h of holders) {
    const nm = NAMES[i % NAMES.length];
    i++;
    await c.query(`update users set display_name=$1 where id=$2`, [nm, h.id]);
    await c.query(`update memberships set full_name_bc=$1 where user_id=$2`, [
      nm,
      h.id,
    ]);
  }
  console.log(`renamed ${holders.length} office-holder users`);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
