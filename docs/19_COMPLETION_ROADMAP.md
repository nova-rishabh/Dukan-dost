# Dukaan Dost completion roadmap

Date: 2026-11-01. Status: draft for owner review; authorizes no new app implementation. Evidence: repository inspection, product-manager review, workflow discovery, and independent account/security and reality checks. Skills: agency-product-manager and agency-workflow-architect, with their required review roles. No competitor claims or adoption figures are assumed.

## What users should get

A shopkeeper can choose English or Hindi/Hinglish, open their own secure shop without developer help, record and correct credit, find customers, see an honest daily dashboard, manage stock quantities, recover access, and recover their data. Munshi explains unfamiliar steps without covering the work. Voice stays optional; every money or stock change is reviewed before it is saved.

## Decisions that change the scope

1. Account model: current code serves one configured shop per deployment. Proposed public product: many owners, each with one independent shop. Multiple shops per owner and staff roles come later. This assumption needs owner confirmation before account architecture is built. If only one shop is wanted, retain protected first-run setup and skip tenant signup work.
2. “Pass to create an account” may mean the operator setup code or the mandatory password. They are different. Proposed public signup removes the operator-code requirement by creating a new isolated shop after verified identity; passwordless signup depends on reliable verification and recovery. Never remove protection from the existing shared shop.
3. Inventory and public signup expand explicit v1 non-goals in docs/01_PRD.md. Amend that PRD and the relevant ADRs with owner approval before implementation. The existing planning-skill waiver was for the previous app plan; this is a new draft for review.
4. Proposed completion target: a reliable pilot for independent shop owners, not GST accounting or an ERP. Inventory tracks physical movements; the credit ledger is not a sales register.

## Gap audit

“Missing” means no corresponding app flow was found in the inspected routes, components and store contract. It does not mean deployment infrastructure has been audited remotely.

