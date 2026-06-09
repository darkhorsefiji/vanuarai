-- =============================================================================
-- VanuaRai — PostgreSQL schema (Neon-compatible)
-- Source of truth: VanuaRai_PRD.md (decisions Q1–Q33)
-- Conventions: snake_case; UUID PKs; created_at/updated_at on mutable tables;
--   *_ref columns hold object-store keys (encrypted-at-rest blobs: certs, receipts, photos, docs).
-- Requires: pgcrypto (gen_random_uuid), postgis (Lands geometry).
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- A. TENANCY & SCOPE TREE  (governance-body abstraction, dual-axis taxonomy)
-- =============================================================================

-- Every classifiable/administrable node lives here: the Traditional axis
-- (Vanua[Fiji-wide apex]→Yavusa→Mataqali→Tokatoka→Vuvale), the Government axis
-- (Provincial Council→District→Village), and Soqosoqo (cross-cutting groups).
CREATE TYPE scope_axis  AS ENUM ('traditional','government','soqosoqo');
CREATE TYPE scope_level AS ENUM (
  'vanua','yavusa','mataqali','tokatoka','vuvale',   -- traditional
  'provincial_council','district','village',          -- government
  'soqosoqo'                                          -- soqosoqo
);

CREATE TABLE scope_nodes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axis            scope_axis  NOT NULL,
  level           scope_level NOT NULL,
  label           text        NOT NULL,
  parent_id       uuid        REFERENCES scope_nodes(id),
  -- village this node belongs to (NULL for supra-village nodes & the Vanua apex);
  -- the convenience anchor for tenant filtering of village-and-below data.
  village_id      uuid,
  vkb_ref         text,        -- i Vola ni Kawa Bula reference (mataqali/village)
  tin             text,        -- body-level TIN where applicable
  is_body         boolean NOT NULL DEFAULT false,  -- true = a governance body (has offices, pot, minutes)
  is_platform     boolean NOT NULL DEFAULT false,  -- Vanua/Fiji-wide apex = platform-administered
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON scope_nodes(parent_id);
CREATE INDEX ON scope_nodes(village_id);
CREATE INDEX ON scope_nodes(axis, level);

-- The village tenant + its physical access points (AP MAC -> village mapping, Q-village-id).
CREATE TABLE villages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  village_node_id uuid REFERENCES scope_nodes(id),  -- the government-axis 'village' node
  profile_public  boolean NOT NULL DEFAULT true,    -- public landing visible (Q15/Q27: public no-login)
  -- Profile content (public landing — Introduction/Background/Map/How-to-get-there)
  introduction     text,
  background       text,
  latitude         numeric(9,6),
  longitude        numeric(9,6),
  how_to_get_there text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Resources & Participation scoring (per sector, 0-5 endowment + 0-5 participation).
CREATE TABLE village_resources (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id          uuid NOT NULL REFERENCES villages(id),
  sector              text NOT NULL,                 -- Agriculture, Aquaculture, Forestry, Fisheries, Tourism, Commerce, Minerals, Bottling, ...
  resource_score      smallint NOT NULL DEFAULT 0,   -- 0-5 endowment
  participation_score smallint NOT NULL DEFAULT 0,   -- 0-5 level of participation
  notes               text,
  sort_order          int NOT NULL DEFAULT 0
);
CREATE INDEX ON village_resources(village_id);

-- Editable styling (colour + label) per hierarchy level (Admin-configurable).
CREATE TABLE level_styles (
  level       text PRIMARY KEY,   -- matches scope_level values
  label       text NOT NULL,
  color       text NOT NULL,      -- hex
  sort_order  int  NOT NULL DEFAULT 0
);

-- Government contact directory (provincial + divisional officers), shown on the Government page.
CREATE TABLE gov_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id  uuid REFERENCES villages(id),
  title       text NOT NULL,      -- card heading / office
  name        text,
  role        text,
  mobile      text,
  office      text,
  email       text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE scope_nodes ADD CONSTRAINT scope_nodes_village_fk
  FOREIGN KEY (village_id) REFERENCES villages(id);

