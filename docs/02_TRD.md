# Dukaan Dost: Technical Requirements Document

Status: Draft v1 for approval. Last updated: 2026-11-01. Companion to 01_PRD.md.
Browser support policy (for modern-web-guidance): Baseline Widely available features need no fallback. Newly available features only with feature detection and graceful fallback. No polyfills. Target: current Chrome on Android first, then iOS Safari, then desktop Chrome and Edge.

## 1. Architecture at a glance

```
 Phone/laptop browser (PWA, mobile-first)
 ┌───────────────────────────────────────────────────────┐
 │ Bolo button ──MediaRecorder──► audio blob              │
 │ Type box ───────────────────────────────┐              │
 │ Sample clips ──────────────┐            │              │
 └────────────────────────────┼────────────┼──────────────┘
                              ▼            ▼
                    POST /api/transcribe   (typed text skips this)
                    ElevenLabs Scribe (STT)
                              │ transcript
                              ▼
                    POST /api/interpret
                    1. normalise text (Devanagari/Roman)
                    2. LLM → strict JSON (Zod-validated)
                    3. deterministic checks (amount cross-check,
                       direction rules, customer match)
                              │ proposal (never a write)
                              ▼
                    Confirm card (client) ── owner taps "Likh do"
                              │
                              ▼
                    POST /api/entries  (idempotency key)
                              │
                              ▼
                    Supabase Postgres ──► summary view ──► UI (realtime or refetch)
                              │
              ┌───────────────┴─────────────────┐
              ▼                                 ▼
    GET /pay/[token] (UPI QR page)     wa.me deep link (owner sends)
              ▲
    ElevenLabs TTS (read-back, P1)   Poster renderer (P1, deterministic)
```

Principle: **the model proposes, deterministic code disposes, the human confirms.** The LLM never writes to the database.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js (latest stable, App Router) + TypeScript | One deployable for UI and API routes; fast on Vercel |
| Styling | Tailwind CSS v4 + CSS variables for tokens (03_DESIGN_SYSTEM) | Tokens as variables, utilities for speed |
| Components | Own components first; **React Bits** pieces via the shadcn registry (`@react-bits/<Name>-TS-TW`) | Distinctive motion without custom engines |
| STT | ElevenLabs Scribe (Hindi, English; Bengali to verify) | Already available to us; handles code-switching reasonably (to be tested, ADR-004) |
| LLM | A fast Gemini Flash-class model via Google AI Studio (confirm the current model id in AI Studio), with Claude Haiku 5.5 (`claude-haiku-5-5`) as the swap-in | Structured output, low latency, low cost (ADR-005) |
| TTS (P1) | ElevenLabs TTS, fixed voice, template strings only | Read-back; no free-form generation |
| DB | Supabase Postgres (`pg_trgm`, `unaccent`) | Fuzzy match in SQL, realtime optional |
| Validation | Zod schemas shared by client and server | One source of truth for the extraction contract |
| Poster (P1) | HTML + CSS rendered to PNG (`html-to-image` in the browser, or `@vercel/og` if the layout allows) | Crisp Hindi text; never an image model for text |
| Tests | Vitest (unit, extraction fixtures), Playwright (end-to-end), manual rehearsal checklist | See 06_TEST_PLAN |
| Hosting | Vercel (functions region closest to India, e.g. `bom1`) | Already set up |
| Secrets | Doppler or Vercel env. **Never paste keys in chat or commit them** | Safety |

## 3. Modules

