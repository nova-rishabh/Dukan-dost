# Independent AI juror proxy

Date: 2026-11-01. Simulated assessment, not the actual event AI's result. Only Dukaan Dost was evaluated. The rubric is taken from `../ai_judge_prompt_v2.md` and `docs/00_INFO.md`: 20/25/20/20/15. I did not read the previous self-review or the other proxy judges' scores.

## Verdict

A credible, unusually careful voice-ledger prototype whose tested core is stronger than its submission package; the biggest deductions come from missing field evidence and unfinished public-facing proof, rather than a shortage of new features.

## Scoring basis

The current column scores what this repository actually demonstrates, with access to source, current test report and local artifacts. It is not a promise about the live deployed product. The conditional column is a hypothetical reassessment after the listed evidence/packaging improvements; those points are not earned yet. The original prompt's pre-build Planned/With-proof framing has been adapted to Current/Conditional because this product already exists. No credit is assigned to planned public signup, measured inventory, full English UI or a future reporting dashboard.

| Category | Current | Conditional | Max | Evidence and deductions | Evidence that raises it |
|---|---:|---:|---:|---|---|
| Problem and idea | 15 | 17 | 20 | The counter-entry and collection problem is concrete and the user/buyer is identifiable. No observed shopkeeper task evidence, willingness-to-pay test or verified competitive comparison is supplied. A familiar ledger category needs a demonstrated edge, not a novelty claim. | One consented shopkeeper completing three entries unaided, a documented result and a narrow verified comparison. |
| Product works | 21 | 23 | 25 | `docs/21_TEST_REPORT.md` records 222 unit/fixture, 48 daemon and 45 browser tests, backup rehearsal, smoke-tested live STT/TTS/Gemini and stage fallbacks. `Parchi.tsx` and `sendReminder.ts` demonstrate confirmation, duplicate safeguards and conservative uncertain delivery. Deduct for no observed production/physical-phone run, no real WhatsApp receipt, and only two live provider smoke scenarios. | Verify the actual public sample URL on mobile data, rehearse the full loop, and record one explicitly authorized real delivery without claiming settlement. |
| Website, social and ad | 13 | 17 | 20 | Inspected the landing screenshot and post-1 PNG: the parchi/stamp is distinctive and the direction-trap post teaches a specific benefit. The actual PNG still renders `{{APP_URL}}`; captions and deck also contain placeholders. Ad review records softness and unlistened voice-over. These prevent a submission-ready package despite good visual direction. | Replace every placeholder with a verified URL, export fresh outputs, inspect the ad on a phone and listen/review the voice-over. |
| Pitch and clarity | 13 | 17 | 20 | The pitch has a coherent three-minute loop and honest business hypotheses. Actual deck HTML still says 149 unit tests and 22 E2E checks, while the current report says 222 and 45. The QR slide is a placeholder; no timed rehearsal or real-user proof is documented. | Refresh proof slide and screenshots, distinguish smoke tests from accuracy, add a real QR and perform two timed rehearsals under 2:50. |
| AI use and craft | 12 | 13 | 15 | `interpret.ts` uses rules-first extraction, a bounded LLM fallback and forced direction clarification on model financial output; the workflow acts on persistent data only after human confirmation. This is stronger than a chatbot wrapper. Live robustness/accuracy on representative clean and noisy speech remains unmeasured; the live Gemini smoke was noticeably slow. | Measure the full 20-case critical-field task with clean/noisy live audio, report errors/clarifications and latency honestly, and show one nontrivial LLM-assisted case safely. |
| **Total** | **74** | **87** | **100** | Current: 15+21+13+13+12. Conditional: 17+23+17+17+13. | Conditional total requires the evidence above, not merely more screens. |

Confidence: medium in the relative strengths/deductions, low in any prediction of the actual judges' numeric scores. These are subjective proxy scores, not an independently calibrated prediction model. The conditional scenario may require arranging a participant and recipient, not just one afternoon of coding.

## Five-link-only assessment