CREATE TABLE access_points (
  ap_mac          macaddr PRIMARY KEY,
  village_id      uuid NOT NULL REFERENCES villages(id),
  ssid            text,
  label           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- B. IDENTITY, MEMBERSHIP & OFFICES
-- =============================================================================

CREATE TABLE users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub         text UNIQUE,           -- Google OAuth subject (Q3/Q4)
  email              text UNIQUE,           -- also the non-Google magic-link fallback (Q5)
  display_name       text,
  photo_url          text,                  -- Google profile photo (header avatar)
  preferred_language text NOT NULL DEFAULT 'en',  -- en at launch; iTaukei later (Q31)
  is_app_admin       boolean NOT NULL DEFAULT false, -- platform/App-Developer (break-glass, audited)
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE member_role   AS ENUM ('member','official');
CREATE TYPE member_status AS ENUM ('pending','approved','rejected');

-- A user's membership of a village, with lineage placement and KYC artifacts.
CREATE TABLE memberships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id),
  village_id      uuid NOT NULL REFERENCES villages(id),
  role            member_role   NOT NULL,
  status          member_status NOT NULL DEFAULT 'pending',
  vuvale_node_id  uuid REFERENCES scope_nodes(id),   -- lineage placement (and thus up the tree)
  -- Identity / KYC (Q11, Q20b). Certs & TIN images are encrypted blobs by ref.
  full_name_bc    text,     -- name as per Birth Certificate
  bc_number       text,
  bc_country      text,
  bc_image_ref    text,     -- non-downloadable; Vuvale-scoped post-approval (Q11)
  tin             text,     -- officials/custodial signatories ONLY (Q20b)
  tin_image_ref   text,
  approved_by     uuid REFERENCES users(id),
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, village_id)
);
CREATE INDEX ON memberships(village_id, status);
CREATE INDEX ON memberships(vuvale_node_id);

-- Office held in a governance body (per-body roles; head/vunivola/dauniyau/liuliu).
CREATE TYPE office_kind AS ENUM ('head','vunivola','dauniyau','liuliu','village_admin');
CREATE TABLE body_offices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body_node_id  uuid NOT NULL REFERENCES scope_nodes(id),  -- is_body = true
  office        office_kind NOT NULL,
  user_id       uuid NOT NULL REFERENCES users(id),
  is_fallback   boolean NOT NULL DEFAULT false,            -- fallback checker (Q29)
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON body_offices(body_node_id, office);

-- =============================================================================
-- C. INTERNET ACCESS  (plans, payments, sessions, grants, gift-links, passes)
-- =============================================================================

CREATE TYPE validity_window AS ENUM ('daily','weekly','fortnightly','monthly');

CREATE TABLE plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id      uuid REFERENCES villages(id),  -- NULL = global default; per-village pricing capability (Q8)
  name            text NOT NULL,
  volume_mb       integer NOT NULL,              -- data bucket (primary cost lever)
  validity        validity_window NOT NULL,      -- whichever runs out first triggers redirect
  price_cents     integer NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'FJD',
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE pay_gateway AS ENUM ('mpaisa','mycash','card','visa_debit');
CREATE TYPE pay_status  AS ENUM ('initiated','succeeded','failed','refunded');

-- A plan payment (merchant model). payer_user_id NULL = anonymous gift payer (Q7).
CREATE TABLE plan_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         uuid NOT NULL REFERENCES plans(id),
  payer_user_id   uuid REFERENCES users(id),
  gateway         pay_gateway NOT NULL,
  amount_cents    integer NOT NULL,
  fee_cents       integer NOT NULL DEFAULT 0,   -- passed to payer (plan + provider fee)
  status          pay_status  NOT NULL DEFAULT 'initiated',
  gateway_ref     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TYPE grant_status AS ENUM ('active','expired','parked','revoked');

