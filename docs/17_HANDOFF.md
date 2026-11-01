# Handoff: read this first if you are an AI agent continuing the work

Written 2026-11-01. It says what exists, how to run it, what is live, what is not verified, and what to do next. Facts here were checked against the repo on that date. When this file and the code disagree, trust the code, then fix this file.

## 1. What this is
Dukaan Dost ("बोलो, लिखो मत।") is a voice or typed udhaar (credit) ledger for Indian shopkeepers. The owner speaks or types a sentence, sees a parchi (confirm card), presses a button, and the ledger is written. Reminders are sent to the customer over WhatsApp only after the owner confirms. Full product intent: `docs/01_PRD.md`. Why each choice was made: `docs/04_DECISIONS.md` (ADR-001 to ADR-025).

Repo: `https://github.com/nova-rishabh/Dukan-dost`, branch `master` (everything is merged and pushed as of this file). The owner is Rishabh. The owner wants short, plain answers and does not want the "vibe coding" look (see section 8).

## 2. Rules that must not break
Product rules and design rules are in `CLAUDE.md` at the repo root. The short version:
1. The model proposes, deterministic code disposes, the human confirms. No model output writes to the database.
2. Every write is confirmed. The card shows the amount in digits and words, and the direction in words.
3. Money is integer paise. No floats.
4. Entries are voided, never deleted.
5. Never invent quantities, customers, payment status or advice. A pay link is never "paid".
6. Reminders go out only after the owner confirms (ADR-025). No automatic sends.
7. Demo data is fictional. No real phone numbers in the repo, logs or screenshots.
8. No keys in code or chat. Secrets come from env.

Two items in `CLAUDE.md` are older than later decisions: rule 6 there says reminders go through `wa.me`; since ADR-025 the app can also send through the WhatsApp service, still owner-confirmed. The `CLAUDE.md` line "run `modern-web-guidance` before any web feature" was overridden by the owner (see section 8).

## 3. Layout
| Path | What |
|---|---|
| `src/app`, `src/components` | Next.js 16 App Router pages, API routes, React 19 UI, Tailwind v4 |
| `src/lib` | domain code: `numbers`, `resolve`, `interpret` (rules first, Gemini fallback), `ledger`, `remind`, `pay`, `auth`, `waService`, `waAuth`, `store/{types,local,sqlite,retention}` |
| `src/server` | request context, session cookie, route wrapper (`http.ts`: auth, origin check, rate limit) |
| `services/wa-userauth` | the vendored WhatsApp service (Express, unofficial `berryprotocol` client). Own `package.json`, own 48 tests. Changes vs the supplied zip: `services/wa-userauth/NOTICE.md` |
| `tests/unit`, `tests/e2e`, `tests/fixtures`, `tests/helpers` | vitest and Playwright (+axe). 20 utterance fixtures in `tests/fixtures/` |
| `scripts` | `verify`, `check-slop`, `check-secrets`, `verify-assets`, `setup-check`, ad and sound scripts |
| `deliverables/{social,deck,ad}` | 3 posts, pitch deck, 30 s HyperFrames vertical ad with ElevenLabs voice-over |
| `render.yaml` | Render Blueprint for deploy (section 6) |
| `start-local.cmd` | starts both servers locally in two windows |
| `docs/` | all documentation; this file is `17_HANDOFF.md` |

## 4. Run it locally
Needs Node 24 (engines `>=22.13`, uses experimental `node:sqlite`) and pnpm 12.

