# Self-review against our own judge prompt (2026-11-01)

Applied `ai_judge_prompt_v2.md` rules to the finished Dukaan Dost only (Idea B), as an honest proxy. This is the builder grading its own work, so treat it as a lower-trust signal than a second AI or a human. Calibration per the prompt: 55 to 70 typical good, 75 to 85 very strong.

**Verdict.** A working, safety-minded voice-first udhaar ledger with a closed loop (sentence, parchi, Likh do, stamp, ledger, WhatsApp draft, pay page) that runs with no keys. The weakest parts are proof: no real user, no live speech or Gemini measurement, not deployed, ad footage for shots 1 and 2 still stand-ins.

| Category | Planned | With proof | Max | Reason | Evidence that raises it |
|---|---|---|---|---|---|
| Problem and idea | 13 | 15 | 20 | Real, large need (udhaar, chasing money). Competitors exist (Khatabook, OkCredit, Vyapar and voice ledgers whose features we did NOT verify), so differentiation is argued, not shown. | A real shopkeeper using it unaided; a verified comparison of the closest voice ledger |
| Product works | 18 | 21 | 25 | Whole loop passes 18 end-to-end checks, 20 of 20 fixtures offline, nothing writes without a signed, confirmed proposal. But live mic to Scribe to Gemini has never run (no keys), and the app is not deployed. | `pnpm verify:live` green, a phone run on mobile data, 10 rehearsals |
| Website, social and ad | 14 | 16 | 20 | Landing hero is the live parchi with the stamp; three distinct posts; 30 s ad with real app captures and CC0 sound aligned to the stamp frame. Shots 1 and 2 are typographic stand-ins; nothing is hosted at a public link yet. | Flows clips in shots 1 and 2, public URL on all five links |
| Pitch and clarity | 12 | 15 | 20 | Eight-slide deck with measured numbers and honest gaps; no pitch has been rehearsed or timed. | Two timed rehearsals under 2:50; real quotes |
| AI use and craft | 10 | 11 | 15 | Rules-first hybrid, number-word and idiom parsing, direction logic, amount cross-check, which-Sharma resolution, hard gate between model and ledger. The LLM path is untested live, and a rules engine is less "AI" than a model. | Measured live accuracy on the 20 sentences, clean and noisy audio |
| **Total** | **67** | **78** | 100 | | |

**Why not ChatGPT or Gemini?** A general AI cannot keep a per-customer ledger, resolve which Sharma, refuse to write unconfirmed money, or open WhatsApp with a pay link. Rating: moderate to strong (workflow, data and a real-world action), but only if the demo shows the reminder.

**Biggest on-stage risk.** Venue network or mic. Fallback ladder already built: type, sample clip, recorded screen capture.

**Two hardest questions.** Investor: "Why would a shopkeeper pay and who sells it?" Answer: unproven; free ledger, paid reminders through distributors; next step is ten shops. Ads founder: "What is the one image people remember?" Answer: the stamp landing on the parchi.

**Closest alternatives.** Khatabook, OkCredit, Vyapar, myBillBook. Voice-first products reported by a judging AI (LekhaBook, DukanAI, Hisaab Babu, Vyop): unverified.

## Lowest-scoring lines and what the owner can still improve
1. Proof (affects every category): run `pnpm verify:live`, then test on a real phone and record the result.
2. Ad: make shots 1 and 2 in ElevenLabs Flows (`deliverables/ad/FLOWS_PROMPTS.md`).
3. Deploy, then replace `{{APP_URL}}` in posts, captions and deck.
4. Rehearse and time the pitch.

## Not verified (said plainly)
- Live ElevenLabs Scribe, ElevenLabs TTS, Gemini and Supabase calls. Request shapes follow `docs/14_API_FACTS.md` and are covered by mocked-HTTP tests only. The TTS model for Hindi and the Gemini JSON-output call path are the least certain.
- Real Android phone, iOS Safari, outdoor glare, Lighthouse LCP.
- `modern-web-guidance` was not run (blocked by the permission classifier; see ADR-021).
- Nobody listened to the ad's sound or played it at speed; it was measured and inspected frame by frame. No 16:9 cut.
- Hindi and Hinglish copy has not been read by a native speaker.
- Competitor features, willingness to pay, channel.

## What a 100 would require
- A real shopkeeper using it unaided on video, plus live-measured accuracy.
- A public, rehearsed demo on a real phone with all five links live.
- A verified, demonstrable edge over the closest voice ledger.
