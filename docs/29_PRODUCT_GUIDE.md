# Dukaan Dost: everything, explained

Written for you, Rishabh, so you can answer any question about the product, the film, the deck and the posts without opening the code. Plain language, honest about what is proven and what is not. Last updated 2026-11-01.

## 1. What it is, in 30 seconds

**Dukaan Dost** is a voice-first udhaar (credit) ledger for kirana shops. The owner says: *"Amit Sharma ne 500 rupaye udhaar liye."* The app shows a **parchi** (a slip): the customer, the amount in digits and in words, and the direction of the money in words. The owner taps **Likh do**, a **stamp** lands, and the khata (ledger) updates. Later, the owner taps **Yaad dilao** and gets a polite WhatsApp reminder draft with a pay link. The owner presses Send.

Tagline: **बोलो, लिखो मत।** (Bolo, likho mat: speak, don't write.)

The one idea behind every feature: **the AI proposes, deterministic code checks, the human confirms.** Nothing from the model ever writes to the database on its own.

### Words you will hear

| Word | Meaning |
|---|---|
| udhaar | credit given to a customer |
| khata / bahi | the ledger book |
| parchi | the confirmation slip the app shows before saving |
| Likh do | "write it": the confirm button |
| stamp / लिख लिया | the stamp that lands after you confirm |
| Yaad dilao | "remind": make a reminder draft |
| Mile mark karo | mark a payment as received |
| Hata do | void an entry (it stays visible, crossed out) |
| Munshi | the mascot: the shopkeeper character |
| paise | the money unit used inside: 100 paise = 1 rupee, stored as whole numbers |

## 2. A shopkeeper's day, step by step

1. **Open the app** (browser; on many phones it can also be added to the home screen).
2. **Say or type** the entry. Press the blue **Bolo** button and speak, or type in the box. Five sample clips exist for trying it without a microphone (for example "Saaf awaaz", "Shor mein", "Kaun Sharma?", "Ne ya ko?").
3. **Read the parchi.** It shows the customer, the amount (₹500 and *पाँच सौ रुपये*), and the direction in words ("Amit Sharma ko udhaar diya"). If two customers could match, it **asks which one**; it never guesses. If the direction is ambiguous ("ne" versus "ko"), it asks.
4. **Tap Likh do** (or **Badlo** to change it). The stamp lands. The balance changes.
5. **See the balance.** The customer page shows the running balance and the history that produced it.
6. **Tap Yaad dilao.** A WhatsApp message draft appears with the amount and a pay link. The owner reviews the recipient and presses Send in WhatsApp.
7. **When money arrives,** the owner taps **Mile mark karo**. The balance goes down only then.

## 3. Features by screen

| Where | What it does | Good to know |
|---|---|---|
| **Home page `/`** | The website: story, how one entry works, safety, FAQ, Try the sample shop. | New in this round: four-step section, FAQ, closing band, footer. |
| **`/try` sample shop** | A private fictional shop. No login. 30-minute session with its own data. | Names and amounts are fictional. No real messages are sent. Other visitors cannot see yours. |
| **`/signup`, `/login`, `/recover`** | Create a real shop with a WhatsApp code (password optional), log in with a code or passcode, recover access. | One owner and one shop per verified mobile. Recovery needs the registered WhatsApp number; there is no bypass. |
| **`/shop` Khata** | The main screen: Bolo, typed entry, customer list, the parchi, summary. | Desktop shows the sidebar; phones show the same links in the menu. |
| **`/shop/entry` exact amount** | A form for exact rupees and paise (for example ₹12.34), with explicit direction. | Money is stored as whole paise. Voice stays whole-rupee; fractional amounts go through this form. |
| **`/shop/ledger`** | Full history: filters by date, type and customer, original evidence, notes, voids, running balance. | Voided entries stay visible and have zero effect. |
| **`/shop/customers`** | Add and edit customers, give two people the same name deliberately as separate ledgers, store a phone only with consent, archive and restore. | Archived customers keep history and balance. |
| **Customer page and statement** | One person's ledger. Statement has date filters, opening and closing balance, CSV and Print / Save PDF. | CSV amounts are integer paise. Formulas in text are neutralised. |
| **`/shop/dashboard`** | Outstanding now, customer advances, period totals, recent entries, low stock. | No sales or profit estimate; the data cannot support one. |
| **`/shop/inventory`** | Products, low-stock thresholds, opening counts, stock in/out/correction/reversal with before and after. | kg and litre are stored as grams and millilitres. No negative stock. Money entries do not change stock. |
| **`/shop/poster`** | Makes an offer poster from a template. | Deterministic renderer, no AI image. |
| **`/shop/activity`** | A redacted log of owner actions and reminder outcomes. | An unknown delivery is never automatically resent. |
| **`/shop/data`** | Export your business data as JSON; import with a preview, fresh sign-in and an exact-match check. | Phones and credentials are excluded from exports. Import is additive and atomic. |
| **`/shop/account`** | Erase business data, or close the account. Change the registered mobile (needs the old owner's sign-in and WhatsApp verification of the new number). | Erasure and closure are different things, and each asks for a typed phrase. |
| **`/shop/settings`** | Shop name, UPI ID (format-checked, ownership not verified), logout everywhere, retention note. | A new real shop must set a UPI ID before pay links work. |
| **`/shop/start`** | A real-state checklist for first-time owners. | |
| **`/shop/help`** (Madad) | Help for the owner. | |
| **`/pay/…` pay page** | What the customer sees: amount, QR, UPI. | A pay link is **never** proof of payment. |
| **`/submission`** | The five challenge links in one page, plus credits. | Serves the film, deck, three posts and captions. |
| **Language menu (H / E)** | Switch between Hinglish and English everywhere. | Names and the original sentence are never translated. |

## 4. How the AI part actually works

```
voice  ->  text  ->  rules read it  ->  (if unsure) Gemini proposes  ->  checks  ->  parchi  ->  YOUR TAP  ->  ledger
         Scribe      instant, offline      strict JSON                   amount, customer,    confirm
                                                                         direction, duplicates
```

- **Speech to text:** ElevenLabs Scribe (Hindi and English, code-switching handled reasonably; real shop-noise accuracy is **not measured**).
- **Interpretation, rules first:** our own Hinglish/Hindi/English rules read the sentence first: verbs, particles, number words, names. If they are confident, the result is instant and works offline.
- **Interpretation, model second:** only if the rules are unsure, Gemini proposes an entry in strict JSON. Two attempts at most, with short timeouts.
- **Checks (deterministic code):** number parsing, customer resolution (asks when two names match), direction, duplicate and ceiling checks. Large amounts need an extra confirmation.
- **Confirm:** the parchi. The owner taps. Only then is anything written.
- **Read-back (optional):** ElevenLabs text-to-speech from fixed templates, never free-form generated speech.
- **Sample clips** are AI-made voices (a dramatisation), used so people can try it without a microphone.

## 5. The rules we never break

1. The model proposes, deterministic code disposes, the human confirms.
2. Every write is confirmed. The card shows the amount in digits and words and the direction in words.
3. Money is whole paise. No decimals in storage.
4. Entries are voided, never deleted. Balances come from the entries.
5. Never invent quantities, customers, payment status or advice. A pay link is never "paid".
6. Reminders are drafts the owner sends. No auto-send.
7. Demo data is fictional. No real phone numbers in the repo, logs or screenshots. No audio is stored.
8. No keys in code or chat.

## 6. Privacy, accounts and safety in plain words

- **Isolation:** every shop's data is separate. A visitor's sample shop is separate from everyone else's.
- **Sessions:** cookies are signed and revocable; "logout everywhere" ends all of them. Changing a password or mobile ends old sessions.
- **Sensitive actions** (import, erase, UPI change, mobile change, close) need a fresh sign-in.
- **Rate limits:** sending and login attempts are capped and the caps persist in the database. On Render, we set the trusted proxy hop to 1 so visitors do not share one bucket. **Not yet verified live.**
- **Security headers:** a strict content-security policy with a fresh nonce per page; private pages are not cached by the offline service worker.
- **Offline:** only a small public help page is cached. Typed drafts can be kept in the tab if the owner opts in; they are never replayed automatically.
- **Not claimed:** production backups off the server, a tested restore, sustained load, bank settlement, real-phone delivery.

## 7. What it is built with

| Layer | Choice |
|---|---|
| App | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Data | SQLite on a Render disk (the demo can run in memory), zod for validation |
| AI | ElevenLabs (speech to text, text to speech), Google Gemini through `@google/genai`, plus our own rules |
| WhatsApp | A separate small service (an unofficial WhatsApp connection, used for sign-in codes and owner-confirmed reminders). An official WhatsApp migration still needs provider credentials. |
| Hosting | Render: the app and the WhatsApp service, each with a disk. Health check at `/api/health`. |
| Tests | Unit and fixture tests, WhatsApp service tests, browser tests with accessibility checks, a design "slop" check, a secrets check, asset checks. Run them all with `pnpm verify`. |
| Design | Bright flat colours (haldi, sindoor, neel, pista, gulabi on syahi ink), hard offset shadows, Yatra One / Hind / Kalam fonts. No gradients, no glass, no Inter. |

Last full run: **VERIFY-PASS** with typecheck, lint, 282 unit and fixture tests, 48 WhatsApp service tests, 59 browser tests, build, design, secrets and asset checks. These are engineering checks, **not** evidence that shopkeepers want it.

## 8. The submission package (your five links)

| # | Item | Where | State |
|---|---|---|---|
| 1 | Product | `https://dukaan-dost.onrender.com/try` | Live and verified earlier; recheck before you present |
| 2 | Website | `https://dukaan-dost.onrender.com` | Same app. New homepage sections are committed; they go live after a push and deploy |
| 3 | Social posts | `/submission/social` (three 1080×1350 images + bilingual captions) | Rebuilt in the film's style |
| 4 | Video ad | 45 s film, 1920×1080. File: `deliverables/launch/out/dukaan-dost-launch-45s-v2.mp4`. Also at `/submission/dukaan-dost-ad.mp4` | Needs your YouTube or Drive upload for the form |
| 5 | Pitch deck | `deliverables/deck/deck.pdf` (11 slides). Also at `/submission/deck.pdf` | Slide 5 is empty for the film. Needs your Google Slides copy |

### The film (what each beat means)

0 to 6 s the problem: the customer asks, the shopkeeper cannot find the amount, "₹???". 6 to 14 s the answer: speak, parchi, tap. **14.0 s the stamp lands, the music drops.** 15 to 26 s balance and reminder draft. 26 to 36 s three trust rules. 37 s the logo and call to action.

- No voice-over. Music is an original synthesised score (120 BPM). Sound effects are CC0 clips from Openverse, each placed so its loudest sample lands on the frame of the action.
- I measured the audio (the stamp peak is at 14.001 s). **I have not listened to it.** Please play it once with sound before you present.
- Everything on screen is fictional demo data. The film is an illustration, not a real customer story.

### The deck (11 slides, the challenge's order)

1 Cover · 2 Problem · 3 User and market (market size is an honest GAP) · 4 Solution with screenshots · 5 Film (empty on purpose) · 6 Website and social screenshots · 7 Competition (against paper, memory, WhatsApp; no named app claims) · 8 Business model (a hypothesis) · 9 First 100 users · 10 Why me and what is next · 11 Thank you and links with a QR.

## 9. What is proven, and what is not

**Proven (by automated checks and screenshots):** the confirm-before-write flow, direction and amount handling, isolation between shops and samples, exact paise, voiding, statements and CSV, import and export checks, the sample shop on the live site, layouts at phone width.

**Not proven, and never to be claimed:**
- accuracy with real speech in a noisy shop
- real shopkeepers using it, or paying for it
- a real WhatsApp message arriving on a real phone
- production backups and a tested restore
- how it behaves under heavy load
- any market size or competitor comparison

## 10. Your real-world checklist (only you can do these)

1. Sign up with your own number on the live site and confirm the code arrives.
2. Pair a spare phone's WhatsApp with the WhatsApp service admin page (it needs the admin password).
3. Add a customer with your own number, record an entry, tap Yaad dilao, open WhatsApp, press Send yourself.
4. Show it to one shopkeeper, with permission, on a real phone. Write down what confused them.
5. Upload the film to YouTube (unlisted) or Drive. Build the Google Slides deck from the PDF and put the film on slide 5.
6. Open all five links in a private window and on your phone's mobile data before 16:00.
7. Play the film once with sound. Tell me if the music or any effect feels wrong.

## 11. If you only have 60 seconds to demo

1. Open `/try`, tap **Start private sample shop**.
2. Tap a sample clip, for example "Ne ya ko?". Read the parchi.
3. Tap **Likh do**. Watch the stamp. Point at the balance.
4. Tap **Yaad dilao**. Show that WhatsApp opens with a draft and that **you** press Send.
5. Say: "Nothing saved until I tapped."

## 12. Where things live in the project

| What | Path |
|---|---|
| App code | `src/` (pages in `src/app`, components in `src/components`, logic in `src/lib`) |
| Launch film (editable) | `deliverables/launch/` (HyperFrames project; score and effects in `assets/`) |
| Deck | `deliverables/deck/index.html`, exported by `node deliverables/deck/export.mjs` |
| Posts | `deliverables/social/_src/*.html`, exported by `node deliverables/social/_src/render.mjs` |
| Served copies | `public/submission/` |
| Project log and decisions | `docs/05_LOG.md`, `docs/04_DECISIONS.md` |
| Pitch script and Q&A | `docs/28_PITCH_SCRIPT.md` |
