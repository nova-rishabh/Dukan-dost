# Workflow registry

Current as of 2026-11-01. Owner authorized remaining pilot implementation without another approval. Source-aligned overview: docs/25_PILOT_COMPLETION.md. Independent specialists reviewed public demo, import/closure, mobile identity boundaries and manual-money/CSP gates; final verification result is in the handoff/log.

| ID | Workflow | Current implementation/reference |
|---|---|---|
| W01 | Setup/login/recovery/session revocation | api/auth; ADR-027/028; WORKFLOW-owner-security.md |
| W02 | Independent shop signup | api/auth/register; browser/purpose-bound proof; docs/24_SHOP_OPERATIONS.md |
| W03 | Voice/sample/typed interpretation | api/transcribe/interpret/speak; deterministic checks; explicit confirmation |
| W04 | Customer add/edit/aliases/archive | shop/customers; consented phones; distinct same-name records; no automatic merge |
| W05 | Money and history | api/entries; shop/entry exact paise; ledger filters, statements, voids; docs/25_PILOT_COMPLETION.md |
| W06 | Reviewed reminder/pay view/history | remind + remind/send; scoped contact/history; ADR-027; no bank-settlement assertion |
| W07 | Measured inventory and low notes | shop/inventory; opening/in/out/correction/reversal; docs/24_SHOP_OPERATIONS.md |
| W08 | Offer poster export | api/poster; shop/poster |
| W09 | Erasure/closure/mobile change | shop/account; api/shop/erase/close; auth/mobile; WORKFLOW-owner-security.md |
| W10 | Readiness/deploy/restore | api/health; scripts/release-check; docs/20_OPERATIONS.md; external rollout still unverified |
| W11 | Persistent English/Hinglish | LocaleProvider; full confirmation/help/reminder copy; original evidence retained |
| W12 | Business export/import; operator backup | shop/data; WORKFLOW-owner-data.md; encrypted SQLite backup/new-file restore |
| W13 | Install/offline help/local drafts | manifest + static-only worker; WORKFLOW-offline-and-install.md; no automatic financial replay |
| W14 | Private public trial | try/demo start/exit; WORKFLOW-public-trial.md; signed TTL workspace, fictional only |
| W15 | Submission artifacts | submission hub; docs/26_SUBMISSION.md; local artifacts ready, public deployment separate |

Historical draft contracts in WORKFLOW-signup.md/WORKFLOW-inventory.md are superseded by implementation notes. The registries are not authorization to send real messages, fabricate user evidence, or calculate unrecorded profit/overdue values. Staff, merge/backdating/allocation and broader accounting are later domain modules; external release evidence remains open.
