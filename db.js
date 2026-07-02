// VanuaRai DB helper — connect to Neon and apply schema.
// Usage:
//   node db.js test     -> connectivity + server version + PostGIS check
//   node db.js apply    -> run schema.sql inside a transaction
// Reads DATABASE_URL from environment or a local .env file (never committed).
require("dotenv").config({ path: __dirname + "/.env" });
const fs = require("fs");
const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("ERROR: DATABASE_URL not set (env or .env).");
  process.exit(1);
}

const mode = (process.argv[2] || "test").toLowerCase();
// Neon requires TLS; accept its managed cert chain.
const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();
  if (mode === "test") {
    const v = await client.query("select version()");
    console.log("Connected. " + v.rows[0].version);
    const ext = await client.query(
      "select extname from pg_extension order by extname"
    );
    console.log("Extensions: " + ext.rows.map((r) => r.extname).join(", "));
    const t = await client.query(
      "select count(*)::int n from information_schema.tables where table_schema='public'"
    );
    console.log("Public tables: " + t.rows[0].n);
  } else if (mode === "apply") {
    const file = process.argv[3] || __dirname + "/schema.sql";
    const sql = fs.readFileSync(file, "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      const t = await client.query(
        "select count(*)::int n from information_schema.tables where table_schema='public'"
      );
      console.log(
        "Applied " +
          (process.argv[3] || "schema.sql") +
          ". Public tables now: " +
          t.rows[0].n
      );
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("Apply failed (rolled back): " + e.message);
      process.exitCode = 1;
    }
  } else {
    console.error("Unknown mode: " + mode + " (use 'test' or 'apply')");
    process.exitCode = 1;
  }
  await client.end();
})().catch((e) => {
  console.error("Connection error: " + e.message);
  process.exit(1);
});
