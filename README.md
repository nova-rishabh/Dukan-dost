# Dukaan Dost

**बोलो, लिखो मत।** The ledger you talk to.

A voice-first udhaar ledger for kirana shops. Say "Sharma ji ne 500 udhaar liye, atta kam hai". Dukaan Dost shows what it heard (amount in words, direction in words), the owner confirms with one tap, a stamp lands, the khata updates, and a polite WhatsApp reminder with a pay link is ready to send.

Built for the AI Builder Challenge (Roobaroo AI Camp, with Developers' Society, IIT Kharagpur). Theme: Local business.

## Status
Built and verified locally (2026-11-01): the app runs with no API keys in Demo mode (typed input, five sample clips, local ledger, rules interpreter). Real ElevenLabs and Gemini adapters are written and tested against mocked HTTP only; they have not been run with live keys. Data lives in memory plus a JSON file (demo) or in a SQLite database file you choose; there is no database account to create. Not deployed. See [SETUP_FOR_RISHABH.md](SETUP_FOR_RISHABH.md).

## Run it
```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm verify       # typecheck, lint, unit and fixtures, build, e2e with axe, slop, secrets, assets
pnpm setup:check  # which adapters are active, which env names are missing
```

Environment variable names are in `.env.example`. The names are `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`, `PROPOSAL_SECRET` (required when `DUKAAN_DB_FILE` is set), `DUKAAN_DB_FILE`, `DUKAAN_SHOP_NAME`, `NEXT_PUBLIC_APP_URL`, `DEMO_SHOP_ID` and `DEMO_UPI_VPA`; optional extras: `ELEVENLABS_VOICE_ID`, `DUKAAN_DATA_FILE`, `DUKAAN_MEMORY_ONLY` and `DEMO_RESET_ON_BOOT`.

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

Also in the Workshop folder: [ai_judge_prompt_v2.md](../ai_judge_prompt_v2.md), the prompt we use to score ideas against the challenge rubric.
