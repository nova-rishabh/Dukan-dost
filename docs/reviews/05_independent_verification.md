# 05 Independent verification (2026-11-01)

Verifier did not build the project. Nothing in the repo was edited except this file. No git, no `next build`, no paid calls, no keys. Scratch scripts live in the session scratchpad.

## Claim table

| # | Claim | How checked | Result | Evidence |
|---|---|---|---|---|
| 1a | 20 of 20 utterance fixtures pass | `pnpm exec vitest run tests/fixtures` | CONFIRMED | 1 file, 21 passed (20 fixtures + 1 "no flagged intent is writable" test) |
| 1b | Fixture sentences equal docs/06_TEST_PLAN.md section 2 | node script: parsed the 20 table rows of section 2 and compared column 2 to `utterances.json` `.text`, exact string match | CONFIRMED | rows 20, diffs 0 |
| 2a | Unit test count 119 in 8 files | `pnpm exec vitest run` | CONFIRMED | Test Files 8 passed, Tests 119 passed (includes the 21 fixture tests) |
| 2b | E2E 18 pass | `pnpm exec playwright test` | CONFIRMED | 18 passed (11.0 s): 5 axe + 13 script tests. Separate `tests/shots` config not counted |
| 3a | Integer paise only on write path | read src/lib/ledger.ts, money.ts, schemas.ts, supabase migration | CONFIRMED | `createEntry` requires `Number.isInteger(amountPaise)`, `>0`, `%100===0`, ceiling check; DB column `amount_paise bigint check (>0)`; `insertEntry` only called from ledger.ts; test "rejects ... non-integer paise" (500.5, 0) |
| 3b | createEntry requires a signed proposal | read code and tests | CONFIRMED | `verifyProposal` before anything; missing/forged token gives `bad_proposal`; entry must match the signed intent (customer, type, amount) else `proposal_mismatch`; idempotency key derived from the token. Caveat: `voidEntry` accepts an optional proposalToken (voiding without a token is allowed if `confirmed:true`) |
| 3c | Flagged intent never writable | read createEntry + fixture test | CONFIRMED | Unresolved `clarifications` throw `needs_clarification`; fixture test asserts every intent with clarifications has `writable=false`. Caveat: server trusts client-supplied `resolutions[]` (by design, it is the owner's tap; chosen customer is still restricted to the proposal's candidates) |
| 3d | Voided entries excluded from balances | read `computeBalances`, ran ledger tests | CONFIRMED | `if (e.voidedAt) continue;` and test "balance equals credit minus payments, excluding voided entries" passes |
| 4a | Ad is 28-32 s, 1080x1920, 30 fps, audio | `ffprobe` on dukaan-dost-ad-vertical.mp4 | CONFIRMED | h264 1080x1920, 30/1 fps, 900 frames, duration 30.000000, aac 48 kHz stereo |
| 4b | Stamp startMs = hit - peakOffset (within 2 ms) | decoded stamp-thunk.mp3 with ffmpeg to mono f32 48 kHz, max abs sample | CONFIRMED | my peak 219.13 ms; CREDITS peakOffsetMs 219; 15381 + 219.13 = 15600.13 ms vs hit 15600; index.html places it at data-start 15.381 |
| 4c | Rendered MP4 peak at 15.600 s +-15 ms | decoded MP4 audio windows 15.4+0.4, 15.5+0.2, 15.0+1.2 | CONFIRMED | loudest sample at 15.4+0.20013 = 15.6001 s in all three windows (peak 1.13) |
| 4d | Stamp visually lands on that frame | ffmpeg frames (0-based index n) 466-469, viewed | CONFIRMED | n=467 (t=15.567): stamp oversized and tilted, mid-slam, overlapping buttons; n=468 (t=15.600): stamp settled at final size on the parchi, buttons hidden; n=469: small settle bounce. Landing frame is n=468 = 15.600 s |
| 4e | (extra) other sounds' peak offsets | same decoder on the other 6 files | PARTIAL | whoosh-app 59 ok, tap 9 ok, whoosh-balance 70 ok, message-tick 353 ok; ui-tick-parchi mine 44.9 ms vs recorded 57 ms (12 ms, under half a frame); logo-sting mine 466.7 vs recorded 461 (6 ms). Minor |
| 5 | All CREDITS entries are CC0 and match | curl `api.openverse.org/v1/audio/{id}/` for all 7 (no retries needed) | CONFIRMED | all 7 returned license `cc0`, with creator, title and landing URL equal to CREDITS.json (qubodup x2, suntemple, benzix2, sgrowe, BlueSiren, MATRIXXX_) |
| 6a | STT `POST /v1/speech-to-text`, model `scribe_v2` | WebFetch of the doc page vs config.ts and elevenlabs.ts | CONFIRMED | page shows that endpoint and only `scribe_v2`; code uses `${BASE}/v1/speech-to-text` and `ELEVENLABS_STT_MODEL_ID="scribe_v2"`. Full model_id enum is not on the page (not listed as verified in 14 either) |
| 6b | TTS `POST /v1/text-to-speech/{voice_id}`, default `eleven_multilingual_v2` | WebFetch | CONFIRMED | doc: default eleven_multilingual_v2; code matches |
| 6c | `GET /v2/voices` | WebFetch | CONFIRMED | doc "GET https://api.elevenlabs.io/v2/voices"; code calls `/v2/voices?language=hi&page_size=20` |
| 6d | gemini-3.8-flash is a stable model | WebFetch of models page | CONFIRMED | listed in Gemini 3 section under "Stable", card label "New Stable" |
| 6e | `responseJsonSchema` and `systemInstruction` in generateContent config | grep node_modules/@google/genai/dist/genai.d.ts (v2.32.0) | CONFIRMED | `systemInstruction?: ContentUnion` and `responseJsonSchema?: unknown` present in config types; gemini.ts uses both plus `responseMimeType` |
| 7a | deck.pdf has 8 pages, index.html 8 slides | PDF `/Count 8` and 8 `/Type /Page`; 8 `<section>` in index.html | CONFIRMED | |
| 7b | Slide 6 only states verified numbers | read slide 6 text (HTML and PDF text via pdftotext) | REFUTED | Slide says "104 unit tests" and "16 end-to-end checks (9 scripts plus axe on 5 pages)". Measured: 119 unit and 18 e2e. Only "20 / 20" is right. Deck and PDF are stale (built 00:58, before the later tests) |
| 8a | docs/06_TEST_PLAN.md section 10: "`pnpm check:secrets` passes" | ran `pnpm run check:secrets` | REFUTED (now) | FAIL (42) of 503 files: 41 hits in `deliverables/ad/.hyperframes/video-state.json` (a long hash in a Windows cache path matched the phone regex) and 1 in `docs/reviews/01_money_and_privacy.md:24` ("[10-digit example]" example). Almost certainly false positives, no real secret seen, but the gate is red |
| 8b | TEST_PLAN: `pnpm verify:assets` final run | ran `pnpm exec tsx scripts/verify-assets.ts` | REFUTED | `verify:assets FAIL (1 of 24)`: "ad sounds CREDITS.json: no entry with role 'stamp'". scripts/verify-assets.ts:77 looks for role `stamp`, CREDITS uses `stamp-thunk`. Checker out of sync with the data; the underlying alignment is fine (4b) |
| 8c | `check:slop` passes | `pnpm run check:slop` | CONFIRMED | scanned 79 files, PASS |
| 8d | docs/13_SELF_REVIEW "eight-slide deck with measured numbers" | see 7b | REFUTED (in part) | slide 6 numbers are not the measured ones |
| 8e | docs/13: "18 end-to-end checks, 20 of 20 fixtures" | 2b, 1a | CONFIRMED | |
| 8f | SETUP: seed has 8 customers incl. two Sharmas; render exists; `.env.example` has names only | read src/lib/seed.ts, ls | CONFIRMED | 8 customers in seed.ts (Amit Sharma, R K Sharma); mp4 exists; verify-assets reports 8 env names, no values |
| 8g | README "five sample clips" in demo mode | `public/` is empty, so no mp3s exist yet | UNVERIFIED | e2e 8c passes the sample-clip path with no audio files, so the clips are text-backed at least; SETUP step 6 says mp3s are generated later. Not disproved |
| 8h | Live ElevenLabs/Gemini/Supabase behaviour | no keys | UNVERIFIED | Docs say so too |

## Exact counts measured
- Fixtures: 20/20 pass (21 tests in that file).
- Unit: 119 passed, 8 files.
- E2E: 18 passed (5 axe + 13 scripts).
- Gates now: check:slop PASS; check:secrets FAIL (42 false-positive-looking hits); verify:assets FAIL (1 of 24, stale role name).

## Disproved items needing a fix
1. Deck slide 6 (index.html and deck.pdf): change 104 to 119 and 16 to 18 (9 scripts plus Badlo and forged-proposal checks plus axe on 5 pages), then re-export the PDF.
2. check-secrets: exclude `deliverables/ad/.hyperframes/` and tighten the phone regex (or reword review doc line 24).
3. verify-assets: look for role `stamp-thunk` instead of `stamp`.
4. Optional: CREDITS peakOffsetMs for ui-tick-parchi (57 vs 45 measured) and logo-sting (461 vs 467); both are under 15 ms.
