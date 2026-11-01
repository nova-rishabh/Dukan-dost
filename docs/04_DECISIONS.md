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
