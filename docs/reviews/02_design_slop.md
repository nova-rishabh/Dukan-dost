# Review 02: design and slop

Reviewer: independent, read-only. Date: 2026-11-01.
Scope: `docs/03_DESIGN_SYSTEM.md`, `CLAUDE.md` design rules, the 10 screenshots in `docs/screenshots/`, the 3 posts in `deliverables/social/`, the 8 ad frames in `deliverables/ad/out/frames/`, the deck (`deliverables/deck/index.html` and `deck.css`), `src/app/globals.css`, and the components I read in full (Parchi, ShopHome, TypeBox, Toast, Header, BahiPage, SummaryStrip, Stamp).
Not done: I did not render the deck. `deck.pdf` could not be opened (no pdftoppm here), so the deck is judged from markup and CSS only. Anything I could not check is marked "unverified".

## Verdict

The system holds up. Flat Haldi, Sindoor, Neel and Pista blocks, hard-offset shadows, Yatra One / Hind / Kalam, a torn-edge parchi and a red-cloth bahi page. No gradients, no glass, no Inter, no arrows, no all-caps. It does not look like a fintech template, and the stamp is clearly the hero.

The problems are not the visual language. They are:
1. Leaked placeholders and developer text in shipped artefacts.
2. A few real layout defects.
3. A weak Bolo/thumb-zone layout on the shop home.
4. A demo QR that may point at a real UPI handle.
5. Small inconsistencies between the app, posts, ad and deck.

## Findings

