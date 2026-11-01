# Submission package and rehearsal

Prepared 2026-11-01. The owner authorized the remaining roadmap and packaging work. Local files were refreshed and exported; this document does not establish that the updated deployment or remote files are already published. Do not submit a link that still requires login or points to a missing upload.

## Five submission slots

| Slot | Prepared destination | Current release check |
|---|---|---|
| Product | [Fictional trial](https://dukaan-dost.onrender.com/try) | Trial code now provides an isolated browser workspace. Verify the released URL in an incognito browser after deployment; no owner data should appear. |
| Website | [Dukaan Dost website](https://dukaan-dost.onrender.com/) | Verify headline, English mode, trial CTA and mobile layout after release. |
| Three social posts | [Social post viewer](https://dukaan-dost.onrender.com/submission/social) | Refreshed PNGs and bilingual captions are local. The public viewer and its static files are packaged locally; verify after deployment. Source PNGs/captions also remain in the repository. |
| Video ad | [Video ad](https://dukaan-dost.onrender.com/submission/dukaan-dost-ad.mp4) | Existing final 20-second, 1080×1920 video is copied unchanged into public/submission. Verify playback after deployment. |
| Pitch deck | [Deck PDF](https://dukaan-dost.onrender.com/submission/deck.pdf) | Eight slides re-exported locally. Open the updated remote PDF after publication and scan its real trial QR. |

[Source repository](https://github.com/nova-rishabh/Dukan-dost) is supporting evidence, not a substitute for a product demo. The WhatsApp service admin URL is infrastructure and must not be presented as a consumer/demo link. Keep credentials and real customer data out of the package.

## What was corrected

- Deck and all three post footers now use the prepared `/try` URL. Deck contains a real QR encoding that URL, replacing the placeholder.
- Deck mentions Hindi/English, separate shops, dashboard, measured stock and statements without pretending these features prove demand.
- Removed stale test counts. The exact final counts belong in the current verification report rather than a hardcoded marketing slide.
- Reminders require review and explicit sending confirmation; configured service sending and manual WhatsApp are both supported. No automatic reminders are advertised.
- A pay link is not bank settlement. The balance changes through a confirmed payment entry; copy no longer says “mark paid” as if a link established payment.
- Original captured product images remain clearly fictional demo captures. The illustrated paper ledger and recreated parchi are not described as photographs of real shopkeepers. AI sample voices are disclosed as dramatisation.

## 2:45 pitch script with a network fallback

Timing is a rehearsal target, not a measured performance. Start a timer, practise out loud, and finish by 2:45 to leave a 15-second buffer within the three-minute slot. Use slides 1–8 and one short live action.

| Time | Action and spoken script |
|---|---|
| 0:00–0:20 | **Slides 1–2.** “Counter par bheed hai, haath mein saaman hai, aur udhaar ka hisaab bhi rakhna hai. Ek entry chhoot jaaye toh yaad par bharosa karna padta hai. Dukaan Dost mein aap bolte hain, app parchi dikhata hai, aur likhne ka faisla aap karte hain.” |
| 0:20–0:55 | **Slide 3 / short demo.** “Yeh fictional sample shop hai. Main likhta hoon: Gupta ji ko 500 udhaar diye. Parchi mein customer, 500, paanch sau rupaye aur udhaar ki disha dikhti hai. Tap se pehle hisaab nahi badalta. Ab confirm: stamp laga, entry likh gayi. ‘Ne’ aur ‘ko’ se disha badalti hai; do Sharma hon toh app poochta hai kaun.” |
| 0:55–1:15 | **Slide 5.** “AI galti kar sakta hai. Isliye model sirf sujhata hai. Rakam integer paise mein store hoti hai, repeat confirmation se duplicate roka jaata hai, aur correction purani entry ko void karti hai. Reminder mein bhi recipient aur message dekhkar owner hi bhejna confirm karta hai.” |
| 1:15–1:40 | **Slide 4, then product navigation.** “Hindi aur English dono hain. Public signup WhatsApp se hota hai; har dukaan ka data alag hai. Dashboard udhaar aur customer advance alag dikhata hai. Stock ki ginti hum banate nahi: opening count chahiye. Statements export ho sakti hain. Koi payment link payment ka saboot nahi hai.” |
| 1:40–2:05 | **Slide 6.** “Humne money direction, duplicate, recovery, shop isolation aur stock history ke automated checks kiye hain. Live AI providers par fictional smoke checks bhi hue hain. Lekin shop ke shor mein natural speech, real-phone WhatsApp receipt aur real dukaandaar ka repeated use abhi evidence gaps hain. Hum inhein users ka proof nahi bol rahe.” |
| 2:05–2:25 | **Slide 7.** “Business hypothesis simple hai: chhoti dukaan ko pehle useful daily ledger do. Advanced support ke liye paid plan ki demand hum test karenge. Abhi na paying-customer claim hai, na pricing proof. Shop-to-shop referrals ek channel hypothesis hai.” |
| 2:25–2:45 | **Slide 8.** “Agla test consenting shopkeepers ke saath hai: kya entry sahi bani, kitna waqt laga, aur kya woh agle din wapas aaye? Aap QR se fictional trial khol sakte hain. Dukaan Dost: bolo, parchi dekho, pakka karo.” |

**If the network fails:** stop after one failed attempt; say “Live connection unavailable hai. Yeh pehle captured fictional app flow hai.” Show slide 3 and the saved 20-second ad, then continue with the safety and evidence slides. Do not silently present a recording as a live action. Keep the PDF, ad, and two product screenshots available offline before the pitch. Do not try a real reminder on stage without explicit recipient consent.

## Evidence still needed for stronger judging

The rubric in `docs/00_INFO.md` is problem/idea 20, working product 25, website/social/ad 20, pitch 20, AI craft 15. More features do not guarantee more marks, and no guaranteed 100/100 score is possible.

| Rubric | Useful proof to collect | Honest current boundary |
|---|---|---|
| Problem and idea | Consented task observations, an actual missed-entry example, reason current tools are insufficient | No real-shop interviews or willingness-to-pay evidence recorded here. |
| Working product | Released incognito trial, two independent owner accounts, persistence after restart, export/restore rehearsal, authorized WhatsApp receipt | Local automated checks and fake daemon delivery are not production proof. |
| Website/social/ad | Five links that open without permission requests, legible phone playback, correct QR, licensed media, captions | Local PDF/PNG exports are refreshed. The video, PDF and PNGs are packaged for app hosting; release availability is still to be checked. Human listening and physical-phone review remain unperformed. |
| Pitch | Timed 2:45 recording, complete one-action demo, clear fallback, concise answers | Script is prepared; no rehearsal time or jury feedback is invented. |
| AI craft | Explain rules-first interpretation, model fallback, speech providers, deterministic validation and owner confirmation; show a caught failure | Tool use and fixtures are inspectable. They do not prove field accuracy. |

## Consented pilot worksheet

Ask permission before observing or recording. Use the participant's own words, and record failures as well as success. Avoid collecting real customer names or phone numbers in this repository.

1. Ask the shopkeeper to record credit, record a payment, choose between same-name customers, correct a mistake, and review a reminder without sending it.
2. For each task record success/failure, elapsed seconds, corrections, assistance needed, and the participant's explanation. Compare their existing method using the same fictional task.
3. Separately test clean and noisy natural speech. Keep a consented ground-truth transcript and report sample size, amount accuracy, direction accuracy, customer selection accuracy, and confirmation catches. Never replace natural speech with the fixture score.
4. An authorized owner-number WhatsApp receipt should record send time, receipt time, phone screenshot with number/content redacted, and any duplicates or uncertain states. A service response alone is not receipt evidence.
5. Follow up after repeated use before making retention or paid-demand claims. Offer a pricing question as a hypothesis, not a promised charge.

No external upload, real message, interview, screen-reader session, physical install, deployment or judging score was fabricated by preparing this package.

Public copies: public/submission/deck.pdf, dukaan-dost-ad.mp4, social/*.png and captions.md. credits.txt contains CC0 source attribution and AI-media disclosure. App-hosted copies are ready locally; none is asserted live before deployment. Original workshop instructions request a Drive folder/P7 form; app hosting does not claim that upload or form submission has occurred.