| Module | Responsibility | Interface |
|---|---|---|
| `capture` | Mic permission, push-to-talk, MediaRecorder, level meter, typed input, sample clips | emits `{ source: "voice"|"text"|"sample", text?, audio? }` |
| `transcribe` | Audio to text via ElevenLabs; retries once; times out at 6 s | `transcribe(audio) → { text, language, confidence? }` |
| `interpret` | Text to `Proposal` (section 5) | `interpret(text, shopContext) → Proposal` |
| `numbers` | Deterministic Hindi, Hinglish and English number-word and digit parser, used as a cross-check | `parseAmounts(text) → number[]` |
| `resolve` | Customer matching | `resolve(name, shopId) → { candidates[], decision }` |
| `ledger` | Writes, voids, balances | `createEntry`, `voidEntry`, `getBalance` |
| `remind` | Message builder, pay token, wa.me link | `buildReminder(customer) → { text, waUrl, payUrl }` |
| `stock` | Low-stock flags | `flagLow(item)`, `resolveFlag(id)` |
| `speak` (P1) | TTS read-back from templates | `readBack(proposal) → audio url` |
| `poster` (P1) | Offer to image | `renderPoster(offer) → png` |
| `audit` | Append-only event log | `log(event)` |

## 4. Data model (Postgres)

All money is stored as **integer paise** (₹500 = 50000). No floats anywhere.

```sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  upi_vpa text,                 -- the shop's own UPI id (demo value in demo mode)
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  display_name text not null,            -- "Sharma ji (Block B)"
  name_roman text not null,              -- "sharma ji block b"
  name_devanagari text,                  -- "शर्मा जी"
  aliases text[] not null default '{}',  -- "R K Sharma", "Pinky didi"
  phone_e164 text,                       -- optional, never on public pages
  created_at timestamptz not null default now()
);
create index customers_trgm on customers using gin (name_roman gin_trgm_ops);

create type entry_type as enum ('credit_given', 'payment_received');

create table entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id),
  type entry_type not null,
  amount_paise bigint not null check (amount_paise > 0),
  note text,
  source_text text not null,             -- the sentence we heard
  source text not null check (source in ('voice','text','sample')),
  idempotency_key text not null,         -- client-generated; stops double taps
  confirmed_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text,
  unique (shop_id, idempotency_key)
);

create table stock_flags (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  item_name text not null,               -- "atta"
  level text not null default 'low',
  source_text text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table pay_tokens (
  token text primary key,                -- 22+ chars, unguessable
  shop_id uuid not null references shops(id) on delete cascade,
  customer_id uuid not null references customers(id),
  amount_paise bigint not null,
  expires_at timestamptz not null
);

create table audit_events (
  id bigint generated always as identity primary key,
  shop_id uuid not null,
  kind text not null,                    -- proposal_shown, entry_confirmed, entry_voided, reminder_opened
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create view customer_balances as
select c.id as customer_id, c.shop_id,
  coalesce(sum(case when e.type='credit_given' then e.amount_paise
                    when e.type='payment_received' then -e.amount_paise end), 0) as balance_paise
from customers c
left join entries e on e.customer_id = c.id and e.voided_at is null
group by c.id, c.shop_id;
```

Balance = credit given minus payments received, excluding voided entries. A positive balance means the customer owes the shop. Payments larger than the balance create a negative balance (advance); the UI labels it "Advance", never hides it.

Row-level security: on for every table. Demo mode uses a server-side service role through API routes only. The browser never holds the service key. Pay pages read through a server route keyed by token.

## 5. Interpretation contract

The LLM must return JSON that validates against this Zod schema, otherwise the request falls back to `unknown` and asks the owner to retry or type.

```ts
type Intent =
  | { kind: "credit_given";     customer: string; amountRupees: number; note?: string }
  | { kind: "payment_received"; customer: string; amountRupees: number; note?: string }
  | { kind: "stock_low";        item: string }
  | { kind: "query_balance";    customer: string }
  | { kind: "undo_last" }
  | { kind: "unknown";          reason: string };

type Proposal = {
  sourceText: string;
  intents: Array<Intent & {
    confidence: "high" | "medium" | "low";
    needsClarification?: "which_customer" | "amount" | "direction" | "new_customer";
    candidates?: Array<{ customerId: string; label: string; score: number }>;
    amountInWords?: { hi: string; en: string };
    needsSecondConfirm?: boolean;      // true if amount >= 500000 paise
  }>;
};
```