| ID | Problem / current evidence | Proposed result | Priority |
|---|---|---|---|
| G01 | No English UI mode. Hardcoded copy, fixed html language (src/app/layout.tsx), Hindi TTS voice selection, Hindi stamp; amount words already have en/hi values. | Persistent language selector visible before login; translate UI, server error hints, confirmation, help, reminders, date labels, read-back and accessibility labels. Speech/input language stays independent. | P1 |
| G02 | Setup code plus required passcode, no public register route; one configured ctx.shopId (src/server/context.ts, server/auth.ts, api/auth/setup). | Separate operator bootstrap from public owner signup, identity verification, shop creation, and onboarding. | P0 architecture / P1 build |
| G03 | LoginClient catches initial /me error but returns loading while me is null, hiding the error. | Visible error/retry for initial login loading; preserve input and avoid accidental retry loops. | P0 |
| G04 | Recovery via fresh WhatsApp OTP exists server-side, but there is no clear Forgot password flow; PasscodePanel still labels current password as expected. | Explicit recovery, fresh reauthentication, understandable fallback when provider unavailable, safe mobile-change flow. | P0/P1 |
| G05 | Stateless 7-day session; password changes do not revoke other sessions (lib/auth.ts, server/auth.ts). | Revoke lost-device sessions and invalidate old sessions on password reset; tenant-scoped authorization tests. | P0 |
| G06 | StockFlag only has itemName/low/resolvedAt (lib/types.ts); no product or movement model. | Product catalog, units, opening quantity, stock in/out, adjustments, returns/reversals and low thresholds. | P1 |
| G07 | Summary is all-time positive customer balances, top three and low flags (lib/ledger.ts getSummary). No period analytics. | Dashboard with outstanding now, credit given and payments recorded in period, recent activity, actionable low stock; drill-down and date range. | P1 |
| G08 | Customer POST supports name/area only; exact name resolves to existing person even with a different requested area (api/customers). No edit/archive endpoints. | Add/edit customer, phone with consent, aliases, distinct same-name people, archive with history preserved, guarded merge. | P1; merge P2 |
| G09 | Existing Entry has confirmedAt but no transaction date or due date. Ledger creation rejects paise fractions. | Decide transaction date/backdating and decimal amounts; no “overdue” until explicit due dates and payment allocation are defined. | P1 exact paise / P2 date expansion |
| G10 | BahiPage displays amount/date but not entry note/source detail or per-entry running balance. No period statement export. | Entry details with source, note, confirmation time, void reason; date/type filters, running balance and printable/shareable statement. | P1 |
| G11 | ReminderSheet requests recipient each time and does not retain it; no owner-facing reminder history. | Optional saved customer number with consent, recipient preview, manual send, recorded send status/history and duplicate-send protection. | P1 |
| G12 | Shop name/UPI supplied at setup; no profile update methods in LedgerStore. | Editable shop profile/UPI with validation, preview and fresh confirmation for payment-destination changes; language and timezone preference. | P1 |
| G13 | No export/import/restore app workflow. Disk persistence is not a tested recovery process. | CSV statements plus versioned owner export, encrypted operator backups and rehearsed restore; preview and validate imports. | P0 backup / P1 export / P2 import |
| G14 | No service worker, offline queue or install flow found. | Installable app first; clear network status. Later support explicit local drafts and queued confirmed writes with conflict resolution and sync status. | P2 |
| G15 | Whole-shop customers/entries loaded for summary and customer requests. No pagination or performance budget. | Server filters/pagination, tested balance queries and data-volume benchmarks before wider rollout. | P1/P2 |
| G16 | Client API fetch has no common timeout/abort. Real owner audit history unavailable; debug route is demo-only. | Bounded requests, retry/cancel states, financial idempotency and reconciliation; owner activity history, private operator diagnostics. | P0/P1 |
| G17 | Render blueprint exists; no healthy deployment, restore, real delivery, native-speaker or real-phone evidence in repo. | Live release checklist with restart persistence, real phone checks, real test deliveries only with explicit recipient authorization. | P0 |
| G18 | No .github CI workflow found; rate limiting/lockout process-local; current CSP allows inline scripts; WhatsApp transport unofficial. | CI running verify; operational monitoring, revocation and abuse controls; official WhatsApp migration with owner credentials. | P0/P1 |
| G19 | Help and Settings now exist but navigation remains sparse; onboarding is a long setup form. | Consistent Dashboard / Khata / Stock / More navigation, guided empty states, skippable onboarding, visible data freshness and support path. | P1 |
| G20 | Money ledger only records credit/payment, not cash sales, purchase costs or expenses. | Label financial summaries accurately; define sales, purchases, expenses, returns and cost model before proposing profit or inventory valuation. | P2/P3 |
| G21 | Erase removes business data but preserves owner login; no account closure or self-service mobile change. | Distinguish data erasure from account closure, require recent authentication, revoke links/sessions, explain backup retention and confirm scope. | P1/P2 |
| G22 | Demo data is one shared store. No isolated visitor workspace. | Keep sample clearly fictional; consider per-visitor demo isolation/reset to avoid visitors changing one another's walkthrough. | P2 |
| G23 | Reminder send verifies ownership and link inclusion but not draft expiry/current balance; send has no idempotency key (api/remind/send). | Reject expired drafts; refresh/reconfirm changed balances; deduplicate sends and expose unknown-delivery status after timeout. | P0 |
| G24 | Real/demo mode is selected from database configuration; generated setup code is outside the Render persistent mount (server/context.ts). | Explicit production mode that fails closed on missing storage, durable one-time bootstrap and startup readiness checks. | P0/P1 |

## Delivery order and exit gates

Estimates are planning ranges in focused engineering days for one engineer/agent workflow including tests, not delivery promises. Provider setup, owner feedback and real-user validation are additional elapsed time. Rishabh owns scope/provider access and pilot acceptance; implementation owner is Codex/developer; Rishabh is final reviewer. No baseline activation/retention is measured yet.

