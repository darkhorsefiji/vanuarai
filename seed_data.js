// Second-wave seed for Bagasau: users/memberships/officers, plans, Soqosoqo,
// minutes+resolutions, projects/fundraisers, pots, contributions, a disbursement,
// and a pending maker-checker approval.  Run once: node seed_data.js
require("dotenv").config({ path: __dirname + "/.env" });
const { Client } = require("pg");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const one = async (sql, p = []) => (await c.query(sql, p)).rows[0];
const all = async (sql, p = []) => (await c.query(sql, p)).rows;

(async () => {
  await c.connect();
  if ((await c.query("select 1 from users limit 1")).rowCount) {
    console.error("Users already exist — aborting to avoid duplicates."); await c.end(); process.exit(1);
  }

  // ---- load existing scope ----
  const village = await one("select id, village_node_id from villages where name='Bagasau'");
  const vid = village.id, govVillage = village.village_node_id;
  const nodes = await all("select id,axis,level,label,parent_id from scope_nodes");
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const mataqalis = nodes.filter(n => n.level === "mataqali").sort((a, b) => a.label.localeCompare(b.label));
  const vuvales = nodes.filter(n => n.level === "vuvale");
  const ancestorAtLevel = (n, lvl) => { let x = n; while (x && byId[x.parent_id]) { x = byId[x.parent_id]; if (x.level === lvl) return x; } return null; };
  const vuvaleByMataqali = {}; // mataqaliId -> [vuvale...]
  for (const v of vuvales) { const m = ancestorAtLevel(v, "mataqali"); if (m) (vuvaleByMataqali[m.id] ??= []).push(v); }

  let tinSeq = 0;
  const mkUser = async (name, email, appAdmin = false) =>
    (await one(`insert into users(google_sub,email,display_name,is_app_admin) values($1,$2,$3,$4) returning id`,
      ["seed:" + email, email, name, appAdmin])).id;
  const mkMembership = async (uid, role, vuvaleId) => {
    const isOff = role === "official";
    return (await one(
      `insert into memberships(user_id,village_id,role,status,vuvale_node_id,full_name_bc,bc_number,bc_country,tin,approved_at)
       values($1,$2,$3,'approved',$4,$5,$6,'Fiji',$7,now()) returning id`,
      [uid, vid, role, vuvaleId, name(uid), "BC-BAG-" + String(++bcSeq).padStart(4, "0"),
       isOff ? "TIN-BAG-" + String(++tinSeq).padStart(3, "0") : null])).id;
  };
  // tiny name cache so membership full_name mirrors the user
  const names = {}; let bcSeq = 0; const name = uid => names[uid];
  const user = async (display, email, appAdmin = false) => { const id = await mkUser(display, email, appAdmin); names[id] = display; return id; };
  const office = (bodyNode, kind, uid, fallback = false) =>
    c.query(`insert into body_offices(body_node_id,office,user_id,is_fallback) values($1,$2,$3,$4)`, [bodyNode, kind, uid, fallback]);

  try {
    await c.query("BEGIN");

    // ---- Soqosoqo bodies ----
    const soqo = [];
    for (const s of [["Soqosoqo Vakamarama (Women)", "wmn"], ["Soqosoqo Tabagone (Youth)", "yth"]]) {
      const id = (await one(
        `insert into scope_nodes(axis,level,label,parent_id,village_id,is_body) values('soqosoqo','soqosoqo',$1,$2,$3,true) returning id`,
        [s[0], govVillage, vid])).id;
      soqo.push({ id, key: s[1], label: s[0] });
    }

    // ---- officers per body ----  bodyOfficers[nodeId] = {head,vunivola,dauniyau,liuliu,admin}
    const bodyOfficers = {};
    const someVuvale = vuvales[0].id;

    // Village body
    const admin = await user("Bagasau Village Administrator", "admin@bagasau.test", false);
    await mkMembership(admin, "official", someVuvale); await office(govVillage, "village_admin", admin);
    const vHead = await user("Turaga ni Koro (Bagasau)", "tnk@bagasau.test");
    await mkMembership(vHead, "official", someVuvale); await office(govVillage, "head", vHead);
    const vSec = await user("Vunivola (Village)", "vunivola.village@bagasau.test");
    await mkMembership(vSec, "official", someVuvale); await office(govVillage, "vunivola", vSec);
    const vTre = await user("Dau ni yau (Village)", "dauniyau.village@bagasau.test");
    await mkMembership(vTre, "official", someVuvale); await office(govVillage, "dauniyau", vTre);
    await office(govVillage, "head", vSec, true); // fallback checker = vunivola (so head can initiate)
    bodyOfficers[govVillage] = { head: vHead, vunivola: vSec, dauniyau: vTre, admin };

    // Mataqali bodies
    for (const m of mataqalis) {
      const vv = (vuvaleByMataqali[m.id] || [{ id: someVuvale }])[0].id;
      const head = await user(`Turaga ni Mataqali ${m.label.replace("Mataqali ", "")}`, `tnm.${m.label.slice(-2)}@bagasau.test`);
      await mkMembership(head, "official", vv); await office(m.id, "head", head);
      const sec = await user(`Vunivola (${m.label})`, `vunivola.${m.label.slice(-2)}@bagasau.test`);
      await mkMembership(sec, "official", vv); await office(m.id, "vunivola", sec);
      const tre = await user(`Dau ni yau (${m.label})`, `dauniyau.${m.label.slice(-2)}@bagasau.test`);
      await mkMembership(tre, "official", vv); await office(m.id, "dauniyau", tre);
      await office(m.id, "head", sec, true);
      bodyOfficers[m.id] = { head, vunivola: sec, dauniyau: tre };
    }

    // Soqosoqo bodies
    for (const s of soqo) {
      const liuliu = await user(`Liuliu (${s.label})`, `liuliu.${s.key}@bagasau.test`);
      await mkMembership(liuliu, "official", someVuvale); await office(s.id, "liuliu", liuliu);
      const sec = await user(`Vunivola (${s.label})`, `vunivola.${s.key}@bagasau.test`);
      await mkMembership(sec, "official", someVuvale); await office(s.id, "vunivola", sec);
      const tre = await user(`Dau ni yau (${s.label})`, `dauniyau.${s.key}@bagasau.test`);
      await mkMembership(tre, "official", someVuvale); await office(s.id, "dauniyau", tre);
      await office(s.id, "liuliu", sec, true);
      bodyOfficers[s.id] = { liuliu, vunivola: sec, dauniyau: tre };
    }

    // ---- ordinary members spread across vuvale ----
    const memberIds = [];
    for (let i = 1; i <= 8; i++) {
      const u = await user(`Bagasau Member ${i}`, `member${i}@bagasau.test`);
      const mem = await mkMembership(u, "member", vuvales[i % vuvales.length].id);
      memberIds.push({ u, mem, vuvale: vuvales[i % vuvales.length].id });
    }

    // ---- plans ----
    const plans = [
      ["Daily", 500, "daily", 200], ["Weekly", 2048, "weekly", 800],
      ["Fortnightly", 4096, "fortnightly", 1500], ["Monthly", 10240, "monthly", 3000],
    ];
    for (const [pn, mb, win, cents] of plans)
      await c.query(`insert into plans(village_id,name,volume_mb,validity,price_cents) values($1,$2,$3,$4,$5)`,
        [vid, pn, mb, win, cents]);

    // ---- minutes + resolutions ----
    const mkMinutes = async (nodeId, title, date, createdBy, resLabel, resSummary) => {
      const m = await one(`insert into minutes(classification_node_id,title,meeting_date,body_text,created_by)
        values($1,$2,$3,$4,$5) returning id`, [nodeId, title, date, "Seed minutes — " + title, createdBy]);
      const r = await one(`insert into resolutions(minutes_id,ref_label,summary) values($1,$2,$3) returning id`,
        [m.id, resLabel, resSummary]);
      return { minutes: m.id, resolution: r.id };
    };
    const quarters = ["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31", "2026-03-31", "2026-06-30"];
    const villageRes = [];
    quarters.forEach; let qi = 0;
    for (const d of quarters) {
      qi++;
      const r = await mkMinutes(govVillage, `Village Meeting — Q${((qi - 1) % 4) + 1} ${d.slice(0, 4)}`, d, vSec,
        `VR-${d.slice(0, 4)}/${((qi - 1) % 4) + 1}`, "Adopted quarterly report and budget.");
      villageRes.push(r);
    }
    const mataqaliRes = {};
    for (const m of mataqalis) {
      const r = await mkMinutes(m.id, `${m.label} Meeting — 2026 Q1`, "2026-03-31", bodyOfficers[m.id].vunivola,
        `MR-${m.label.slice(-2)}-2026/1`, "Approved land allocation and lease matters.");
      mataqaliRes[m.id] = r;
    }

    // ---- projects / fundraisers (one entity, shared pot) ----
    const mkPot = async (ownerNode, purpose, goalCents, custRef) =>
      (await one(`insert into pots(type,owner_body_node_id,purpose,goal_cents,default_disposition,custodial_account_ref)
        values('temporary',$1,$2,$3,'sweep_to_parent',$4) returning id`, [ownerNode, purpose, goalCents, custRef])).id;

    const projDefs = [
      { owner: govVillage, name: "Village Hall Renovation", budget: 2500000, goal: 2500000, prog: 60 },
      { owner: govVillage, name: "Water Supply Upgrade", budget: 1500000, goal: 1500000, prog: 30 },
      { owner: govVillage, name: "Bagasau Church Restoration", budget: 4000000, goal: 4000000, prog: 10 },
      { owner: soqo[0].id, name: "Women's Sewing Centre", budget: 800000, goal: 800000, prog: 75 },
      { owner: soqo[0].id, name: "Catering Equipment Fund", budget: 500000, goal: 500000, prog: 40 },
      { owner: soqo[1].id, name: "Youth Rugby Gear", budget: 300000, goal: 300000, prog: 100, status: "completed" },
      { owner: mataqalis[0].id, name: "Mataqali Farm Access Road", budget: 1200000, goal: 1200000, prog: 20 },
    ];

    const projects = [];
    let cIdx = 0;
    for (const pd of projDefs) {
      const pot = await mkPot(pd.owner, pd.name, pd.goal, "CUST-BAG-" + (projects.length + 1));
      const proj = await one(
        `insert into projects(owner_body_node_id,pot_id,name,budget_cents,physical_progress,status,endorsed_by,endorsed_at)
         values($1,$2,$3,$4,$5,$6,$7,now()) returning id`,
        [pd.owner, pot, pd.name, pd.budget, pd.prog, pd.status || "active", admin]);
      // photos
      for (let k = 1; k <= 2; k++)
        await c.query(`insert into project_photos(project_id,image_ref,caption) values($1,$2,$3)`,
          [proj.id, `media/seed/${proj.id}-${k}.jpg`, `${pd.name} progress photo ${k}`]);
      // 3 contributions per project, attributed to rotating vuvale
      const gws = ["mpaisa", "mycash", "card"];
      let raised = 0;
      for (let k = 0; k < 3; k++) {
        const v = vuvales[(cIdx++) % vuvales.length];
        const amt = 5000 + ((cIdx * 2500) % 45000); // FJD 50–500
        raised += amt;
        await c.query(
          `insert into ledger_entries(pot_id,direction,amount_cents,source,contributor_vuvale_id,gateway,gateway_ref,created_by)
           values($1,'in',$2,'gateway',$3,$4,$5,$6)`,
          [pot, amt, v.id, gws[k % 3], "GW-" + proj.id.slice(0, 8) + "-" + k, admin]);
      }
      projects.push({ ...pd, id: proj.id, pot, raised });
    }

    // ---- one approved disbursement (Village Hall) with ledger 'out' + approval ----
    const hall = projects[0];
    const appr = await one(
      `insert into approvals(action,body_node_id,target_table,target_id,maker_user_id,checker_user_id,resolution_id,
        evidence_ref,payload,status,decided_at,decision_reason)
       values('disbursement',$1,'ledger_entries',null,$2,$3,$4,$5,$6,'approved',now(),'Approved per quarterly resolution') returning id`,
      [govVillage, vTre, vHead, villageRes[4].resolution, "media/seed/receipt-hall.jpg",
       JSON.stringify({ amount_cents: 300000, payee: "BuildCo Fiji" })]);
    await c.query(
      `insert into ledger_entries(pot_id,direction,amount_cents,source,gateway,receipt_ref,resolution_id,approval_id,created_by)
       values($1,'out',300000,'disbursement','mpaisa','media/seed/receipt-hall.jpg',$2,$3,$4)`,
      [hall.pot, villageRes[4].resolution, appr.id, vTre]);

    // ---- one PENDING approval (Water Supply) to populate the maker-checker queue ----
    await c.query(
      `insert into approvals(action,body_node_id,target_table,maker_user_id,checker_user_id,resolution_id,evidence_ref,payload,status)
       values('disbursement',$1,'ledger_entries',$2,$3,$4,$5,$6,'pending')`,
      [govVillage, vTre, vHead, villageRes[5].resolution, "media/seed/quote-water.jpg",
       JSON.stringify({ amount_cents: 150000, payee: "PipeWorks Ltd" })]);

    await c.query("COMMIT");

    // ---- summary ----
    const counts = await all(`select 'users' t,count(*)::int n from users
      union all select 'memberships',count(*) from memberships
      union all select 'body_offices',count(*) from body_offices
      union all select 'soqosoqo',count(*) from scope_nodes where axis='soqosoqo'
      union all select 'plans',count(*) from plans
      union all select 'minutes',count(*) from minutes
      union all select 'resolutions',count(*) from resolutions
      union all select 'projects',count(*) from projects
      union all select 'pots',count(*) from pots
      union all select 'ledger_entries',count(*) from ledger_entries
      union all select 'approvals',count(*) from approvals order by t`);
    console.log("Seed complete:");
    counts.forEach(r => console.log("  " + r.t.padEnd(16) + r.n));
  } catch (e) {
    await c.query("ROLLBACK");
    console.error("Seed failed (rolled back): " + e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})().catch(e => { console.error("Connection error: " + e.message); process.exit(1); });
