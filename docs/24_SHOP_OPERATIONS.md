# Shop operations implementation

2026-11-01. Owner approved recommendation items 2–7 with “do 2,3,4,5,6,7”. These changes implement that scope on `codex/shop-operations`. This document supersedes the proposed endpoint contracts in the earlier signup/inventory drafts; those drafts remain historical design notes.

## What changed

| Scope | Screens and behavior |
|---|---|
| WhatsApp public accounts | `/signup`, `/recover`, `/login`. Password optional at signup. Browser-bound, purpose-bound verification using existing service; confirmed completion creates one private shop for a normalized mobile. Existing verified identities open their existing shop. Recovery replaces password and revokes old sessions. |
| English | Persistent English/Hinglish choice across existing screens, money words, direction, read-back, confirmation, reminders and pay views. Original names and ledger evidence are preserved. |
| Customers | `/shop/customers`: reviewed add/edit, identifying area, deliberate separate same-name ledgers, consented phone storage, masked lists, archive/restore. Archived accounts retain history and balances; new entries require restoration. |
| Dashboard | `/shop/dashboard`: current outstanding and customer advances separately, period credit/payment totals, recent recorded entries, low-stock thresholds and unknown opening counts. No sales/profit estimate. |
| Inventory | `/shop/inventory`: products, thresholds, archive/restore, explicit opening count, in/out/correction/reversal with review of before/after/reason. Whole pieces; kg/litre use integer grams/millilitres, at most three decimals. No negative stock; movements use versions and idempotency keys. Money entries do not change stock. |
| Statements | `/shop/[id]/statement`: India recorded-date filters, opening/running/period-closing/current balances, void history with zero effect, CSV and browser Print / Save PDF. CSV amounts are integer paise and untrusted formulas are neutralized. |
| Payment setup | Settings includes reviewed shop name and UPI ID. Format is checked; ownership is not verified. New real shops must configure UPI before producing payment drafts. A link is never evidence of bank settlement. |

## Account and data boundaries

- Signed cookies identify the authorized shop. AsyncLocalStorage supplies a separate request context; shared globals are not mutated between requests. Customer, entry, inventory, profile, reminder and export routes use that context.
- `/api/auth/register/start`, `/verify`, `/status`, `/complete` use an HttpOnly registration cookie containing a random browser secret. Only its hash is stored. Verification expires after ten minutes; purpose/mobile come from stored proof, not completion fields.
- Verification attempts are durably capped at five per challenge. Verified completion is atomic and replay-safe; subsequent session revocation invalidates old completion replay. Expired challenges are purged opportunistically during registration traffic. Business erasure revokes pending proofs for the retained owner's mobile.
- SQLite migrations are additive. Normalized mobile uniqueness is enforced; ambiguous legacy duplicate identities fail closed without dropping accounts. Back up the database before deployment; investigate duplicate identities rather than deleting records.
- Existing operator `/setup` still requires its setup code and is available only before the initial owner exists. Public visitors use `/signup`.
- One owner and one shop per verified mobile; no staff roles, phone-number changes, cross-shop switching or lost-number support bypass. Recovery requires access to the registered WhatsApp number.

## Verification and limits

Final full `pnpm verify`: **VERIFY-PASS** — 250 unit/fixture tests, 48 WhatsApp service tests, 51 browser tests and 26 asset checks. Typecheck, lint, production build, design and secret checks passed. New signup, dashboard and statement screens were captured and visually inspected at 390 px; signup also has a serious/critical accessibility assertion. Added tests exercise both stores, additive migration/reopen, real daemon with a fake WhatsApp socket, browser-bound signup, replay/recovery/revocation, concurrent tenant requests, cross-shop customer/stock/export/reminder refusal, measured counts, versions/idempotency/reversal, date boundaries, CSV formulas, English confirmation, and mobile browser workflows.

No real OTP/reminder was sent, and no production database was migrated during this change. The WhatsApp provider remains the previously accepted unofficial service. Browser Save PDF is available; a server-generated PDF attachment is not implemented. Dates describe when entries were recorded, not backdated business dates; voids are excluded using current void state rather than reconstructing a historical audit snapshot.

Rate limits for send requests remain process-local and share a conservative IP bucket on non-Vercel hosts such as Render. Adjust trusted-proxy handling and use a shared limiter before a broad public launch. No production load/capacity, real-user usability or guaranteed judging score is claimed. Public fictional-demo deployment and final pitch/ad work remain separate roadmap items.