| Phase | Window / effort | Work and new screens | Completion metric and release gate | Dependencies |
|---|---|---|---|---|
| 0: protect the pilot | Next, 3–5 days | G03/G05/G13/G16/G17/G18/G23/G24: login retry, session revocation, safe timeout/idempotency behavior, stale reminder protection, backup/restore rehearsal, CI, live deployment checklist. | verify passes; restore reproduces customers/balances/voids; reset invalidates prior sessions; expired/changed drafts cannot send silently; retries cannot knowingly duplicate sends; failed requests give recovery; live restart retains data. | Deployed URL, operator access; no credentials in chat. |
| 1A: choose language | Next, 2–4 days; can proceed independently | G01: language choice before login and in Settings; translation catalog, localized server errors, amounts, stamp, read-back and reminders. | All app surfaces have reviewed English and Hindi/Hinglish copy; preference survives reload/login; no direction or money changes; keyboard/mobile checks in both modes. | Decide two modes (recommended English + current Hindi/Hinglish); native-speaker review. |
| 1B: open your own shop | Then, 5–9 days for public signup | G02/G04/G05/G21: Register, verify, create shop, recovery, device/security page and onboarding. Server-derived tenant context precedes public signup. | Two independent owners cannot read/write each other's customers, stock, tokens, exports or messages. Duplicate/expired OTP, retries and interrupted signup are covered. Successful verification is required before creation. | Account-model choice; official/reliable verification provider; signup workflow security review. |
| 2: daily operating core | Then, 4–7 days | G07/G08/G09/G10/G11/G12/G19: exact-paise entry/amount-word support before product prices; Dashboard, Customers/Add/Edit, Entry details, statement preview/export, shop profile, reminder history. | Period totals reconcile with ledger fixtures including voids and advance; users can add same-name people safely, correct data and export a matching statement; no revenue/profit fabrication. | Language foundation; tenant context for public product; date semantics agreed. |
| 3: real inventory | Then, 6–10 days | G06: Stock catalog, Add/Edit item, Item history, stock in/out/adjustment confirmation, low-stock list. Optional supplier label only. | Every quantity change has a confirmed auditable movement. Retry doesn't double-count; unknown stock is not zero; unit/decimal/negative/concurrency rules are explicit and tested. | Inventory workflow and migration reviewed; five shopkeeper checks before broad scope. |
| 4: recovery and scale | Then, 4–7 days | G09 (date expansion)/G13/G14/G15/G16/G21/G22: import preview, safe restore, install flow, large-list behavior, account closure; offline drafts before offline writes. | Invalid imports leave data unchanged; repeat imports don't duplicate; backup restore works after migration; offline drafts survive only under agreed privacy/device policy; no unlabelled unsynced data. | Data schemas stabilized; ownership/recovery policy. |
| 5: release evidence | Before wider release, 2–4 engineering days plus pilot time | Live speech evaluation, real mobile/accessibility checks, approved WhatsApp transport, honest launch assets and support runbook. | Five target shopkeepers attempt setup, three entries, customer lookup and one stock movement unaided; record actual outcomes. Zero silent wrong writes and no cross-shop access are hard gates. | Owner recruits participants and authorizes test recipient; final public URL. |

Public-product core including all phases: approximately 26–46 engineering days, plus external waits and pilot time. This is an estimate with low confidence before account/provider and inventory discovery. For one privately deployed shop, omit public tenant signup and re-estimate. Do not compress security/migration/restore gates to meet an arbitrary date.

## Dashboard definitions (decide before chart design)

- Outstanding now = sum of positive current customer balances. Show advances separately; do not net them away invisibly.
- Credit given in period = sum of non-void credit entries in that period; payments recorded = sum of non-void received entries. This is neither total sales nor proof of bank settlement.
- Current data only has confirmedAt. Initially label period figures by recording date; introduce effective transaction date separately if backdating is approved.
- Use shop timezone (initially Asia/Kolkata) and an end-exclusive period. Test midnight/month boundaries and voids; define historical-as-of reports separately from corrected period totals.
- Stock low = measured on-hand below an explicit threshold, or an unresolved manual low note clearly labelled. No invented quantities.
- Overdue, profit, margin, inventory value, cash balance and revenue stay absent until their required data/definitions exist.
- Every card links to the rows explaining it. Include empty/loading/error/stale states; charts must earn their screen space.

