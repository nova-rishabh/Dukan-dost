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

## 2026-11-01: pushed improvements and drafted completion roadmap
- On owner instruction, committed the verified improvements (4b2df73), merged with --no-ff (b6a1ce9), and pushed master. pnpm verify returned VERIFY-PASS: 187 unit tests, 48 daemon tests, 34 browser tests.
- Used agency-product-manager and agency-workflow-architect skills with independent reality/security reviews to produce docs/19_COMPLETION_ROADMAP.md and docs/workflows drafts. Identified 24 product/operational gaps, priorities, dependencies and release gates. No proposed new product features are implemented by this planning change.
- Public signup/account model remains an owner decision. Roadmap is Draft; deployment and live WhatsApp delivery remain unverified.

## 2026-11-01: first roadmap implementation
- Owner approved starting and selected the existing WhatsApp service for public signup. Work on codex/phase-zero-reliability.
- Added session revocation/logout-all, login/CAPTCHA retry, request deadlines, durable reminder-send reservation and stale draft rejection, encrypted DB backup/restore CLI and synthetic rehearsal, production DB guard, persistent bootstrap code and CI workflow.
- Added English account/header/security preview with persisted language choice; other shop surfaces remain Hinglish.
- pnpm verify: VERIFY-PASS (222 unit/fixture tests, 48 daemon tests, 42 browser tests). English account screenshot inspected at 390 px; axe/overflow/input-preservation checks passed.
- docs/20_OPERATIONS.md records backup, restore, secret rotation and release requirements. No hosted CI, live deployment or real WhatsApp delivery verified. Tenant-safe public signup, full locale coverage, dashboard and inventory remain ahead.

## 2026-11-01: test everything request
- Ran the complete suite, added three API regressions, corrected the new malformed-body test to send raw bytes, and reran pnpm verify: VERIFY-PASS (222 unit/fixture, 48 daemon, 45 browser, 25 asset checks).
- pnpm shots passed at 390/1440; inspected refreshed stills. Live ElevenLabs TTS/Scribe and Gemini structured-output smoke scenarios both passed using fictional data. No real WhatsApp send. Both production dependency audits reported zero known advisories.
- Final local summary read burst: 40 requests, concurrency 10, p95 14.7 ms/max 15.5 ms; no production capacity claim. Full report and untested boundaries: docs/21_TEST_REPORT.md.

## 2026-11-01: simulated jury review
- Found original proxy prompt at ../ai_judge_prompt_v2.md and jury/rubric notes in docs/00_INFO.md. On owner request, three separately tasked subagents evaluated investor, creative and AI-juror lenses; these are simulations, not actual judge opinions.
- Current scores 75/72/74; equal-weight mean 73.7/100. Conditional proof/package scenario 87/84/87, mean 86, not earned or guaranteed. Five-link-only artifact diagnostic mean64.3; actual public-link access unverified.
- Biggest priorities: public fictional demo and final5links, replace URL/QR placeholders, refresh stale deck claims/counts, sharp ad proof, timed pitch, consented shopkeeper evidence. /try on real shop redirects into protected shop; do not expose real ledger to solve demo access.
- Parent pnpm verify rerun: VERIFY-PASS (222 unit/fixture,48daemon,45browser,25assets). Reports: docs/22_JURY_REVIEW.md and docs/reviews/judging/. No app changes.

## 2026-11-01: faster ad, music and supplied live URLs
- User provided app and WhatsApp Render URLs. Read-only HTTP checks found app200 but setupNeeded=true, /try→/setup; service /admin200 login, root404. No pairing/delivery or setup action performed.
- Used HyperFrames/media-use/product-motion skills for20-second recut (previous30s preserved),120BPM CC0 music, ducking, sharp fictional app captures and real product CTA. Stamp at8s; measuredpeak8.000113s. Final20s1080×1920/30fps MP4 rendered; -17.53LUFS/-1.81dBTP; seven VO lines recovered by transcription, no human listening claim.
- HyperFrames check zero errors, one intentional wipe warning. pnpm verify returned VERIFY-PASS with222unit/fixture48daemon45browser and26asset checks; final changed balance timing also passed HyperFrames check and asset validation.
- docs/23_PATH_TO_EXCEPTIONAL_SUBMISSION.md records full-rubric evidence targets, setup-gated public-demo gap, remaining packaging and real-user proof. No score100 is promised or newly assigned.


