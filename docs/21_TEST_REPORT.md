# Verification report — 2026-11-01

Scope: current codex/phase-zero-reliability branch, starting at 9b7963f, with three additional API regression tests. The API Tester skill was applied. Synthetic data only for local app/daemon tests; real ElevenLabs/Gemini calls used the fictional Gupta example. No real WhatsApp message or payment was sent.

## Final results

| Check | Observed result |
|---|---|
| pnpm verify | **VERIFY-PASS** on the final run |
| TypeScript and ESLint | Pass |
| Unit and utterance fixtures | 222 tests in 20 files passed, including the 20 utterance fixtures and their safety gate |
| WhatsApp daemon tests | 48 passed using fake messaging socket |
| Production build | Pass |
| Playwright and axe | 45 passed, including login/recovery, session revocation, owner-confirmed writes, reminder failure paths, mobile language persistence and input preservation |
| Style/secret gates | Pass |
| Asset verification | 25 checks passed |
| pnpm shots using .next-verify | 2 passed: 390 px and 1440 px; landing, shop, customer, pay and sample screens captured |
| Live ElevenLabs TTS → Scribe | Pass: fictional Hindi sentence transcribed to credit_given, amount 500 |
| Live Gemini structured output | Pass: fictional repayment sentence returned payment_received, amount 500 |
| pnpm audit --prod --json | No known reported vulnerabilities in installed production dependencies |
| npm audit --omit=dev --json in services/wa-userauth | No known reported vulnerabilities in installed production dependencies |
| git diff --check | Pass |

The live checks are two smoke scenarios, not a measured clean/noisy speech accuracy study. Gemini took noticeably longer than the local flow; no precise duration was instrumented. The app interpreter has its own six-second fallback boundary; the direct live script does not test that latency target. Dependency advisory results are point-in-time registry results, not a full supply-chain or transport review.

## Added API checks

- All 20 protected endpoint/method combinations return 401 to an anonymous real-shop caller before accepting a write body. This verifies authentication, not future multi-shop authorization (public tenant signup is not built).
- Seven JSON mutation endpoints reject genuinely malformed raw bodies; an oversized interpretation returns 413. The summary remains unchanged.
- A query containing SQL syntax is handled without an error or mutation. SQLite parameterization also remains covered by existing store tests; this browser query is not a full penetration test.
- Forty local summary reads, ten concurrent at a time, all returned 200. Final full-run p95 was **14.7 ms**, maximum **15.5 ms**, including response body read. This is a small seeded local dataset and a smoke burst, not a production capacity/SLA or 10x traffic claim.

An initial new test sent a string through Playwright's JSON helper and received schema error bad_request instead of parser error bad_json. The payload was corrected to raw bytes and the three checks passed in isolation, followed by the final full VERIFY-PASS. No application change was required by this testing pass.

## Visual evidence

Reviewed refreshed mobile shop/pay and desktop landing/customer captures. The locale test also captures the English account preview at 390 px. No new blocking layout issue was observed in these inspected stills. Full-page screenshots capture fixed controls at viewport position and do not replace interactive scrolling or real-device testing.

- docs/screenshots/shop-home-390.png
- docs/screenshots/pay-390.png
- docs/screenshots/landing-1440.png
- docs/screenshots/customer-1440.png
- docs/screenshots/english-login-390.png

## Not certified by this run

- Real WhatsApp pairing, OTP receipt or reminder delivery; the daemon tests use a fake socket. A test recipient must be explicitly authorized before sending.
- Production Render health, persistent-disk behavior, hosted CI execution, off-host backup schedule or production restore. Backup/restore is rehearsed on synthetic SQLite data, including owner and reminder reservation state.
- Bank settlement/real UPI payment, physical Android/iOS mic behavior, native-speaker review, Lighthouse, noisy live audio or target-shopkeeper usability.
- Full English UI, public multi-shop signup/isolation, measured inventory and reporting dashboard: these remain roadmap work, not failing tests of implemented features.
- Exhaustive route coverage percentage, all-browser compatibility, large-dataset/soak/load limits or absence of all security defects. No such claim is made.

Expected non-failing tool warnings remain: experimental node:sqlite, the existing shell-spawn deprecation in verify.ts, and Playwright color-environment warnings. Local automated results are green; production release evidence is still required under docs/20_OPERATIONS.md.
