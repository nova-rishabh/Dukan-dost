# Dukaan Dost: Product Requirements Document

Status: Built 2026-11-01 (P0-1 to P0-9 and P1-1 to P1-3, P1-5 as Mark as received; P1-4 removed). Live accuracy with real speech-to-text and Gemini is unmeasured. Owner: Rishabh. Last updated: 2026-11-01.
Challenge: AI Builder Challenge (Roobaroo AI Camp, with Developers' Society, IIT Kharagpur). Theme: Local business, with Money as a second fit.

## 1. One-line pitch

**The ledger you talk to.** A shopkeeper says "Sharma ji ne 500 udhaar liye, atta kam hai" and Dukaan Dost writes the ledger entry, flags the stock, and prepares a polite WhatsApp reminder with a UPI pay link, after the owner confirms.

Tagline (Hindi): बोलो, लिखो मत। (Bolo, likho mat.)
Sharper wedge for the pitch: **voice to collection.** Khatabook asks shopkeepers to type. Dukaan Dost listens, and then chases the money.

## 2. Problem

Kirana and small shop owners in India sell on credit (udhaar) all day. Today they:
- write entries in a paper bahi-khata or in WhatsApp notes while serving customers,
- forget who owes what, or mis-write amounts,
- feel awkward chasing payments, so money stays stuck,
- never track what is running low until it runs out.

Apps exist (Khatabook, OkCredit, Vyapar, myBillBook, and newer voice ledgers such as LekhaBook, DukanAI, Hisaab Babu, Vyop; the last four were reported by a judging AI and are **unverified**). They mostly ask the owner to open the app, pick a customer and type an amount. At the counter, with both hands busy, that is where entries get lost.

Evidence we still need (see section 13): one real shopkeeper using it unaided.

## 3. Users

| Persona | Who | Needs | Constraints |
|---|---|---|---|
| **Primary: the owner** ("Ramesh-ji") | 35-60, runs a kirana or general store, Hindi or Hinglish (Bengali near Kharagpur, to verify), Android phone, WhatsApp daily, UPI daily | Log udhaar and payments in seconds, see who owes what, send reminders without awkwardness | Hands busy, noisy shop, bright sunlight, low patience for forms, may not read English well |
| **Secondary: the customer** ("Sharma ji") | Regular local customer | A polite reminder with an easy pay link | Receives, never installs anything |
| **Evaluator: the juror** | Investor, ads founder, and an AI that may only see our 5 links | Understand it in 10 seconds, try it without a login | May never see us demo live |

## 4. Goals

1. A shopkeeper can log a credit or a payment by speaking, with one tap to confirm, in under 5 seconds from end of speech to confirm card.
2. No wrong number is ever saved silently: every write is confirmed with the amount, the direction and the customer shown back (and optionally read aloud).
3. From a ledger entry, the owner can send a polite reminder with a working pay link in two taps.
4. The owner sees, at a glance, the total udhaar outstanding, the top debtors and what is running low.
5. A juror (human or AI) can try the whole loop in under 30 seconds without logging in, even with no microphone (sample clips and typed input).

## 5. Non-goals (v1)

| Not doing | Why |
|---|---|
| Billing, GST, invoices, full accounting | An ERP cannot be built in one afternoon, and incumbents own it |
| Real payment settlement or payment collection | We generate a UPI link and QR; money moves between customer and shop UPI apps. Never claim a payment was received because a link was sent |
| Auto-sending reminders without the owner | Embarrassing a customer is the owner's call, and it is a trust risk |
| Stock quantities and reorder automation | The AI must not invent quantities; v1 only flags "low" |
| Multi-shop, staff roles, login system | Demo tenant only; a real auth layer is v2 |
| Voice cloning or any cloned voice | Out of scope and not needed |
| Languages beyond Hindi, Hinglish and English | Bengali is a stretch goal (section 13, open question) |

## 6. User stories

**Owner**
1. As an owner, I want to say a credit entry out loud so that I do not have to stop serving to write it.
2. As an owner, I want to see the amount, customer and direction before it saves so that a mishearing never corrupts my book.
3. As an owner, I want the app to ask me which Sharma I meant so that the wrong customer is never charged.
4. As an owner, I want to undo the last entry by voice or with one tap so that mistakes are cheap.
5. As an owner, I want to see each customer's running balance with the history that produced it so that I can trust it.
6. As an owner, I want a ready WhatsApp reminder with a pay link so that I can collect without an awkward call.
7. As an owner, I want "atta kam hai" to create a low-stock note so that I remember to reorder.
8. As an owner, I want today's summary (total udhaar, top three debtors, low stock) so that I know where I stand in 10 seconds.
9. As an owner, I want to type instead when the shop is too loud so that I am never blocked.
10. (P1) As an owner, I want tomorrow's offer poster made from what is in stock so that I can post it to customers.

**Customer**
11. As a customer, I want a polite reminder with the exact amount and a pay button so that I can settle in one tap.

**Juror**
12. As a juror, I want to try a sample shop with prerecorded noisy clips so that I can see it work without a login or microphone.

## 7. Requirements

### P0: must ship (the demo does not exist without these)

| ID | Requirement | Acceptance criteria |
|---|---|---|
| P0-1 | **Voice capture** with push-to-talk and a typed fallback that produces an identical result | Given a granted mic, when the owner holds Bolo and speaks, then audio is transcribed and shown as text. Given no mic or an STT failure, typing the same sentence yields the same confirm card |
| P0-2 | **Structured extraction** of one or more intents from a Hindi, Hinglish or English sentence: `credit_given`, `payment_received`, `stock_low`, `query_balance`, `undo_last`, `unknown` | On the 20-sentence test set (06_TEST_PLAN) at least 90% of critical fields (customer, amount, direction) are correct, and 100% of wrong or uncertain ones are flagged for clarification instead of guessed |
| P0-3 | **Confirm card**: customer, amount in digits and in words, direction (colour and label), source sentence, and "Likh do" / "Badlo" actions | Given any extraction, nothing is written until Likh do is pressed. Amounts of ₹5,000 or more need a second confirmation. The direction is shown in words, not only colour |
| P0-4 | **Customer resolution** with fuzzy match across names and aliases, Devanagari and Roman | Given two customers named Sharma, when the sentence says "Sharma ji", then the card asks which one. Given an unknown name, it offers "New customer: Raju" |
| P0-5 | **Persistent ledger** per customer with running balance, history, and void (not delete) | Given an entry, when the page reloads, it is still there. A voided entry is excluded from the balance and still visible in history with a strike-through |
| P0-6 | **Reminder**: a polite WhatsApp message with the exact balance and a pay link, opened with wa.me so the owner reviews and sends | The message shows the right name and amount. The pay page shows a UPI QR and a "Pay with any UPI app" button. A demo banner makes clear no payment is processed here |
| P0-7 | **Low-stock flag** from "atta kam hai" with no invented quantity | Given "atta kam hai", a flag "Atta: low" is created and listed. No number appears |
| P0-8 | **Today's summary**: total udhaar, top three debtors, low-stock list, updated instantly after an entry | After confirming an entry, the totals change within 1 second |
| P0-9 | **Juror mode**: one-tap "Try the sample shop" with 5 prerecorded Hindi clips (clean, noisy, multi-intent, ambiguous name, wrong-direction trap) | The whole loop works without a login or a microphone |

### P1: should ship if time allows (in this order)

| ID | Requirement |
|---|---|
| P1-1 | **Read-back voice**: ElevenLabs reads the confirm card ("Sharma ji, paanch sau rupaye udhaar. Likh doon?") |
| P1-2 | **Offer poster**: owner says or types the offer; a deterministic HTML-to-image template renders crisp Hindi text and the shop name, ready to share. AI picks copy and items only; it never draws text |
| P1-3 | **Hindi voice commands for undo and balance** ("Sharma ji ka kitna baaki hai?") spoken answer |
| P1-4 | Removed: Bengali is out of scope (decided 2026-11-01) |
| P1-5 | Real ₹1 UPI test payment shown live on one phone, and manual "Mark as received" |

### P2: designed for, not built

Stock quantities and supplier reorder; distributor channel; WhatsApp Cloud API sending with approved templates; Razorpay payment links with auto-reconciliation; multi-shop auth; offline queue; GST invoices; credit limits per customer.

## 8. Key flows

**Flow A: log an udhaar (the hero)**
Hold Bolo → speak → transcript appears (about 1-2 s) → confirm card (about 2-3 s) → owner taps Likh do → rubber stamp lands → balance counts up → summary updates.

**Flow B: ambiguity**
"Sharma ji ne 500 diye" → card says "Payment received" in green and asks "Kaun Sharma?" with two chips → owner taps one → Likh do.

**Flow C: collect**
Customer page → "Yaad dilao" → reminder preview (message plus pay link) → "WhatsApp kholo" → owner presses send in WhatsApp.

**Flow D: no mic, noisy shop**
Type the sentence, or tap a sample clip. Identical downstream.

## 9. Safety and trust requirements (from the judges' feedback)

1. Confirm before every write, with the sentence echoed.
2. Direction trap: "Sharma ji **ne** 500 diye" (Sharma paid) versus "Sharma ji **ko** 500 diye" (shop gave on credit). Both are in the test set and both show direction in words.
3. Never fabricate quantities, customers, or payment status.
4. A pay link is never presented as "paid". Status changes only when the owner presses Mark as received.
5. Reminders are drafts the owner sends; the app never messages a customer on its own.
6. Customer phone numbers and balances are not exposed on public links. The pay page shows name and amount only, behind an unguessable id.
7. Every write is auditable: source sentence, who confirmed, when, voids with a reason.
8. Demo data is fictional. Real shopkeeper data is used only with consent and is deletable. **Status 2026-11-01: built (ADR-024). Still no login, so do not host a real shop on a public URL yet (ADR-022).**

## 10. Success metrics

| Metric | Target | How measured |
|---|---|---|
| Critical-field accuracy (customer, amount, direction) | at least 90% on 20 sentences, at least 95% on clean audio | 06_TEST_PLAN fixtures |
| Silent wrong writes | 0 | Test run plus audit log |
| Speech end to confirm card, median | 4 s or less | Timing logs over 20 runs |
| Demo reliability | 9 of 10 full rehearsals pass without fallback, 10 of 10 with fallback | Rehearsal checklist |
| Real-user proof | 1 shopkeeper completes 3 entries unaided, on video, with consent | Recorded test |
| Proxy jury score | Planned at least 85 when we re-run our own judge prompt on the finished 5 links | ai_judge_prompt_v2.md |

## 11. Business model (pitch hypothesis, not validated)

- Free: voice ledger, reminders.
- Paid hypothesis, about ₹149 per month: auto-reminder schedules, offer posters, and monthly collection report. The ads-founder angle: shopkeepers pay for footfall and recovered cash, not for bookkeeping.
- Channel hypothesis: FMCG distributors and wholesalers, who already visit shops, offer it to their retailers.
- Say plainly in the pitch that willingness to pay is unproven and name the test we would run next.

## 12. Competitive positioning

| Alternative | Overlap | Our honest differentiation |
|---|---|---|
| Khatabook, OkCredit, Vyapar, myBillBook | Ledger, reminders, UPI | They are tap-and-type first; we are voice first with confirm-before-write |
| LekhaBook, DukanAI, Hisaab Babu, Vyop (unverified) | Voice entries, WhatsApp reminders | Closest threat. Our edge must be shown, not claimed: direction-trap handling, which-Sharma resolution, amount-in-words confirmation, Hindi and Hinglish under noise |
| Paper bahi-khata, WhatsApp notes | Current behaviour | We keep the bahi-khata look and mental model |

Action: verify each competitor's real features before the pitch and state differences we can demonstrate.

## 13. Open questions

| # | Question | Who | Blocking? |
|---|---|---|---|
| 1 | Is there a real shopkeeper we can test and film with consent (Tech Market near campus, or a family shop)? | Rishabh | No, but it is the biggest score lever |
| 2 | Hindi only, or Bengali too? Which language do shopkeepers near Kharagpur speak? | Rishabh | No |
| 3 | Solo or team? Who builds, who films? | Rishabh | Yes for the build plan |
| 4 | Which LLM key do we have (Gemini AI Studio, Anthropic API)? | Rishabh | Yes before build |
| 5 | Domain: student-pack free domain or subdomain of an owned one? | Rishabh | No |
| 6 | Is WhatsApp click-to-send (wa.me) acceptable for the demo instead of the API? | Rishabh | No (we assume yes) |
| 7 | Demo device: phone, laptop, or both on stage? | Rishabh | No |

## 14. Timeline and phasing

- Tonight: docs approved, design references pinned, test sentences recorded, video shots started (the deck says they take longest).
- Day 2 morning: workshops.
- 13:30: build window opens. 16:00: submit 5 links and pitch begins. 17:30: winners.
- Phasing and cut lines are in 10_BUILD_PLAN.md.

## 15. Judging map

| Rubric line | Where this PRD earns it |
|---|---|
| Problem and idea (20) | Sections 2, 3, 11, 12 plus one real-user clip |
| Product works (25) | P0-1 to P0-9, safety rules, juror mode |
| Website, social and ad (20) | Landing hero is the live demo; ad and posts use the stamp moment (07_DEMO_AND_PITCH) |
| Pitch and clarity (20) | 3-minute script, prepared answers |
| AI use and craft (15) | Multi-intent Hindi and Hinglish extraction, fuzzy entity resolution, number-word cross-check, read-back |
