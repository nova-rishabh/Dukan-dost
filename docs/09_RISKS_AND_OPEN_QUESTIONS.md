# Risks, assumptions and open questions

## 1. Risk register

Likelihood and impact: L (low), M (medium), H (high).

| # | Risk | L | I | Mitigation | Early warning |
|---|---|---|---|---|---|
| R1 | STT mishears Hindi names or amounts in a noisy room | H | H | Number cross-check, amount in words, always confirm, typed and sample fallbacks | Fixture accuracy under 85% on noisy audio |
| R2 | Direction error (ne versus ko, missing particle) | M | H | Verb and particle rules, flag when unclear, direction in words, trap fixtures | Any silent wrong write in tests |
| R3 | Judge says "another khata app" | H | H | Lead with voice to collection; show direction trap, which-Sharma, confirm; honest comparison table | AI-judge proxy scores Problem under 15 |
| R4 | A voice-ledger competitor is nearly identical | M | H | Verify competitors tonight; adjust claims; never say "first" | Competitor check turns up a near clone |
| R5 | Venue network fails | M | H | Hotspot, cached sample clips, replay mode, prerecorded capture | Rehearsal on weak 4G fails |
| R6 | Free-tier rate limits hit while the AI juror tests | M | M | Cache sample results, per-IP limits, static replay mode | 429 errors in logs |
| R7 | LLM returns invalid JSON or is slow | M | M | Zod validation, one retry, 6 s timeout, typed fallback message | p95 interpret over 3 s |
| R8 | Hindi text renders badly (clipped matras, wrong font) | M | M | Test Yatra One and Hind on real phones early; fallback to Noto Sans Devanagari | Visual QA on Android |
| R9 | Scope creep (poster, Bengali, TTS, auth) before P0 is solid | H | H | Strict cut lines in 10_BUILD_PLAN; P1 only after P0 passes | P0 not green by the checkpoint |
| R10 | Real-user test not done | M | H | Book a shopkeeper tonight; backup is a family member who runs a shop, clearly labelled | No consent and slot by tomorrow morning |
| R11 | Privacy slip (real names or numbers in demo data, keys in repo) | L | H | Fictional demo data, Doppler, secret scan before push, masked logs | Any real number in a screenshot |
| R12 | Design drifts into AI-slop under time pressure | M | M | 03 section 14 checklist before every screen ships; one memorable moment only | Gradients or cream creep in |
| R13 | Teammate or time shortage | M | H | Cut P1; make the juror mode and fallback the first thing built | Not enough hands at 14:00 |
| R14 | Mic permission blocked in the demo browser | M | M | Typed input visible by default; sample clips; test the exact device | First permission prompt fails |
| R15 | Pay link misread as real payment | L | H | Demo banner, no "paid" without Mark as received, honest pitch wording | Anyone says "it collects payment" |
| R16 | Time: only 2.5 hours in the official window | H | H | Start building tonight (allowed by the deck's head start) and keep the window for polish, rehearsal and submission | Core loop not demoable by morning |

## 2. Assumptions (change these and the plan changes)

1. We are allowed to start building tonight (the deck's head-start slide lists product, website, social posts and video).
2. Hindi and Hinglish are the main languages for the demo audience; Bengali is a stretch.
3. The jury and the AI juror can open a public web link with no login.
4. ElevenLabs Scribe handles Hindi and Hinglish well enough for the demo (to be measured, ADR-004).
5. WhatsApp click-to-send is acceptable instead of API sending.
6. The demo shop's data is fictional; one real shopkeeper test is optional but strongly recommended.
7. Competitor features listed by judging AIs (LekhaBook, DukanAI, Hisaab Babu, Vyop, ScamVax and others) are unverified until we check them.
8. The Student Pack and existing credits cover the free tiers we need; limits to be checked on each dashboard.

## 3. Things we must verify (and who does it)

| Item | How | By when |
|---|---|---|
| Real features of 4 named voice-ledger competitors | Open each product page and screenshots; note what we can show that they cannot | Tonight |
| ElevenLabs Scribe accuracy on Hinglish with noise | The 20-sentence audio test | Before building UI |
| Bengali support quality | Same test with 5 Bengali sentences | Only if language question says yes |
| Google AI Studio free-tier limits and the current Flash model id | Dashboard | Before build |
| That `wa.me` opens correctly with Devanagari text on Android | Real phone test | Early build |
| UPI deep link behaviour across GPay, PhonePe, Paytm | Phone test with ₹1 | P1 |
| Contrast ratios in section 3 of the design system | Contrast tool | First UI pass |

## 4. Open questions for you

Blocking before build:
1. **Team:** are you building alone, or with others? Who films the real-user clip and who presents?
2. **LLM key:** do you have a Google AI Studio key (free) or an Anthropic API key? I would default to Gemini Flash.
3. **Language:** Hindi and Hinglish only, or add Bengali (Kharagpur shopkeepers)? Which language do the shopkeepers you can reach actually use?
4. **Real shopkeeper:** can you reach one tonight or tomorrow morning (Tech Market near campus, or a family member)? This is the biggest score lever.

Non-blocking (defaults in brackets):
5. **WhatsApp:** is click-to-send acceptable instead of the API? [yes]
6. **Domain:** a free student-pack domain, or a subdomain of one you own? [subdomain]
7. **Demo device:** phone, laptop, or both on stage? [phone, mirrored]
8. **Deck tool:** Canva, an HTML slideshow, or PowerPoint? [HTML slideshow plus Canva visuals]
9. **Logo:** are you fine with a stamped "दो" circle mark? [yes]
10. **Name:** keep "Dukaan Dost" (also spelled दुकान दोस्त)? [yes]

## 5. Ethics and responsibility notes

- The app makes financial records. It must be transparent about what it heard and what it will save.
- Customer data belongs to the shopkeeper; we store the minimum, mask phone numbers, never store audio, and provide deletion.
- Reminders can embarrass people. The owner always sends them; the default tone is polite.
- Do not use real people's names, phone numbers or voices in demos without consent.
- No cloned voices.

## 6. Answers received 2026-11-01
1. Team and clips: video clips will be made with ElevenLabs Flows and HyperFrames. (ADR-017)
2. LLM: Gemini. (ADR-019)
3. Bengali: not needed. (ADR-019)
4. Real shopkeeper: not used; AI-made clips and simulated sessions instead. R10 is replaced by R17 below.

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R17 | No real-user proof, so the Problem and Pitch scores rely on honest measured evidence | H | M | Report fixture results and simulated sessions plainly; label dramatisations; state the ten-shop test as next step; never invent a testimonial |
| R18 | Live accuracy with Gemini and Scribe is unmeasured until keys are added | H | M | Rules-first interpreter covers the fixtures offline; `pnpm verify:live` measures the rest |
| R19 | AI-generated shop footage looks fake or off-brand | M | M | Use Flows clips sparingly; lead with real product captures and motion graphics |