### Prompt rules (kept in code, versioned)
1. Output JSON only. No advice, no extra intents, no invented amounts.
2. **Direction by verb and particle:** the customer took on credit ("X ne N udhaar liye", "le gaye", "X ko N ka saman udhaar", "X ko N diye") = `credit_given`. The customer paid ("X ne N diye", "wapas kar diye", "jama kiye", "chuka diye") = `payment_received`. "X ne N diye" means X paid; "X ko N diye" means the shop gave. If the particle is missing ("X 200 diye") or the sentence is a statement of balance ("X ke N baaki hain"), return `needsClarification: "direction"` rather than guess.
3. Quantities of goods ("2 kilo chini") are never amounts. Only rupee amounts count.
4. Item shortages ("atta kam hai", "chini khatam") produce `stock_low` with the item name only.
5. Names stay as spoken; do not translate or correct them. Return a Roman and a Devanagari form when possible.
6. If the sentence is not about the shop, return `unknown`.

### Deterministic checks after the model
1. **Amount cross-check:** `numbers.parseAmounts(text)` must contain the model's amount. Mismatch means `needsClarification: "amount"` and the card shows both readings. Handles digits, Hindi and Hinglish words: ek, do, teen, ... sau, hazaar, plus idioms dedh (1.5), dhai (2.5), sadhe (plus half), paune (minus quarter).
2. **Customer resolution:** exact alias match, then `pg_trgm` similarity on `name_roman` (threshold about 0.35), then Devanagari transliteration. One strong match above 0.6 and a lead of at least 0.2 over the second means auto-select (still shown). Otherwise show chips. No match means "New customer" chip.
3. **High amount:** 500000 paise (₹5,000) or more means second confirmation.
4. **Duplicate guard:** same customer, type and amount within 60 seconds means a "Repeat entry?" warning.
5. **Amount ceiling:** above ₹1,00,000 is rejected as likely mishearing.

## 6. Confirm flow state machine

```
idle ──hold Bolo──► recording ──release──► transcribing ──ok──► interpreting ──ok──► proposal
  ▲                     │ error               │ error             │ error             │
  │                     ▼                     ▼                   ▼                   ├─ Badlo ► edit ► proposal
  │                  typed fallback ◄─────────┴───────────────────┘                   │
  │                                                                                    ├─ Likh do ► (second confirm if big) ► writing ► stamped ──► idle
  └──────────────────────────── Cancel ◄───────────────────────────────────────────────┘
```

Impossible states are blocked: you cannot write from `transcribing`, and the Likh do button is disabled while `writing` (plus the idempotency key). `stamped` triggers the one signature animation.

## 7. API routes

| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/transcribe` | POST | audio blob (webm/opus or mp4) | `{ text, language }` |
| `/api/interpret` | POST | `{ text, shopId }` | `Proposal` |
| `/api/entries` | POST | `{ shopId, customerId, type, amountPaise, sourceText, source, idempotencyKey }` | `{ entryId, balancePaise }` |
| `/api/entries/[id]/void` | POST | `{ reason }` | `{ ok }` |
| `/api/customers` | GET/POST | search and create | list or customer |
| `/api/summary` | GET | shopId | totals, top 3 debtors, low stock |
| `/api/remind` | POST | `{ customerId }` | `{ text, waUrl, payUrl }` |
| `/pay/[token]` | GET page | none | name, amount, shop, UPI QR, "Pay with any UPI app" |
| `/api/speak` (P1) | POST | `{ proposalId }` | audio stream |
| `/api/poster` (P1) | POST | `{ offer }` | PNG |

All routes validate with Zod, return typed errors with a recovery hint, and log timing.

## 8. WhatsApp and UPI

- **WhatsApp:** `https://wa.me/<countrycode><number>?text=<urlencoded message>` opens the owner's WhatsApp with the message ready. The owner presses Send. No API approval, works live, and matches the "owner approves" rule (ADR-006). Cloud API with approved templates is P2.
- **UPI:** the pay link is an HTTPS page, not a raw `upi://` link, because messaging apps do not reliably make `upi://` clickable. The page builds `upi://pay?pa=<vpa>&pn=<shop name>&am=<amount with 2 decimals>&cu=INR&tn=<note>` for the button and renders a QR of the same string. Demo mode shows a visible "Demo link" banner and uses a demo VPA unless we deliberately run the ₹1 live test (P1-5).
- Message template (Hinglish, owner can edit): "Namaste {name} ji, {shop} se. Aapka ₹{amount} baaki hai. Jab suvidha ho yahan se de dijiye: {payUrl}. Dhanyavaad."
- Status never auto-changes to paid. Owner presses "Mark as received", which creates a `payment_received` entry through the same confirm path.

