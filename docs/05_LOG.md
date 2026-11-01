# Project log

Newest entries at the bottom. One line per event; link to the file that holds the detail.

## 2026-10-31 (late)
- Read the kick-off deck (9 slides): AI Builder Challenge, one afternoon, build window 13:30 on Day 2, submit at 16:00, pitches 3 min plus 2 min jury questions, winners 17:30. Prizes ₹15,000, ₹10,000, ₹5,000 plus Best Idea, Best Product, Best Presentation.
- Rubric: Problem and idea 20, Product works 25, Website/social/ad 20, Pitch and clarity 20, AI use and craft 15. Principle: "A working product beats a pretty slide."
- Jury: investor (SixHats.ai), ads founder (Glace), and an AI juror that scores every pitch on the same rubric.
- Deliverables: product, website, 3 social posts, video ad, pitch deck. Five links go into the P7 form.
- Brainstormed 9 ideas, then bolder ones. Shortlist: Scam Dojo, Dukaan Dost, Scholarship Scout, Paper Whisperer.

## 2026-11-01
- Wrote ai_judge_prompt.md, then ai_judge_prompt_v2.md (adds planned and with-proof scores, "why not ChatGPT" test, 5-link view, what a 100 requires).
- Judge round 1 (ideas A Scam Dojo, B Dukaan Dost):
  - Me: A 74, B 69. Gemini: A 75, B 65. ChatGPT: A 80, B 84. Grok: A 74, B 77.
- Judge round 2 (A, B, D Kagaz):
  - Planned totals. Grok: A 78, B 81, D 76. ChatGPT: A 81, B 82, D 85. Gemini: A 77, B 72, D 82.
  - Kagaz dropped on owner's request: weakest "why not ChatGPT" answer, and close existing competitors reported.
- Judge round 3 (A, B, E Ghar Ki Awaaz):
  - Planned totals. Gemini: A 80, B 75, E 83. ChatGPT: A 78, B 81, E 72. Grok: A 74, B 75, E 73.
  - Averages: A 77.3, B 77.0, E 76.0 planned; 87.7, 87.0, 88.0 with proof. Statistical tie. Votes: B two, E one.
  - ChatGPT found direct competitors for E (family-voice medicine reminders), which Gemini's high score had not checked.
- Decision: build Dukaan Dost (ADR-001). Tie-break reasoning: highest "Product works" average, lowest stage risk, preferred by the owner.
- Documents written: PRD, TRD, design system, decisions, log, test plan, demo and pitch, skills and tools, risks and open questions, build plan, project CLAUDE.md, README.
- Skills read in full: frontend-design, design-elevation, design-systems, write-spec, architecture, 21st-ui, modern-web-guidance, system-design, testing-strategy, interaction-design, ux-writing.
- React Bits catalogue reviewed (33 text, 38 animation, 48 component, 63 background entries). Install pattern confirmed: `npx shadcn@latest add @react-bits/<Name>-TS-TW`.
- Google Fonts confirmed to include a Devanagari subset for Yatra One, Hind, Kalam (also Rozha One, Baloo 2, Mukta, Tiro Devanagari Hindi, Khand), by reading the live Google Fonts CSS.
- Open: no real-shopkeeper test yet; no API keys confirmed; no repo created; no code written.

## Template for new entries

```
## YYYY-MM-DD
- What changed, in one line (link to file or ADR).
- What we learned.
- What is blocked, and by whom.
```

## 2026-11-01 (later)
- Owner answers: clips via ElevenLabs Flows plus HyperFrames; Gemini; no Bengali; no real shopkeeper (AI-made clips). Recorded as ADR-017 to ADR-020.
- Verified at prep time: Node v24.13.0, pnpm 12.10.1, ffmpeg 9.0.2, Python 3.14. Latest npm: next 16.4.3, react 19.3.1, tailwindcss 4.3.3, zod 4.6.7, vitest 5.0.5, @playwright/test 1.64.1, @supabase/supabase-js 2.118.0, @google/genai 2.32.0, html-to-image 1.11.13, qrcode 1.5.4.
- ElevenLabs docs: Scribe v2 supports Hindi (high-accuracy tier); the exact API model id string was not on the page, so the build run must read it from the API reference. ElevenCreative Flows is a node-based canvas for image, video, speech, sound and music.
- Gemini docs list `gemini-3.8-flash` as a stable Flash-class model; free-tier status was not on the page.
- Autonomous build brief prepared with goalify (see `.goal/`).

