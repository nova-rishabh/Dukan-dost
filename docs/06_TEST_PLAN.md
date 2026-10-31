# Test plan

Principle: a wrong ledger entry is worse than a slow one. We test the *proposal* first (language and logic), then the writes, then the whole loop on a real phone.
Pyramid: many fast unit and fixture tests, a few end-to-end tests, and a rehearsal checklist for the stage.

## 1. What we test and how

| Area | Type | Tooling | Gate |
|---|---|---|---|
| Hindi/Hinglish/English number parser | Unit | Vitest | 100% on the number table in section 3 |
| Extraction (interpret) on 20 sentences, text input | Fixture | Vitest, mocked and live LLM | At least 18 of 20 fully correct or correctly flagged; 0 silent wrong writes |
| Extraction after speech to text: clean TTS audio | Fixture | Script: ElevenLabs TTS to Scribe to interpret | At least 95% critical fields |
| Extraction after STT: noisy audio (shop noise mixed at about 10 dB SNR) | Fixture | Same plus FFmpeg mixing | At least 85% critical fields, everything wrong must be flagged |
| Live human speakers (3 people, 20 sentences each, real shop-like noise) | Manual | Phone | At least 85%; wrong ones flagged |
| Customer resolution | Unit | Vitest plus seeded DB | Two Sharmas always produce chips; unknown name produces New customer |
| Ledger arithmetic, void, advance balance | Unit and DB | Vitest plus Supabase local or test project | Balance equals sum of non-voided entries, always |
| Idempotency (double tap) | Integration | Vitest | Same key writes once |
| Reminder text, wa.me encoding (Devanagari, spaces, ₹) | Unit | Vitest | URL decodes to the exact message |
| UPI string format | Unit | Vitest | `am` has 2 decimals, `pn` and `tn` encoded, `cu=INR` |
| Pay page | E2E | Playwright | Shows name, amount, QR; never shows phone or full balance history; expired token shows a clear message |
| Full loop on mobile viewport | E2E | Playwright (390 px) plus a real Android phone | Speak or type to confirm to stamp to summary to reminder opened |
| Accessibility | Automated and manual | axe, keyboard pass, screen-reader smoke test | No serious violations; focus visible; reduced motion honoured |
| Performance | Manual | Lighthouse on mid-range Android profile | LCP 2.5 s or less on the landing |
| Visual slop check | Manual | 03_DESIGN_SYSTEM section 14 | All 12 questions pass |
| Judge proxy | Manual | ai_judge_prompt_v2.md on the final 5 links in 2 AIs | Planned at least 85 |

## 2. The 20 fixtures (core set)

`customer`, `amount`, `direction` are the critical fields. "Flag" means the app must ask instead of guessing.

