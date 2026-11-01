# App audit and improvement plan

Date: 2026-11-01. Status: baseline audit complete; owner approved implementation and waived the unavailable planning skill. This is a source review and automated baseline, not a claim that all possible issues have been found.

## Verified baseline

`pnpm verify` returned `VERIFY-PASS`: typecheck, lint, unit/fixture tests, WhatsApp daemon tests, production build, Playwright and axe, style checks, secret checks, and asset checks all passed. Real deployment, phone usability, real WhatsApp delivery and live provider accuracy were not checked in this audit.

## Concrete findings

| Priority | Finding | Source | Proposed repair |
|---|---|---|---|
| High | Customer fetch errors other than 404 are swallowed, leaving a loading message indefinitely. | src/components/CustomerView.tsx, load | Separate loading, missing and failed states; expose a retry action and clear errors after successful reload. |
| High | Stock resolution has no catch, pending state or visible failure. Repeated clicks remain possible. | src/components/SummaryStrip.tsx | Disable the pending item, show a recovery hint, refresh only after success. |
| Medium | Each microphone session creates an AudioContext that is never closed. | src/components/BoloButton.tsx, meter | Retain and close the context during cleanup; test recorder teardown and permission races. |
| Medium | Balance read-back creates object URLs without revoking them. | src/components/Assistant.tsx, speakAnswers | Release on end/error and teardown; prevent stale answers playing after a newer request. |
| Medium | Mic startup is asynchronous but has no pending-start guard; multiple activations can request multiple streams. Pointer cancellation only resets pressed styling. | src/components/BoloButton.tsx | Guard permission/start lifecycle, release late streams on unmount, define cancellation behavior. |
| Medium | Shop fetch error gives no retry action; empty customer list gives no guidance. | src/components/ShopHome.tsx | Add retry and distinct loading, empty and search-no-results states. |
| Product gap | Finding a customer requires scanning the entire list. | src/components/ShopHome.tsx | Search name/area, filter owed/settled/advance, and announce result count. Keep original balances authoritative. |
| Product gap | WhatsApp, privacy and passcode controls crowd the daily khata screen. | src/components/ShopHome.tsx | Add an accessible settings screen while preserving existing routes and actions. |
| Product gap | No persistent in-app guide for the direction trap, confirmation, voice fallback and reminder flow. | src/app | Add a help screen with copyable example sentences, explicit direction explanations and links back to the shop. |

## Proposed implementation order

1. Reliability repairs above with focused regression coverage for failures and microphone lifecycle.
2. Customer search and balance filters; clear retry and empty states.
3. A shared Munshi avatar component using owner-supplied images. Welcome/namaste for guidance, thoughtful for help, apologetic for recoverable errors, sleeping for empty states, stamping only after confirmed success. Keep illustrations small enough that balances and actions remain primary. Inspect actual PNG transparency before choosing asset treatment; preserve originals. Never use the illustrated QR as a functional payment or pairing QR.
4. Help and settings screens linked from the shop. Existing money and reminder confirmations remain in place. No new accounting model or automatic sends.
5. Review the affected screens at 390 px and desktop, including keyboard navigation and reduced motion. Run `pnpm verify` after implementation and record exact results and remaining limitations in the handoff/log.

## Design direction

The khata remains a bahi with a speaking Munshi as a quiet guide. Haldi, outlined white slips, the existing fonts and the confirmation stamp remain the visual language. New screens should use everyday shop tasks and examples rather than generic dashboard tiles. Avatar poses must communicate a real state, with adjacent text that communicates the same information without relying on the image.

## Separate remaining work

Deployment verification needs the deployed URL. Real reminder/code sends require explicit recipient instructions. Ad D10-D14, output URL replacement and media re-renders remain separate deliverables to review after the app work. Official WhatsApp migration, staff accounts, multi-shop, shared rate limiting and CSP changes require their own scoped design; they are not silently included in this UI repair plan.

## Approval gate

CLAUDE.md says: "No code until the docs are approved and `superpowers:writing-plans` has produced a plan the owner approved." That skill was not available in the session catalog and no matching local file was found in the installed skill roots searched. This document supplies a reviewable plan; owner approval and a waiver of the unavailable skill requirement are needed before app implementation.

## Implementation result

Owner approved the plan and unavailable-skill waiver with "ok". Added search and balance filters, retry/empty states, microphone cleanup and pending permission guard, read-back URL cleanup and stale answer cancellation, stock failure handling, Help and Settings screens. Three original transparent Munshi images are used unchanged; the existing stamp remains the success feedback. The illustrated QR is not used.

Full `pnpm verify` returned `VERIFY-PASS` after implementation. New routes have mobile axe and overflow checks; Help at 390 px and Settings at desktop width were visually inspected. Real deployment, real phone usability and live provider delivery remain unverified.
