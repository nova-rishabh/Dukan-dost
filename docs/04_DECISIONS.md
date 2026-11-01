# Decision log (ADRs)

Format: Context, decision, alternatives, consequences, status. Add new entries at the bottom; never rewrite history, mark old ones Superseded.

---

## ADR-001: Build Dukaan Dost
- **Date:** 2026-11-01. **Status:** Accepted.
- **Context:** Five ideas were judged by Gemini, ChatGPT and Grok on the challenge rubric (see 05_LOG.md). Averages were within 1-2 points: Scam Dojo about 77, Dukaan Dost about 77, Ghar Ki Awaaz about 76 (planned). Kagaz was dropped as the weakest on the "why not ChatGPT" test. Scam Dojo and Ghar Ki Awaaz had unverified close competitors.
- **Decision:** Build Dukaan Dost. Reasons: highest "Product works" average (the largest rubric line, 25 points), lowest stage risk (typed fallback), clear buyer, and the owner's stated preference.
- **Alternatives:** Scam Dojo (best ad, most consistent 2nd place), Ghar Ki Awaaz (best ad, riskiest and most crowded), Kagaz (dropped).
- **Consequences:** We must beat "another khata app" with a sharper wedge (ADR-002) and demonstrate it, because judges flagged crowded competition as the main weakness.

## ADR-002: Wedge is "voice to collection", not bookkeeping
- **Status:** Accepted.
- **Context:** Khatabook, OkCredit and Vyapar own the ledger. Voice ledgers reportedly exist too (unverified).
- **Decision:** Position as "the ledger you talk to" whose payoff is collecting the money: voice entry, confirm, reminder with pay link. Poster is secondary (P1).
- **Consequences:** The demo ends on a sent reminder with a pay page, not on a ledger screen.

## ADR-003: Mobile-first web app (PWA), not native
- **Status:** Accepted.
- **Decision:** Next.js web app optimised for a phone browser, installable, with a juror-friendly desktop landing.
- **Alternatives:** Expo/React Native (more setup, store friction), WhatsApp-only bot (approvals, no confirm card).
- **Consequences:** One link works for owner, juror and AI juror. Mic access depends on browser permission; typed and sample paths cover it.

## ADR-004: ElevenLabs Scribe for speech to text
- **Status:** Proposed (verify with the 20-sentence test).
- **Context:** We already have ElevenLabs. Hindi and English supported; Bengali to verify.
- **Decision:** Use Scribe in batch mode (record, upload, transcribe), not streaming, for reliability.
- **Alternatives:** Browser Web Speech API (inconsistent for Hindi and unavailable on some browsers), Whisper, Gemini audio input.
- **Consequences:** If accuracy on noisy Hinglish fails the test, switch to Gemini audio input behind the same `transcribe` interface.

## ADR-005: A fast LLM with strict JSON, plus deterministic checks
- **Status:** Proposed (needs an API key decision; open question 4).
- **Decision:** Gemini Flash-class model via AI Studio for extraction, validated by Zod; amounts cross-checked by a deterministic number parser. Claude Haiku 5.5 (`claude-haiku-5-5`) as the swap.
- **Rationale:** The model proposes, deterministic code disposes, the human confirms (TRD section 1).
- **Consequences:** Prompt and fixtures are versioned; any prompt change must keep the fixture pass-rate.

## ADR-006: WhatsApp click-to-send (`wa.me`), not the API, for v1
- **Status:** Accepted (confirm with owner, open question 6).
- **Context:** The WhatsApp Cloud API needs approved templates and has delivery windows; failure on stage is costly.
- **Decision:** Open WhatsApp with the message prefilled; the owner presses Send.
- **Consequences:** Honest and safe (owner approves every reminder). We do not claim auto-sending. API sending is P2.

