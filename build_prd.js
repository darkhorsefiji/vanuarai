const fs = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  LevelFormat,
  TabStopType,
  TabStopPosition,
  TableOfContents,
  HeadingLevel,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  PageBreak,
} = require("docx");

const CONTENT_W = 9360; // US Letter, 1" margins
const BLUE = "2E75B6",
  HEADBG = "D5E8F0",
  ALTBG = "F2F7FB";
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = {
  top: cellBorder,
  bottom: cellBorder,
  left: cellBorder,
  right: cellBorder,
};
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function H(text, level) {
  return new Paragraph({ heading: level, children: [new TextRun(text)] });
}
function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })],
  });
}
function bullet(text) {
  return new Paragraph({
    numbering: { reference: "b", level: 0 },
    spacing: { after: 40 },
    children: [new TextRun(text)],
  });
}

function cell(
  text,
  w,
  { headerCell = false, bold = false, shade = null } = {}
) {
  return new TableCell({
    borders,
    width: { size: w, type: WidthType.DXA },
    margins: cellMargins,
    verticalAlign: VerticalAlign.CENTER,
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: text || "", bold: bold || headerCell, size: 20 }),
        ],
      }),
    ],
  });
}

function table(widths, rows) {
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      (r, ri) =>
        new TableRow({
          tableHeader: ri === 0,
          children: r.map((c, ci) =>
            cell(c, widths[ci], {
              headerCell: ri === 0,
              shade: ri === 0 ? HEADBG : ri % 2 === 0 ? ALTBG : null,
            })
          ),
        })
    ),
  });
}

const numbering = {
  config: [
    {
      reference: "b",
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 280 } } },
        },
      ],
    },
  ],
};

const styles = {
  default: { document: { run: { font: "Arial", size: 21 } } },
  paragraphStyles: [
    {
      id: "Title",
      name: "Title",
      basedOn: "Normal",
      next: "Normal",
      run: { size: 56, bold: true, color: BLUE, font: "Arial" },
      paragraph: { spacing: { after: 120 } },
    },
    {
      id: "Heading1",
      name: "Heading 1",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 30, bold: true, color: BLUE, font: "Arial" },
      paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 },
    },
    {
      id: "Heading2",
      name: "Heading 2",
      basedOn: "Normal",
      next: "Normal",
      quickFormat: true,
      run: { size: 24, bold: true, font: "Arial" },
      paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 1 },
    },
  ],
};