| # | Sentence (as spoken) | Expected result |
|---|---|---|
| 1 | Sharma ji ne 500 rupaye udhaar liye | credit_given, Sharma ji, ₹500 |
| 2 | शर्मा जी ने पाँच सौ उधार लिए, आटा कम है | credit_given Sharma ji ₹500, plus stock_low atta |
| 3 | Gupta ji ne 1200 wapas kar diye | payment_received, Gupta ji, ₹1,200 |
| 4 | Sharma ji ne 500 diye | payment_received, Sharma ji, ₹500 (direction trap A) |
| 5 | Sharma ji ko 500 diye | credit_given, Sharma ji, ₹500 (direction trap B) |
| 6 | Dedh sau ka saman Pinky didi ko udhaar | credit_given, Pinky didi, ₹150 |
| 7 | Dhai sau Verma ji ke naam likh do | credit_given Verma ji ₹250, confidence medium, confirm shown |
| 8 | Sadhe teen sau Banerjee babu ne diye | payment_received, Banerjee babu, ₹350 |
| 9 | Chini khatam ho rahi hai | stock_low, chini, no customer, no amount |
| 10 | Sharma ji ka kitna baaki hai? | query_balance, Sharma ji; spoken or shown answer; no write |
| 11 | Sharma ji ne 5000 udhaar liye | credit_given ₹5,000 with second confirmation |
| 12 | Amit Sharma ko 300, R K Sharma ne 200 diye | two intents: credit ₹300 Amit Sharma, payment ₹200 R K Sharma; names resolved correctly |
| 13 | Add 250 credit for Mrs Banerjee | credit_given, Mrs Banerjee, ₹250 (English) |
| 14 | Pichli entry hata do | undo_last; confirm card shows what will be voided |
| 15 | Naya customer Raju, 100 udhaar | new customer chip "Raju", credit ₹100 |
| 16 | Sharma ji ne kal ke 500 diye aur Ramesh ke 200 baaki hain | payment_received Sharma ₹500; second part flagged as a balance statement (direction), not written |
| 17 | Sharma ji 200 diye, Ramesh ko 350 ka saman udhaar, chini kam hai | Sharma: flag direction; Ramesh credit ₹350; stock_low chini |
| 18 | Verma ji teen sau (noise) | amount ₹300 read, direction missing: flag; nothing written |
| 19 | Chai pilao bhai | unknown; nothing written; friendly retry message |
| 20 | Ramesh ko pachaas rupaye ka udhaar, do kilo chini | credit_given Ramesh ₹50 (the "2 kilo" is not an amount); optional stock note not created |

Stretch (not scored): S1 "Banerjee-babu 300 taka dhar nilo" (Bengali) should read credit_given ₹300.

Scoring: for each fixture, each expected intent is correct if customer, amount and direction match, or if the app flagged the uncertain field instead of guessing. A **silent wrong write** (wrong value saved without a flag) is a failure of the whole run, regardless of the percentage.

## 3. Number-word table (unit tests)

| Spoken | Value |
|---|---|
| ek sau, sau | 100 |
| dedh sau | 150 |
| dhai sau | 250 |
| teen sau | 300 |
| sadhe teen sau | 350 |
| paune do sau | 175 |
| pachaas | 50 |
| paanch sau, पाँच सौ | 500 |
| do hazaar | 2,000 |
| dedh hazaar | 1,500 |
| dhai hazaar | 2,500 |
| ek lakh | 1,00,000 (rejected as above ceiling unless confirmed twice) |
| "500", "₹500", "five hundred" | 500 |
| "sau" alone with a customer | 100, confidence medium |

## 4. Audio test set

