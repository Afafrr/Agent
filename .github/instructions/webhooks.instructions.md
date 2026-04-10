---
applyTo: '**/*.controller.ts,**/*.service.ts,**/*.middleware.ts,**/call-event.utils.ts'
---

# Webhook & Provider Conventions

## Webhook Reliability

- Controllers respond before async processing to prevent provider retry storms.
  - Telnyx: fire-and-forget `res.sendStatus(200)`.
  - Vapi: send `res.json({ success: true })` then process asynchronously.
- Idempotency is enforced by database unique constraints, not in-memory state.
- Duplicate webhook deliveries are expected — handle gracefully, never 500.

## Signature Verification

- Telnyx: `webhooks.unwrap()` via SDK in `telnyx.middleware.ts`. Rejects with 403.
- Vapi: HMAC-SHA256 with `x-timestamp` + `x-signature` headers in `vapi.middleware.ts`. Includes 5-minute replay window.
- Raw body parsing must happen before middleware (configured in `server.ts`).

## Provider Correlation

- Telnyx events are keyed by `call_control_id` (in `event.data.payload`).
- Vapi events carry the Telnyx `call_control_id` via multiple fallback paths (check in order):
  1. `message.call.metadata.telnyx_call_control_id`
  2. `message.call.transport.sip.headers['X-telnyx-call-control-id']`
  3. `message.call.phoneCallProviderDetails.sip.headers['X-telnyx-call-control-id']`
- When adding a new fallback location, add it to `vapi-call.service.ts` extraction logic.

## Status Normalization

- All provider-specific status/hangup-cause → `CallStatus` mapping lives in `src/modules/calls/utils/call-event.utils.ts`.
- Add new provider mappings to the maps in that file, not inline in services.
- `mapCallStatus()` accepts `{ provider, eventType?, payload, context? }` and returns a `CallStatus` enum value.

## Event Filtering

- Vapi SIP leg events from Telnyx are filtered using `isVapiSipDestination()` from `vapi.utils.ts`.
- Only the inbound customer leg is tracked in the Call record. The outbound SIP transfer leg is ignored.

## Call Lifecycle (Event Order)

1. `call.initiated` (Telnyx) → create Call, answer.
2. `call.answered` (Telnyx) → update to `in_progress`, transfer to Vapi.
3. Tool calls (Vapi) → create Order from `save_order`.
4. `end-of-call-report` (Vapi) → update Call with AI-side status + duration.
5. `call.hangup` (Telnyx) → update Call with hangup cause + end time.