## 9. Poster renderer (P1)

Input: `{ shopName, items[{name, priceRupees}], headline, validUntil }`. The LLM may only choose the headline wording and which in-stock items to feature. A fixed set of 3 HTML templates, local fonts, Devanagari-safe layout. Output: PNG 1080 by 1350 (portrait) with a "Share on WhatsApp" button. No image model is used for any text.

## 10. Voice details

- Capture: `MediaRecorder` with the best supported type (webm/opus on Chrome, mp4 on Safari). Push-to-talk with a 30 s cap. Show a live level meter so the owner sees the mic hears them.
- Noise: record at 16 kHz mono where the browser allows, `echoCancellation` and `noiseSuppression` constraints on. Never auto-send partial audio.
- Latency budget: record end to transcript 1.5 s, transcript to proposal 1.5 s, render under 0.3 s, total median 4 s or less. Show the transcript the moment it arrives so waiting feels short.
- Stage fallback ladder (in order): live mic, typed text, sample clip, prerecorded screen capture.

## 11. Security and privacy

- Secrets only in server env. Doppler or Vercel env. `.env.example` lists names only.
- Demo tenant is fictional. Real shop data only with explicit consent from the shopkeeper, with a delete button and a one-line retention note (audio is not stored; transcripts are kept only inside entries).
- Do not log raw audio or phone numbers. Mask phone numbers in logs and UI lists (last 4 digits).
- Pay pages use unguessable tokens with expiry and show only name and amount.
- Rate-limit API routes by IP in demo mode. Strict CORS. Input size limits.
- No third-party scripts except fonts and analytics we choose deliberately.
- AI-safety: prompts never include other tenants' data. Proposals are shown to the owner before any write. No medical, legal or financial advice anywhere.

## 12. Performance and quality budgets

| Item | Budget |
|---|---|
| Landing LCP on mid-range Android over 4G | 2.5 s or less; hero is text plus CSS, not a video |
| JS shipped on first load | Keep under about 170 KB gzipped; load React Bits effects only where used |
| Interaction response | Under 100 ms for taps, skeleton under 1 s, progress text under 10 s |
| Accessibility | WCAG 2.2 AA, tap targets at least 48 px, visible focus, reduced motion honoured, `lang="hi"` on Devanagari spans |
| Fonts | 3 families, subset to Latin and Devanagari, `font-display: swap`, preload the display face |

## 13. Observability

Console and Vercel logs with a request id. Timing per stage (transcribe, interpret, write). Audit events in the database. A hidden `/debug` page (demo only) shows the last 10 proposals with timings, so rehearsal problems are visible.

## 14. Environment variables (names only)

