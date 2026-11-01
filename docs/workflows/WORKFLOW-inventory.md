# WORKFLOW: confirm inventory movement

> Implementation update (2026-11-01): owner approved items 2–7. See [shop operations](../24_SHOP_OPERATIONS.md) for the implemented APIs, policies and validation. Proposed contracts below are historical and must not be treated as current API documentation.
Version 0.1; 2026-11-01; Draft. Implements roadmap G06. No measured inventory API exists today. Existing low notes remain quantity-free and are not auto-converted into stock.

Actors: authenticated owner, validation/proposal service, store, operator. Prerequisites: confirmed product/unit, known opening quantity or explicit unknown state, tenant authorization, unit precision and negative-stock policy agreed. No purchasing/payment integration is assumed.

| Step / states | Proposed behavior / handoff | Failures, recovery and observable effects |
|---|---|---|
| 1. input → proposal | Owner selects product and movement (opening/in/out/adjustment/return); POST /api/inventory/proposals {productId, kind, quantityText, unit, reason, expectedVersion}; 200 {proposalToken, before, delta, after, warnings}; 10s budget. | Ambiguous product/unit/precision asks for clarification; invalid data 400; stale version 409 refreshes. No quantity changes. Unknown before stays unknown; block measured in/out/adjustment until an opening quantity is separately confirmed. Manual low notes remain available without a quantity. Operator logs validation categories only. |
| 2. proposal → confirmed movement | Parchi shows item, direction, quantity/unit, before/after and reason. POST /api/inventory/movements {proposalToken, confirmed:true, idempotencyKey, expectedVersion}; 201 {movementId, created, onHand, version}; 10s budget. | Unauthorized 401/403; expired proposal requires refresh; concurrent change 409 generates a new preview, not silent overwrite. Commit movement and resulting version atomically. Repeated key returns existing movement. |
| 3. committed → updated history | UI shows saved movement and new on-hand; low alert recalculated only from explicit threshold/known stock. | Timeout-after-commit is “checking status,” not “failed stock”; retrieve by idempotency key, then retry same request if safe. Offline edit remains a labelled draft, no claim of stock saved. |
| 4. active movement → reversal | Owner reviews a compensating movement with reason. Preserve original history. | A reversal cannot apply twice. Recompute stock under current version; conflicts require fresh review. No deletion of movement history. |

Common error response: {ok:false,error:{code,hint,retryable},requestId}. Endpoints are proposed, not implemented. UI pending/retry/expired/conflict/saved states must agree with persisted proposal/movement state. Operators can locate request/movement IDs without customer or credential logging.

Cleanup: unconfirmed proposals expire; failed transactions leave no movement or new quantity version; committed movement survives lost response. Never decrement stock simply because a credit entry or payment is recorded. Do not automatically retry with a new key.

Tests: opening known/unknown; piece and weighted units; invalid fractions and conversion; duplicate request; response lost after commit; two simultaneous stock-outs; expired proposal; negative-stock guard; damaged/returned stock; reversal repeated; cross-shop access; deleted/archived product; low threshold crossing; existing low flag without quantity; migration and restore preserve histories.

Assumptions/open questions: which units shopkeepers actually use; whether negative stock is blocked or explicitly overridden; whether products have selling/purchase prices; required returns and unit-change policies. Decimal prices depend on G09 exact-paise work. These must be resolved before this workflow becomes implementation-ready.

Review outcome: source reality check completed; unknown-baseline rule clarified above. Negative-stock override policy and required units remain owner decisions. Draft, not approved.
