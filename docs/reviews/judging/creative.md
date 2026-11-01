# Simulated creative/ads judge

Date: 2026-11-01. Independent subagent assessment using the creative-founder lens described in docs/00_INFO.md. This is not Manan Khaneja's opinion, an actual jury result, or a prediction with statistical confidence. I did not read the prior self-review or other judges' scores. I did not run the app, listen to the ad, watch full-speed playback, verify public links, or rerender the deck/video. Parent runs verification separately.

Verdict: a recognizable, demonstrable product with a strong trust hook, but the current submission package still visibly says “unfinished” at the moment a viewer should act.

## Scores

The original prompt concerns planned ideas. Here “current” means the built repository and delivered artifacts available today; “conditional” means after the evidence/packaging changes below are actually completed and checked. The second column is potential, not earned points.

| Category | Current | Conditional | Max | Reasons and evidence that would raise it |
|---|---:|---:|---:|---|
| Problem and idea | 15 | 16 | 20 | Busy hands and awkward debt collection are clear in the deck/social narrative. No observed shopkeeper behavior, willingness-to-pay evidence or validated differentiation. A short consented unaided shopkeeper session would make the problem concrete. |
| Product works | 21 | 23 | 25 | docs/21_TEST_REPORT.md reports 222 unit/fixture, 48 daemon and 45 browser passes, a closed confirmation/reminder/pay-page workflow, and two live provider smoke checks. This is stronger than screens alone. No real-phone end-to-end run or real WhatsApp receipt is demonstrated, and no public product link is verified. A timed phone demo with a safe authorized recipient and the typed fallback would raise confidence. |
| Website, social and ad | 12 | 16 | 20 | Visually coherent Haldi/Syahi, product-first landing, three posts with distinct jobs and an unmistakable stamp. All three social PNGs visibly retain {{APP_URL}}; deck slide 4 says “QR after deploy”; inspected ad end frame retains {{APP_URL}}. Stored ad frames at 12.5s and 21.5s show soft, poorly framed UI/cropped reminder and a large empty lower band. Replace links and QR, recapture the decision moment tightly, and review playback/audio on a phone. |
| Pitch and clarity | 13 | 17 | 20 | The voice → parchi → confirm → reminder story can fit three minutes. But deck slide 6 still says 149 unit/22 e2e checks rather than the current measured totals; slide 8 says WhatsApp API is wholly future while owner-confirmed service sending now exists. Current privacy Q&A in docs/07 still says there is no login. No timed rehearsal evidence. Refresh the truth, simplify the story, and rehearse under 2:50. |
| AI use and craft | 11 | 12 | 15 | The general-AI objection is answered by durable customer state and confirmed real-world actions. Direction ambiguity and which-Sharma are more convincing than “AI-powered.” Two live smokes are not a clean/noisy accuracy study. A compact measured live set, showing one uncertainty safely resolved, would increase craft credibility. |
| **Total** | **72** | **84** | **100** | Conditional score requires observed completion, not a roadmap promise. |

## Artifact observations

- Visually inspected all three social PNGs, docs/screenshots/landing-1440.png, and stored ad frames f375_t12.5.png, f645_t21.5.png, f810_t27.png. Read deck HTML, captions, ad review/meta, current test report and handoff.
- Post 1 (“Ne ya ko?”) is the strongest piece: one word reverses the money direction, and the app shows the consequence before writing. It is specific and immediately useful. The yellow/white/red-green contrast supports comparison without hiding the words.
- Post 2 shows the ledger metaphor well, but sells “same entry, different input” more than a compelling benefit. Its captured UI is visibly softer than the hand-drawn half.
- Post 3 communicates collection, but the large WhatsApp bubble plus full pay-page screenshot becomes dense on a small feed. Its caption “Paid aap khud mark karte hain” should be precise: the owner records a payment only after it is actually received, not after a link is opened.
- The landing screenshot leads with an actual parchi and a real interaction, which is stronger than a mascot hero. Keep Munshi as guidance; do not displace the product with an avatar-first redesign.
- Ad frame 12.5s says “first the slip appears,” but its captured area mostly shows the bottom of the customer list and controls rather than the complete slip. That is a communication failure in the proof moment. Reframe around the full customer/amount/direction decision.
- The ad frame 21.5s has a cropped captured reminder behind a stylized chat card and a stray-looking blue ring near Send. It is hard to tell what was really clicked and what is illustration. Use one unambiguous capture and retain the owner-send explanation.
- The dark lower band occupies about a fifth of the inspected video stills without useful content. It consumes valuable mobile screen area; either put readable captions there or reclaim it for the action. I did not assess motion/audio quality firsthand.