Actual external accessibility of the five submitted links was not verified in this review. Therefore I cannot award an observed public-submission score. If the current local artifacts were served unchanged, my tentative artifact-only proxy is **65/100** (14 idea +17 product +12 media +12 pitch +10 AI). A juror who cannot inspect source/tests would miss much of the engineering evidence and would encounter placeholder CTAs, the QR placeholder and stale proof numbers. This alternative view must not be averaged with the main 74 or treated as a second vote.

The shortest repair is to make a five-link evidence package that explains itself without a presenter: one-click fictional sample, a short complete-loop capture, current proof slide, three useful posts, and the final ad. Do not route a visitor through operator setup to try the product.

## Why not ChatGPT/Gemini?

A generic prompt does not provide this shop's persistent per-customer ledger, signed confirmed writes, disambiguation, reversible history and an owner-reviewed collection handoff; **strong at the workflow layer**, while market differentiation from other dedicated ledger apps remains unproven.

Closest alternatives mentioned in project material are Khatabook, OkCredit, Vyapar and myBillBook; their current capabilities were not independently researched here. Other named voice-ledger competitors remain unverified. Do not repeat claims that competitors are necessarily tap/type-only without checking them.

## Safety and stage risk

The most serious risk is financial misinterpretation or duplicate collection messaging. Confirmation with amount/direction words, large-amount confirmation, signed proposals, void history, owner-triggered reminders and retained uncertain-delivery reservations are good mitigations. They do not establish perfect accuracy, bank settlement or externally exactly-once delivery. Public multi-shop isolation and signup are not implemented, and the unofficial WhatsApp transport remains an operational risk accepted in the project notes.

On stage, the largest risk is voice/network latency interrupting the closed loop. Choose the fallback immediately: live voice → typed identical sentence → labelled sample transcript/clip → labelled recorded capture. The sample path is not evidence of live STT accuracy. Show the reminder/pay view before spending time on settings, inventory plans or the test count.

## Two hardest jury questions

- Investor: “What makes an existing ledger user switch, and who pays?” Best truthful answer: “We target the busy counter and demonstrate direction-safe voice-to-collection; switching, pricing and channel demand are still hypotheses we will test with ten shops.”
- Ads founder: “What will a shopkeeper remember after five seconds?” Best truthful answer: “The owner speaks, sees the money direction, taps once, and the red ‘लिख लिया’ stamp lands—our ad will show that exact loop and a working try link.”

## Highest-impact next changes

| Priority | Action | Plausible impact on this proxy |
|---|---|---|
| 1 | Verify the public sample URL and all five items; remove placeholder URL/QR, update deck proof counts, export and check links in a private mobile session. | Roughly +4–7 points across Product/Media/Pitch. |
| 2 | Capture a real consenting shopkeeper doing three entries, plus an authorized real reminder receipt and a compact clean/noisy speech result table. | Roughly +4–8 across Problem/Product/AI/Pitch; no points for invented testimony. |
| 3 | Rehearse a 2:50 pitch twice; listen to the voice-over, repair the soft/clipped ad moments and use the direction trap as the opening creative hook. | Roughly +2–4 across Media/Pitch. |

Ranges overlap and are **not additive**. They are judgment estimates, not guaranteed score gains. For this competition, finishing proof and packaging has higher immediate value than expanding into a large inventory or dashboard build. Those roadmap features can improve the product later but do not substitute for a working three-minute demonstration.

## What a near-perfect submission would require

- Independent user evidence, verified differentiation and a plausible measured buyer/channel signal.
- An accessible, robust live demonstration with representative speech accuracy/latency, physical-phone evidence and truthful failure recovery.
- Five complete public artifacts, a memorable inspected/listened ad, fresh proof, and a rehearsed pitch with no unsupported claims.

No 100 is awarded. Only one idea is in scope, so no cross-idea ranking or recommendation to drop another idea is justified. My bet is on completing this existing closed loop, with medium confidence, rather than adding broad features before submission proof is ready.

## Review limits

Read rubric/local jury notes, current test report/handoff, deck HTML, social captions, `Parchi.tsx`, `interpret.ts`, `sendReminder.ts`, locale disclosure, ad metadata and local screenshots. Visually inspected landing and post-1 PNG. Did not run new tests, open a deployed URL, play/listen to the ad, independently verify competitors or interview a shopkeeper. Parent agent is responsible for the required final verification run.