1. Generate each of the 20 sentences with ElevenLabs TTS in two Hindi voices and one English voice.
2. Mix shop noise (street, fan, music) at 10 dB SNR with FFmpeg.
3. Record the same 20 sentences live from three people (one older, one with a regional accent).
4. Save clips under `tests/fixtures/audio/` with a CSV of the expected result. Use the five juror-mode sample clips from this set: clean, noisy, multi-intent, ambiguous name (#12), direction trap (#4 and #5).

## 5. End-to-end scripts (Playwright)

1. **Happy path:** open sample shop, type fixture 1, see parchi with ₹500, पाँच सौ रुपये, "Udhaar diya", press Likh do, see Stamp, balance 500 more.
2. **Direction trap:** fixtures 4 and 5 show opposite ribbons with words.
3. **Which Sharma:** fixture 12 shows chips; picking one updates the card.
4. **Undo:** fixture 14 voids the last entry; history shows it struck through.
5. **Double tap:** press Likh do twice quickly; one entry exists.
6. **Reminder:** open reminder, the text contains the exact name and amount, the link opens `wa.me` with the encoded message.
7. **Pay page:** token page shows QR; wrong token shows a clear error; expired token shows expiry.
8. **Fallbacks:** mic blocked, then typed input works; STT forced to fail, then typed fallback message appears; LLM timeout, then retry message.
9. **Reduced motion:** no movement, same information.

## 6. Manual QA checklist

- [ ] Real Android phone, Chrome, mobile data, mic permission denied, then granted
- [ ] iOS Safari (mic permission and `mp4` recording work)
- [ ] Glare test outdoors: can you read every amount?
- [ ] One-handed use: Bolo reachable with a thumb
- [ ] Hindi text: no clipped matras in headlines, correct line height
- [ ] Indian digit grouping everywhere
- [ ] Voided entries never counted in totals
- [ ] Demo banner visible on pay page
- [ ] Nothing says "paid" unless Mark as received was pressed
- [ ] No keys, phone numbers or private data in the repo, logs or screenshots

## 7. Stage rehearsal checklist (run 10 times)

- [ ] Hotspot ready as primary network, venue Wi-Fi as backup
- [ ] Phone volume, mic permission and battery checked
- [ ] Sample shop reset to the seeded state (script `reset-demo`)
- [ ] Live voice run: sentence 1, then sentence 5 (direction trap), then reminder
- [ ] Typed fallback run
- [ ] Sample clip run
- [ ] Prerecorded screen capture queued as the last resort
- [ ] Time the pitch: 2:50 or less

Pass criteria: 9 of 10 runs complete without fallback, 10 of 10 complete with fallback.

## 8. Real-user test protocol (the biggest score lever)

1. Ask a shopkeeper for consent in plain language: what we record, why, that the demo shop data is fictional, that they can stop and ask for deletion.
2. Let them speak naturally; do not read a script. Capture 3 entries.
3. Measure: entries understood correctly, time per entry, whether they needed help, one sentence of what they would change.
4. Save raw notes in `docs/05_LOG.md`; keep the video only with written or recorded consent.
5. Use real quotes only. Never fabricate a testimonial.

## 9. Exit criteria for submission

All P0 acceptance criteria in 01_PRD.md pass; the 20-fixture gate passes; the rehearsal gate passes; the 5 links open without a login; the judge proxy re-run is at least 85 planned.

## 10. Results of the 2026-11-01 build run (measured, local, keyless)

| Gate | Result | How to re-run |
|---|---|---|
| 20 utterance fixtures, offline rules interpreter | 20 of 20 pass; plus a test that no flagged intent is ever writable (21 tests in the file) | `pnpm vitest run tests/fixtures` |
| Unit tests (number table, money, resolve via fixtures, ledger, proposal tokens, remind, UPI, pay tokens, adapters with mocked HTTP, gates, contrast) | 119 tests in 8 files pass (includes the 21 fixture tests) | `pnpm test` |
| End to end (Playwright, 390 px, keyless app) | 18 pass: the nine scripts in section 5 (script 8 split into three), Badlo edit, forged proposal and cross-site POST refused, plus axe on 5 pages | `pnpm test:e2e` |
| axe (WCAG 2.2 A and AA tags) on landing, shop home, customer page, pay page, /try | no serious or critical violations | included above |
| Design-token contrast | all pairs meet the minimums in 03 section 3 | `pnpm test` |
| `pnpm check:slop`, `pnpm check:secrets` | pass; both are proven able to fail by `tests/unit/gates.test.ts` | `pnpm check:slop` |
| `pnpm verify:assets` | 24 checks (posts, captions, deck and PDF, ad via ffprobe, CC0 credits with computed stamp offset, screenshots, setup files); the final run is quoted in `docs/05_LOG.md` | `pnpm verify:assets` |

Not run here (need keys or a device): STT accuracy on clean and noisy audio (sections 1 and 4), live speakers, Lighthouse, real Android and iOS, 10-run rehearsal, judge proxy on live links. The expired-token page, a forced speech-to-text failure and an LLM timeout are covered by unit tests with mocks; the end-to-end fallbacks are: mic blocked (8a), keyless speech-to-text message (8b) and a sample clip (8c).

The e2e script 3 (which Sharma) uses fixture 1 ("Sharma ji ne 500 rupaye udhaar liye"), because fixture 12 resolves both names exactly. Fixture 12 is covered by the fixture test.