## 2026-11-01: approved items 2–7 implemented
- Owner requested WhatsApp public signup/recovery, English, customers, dashboard, measured inventory and statements. Workflow/backend/frontend skills and three specialist subagents used. Features and limits: docs/24_SHOP_OPERATIONS.md; ADR-028.
- Added session-derived request-local tenant scope, browser/purpose-bound OTP proofs, atomic unique account completion/replay, recovery session revocation, durable verification attempt cap, expiry cleanup and pending-proof revocation on erasure. Existing operator bootstrap stays protected.
- Added confirmed customer/stock/profile management, integer measured counts with concurrency/idempotency/reversal history, IST reporting, safe CSV and browser print-to-PDF. English money/direction/confirmation/reminder copy preserves original evidence.
- Initial full checks exposed duplicate language controls and an over-specific select label test; fixed UI duplication, nested main landmarks and test selection, then reran. Final `pnpm verify`: VERIFY-PASS (250 unit/fixture,48daemon,51browser,26assets); typecheck/lint/build/design/secrets passed. 390px signup/dashboard/statement captures inspected. No real WhatsApp message, production migration, deployment or new score claim.
- Remaining release limit: conservative process-local public signup/send limiter shares an IP bucket on Render; implement trusted-proxy/shared limits before broad launch. Lost-number recovery requires separately verified operator process; no bypass built.

## 2026-11-01: remaining pilot implementation and research
- Owner authorized all remaining pilot work without another confirmation. Used product/workflow skills, official OWASP/Next/web.dev/Gemini research, and three specialists for isolated public trial, data/account lifecycle, PWA/onboarding and submission packaging; cross-reviewed identity/import/manual-money/CSP boundaries.
- Delivered private public trial, exact-paise form and filtered history, aliases/contact-prefill, versioned JSON transfer and redacted activity, verified number change, fresh-auth erasure/UPI/account closure, install/offline help and opt-in drafts, persistent abuse limits, nonce CSP, storage readiness and release/volume scripts.
- Refreshed deck PDF/QR/three posts/captions; hosted local final ad/PDF/posts/credits under /submission. No real WhatsApp send, pairing, user interview, production restore or official-provider credentials used.
- Integration checks found shared reset buckets and mismatched Playwright request/browser cookies, plus build-frozen URL origins. Fixed visitor-scoped test workspaces and server runtime APP_PUBLIC_URL; added an origin assertion before browser payment navigation. Fixed paise animation and added stale-erasure commit guards with tests for both stores.
- Final `pnpm verify`: VERIFY-PASS — 282 unit/fixture tests (34 files),48daemon,58browser,26assets; typecheck/lint/build/design/secrets passed. New 390px sample/activity/entry/account screens inspected. Synthetic1000customer/20000entry benchmark summaryp95=62.57ms locally; no production capacity claim.
- Remaining external release evidence and later accounting/staff/allocation modules are explicitly listed in docs/25_PILOT_COMPLETION.md. Publishing uses the owner's earlier GitHub push instruction; deployment availability must be checked separately.

## 2026-11-01: live deployment verification and visual corrections
- Live Render app now serves health/trial/signup/manifest/submission/PDF/ad/posts. Read-only availability check passed all8routes; signupCAPTCHAreturned200validSVG; WhatsAppadminloginpage200 (noadminauthentication).
- Headless390px livebrowserverification passed13checks: readiness/anonymousprotection, twoisolatedsamples, confirm-before-write, exactpaise, measuredstock ownership, CSV/dashboard, same-origin privatepayexample, nonceCSP/static-onlyofflinecache, realstaticartifacts, signup andnoJSerrors. Onlyfictionalvisitorstoreswerechangedandbothsamplesexited; no realaccount/OTP/reminder created/sent.
- Visualinspection found activeDashboard white-on-white due unlayeredchipbackground overriding Tailwindutility; fixed using aria-current componentselector. SignupCAPTCHA now distinguishesloadingfromfailed and guards overlappingrefreshes. Addedrenderedcontrast and pending/failure/retry regressions.
- Afterfixes `pnpm verify`: VERIFY-PASS (282unit/fixture,48daemon,59browser,26assets). Post-rolloutvisualevidence follows in docs/27_LIVE_VERIFICATION.md after publicdeploymentcheck.