## ADR-007: UPI pay via an HTTPS page with QR and deep link
- **Status:** Accepted.
- **Decision:** `/pay/[token]` builds `upi://pay?...` for the button and a QR. Payment status is never inferred.
- **Rationale:** Messaging apps do not reliably make `upi://` clickable. A page also lets us show a demo banner.
- **Alternatives:** Razorpay payment links (test mode available, reconciliation is P2).

## ADR-008: Supabase Postgres, money in paise
- **Status:** Accepted.
- **Decision:** Supabase with `pg_trgm` for fuzzy names; integer paise; append-only entries with void instead of delete; audit events.
- **Consequences:** Balances come from a view and are always explainable from entries.

## ADR-009: Confirm before every write
- **Status:** Accepted, non-negotiable.
- **Decision:** No model output writes to the database. Confirm card shows amount in digits and words and the direction in words. Big amounts need a second tap.
- **Rationale:** Every judge named a wrong financial entry as the worst failure.

## ADR-010: Deterministic poster rendering
- **Status:** Accepted for P1.
- **Decision:** Fixed HTML templates; the LLM chooses wording and items only. No image model for text.
- **Rationale:** Image models garble Hindi text.

## ADR-011: Design direction "bahi, parchi, stamp"
- **Status:** Accepted pending visual approval.
- **Decision:** See 03_DESIGN_SYSTEM.md. Bright flat colour, hard-offset shadows, handwriting for entries, one signature stamp moment.
- **Alternatives rejected:** fintech green and white; cream plus serif editorial; dark plus neon; glassmorphism.

## ADR-012: Fonts are Yatra One, Hind and Kalam; never Inter
- **Status:** Accepted.
- **Rationale:** Owner's rule; all three have true Devanagari, confirmed from the Google Fonts CSS.

## ADR-013: React Bits through the shadcn registry, used sparingly
- **Status:** Accepted.
- **Decision:** Install individual components (`@react-bits/<Name>-TS-TW`) and restyle to tokens. Shortlist in 03_DESIGN_SYSTEM.md section 9; backgrounds banned.

## ADR-014: Demo tenant without login
- **Status:** Accepted for the challenge.
- **Decision:** One fictional shop, server-side service role behind API routes, per-IP rate limits. Real shop data only with consent and a delete button.
- **Consequences:** Auth is v2.

## ADR-015: Language scope
- **Status:** Proposed.
- **Decision:** Hindi, Hinglish and English at launch. Bengali is a stretch pending a decision on which language local shopkeepers actually speak (open question 2).

## ADR-016: No numbers for stock
- **Status:** Accepted.
- **Decision:** "Atta kam hai" creates a flag only. We do not invent quantities, reorder amounts or prices.

---

