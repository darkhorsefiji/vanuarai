# Domain Glossary

<!-- Terms, aliases, relationships, example dialogue. A glossary, not a spec. -->

## Terms

| Term               | Definition                                                                               | Aliases      |
| ------------------ | ---------------------------------------------------------------------------------------- | ------------ |
| Vanua              | Fiji-wide national apex node; platform-administered root of the traditional hierarchy    |              |
| Yavusa             | Group of related mataqali; highest real multi-village customary node                     |              |
| Mataqali           | Landowning unit that owns land and receives TLTB lease income                            | clan         |
| Tokatoka           | Sub-unit of a mataqali                                                                   | sub-clan     |
| Vuvale             | Family / household                                                                       | family       |
| Turaga ni Koro     | Village headman; government liaison; heads the Village body                              |              |
| Turaga ni Mataqali | Head of a mataqali                                                                       |              |
| Vunivola           | Secretary (per governance body)                                                          | secretary    |
| Dau ni Yau         | Treasurer (per governance body)                                                          | treasurer    |
| Liuliu             | President/leader of a Soqosoqo                                                           |              |
| Soqosoqo           | Functional/interest group (e.g. women's group); cross-cuts lineage hierarchy             |              |
| Governance Body    | A node (Village/Mataqali/Soqosoqo) with offices, minutes, money pool, maker-checker      | body         |
| VKB                | i Vola ni Kawa Bula — official register of native landowners (TLFC)                      |              |
| TLTB               | iTaukei Land Trust Board                                                                 |              |
| TLFC               | iTaukei Lands & Fisheries Commission                                                     |              |
| Tobu               | The record-keeping ledger over a custodial pool; pots-only, give-direct                  | ledger       |
| Pot                | A money pool: body-owned (permanent) or temporary (fundraiser/project)                   |              |
| Plan               | Internet access bundle: data volume + validity window (daily/weekly/fortnightly/monthly) |              |
| Captive Portal     | Walled garden: portal + payment gateways reachable pre-payment over village WiFi         |              |
| Access Grant       | Entitlement bound to device MAC; RADIUS/CoA enforced                                     | grant        |
| Maker-Checker      | Dual-consent governance: maker initiates, checker approves; never self-approve           | dual consent |
| Resolution         | Citable decision from meeting minutes; required for financial disbursements              |              |
| Endorsement        | Two-tier approval: body authorises (resolution) → Village Admin endorses + publishes     |              |
| Scope Node         | Any classifiable/administrable node in the hierarchy tree                                | node         |
| Axis               | Classification dimension: traditional (lineage), government, or soqosoqo                 |              |
| Level              | Position in an axis hierarchy (e.g. mataqali, district)                                  |              |
| Kacikacivaki       | Announcement/notice board; koro = official channel, lewe = community channel             | notices      |
| Outcome Framework  | Results/M&E model: Outcome → Indicator → Measurement → Action → Challenge                | M&E          |
| ISIC Rev.4         | International Standard Industrial Classification used as third classification axis       |              |
| Meda Matata Mada   | The four focus areas forming the Vanua classification axis                               | MMM          |

## Relationships

- A **Village** contains Mataqali, which contain Tokatoka, which contain Vuvale (traditional axis)
- A **Government** hierarchy runs parallel: Provincial Council → District (Tikina) → Village
- **Soqosoqo** cross-cut both axes — a person sits in one lineage branch and zero-or-more Soqosoqo
- Each **Governance Body** has a Head, Vunivola, and Dau ni Yau, owns its own Pot, Minutes, and Maker-Checker
- A **User** becomes a **Member** through registration (approved by Village Admin), placed in a Vuvale
- **Officials** hold named offices in governance bodies; Members have read-only access scoped by lineage
- **Land** is Mataqali business — Mataqali vote + minutes, ratified by Turaga ni Mataqali
- **Projects** and **Fundraisers** are one entity sharing one Pot (money-in view / money-out view)
- **Access Grants** bind a Plan to a device MAC at a village AP; verified via RADIUS
- **Gift-a-Plan**: a pending grant with 20-min expiry, one-time nonce, bound to target MAC

## Example Dialogue

"When a Turaga ni Mataqali wants to allocate land, the Vunivola writes the
minutes citing the resolution, then the Dau ni Yau initiates the
maker-checker approval. Funds are held until the checker co-signs."

"A villager's internet plan expires. They use the zero-rated messaging pass to
send a gift-link via WhatsApp. The payer purchases the plan, the access grant
activates, and RADIUS CoA brings the original device back online."

"The Village Admin endorses a fundraising project after the owning body
passes a resolution. A temporary Tobu pot is created. Contributions from
diaspora (online gateway) and local (on-behalf-of cash) flow into the same
pot, transparently visible to all members."