| id | sev | where | what I see | why it matters | suggested fix |
|---|---|---|---|---|---|
| D01 | high | `src/lib/seed.ts:9`, pay-390 and pay-1440 PNGs, post-3 | Demo shop VPA is `demoshop@upi`. `@upi` is a real handle on the UPI network, and the pay page encodes it in a scannable QR. Copy under the QR says "Paise aapke UPI app se seedhe dukaan ko jaate hain." | A juror who scans it and pays could send real money to a stranger. The copy then reads as true while the banner says "paise nahi kat te". Conflicts with docs/07 s8 (payments) and product rule 7 (fictional demo data). | Use a non-routable VPA, or make the demo QR not a valid `upi://pay`. In demo mode say "Demo QR: isse paise nahi jayenge". |
| D02 | high | `{{APP_URL}}` in post-1, 2, 3 footers; post-3 WhatsApp text; ad frame f810; deck slides 4 and 8; deck slide 4 "QR after deploy" box | Unreplaced template tokens are rendered as the CTA, including inside the WhatsApp draft text. | These cannot be published or shown to a jury. A QR placeholder box looks unfinished. | Gate the build: fail if `{{` remains in any output. Fill after deploy and re-export. |
| D03 | high | try-390, try-1440, shop-home-390, shop-home-1440 (`SampleClips.tsx:49`) | The UI shows: "Abhi sirf transcript chalta hai. Awaaz wali clip ke liye pnpm samples:generate chalao." The same screen's intro says "Paanch sample clip dabao". | A shell command in a user surface. It says the clips do not play audio, contradicting the page. Reads as unfinished to a jury. It also breaks the Hinglish voice rule. | Show it only in dev (`NODE_ENV`), or reword: "Awaaz abhi band hai, transcript chalega." Never show the pnpm command. |
| D04 | high | landing-390 (comparison table) | The "Purane khate se kya badla" table is clipped at the right edge: the header reads "Dukaan D", the cells "Bolo ya lik…", "Void, histo…", "Polite Wha…". The key column is unreadable at 390 px. | The comparison is the honest-claims section, and on the target viewport its content is cut off. There is no visible scroll cue. Fails checklist Q10. | Stack as rows (label above two lines of text) at under 640 px. Do not use a 3-column table on mobile. |
| D05 | medium | shop-home-390 and shop-home-1440 | The toast ("Likh liya: Gupta ji ₹1,700 baaki") floats over the sample-clip chips ("Teen kaam…", "Kaun Sharma?", "Ne ya ko?"). It is fixed at `bottom:120px` (`globals.css` `.toast`), while Bolo and TypeBox are in the page flow. | Design system s6: the toast "never covers Bolo". Here it covers tap targets and text, and on desktop it also covers the TypeBox. | Pin Bolo and TypeBox in a sticky bottom bar and put the toast above that bar, or put the toast at the top. |
| D06 | medium | shop-home-390 | Bolo, TypeBox and the parchi sit about 2,100 px down, after the summary and all 8 customers. The doc says Bolo and TypeBox are "fixed at the bottom" and the thumb zone is the Bolo button. The parchi appears far from the list that it changes. | The primary action is off-screen on first load at 390 px. Checklist Q10 (one-handed) fails. | Sticky bottom dock for Bolo + TypeBox. Show the parchi in a sheet above the dock. |
| D07 | medium | landing-390 | The header wraps to three rows ("Demo mode", "Sample dukaan", "Meri dukaan"), about 130 px before the headline. The hero repeats the same two CTAs ("Sample dukaan try karo", "Meri dukaan"), and "Demo mode" is a non-interactive pill shaped like the two links beside it. | A crowded top of page on the first screen a juror sees, a duplicate CTA, and a label that looks tappable. | Put "Demo mode" in a thin banner line, not a button-shaped pill. On mobile keep one nav button. Drop the duplicate hero CTA. |
| D08 | medium | landing-390/1440, shop-home, try (disabled "Likho" and "Likh do") | The disabled "Likho" is an olive-brown fill with pale yellow text (50% opacity on Neel over Haldi). The disabled "Likh do" is a pale lavender wash. It is the default state of the landing hero. | Off-palette muddy colours, which breaks "no tinted washes", and the text is hard to read in glare. The doc says disabled = 50% opacity with no shadow, which produces these colours. | Design the disabled state explicitly: flat Safed fill, 2 px Syahi outline, Syahi text at full contrast, dashed outline. |
| D09 | medium | ad f468 and f467 | The frame named "f467_prestamp" already shows the stamp, and is pixel-identical to the "f468_stamp-landing" frame. There is no headline above the parchi in either, so about 400 px of blank Haldi sits above. The hit frame is therefore unverified. | The CLAUDE.md rule needs the stamp's peak aligned to the exact landing frame. If the stamp is already there at 467, the sound is probably early or the animation starts earlier. | Re-capture frames 466 to 470. Check that 467 has no stamp and that the SFX peak lands on the first stamped frame. |
| D10 | medium | ad f375 | The shop-home capture is cropped mid-card ("Pinky didi" cut at the top, "Maine suna: Amit Sharma ne 500" sliced at the bottom). It is upscaled about 2.3x from a 390 px capture and is visibly soft. The headline "पहले पर्ची दिखती है।" sits about 40 px above the frame, but the capture shows a customer list, not a parchi. | Copy and image disagree. Soft raster at video size. Awkward crop. | Capture at 2x or 3x DPR. Crop to the parchi itself, which is the thing the line talks about. |
| D11 | medium | ad f645 | The reminder-sheet capture is clipped at the top ("Yeh message jayega…" cut). A WhatsApp-style mock ("Amit Sharma", "Draft", a green bubble) overlaps it. An extra ring or ellipse sits on top of the "Send" label and cuts the "d". The headline mixes a Latin word in Yatra One with Devanagari: "Send आप दबाओ।". | Overlapping layers, a clipped label, and a stray ring. The mock imitates WhatsApp's chat UI. It is also not the app's own "WhatsApp kholo" Gulabi button. | Remove the ring or move it beside the button. Show the app's own sheet whole. If a chat mock stays, label it "mock" and make it clearly ours. |
| D12 | medium | ad (all frames) | The bottom ~21% of every 1080x1920 frame (y>1520) is an empty Syahi block with a dashed line, and no captions are visible in any sampled frame. Frame 0 and the end card use the dead zone for nothing. | A fifth of the screen is unused and looks like a broken caption bar. Sparse centred content with big blank areas above and below. | If captions go there, show one in at least one verification frame. Otherwise remove the block and give the content room. |
| D13 | medium | ad f000 | The hero is a generic flat-person-icons-around-a-scale illustration: circle heads, rounded-square bodies, bottom bar overlapping the people, the scale post running into them. The chip reads "Dramatisation: stand-in for an AI clip". | This is the one frame that reads as stock vector slop, and it is not from the kirana counter of the design concept. The chip explains a missing asset, not a dramatisation. It also contradicts "References before building". | Replace with a drawn counter scene in the app's own idiom (bahi, parchi, tarazu, atta) or the real AI clip. Reword the chip: "Illustration, not a real shopkeeper." |
| D14 | medium | ad f810 | The logo ring around "दो" is a pale orange halo (Sindoor at low opacity over Haldi). The tagline is 150 px of Devanagari. The disclaimer mixes Devanagari and Roman in one line ("Demo data काल्पनिक है। Aapke tap…"). | A tinted wash and mixed scripts. The "दो" mark appears only here and nowhere else (not in the app header, posts, deck cover, or favicon from what I see). | Solid ring in Sindoor, no halo. Use the mark in the header, posts and deck cover, or drop it. Pick one script for the sentence. |
| D15 | medium | post-1 | The stamp on the right card overhangs the card's right border and crowds "₹500". There is no stamp on the left card, so the pair asks "which one is written?". The headline "ने ya को?" mixes scripts inside one headline. The hierarchy is tight: the headline is 25 px below the brand line, and the sub-line starts right under the headline descender. | The stamp is a decoration here, not "the moment". Clipping at the card edge. Tight vertical rhythm. | Pull the stamp inside the card. Stamp both cards or neither, since it is a comparison. Add 24 px between brand, headline and sub-line. |
| D16 | medium | post-2 | "Kagaz ki bahi" is a lined notebook page with a red margin line, not a red-cloth bahi. Its entry rows run 1 Nov, 22 Oct, 29 Oct (not in date order), so a shopkeeper would not recognise it as a bahi (checklist Q12). The right panel is a shrunken app screenshot (14 to 16 px text) on a Haldi card on Haldi, with nested outlines. | Weakens the "bahi vs bolo" claim. The text is too small for a phone feed. | Re-draw the left side as the red cloth cover plus page. Put the entries in date order. Crop the right capture to the page only, at a larger scale. |
| D17 | medium | post-3 | The big Neel "Aap Send dabate hain" looks like a button but is a label. In the app the equivalent is the Gulabi "WhatsApp kholo". The pay-page mock sits flush against the top border and has 13 px button text. The WhatsApp draft is a plain white box with no sign it is a WhatsApp message. | Mixed signals, inconsistent with the app, and unreadable at feed size. | Use the Gulabi button style. Add 16 px inner padding. Enlarge the button label to 20 px or more. |
| D18 | medium | all 3 posts | A pill reading "Udhaar ledger" sits at top right. "Ledger" is a jargon word that docs/03 s10 says to avoid in UI ("khata", "entry"). The pill is an eyebrow-style tag in the same shape as a button. | Voice rule break, and button-shaped decoration. | Use "Udhaar khata" or remove the pill. |
| D19 | medium | landing-390/1440 "Safe kyun hai" and table | The copy uses "void" and "history" ("Entry hatti nahi, void hoti hai", "Void, history mein dikhta rehta hai"), while the UI says "Hata do". Landing also says "WhatsApp mein Send aap dabate ho" (mixed). | Verbs should match across surfaces. "Void" is a dev word that a shopkeeper never sees. | Say "Hata do se entry kat jaati hai, record rehta hai." Use the same words in the deck ("Hata do, delete nahi" is already fine). |
| D20 | medium | all PNGs | Wordmark "Dukaan Dost" is plain Yatra One text. The "दो" mark exists only in the ad end card. Every surface looks like the same product thanks to the colours, but there is no consistent logo. | Weak brand continuity across app, posts, deck and ad. | Pick the mark and use it everywhere or nowhere. |
| D21 | medium | deck slides 5, 6, 7 (CSS estimate, unverified) | At 1920x1080, slide 6 (two-line h2, three number cards, small line, closing card) and slide 5 (six cards plus a 40 px lead) total about 1,030 to 1,050 px of content on a `.slide{overflow:hidden}`. Slide 2 has a 96 px headline over three rotated hand cards. | The last card or line may clip, with nothing to catch it. | Open `deck.pdf` and verify slides 5, 6 and 7. Set `h2` to 68 px on all, or drop one card. |
| D22 | medium | deck slide 6 | The big-number cards ("20 / 20", "104", "16") use "utterance fixtures", "unit tests", "end-to-end checks", "axe accessibility". The 20/20 is on our own fixtures through an offline rules interpreter. | These are the hero-metric template. Honest, but "20 / 20" in 120 px Yatra reads as an accuracy claim. The test counts are not checked against `docs/05_LOG.md` by me, so verify them against the last run. | Shrink the numbers, lead with "Abhi naapa nahi gaya" (the not-measured card). Re-verify 104 and 16 against the latest run. |
| D23 | low | deck slide 3 | The alt text for the second screenshot reads "lik liya stamp" (typo). The two phone captures are small (450 px of a 1920 canvas) and upscaled about 1.15x from 390 px sources. | A visible quality issue on the jury screen. | Re-capture at 2x. Fix the alt text. |
| D24 | low | deck (all slides) | Slides 1, 5, 6, 7, 8 are heading plus grid of equal white cards with the same hard shadow and no illustration. Slide 1 repeats "Dukaan Dost" at 40 px right above the 200 px "Dukaan Dost" h1. | Safe but template-like. Checklist Q1 passes only because of the colour and stamp. | Drop the small brand line on the cover. Use one hero object per slide: a parchi crop, the bahi page, the stamp. |
| D25 | low | try-390/1440 | The sample list reads "Kaun Sharma?:" and "Ne ya ko?:" (a stray colon after a question mark). The first reads "Saaf awaaz: Saaf awaaz, ek kaam." (repeats itself). | Tiny, but visible text defects on the demo page. | Format as "Kaun Sharma?" newline description. |
| D26 | low | shop-home-390 | Placeholder text is truncated ("Yahan likho: Gup…"). "Sab customer" (customer page) is a 16 px underlined link, which is probably under 48 px as a tap target. "8 customer" is 16 px. | Minor against the 48 px and 16 px rules. | Shorten the placeholder to "Yahan likho". Make the back link a 48 px chip. |
| D27 | low | shop-home-1440, landing-1440 | "Kam hai" is an almost empty Bahi-page box ("Abhi koi cheez kam nahi.") with a large blank area beside two full cards. The 1440 landing "Safe kyun hai" is two columns of 16 to 17 px text with uneven gaps. | Weak composition on desktop. The jury sees this at 1440. | Seed one low-stock item in demo data. Use a larger text size and a stronger column rule. |
| D28 | low | globals.css | `.btn-primary:hover` sets `filter: none` and a larger shadow. `Offer poster banao` uses Gulabi, which docs/03 reserves for "reminder and WhatsApp moments". | Colour semantics drift. | Use Safed for the poster button, or change the rule. |
| D29 | low | pay-390/1440 | "Kisi bhi UPI app se bharo" is a full-width Neel pill that looks like a button but appears to be a caption (unverified: not checked whether it is a link). | A non-tappable thing that looks tappable. | If it is a caption, make it text. If it is a button, make it `upi://` and say so. |