## Five-link-only assessment

**Artifact-only proxy: 63/100**, if a juror sees the unchanged package without a presenter or repository test explanations. This is a separate presentation/readiness estimate, not another official category or part of the 72 total. The actual public five-link submission is unverified, so I cannot score actual link accessibility. The reason for the lower estimate is that placeholders block the next step, the strongest new reliability evidence is absent from the deck, and the ad's proof moment is difficult to read. I would not submit the current package as final even though the locally tested product is credible.

## Hook and jury questions

Strongest hook: “One word can reverse the money. We show you before we write.” Show ne/ko, the amount in digits and words, then the stamp. The emotional promise is confidence at the counter; the practical close is the polite reminder.

Why not ChatGPT? A general chat can interpret a sentence, but this product binds that interpretation to the correct customer's persistent account and a confirmed, auditable write/reminder workflow. Rating: strong as a demonstrable workflow; weak if the presenter shows only a chat response.

Ads question: “What single thing should the audience remember, and what do they do next?” Answer: “The stamp means I reviewed the amount and direction; scan this working demo QR to try the same entry without a login.” The working QR is a required fix before using that answer live.

Investor question: “Why would a shopkeeper change habits or pay?” Answer: “We have not proved either yet; the next test is whether shopkeepers can record three entries unaided and choose to reuse it, followed by a real price test.”

Closest alternatives named in project materials: Khatabook, OkCredit, Vyapar and myBillBook; their current feature comparison was not verified in this evaluation. Specific voice-ledger names mentioned in the repository are unverified and should not be presented as an audited competitive set.

Stage risk: live network/mic latency can consume the story. Prepare the exact same sentence as typed fallback, then a sample, then a labelled recording. Do not spend stage time opening account settings, inventory plans or test logs.

## Highest-impact next changes

1. **Finish the action path:** confirm the public demo, replace every {{APP_URL}}, produce real QR, and test all five links in a private mobile session. Estimated creative/readiness benefit: roughly +3–5 overall points; not guaranteed and not additive with the next fixes. It removes the most visible unfinished signal.
2. **Recut proof, not decoration:** full sharp parchi → explicit tap → stamp → clear reminder; fix crop/ring/lower-band issues, listen to the complete mix and check captions on a phone. Refresh deck screenshots/counts/claims and rehearse the matching 2:50 pitch. Estimated benefit: +4–7 overall points, overlapping packaging/clarity gains. A coherent artifact refresh is plausible in one focused afternoon; final video export and human listening are required.
3. **Capture one real, truthful proof session:** a consenting shopkeeper attempts three fictional-data entries unaided, including an ambiguity and a reminder draft. Record outcome and timing; do not invent a positive result or substitute generated footage. Estimated benefit: +2–5 overall points if the session actually demonstrates usefulness. Participant availability is an external dependency, not an assumed afternoon deliverable.

More screens, inventory and public signup are useful product-roadmap work, but they are not the highest-scoring afternoon changes under this rubric. They add stage risk and will not fix an unusable CTA or missing user proof.

## What an exceptional submission would require

- Accessible, consistent five-item package with a working product/demo link and no template remnants or stale claims.
- A reliable phone demonstration plus consented real-user behavior and measured speech/error results, with uncertainty handled visibly.
- Verified differentiation and a credible first distribution/payment experiment, presented through one memorable three-minute story rather than a feature list.

Safety deductions are avoided only while owner confirmation, fictional/demo labels, accurate payment wording and dramatisation disclosure remain visible. Do not remove them to make the ad appear more seamless.
