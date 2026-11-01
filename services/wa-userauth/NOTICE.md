# WA-USERAUTH (vendored)

This folder is a copy of the WA-USERAUTH service the owner supplied (MIT licence in its `package.json`; upstream: github.com/gxurav1710/WA-USERAUTH). Dukaan Dost uses it for two things: WhatsApp one-time-code login for the shop owner, and sending a reminder when the owner taps "WhatsApp se bhejo".

## What we changed
- Removed `AGENTS.md`, the upstream `README.md`, the `public/demo` page and the browser script `public/wa-userauth.js` (Dukaan Dost has its own login screens and talks to the REST API from its server). The upstream README had a personal-looking phone number in it.
- Removed the shipped `data/users.json`, which held a real-looking person's name, number and email; it is now gitignored and created on first use.
- Added `src/routes/messageRoutes.js` (`POST /api/v1/messages/send`, guarded by the app key and secret, 1000-character limit, 20 per minute) and `tests/messages.test.js`.
- Ran `npm audit fix` (Express body-parser and qs advisories).

## How it runs here
- Own process on `127.0.0.1:3001` (`pnpm wa:start`). Never expose that port: it holds the paired WhatsApp session in `data/berry_auth/`.
- Settings and secrets are in `services/wa-userauth/.env` (gitignored): admin password, admin session secret, and the app key/secret Dukaan Dost uses. The same app key/secret are in the main `.env` as `WA_APP_KEY` / `WA_APP_SECRET`.
- Pair the phone once at `http://127.0.0.1:3001/admin` (Linked devices, scan the QR).
- Its tests: `pnpm wa:test`.

## Risk, stated plainly
- The WhatsApp transport is the `berryprotocol` package (which depends on `@berrysdk/core`): an unofficial WhatsApp Web client from a single anonymous maintainer, with no repository link in the registry. We could review this folder's own code, not that package. It holds the paired session, so treat the paired number as exposed to it.
- Unofficial clients break WhatsApp's terms and can get the paired number banned. Use a spare number for testing, and move to the official WhatsApp Business Cloud API for real use (`docs/16_WHATSAPP_FACTS.md`).