## Honesty and claims check (docs/07 s8)

| Claim we must not make | Result |
|---|---|
| "Better than Khatabook" / "first voice ledger" | Not made anywhere I saw. Landing explicitly says "Doosre ledger apps ke features humne yahan nahi tole." The comparison is against "Kaagaz ka khata". Good. |
| "Payments handled" / "auto-collect" | Not made. Pay page and post 3 say "paid" is not implied. But D01: the QR may route to a real handle, and "Paise seedhe dukaan ko jaate hain" is true in production but misleading in the demo. |
| "Works in all Indian languages" | Not made. |
| Testimonials, real users, invented numbers | None. The deck says "asli dukaanon par test nahi hua". Ad and deck mark "dramatisation", "illustration", "Real app capture, fictional demo data". Good. |
| "AI never makes mistakes" | Deck slide 5 says the opposite ("Hum yeh nahi kehte..."). Good. |
| Business model | Marked as hypotheses (gulabi pill). Slide 7 mentions "backup" as a paid extra. I found no backup feature, so keep it clearly a hypothesis. |
| Test numbers (104 unit, 16 e2e, 20/20) | Unverified by me. Check against the latest run. |

## 12-question checklist (docs/03 s14)

Q1 not swappable logo, Q2 no cream/serif-terracotta/neon/gradient, Q3 no uniform soft cards, Q4 no caps/dot-meta/arrow, Q5 no one-word accent, Q6 no fade-slide, Q7 no fake 01/02/03, Q8 stamp only memorable moment, Q9 tabular + Indian grouping + digits and words, Q10 glare/one-hand/390/reduced motion, Q11 specific Hinglish with matching verbs, Q12 shopkeeper recognises objects.

