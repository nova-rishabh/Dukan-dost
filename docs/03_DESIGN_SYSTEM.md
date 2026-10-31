# Dukaan Dost: Design System

Status: Draft v1 for approval. Last updated: 2026-11-01.
Your rules, applied: **bright colours. Never Inter. No generic websites. References before building. No AI-slop defaults.** Where a loaded design skill disagrees with those rules, your rules win (see section 12).

## 1. References (gathered before design)

What we actually looked at, and what we took from each. Screenshots are not saved yet: drop them in `design/references/` (see the README there) so this list becomes a real board.

| Reference | What it is | What we take | What we refuse |
|---|---|---|---|
| **The bahi-khata** (red cloth-bound Indian ledger; notes: [Craft Revival Trust](https://asiainch.org/craft/bahi-clothbound-books-of-rajasthan/), [Gaatha](https://gaatha.com/bahi-khata-story/)) | Red cotton cover, stitched spine, yellowish pages, one page per customer, credit on one side and payments on the other; the red is considered auspicious for business | The ledger screen is a bahi page. Red cloth and stitch detail as a *frame*, ruled page, margin line, handwritten entries | A skeuomorphic leather-book mock-up that wastes screen space |
| **The parchi** (the small slip a shopkeeper scribbles an amount on) | Torn, quick, handwritten, stamped | The confirm card is a parchi with a torn edge, in handwriting font | Fake paper textures everywhere |
| **The rubber stamp** | Red or blue ink, slammed down, slightly rotated, a bit imperfect | The signature moment: confirming stamps "लिख लिया" on the parchi | Stamps as decoration anywhere else |
| **Khatabook and OkCredit** (competitors; [Notion write-up of a Khatabook redesign](https://app.notion.com/p/Khatabook-App-Redesign-a1a010ff4f878248b10381340c5741d0)) | Users already read green as money in and red as money out | Keep that colour convention: **green = received, red = owed to the shop**, and add words so colour is never the only signal | Generic fintech green and white dashboards |
| **Shop signage and sticker-bomb counters** (hand-painted boards, Parle-G style wrappers, truck-art colour). No sourced images yet: collect them | Saturated flat colour, big painted letters, no gradients | Flat bright blocks, heavy display lettering, sticker shapes | Gradient washes, glassmorphism |
| **The challenge deck itself** (yellow, violet, coral, blue blocks, heavy grotesque) | The organisers' own visual language: bold flat colour blocks | Family resemblance in colour confidence, so the product feels at home on the jury screen | Copying the deck's circles |
| **React Bits** ([reactbits.dev](https://reactbits.dev)): 33 text animations, 38 animations, 48 components, 63 backgrounds, installed per component with `npx shadcn@latest add @react-bits/<Name>-TS-TW` | Motion building blocks | Shortlist in section 9 | Backgrounds like Aurora, Galaxy, Plasma, Silk, Orb, Ballpit: they read as AI-demo wallpaper |

Quality gate: before any screen is built, we write a one-paragraph "why this is not a template" note (section 13) and show a still for approval.

## 2. Concept

**"Bahi meets parchi meets stamp."** The product is a shopkeeper's own paper world made fast. You speak, a **parchi** (slip) appears with what we heard, you tap, a **stamp** lands, and the entry is copied into the **bahi page**.

- **One memorable thing:** the stamp. A red rubber stamp "लिख लिया" slams onto the parchi with a short thunk, a slight rotation and a tiny ink spread. Everything else is quiet, flat and bright.
- **Why it is specific:** it comes from the real objects of a kirana counter, not from a fintech template. No other voice-ledger screenshot looks like it.

## 3. Colour

Bright, flat, high-contrast. No gradients, no tinted washes. Names are Hindi objects so the team shares one vocabulary.

| Token | Name | Hex | Role |
|---|---|---|---|
| `--haldi` | Haldi | `#FFC400` | Primary background, hero, the app canvas |
| `--sindoor` | Sindoor | `#FF3B2F` | Owed to the shop (udhaar), stamp, destructive |
| `--neel` | Neel | `#2D46FF` | Primary action, links, focus |
| `--pista` | Pista | `#00C26A` | Received, success, "paid" labels |
| `--gulabi` | Gulabi | `#FF5CA8` | Reminder and WhatsApp moments, sticker accents |
| `--syahi` | Syahi | `#16123A` | Text and outlines (deep ink indigo, not generic near-black) |
| `--safed` | Safed | `#FFFFFF` | Cards, parchi, inputs |
| `--bahi-page` | Bahi page | `#FFE98A` | Ruled ledger page tint (a lighter haldi, still saturated) |

Rules:
1. Page background is Haldi, or a full-bleed block of Neel or Sindoor. Never cream, never grey.
2. Text on Haldi, Pista, Gulabi and Bahi page uses **Syahi**. Text on Neel uses **Safed**. Text on Sindoor uses **Syahi** (white on Sindoor is about 3.5:1 and fails for small text).
3. 60 / 30 / 10 does not apply here. The ratio is roughly 50 Haldi, 25 Safed, 15 Syahi, 10 split across Neel, Sindoor, Pista and Gulabi.
4. Money semantics: **Sindoor** = owed, **Pista** = received. Every coloured amount also carries a word ("udhaar", "mile") and a sign.
5. Outlines: 2 px Syahi on cards and buttons give the sticker feel. Shadows are hard offsets (`4px 4px 0 var(--syahi)`), never soft grey blurs.
6. Dark mode: not in v1 (shops are bright). If added, keep Haldi and Syahi as the pair, never near-black plus neon.

Contrast checks (to re-verify with a tool at build): Syahi on Haldi well above 7:1; Safed on Neel above 6:1; Syahi on Sindoor about 5:1; Syahi on Pista above 7:1.

## 4. Typography

No Inter. No Roboto, Arial, system-ui look. Three families, all with true Devanagari and Latin (confirmed in Google Fonts CSS):

| Role | Family | Why | Weights |
|---|---|---|---|
| Display and headlines | **Yatra One** | Heavy, poster and signboard character, handles Devanagari and Latin in one voice | 400 |
| UI and body | **Hind** | Clean, highly legible Devanagari and Latin, built for Hindi UI | 400, 500, 600, 700 |
| Handwriting (ledger entries, parchi) | **Kalam** | Real handwriting in both scripts, so entries feel hand-written | 400, 700 |

Fallback stack: `"Yatra One", "Noto Sans Devanagari", serif`. Subset to Latin and Devanagari only; preload Yatra One and Hind 500.

Scale (mobile first, 1.25 ratio, rounded):

| Token | Size / line height | Use |
|---|---|---|
| `--text-hero` | 56 / 1.05 (clamp to 72 on desktop) | Landing headline |
| `--text-h1` | 40 / 1.1 | Screen titles |
| `--text-h2` | 28 / 1.2 | Section titles |
| `--text-h3` | 22 / 1.3 | Card titles |
| `--text-body` | 18 / 1.5 | Body (never below 16 on mobile; shopkeepers read in sunlight) |
| `--text-small` | 15 / 1.4 | Captions |
| `--text-amount` | 44 / 1 | Money on cards, Hind 700 with tabular figures |

Rules:
- Line length at most 60 characters; Devanagari headlines get extra line height (1.2 or more) so matras do not clip.
- Sentence case everywhere, in both scripts. Not all caps. No tracked-out small caps labels above headings.
- Numerals: tabular (`font-variant-numeric: tabular-nums`) in all money and tables. Use Indian digit grouping (₹1,25,000).
- Never accent one word of a headline with a different colour or italics.
- Hindi and English headlines can appear together (a Devanagari line and a Latin line), set at the same size so neither is a caption of the other.

## 5. Layout and spacing

- Spacing scale (4 px base): 4, 8, 12, 16, 24, 32, 48, 72.
- Mobile first at 390 px wide. One column, one primary action per screen, thumb zone at the bottom for the Bolo button.
- Desktop (landing and juror view): 12-column grid, asymmetric blocks of flat colour, content left-aligned. No centred-everything marketing stack.
- Radii: **0 or large, not medium.** Parchi and cards use a torn edge or 0 radius with a hard offset shadow; stickers and buttons use full pills (999 px). No uniform 12 px rounded-card kit.
- Borders: 2 px Syahi. Dividers: dashed 2 px Syahi at 30% (like a torn-slip perforation).
- Z-order: bahi page below parchi below stamp below toast.

## 6. Components

Each has purpose, anatomy, states, content rules and accessibility. States for all interactive components: default, hover (desktop), focus (3 px Neel outline, 2 px offset), pressed (shadow collapses, 2 px translate), disabled (50% opacity, no shadow), loading, error.

| Component | Purpose | Anatomy | Notes |
|---|---|---|---|
| **BoloButton** | Push-to-talk. The most important control | Large round Neel button, mic glyph, label "Bolo", live level ring while recording | 88 px, bottom centre. Hold to record, release to send; also tap-to-toggle for accessibility. States: idle, recording (ring pulses with level), processing (spinner ring), error (Sindoor ring plus "Dobara bolo"). `aria-pressed`, keyboard Space |
| **TypeBox** | Typed fallback with identical result | Input plus "Likho" submit | Always visible under Bolo so the fallback is one thumb away |
| **Parchi** (confirm card) | Show what we heard before saving | Torn top edge, Kalam sentence echo, customer chip, **amount in digits and words**, direction ribbon, actions | Direction ribbon: Sindoor "Udhaar diya" or Pista "Paise mile", always with words. Actions: **Likh do** (primary, Neel), **Badlo** (secondary, outline). Big amounts add a second tap: "Pakka ₹5,000?" |
| **WhichChips** | Disambiguate customers | Two or three pill chips with name plus area | Selecting one updates the parchi in place |
| **Stamp** | The signature feedback | Sindoor rotated stamp "लिख लिया" plus tiny ink spread | Plays once on confirm, 280 ms, with an optional thunk. Reduced motion: stamp appears without movement |
| **BahiPage** | Customer ledger | Red cloth edge with stitch detail on the left, ruled Bahi-page body, two columns "Udhaar diya" and "Paise mile", running balance footer | Entries in Kalam. Voided entries struck through. Empty: "Abhi koi entry nahi. Bolo aur likhwao." |
| **CustomerRow** | List item | Name (Hind 600), area, balance chip | Whole row is a 56 px tap target |
| **BalanceChip** | Show owed or advance | Pill, Sindoor for owed, Pista for received or advance, with word and sign | Count-up animation only on change |
| **SummaryStrip** | Today at a glance | Three blocks: total udhaar, top debtors, low stock | Flat colour blocks, Hind 700 numbers |
| **ReminderSheet** | Prepare the WhatsApp message | Editable message, pay link, "WhatsApp kholo" (Gulabi) | Shows the exact text that will be sent |
| **PayPage** | What the customer sees | Shop name, amount, QR, "Kisi bhi UPI app se bharo" | Demo banner in Haldi when in demo mode |
| **StockFlag** | Low-stock note | Item name plus "Kam hai" tag, "Mangwa liya" to resolve | No numbers |
| **Toast** | Result feedback | Bottom, 3 s, past tense ("Likh liya"), never covers Bolo | Same verbs as the buttons |
| **SampleClips** | Juror mode | Five labelled clip buttons ("Saaf awaaz", "Shor mein", "Teen kaam ek saath", "Kaun Sharma?", "Ne ya ko?") | Clear, honest labels |

## 7. Screens (wireframes)

**Landing (the first thing a juror sees).** The hero is the product itself, not a stock illustration.

```
┌──────────────────────────────────────────────────────────┐
│ Dukaan Dost                              [Sample dukaan] │  Haldi
│                                                          │
│  बोलो, लिखो मत।                    ┌─────────── parchi ─┐│
│  Bolo. Likho mat.                  │ "Sharma ji ne 500   ││
│                                    │  udhaar liye"       ││
│  [  ● Bolo  ]  [ type here…  ]     │ Sharma ji ▸ ₹500    ││
│  Try: Saaf awaaz · Shor mein       │ पाँच सौ रुपये        ││
│                                    │ [Likh do] [Badlo]   ││
│                                    └──────────[stamp]────┘│
├──────────────────────────────────────────────────────────┤  Neel block
│ Teen kaam, ek awaaz mein:  Likhna · Yaad dilana · Dekhna  │
├──────────────────────────────────────────────────────────┤  Safed
│ Why it is safe: confirm before write, amount in words…    │
├──────────────────────────────────────────────────────────┤  Sindoor
│ Khatabook types. We listen.  (honest comparison table)    │
└──────────────────────────────────────────────────────────┘
```

**Shop home.** Summary strip on top, customer list below, Bolo and TypeBox fixed at the bottom.
**Customer page.** BahiPage plus "Yaad dilao" (reminder) and "Mile mark karo".
**Pay page.** Single-purpose, Haldi, QR centre.
**Debug page (demo only).** Plain monospace is fine here; it is not a user surface.

## 8. Motion

- Non-user-triggered motion is restricted to **one** orchestrated moment: on the landing hero, the sample sentence types in, the parchi slides in, the stamp lands, then it rests. It runs once.
- User-triggered motion that explains what changed: stamp on confirm, balance count-up, row inserting into the bahi page, Bolo ring pulsing with level.
- Durations: micro 120 ms, standard 200 ms, stamp 280 ms, enter 350 ms max. Easing: `cubic-bezier(.2,.8,.2,1)` for settle, a small overshoot only on the stamp.
- No fade-and-slide-up on every section, no hover lift on every card, no parallax, no looping background.
- `prefers-reduced-motion`: replace motion with instant state changes and keep colour and text feedback.

## 9. React Bits shortlist (use sparingly)

Install with `npx shadcn@latest add @react-bits/<Name>-TS-TW` after adding the registry to `components.json`:
`"registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" }`.

| Use | Component | Where |
|---|---|---|
| Money counting up | **Count Up** | Balances and summary totals (on change only) |
| Spoken sentence typing in | **Text Type** | Landing hero sample sentence |
| Sticker feel | **Sticker Peel** | One decorative sticker in the hero, optional |
| Shop-board ticker | **Scroll Velocity** | A single strip of shop names and sample phrases, if it fits |
| Press feedback | **Click Spark** | On Likh do, tiny, optional |
| Magnetic primary | **Magnet** | Bolo button on desktop only |
| Steps | **Stepper** | "Bolo, dekho, bhejo" explainer |

Avoid: Aurora, Galaxy, Plasma, Plasma Wave, Silk, Orb, Ballpit, Liquid Ether, Liquid Chrome, Iridescence, Light Rays, Lightning, Hyperspeed, Glitch or Scrambled or Decrypted text, Glass Surface, Fluid Glass, Holo Card, Cursor trails and splashes. They signal "AI demo", not "kirana counter". 21st.dev components are allowed only as a base to restyle fully; their defaults are not on-brand.

## 10. Voice and copy

Voice: a helpful nephew at the counter. Plain Hinglish, short, respectful ("ji"), never salesy. Devanagari for headlines and key actions, Roman Hinglish for secondary text, with an English toggle in settings.

| Moment | Copy | Notes |
|---|---|---|
| Record button | Bolo | One word, same everywhere |
| Listening | Sun raha hoon… | Present continuous, not "Processing" |
| Confirm headline | Yeh likh doon? | The question, not "Confirm" |
| Primary / secondary | Likh do / Badlo | Same verb in the toast: "Likh liya" |
| Amount line | ₹500, पाँच सौ रुपये | Always both |
| Direction | Udhaar diya / Paise mile | Colour plus words |
| Ambiguity | Kaun Sharma? | Chips below |
| Stock | Atta kam hai, yaad rakha | No numbers |
| Reminder | Yaad dilao | Opens WhatsApp |
| Error: STT | Samajh nahi aaya. Dobara bolo ya likho. | Tells what to do |
| Error: network | Net nahi hai. Likhna ho toh likho, entry baad mein jayegi. | Only if offline queue exists, else "Net nahi hai. Thodi der baad try karo." |
| Empty ledger | Abhi koi entry nahi. Bolo aur likhwao. | Invitation |
| Demo banner | Demo: yahan paise nahi kat te | Honest, always visible on pay page |

Rules: sentence case, active voice, same name for the same action through the flow, no "Submit" or "OK", no apologies in errors, no jargon ("ledger", "transaction" avoided in UI; use "khata", "entry").

## 11. Accessibility and sensory

- WCAG 2.2 AA minimum. Tap targets 48 px or more, Bolo 88 px. Focus ring 3 px Neel.
- Colour is never the only signal: direction words, signs and icons accompany Sindoor and Pista.
- Screen reader: the Bolo button announces state; the parchi is a labelled region; amounts read as "five hundred rupees".
- Optional sound: a short stamp thunk and a soft tick. Off by default, one toggle. For any **video** we produce, follow your CLAUDE.md rule: CC0 effects from the Openverse API, saved in `assets/sounds/` with `CREDITS.json`, peak aligned to the motion frame (the stamp landing is the hit).
- Bright sunlight and glare: no pale greys, no thin weights below 400, no body text under 16 px.

## 12. Where loaded design skills conflict with your rules

| Skill | What it says | Our decision |
|---|---|---|
| design-elevation | Use Inter or system sans; grey neutrals; one accent; 60-30-10; `rounded-lg` everywhere | **Overridden.** Your rules: never Inter, bright colours. We keep its ideas on tabular numerals, one spacing scale, and checking defaults |
| frontend-design | Avoid cream plus serif plus terracotta, dark plus acid accent, uniform rounded cards with grey shadows, all-caps eyebrows, single-word accents, middle-dot meta strings, `→` on buttons | **Adopted in full** |
| design-systems | Three-tier tokens (reference, semantic, component), spec every component, max 5 variants | **Adopted** (section 13 tokens) |
| interaction-design | State machines, feedback intensity, avoid confirmation dialogs where Undo works | **Adopted**, with one exception: we confirm before writing money because the cost of a silent error is high; Undo is also available |
| ux-writing | Sentence case, active verbs, specific errors | **Adopted**, mapped to Hinglish |
| modern-web-guidance | Search guides before each web feature | **Run per feature at build time** |

## 13. Tokens (starting point, three tiers)

```css
:root {
  /* reference */
  --haldi: #FFC400; --sindoor: #FF3B2F; --neel: #2D46FF; --pista: #00C26A;
  --gulabi: #FF5CA8; --syahi: #16123A; --safed: #FFFFFF; --bahi-page: #FFE98A;

  /* semantic */
  --color-canvas: var(--haldi);
  --color-surface: var(--safed);
  --color-text: var(--syahi);
  --color-action: var(--neel);
  --color-on-action: var(--safed);
  --color-owed: var(--sindoor);
  --color-received: var(--pista);
  --color-reminder: var(--gulabi);
  --color-ledger-page: var(--bahi-page);
  --color-outline: var(--syahi);

  /* component */
  --parchi-bg: var(--color-surface);
  --btn-primary-bg: var(--color-action);
  --btn-primary-fg: var(--color-on-action);
  --shadow-hard: 4px 4px 0 var(--color-outline);
  --border-card: 2px solid var(--color-outline);

  /* type */
  --font-display: "Yatra One", "Noto Sans Devanagari", serif;
  --font-ui: "Hind", "Noto Sans Devanagari", sans-serif;
  --font-hand: "Kalam", "Noto Sans Devanagari", cursive;

  /* space */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 72px;

  /* motion */
  --dur-micro: 120ms; --dur-std: 200ms; --dur-stamp: 280ms;
  --ease-settle: cubic-bezier(.2, .8, .2, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-micro: 0ms; --dur-std: 0ms; --dur-stamp: 0ms; }
}
```

## 14. "Is this slop?" checklist (run on every screen before it ships)

1. Could this screen be for a different product if we swap the logo? If yes, redo it.
2. Any cream background, serif plus terracotta, near-black plus neon accent, or purple-to-blue gradient? Remove.
3. Any uniform rounded cards with the same soft grey shadow? Replace with hard-offset, outline or torn-edge treatment.
4. Any all-caps eyebrow, middle-dot meta line, "WORD — fragment" label, or arrow on a button? Remove.
5. Any headline with one word in a different colour or italics? Remove.
6. Any section that only fades and slides in? Remove the motion.
7. Any numbered 01, 02, 03 that is not a real sequence? Remove.
8. Is there more than one memorable moment? Keep the stamp; quiet the rest.
9. Is every number tabular, with Indian grouping and both digits and words on confirmations?
10. Does it still work in glare, one-handed, at 390 px, with reduced motion?
11. Is the copy specific, in Hinglish, with verbs that match the buttons?
12. Would a shopkeeper recognise the objects (bahi, parchi, stamp)?

## 15. Open design questions

1. Do we show Hindi first (Devanagari headline) or Hinglish first (Roman)? Recommendation: Devanagari headline with Roman line beneath, both same size.
2. Is Bengali UI needed (Kharagpur)? If yes, Hind covers Latin and Devanagari only; Bengali needs another family (for example Hind Siliguri or Baloo Da 2), to evaluate.
3. Do we want a logo mark? Recommendation: a stamped "दो" (Do, as in "Dost" initial) inside a circle, drawn once as vector and reused as the stamp motif.