-- An access entitlement bound to a device MAC at a village (RADIUS/CoA enforced).
CREATE TABLE access_grants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id      uuid NOT NULL REFERENCES villages(id),
  ap_mac          macaddr REFERENCES access_points(ap_mac),
  client_mac      macaddr NOT NULL,
  plan_id         uuid NOT NULL REFERENCES plans(id),
  payment_id      uuid REFERENCES plan_payments(id),
  volume_quota_mb integer NOT NULL,
  volume_used_mb  integer NOT NULL DEFAULT 0,
  valid_from      timestamptz,
  valid_until     timestamptz,
  status          grant_status NOT NULL DEFAULT 'parked', -- parked until device reconnects (Q7)
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON access_grants(client_mac, status);
CREATE INDEX ON access_grants(village_id, status);

-- One-time, MAC-bound, 20-min gift link (Q7).
CREATE TABLE pending_grants (
  nonce            text PRIMARY KEY,
  village_id       uuid NOT NULL REFERENCES villages(id),
  ap_mac           macaddr,
  target_client_mac macaddr NOT NULL,
  plan_id          uuid NOT NULL REFERENCES plans(id),
  status           text NOT NULL DEFAULT 'waiting', -- waiting|paid|expired|consumed
  expires_at       timestamptz NOT NULL,            -- now()+20min
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Zero-rated 5MB messaging pass: only granted when access account is EXPIRED (Q10-superseded).
CREATE TABLE messaging_passes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_mac    macaddr NOT NULL,
  village_id    uuid NOT NULL REFERENCES villages(id),
  bytes_quota   integer NOT NULL DEFAULT 5242880,   -- ~5 MB
  bytes_used    integer NOT NULL DEFAULT 0,
  granted_for   date NOT NULL,                       -- daily re-grant
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_mac, granted_for)
);

-- =============================================================================
-- D. TOBU LEDGER  (pots-only / give-direct; ledger over custodial pool, Q20)
-- =============================================================================

CREATE TYPE pot_type   AS ENUM ('body','temporary');     -- body pool vs fundraiser/project pot
CREATE TYPE pot_status AS ENUM ('active','frozen','closed');

