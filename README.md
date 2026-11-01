# Dukaan Dost

**बोलो, लिखो मत।** The ledger you talk to.

A voice-first udhaar ledger for kirana shops. Say "Sharma ji ne 500 udhaar liye, atta kam hai". Dukaan Dost shows what it heard (amount in words, direction in words), the owner confirms with one tap, a stamp lands, the khata updates, and a polite WhatsApp reminder with a pay link is ready to send.

Built for the AI Builder Challenge (Roobaroo AI Camp, with Developers' Society, IIT Kharagpur). Theme: Local business.

## Status
Current pilot code includes English/Hinglish, WhatsApp public signup and recovery with isolated shops, customer/stock management, dashboard/statements, exact-paise manual entries, reviewed JSON export/import, account/mobile controls, private visitor demos and install/offline-help support. No real messages are sent in the fictional trial. See [implementation and research](docs/25_PILOT_COMPLETION.md) and [submission package](docs/26_SUBMISSION.md) for tested behavior and remaining evidence.

Run `pnpm verify` before claiming the build works. The final result is recorded in [handoff](docs/17_HANDOFF.md). Source implementation is distinct from live deployment: actual-phone WhatsApp receipt, native-speaker/user observation and off-host backup scheduling still require external evidence/configuration. Earlier real AI-provider smoke checks are recorded in docs/21_TEST_REPORT.md; they are not natural noisy-shop accuracy evidence.

Useful routes: `/try`, `/signup`, `/shop/start`, `/shop/dashboard`, `/shop/entry`, `/shop/inventory`, `/shop/ledger`, `/shop/data`, `/shop/activity`, `/shop/account`, `/submission`. Shop pages require the owner's session or an explicit fictional sample session on real deployments.

## Run it
Real shop on this computer: double-click `start-local.cmd`, then follow [SETUP_FOR_RISHABH.md](SETUP_FOR_RISHABH.md) (pair WhatsApp, set up the shop, log in). Open demo: leave `DUKAAN_DB_FILE` empty.
```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm verify       # typecheck, lint, unit and fixtures, build, e2e with axe, slop, secrets, assets
pnpm setup:check  # which adapters are active, which env names are missing
```

Environment variable names are in `.env.example`. The names are `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `PROPOSAL_SECRET` (required when `DUKAAN_DB_FILE` is set), `DUKAAN_DB_FILE`, `DUKAAN_SHOP_NAME`, `NEXT_PUBLIC_APP_URL`, `DEMO_SHOP_ID` and `DEMO_UPI_VPA`; optional extras: `APP_PUBLIC_URL` (server runtime URL override), `TRUST_PROXY_HOPS` (verified trusted proxy chain only), `ELEVENLABS_VOICE_ID`, `DUKAAN_DATA_FILE`, `DUKAAN_MEMORY_ONLY` and `DEMO_RESET_ON_BOOT`.

## Read in this order
1. [docs/00_INFO.md](docs/00_INFO.md): challenge facts, access, glossary
2. [docs/01_PRD.md](docs/01_PRD.md): what and why
3. [docs/02_TRD.md](docs/02_TRD.md): how
4. [docs/03_DESIGN_SYSTEM.md](docs/03_DESIGN_SYSTEM.md): look and behaviour, slop checklist
5. [docs/04_DECISIONS.md](docs/04_DECISIONS.md): ADRs
6. [docs/05_LOG.md](docs/05_LOG.md): project log
7. [docs/06_TEST_PLAN.md](docs/06_TEST_PLAN.md): tests and the 20 fixtures
8. [docs/07_DEMO_AND_PITCH.md](docs/07_DEMO_AND_PITCH.md): pitch, ad, posts, deck
9. [docs/08_SKILLS_AND_TOOLS.md](docs/08_SKILLS_AND_TOOLS.md): skills audit and connections to add
10. [docs/09_RISKS_AND_OPEN_QUESTIONS.md](docs/09_RISKS_AND_OPEN_QUESTIONS.md): risks and questions
11. [docs/10_BUILD_PLAN.md](docs/10_BUILD_PLAN.md): schedule and cut lines
12. [docs/11_IMPLEMENTATION_PLAN.md](docs/11_IMPLEMENTATION_PLAN.md), [12_VISUAL_REVIEW.md](docs/12_VISUAL_REVIEW.md), [13_SELF_REVIEW.md](docs/13_SELF_REVIEW.md), [14_API_FACTS.md](docs/14_API_FACTS.md): build plan, visual review, honest self-score, vendor API facts
13. [docs/reviews/](docs/reviews/): independent reviews (money and privacy, design, docs versus code, security, verification)
14. [docs/15_TODO.md](docs/15_TODO.md): what is still to do (Render deploy, the ad, official WhatsApp API, nonce CSP)
15. [docs/17_HANDOFF.md](docs/17_HANDOFF.md): **start here if you are an AI agent continuing the work** (state, commands, risks, next steps)

Also in the Workshop folder: [ai_judge_prompt_v2.md](../ai_judge_prompt_v2.md), the prompt we use to score ideas against the challenge rubric.
