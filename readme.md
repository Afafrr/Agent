# Multi-Tenant AI Voice Assistant Backend

## 1. Overview

This project is a production-oriented backend for a multi-tenant AI voice assistant SaaS. It handles inbound phone calls, resolves the correct tenant from the dialed number, bridges the live call from Telnyx into a Vapi SIP assistant, and persists call and order state in PostgreSQL.

The primary use case is customer phone ordering. A caller dials a business number, the AI assistant handles the conversation in real time, and structured tool calls from that conversation are converted into order records.

## 2. Key Features

- Multi-tenant data model with explicit tenant ownership across `PhoneNumber`, `Call`, and `Order`.
- Tenant resolution derived from the inbound number and persisted call context, not assistant-provided payloads.
- Signed, event-driven webhook handling for both Telnyx and Vapi.
- Real-time SIP handoff from Telnyx to Vapi, with AI tool calls converted into order records.
- Idempotent call and order persistence using database uniqueness guarantees to absorb duplicate webhook deliveries.
- End-to-end call lifecycle tracking with normalized phone numbers, timestamps, durations, and hangup causes.
- Database design centered on routing and deduplication keys such as `e164`, `telnyxId`, `callControlId`, and `callId`.
- Repository-level error handling so expected retry scenarios do not surface as application failures.

## 3. Architecture Overview

```text
Customer
  -> Telnyx inbound number
  -> POST /webhooks/telnyx
  -> Controller -> Service -> Repository
  -> Telnyx call answer + SIP transfer
  -> Vapi assistant
  -> POST /webhooks/vapi
  -> Tool-call processing + call status updates
  -> PostgreSQL
```

- `Telnyx` is the telephony ingress layer. It delivers inbound call events and executes answer/transfer actions.
- `Express controllers` terminate signed webhooks quickly and hand off provider-specific payloads for processing.
- `Services` orchestrate provider workflows, correlate events by provider IDs, and map external event semantics into internal state transitions.
- `Repositories` own Prisma access, constraint handling, and idempotent persistence behavior.
- `Vapi` runs the live AI voice assistant over SIP and emits structured tool calls plus terminal call reports.
- `PostgreSQL` is the durable source of truth for tenant routing, calls, and orders.

## 4. Technical Highlights

- Duplicate webhook delivery and race conditions are handled through database-backed idempotency, not request-memory flags. `Call.callControlId` is unique, `Order.callId` is unique, and repository methods convert expected uniqueness violations into no-op outcomes instead of 500s.
- The backend is stateless. Request handlers rely on persisted call context and provider identifiers, which makes the service horizontally scalable and safe to run behind a platform like Railway.
- Multi-tenant safety is enforced by deriving tenant ownership from the inbound phone number and the persisted call record. A Vapi tool call can create an order, but it cannot choose or override the tenant.
- The codebase uses a clear controller/service/repository split. Controllers handle transport concerns, services handle orchestration and business flow, repositories isolate database behavior, and provider SDK code lives under `src/integrations`.
- The system orchestrates two external platforms with different event shapes and timing models. Telnyx is the source of truth for ingress and transfer actions, while Vapi contributes AI-side tool execution and terminal call outcomes.
- Call persistence happens before answer/transfer actions so the system does not lose tenant routing context if downstream provider operations succeed while later events are still arriving.
- Provider events are correlated by durable IDs such as `call_control_id`, not by arrival order. That design is necessary for webhook retries, duplicate deliveries, and partially reordered event streams.
- Payload normalization is explicit. Timestamps are converted into ISO-compatible values, durations are parsed into numeric seconds, and provider-specific hangup reasons are mapped into a stable internal `CallStatus` model.

## 5. Tech Stack

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL on Neon
- Telnyx telephony API
- Vapi SIP voice assistant integration
