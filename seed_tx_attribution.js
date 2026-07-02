// Seed maker-checker attribution onto fin_transactions: a treasurer (dauniyau)
// initiates and a head (or liuliu for soqosoqo) approves, within the transaction's
// own entity (axis). Idempotent — re-running just re-assigns. Run: node seed_tx_attribution.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await c.connect();
  const offices = (
    await c.query(
      `select bo.id, bo.user_id, bo.office, sn.axis from body_offices bo
     join scope_nodes sn on sn.id=bo.body_node_id where bo.active=true`
    )
  ).rows;
  const txs = (
    await c.query(
      `select t.id, t.tx_date, sn.axis from fin_transactions t
     left join scope_nodes sn on sn.id=t.classification_node_id order by t.tx_date, t.id`
    )
  ).rows;

  // per-axis pools: initiators (treasurer first), approvers (head/liuliu first)
  const pool = (axis, kinds) => {
    for (const k of kinds) {
      const m = offices.filter((o) => o.axis === axis && o.office === k);
      if (m.length) return m;
    }
    return offices.filter((o) => o.axis === axis);
  };
  const idx = {};
  const pick = (key, list, notUser) => {
    if (!list.length) return null;
    for (let n = 0; n < list.length; n++) {
      const o = list[(idx[key] = (idx[key] ?? -1) + 1) % list.length];
      if (o.user_id !== notUser) return o;
    }
    return list[0];
  };

  let done = 0;
  for (const t of txs) {
    const axis = t.axis || "government";
    const initiator = pick("i:" + axis, pool(axis, ["dauniyau", "vunivola"]));
    const approver = pick(
      "a:" + axis,
      pool(axis, ["head", "liuliu", "vunivola"]),
      initiator?.user_id
    );
    if (!initiator || !approver) continue;
    // initiated a day before the tx date, approved on the day
    await c.query(
      `update fin_transactions set initiator_office_id=$1, approver_office_id=$2,
         initiated_at = ($3::date - interval '1 day' + interval '9 hours'),
         approved_at  = ($3::date + interval '10 hours')
       where id=$4`,
      [initiator.id, approver.id, t.tx_date, t.id]
    );
    done++;
  }
  console.log(`attributed ${done}/${txs.length} transactions`);
  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