```bash
pnpm install
pnpm exec tsx scripts/setup-check.ts   # shows which keys are present (names only)
pnpm build
start-local.cmd                         # Windows: WhatsApp service on 127.0.0.1:3001, app on 127.0.0.1:3000
```
- Without `DUKAAN_DB_FILE` the app runs the open demo shop (fictional data, no login). With it set, the app is a real shop: first visit goes to `/setup`, then `/login`.
- `.env` (gitignored) names: `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `PROPOSAL_SECRET` (24+ chars, required when `DUKAAN_DB_FILE` is set), `DUKAAN_DB_FILE`, `WA_SERVICE_URL`, `WA_APP_KEY`, `WA_APP_SECRET`, `NEXT_PUBLIC_APP_URL`, `DEMO_SHOP_ID`, `DEMO_UPI_VPA`; optional `SETUP_CODE`, `ELEVENLABS_VOICE_ID`, `DUKAAN_DATA_FILE`, `DUKAAN_MEMORY_ONLY`, `DEMO_RESET_ON_BOOT`. `.env.example` lists the names. The WhatsApp service reads `services/wa-userauth/.env` (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `ALLOWED_APPS=key:secret`, `PORT=3001`, `HOST=127.0.0.1`).
- Pairing the WhatsApp number: open `http://127.0.0.1:3001/admin`, log in with the service's admin password, scan the QR from the spare phone within about 20 seconds (WhatsApp rotates it about every 20 s; a new QR every 2 to 3 s means the reconnect storm, see section 7).
- Keep the owner's secrets out of chat and commits. `.goal/render-values.txt` (gitignored) holds the values the owner pastes into Render; it is a local convenience file, delete it after use.

## 5. The one check that matters
```bash
pnpm verify
```
It runs typecheck, lint, unit tests, the WhatsApp service tests, build (to `.next-verify` so running servers are not disturbed), Playwright e2e on three hermetic servers (demo :3100, real shop :3102 with in-memory SQLite, test WhatsApp service :3201), `check:slop`, `check:secrets` and `verify:assets`, and prints `VERIFY-PASS`. It last printed `VERIFY-PASS` on 2026-11-01 before the Render commits. The Render commits afterwards touched only `render.yaml`, `src/lib/waService.ts` and `services/wa-userauth/src/config.js`; their tests were run (23 related app tests, 48 daemon tests), but a full `pnpm verify` was not re-run after them. Re-run it before you claim anything.

Counts: unit tests are in `docs/06_TEST_PLAN.md` section 10; the daemon has 48 tests.

## 6. Deploy on Render (in progress)
`render.yaml` defines two services. Both are `type: web`, plan `starter`, each with a 1 GB disk:
- `dukaan-dost`: build `corepack enable && pnpm install --frozen-lockfile && pnpm build`, start `pnpm start`, disk at `/var/data`, `DUKAAN_DB_FILE=/var/data/dukaan.sqlite`, `PROPOSAL_SECRET` generated. `WA_SERVICE_URL` comes from the other service's `hostport` (arrives as `host:port`; `waConfigFromEnv` in `src/lib/waService.ts` adds `http://`).
- `dukaan-wa`: `rootDir: services/wa-userauth`, `npm ci`, `npm start`, disk mounted at `/opt/render/project/src/services/wa-userauth/data` (that is where the paired WhatsApp session lives). It is public only so `/admin` opens in a browser for pairing; the owner chose this over a private service. Admin actions need `ADMIN_PASSWORD`; OTP routes need the app key and secret.
- Values the owner supplies in Render: app: `NEXT_PUBLIC_APP_URL`, `DEMO_UPI_VPA`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `WA_APP_KEY`, `WA_APP_SECRET`. WhatsApp service: `ADMIN_PASSWORD`, `ALLOWED_APPS` written `WA_APP_KEY:WA_APP_SECRET`.

State on 2026-11-01: the owner pasted the Render log of the WhatsApp service. The first deploy crashed with "Refusing to start in production with the default admin password, session secret or demo app credentials". That means `ADMIN_PASSWORD` or `ALLOWED_APPS` was blank or not in `key:secret` form. The error now names the exact setting (commit `06c7759`). The owner has to correct the field in Render and redeploy; no agent has seen a healthy deploy yet. Nothing about the Render run is verified beyond that log.

After a healthy deploy: set `NEXT_PUBLIC_APP_URL` to the real address and redeploy; open `https://<dukaan-wa address>/admin`, pair the number; open the app `/setup`.