## ADR-017: Clips are AI-made (ElevenLabs Flows plus HyperFrames); no real shopkeeper
- **Date:** 2026-11-01. **Status:** Accepted (owner decision).
- **Context:** Owner will make video clips with ElevenLabs Flows (ElevenCreative's node-based canvas for image, video, voice and sound) and HyperFrames. No real shopkeeper test is planned.
- **Decision:** The ad mixes (a) real footage of our own product (Playwright captures of the running app), (b) AI-generated counter scenes made in Flows, and (c) HyperFrames motion graphics. AI-generated people are labelled "dramatisation". We never present AI footage as a real customer or testimonial.
- **Consequences:** The "real-user proof" lever in the PRD is replaced by honest measured evidence: the 20-fixture results, simulated-session notes, and a stated plan to test with ten shops. Pitch wording changes accordingly (07, section 10).

## ADR-018: Provider adapters and a keyless mode
- **Status:** Accepted.
- **Context:** The build must run unattended without API keys; the owner adds keys afterwards.
- **Decision:** Every external service (ElevenLabs STT/TTS, Gemini, Supabase) sits behind an interface with a real adapter and a local adapter (in-memory or file store, canned STT for sample clips, rules-only interpretation). Tests run against the local adapters. `pnpm verify:live` exercises the real adapters once keys exist.
- **Consequences:** The app works end to end with no keys (typed input and sample clips). Live accuracy is unmeasured until `verify:live` runs.

## ADR-019: Gemini is the LLM; Bengali is out
- **Status:** Accepted (owner decision). Resolves ADR-005 and ADR-015.
- **Decision:** Gemini through the `@google/genai` SDK. Model id from the Gemini models page at the time of writing: `gemini-3.8-flash` (stable Flash class); verify at build time and keep the id in one config constant. No Bengali.

## ADR-020: Hybrid interpretation, rules first
- **Status:** Accepted.
- **Context:** The 20 fixtures must be testable offline, and latency matters on stage.
- **Decision:** A deterministic Hinglish/Hindi/English rules interpreter (verbs, particles, number words, names) runs first. If it returns a confident proposal, use it; otherwise call Gemini for a strict-JSON proposal. Both go through the same deterministic checks and the same confirm card.
- **Consequences:** Common phrases are instant and offline; open-ended speech still works with a key. Adds one module and its tests.

## ADR-021: Build-time decisions (2026-11-01)
- **Status:** Accepted.
- **Stateless signed proposals.** `/api/interpret` returns an HMAC-signed proposal token (`src/lib/proposal.ts`). `createEntry` refuses anything without a valid, unexpired token for the same shop, `confirmed: true`, an idempotency key, and every clarification resolved. Chosen over a server-side proposal table so it works on serverless and with no database. The server binds what may be written to the token: customer, direction and amount must equal the proposal unless the card asked the owner to choose them, a second confirm is required from Rs 5,000, and the idempotency key is derived from the token and intent index, so each intent of a proposal writes at most once. Badlo does not edit in place: an edited card is re-interpreted into a fresh proposal and goes through the same checks. A repeat of the same entry within 60 seconds is refused unless the owner acknowledged the warning.
- **Flagged intents carry a provisional kind.** A sentence like "Sharma ji 200 diye" yields `credit_given` with the `direction` clarification; the owner must pick Udhaar diya or Paise mile before Likh do is enabled. Nothing is guessed.
- **Mark as received uses the normal path.** "Mile mark karo" interprets "<name> ne <balance> diye" and shows the same parchi (P1-5, ADR-018).
- **Own Count Up and no React Bits install.** The React Bits registry sits outside the network the build was allowed to use, so Count Up is a small own component (`CountUp.tsx`, reduced-motion aware). Text Type, Sticker Peel and the others on the shortlist are not used.
- **Fonts via @fontsource.** Yatra One, Hind and Kalam ship as local woff2 from npm packages (Latin and Devanagari subsets); no runtime font requests.
- **TypeScript 6.** `typescript-eslint` did not support TypeScript 7 at build time, so the project pins TypeScript 6.0.
- **Poster wording is deterministic.** P1-2 parses item and price from the sentence; no model writes or draws any poster text, so Gemini is not involved.
- **modern-web-guidance was not applied, by the owner's decision.** The `npx` call was first blocked by the permission classifier; a later search-only run (output in `.goal/mwg/`) returned guide ids but the owner then chose to skip the pass, so no guide was applied. Known divergence from the `motion` guide: `globals.css` uses a global reduced-motion duration override that the guide discourages; the `dialog` guide's `closedby` and overscroll CSS are not applied. Mic capture, `<dialog>` and reduced-motion handling follow the TRD browser policy and MDN-level knowledge instead; this is unverified against that tool.

## ADR-022: Review fixes and known gaps (2026-11-01)
- **Status:** Accepted. Source: `docs/reviews/01_money_and_privacy.md`, `04_security.md`, `02_design_slop.md`, `03_docs_vs_code.md`, `05_independent_verification.md`.
- **Fixed:** proposal binding and server-derived idempotency (F1, F2, F10); signing secret has no key fallback and is required with Supabase (F3, S-06); LLM direction is always asked (F8); several amounts in one clause are asked (F7); second confirm tied to the amount (F9); duplicate guard enforced server-side (F11); undo token must match the entry (F5); pay link never exceeds the live balance (F6); origin check and JSON content-type on state-changing routes, Content-Length pre-check, bounded rate limiter that trusts the forwarded IP only on Vercel (S-02 to S-05); `is_demo` defaults to false and the balance view uses `security_invoker` (S-09, S-15); demo UPI id cannot route to a real account (D01); layout and copy defects from the design review.
- **Known gaps, not fixed (must be done before real shop data):** no authentication or per-shop access control (S-01, F4); no delete-my-data button or retention schedule, and raw sentences are kept in the audit log (S-16; the TRD and PRD promises are not yet met); no CSP or HSTS; rate limiter is per process; Gemini path has no retry; no PWA manifest.
- **Accepted for the keyless public demo:** shared demo ledger that anyone can write to, reset and read, with fictional data only.

## ADR-023: Supabase removed; SQLite file store instead (2026-11-01)
- **Status:** Accepted (owner decision: the Supabase limit was used up). Supersedes the Supabase parts of ADR-018 and the TRD data-layer sections.
- **Decision:** the `LedgerStore` interface stays. Supabase is gone (adapter, SQL, dependency, env names). The durable store is `SqliteStore` (`src/lib/store/sqlite.ts`) on Node's built-in `node:sqlite`: no account, no key, no new dependency. `DUKAAN_DB_FILE` selects it; `DUKAAN_SHOP_NAME` makes it an empty real shop instead of the seeded demo. The in-memory `LocalStore` remains the keyless demo default and the test double.
- **Guarantees kept, and tested by one contract test run against both stores:** integer paise with a CHECK, unique (shop, idempotency key), voided rows kept, audit retention, erase-my-data, reset to the seed.
- **Consequences:** needs a persistent disk, so it cannot hold data on Vercel serverless; the deployed link keeps using the demo store. `node:sqlite` is experimental in Node 24 (prints a warning, API may change), so pin the Node version. No row-level security: access control is the app's job and there is still no login (ADR-022). The old pg_trgm SQL matching and the `customer_balances` view are gone; balances and fuzzy matching are TypeScript, as before.

## ADR-024: Delete-my-data, audit retention, CSP (2026-11-01)
- **Status:** Accepted. Closes two gaps listed in ADR-022.
- **Delete-my-data:** `POST /api/shop/erase` removes the shop's customers, entries (and the sentences stored with them), stock notes, pay links and audit log, and keeps the shop row. It needs `confirmed: true` and the typed phrase "sab hata do", and is refused for the shared demo shop (use reset). The UI is `DataPanel` on the shop home with the retention note.
- **Retention:** raw sentences nobody confirmed ("proposal_shown" audit events) are dropped after 30 days, on every audit write, in both stores. Confirmed entries keep their sentence until the owner erases the data. Audio is never stored.
- **CSP and HSTS:** `Content-Security-Policy` and `Strict-Transport-Security` headers in `next.config.ts`. `script-src` keeps `'unsafe-inline'` because Next hydrates with inline scripts and there is no nonce plumbing yet, so the policy blocks foreign script hosts, framing, plugins, other-site form posts and `<base>` tricks but not injected inline script. A nonce-based policy is the next step. An e2e test checks the headers and that no page logs a CSP violation.
- **Still open from ADR-022:** (single-owner login is done, see ADR-025) no staff accounts or multi-shop; per-process rate limiter; no Gemini retry; no PWA manifest.

## ADR-025: Owner login and the WhatsApp service (2026-11-01)
- **Status:** Accepted (owner decision: use the supplied WA-USERAUTH zip, accept an unofficial WhatsApp client for the first days of testing, move to the official API later). Closes the "no login" gap in ADR-022 for single-owner use.
- **Decision:** a real shop (`DUKAAN_DB_FILE` set) has one owner and needs a login on every route except the pay page, `/api/status` and `/api/auth/*`. First run is a setup screen guarded by a setup code kept on the host machine (`SETUP_CODE`, else a random one in `.data/setup-code.txt`). Login is a passcode (scrypt, five-failure lockout) or a WhatsApp code. The session is an HMAC-signed HttpOnly SameSite=Lax cookie (7 days). The open demo shop stays without a login, so jurors can try it.
- **WhatsApp:** the supplied zip is vendored as `services/wa-userauth` and runs as its own process on 127.0.0.1:3001. It owns the paired device, the picture CAPTCHA, the rate limits and the one-time codes; Dukaan Dost calls its REST API from the server only (`src/lib/waService.ts`, `src/lib/waAuth.ts`). Codes go only to the registered owner's number. We added `POST /api/v1/messages/send` to it for reminders. No pluggable sender layer was built, by request.
- **Sending stays owner-triggered (CLAUDE.md rule 6, clarified):** a reminder is still a draft, and nothing is scheduled or automatic. The owner can open it in their own WhatsApp (`wa.me`), or tap "WhatsApp se bhejo" and confirm. The server accepts a send only with a session, `confirmed: true`, a pay link it issued for that customer inside the text, a 10 per minute limit, and records the send in the audit log without the phone number.
- **Risks, accepted for testing:** the transport library `berryprotocol` (and its dependency `@berrysdk/core`) is an unofficial WhatsApp Web client from a single anonymous maintainer; it holds the paired session and can get the number banned. Reviewed: the zip's own code (no exec, eval or foreign network calls). Not reviewed: that package. Mitigations: separate process, localhost only, spare number, secrets in gitignored `.env` files, `npm audit` clean after `npm audit fix`.
- **Cleaned from the zip:** `AGENTS.md`, the upstream README (it held a personal-looking number), the shipped `data/users.json` (a real-looking person's name, number and email), the demo page and browser script. Details in `services/wa-userauth/NOTICE.md`.
- **Later:** the official WhatsApp Business Cloud API replaces the vendored client for real use (`docs/16_WHATSAPP_FACTS.md`); only `waSendMessage` and the OTP calls change.
- **Still true:** one owner per shop, no staff accounts; the session is stateless (logout clears the cookie, changing `PROPOSAL_SECRET` signs everyone out); lockout counters are per process.

## ADR-026: Munshi guidance and daily khata navigation
- Status: accepted by owner on 2026-11-01 through approval of docs/18_AUDIT_AND_IMPROVEMENT_PLAN.md and waiver of the unavailable planning skill.
- Decision: use owner-supplied transparent Munshi art as decorative guidance alongside text. Keep the stamp as the success moment; never use the illustrated QR as a payment or pairing QR.
- Add customer name/area search and balance filters without modifying ledger values. Move WhatsApp, passcode and privacy controls into /shop/settings; add /shop/help for voice, direction and confirmation guidance.
- Existing confirmation, integer-paise storage, void history and owner-triggered reminder rules remain unchanged. No new staff, payment settlement or automatic reminder behavior.

## ADR-027: reliable first slice before public accounts
- Owner said Start on the roadmap and chose existing WhatsApp verification for public signup. Public accounts require tenant isolation and browser/purpose-bound registration proofs before being exposed; existing operator setup remains protected.
- Add durable owner auth versions. Password reset/change and confirmed logout-all revoke old cookies; legacy session version is invalidated on deployment.
- Reserve WhatsApp delivery per reviewed pay token before sending. Unknown/pending outcomes never retry automatically; changed balances/expired drafts require a fresh preview. Exactly-once external delivery is not claimed.
- Encrypt operator SQLite snapshots, validate restore into a new path, require signing-secret rotation before serving restored data. Off-host storage/scheduling remain operator work.
- Production mode fails closed without durable shop storage unless explicitly a fictional demo. Bootstrap code persists beside the database.
- Add typed English/Hinglish cookie-backed account preview. Preserve input text; migrate other screens in subsequent slices. This changes UI language support without changing money/confirmation rules.