| Surface | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | Q11 | Q12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| landing 390 | pass | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (table clipped, header crowded) | **fail** ("void", "Send aap dabate ho") | pass |
| landing 1440 | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (void/history) | pass |
| shop home 390 | **fail** (summary plus list is a dashboard) | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (Bolo off-screen, toast over chips) | pass | pass |
| shop home 1440 | **fail** | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (toast over TypeBox) | pass | pass |
| customer 390 | pass (bahi edge) | pass | pass | pass | pass | pass | pass | pass | pass | pass (back link small) | pass | pass |
| customer 1440 | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| pay 390 | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| pay 1440 | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| try 390 | pass | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (disabled colours, pnpm text) | **fail** (pnpm text) | pass |
| try 1440 | pass | pass | pass | pass | pass | pass | pass | pass | pass | **fail** (disabled colours, pnpm text) | **fail** | pass |
| post 1 | pass | pass | pass | **fail** ("ledger" pill) | pass (highlight is the point) | pass | pass | **fail** (stamp as decoration, clipped) | pass | n/a | pass | pass |
| post 2 | pass | pass | pass | **fail** ("ledger" pill) | pass | pass | pass | pass | pass | **fail** (tiny text) | pass | **fail** (not a bahi) |
| post 3 | pass | pass | pass | **fail** ("ledger" pill) | pass | pass | pass | pass | pass | **fail** (13 px label) | pass | pass |
| ad frames | **fail** (f000 generic) | **fail** (orange halo) | pass | pass | pass | pass | pass | pass | pass | n/a | pass (mixed scripts) | pass |
| deck (markup only) | pass | pass | **fail** (uniform card grids) | pass | pass | pass | pass | pass | pass | unverified | pass | pass |

