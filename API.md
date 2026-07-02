# VanuaRai — API Surface (endpoint contracts)

Companion to `schema.sql` and `VanuaRai_PRD.md`. REST/JSON over HTTPS. Versioned under `/v1`.

## Conventions

- **Auth:** Bearer JWT minted after Google OAuth (or email magic-link fallback, Q5). Public endpoints need no token.
- **Access tiers** (PRD §6): 🌐 Public (no login) · 👤 Member · 🛡️ Official · ⚙️ Village Admin · 🔧 Platform.
- **Scope params:** `villageId`, and where relevant `nodeId` (a `scope_nodes` id). Scoping (Mataqali-only, Vuvale-only, etc.) is enforced server-side from the caller's memberships/offices.
- **Money endpoints** (Tobu, contributions, disbursements) are **feature-flagged OFF until RBF clearance** (Q33 first switch).
- Errors: RFC-7807 problem+json. Idempotency-Key header on all POSTs that move money or grant access.

---

## 1. Auth & identity

| Method | Path                       | Tier | Notes                                                                       |
| ------ | -------------------------- | ---- | --------------------------------------------------------------------------- |
| GET    | `/v1/auth/google/start`    | 🌐   | Returns the system-browser OAuth URL (handles the open-in-browser hop, Q5). |
| GET    | `/v1/auth/google/callback` | 🌐   | OAuth code exchange → JWT.                                                  |
| POST   | `/v1/auth/magic-link`      | 🌐   | Email fallback when Google is refused (Q5).                                 |
| GET    | `/v1/me`                   | 👤   | Current user + memberships + offices + language.                            |
| PATCH  | `/v1/me`                   | 👤   | Update `preferred_language`, notification prefs.                            |

## 2. Captive portal / access (Internet subsystem)

| Method | Path                                       | Tier | Notes                                                                                                                 |
| ------ | ------------------------------------------ | ---- | --------------------------------------------------------------------------------------------------------------------- |
| GET    | `/v1/portal/context?ap=<mac>&client=<mac>` | 🌐   | Resolves AP→village; returns village, current grant state, plan menu, expired? flag. Entry point of the L4 redirect.  |
| GET    | `/v1/villages/{id}/plans`                  | 🌐   | Active plans (volume, window, price+fee) for the village (Q8).                                                        |
| POST   | `/v1/plan-payments`                        | 🌐   | Start a plan purchase. Body: `{planId, clientMac, apMac, gateway}`. Returns gateway checkout handle (in-browser, Q6). |
| POST   | `/v1/plan-payments/{id}/confirm`           | 🌐   | Gateway webhook/confirm → creates/activates `access_grant`, issues RADIUS CoA.                                        |
| GET    | `/v1/grants/current?client=<mac>`          | 🌐   | Volume used/remaining, valid_until, status (drives the ~90% interstitial, Q9).                                        |

## 3. Gift-a-plan (ask a friend)

| Method | Path                         | Tier | Notes                                                                                                                                                |
| ------ | ---------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/gift-links`             | 🌐   | Create a pending-grant. Body: `{planId, clientMac, apMac}`. Returns `{nonce, url, expiresAt}` (20-min, one-time, MAC-bound, Q7).                     |
| GET    | `/v1/gift-links/{nonce}`     | 🌐   | Payer view: plan + amount + provider fee.                                                                                                            |
| POST   | `/v1/gift-links/{nonce}/pay` | 🌐   | Payer pays (gateway). On success → grant the **original target MAC** (park if disconnected).                                                         |
| POST   | `/v1/messaging-pass`         | 🌐   | Issue the 5MB zero-rated pass **only if the caller's account is expired** (Q10-superseded). Returns share deep-links (wa.me / fb-messenger / viber). |

## 4. Enrolment & membership

| Method | Path                                             | Tier          | Notes                                                                                                     |
| ------ | ------------------------------------------------ | ------------- | --------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/villages/{id}/registrations`                | 👤            | Submit membership: role, lineage selections, BC fields+image; TIN+image **iff role=official** (Q11/Q20b). |
| GET    | `/v1/villages/{id}/registrations?status=pending` | ⚙️            | Admin review queue.                                                                                       |
| POST   | `/v1/registrations/{id}/approve` · `/reject`     | ⚙️            | Approve (assign vuvale placement) or reject with reason.                                                  |
| GET    | `/v1/registrations/{id}/cert`                    | ⚙️/👤(Vuvale) | Stream cert for **view only, no download**; post-approval Vuvale-scoped (Q11).                            |