## Inventory decisions

- A product is not a StockFlag. Use an auditable movement history with opening/in/out/adjustment/reversal behavior and a derived on-hand quantity.
- Pick supported units first: pieces/packets and kg/litre if needed. Represent quantities as integers in a declared smallest unit, with explicit conversion; no floating-point accumulation or automatic unit guessing.
- Unknown opening quantity remains unknown until the owner provides it. A low-stock voice note never invents an opening quantity.
- Initial stock-out is manual: a payment or credit entry does not identify the goods sold. Link stock and sales only after itemized sales exist.
- Define returns, damaged goods, duplicate product names, unit changes, stocktaking, negative stock, concurrent edits and reversal rules. Never silently overwrite movements.
- Barcode scan, supplier purchase orders, expiry/batches and reorder automation are separate P2/P3 bets after shopkeeper validation.

## Language acceptance checklist

Translate landing, signup/login/recovery, dashboard, customer/entry/stock forms, help/settings, pay-link states, reminders, toasts/errors, form validation and screen-reader labels. Use stable error codes with localized hints. Preserve source sentences and names; never silently translate stored evidence. UI language does not constrain whether the owner speaks Hindi or English. Keep the same arithmetic, direction traps, duplicate safeguards and confirmation behavior in both modes. Choose read-back language explicitly; use visible text if voice is unavailable. Test narrow screens, long labels and reduced motion in both languages.

## Release and measurement

Existing baseline on 2026-11-01: pnpm verify returned VERIFY-PASS (187 unit tests, 48 WhatsApp daemon tests, 34 browser tests). This demonstrates the existing tested scope, not the proposed features or production delivery.

Each phase ships behind a reversible release decision: reviewed design at 390 px and desktop, focused failure tests, full pnpm verify, migration rehearsal on a copied backup, deployment smoke check, then pilot. Financial changes require double-submit, timeout-after-commit, stale data and unauthorized access tests. Retain the previous deploy and a tested migration recovery procedure; app rollback alone is not a database rollback.

Measure setup completion, time to first confirmed entry, correction/void rate, speech fallback rate and inventory task completion without logging raw audio, phone numbers or customer balances in analytics. Collect a baseline in the pilot; targets above are acceptance gates, not claimed real-user outcomes. Any silent wrong write, cross-shop disclosure or failed restore blocks expansion.

## Remaining launch work and deferred scope

- Replace {{APP_URL}} in deliverables after the final URL is verified; fix ad review D10–D14, listen to voice-over and re-render/test outputs. See docs/15_TODO.md. This is a separate media workstream.
- Official WhatsApp migration remains owner-led with provided credentials. Use the manual WhatsApp draft flow when service delivery is unavailable; never introduce automatic reminders by implication.
- Staff roles, multiple shops per owner, billing/GST, full purchases/expenses/profit, automatic reconciliation, loyalty and supplier automation are later scope. Revisit from pilot evidence rather than adding all of them to the first release.
- Next concrete slice: phase 0 and language foundation, with account-model decision in parallel. Approve the roadmap and individual workflow/design drafts before starting new implementation.

Workflow reference: docs/workflows/REGISTRY.md. Signup and inventory have separate draft workflow documents; other planned workflows need detailed contracts before their implementation phase. This is a prioritized completion roadmap, not a claim that every future workflow is build-ready.

## Independent review

Reality-checker review confirmed source findings and requested consistent effort totals, exact-paise before prices, signup proof-based membership creation, lost-response recovery and explicit unknown stock rules. Security review requested browser/purpose-bound verification, durable identity uniqueness, atomic proof claim and recovery as a launch gate. These corrections are incorporated in this roadmap and the two workflow drafts. Status remains Draft; no public-launch certification is implied.
