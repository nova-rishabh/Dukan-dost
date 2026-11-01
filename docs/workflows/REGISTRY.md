# Workflow discovery registry

Date: 2026-11-01. Current-state source audit; proposed workflows remain Draft, not approved for implementation. Related requirements: docs/19_COMPLETION_ROADMAP.md. Discovery covers app routes, components, store contract/schema, provider clients and Render blueprint; remote infrastructure and package internals were not audited. No scheduled app jobs or background queues were found in src. Configuration references were read without reading secret env values.

## By workflow

| ID | Workflow | Current entry point | Spec/status |
|---|---|---|---|
| W01 | Operator setup, login, logout, OTP, password change | /setup, /login; api/auth/* | Existing ADR-025; enhanced signup/recovery Draft in WORKFLOW-signup.md |
| W02 | Public registration and tenant creation | Missing | Draft, WORKFLOW-signup.md |
| W03 | Voice/sample/typed interpretation and read-back | api/transcribe, interpret, speak | PRD flow A/D and TRD; new language workflow detailed spec Missing (G01) |
| W04 | Customer resolution and creation | api/customers; Parchi | PRD flow B; edit/archive/merge workflow Missing (G08) |
| W05 | Confirm entry, query balances, void | api/entries, entries/[id]/void, summary, customers/[id] | PRD/ledger contract; period reporting and date workflow Missing (G07/G09/G10) |
| W06 | Reminder preview, manual send, public pay view | api/remind, remind/send, pay/[token], wa/status | ADR-025; stale draft/unknown delivery recovery spec Missing (G23), P0 |
| W07 | Low-stock note and resolve | api/stock, stock/[id]/resolve | PRD P0-7; measured inventory Draft, WORKFLOW-inventory.md |
| W08 | Offer poster generation/export | api/poster, shop/poster | PRD P1-2; no inventory quantity changes implied |
| W09 | Retention, erase business data, demo reset | store/retention, api/shop/erase, demo/reset | ADR-024; account closure workflow Missing (G21) |
| W10 | Health, demo diagnostics, service pairing | api/status, debug; service /admin | Handoff/ADR-025; live release/restore runbook Missing (G13/G17) |
| W11 | Language choice and localization | Missing | Roadmap G01; detailed workflow Missing |
| W12 | Backup/export/import/restore | Missing | Roadmap G13; detailed workflow Missing, backup P0 |
| W13 | Offline drafts and synchronization | Missing | Roadmap G14; detailed workflow Missing |

Missing status identifies unbuilt flows or branches requiring a dedicated spec before that phase. Existing PRD/ADRs are references, not a claim of exhaustive failure contracts. Do not mark future workflow implementation approved from this registry.

## By component

| Components | Workflows |
|---|---|
| server/context, auth, http; lib/auth, waAuth; api/auth; LoginClient/SetupClient/PasscodePanel | W01/W02/W10 |
| Assistant/BoloButton/Parchi; lib/interpret, rules, resolve, proposal; provider clients | W03/W04/W05/W07 |
| ShopHome/CustomerView/BahiPage/SummaryStrip; lib/ledger; store/local and sqlite | W04/W05/W07/W09/W12 |
| ReminderSheet/WaPanel; lib/remind, pay, upi, waService; services/wa-userauth | W01/W06/W10 |
| PosterMaker/lib/poster | W08 |
| ShopSettings/DataPanel/store/retention | W09/W11/W12 |
| render.yaml/scripts/verify and test server configs | W10/W12 and all release gates |

## By user journey

| Actor/journey | Workflows and state today |
|---|---|
| Visitor tries fictional shop | W03/W04/W05/W07/W08; open shared demo |
| Owner activates deployment and signs in | W01; protected one-shop bootstrap |
| Independent new shopkeeper signs up | W02; not built |
| Owner records, corrects and collects | W03/W04/W05/W06; confirmation required |
| Owner manages stock quantities | W07; only low notes exist today |
| Owner manages privacy/security | W01/W09; no global session revocation/account closure |
| Customer opens payment link | W06; token states, never settlement proof |
| Operator pairs service, deploys/restores | W10/W12; pairing documented, restore missing |

## By state

| Entity/state | Enter/exit workflows |
|---|---|
| Deployment unconfigured / configured owner | W01 setup; existing owner persists after W09 erase |
| Anonymous / authenticated / expired session | W01; revocable session and signup pending states proposed W02 |
| Proposal unresolved / ready / confirmed / expired | W03/W04/W05/W07 |
| Entry active / voided | W05; void preserves history |
| Customer positive / zero / advance | W05; derived balance, not manual status |
| Low flag active / resolved | W07; measured stock/movement states proposed separately |
| Pay link valid / expired / invalid / balance settled | W06; settled ledger balance is not bank verification |
| Reminder draft / requested / known sent / failed / unknown | W06; persisted pending/unknown/idempotent send lifecycle missing |
| Business data retained / erased | W09; account survives today; backup retention requires W12 policy |

Next required specs: stale reminder and session-recovery/backup phase-0 branches first; locale, customer/profile, reporting and offline contracts before their implementation phases. Each needs failure states, timeout behavior, data effects and acceptance tests. No silent automatic retry of a money write or message send.
