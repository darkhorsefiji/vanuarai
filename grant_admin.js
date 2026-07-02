// Grant a signed-in Google user the Bagasau Village Administrator role.
// Usage: node grant_admin.js [email]   (defaults to eugenebsingh@gmail.com)
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const email = process.argv[2] || "eugenebsingh@gmail.com";
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();
  const u = (
    await c.query(
      "select id, email, display_name from users where lower(email)=lower($1)",
      [email]
    )
  ).rows[0];
  if (!u) {
    console.error(
      `No user yet for ${email}. Sign in with Google once at http://localhost:5173, then re-run this.`
    );
    await c.end();
    process.exit(1);
  }
  const v = (
    await c.query(
      "select id, village_node_id from villages where name='Bagasau'"
    )
  ).rows[0];
  const vuvale = (
    await c.query(
      "select id from scope_nodes where level='vuvale' order by label limit 1"
    )
  ).rows[0];

  const mem = (
    await c.query(
      "select id from memberships where user_id=$1 and village_id=$2",
      [u.id, v.id]
    )
  ).rows[0];
  if (mem) {
    await c.query(
      "update memberships set role='official', status='approved' where id=$1",
      [mem.id]
    );
  } else {
    await c.query(
      `insert into memberships(user_id,village_id,role,status,vuvale_node_id,full_name_bc,bc_country,approved_at)
      values($1,$2,'official','approved',$3,$4,'Fiji',now())`,
      [u.id, v.id, vuvale.id, u.display_name || "Eugene Singh"]
    );
  }
  const off = (
    await c.query(
      "select id from body_offices where user_id=$1 and body_node_id=$2 and office='village_admin'",
      [u.id, v.village_node_id]
    )
  ).rows[0];
  if (!off)
    await c.query(
      "insert into body_offices(body_node_id,office,user_id) values($1,'village_admin',$2)",
      [v.village_node_id, u.id]
    );

  await c.query("update users set is_app_admin=true where id=$1", [u.id]);
  console.log(
    `Granted ${u.email}: official + Village Administrator (village_admin office) + is_app_admin.`
  );
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
