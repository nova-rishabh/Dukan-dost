# To do (kept as a note, 2026-11-01)

> Current scope update (2026-11-01): owner-authorized pilot additions are implemented and verified in [completion/research report](25_PILOT_COMPLETION.md). Treat older gap/status and non-goal descriptions below as historical where superseded; broader accounting/staff modules and external release evidence remain explicitly separate.
## The ad (agreed: do it, but not yet)
The 30 s vertical ad renders and passes `verify:assets`, but it is not finished.

1. ~~Make shots 1 and 2~~ and ~~wire the clips in~~: done (the owner's Flows clips are in, with the dramatisation tag).
3. **Fix the frames the design review flagged** (`docs/reviews/02_design_slop.md`): D10 (blurry upscaled capture in the shot-3 frame), D11 (clipped reminder sheet and stray ring), D12 (the bottom 21% of every frame is an empty Syahi block with no captions), D13 (stock-looking flat illustration in frame 0), D14 (pale orange halo on the end-card logo, off-palette).
4. ~~Voice-over~~ Done (ElevenLabs stock voices Kishan and Raju, seven lines, checked by transcribing the finished mix). Listening to it and judging the delivery is still yours.
5. Replace `{{APP_URL}}` on the end card after deploy. Optional 1920x1080 cut.

## Deploy (do first)
- Render: fix `ADMIN_PASSWORD` and `ALLOWED_APPS` on `dukaan-wa`, confirm a healthy deploy, set the real `NEXT_PUBLIC_APP_URL`, pair the WhatsApp number at `/admin`, run `/setup`. Details: `docs/17_HANDOFF.md` section 6.
- Re-run `pnpm verify` (last full pass was before the Render commits).

## App and platform
- Move WhatsApp to the official Business Cloud API (`docs/16_WHATSAPP_FACTS.md`) and drop the unofficial `berryprotocol` client (ADR-025).
- Staff accounts and multi-shop. Single-owner login is done.
- A host with a persistent disk, if the real shop should be reachable from outside this computer: the SQLite file and the WhatsApp service both need one.
- Review or replace `berryprotocol` / `@berrysdk/core` if the unofficial client stays in use.
- Nonce-based CSP, so `script-src` can drop `'unsafe-inline'` (ADR-024).
- Shared rate limiter for real traffic; Gemini retry; PWA manifest.
- A persistent host for the SQLite file (a small server or Docker volume), since Vercel serverless cannot keep it (ADR-023).
- One logo mark used on every surface or none (D20).
- Desktop composition of "Kam hai" and "Safe kyun hai" (D27); a seeded low-stock item would help but changes test expectations.
- Live accuracy run (`pnpm verify:live`) once keys exist; real phone and Lighthouse checks.
- Hindi and Hinglish copy read by a native speaker.

## Latest ad update (2026-11-01)
20-second faster music cut rendered on codex/faster-ad. D10/D11: replaced soft/cropped footage sequences with sharper current app captures; D12: removed empty dark lower bands; D14: removed halo. Product URL is on ad end card. Original actor clips remain AI dramatisation; native-resolution footage, full-speed human listening/lip-sync and phone playback review remain open. Posts/deck still need final URLs/QR and regenerated exports. See deliverables/ad/REVIEW.md and docs/23_PATH_TO_EXCEPTIONAL_SUBMISSION.md. The app URL is reachable but still reported setupNeeded during read-only checks, so anonymous trial remains a blocker.
