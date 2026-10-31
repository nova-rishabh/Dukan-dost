# Build plan

Principle: the official build window is only 13:30 to 16:00. The deck lets teams start tonight, so we build the core tonight and use the window for polish, proof, rehearsal and submission. Nothing in this plan starts until you approve the docs and answer the blocking questions (09, section 4).

## 0. Gate

1. You review PRD, TRD and design system.
2. Answer blocking questions 1-4.
3. I invoke `superpowers:writing-plans` to turn this into a task-level implementation plan, which you approve.
4. Build starts, test first.

## 1. Tonight

| Block | Tasks | Output |
|---|---|---|
| A. Foundations (about 45 min) | Create the repo; set up Doppler or env; create the Supabase project; apply schema and seed (8 customers, two Sharmas); deploy an empty Next.js app to Vercel | Live URL, DB ready |
| B. Interpretation first (about 90 min) | Write the 20 fixtures and the number parser tests; implement `numbers`, `resolve`, `interpret`; get the fixtures green on text input | Fixture pass rate at least 18 of 20 |
| C. Voice (about 45 min) | MediaRecorder capture, `/api/transcribe` with ElevenLabs, the 20-sentence audio test | Measured accuracy, clean and noisy |
| D. Core UI (about 90 min) | Parchi, stamp, confirm flow, ledger write, summary strip, bahi page, typed input | The hero loop works on a phone |
| E. Real-world prep (in parallel, whoever is free) | Verify competitors; book the shopkeeper; start the video shots; collect reference photos | Notes in 05_LOG, footage |
| F. Stop | Commit, deploy, write the log entry, sleep | Safe checkpoint |

## 2. Day 2 morning (workshops)
Attend. In free minutes: record live-voice fixtures with three people; capture the real shopkeeper clip; run `reset-demo`.

## 3. Build window 13:30-16:00

| Time | Task | Done when |
|---|---|---|
| 13:30-13:50 | Pull, deploy, smoke test on the stage device and network | Hero loop works on the phone over hotspot |
| 13:50-14:20 | Reminder, pay page, wa.me, Mark as received | P0-6 acceptance passes |
| 14:20-14:50 | Juror mode: sample clips, "Try the sample shop", landing hero as live demo | P0-9 passes on a private window |
| 14:50-15:15 | Design pass: stamp motion, count-up, slop checklist, accessibility and Hindi text check | Checklist passes |
| 15:15-15:35 | Final assets: video ad exported, 3 posts, deck, 5 links verified in a private window | All links open without login |
| 15:35-15:50 | Rehearse the pitch twice, fallback ladder once | Under 2:50, no fumbles |
| 15:50-16:00 | Submit the P7 form, screenshot the confirmation | Submitted |

## 4. Cut lines (drop in this order when behind)

1. Bengali, read-back TTS (P1-1), voice balance query (P1-3)
2. Offer poster (P1-2)
3. Count-up and other polish (keep the stamp)
4. Real ₹1 payment test (P1-5)
5. Never cut: confirm-before-write, direction in words, typed fallback, sample clips, pay page demo banner, the 5 working links

## 5. Definition of done (per feature)

- Acceptance criteria in 01_PRD pass.
- A test exists and passes (unit, fixture or Playwright).
- Reviewed on a real phone at 390 px.
- Slop checklist passes for any visible screen.
- Log entry written; decision recorded if a trade-off was made.

## 6. Roles (fill in)

| Role | Name | Notes |
|---|---|---|
| Builder | | |
| Presenter | | |
| Filmer and editor | | |
| Tester and note-taker | | |
| Real-shopkeeper contact | | |

## 7. Daily rhythm

Morning: read 05_LOG and 09 risks. Midday: update the log. End of day: commit, deploy, write what is blocked and who unblocks it.
