# Demo, pitch and content plan

Goal: the jury sees one complete loop that works, in under three minutes, and the AI juror can see the same thing from five links without us in the room.

## 1. The 3-minute pitch

Structure follows the rubric. Spoken in English with Hindi sentences for the product moments.

| Time | Beat | What is on screen | What we say (draft) |
|---|---|---|---|
| 0:00-0:20 | The problem, shown | Photo or video of a real counter and a paper khata (ours, with consent) | "Ramesh-ji sells on udhaar all day. By evening, the khata is a guess, and chasing money is awkward." |
| 0:20-0:35 | The promise | Landing hero | "So we built a ledger you talk to. Bolo, likho mat." |
| 0:35-1:25 | **Live demo 1: the hero** | Phone, Bolo | Say: "Sharma ji ne 500 rupaye udhaar liye, atta kam hai." Parchi appears, amount in words, stamp, summary updates, atta flagged |
| 1:25-1:55 | **Live demo 2: it does not guess** | Phone | Say "Sharma ji ne 500 diye" then "Sharma ji ko 500 diye". Opposite ribbons. "One word flips the money. We show it in words before anything is saved." |
| 1:55-2:20 | **Live demo 3: collect** | Customer page, reminder, wa.me | Tap Yaad dilao, WhatsApp opens with the exact message and pay link. "The owner presses Send. We never message customers on our own." |
| 2:20-2:40 | Proof | Clip of a real shopkeeper (or numbers from the test set) | "Ramesh-ji made three entries without help. On our 20-sentence test, X of 20 were right and every uncertain one was flagged." (only real numbers) |
| 2:40-3:00 | Business and ask | One slide | "Free ledger. About ₹149 a month for reminders and posters, sold through distributors who already visit shops. We have not proven willingness to pay; next we test it with 10 shops." |

Rules: use only measured numbers; never say "AI-powered" without showing what it did; end on the reminder, not on a slide of logos.

## 2. Fallback ladder (decide in the first 3 seconds, no apology)

1. Live voice. 2. Type the same sentence. 3. Tap a sample clip. 4. Play the prerecorded screen capture (labelled as recorded this afternoon).
Say once: "Noisy room, so I'll type it." Move on.

## 3. Jury questions and prepared answers (honest versions)

| Question | Answer |
|---|---|
| Why not Khatabook, OkCredit or Vyapar? | "They are built around tapping and typing. We start from speech, and we do not trust it blindly: every entry is confirmed with the amount in words and the direction in words. The pain we target is the counter moment and the awkward chase." |
| I have seen voice ledgers already. | "Yes, some exist. Here is what we do differently and can show: the ne-versus-ko direction check, which-Sharma resolution, number-word cross-check, confirm-before-write. We have not compared on their data, so we are not claiming to be better overall." (Verify competitor features before the event.) |
| How do you make money? | "Free ledger; paid reminders and posters; distributor channel. Unproven. Our next step is ten shops and one pricing test." |
| What if it mishears an amount? | "It cannot write without confirmation. The amount shows in digits and words, big amounts need a second tap, and entries can be voided with a reason. The audit log keeps the sentence we heard." |
| Why would a shopkeeper trust an AI with money records? | "The owner stays the source of truth: nothing saves without a tap, nothing is deleted, and reminders are drafts the owner sends." |
| How do you reach shopkeepers? | "Through wholesalers and distributors who visit weekly, plus shop-to-shop referrals. We have not run this yet." |
| Is the payment real? | "The pay page builds a UPI link and QR for the shop's own UPI. We do not process payments or mark anything paid on our own." |
| Does the AI image make the posters? | "No. Posters use fixed templates so Hindi text is never garbled. AI only picks wording and items." (if P1 is built) |
| What about privacy? | "Demo data is fictional. Real shop data only with consent, with a delete button. Pay pages show name and amount only." |

## 4. Five submission links (AI-juror readiness)

The AI juror may see only these. Each must work with no login, on a phone, in under 30 seconds.

| Link | Must contain |
|---|---|
| 1. Product | "Try the sample shop" button; five sample clips; typed input; all P0 flows; clear demo labels |
| 2. Website | The landing page is itself the live demo. Plus the honest comparison table and the safety section |
| 3. Social posts (3) | See section 6 |
| 4. Video ad (about 30 s) | See section 5 |
| 5. Pitch deck | See section 7 |

Checklist before submitting: open each in a private window on mobile data; confirm no keys or private data; confirm the product link survives free-tier rate limits (cached sample results); confirm links are viewable, not download-only.