Risks for the deployed WhatsApp service: it uses an unofficial client that can get the number banned (ADR-025, `docs/16_WHATSAPP_FACTS.md`); the owner knows and accepted it for first-day testing. CORS on the service defaults to `*`; restrict `CORS_ALLOWED_ORIGINS` if it stays public. There is no shared rate limiter across instances.

## 7. Known issues and unverified items
Nothing below is claimed as working.
- Real WhatsApp pairing, the login code message and a real reminder send have never been done end to end. Tests use a fake socket.
- QR storm: the pairing QR once changed every ~3 s. Cause was the adapter restarting the client 2.5 s after every close. Fixed with exponential backoff (2.5 s doubling to 60 s, reset after 30 s stable) in `services/wa-userauth/src/messaging/berryAdapter.js`, tests in `services/wa-userauth/tests/reconnectBackoff.test.js`. The original trigger was not reproduced. If it returns, read the `connection.close reason=` log lines.
- `pnpm verify:live` (real Gemini and ElevenLabs speech-to-text accuracy) has never been run. The ElevenLabs key worked for text-to-speech and Scribe while making the voice-over.
- No real phone, Lighthouse or native-speaker review of Hindi copy.
- `{{APP_URL}}` is still literal in posts, captions, deck and the ad end card. Replace it after the deploy URL is known, then re-render (`pnpm ad:render`).
- The voice-over (voices Kishan and Raju, `deliverables/ad/assets/vo`) was checked by transcription only; nobody has listened to it.
- Ad design-review items D10 to D14 are open (`docs/15_TODO.md`).
- One owner per shop. Staff accounts and multi-shop are not built.
- `node:sqlite` is experimental in Node 24; the store contract tests run the same cases on the memory and SQLite stores.
- Auth rate limits and the lockout live in process memory; they reset on restart and are per instance.
- `modern-web-guidance` was never run on this code (the owner told the agent not to).

## 8. Owner preferences (do not relitigate)
- Use the owner's own palette (Haldi, Sindoor, Neel, Pista, Gulabi, Syahi, Safed, Bahi page). Do not use any colours or themes from the WhatsApp zip. No gradients, glass, all-caps or arrows; `pnpm check:slop` enforces this. Fonts: Yatra One, Hind, Kalam. Never Inter.
- Do not run `modern-web-guidance`. Do not build a pluggable WhatsApp layer. The unofficial client is for the first day only; the owner will move to the official Business Cloud API themselves.
- Commit style: feature branch, `--no-ff` merge to `master`, commit with `-c user.name="Dukaan Dost Build" -c user.email="build@local.invalid"`, end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Push only when the owner says so.
- For any video: CC0 sound effects from Openverse into `assets/sounds/` with `CREDITS.json`, peak sample on the motion frame (global rule; already done for the ad, stamp hit at 15.6 s).
- Do not pull credentials from other projects. The owner's other project `Tap 2` has a WhatsApp app key, but its production URL does not run the service, so there is nothing to reuse; it also holds a paired WhatsApp session that must not be copied (linking one number in two places can log both out).

## 9. Next steps, in order
1. Help the owner finish the Render deploy: fix the two WhatsApp-service fields, confirm a healthy log, set the real `NEXT_PUBLIC_APP_URL`, pair the number, run `/setup`.
2. Replace `{{APP_URL}}` everywhere, re-render posts, deck and the ad, run `pnpm verify`.
3. Send one real reminder and one real login code to the owner's own number; record the result in `docs/05_LOG.md`.
4. Ad design fixes D10 to D14 and an owner listen of the voice-over (`docs/15_TODO.md`).
5. Move to the official WhatsApp Business Cloud API (owner will provide credentials; replace the adapter behind `src/lib/waService.ts`).
6. Smaller items: nonce-based CSP, shared rate limiter, PWA manifest, Gemini retry.