## 2026-11-01: autonomous build run
- Built the app, API, adapters, UI, tests, quality gates, social posts, deck, ad and setup guide in one run (goal file `.goal/dukaan-dost-build-20261101.md`). Local git only; nothing pushed or deployed; no paid API called; no keys present.
- Core logic was written test first (money, numbers, 20 fixtures, ledger, remind, pay, adapters with mocked HTTP). Final counts are in `docs/06_TEST_PLAN.md` section 10.
- Vendor facts checked against official docs by a separate agent: `docs/14_API_FACTS.md`.
- Blocked or not done: see section "Not verified" in `docs/13_SELF_REVIEW.md`.
- Independent reviews (agents that did not write the code) are in `docs/reviews/`. They found and the build fixed: proposals not binding the written values, a spoofable rate-limit IP, stale pay-link amounts, a UPI id that could route to a real account, layout defects, stale deck numbers, and a red `check:secrets`/`verify:assets`. Accepted gaps are listed in ADR-022.
- Closeout: `pnpm verify` and every definition-of-done command were re-run fresh in one dedicated turn; the output is quoted in the final report of the run.

## 2026-11-01: Supabase replaced
- Owner's Supabase limit ran out, so Supabase was removed and a SQLite file store added (ADR-023). A shared contract test runs the same 13 behaviours against the memory store and the SQLite store, including reopen-from-disk.

## 2026-11-01: real fixes
- Built delete-my-data, 30-day retention of unconfirmed sentences, CSP and HSTS (ADR-024). Added a second e2e server that runs a real SQLite shop.

## 2026-11-01: login and WhatsApp
- Owner login (passcode, WhatsApp code), first-run setup, session cookie, route protection (ADR-025). The supplied WA-USERAUTH zip is vendored and runs as its own localhost service; sending a reminder from the app is owner-confirmed. Both servers were started locally; nothing was pushed (remote added only).

## 2026-11-01: voice-over, QR fix, Render
- ElevenLabs voice-over added to the ad (seven lines, checked by transcription). Pairing QR reconnect storm fixed with backoff and a test (daemon now 48 tests). Both pushed to GitHub `master`.
- Added `render.yaml` (app plus WhatsApp service as two web services with disks); the WhatsApp service is public so `/admin` opens for pairing. `WA_SERVICE_URL` now accepts `host:port`. The WhatsApp service names which production credential is missing. First Render deploy of the WhatsApp service crashed on missing credentials; waiting on the owner to correct the two fields.
- Wrote `docs/17_HANDOFF.md` for the next agent.

## 2026-11-01: audit repairs and Munshi screens
- Owner approved the documented app improvement plan and waived the unavailable planning skill. Work is on codex/munshi-improvements, not pushed.
- Added customer search and balance filters, Munshi welcome/empty/retry art, /shop/help and /shop/settings. Moved WhatsApp, passcode and data controls into Settings.
- Fixed swallowed customer load errors, stock resolve failures, microphone context/stream lifecycle and permission races, and read-back object URL cleanup/stale playback.
- Full pnpm verify returned VERIFY-PASS after implementation (187 unit tests, 48 daemon tests, browser and axe checks). Rendered mobile Help and desktop Settings inspected. Screenshots: docs/screenshots/help-390.png and settings-1440.png.
- Real deployment and real WhatsApp delivery were not checked. Remaining media/deployment/platform work is listed in docs/18_AUDIT_AND_IMPROVEMENT_PLAN.md.