// ---- COVER ----
const cover = [
  new Paragraph({ spacing: { before: 2600 }, children: [] }),
  new Paragraph({ style: "Title", children: [new TextRun("VanuaRai")] }),
  new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: "Product Requirements & Design Specification",
        size: 30,
        color: "555555",
      }),
    ],
  }),
  new Paragraph({
    spacing: { after: 600 },
    children: [
      new TextRun({
        text: "Village WiFi & Village Administration platform — Fiji",
        size: 22,
        italics: true,
        color: "777777",
      }),
    ],
  }),
  new Paragraph({
    children: [
      new TextRun({
        text: "Status: Design complete (Q1–Q33 locked) · pre-build",
        size: 22,
        bold: true,
      }),
    ],
  }),
  new Paragraph({
    children: [new TextRun({ text: "Date: 2026-06-05", size: 22 })],
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Owner: Founder, Innov8 Pacific", size: 22 }),
    ],
  }),
  new Paragraph({
    spacing: { before: 400 },
    children: [
      new TextRun({
        text: "Design spec — not legal advice. Items marked ⚠ require Fiji counsel / regulator pre-consultation before build commitment.",
        size: 18,
        italics: true,
        color: "999999",
      }),
    ],
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

// ---- TOC ----
const toc = [
  H("Contents", HeadingLevel.HEADING_1),
  new TableOfContents("Contents", {
    hyperlink: true,
    headingStyleRange: "1-2",
  }),
  new Paragraph({ children: [new PageBreak()] }),
];

const body = [];
const push = (...x) => body.push(...x);

// 1
push(H("1. Executive summary", HeadingLevel.HEADING_1));
push(
  P(
    "VanuaRai is a two-part platform delivered over village WiFi (Ubiquiti/UniFi access points backed by Starlink terminals):"
  )
);
push(
  bullet(
    "Internet Access management — a captive portal that meters and sells internet plans (paid directly via M-PAiSA / MyCash / card), with an “ask a friend to pay” gift flow."
  )
);
push(
  bullet(
    "Village Administration portal — transparent customary record-keeping per village (family/lineage, land, minutes, fundraising, projects, financials, emergency, key contacts), governed by the Fijian social hierarchy."
  )
);
push(
  P(
    "A supporting Tobu ledger handles village/fundraising money as record-keeping over a custodial pool (no stored-value wallets). Go-to-market: one pilot village, built end-to-end, with a two-switch go-live (connectivity + records first; real money once RBF clears)."
  )
);

// 2
push(H("2. System overview", HeadingLevel.HEADING_1));
push(
  table(
    [2300, 2900, 2300, 1860],
    [
      ["Subsystem", "Purpose", "Money rail", "Regulatory gate"],
      [
        "1. Internet Access",
        "Sell / meter connectivity",
        "Direct gateway pay (merchant)",
        "TAF/FCCC telecom licence",
      ],
      [
        "2. Village Admin",
        "Customary record-keeping",
        "Records; money via Tobu",
        "Data-protection self-regime",
      ],
      [
        "3. Tobu ledger",
        "Village / fundraising money",
        "Ledger over custodial account",
        "⚠ RBF (NPS Act 2021)",
      ],
    ]
  )
);
push(
  P(
    "Shared infrastructure: UniFi AP + Starlink + a single unified cloud web app (“Internet” + “Village” sections). The L4 redirect on session expiry lands the user on this app."
  )
);

// 3
push(H("3. Architecture & topology", HeadingLevel.HEADING_1));
push(
  bullet(
    "Pure cloud (Q1): portal + backend behind Starlink; no per-village hardware. Architected so an edge box could be added later."
  )
);
push(
  bullet(
    "“Offline” = no paid plan, link still up (Q2): handled by the captive-portal walled garden (portal, gateways, auth reachable pre-payment). Surviving a Starlink outage is out of scope."
  )
);
push(
  bullet(
    "Village identifier: the UniFi redirect’s AP MAC maps to a village. No extra hardware."
  )
);
push(
  bullet(
    "Enforcement: RADIUS accounting + CoA/Disconnect when a time or volume cap is hit."
  )
);
push(
  bullet(
    "PWA / device-offline rejected (Q25): the captive mini-browser cannot reliably cache; the product is cloud-online only."
  )
);

// 4
push(
  H("4. Subsystem 1 — Internet Access (captive portal)", HeadingLevel.HEADING_1)
);
push(H("4.1 Authentication", HeadingLevel.HEADING_2));
push(
  bullet(
    "Google login (Q3/Q4). No phone/SMS-OTP (villages may lack cellular coverage)."
  )
);
push(
  bullet(
    "OAuth in the captive context (Q5): an “Open in system browser” hop (Google blocks embedded-webview OAuth), plus an email magic-link / portal-native fallback so no device is locked out."
  )
);
push(H("4.2 Plans", HeadingLevel.HEADING_2));
push(
  bullet(
    "Combined volume + validity-window plans (Q8): a data bucket + window (daily / weekly / fortnightly / monthly); whichever runs out first triggers the redirect. Volume is the primary cost lever."
  )
);
push(
  bullet(
    "One device per plan; per-village pricing capability (may launch flat); bucket sizes & prices open."
  )
);
push(
  bullet(
    "Lifecycle (Q9): no rollover; one active plan at a time (buying more tops up the current bucket); a ~90% soft warning; cutoff redirects to the plan menu."
  )
);
push(H("4.3 Payments", HeadingLevel.HEADING_2));
push(
  bullet(
    "Direct, per-purchase via M-PAiSA, MyCash, Credit card, Visa Debit. No personal wallet."
  )
);
push(
  bullet(
    "VanuaRai holds the M-PAiSA & MyCash gateway APIs — checkout runs in-browser over data (no USSD). Payer pays plan cost + provider fee."
  )
);
push(
  bullet(
    "Legally a merchant receiving payment (incl. the gift flow) — not a licensable payment service."
  )
);
push(H("4.4 Ask a friend to pay (gift a plan)", HeadingLevel.HEADING_2));
push(
  bullet(
    "Grant binding (Q7): a server-side pending-grant keyed by a one-time nonce {village/AP, target client MAC, plan, 20-min expiry}. On confirm: CoA-authorize the MAC, or park the entitlement for reconnect. Links are 20-min, one-time, MAC-bound."
  )
);
push(
  bullet(
    "Self-send: the villager sends via native deep-links (WhatsApp / Messenger / Viber) from their own account — VanuaRai pays nothing per message. Enabled by a zero-rated 5 MB messaging pass, context-gated, daily re-grant, granted only when the access account is expired (kills cannibalisation)."
  )
);

// 5
push(
  H("5. Subsystem 2 — Village Administration portal", HeadingLevel.HEADING_1)
);
push(H("5.1 Core abstraction — “governance body”", HeadingLevel.HEADING_2));
push(
  P(
    "The portal is built around one governance-body node repeating at every scope: {a head, a vunivola (secretary), a dau ni yau (treasurer), its own minutes, its own money pool, its own maker-checker}."
  )
);
push(
  table(
    [2400, 2400, 4560],
    [
      ["Body", "Head", "Owns / controls"],
      [
        "Village (one)",
        "Turaga ni Koro",
        "Village treasury, minutes, village-wide projects & fundraising, Emergency & Disaster Mgmt, Govt Liaison",
      ],
      [
        "Mataqali (per unit)",
        "Turaga ni Mataqali",
        "Land, zoning, allocation, rentals, leases, contracts, lease income, Mataqali minutes",
      ],
      [
        "Soqosoqo (per group)",
        "Liuliu",
        "Group projects, fundraising, group funds",
      ],
    ]
  )
);
push(
  P(
    "Land is Mataqali business, not village business: land decisions go by Mataqali vote + Mataqali minutes, ratified by the Turaga ni Mataqali — the Turaga ni Koro is not involved.",
    { italics: true }
  )
);
push(H("5.2 Two orthogonal groupings", HeadingLevel.HEADING_2));
push(
  bullet(
    "Lineage hierarchy (by blood): Vanua → Yavusa → Mataqali → Tokatoka → Vuvale. (“Vanua” = the Fiji-wide/national apex node — see §9.)"
  )
);
push(
  bullet(
    "Soqosoqo (function/interest groups, e.g. Soqosoqo Vakamarama) cut across the lineage hierarchy."
  )
);
push(H("5.3 Three money pools", HeadingLevel.HEADING_2));
push(
  bullet(
    "Village treasury — Treasurer + Turaga ni Koro; visible to all Members."
  )
);
push(bullet("Mataqali lease rentals — TLTB lease income, Mataqali-scoped."));
push(
  bullet(
    "Soqosoqo funds — per-group, from Province/sponsors, run by group officers."
  )
);
push(H("5.4 Enrolment & roles (Q11, Q20b)", HeadingLevel.HEADING_2));
push(
  bullet(
    "Registrant picks Village Member or Village Official; supplies lineage selections + Birth Certificate fields & image (universal)."
  )
);
push(
  bullet(
    "TIN + TIN-card only for Officials / custodial signatories. Village Administrator approves (may consult)."
  )
);
push(H("5.5 Maker-checker (Q11, Q29)", HeadingLevel.HEADING_2));
push(
  P(
    "Dual-consent governs land approvals, disbursements, and wallet dispositions: maker initiates + attaches artifacts + cites a linked Minutes resolution → pending approval to the checker (body head) → action/funds held → approve (execute + audit) or reject-with-reason → reminders + escalation → never auto-approve. No self-approval; a fallback checker lets the head initiate."
  )
);
push(H("5.6 Certificates (Q11)", HeadingLevel.HEADING_2));
push(
  bullet(
    "Birth and Death certificates encrypted at rest; viewable for verification but non-downloadable by anyone (incl. the Admin); post-approval viewable only by Vuvale members."
  )
);
push(H("5.7 Pages", HeadingLevel.HEADING_2));
push(
  table(
    [2100, 7260],
    [
      ["Page", "Summary"],
      [
        "Village Profile",
        "Public landing; aggregate-only (name, hierarchy placement, history, boundary map, photos, highlights).",
      ],
      [
        "Family",
        "2-col: Vanua Hierarchy + Family Composition. Self-service per-Vuvale; VKB/TLFC import later.",
      ],
      [
        "Lands",
        "Parcel/lease listing + map (click row → highlight). Manual GeoJSON capture; “not a legal survey”. Mataqali-scoped.",
      ],
      [
        "Meeting Minutes",
        "Classified by {axis, level, instance}; generic reusable filter.",
      ],
      [
        "Fundraising",
        "Endorsed-project cards; village-wide transparent; online giving (diaspora) + dau ni yau on-behalf-of.",
      ],
      [
        "Projects",
        "Project + fundraiser = one entity, one pot; spent auto-derived; physical + financial progress; photos.",
      ],
      [
        "Financials",
        "Read-only auto-statement from the Tobu ledger + maker-checker manual journals; PDF export.",
      ],
      [
        "Emergency",
        "Online-only, public, no-login. Platform-generic (bilingual) + village-specific. No offline/PWA.",
      ],
      [
        "Key Contacts",
        "Directory + light schedules (text/PDF). Village-maintained.",
      ],
      [
        "Soqosoqo Profile",
        "Public profile + summaries; detailed ledger to members; Admin read-only oversight.",
      ],
    ]
  )
);
push(H("5.8 Classification taxonomy", HeadingLevel.HEADING_2));
push(
  bullet(
    "Traditional axis: Vanua (Fiji-wide apex) → Yavusa → Mataqali → Tokatoka → Vuvale."
  )
);
push(
  bullet("Government axis: Provincial Council → District (Tikina) → Village.")
);
push(
  bullet(
    "Soqosoqo: cross-cutting, merged into the same filter. One reusable filter across Minutes / Fundraising / Projects."
  )
);
push(
  H("5.9 Endorsement (Q22) & supra-village (Q14/Q16)", HeadingLevel.HEADING_2)
);
push(
  bullet(
    "Two-tier endorsement: owning body authorises via a Minutes resolution; Village Admin endorses + creates the Temporary pot + publishes."
  )
);
push(
  bullet(
    "Supra-village records: shared scope-hierarchy (target); interim local-upload until upper nodes onboard; bottom-up rollout."
  )
);

// 6
push(H("6. Access control model", HeadingLevel.HEADING_1));
push(
  P(
    "Ladder: Public (no login, freely accessible) → Member (Google login, approved) → Official (office-holder). Login is only an identity step for member/official content, edits, and Internet payments."
  )
);
push(
  table(
    [4560, 2400, 2400],
    [
      ["Page / content", "Min. tier", "Scope"],
      [
        "Profile · Projects (summary) · Fundraising (totals) · Emergency · Key Contacts · Soqosoqo profile",
        "Public",
        "Village-wide / aggregate",
      ],
      [
        "Vanua Hierarchy — bare structure (no names/positions)",
        "Public",
        "Village-wide",
      ],
      ["Hierarchy office-holder name + position", "Member", "Village-wide"],
      [
        "Projects/Fundraising detail · Meeting Minutes",
        "Member",
        "Minutes: Mataqali/Soqosoqo scoped",
      ],
      ["Family Composition + certs", "Member", "Vuvale-only"],
      ["Financials — Village", "Member", "Village-wide"],
      ["Financials — Mataqali", "Member of Mataqali", "Mataqali-only"],
      ["Financials — Soqosoqo", "Group members (+Admin RO)", "Soqosoqo-only"],
      [
        "Lands (map, parcels, applications)",
        "Member of Mataqali",
        "Mataqali-only",
      ],
      [
        "Lands — Lease/Rental/Contracts · Consultancy Reports",
        "Official",
        "Mataqali-only",
      ],
      ["Internet — buy plans", "Google login + payment", "—"],
    ]
  )
);
push(
  P(
    "Administration: per-village administrator + App-Developer break-glass (audited, time-boxed, never routine)."
  )
);

// 7
push(H("7. Subsystem 3 — Tobu ledger (money)", HeadingLevel.HEADING_1));
push(
  bullet(
    "Pots-only / give-direct (Q20): no personal wallets. Contributors pay directly from their own licensed instrument into the fundraiser/body custodial account. Tobu is a ledger over a custodial pool, not a stored-value issuer."
  )
);
push(
  bullet(
    "Pots: body nodes (Village/Mataqali/Soqosoqo) + Temporary fundraiser/project pots (expiry + reminders + unspent-balance process)."
  )
);
push(
  bullet(
    "Cash-out: maker-checker payout (Dau ni yau + body head, receipts), never anonymous."
  )
);
push(
  bullet(
    "Temporary-pot lifecycle (Q21): freeze on expiry; unspent funds held; moved only via maker-checker citing a Minutes resolution."
  )
);
push(
  bullet(
    "Why pots-only: the personal held-balance wallet is the single feature that would force full RBF e-money licensing. Pots that only receive + disburse plausibly fit the closed-loop merchant-acquiring exemption (⚠ confirm with RBF)."
  )
);

// 8
push(H("8. Cross-cutting", HeadingLevel.HEADING_1));
push(
  bullet(
    "Notifications (Q28): email + login-gated in-portal inbox = free backbone; WhatsApp opt-in, reserved for action-required + reminders. No SMS/push."
  )
);
push(
  bullet(
    "Audit / history (Q30): append-only immutable log; per-record history surfaced at the same access scope as the record; corrections are new entries, never deletions."
  )
);
push(
  bullet(
    "i18n (Q31): English-first; iTaukei phased in later; no Fiji Hindi. User content never auto-translated; iTaukei customary terms stay canonical."
  )
);

// 9
push(H("9. Terminology note — “Vanua”", HeadingLevel.HEADING_1));
push(
  P(
    "In VanuaRai, Vanua = the Fiji-wide / national apex (one platform-owned node where national/generic content lives, e.g. the Emergency first-aid set). The highest real multi-village customary node a village belongs to is the Yavusa."
  )
);

// 10
push(H("10. Compliance & regulatory (Fiji)", HeadingLevel.HEADING_1));
push(
  table(
    [1900, 5360, 2100],
    [
      ["Domain", "Finding", "Action"],
      [
        "Payments — NPS Act 2021 (RBF)",
        "Personal wallets = e-money issuance (licence). Pots-only/give-direct plausibly fits closed-loop merchant-acquiring exemption. Plan payments = merchant (fine).",
        "⚠ RBF pre-licensing consult; pick custodial-account holder",
      ],
      [
        "Data & privacy",
        "No comprehensive Act, but Constitution s24 (privacy + family life), Cybercrime Act 2021, RBF Guideline 4 (if licensed). Cert handling + Vuvale-scoping align.",
        "Self-impose international-standard DP; counsel; read Guideline 4",
      ],
      [
        "Telecom",
        "Reselling Starlink WiFi for money = regulated (Telecommunications Act 2008; TAF + FCCC).",
        "TAF/FCCC consult; Starlink reseller agreement; UniFi type-approval",
      ],
      [
        "iTaukei land/Vanua",
        "iTaukei Lands/Land Trust/Affairs Acts. VanuaRai is a record-keeper, not an authority.",
        "“Not a legal survey” disclaimer; consent; don’t supersede TLTB / VKB",
      ],
      [
        "AML/CFT",
        "Financial Transactions Reporting Act.",
        "AML programme if licensed (TIN/BC KYC collected)",
      ],
    ]
  )
);

// 11
push(H("11. Pilot plan & phasing (Q32–Q33)", HeadingLevel.HEADING_1));
push(
  bullet(
    "Rollout-phased, not feature-phased: pilot ONE village end-to-end — build the full feature set."
  )
);
push(
  bullet(
    "Two-switch go-live: feature-flag the money layer. Pilot starts on connectivity + records (TAF + data regime); Tobu runs record-only until RBF clears, then flip real money on."
  )
);
push(
  bullet(
    "Pilot scope: both classification axes in structure; upper-level records via interim local-upload; dedicated upper-node admin deferred; Vanua apex platform-administered; actively self-administered = the village + its Mataqali/Tokatoka/Soqosoqo. English-only, pots-only Tobu."
  )
);
push(P("Pre-pilot blockers:", { bold: true }));
push(
  bullet(
    "Connectivity switch: TAF/FCCC licence + Starlink reseller agreement + UniFi type-approval."
  )
);
push(
  bullet(
    "Money switch: RBF closed-loop clearance + custodial account + AML/FTR programme."
  )
);
push(bullet("Records: data-protection self-regime + legal counsel."));

// 12
push(H("12. Open items (need 3rd parties / pricing)", HeadingLevel.HEADING_1));
push(
  bullet(
    "RBF e-money path confirmation + custodial-account holder (company vs bank trust vs PSP partner)."
  )
);
push(
  bullet(
    "Map provider (Mapbox / MapLibre vs Google) — shared decision with the Hakwa project."
  )
);
push(
  bullet("Plan bucket sizes & prices (per-village pricing capability built).")
);
push(
  bullet(
    "Starlink reseller agreement; UniFi equipment type-approval; WhatsApp BSP (only if WhatsApp used for platform notifications)."
  )
);
push(
  bullet(
    "API surface mapping is delivered separately (API.md); database schema in schema.sql."
  )
);

// Appendix A
push(H("Appendix A — Glossary (iTaukei terms)", HeadingLevel.HEADING_1));
const glossary = [
  [
    "Vanua",
    "Here, the Fiji-wide/national apex; traditionally a confederation of yavusa.",
  ],
  [
    "Yavusa",
    "Group of related mataqali; highest real multi-village customary node here.",
  ],
  ["Mataqali", "Landowning unit (owns land, receives TLTB lease income)."],
  ["Tokatoka", "Sub-unit of a mataqali."],
  ["Vuvale", "Family / household."],
  [
    "Turaga ni Koro",
    "Village headman (government liaison); heads the Village body.",
  ],
  ["Turaga ni Mataqali", "Head of a mataqali."],
  ["Vunivola", "Secretary (per body)."],
  ["Dau ni yau", "Treasurer (per body)."],
  ["Liuliu", "President (of a Soqosoqo)."],
  [
    "Soqosoqo",
    "Functional/interest group (e.g. Soqosoqo Vakamarama, women’s group).",
  ],
  [
    "VKB / i Vola ni Kawa Bula",
    "Official register of native landowners (TLFC).",
  ],
  [
    "TLTB / TLFC",
    "iTaukei Land Trust Board / iTaukei Lands & Fisheries Commission.",
  ],
];
push(table([2600, 6760], [["Term", "Meaning"], ...glossary]));

// Appendix B
push(H("Appendix B — Decision log", HeadingLevel.HEADING_1));
push(
  P(
    "Q1 cloud topology · Q2 walled-garden offline · Q3 Google identity · Q4 Google login · Q5 OAuth open-in-browser + fallback · Q6 gateway online checkout · Q7 grant binding · Q8 volume+validity plans · Q9 plan lifecycle · Q10 ask-a-friend (superseded → self-send pass) · Q11 enrolment/roles/certs · Q12 Mataqali scoping · Q13 Soqosoqo governance · Q14 shared scope-hierarchy · Q15 free village portal · Q16 upper-node admin deferred · Q17 Lands manual capture · Q18 Family self-service · Q19 Fundraising capture · Q20/20b Tobu pots-only + TIN scope · Q21 temp-pot lifecycle · Q22 endorsement · Q23 project=fundraiser shared pot · Q24 financials report-over-ledger · Q25 Emergency public/no-offline · Q26 Key Contacts · Q27 Village Profile · Q28 notifications · Q29 maker-checker · Q30 audit · Q31 i18n · Q32 rollout pilot · Q33 two-switch go-live.",
    { size: 18 }
  )
);

const doc = new Document({
  styles,
  numbering,
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: BLUE,
                  space: 1,
                },
              },
              children: [
                new TextRun({
                  text: "VanuaRai — PRD & Design Specification",
                  size: 16,
                  color: "888888",
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              tabStops: [
                { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
              ],
              children: [
                new TextRun({
                  text: "Confidential · 2026-06-05",
                  size: 16,
                  color: "888888",
                }),
                new TextRun({ text: "\tPage ", size: 16, color: "888888" }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 16,
                  color: "888888",
                }),
              ],
            }),
          ],
        }),
      },
      children: [...cover, ...toc, ...body],
    },
  ],
});

const OUT = "C:\\Users\\eugen\\projects\\vanuarai\\VanuaRai_PRD.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log("written " + OUT);
});
