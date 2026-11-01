# To do (kept as a note, 2026-11-01)

## The ad (agreed: do it, but not yet)
The 30 s vertical ad renders and passes `verify:assets`, but it is not finished.

1. **Make shots 1 and 2** in ElevenLabs Flows from `deliverables/ad/FLOWS_PROMPTS.md`; save as `deliverables/ad/assets/clips/shot1.mp4` and `shot2.mp4`.
2. **Wire the clips in.** `deliverables/ad/index.html` (shots 1 and 2) still uses typographic stand-ins and does not read `assets/clips/`. Swap in the clips with the small "dramatisation" tag, keep the cuts on the same frames so the stamp hit stays at 15600 ms, run `pnpm ad:sync-sounds`, then `pnpm ad:render`, then `pnpm verify:assets`.
3. **Fix the frames the design review flagged** (`docs/reviews/02_design_slop.md`): D10 (blurry upscaled capture in the shot-3 frame), D11 (clipped reminder sheet and stray ring), D12 (the bottom 21% of every frame is an empty Syahi block with no captions), D13 (stock-looking flat illustration in frame 0), D14 (pale orange halo on the end-card logo, off-palette).
4. **Voice-over** (optional): `pnpm ad:vo` with an ElevenLabs key, then mix it in.
5. Replace `{{APP_URL}}` on the end card after deploy. Optional 1920x1080 cut.

## App and platform
- Login and per-shop access control. Until then do not host a real shop on a public URL (ADR-022).
- Nonce-based CSP, so `script-src` can drop `'unsafe-inline'` (ADR-024).
- Shared rate limiter for real traffic; Gemini retry; PWA manifest.
- A persistent host for the SQLite file (a small server or Docker volume), since Vercel serverless cannot keep it (ADR-023).
- One logo mark used on every surface or none (D20).
- Desktop composition of "Kam hai" and "Safe kyun hai" (D27); a seeded low-stock item would help but changes test expectations.
- Live accuracy run (`pnpm verify:live`) once keys exist; real phone and Lighthouse checks.
- Hindi and Hinglish copy read by a native speaker.
