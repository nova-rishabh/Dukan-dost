# Independent simulated judge: investor lens

Date: 2026-11-01. This is an independent subagent simulation of the investor perspective described in docs/00_INFO.md, not Prashant Sinha's views or an official jury score. No prior self-review or other simulated judge scores were read. No tests or deployment were run by this judge.

Rubric source: ../ai_judge_prompt_v2.md and docs/00_INFO.md. The prompt originally evaluated unbuilt ideas; this review adapts its two-score rule to **current repository/package evidence** versus **conditional evidence-backed presentation**. Future scores are scenarios, not earned points. Only Dukaan Dost is assessed.

## Verdict

A credible, unusually careful voice-to-credit workflow; the investment story is still a hypothesis, and the submission package undersells the engineering by leaving the public try path and evidence stale.

| Category | Current | Conditional with specified proof | Max | Why points are lost / evidence needed |
|---|---:|---:|---:|---|
| Problem and idea | 15 | 17 | 20 | Clear counter-time and collection problem, defined user and recognizable workflow. No observed shopkeeper demand, willingness-to-pay result, distributor agreement or verified advantage over a close alternative. A short consented real-shop task study and concrete pricing conversations would raise this. |
| Product works | 21 | 23 | 25 | Reported 222 unit/fixture, 48 daemon and 45 browser passes plus real ElevenLabs/Gemini smoke calls are strong local evidence. Source shows deterministic checks, signed confirmation, void history and durable uncertain-send protection. Public URL, physical phone use, real WhatsApp receipt and measured noisy-speech accuracy remain unverified. |
| Website, social and ad | 14 | 17 | 20 | Landing and first social post inspected visually: specific bahi/parchi/stamp language, clear direction example. But post CTA is literally {{APP_URL}}; deck QR is a placeholder; ad review records unresolved rendering/audio-listening issues. All five items must be independently accessible and finished. |
| Pitch and clarity | 13 | 17 | 20 | Existing sequence communicates a closed loop and truthfully marks commercial hypotheses. Actual deck still says 149 unit/22 end-to-end tests, contradicting current report, and has an obsolete “WhatsApp API later” narrative. No timed rehearsal or real-user proof. Update only observed claims and demonstrate under 3 minutes. |
| AI use and craft | 12 | 13 | 15 | Rules-first extraction plus live STT/model capability, explicit ambiguity and human-write boundary is real application craft. It is not merely a chat box. No full live speech evaluation or proof that the model handles natural noisy shop utterances reliably; the six-second LLM fallback can hide model failure. Show a small clean/noisy accuracy/latency table, separate model and rules paths. |
| **Total** | **75** | **87** | **100** | Current = 15+21+14+13+12. Conditional = 17+23+17+17+13. |

Score confidence: medium for repository-assisted assessment; low for predicting actual competition results. Judges may value evidence and live execution differently. A 90+ score is not justified by the supplied proof.

## Five-link-only assessment

**65/100 provisional artifact-readiness estimate** (14 problem + 17 product + 13 marketing + 11 pitch + 10 AI). This is a separate view, not an extra deduction from 75 and not a score of actual reachable links: those links were not provided/verified. A links-only juror cannot credit unseen code/tests and will notice placeholder CTAs and stale deck evidence.

A concrete access trap is visible in src/app/try/page.tsx: a real-shop deployment redirects /try to /shop and thus its login flow. The public demo therefore needs an explicitly separate fictional demo deployment/path that remains available without owner credentials. Do not expose a real ledger just to let judges try it. Having source code on GitHub does not satisfy this experience.

## Why not ChatGPT or Gemini?

**Strong workflow answer:** a general chat session does not provide this shop's persistent customer identity, derived balance, signed reviewed write, reversal history and owner-confirmed reminder/pay-link action in one auditable counter workflow. That is an integration advantage, not yet a proven competitive moat or distribution advantage.

Closest alternatives named in the project: Khatabook, OkCredit, Vyapar and myBillBook. Their current features and any voice-first alternatives are **unverified in this review**. Do not claim “first,” “better” or that competitors lack voice.

## Hard jury questions

- Investor: **“Who has used it, who pays, and why does this become a business rather than another free khata?”** Truthful answer: “We have validated the workflow locally, not willingness to pay; our next test is shopkeepers completing three counter tasks and then choosing whether a specific collection/backup benefit is worth a paid pilot.”
- Ads founder: **“What should I remember after 30 seconds?”** Answer: “One word reverses the money; Dukaan Dost shows the direction, waits for your tap, then stamps the entry.”

## Highest-value improvements before judging

1. **Finish the five-link package and rehearse its actual access path.** Deploy a fictional no-login demo, replace all URL/QR placeholders, refresh deck/screenshots/numbers, check all links in a private mobile browser. Plausible uplift **3–5 points**, shared across product/marketing/pitch; not additive to other uplift ranges.
2. **Obtain one small piece of real workflow proof.** With consent and fictional customers, film a shopkeeper making three unaided entries, one correction and a reminder preview; record errors, assistance and latency. Separately complete one authorized real WhatsApp receipt on the owner's test number and label payment status honestly. Plausible uplift **4–7 points** if results support the story. A good outcome is not guaranteed.
3. **Replace roadmap breadth with a concise buyer/evidence story.** Rehearse a 2:45 pitch showing voice → parchi → confirm → khata → reminder, the ne/ko trap, current measured proof and a precise ten-shop/pricing experiment. Correct obsolete deck/Q&A claims first. Plausible uplift **2–4 points**, overlapping the first two.

Inventory, a full dashboard and public multi-shop signup are legitimate product roadmap work, but adding them before jury evidence is finished likely earns fewer immediate points than proving the core collection loop. Do not present unbuilt quantity inventory or public accounts as shipped.

## Stage risk and fallback

Most likely failure: venue network/mic or slow provider output breaks the short demo. The fallback order is typed sentence → clearly labelled fictional sample → explicitly labelled prerecorded run. Test the real phone ahead of time and keep the reminder ending; a fallback must not masquerade as live AI.

## Safety and trust

Financial misinterpretation, wrong recipient and ambiguous delivery remain material risks despite safeguards. Show amount and direction in words, require confirmation, keep void history, use explicit recipient preview, never auto-retry uncertain delivery, and never equate a pay link with settlement. Unofficial WhatsApp transport is an acknowledged pilot dependency; it is not proven production infrastructure. Real user filming needs consent and fictional customer data.

## What exceptional proof would require

- Repeated unaided use in real shops with measured counter-time/error/collection outcomes and honest limitations.
- A dependable public demo and real-phone collection flow, measured across noisy speech and network/provider failure cases.
- Demonstrable differentiated value plus real buyer/channel evidence; no unsupported competitor, payment or adoption claims.

## Evidence inspected

- ../ai_judge_prompt_v2.md; docs/00_INFO.md, 17_HANDOFF.md, 21_TEST_REPORT.md and 07_DEMO_AND_PITCH.md.
- deliverables/deck/index.html; deliverables/social/captions.md; actual post-1-ne-ya-ko.png; landing-1440.png.
- src/app/try/page.tsx; src/lib/interpret.ts; src/server/sendReminder.ts; src/components/ShopHome.tsx.
- deliverables/ad/REVIEW.md was read as a limitations record. The rendered ad was not watched/listened to by this judge, so its current audio/pacing quality is not certified.
