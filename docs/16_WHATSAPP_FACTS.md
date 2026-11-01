# WhatsApp Business Cloud API facts (verified 2026-11-01, docs reading only)

Sources (Meta official unless noted):
- S1 https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages (redirects to the new docs tree)
- S2 https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages/
- S3 https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/authentication-templates/copy-code-button-authentication-templates/
- S4 https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes/
- S5 https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started/
- S6 https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput/
- S7 (web search, NOT Meta, community/vendor) forum threads on error 131030 (e.g. https://github.com/Neurotech-HQ/heyoo/issues/40, https://forums.rocket.chat/t/issues-with-whatsapp-cloud-app-integration-on-self-hosted-instance/20409) and vendor error lists (engagelab.com, aisensy.com, yellow.ai)

Note: the fetch tool summarises pages with a small model; JSON below for the text body is reconstructed from the field list in S2 (not a verbatim copy). The authentication template JSON was returned verbatim from S3.

## 1. Send-message endpoint - CONFIRMED (S1, S2)
- Method: POST
- URL: `https://graph.facebook.com/v26.0/<PHONE_NUMBER_ID>/messages` (docs examples show **v26.0** as of today; pattern `/<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages`). Make the version configurable.
- Path param: sender WhatsApp Business phone number ID (not the display phone number).
- Headers: `Authorization: Bearer <ACCESS_TOKEN>`, `Content-Type: application/json`.

## 2. Text message body and responses
CONFIRMED (S2): fields `messaging_product: "whatsapp"`, `recipient_type: "individual"`, `to`, `type: "text"`, `text: { body, preview_url (boolean, optional) }`.
```json
{ "messaging_product": "whatsapp", "recipient_type": "individual",
  "to": "+919876543210", "type": "text",
  "text": { "preview_url": false, "body": "Hello" } }
```
- `to` format CONFIRMED (S1, S2): include plus sign and country code; docs say plus, hyphens, parentheses, spaces are accepted and normalised (`+1 (631) 555-1234` -> `+16315551234`). If the plus is omitted the business number's country code is prepended (risk of wrong number). Recommendation: always send `+<country code><number>` (E.164). Digits-only with country code is UNVERIFIED as a documented-safe form.
- Success response CONFIRMED (S2): `{ "messaging_product":"whatsapp", "contacts":[{"input":"<sent number>","wa_id":"<wa id>"}], "messages":[{"id":"wamid...."}] }`. This only means the request was accepted; delivery status arrives via `messages` webhooks. `wa_id` may differ from `input`.
- Error response CONFIRMED (S4): `{ "error": { "message": "<code and title>", "type": "<type>", "code": <int>, "error_data": { "messaging_product":"whatsapp", "details":"<description>" }, "fbtrace_id": "<id>" } }`. `error_subcode` deprecated, not returned in v16+. Handle on `code` and `error_data.details`.

## 3. Customer service window - CONFIRMED (S1)
A 24-hour timer starts when a user messages or calls the business; every new user message/call resets it to 24h. While open, free-form service messages (including text) are allowed. When it closes, only pre-approved template messages may be sent. Recipient must also have opted in. Therefore: OTP/login codes to a user who has not messaged in the last 24h require a template (authentication category). Outside the window a free-form send fails with 131047 (S4).

## 4. Template message - CONFIRMED (S3)
Authentication template send body (verbatim from S3):
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "<CUSTOMER_PHONE_NUMBER>",
  "type": "template",
  "template": {
    "name": "<TEMPLATE_NAME>",
    "language": { "code": "<TEMPLATE_LANGUAGE_CODE>" },
    "components": [
      { "type": "body", "parameters": [ { "type": "text", "text": "<ONE-TIME PASSWORD>" } ] },
      { "type": "button", "sub_type": "url", "index": "0",
        "parameters": [ { "type": "text", "text": "<ONE-TIME PASSWORD>" } ] }
    ]
  }
}
```
Rules (S3): OTP appears twice (body + button) and the values must match; OTP max 15 characters; template content cannot include URLs, media or emoji; creation category `authentication`; footer `code_expiration_minutes` integer 1-90 (expiry warning only shown if set); `add_security_recommendation` boolean adds "do not share" line; `message_send_ttl_seconds` optional; button created as `{"type":"otp","otp_type":"copy_code","text":"<=25 chars"}` and Meta converts it to a URL button (hence sub_type url on send); template name max 512 chars; "I didn't request a code" button is beta. Docs also mention a "handshake with the WhatsApp client" required before sending (for one-tap/zero-tap types; details UNVERIFIED for copy-code). `index` appears as string "0" in Meta's docs (integer 0 seen in third-party docs; UNVERIFIED whether both accepted - use "0"). Plain generic (non-auth) template body shape: name + language.code + components - UNVERIFIED beyond the above.

## 5. Limits and error codes
CONFIRMED (S4 unless noted):
- 130429: Cloud API throughput limit hit; retry later / slow down.
- 80007: WABA rate limit reached; retry later.
- 131056: pair rate limit - too many messages from this sender to the same recipient in a short time; wait and retry.
- 131048: sender restricted / spam rate limit (check quality in WhatsApp Manager).
- 190: access token expired (get a new token). Code 0: app user couldn't be authenticated (token expired/invalidated).
- 131047: re-engagement - more than 24h since user's last reply; send a template.
- 131026: undeliverable (not a WhatsApp number, terms not accepted, outdated client).
- 132000: template variable count mismatch. 133010: number not registered. 368: WABA restricted for policy.
- Throughput CONFIRMED (S6): 80 messages/second per number by default; eligible numbers auto-upgraded to 1,000 mps (error 131057 during upgrade up to 1 min).
- 131030 "recipient not in allowed list": NOT in the Meta error page as fetched. UNVERIFIED from Meta; community sources (S7) say test numbers can send only to a pre-approved list of up to 5 recipients, each verified by an in-app code.
- Business-initiated tier limits (250/1K/10K/100K unique users per rolling 24h): UNVERIFIED (not in the page fetched; S6 only links to messaging-limits docs).

## 6. Tokens and phone number id - CONFIRMED (S5)
Temporary token: in the app dashboard WhatsApp > API Setup click "Generate access token"; short-lived, only for quick test sends. Phone number ID: in API Setup choose the "From" test (or added) number and note its phone number ID (page does not say exactly where displayed; it is shown under the From dropdown in practice - UNVERIFIED). Permanent token: Business Settings > System users > Add; Assign Assets giving full control (Manage app) of the app and WhatsApp account (Manage WhatsApp Business accounts); Generate token with permissions `business_management`, `whatsapp_business_messaging`, `whatsapp_business_management`; store securely. Test number allow-list (max 5 recipients, verified via code): UNVERIFIED from Meta docs (S5 does not mention it; community-confirmed in S7). In API Setup you choose a "To" number and must have the recipient reply to keep a conversation open.
