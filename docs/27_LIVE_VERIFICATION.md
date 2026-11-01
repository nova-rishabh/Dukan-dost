# Live deployment verification

2026-11-01. Target: https://dukaan-dost.onrender.com. Initial functional checks completed at 09:32 UTC (15:02 IST); the complete live browser flow passed again after rollout at 09:40 UTC (15:10 IST). The source had previously been pushed as `0fe3b6c`; the follow-up UI corrections are deployed from `1f87fbc`.

## Results

`pnpm verify`: **VERIFY-PASS** — 282 unit/fixture tests, 48 WhatsApp service tests, 59 browser tests and 26 asset checks; typecheck, lint, production build, design and secret checks passed.

Live HTTP checks: **8 passed**. Health, public trial, signup, manifest, submission page, deck PDF, ad MP4 and social page all returned HTTP 200. The health response reported ready SQLite storage. Signup CAPTCHA returned HTTP 200 with a valid SVG. The WhatsApp service's admin login page returned HTTP 200; no admin authentication was attempted.

Live headless browser checks at 390 px: **13 passed, zero failed**.

| Check | Observed result |
|---|---|
| Readiness and anonymous access | Storage ready; anonymous owner summary refused with 401 |
| Private trial, browser A | Explicit start, fictional store, secure HttpOnly cookie |
| Private trial, browser B | Separate visitor session starts successfully |
| Confirm-before-write | Preview leaves balance unchanged; confirming records the expected ₹500 |
| Visitor isolation | Browser B does not see A's entry or additional fictional customer |
| Exact paise | Reviewed ₹12.34 payment changes only A's balance by 1,234 paise |
| Measured inventory | Explicit 1.005 kg opening count; B cannot read A's product history |
| CSV/dashboard | CSV served with correct type/paise; dashboard renders without serious/critical axe findings |
| Sample payment view | Correct live HTTPS origin; owner sees fictional warning, other visitor sees invalid link |
| CSP/offline privacy | Nonce script policy without unsafe-inline; offline cache holds public help, no private API/pages |
| Submission files | PDF has a real PDF header; ad/three PNGs served; hub renders |
| Signup | Public form loads without setup redirect; leaving sample restores anonymous protection |
| Runtime errors | No uncaught page errors during the browser flow |

Only temporary fictional visitor workspaces were changed. Both samples were exited. No real account was created, no OTP/reminder was sent, and no payment was initiated.

## Visual corrections found during inspection

- Active navigation was white text on a white chip because the component background overrode the utility background. Corrected the component's `aria-current="page"` selector and added a rendered color regression.
- Signup briefly said the verification image was unavailable while the image was still loading. Added an explicit pending state, disabled overlapping refreshes, and tested pending/failure/manual retry while preserving the entered number.
- Both corrections pass the full local verification suite and were verified on the public deployment. The active link computes to a Syahi background `rgb(22, 18, 58)` with white text. A deliberately delayed signup CAPTCHA shows the loading state, disables refresh, and then renders its SVG successfully. All 13 live browser checks and all eight HTTP checks passed again after rollout.
- The served ad was loaded in Chromium without audible playback: duration 20 seconds, dimensions 1080×1920, and seeking to one second decoded a frame successfully.
- Two transient 502 responses were observed while Render switched builds. The app recovered and served the new stylesheet before the successful post-rollout checks.

Local screenshots and machine-readable results: `.goal/live/` (gitignored). The live capture includes only fictional sample data and public pages.

## Limits

This verifies public availability and fictional browser workflows. Real owner signup/OTP receipt, reminder receipt/read status, bank settlement, actual-phone usability, production restore, sustained load, off-host backup scheduling and official WhatsApp migration were not exercised. CAPTCHA/service-page availability does not prove WhatsApp is paired or that a message will arrive.
