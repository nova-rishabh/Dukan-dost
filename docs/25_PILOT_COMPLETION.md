# Remaining pilot work: implementation and research

2026-11-01. Owner instruction: “Implement everything, like all the other steps as well. Research what we can improve and then do it. No need to ask.” This authorizes the remaining pilot workflows and review fixes below. It supersedes requirements for another planning approval. The earlier owner override of modern-web-guidance remains in force.

Shopkeepers can now try a private fictional shop, create their own account, record exact amounts, review stock and customer activity, keep a recoverable business export, and manage their account safely. English and Hinglish stay available throughout. Every financial entry and external reminder still needs human confirmation.

## Research informing the changes

- [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) recommends reauthentication for sensitive actions. We require current password or a recent WhatsApp authentication for import, erasure, UPI changes, mobile changes and closure; mobile changes also verify the new number and revoke old sessions.
- [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) discusses session termination and browser data. Private pages/API responses are not cached by the service worker; account transitions clear opt-in typed drafts across open tabs. Drafts have an account/version scope and expiry.
- [web.dev on PWA assets and data](https://web.dev/learn/pwa/assets-and-data) distinguishes offline assets from application data. The offline fallback caches only a small public static allowlist. A draft is not a confirmed financial write and is never automatically replayed.
- [Next.js nonce CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy) supports fresh request nonces for sensitive dynamic pages. The proxy overwrites incoming nonce headers, removes production inline-script permission, and makes HTML private/no-store. Inline styles remain allowed for the existing design/print components.
- [Gemini troubleshooting guidance](https://ai.google.dev/gemini-api/docs/troubleshooting) recommends bounded backoff for transient errors. The provider now has at most two attempts with short delays/timeouts inside the existing interpretation budget. No financial write or message send is retried automatically.
- [Khatabook's official product site](https://khatabook.com/) describes ledgers and payment reminders. Our product inference is that useful history, portable records and dependable daily flows are higher priorities than adding unsupported profit forecasts. This is not evidence of user demand or a competitive performance claim.

## Implemented pilot workflows

| Roadmap gap | Implementation and acceptance |
|---|---|
| G01–G08 | Previous items 2–7 plus consented customer aliases. Archived customers retain history; interpretation/manual entry exclude them. Public owners have isolated shops and revocable sessions. |
| G09 | `/shop/entry` supports decimal rupee strings converted to exact integer paise, digits and bilingual words, explicit direction and confirmation. Signed manual proposals bind amount/customer/type; tampering and replay are tested. Voice interpretation remains whole-rupee and routes fractional balance collection into the exact-entry form. Backdating/due dates are not inferred from recording timestamps. |
| G10/G15 | `/shop/ledger` provides date/type/customer filters, bounded pages, original evidence, notes, void details and the customer's running balance after each row. Customer API also supports date/type/limit/offset. Existing statements remain printable/exportable. Requests still scan a shop's entries internally; response pagination is not a claim of database-level pagination. |
| G11/G16 | `/shop/activity` shows redacted owner activity and reminder outcomes. A consented saved number may prefill a reminder via an owner-only contact endpoint; recipient edits still require review and never update stored contact implicitly. Unknown delivery is not automatically resent. |
| G12 | Shop name/UPI review now requires fresh owner confirmation for real shops and checks auth version inside the write. UPI ownership/bank settlement are not asserted. |
| G13 | `/shop/data` exports versioned business JSON; import validates relationships, quantities and reversal history, previews counts/money totals in digits/words, requires fresh authentication/phrase, checks a signed content/target fingerprint, remaps IDs and commits atomically. An identical file is deduplicated. Phones/auth credentials/pay tokens are excluded; original entry evidence can contain private business text. Encrypted operator snapshots and restore remain available separately. |
| G14/G19 | Manifest, install affordance when supported, offline status/help, opt-in tab-scoped typed drafts, explicit restore/review, cross-tab clearing, shared shop navigation and `/shop/start` real-state checklist. No private API/page caching and no background financial queue. |
| G17/G18/G24 | `/api/health` performs a storage readiness read without business data. Render health path updated; CI runs verification and retains failure logs. Auth send/login ceilings persist in SQLite, shared by workers using that database. Identity keys are HMAC hashed; arbitrary forwarded headers do not grant quotas. Configurable trusted-proxy hops default to untrusted shared address. No claim of multi-host distributed limiting. |
| G21 | `/shop/account` distinguishes erasure from complete closure. `/shop/account/mobile` requires fresh old-owner authentication and new-number WhatsApp verification. Purpose/browser/shop/version/expiry are checked atomically; numbers are unique, old sessions/proofs revoked. Completed status can be reconciled without replaying the change. Lost-number recovery has no identity bypass. |
| G22 | `/try` works on a real deployment through an explicit private sample workspace: signed cookie, per-visitor store/secret, 30-minute expiry, capacity bound, fictional providers, no real WhatsApp sends. Tampered/expired sample state fails closed instead of falling into a saved real-shop session. |
| G23 | Prior durable reminder reservation/stale-draft protection retained and exercised with the new history/contact flows. |
| Submission | `/submission` provides the eight-slide PDF, final existing 20-second ad, three posts and credits at static app URLs. Deck/posts/QR use the real trial URL. Timed pitch, fallback and evidence worksheet are in docs/26_SUBMISSION.md. |

## Important failure contracts

- Prepared manual entries and import previews do not write money. Failed validation/authorization leaves the ledger unchanged. Confirmation is separate; large manual amounts need another check.
- Import is additive and reviewed, never a silent overwrite. Same-name imported customers remain distinct with new IDs. A changed target requires a fresh preview; failed or replayed imports cannot partially duplicate stock/history.
- Mobile-change proofs cannot be completed by registration or by another browser/shop/session version. A lost result after change is reconciled with the new valid session; otherwise the owner signs in using the new verified number.
- A demo restart/expiry loses fictional changes and requires a fresh sample. It never restores a real owner automatically for pending sample requests. Real login/registration explicitly exits the sample.
- Request interruptions preserve an uncertainty warning. Retry/reload is a read/reconciliation step; neither money nor delivery is retried in the background.
- Error boundaries explain that a preceding confirmed change may already have completed. No stack trace or credential is shown to visitors.

## Measured checks

`pnpm verify` returned **VERIFY-PASS**: 282 unit/fixture tests, 48 WhatsApp service tests, 58 browser tests and 26 asset checks; typecheck, lint, build, design and secret checks passed. New sample/activity/history/closure screens were visually inspected at 390 px. New checks include two-store import/closure/abuse limits, fake-WhatsApp mobile change, proof boundaries, large snapshot validation, exact-paise confirmation, offline privacy, cross-tab drafts, public sample isolation, submission assets, and accessibility/browser flows.

`pnpm exec tsx scripts/benchmark-ledger.ts` used only an in-memory synthetic database: 1,000 fictional customers, 20,000 entries, 20 summary reads. Observed local p50 50.84 ms, p95 62.57 ms, max 72.50 ms; a 20-row customer statement took 1.02 ms. These measurements include local SQLite reads/domain work, not HTTP, production disk, concurrent load or phone rendering. The script is reproducible and never loads the operator's env/database.

## External evidence and later business modules

Implementation is not production evidence. No real WhatsApp recipient, phone pairing, customer interview, native-speaker review, off-host backup schedule or production migration was performed by this change. The owner-led official WhatsApp migration still requires that provider's credentials and number configuration. The local submission links become public after these changes are deployed; no cloud-drive share URL is invented.

Existing roadmap P2/P3 proposals—staff/multiple shops per owner, guarded customer merge, transaction backdating/due-date allocation, itemized cash sales/purchases/expenses, GST/billing, cost-based profit/valuation, loyalty and supplier automation—remain separate business modules. The present ledger does not contain the facts to calculate them. No invented values or automatic collection features are introduced under the broad improvement request.

Before public rollout, verify proxy-hop configuration, run `pnpm exec tsx scripts/release-check.ts <app-url>`, perform an authorized actual-phone receipt check, and keep encrypted backups off the application disk. The read-only release check is availability evidence only.