## 5. Hierarchy, family, persons

| Method     | Path                                  | Tier             | Notes                                                                |
| ---------- | ------------------------------------- | ---------------- | -------------------------------------------------------------------- |
| GET        | `/v1/villages/{id}/hierarchy`         | 🌐               | **Bare structure only** — units, no names/positions (Q11-clarified). |
| GET        | `/v1/villages/{id}/hierarchy/offices` | 👤               | Office-holder name + position.                                       |
| GET        | `/v1/vuvale/{nodeId}/persons`         | 👤 (Vuvale)      | Family Composition; certs view-only, Vuvale-scoped (Q18).            |
| POST/PATCH | `/v1/vuvale/{nodeId}/persons`         | 👤 (family head) | Self-service maintenance; births/deaths/marriages + cert upload.     |

## 6. Lands (Mataqali-scoped)

| Method     | Path                                          | Tier               | Notes                                                                               |
| ---------- | --------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------- |
| GET        | `/v1/mataqali/{nodeId}/parcels`               | 👤 (that Mataqali) | GeoJSON FeatureCollection (parcels+buildings+boundary) for the map + listing (Q17). |
| POST/PATCH | `/v1/mataqali/{nodeId}/parcels`               | 🛡️                 | Draw/edit GeoJSON, zoning.                                                          |
| GET        | `/v1/parcels/{id}/leases`                     | 🛡️ (Mataqali)      | Lease/rental/contract detail (Official-only, Q12).                                  |
| POST       | `/v1/mataqali/{nodeId}/land-use-applications` | 🛡️                 | Register; allocation needs maker-checker + cited resolution.                        |

## 7. Minutes & resolutions

| Method | Path                               | Tier          | Notes                                                                                            |
| ------ | ---------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/v1/minutes?axis=&level=&nodeId=` | 👤 (scoped)   | Filter by classification across the tree (Q14). Generic filter shared with projects/fundraising. |
| POST   | `/v1/minutes`                      | 🛡️ (vunivola) | Create (native) or **interim upload** (Q14/Q16) with PDF + classification.                       |
| POST   | `/v1/minutes/{id}/resolutions`     | 🛡️            | Add a citable resolution.                                                                        |
| GET    | `/v1/resolutions/{id}`             | 👤            | For maker-checker linked citation.                                                               |

## 8. Projects & fundraising (one entity, shared pot)

| Method | Path                              | Tier                                | Notes                                                                                     |
| ------ | --------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| GET    | `/v1/villages/{id}/projects`      | 🌐 (summary) / 👤 (detail)          | Cards: budget, spent (auto), physical+financial progress (Q23).                           |
| POST   | `/v1/projects`                    | 🛡️                                  | Create draft (owning body).                                                               |
| POST   | `/v1/projects/{id}/endorse`       | ⚙️                                  | Two-tier endorsement: requires linked resolution; creates Temporary pot; publishes (Q22). |
| POST   | `/v1/projects/{id}/photos`        | 🛡️                                  | Progress photo (thumbnail free / full-res on plan, Q15).                                  |
| PATCH  | `/v1/projects/{id}/progress`      | 🛡️                                  | Manual physical milestone %.                                                              |
| GET    | `/v1/projects/{id}/contributions` | 🌐 (totals) / 👤 (by-Vuvale detail) | Rolled up Vuvale→Tokatoka→Mataqali→Yavusa (Q19).                                          |

## 9. Tobu money _(feature-flagged until RBF clearance)_

| Method | Path                                    | Tier          | Notes                                                                                                                        |
| ------ | --------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/pots/{id}/contributions`           | 🌐            | **Give-direct**: pay from own gateway instrument into the fundraiser/body custodial account; auto-attribute to Vuvale (Q20). |
| POST   | `/v1/pots/{id}/contributions/on-behalf` | 🛡️ (dauniyau) | Record cash gift attributed to a person/Vuvale; reconciles when banked (Q19).                                                |
| GET    | `/v1/pots/{id}/ledger`                  | 👤 (scoped)   | Append-only ledger entries.                                                                                                  |
| POST   | `/v1/pots/{id}/disbursements`           | 🛡️ (maker)    | Initiate payout → creates a held `approval` citing a resolution (Q29).                                                       |
| POST   | `/v1/pots/{id}/close`                   | 🛡️            | Temporary pot: freeze + apply disposition via maker-checker (Q21).                                                           |

