# Implementation plan (2026-11-01)

Source of truth: `.goal/dukaan-dost-build-20261101.md`. Order follows TRD section 15; every task names the PRD ids it serves.

| # | Task | PRD ids | Test first |
|---|---|---|---|
| 1 | Scaffold Next.js 16, Tailwind 4, TS, Vitest, Playwright, scripts | all | n/a |
| 2 | `money` (paise, Indian grouping, amount in words hi/en) | P0-3 | unit |
| 3 | `numbers` (digits, words, idioms) | P0-2 | number table |
| 4 | `resolve` (aliases, trigram similarity, Devanagari to Roman) | P0-4 | unit |
| 5 | `rules` interpreter (direction, multi-intent, stock, undo, balance) | P0-2, P0-7 | 20 fixtures |
| 6 | `checks` + `interpret` orchestrator + Gemini fallback | P0-2, P0-3 | unit |
| 7 | `ledger` over `LedgerStore` (idempotency, void, balances, summary) | P0-5, P0-8 | unit |
| 8 | Adapters: local store/STT/LLM/TTS; ElevenLabs, Gemini; SQLite file store (replaced Supabase, ADR-023) | ADR-018 | mocked HTTP |
| 9 | API routes + pay page + reminder | P0-6 | unit + e2e |
| 10 | UI components and screens, stamp, juror mode, poster | P0-1, P0-3, P0-9, P1-2 | e2e + axe |
| 11 | Quality scripts: slop, secrets, assets, setup:check | | self-tests |
| 12 | Social posts, deck, HyperFrames ad, sounds | | verify:assets |
| 13 | Setup guide, docs sync, reviews, self-review | | |

Gate per task: tests green, commit locally. No pushes, deployments, paid calls.