CREATE TABLE pots (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                pot_type NOT NULL,
  owner_body_node_id  uuid NOT NULL REFERENCES scope_nodes(id),  -- owning governance body
  purpose             text,
  goal_cents          integer,
  expiry              date,                  -- temporary pots (Q21)
  default_disposition text,                  -- 'sweep_to_parent' | 'carry_forward' (Q21)
  status              pot_status NOT NULL DEFAULT 'active',
  custodial_account_ref text,                -- the regulated custodial/trust account (Q20)
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON pots(owner_body_node_id);

CREATE TYPE ledger_direction AS ENUM ('in','out');
CREATE TYPE ledger_source    AS ENUM ('gateway','on_behalf_cash','manual_journal','sweep','disbursement');

-- Append-only money ledger. "Financials" page = read-only roll-up of this (Q24).
CREATE TABLE ledger_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pot_id              uuid NOT NULL REFERENCES pots(id),
  direction           ledger_direction NOT NULL,
  amount_cents        integer NOT NULL,
  source              ledger_source NOT NULL,
  -- attribution (contributions): the giving Vuvale/member; on-behalf-of supported (Q19)
  contributor_member_id uuid REFERENCES memberships(id),
  contributor_vuvale_id uuid REFERENCES scope_nodes(id),
  gateway             pay_gateway,
  gateway_ref         text,
  receipt_ref         text,                  -- uploaded receipt/evidence
  resolution_id       uuid,                  -- cited minutes resolution (FK added after minutes)
  approval_id         uuid,                  -- the maker-checker approval that authorised an 'out'
  created_by          uuid REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON ledger_entries(pot_id, created_at);
CREATE INDEX ON ledger_entries(contributor_vuvale_id);

-- =============================================================================
-- E. PROJECTS / FUNDRAISERS  (one entity, one shared pot, Q23)
-- =============================================================================

CREATE TYPE project_status AS ENUM ('draft','endorsed','active','completed','archived');

CREATE TABLE projects (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_body_node_id uuid NOT NULL REFERENCES scope_nodes(id),
  pot_id             uuid REFERENCES pots(id),       -- shared money-in/out pot
  name               text NOT NULL,
  budget_cents       integer,                        -- fixed in authorising resolution
  physical_progress  smallint NOT NULL DEFAULT 0,    -- 0-100, manual milestone (spent auto from ledger)
  status             project_status NOT NULL DEFAULT 'draft',
  start_date         date,
  end_date           date,
  endorsed_by        uuid REFERENCES users(id),      -- Village Admin (Q22)
  endorsed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id),
  image_ref   text NOT NULL,         -- heavy media: thumbnail free / full-res on plan (Q15)
  caption     text,
  taken_on    date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- F. MINUTES & RESOLUTIONS  (classified; interim-upload aware, Q14/Q16)
-- =============================================================================

CREATE TYPE minutes_source AS ENUM ('native','interim_upload');

CREATE TABLE minutes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_node_id uuid NOT NULL REFERENCES scope_nodes(id),  -- {axis,level,instance}
  title               text NOT NULL,
  meeting_date        date,
  body_text           text,
  document_ref        text,                 -- uploaded PDF (esp. interim_upload)
  source              minutes_source NOT NULL DEFAULT 'native',
  created_by          uuid REFERENCES users(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON minutes(classification_node_id, meeting_date);

CREATE TABLE resolutions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minutes_id  uuid NOT NULL REFERENCES minutes(id),
  ref_label   text NOT NULL,           -- e.g. "Res 2026-04/3"
  summary     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- now wire the deferred FK from ledger to resolutions
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_resolution_fk
  FOREIGN KEY (resolution_id) REFERENCES resolutions(id);

-- =============================================================================
-- G. LANDS  (Mataqali-scoped; manual GeoJSON capture, TLTB import later, Q17)
-- =============================================================================

CREATE TABLE parcels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mataqali_node_id uuid NOT NULL REFERENCES scope_nodes(id),  -- owning Mataqali
  label           text,
  zoning          text,
  geom            geometry(Polygon,4326),   -- hand-drawn baseline; "not a legal survey"
  source          text NOT NULL DEFAULT 'manual',  -- manual | tltb_import
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON parcels USING gist (geom);
CREATE INDEX ON parcels(mataqali_node_id);

CREATE TABLE buildings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id   uuid NOT NULL REFERENCES parcels(id),
  label       text,
  geom        geometry(Polygon,4326),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON buildings USING gist (geom);

CREATE TABLE leases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id     uuid NOT NULL REFERENCES parcels(id),
  lessee        text,
  term          text,
  rental_cents  integer,                  -- Mataqali-scoped pool 2 (Q12)
  contract_ref  text,                     -- uploaded contract PDF (Official-only)
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE land_use_applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mataqali_node_id uuid NOT NULL REFERENCES scope_nodes(id),
  applicant       text,
  description     text,
  status          text NOT NULL DEFAULT 'submitted',  -- submitted|approved|rejected (maker-checker)
  resolution_id   uuid REFERENCES resolutions(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- H. FAMILY COMPOSITION  (persons; many are not app users; Vuvale-scoped, Q18)
-- =============================================================================

CREATE TABLE persons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vuvale_node_id  uuid NOT NULL REFERENCES scope_nodes(id),
  full_name       text NOT NULL,
  gender          text,
  date_of_birth   date,
  date_of_death   date,
  is_deceased     boolean NOT NULL DEFAULT false,
  relationship    text,
  birth_cert_ref  text,     -- encrypted, Vuvale-scoped, non-downloadable
  death_cert_ref  text,     -- encrypted, Vuvale-scoped
  linked_user_id  uuid REFERENCES users(id),  -- if this person is also an app user
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON persons(vuvale_node_id);

-- =============================================================================
-- I. MAKER-CHECKER APPROVALS  (dual-consent; never auto-approve, Q29)
-- =============================================================================

CREATE TYPE approval_action AS ENUM
  ('disbursement','land_allocation','wallet_disposition','record_change');
CREATE TYPE approval_status AS ENUM ('pending','approved','rejected');

CREATE TABLE approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action          approval_action NOT NULL,
  body_node_id    uuid NOT NULL REFERENCES scope_nodes(id),
  target_table    text NOT NULL,        -- e.g. 'ledger_entries','land_use_applications'
  target_id       uuid,
  maker_user_id   uuid NOT NULL REFERENCES users(id),
  checker_user_id uuid REFERENCES users(id),   -- assigned checker (head or fallback; maker != checker)
  resolution_id   uuid REFERENCES resolutions(id),   -- linked citation, not free text
  evidence_ref    text,
  payload         jsonb,               -- held action params until approved
  status          approval_status NOT NULL DEFAULT 'pending',
  decided_at      timestamptz,
  decision_reason text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON approvals(checker_user_id, status);
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_approval_fk
  FOREIGN KEY (approval_id) REFERENCES approvals(id);

-- =============================================================================
-- J. NOTIFICATIONS  (inbox backbone + email; WhatsApp opt-in, Q28)
-- =============================================================================

CREATE TABLE notification_prefs (
  user_id        uuid PRIMARY KEY REFERENCES users(id),
  email_enabled  boolean NOT NULL DEFAULT true,
  whatsapp_optin boolean NOT NULL DEFAULT false,
  whatsapp_number text
);

CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id),
  type        text NOT NULL,        -- co_sign_pending | registration_decision | wallet_expiry | fyi
  title       text NOT NULL,
  body        text,
  link        text,
  channels    text[] NOT NULL DEFAULT '{inbox}',  -- inbox|email|whatsapp
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON notifications(user_id, read_at);

-- =============================================================================
-- K. PUBLIC CONTENT  (Emergency, Key Contacts)
-- =============================================================================

-- Emergency: layered platform-generic (scope_node_id = Vanua apis/NULL) + village-specific (Q25).
CREATE TABLE emergency_content (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id    uuid REFERENCES villages(id),  -- NULL = platform-generic, pushed to all
  category      text NOT NULL,                 -- first_aid | disaster_response | evac_centre | contact
  lang          text NOT NULL DEFAULT 'en',    -- bilingual EN/iTaukei for generic
  title         text NOT NULL,
  body          text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE key_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id  uuid NOT NULL REFERENCES villages(id),
  category    text NOT NULL,        -- transport | commerce | logistics
  name        text NOT NULL,
  phone       text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE schedules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id  uuid NOT NULL REFERENCES villages(id),
  kind        text NOT NULL,        -- bus | boat | shipping | produce_buyer
  title       text NOT NULL,
  detail      text,                 -- light: recurring text
  document_ref text,                -- or uploaded PDF/image timetable
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- L. AUDIT LOG  (append-only, immutable; per-record history surfaced by scope, Q30)
-- =============================================================================

CREATE TABLE audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid REFERENCES users(id),
  entity_type   text NOT NULL,
  entity_id     uuid,
  action        text NOT NULL,        -- create|update|disburse|approve|reject
  before_json   jsonb,
  after_json    jsonb,
  resolution_id uuid REFERENCES resolutions(id),
  evidence_ref  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON audit_log(entity_type, entity_id, created_at);
-- Immutability is enforced at the role/grant level: app role has INSERT+SELECT only
-- (no UPDATE/DELETE) on audit_log; corrections are new entries, never edits (Q30).

-- =============================================================================
-- NOTES
-- * Access control (the tier x scope matrix in PRD §6) is enforced in the
--   application/authorization layer using memberships + body_offices + scope_nodes,
--   not in DDL. Public (no-login) reads bypass identity entirely.
-- * Money layer (D, parts of E) is feature-flagged OFF for the pilot's first switch
--   (record-only) until RBF clearance — Q33 two-switch go-live.
-- * Supra-village nodes exist in scope_nodes from day one; only village + its
--   Mataqali/Tokatoka/Soqosoqo are actively administered in the pilot (Q16).
-- =============================================================================