## 10. Financials (read-over-ledger)

| Method | Path                                       | Tier        | Notes                                                                      |
| ------ | ------------------------------------------ | ----------- | -------------------------------------------------------------------------- |
| GET    | `/v1/bodies/{nodeId}/financials?from=&to=` | 👤 (scoped) | Auto statement: opening→inflows→outflows→closing (Q24).                    |
| POST   | `/v1/bodies/{nodeId}/journals`             | 🛡️          | Manual journal (external/TLTB/in-kind/opening) — maker-checker + evidence. |
| GET    | `/v1/bodies/{nodeId}/financials/export`    | 👤 (scoped) | PDF acquittal report (shared engine; funder reports, Q13/Q24).             |

## 11. Maker-checker

| Method | Path                                     | Tier         | Notes                                                                                |
| ------ | ---------------------------------------- | ------------ | ------------------------------------------------------------------------------------ |
| GET    | `/v1/approvals?status=pending`           | 🛡️ (checker) | Items awaiting my co-sign.                                                           |
| POST   | `/v1/approvals/{id}/approve` · `/reject` | 🛡️ (checker) | Execute or return-with-reason; **maker ≠ checker**, fallback checker honoured (Q29). |

## 12. Notifications

| Method       | Path                          | Tier | Notes                                                                       |
| ------------ | ----------------------------- | ---- | --------------------------------------------------------------------------- |
| GET          | `/v1/notifications`           | 👤   | Login-gated inbox (durable record, Q28).                                    |
| POST         | `/v1/notifications/{id}/read` | 👤   | Mark read.                                                                  |
| _(internal)_ | email + WhatsApp dispatch     | —    | Email always-on; WhatsApp opt-in, reserved for action-required + reminders. |

## 13. Public content

| Method | Path                             | Tier                               | Notes                                                          |
| ------ | -------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| GET    | `/v1/villages/{id}/profile`      | 🌐                                 | Aggregate landing (Q27).                                       |
| GET    | `/v1/villages/{id}/emergency`    | 🌐 (no login)                      | Platform-generic (bilingual) + village-specific, merged (Q25). |
| GET    | `/v1/villages/{id}/key-contacts` | 🌐                                 | Directory + light schedules (Q26).                             |
| GET    | `/v1/villages/{id}/soqosoqo`     | 🌐 (profile/summary) / 👤 (ledger) | Soqosoqo profiles (Q13).                                       |

## 14. Audit / history

| Method | Path                            | Tier                      | Notes                                         |
| ------ | ------------------------------- | ------------------------- | --------------------------------------------- |
| GET    | `/v1/{entityType}/{id}/history` | 👤 (same scope as record) | Per-record change history; append-only (Q30). |

## 15. Platform / admin

| Method | Path                              | Tier | Notes                                                                 |
| ------ | --------------------------------- | ---- | --------------------------------------------------------------------- |
| POST   | `/v1/villages` · `/access-points` | 🔧   | Provision village + AP MAC mapping.                                   |
| POST   | `/v1/emergency-content`           | 🔧   | Manage platform-generic (Vanua/Fiji-wide apex) content.               |
| POST   | `/v1/admin/break-glass`           | 🔧   | Audited, time-boxed access to sensitive data (logged, never routine). |

---

### Build note

Endpoints in §9 and the money parts of §8/§10 ship behind a flag for the pilot's **first switch (connectivity + records)**, enabled on the **second switch** once RBF clears (Q33). RADIUS/CoA integration (§2) backs the access-grant lifecycle; gateway webhooks back §2–§3 and §9.