Reduced motion: handled in `globals.css` (`prefers-reduced-motion` neutralises the stamp, ring and transitions) and in `deck.css`. Not testable from stills.
Devanagari rendering: correct in every image (matras not clipped, "पाँच सौ रुपये" and "लिख लिया" render cleanly).
Accessibility from markup: `Stamp` has `role="img"` with `aria-label`, and the amount has an sr-only English reading. Good.

## What is good

- One clear idea ("bahi meets parchi meets stamp") that is visibly present on every surface.
- Colour discipline: flat Haldi, Sindoor, Neel and Pista blocks, hard-offset shadows, no gradient, glass, cream or Inter anywhere I looked. The contrast on Sindoor uses Syahi text as the rules require.
- The torn-edge parchi with Kalam echo, "Yeh likh doon?", digits plus Devanagari words, and a word-based direction ribbon ("Udhaar diya" / "Paise mile"). Colour is never the only signal.
- The red-cloth, stitched bahi page with two columns and a running balance. It is the most original screen.
- The stamp (`लिख लिया`) is rotated, with a faint ink-spread ring and a reduced-motion fallback. It is used consistently as the hero in the app, posts, ad and deck.
- Copy honesty: the demo banner, "Yeh dikhawa hai, kuch likha nahi gaya", "Dramatisation", "Real app capture, fictional demo data", the deck's "Abhi naapa nahi gaya" card, the hypothesis pill, and the landing footnote about not testing other apps.
- Safety messaging maps to design: confirm before write, amount in words, "Do Sharma ho to poochta hai", void not delete, a pay link is never "paid".
- Tap targets: `.btn`, `.chip` and `.input` have a 48 px minimum, and Bolo is 88 px.
- Deck: sticker styling carries over (3 px borders, 6 px hard shadow), the hypothesis slide is honest, and the notes warn against the forbidden claims.

## Priority order to fix

1. D01 (demo QR handle), D02 (placeholders), D03 (pnpm text in the UI), D04 (table clipped at 390).
2. D05 and D06 (Bolo/TypeBox dock and toast), D08 (disabled states).
3. Ad: D09, D10, D11, D13, D14.
4. Posts: D15 to D18 and the "ledger" pill, then the deck check D21 and D22.