## 10. Where to look
| Question | File |
|---|---|
| What and why | `docs/01_PRD.md`, `docs/04_DECISIONS.md` |
| How it is built | `docs/02_TRD.md`, `docs/11_IMPLEMENTATION_PLAN.md` |
| Look and feel, slop checklist | `docs/03_DESIGN_SYSTEM.md` |
| Tests and the 20 fixtures | `docs/06_TEST_PLAN.md` |
| Vendor API facts | `docs/14_API_FACTS.md`, `docs/16_WHATSAPP_FACTS.md` |
| Independent reviews | `docs/reviews/` |
| Owner setup steps (plain language) | `SETUP_FOR_RISHABH.md` |
| What is left | `docs/15_TODO.md` |
| History | `docs/05_LOG.md`, `git log` |

## 11. Latest local app improvements (2026-11-01)
Owner approved docs/18_AUDIT_AND_IMPROVEMENT_PLAN.md and waived the unavailable planning skill requirement. Branch: codex/munshi-improvements; not pushed. Added customer search/filtering, contextual Munshi art, Help (/shop/help) and Settings (/shop/settings). WhatsApp, passcode and data controls now live in Settings. Fixed customer/stock failure recovery and audio lifecycle cleanup. Full pnpm verify returned VERIFY-PASS after implementation. See ADR-026 and docs/05_LOG.md. Deployment and live delivery remain unverified by this agent.

## 12. Push and completion roadmap (2026-11-01)
The section-11 improvements were committed as 4b2df73, merged as b6a1ce9 and pushed to origin/master on owner instruction. Full pnpm verify was rerun and returned VERIFY-PASS (187 unit, 48 daemon, 34 browser tests). Earlier statements that this work was uncommitted/unpushed describe the prior session state. The new draft completion roadmap is docs/19_COMPLETION_ROADMAP.md (24 gaps); workflow registry and signup/inventory drafts are under docs/workflows. It uses product/workflow skills and independent source reality/security reviews. Next: owner review of public-many-shop versus private-one-shop account model, then phase-0 safety and full language support. No new roadmap implementation is approved yet.

Owner clarified the roadmap account model: many shops with public signup (2026-11-01). Account-model choice is resolved; each owner gets an isolated shop initially. Signup workflow and complete roadmap remain Draft, pending implementation approval and verification-provider choice.

## 13. First roadmap implementation (2026-11-01)
Owner said Start and selected existing WhatsApp for signup verification. Branch codex/phase-zero-reliability now has the first reliability slice and English account preview. pnpm verify returned VERIFY-PASS: 222 unit/fixture, 48 daemon and 42 browser tests. See ADR-027, roadmap progress and docs/20_OPERATIONS.md. Production changes: mode/storage validation, additive auth_version and reminder_deliveries migrations, legacy cookie invalidation, setup-code.txt beside DB, mandatory signing-secret rotation on restore. English is currently header/account/security only and labelled preview. Public signup is NOT exposed; tenant context/identity uniqueness/registration proof/recovery must precede it. Operational production backup schedule, hosted CI and real deploy/delivery remain unverified.

## 14. Expanded verification (2026-11-01)
On owner request, tested the implemented scope and added API authentication/non-mutation/read-burst checks. Final pnpm verify: VERIFY-PASS (222 unit/fixture, 48 daemon, 45 browser, 25 asset checks). Both 390/1440 screenshot runs and live ElevenLabs/Gemini smoke checks passed. Both production dependency audits reported no known vulnerabilities. See docs/21_TEST_REPORT.md for actual coverage and limitations. Real WhatsApp delivery, live deployment, production restore/off-host scheduling and physical-device review remain unverified.

## 15. Simulated judging (2026-11-01)
Owner requested subagent judges. docs/22_JURY_REVIEW.md aggregates investor75, creative72, AI74 (mean73.7/100); conditional future proof/package mean86 is hypothetical. Individual reports in docs/reviews/judging/. Original rubric prompt is ../ai_judge_prompt_v2.md; jury details in docs/00_INFO.md. Parent pnpm verify returned VERIFY-PASS again. Submission packaging and real-world proof outrank adding feature breadth for near-term contest points; long-term roadmap remains valid. No real judge opinion or public-link verification is claimed.
