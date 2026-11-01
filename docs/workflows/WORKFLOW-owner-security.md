# WORKFLOW: verified owner number change and account closure

Version 1; 2026-11-01. Implemented under the owner's instruction to complete the remaining roadmap. These are separate reviewed actions on `/shop/account/mobile` and `/shop/account`; neither is a support bypass.

## Number change

Authenticated owner → fresh old-account verification → new-number OTP requested → new-number verified → reviewed change → same shop, new login identity.

- Start requires current password or WhatsApp login from the last 15 minutes. Normalized new mobile must differ from the current one. The common durable OTP-send budget plus provider CAPTCHA/abuse controls protect the send.
- A ten-minute durable challenge binds purpose `mobile_change`, old shop, old credential version, normalized new mobile, and a hashed browser secret carried in an HttpOnly/SameSite cookie. No browser-selected shop or proof ID is authority.
- Verification claims the challenge atomically before calling the existing WhatsApp service; it checks the provider's authoritative normalized mobile. Attempts cap at five across restarts. Provider failure permits a controlled retry; no automatic send or retry occurs.
- Completion requires explicit confirmation and fresh old-owner verification again. In one transaction, it checks proof purpose/state/browser/expiry, the current owner's unchanged credential version, and new-mobile uniqueness; changes the mobile; increments the credential version; invalidates other pending proofs; and records a payload-free audit event. Old device cookies stop working. A new verified cookie is issued for the same shop.
- A new number already assigned to any shop is refused without changing either account. Another owner's cookie, a stolen proof ID, an expired proof or a concurrently revoked credential version cannot change the identity. Existing signup completion explicitly rejects mobile-change proofs.
- Losing access to both the password and old WhatsApp identity does not enable this flow. No insecure operator identity override is implemented.

## Account closure

Owner reads permanent-scope explanation → can export first → reviews closure → fresh old-account verification → types `close my shop` and confirms → active account and business records removed.

Closure is different from erasing business data: it removes the shop and owner login, customer/ledger/stock history, payment links, delivery state, activity, import receipts, and pending/completed identity proofs belonging to that owner. It is tenant-scoped and atomic, guarded by the owner's current credential version. Other shops remain intact. Old cookies and pay links fail. The response clears the active login cookie. Previously downloaded exports and operator backups are explicitly outside this operation.

The screen shows busy/error states and does not automatically retry. It never promises that backups were removed. Failure of reauthentication or confirmation changes nothing. The owner may sign up again after closure, but that does not restore the old data.

## Security evidence

Separate agent review exercised expired proof, wrong purpose/browser/owner/version, duplicate verified number, replay and successful number change against both stores. Integration tests use the real vendored daemon with a recording fake socket; no real WhatsApp messages. API tests cover import/closure reauthentication, cross-shop protection and session invalidation. Full build verification is recorded by the parent integration report.