## 5. Video ad (about 30 seconds, vertical 9:16 plus a 16:9 cut)

Concept: "Ramesh-ji's hands are busy." Real or AI-assisted footage of a counter. The one visual hook is the stamp.

| Shot | Time | Visual | Audio |
|---|---|---|---|
| 1 | 0:00-0:04 | Hands weighing atta, a customer waits, a pen on a paper khata (unreachable) | Shop ambience |
| 2 | 0:04-0:09 | He speaks without looking at the phone: "Sharma ji ne 500 udhaar liye" | Voice, real |
| 3 | 0:09-0:15 | The parchi appears on screen with ₹500, पाँच सौ रुपये | Soft UI tick |
| 4 | 0:15-0:18 | **The stamp lands on "लिख लिया"** | **Stamp thunk, peak on the exact frame** |
| 5 | 0:18-0:24 | The balance counts up; a reminder opens in WhatsApp; the customer's phone buzzes | Message tick |
| 6 | 0:24-0:30 | Logo and "बोलो, लिखो मत।" with the link | Short sting |

Production notes:
- Per your global rule for videos: find real **CC0** sound effects with the Openverse API (`https://api.openverse.org/v1/audio/?q=SOUND&license=cc0`), check each result's licence is `cc0`, save in `assets/sounds/` with a `CREDITS.json` (title, creator, Openverse id, landing URL), and place each so its **peak sample** lands on the exact frame of the motion. The stamp is the hero hit.
- Voice-over and the Hindi line can use ElevenLabs; avoid cloning anyone's voice without their consent.
- If we make it in HyperFrames, load the `hyperframes`, `media-use` and `product-launch-motion` skills first.
- Real shopkeeper footage only with consent; otherwise label as a dramatisation.

## 6. Three social posts (distinct jobs)

| # | Format | Idea | Why it earns points |
|---|---|---|---|
| 1 | Carousel or reel | **"Ne ya ko?"** Two sentences, one word apart, opposite money. Shows the direction trap and how the app shows it in words | Shows real AI craft and trust in 20 seconds |
| 2 | Single image | **Bahi vs bolo:** the paper khata page beside the bahi-style screen with the same entry | Instantly legible to every shopkeeper |
| 3 | Short video | **"Vasooli, politely":** a reminder arrives with a pay link; customer pays; owner marks received | Closes the loop on the real pain |

Each post: one idea, Hindi plus English captions, a visible link, no stock imagery.

## 7. Pitch deck (8 slides, designed in the same system)

1. Title: Dukaan Dost, बोलो, लिखो मत।
2. The counter moment (photo, one sentence)
3. What we built (screenshot of the parchi and stamp)
4. Live demo placeholder (QR to the product)
5. How it stays safe (confirm, words, direction, audit)
6. What we tested (fixtures, real shopkeeper, honest numbers)
7. Business model and channel (marked as hypotheses)
8. What we would do next (ten shops, pricing test, WhatsApp API)

Build with the design system, not a default template. Deck tooling: the `slideshow` skill (presentable HTML with presenter notes), or Canva (connected), or `pptx` if a file is required.

## 8. Claims we must not make

- "Better than Khatabook" or "first voice ledger" (unverified).
- "Payments handled" or "auto-collect" (we generate links only).
- "Works in all Indian languages" (Hindi, Hinglish, English; Bengali only if tested).
- Any testimonial or number we did not measure.
- "AI never makes mistakes." Say: "It cannot save a mistake without your tap."

## 9. Real-shopkeeper filming consent (script)

"We are students building a voice ledger for shops. We would like to record you using it for two minutes. We use fake customer names. You can stop any time, and we will delete the video if you ask. Is it okay to record?" Record the yes. Offer to show them the footage before we use it.

## 10. Update 2026-11-01: no real shopkeeper, AI-made clips
- The "Proof" beat (2:20-2:40) now says only what we measured: "On our 20-sentence test, N of 20 were right and every uncertain one was flagged. We have not yet tested with real shops; that is our next step with ten shops."
- Section 9 (consent script) stays in the repo for the later real test and is not used for the ad.
- Ad shots 1-2 may use AI-generated counter scenes from ElevenLabs Flows. Add a small on-screen "dramatisation" note. Shots 3-6 are real captures of the running app.
- Never show a generated person as an actual customer, never invent a quote, and never imply the clips are real users.
- Flows prompt pack: see `deliverables/ad/FLOWS_PROMPTS.md` (created by the build run).
