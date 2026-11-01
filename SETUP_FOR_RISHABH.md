# Setup for Rishabh

Two ways to run the same app:

- **Your real shop (this computer):** `DUKAAN_DB_FILE` is set in `.env`. Data lives in `.data/ledger.sqlite` on this machine. You set up one owner, and everything needs a login.
- **The open demo (for jurors):** leave `DUKAAN_DB_FILE` empty. A fictional shop, no login, sample clips, `/try`.

Legend: **[you]** needs you. **[done]** already built and verified.

## What WhatsApp is used for

1. **The reminder draft (always available):** "WhatsApp kholo" opens your own WhatsApp with the message typed (a `wa.me` link). You press Send.
2. **Sending from the app (needs the WhatsApp service paired):** "WhatsApp se bhejo", then "Haan, bhejo". It goes out from the paired phone. Only when you tap; never automatic.
3. **Login codes (needs the WhatsApp service paired):** "WhatsApp code se" on the login page. A picture CAPTCHA first, then a 6-digit code to your number.

Items 2 and 3 use the WA-USERAUTH service in `services/wa-userauth` (read its `NOTICE.md`). It uses an unofficial WhatsApp client, so use a spare number and expect it to be testing-only.

## Step 1 [done]: keys and settings

`.env` holds your ElevenLabs and Gemini keys, `PROPOSAL_SECRET`, `DUKAAN_DB_FILE`, and the connection to the WhatsApp service (`WA_SERVICE_URL`, `WA_APP_KEY`, `WA_APP_SECRET`). `.env` is gitignored. `.env.example` lists the names. Check:

```bash
pnpm setup:check
```

## Step 2 [you]: start both servers

Double-click `start-local.cmd` (opens two windows: the WhatsApp service on 127.0.0.1:3001 and the app on 127.0.0.1:3000), or run in two terminals:

```bash
pnpm wa:start
pnpm exec next start -H 127.0.0.1 -p 3000
```

Run `pnpm build` first after any code change. Both listen on this computer only; use `-H 0.0.0.0` for the app if you want to test from a phone on your Wi-Fi.

## Step 3 [you, once]: pair the WhatsApp number

Open `http://127.0.0.1:3001/admin`. The admin password is the `ADMIN_PASSWORD` line in `services/wa-userauth/.env`. Scan the QR with WhatsApp: Settings, Linked devices, Link a device. Use a spare number. The status on the shop page turns to "WhatsApp jura hua hai".

## Step 4 [you, once]: set up your shop

Open `http://localhost:3000`. It sends you to Dukaan set karo. Fill the shop name, your name, your WhatsApp mobile number and a passcode. The setup code is the text inside `.data/setup-code.txt` on this computer (it stops a stranger claiming your shop). You are signed in when it finishes.

## Step 5 [you]: log in later

Passcode, or "WhatsApp code se" (CAPTCHA, then a code on WhatsApp). Five wrong passcodes lock logins for 15 minutes. After a WhatsApp-code login you can set a new passcode without the old one (Passcode badlo on the shop page).

## Step 6 [you]: send a reminder

Customer page, Yaad dilao, type the customer's number with the country code, "WhatsApp se bhejo", then "Haan, bhejo". If the phone is not paired, use "WhatsApp kholo" instead.

## Step 7 [you]: test the live keys

```bash
pnpm verify:live
```

It does a Scribe round trip and a Gemini structured-output call. Not verified yet: the live calls were never run during the build, so the vendor request shapes are covered by mocked-HTTP tests only (`docs/14_API_FACTS.md`).

## Step 8 [you]: sample clip audio for the demo

```bash
pnpm samples:generate
```

Writes `public/samples/*.mp3` (AI voices, labelled dramatisation). Only the open demo shows the sample clips; a real shop sends `/try` to its own login.

## Step 9 [you]: the ad clips

You are making shots 1 and 2 in ElevenLabs Flows. Save them as `deliverables/ad/assets/clips/shot1.mp4` and `shot2.mp4`, then ask Claude to wire them into the ad. The list is in `docs/15_TODO.md`.

## Step 10 [you]: push to GitHub

The remote is already set to `https://github.com/nova-rishabh/Dukan-dost.git`. Nothing has been pushed. When you say so, run `git push -u origin master` (or ask Claude to). Check that `.env`, `.data/` and `services/wa-userauth/.env` are not in the push: they are gitignored.

## Step 11 [you]: where the public demo lives

The deployed link for jurors should be the **open demo** (no `DUKAAN_DB_FILE`, no WhatsApp service). Vercel's serverless disk cannot keep a SQLite file or run the WhatsApp service, so your real shop stays on this computer (or a small server you control).

**Render, for the open demo:** a Web Service with Node 22.13 or newer (set `NODE_VERSION=24`), build command `pnpm install --frozen-lockfile && pnpm build`, start command `pnpm start` (Render supplies `PORT`). Leave `DUKAAN_DB_FILE` and the `WA_*` variables out. Set `NEXT_PUBLIC_APP_URL` to the Render URL. Add `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` only if you want live voice and Gemini on the public demo (each visitor then spends your credits; the per-IP limits are modest). A real shop on Render needs a paid persistent disk for the SQLite file and a second private service for the WhatsApp service, and still no login for staff; keep it on your own machine for now. Replace `{{APP_URL}}` in the posts, captions, deck and ad after you have the public URL (see `docs/15_TODO.md`).

## Step 12 [you]: submit the five links

Product (`/try` on the demo), website (landing), the three posts, the ad, the deck. Open each in a private window on mobile data first. Nothing here submits for you. When you are ready for the official WhatsApp API, the verified facts are in `docs/16_WHATSAPP_FACTS.md`.
