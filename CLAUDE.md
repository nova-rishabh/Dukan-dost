# Dukaan Dost: project rules for Claude

Read `docs/` before changing anything. The PRD says what, the TRD says how, the design system says how it looks, and `docs/04_DECISIONS.md` says why.

## Workflow
- No code until the docs are approved and `superpowers:writing-plans` has produced a plan the owner approved.
- Test first for `numbers`, `resolve` and `interpret`. Fixtures live in `tests/fixtures/` and mirror `docs/06_TEST_PLAN.md`.
- Before building any web feature, run `modern-web-guidance` (`npx.cmd -y modern-web-guidance@latest search "<query>"`, then `retrieve`). End build responses with its disclosure section.
- Before claiming done: run the tests, open the app on a 390 px viewport, and show evidence (`superpowers:verification-before-completion`).
- Record decisions in `docs/04_DECISIONS.md` and events in `docs/05_LOG.md`.

## Product rules (do not break)
1. The model proposes, deterministic code disposes, the human confirms. No model output writes to the database.
2. Every write is confirmed. The confirm card shows the amount in digits **and** words, and the direction in words.
3. Money is integer paise. No floats.
4. Entries are voided, never deleted. Balances come from the view.
5. Never invent quantities, customers, payment status or advice. A pay link is never "paid".
6. Reminders are drafts the owner sends through `wa.me`. Never auto-send.
7. Demo data is fictional. No real phone numbers in the repo, logs or screenshots. No audio storage.
8. No keys in code or chat. Read secrets from env or Doppler.

## Design rules (the owner's rules)
- **Bright colours**, flat, hard-offset shadows. No gradients, no glass, no cream background.
- **Never Inter.** Fonts are Yatra One (display), Hind (UI), Kalam (handwriting).
- **No generic websites.** Run the 12-question slop checklist in `docs/03_DESIGN_SYSTEM.md` section 14 on every screen.
- Reference first: check `design/references/` and the design system before a new screen.
- Sentence case. Hinglish copy. Verbs match across button, toast and error.
- One memorable moment: the stamp. Everything else stays quiet.
- Motion respects `prefers-reduced-motion`.
- React Bits: only the shortlist in the design system; no wallpaper backgrounds.

## Video and media
For any video we make, follow the owner's global rule: CC0 sound effects from the Openverse API into `assets/sounds/` with `CREDITS.json`, peak sample aligned to the exact frame of the motion (the stamp landing is the hero hit).

## Style for writing
Short, plain, specific. No filler. State what is verified and what is not. Never claim a competitor feature or a metric we did not check.