`ELEVENLABS_API_KEY`, `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `DEMO_SHOP_ID`, `DEMO_UPI_VPA`.

## 15. Build order (dependency order, matches 10_BUILD_PLAN)

1. Schema plus seed (fictional shop, 8 customers including two Sharmas).
2. `interpret` with fixtures passing before any UI (test first).
3. Confirm card plus ledger write plus summary.
4. Capture and transcribe.
5. Reminder plus pay page.
6. Juror mode and sample clips.
7. P1 items in order.

## 16. Risks (technical)

| Risk | Impact | Mitigation |
|---|---|---|
| STT mishears Hindi names or amounts in noise | Wrong proposal | Cross-check numbers, show amount in words, always confirm, typed and sample fallbacks |
| LLM returns invalid JSON or slow | Stalls demo | Zod validation, one retry, 6 s timeout, then typed fallback message |
| Venue Wi-Fi fails | Everything stops | Hotspot as primary, prerecorded capture as last resort, sample clips cached locally |
| Direction misread ("ne" versus "ko") | Wrong ledger sign | Grammar rules, direction in words, trap fixtures |
| Free-tier rate limits during judging | Errors for the AI juror | Cache sample-clip results, add per-IP limits, keep a static replay mode |
| Fonts or effects heavy on cheap phones | Janky first impression | Budgets above, reduced-motion path, test on a mid-range Android |

## 17. Addendum 2026-11-01: adapters, keyless mode, hybrid interpreter
- Interfaces: `SttProvider`, `LlmProvider`, `TtsProvider`, `LedgerStore`. Real: ElevenLabs Scribe v2, Gemini (`gemini-3.8-flash`, one config constant), ElevenLabs TTS, Supabase. Local: canned STT for sample clips, rules-only interpretation, in-memory or JSON-file ledger store. The app selects adapters from env; missing keys select the local adapter and show a visible "Demo mode" tag.
- Interpretation order: rules interpreter, then Gemini only if the rules return low confidence or unknown. Same deterministic checks and confirm card afterwards (ADR-020).
- Versions at prep time: Next.js 16.4.3, React 19.3.1, Tailwind 4.3.3, Zod 4.6.7, Vitest 5.0.5, Playwright 1.64.1. Re-check at install.

## 18. Addendum 2026-11-01 (after build): what the code actually does
Where this section and earlier text disagree, this section is right.
- **Routes.** `POST /api/transcribe` (audio body, or `{sampleId}`), `POST /api/interpret` `{text, source}` returns a signed proposal, `POST /api/entries` `{proposalToken, intentIndex, confirmed, secondConfirmed?, resolutions[], customerId, type, amountPaise, source, idempotencyKey, allowDuplicate?}` (shop comes from the server; the stored idempotency key is derived from the proposal), `POST /api/entries/[id]/void` `{reason, confirmed, proposalToken?, intentIndex?}`, `GET/POST /api/customers`, `GET /api/customers/[id]`, `GET /api/summary`, `POST /api/stock`, `POST /api/stock/[id]/resolve`, `POST /api/remind` `{customerId}`, `POST /api/speak` `{text}`, `POST /api/poster` `{text}` (returns the poster spec; the PNG is drawn in the browser), `GET /api/status`, `GET /api/debug` (demo shop only), `POST /api/demo/reset` (local demo store only), page `/pay/[token]`.
- **Reminder and WhatsApp.** The link is `https://wa.me/?text=...`. The owner types the customer's number in the sheet if they want it prefilled; the number is used only in the browser to build the link and is never stored or logged (`phone_e164` exists but is never written).
- **Balances** are computed in TypeScript from non-voided entries (`computeBalances`). The SQL view `customer_balances` and `match_customers()` in the migration mirror the logic for the Supabase side but the app does not call them yet.
- **Security statements in section 11, corrected.** Rate limiting is an in-process per-IP window (client IP trusted only behind Vercel). There is no CORS header; state-changing routes reject a mismatched `Origin` and non-JSON bodies. No CSP or HSTS. No authentication. The delete button and retention note promised in section 11 and the PRD are **not built** (ADR-022).
- **Models.** Only Gemini is wired as the LLM; the Claude swap-in in section 2 has no adapter, and `ANTHROPIC_API_KEY` is not read. The LLM path always adds a direction question.
- **Env names.** Added `PROPOSAL_SECRET` (required with Supabase). Optional, read by code: `ELEVENLABS_VOICE_ID`, `DUKAAN_DATA_FILE`, `DUKAAN_MEMORY_ONLY`, `DEMO_RESET_ON_BOOT`, `VERCEL`.
- **Sample clips** are canned transcripts until `pnpm samples:generate` creates audio; the "noisy" clip carries no noise until mixed with ffmpeg.
- **Audit.** Events record the sentence, resolutions and amounts; there is no actor field (no auth yet).
