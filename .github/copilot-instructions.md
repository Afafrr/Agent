# Copilot Instructions

## Purpose

Multi-tenant AI voice assistant backend — Telnyx telephony → Vapi SIP AI → PostgreSQL.
Scoped instruction files in `.github/instructions/` provide detailed conventions per area.

## Project Structure

```
src/
  server.ts                      # Express app, routes, middleware
  config/env.ts                  # All env access (only file that reads process.env)
  modules/
    calls/
      telnyx-webhook.controller.ts   # POST /webhooks/telnyx — fire-and-forget 200
      vapi-webhook.controller.ts     # POST /webhooks/vapi  — ack then async process
      telnyx-call.service.ts         # Telnyx event dispatch (initiated/answered/hangup)
      vapi-call.service.ts           # Vapi event dispatch (tool calls, end-of-call-report)
      call.repository.ts             # Call CRUD with result tuples
      handlers/
        call-actions.handler.ts      # answerCall() — Telnyx SDK wrapper
        call-transfer.handler.ts     # transferCallToAgent() — SIP transfer to Vapi
      utils/
        call-event.utils.ts          # Provider-agnostic status/timestamp/duration parsing
    orders/
      order.service.ts               # Processes save_order tool calls from Vapi
      order.repository.ts            # Order CRUD with result tuples
      order.types.ts                 # OrderMutationPayload, ParsedOrderToolCall
    phone/
      phone.repository.ts            # Phone number lookup for tenant routing
  integrations/
    telnyx/
      telnyx.client.ts               # createTelnyxClient() factory
      telnyx.middleware.ts            # Webhook signature verification
    vapi/
      vapi.client.ts                 # requireVapiSipUri() validator
      vapi.middleware.ts             # HMAC-SHA256 + replay protection
      vapi.utils.ts                  # isVapiSipDestination()
  lib/
    prisma.ts                        # Prisma client singleton (Neon adapter)
    prisma-errors.ts                 # Centralized P2002/P2014/P2025 detection
    file-logger.ts                   # JSON file logger for webhook debugging
prisma/
  schema.prisma                      # Tenant, PhoneNumber, Call, Order, CallStatus enum
tests/
  run-tests.ts                       # Node test runner
  telnyx-call.service.test.ts        # Telnyx service unit tests
```

## Architecture

### Layer Responsibilities

- **Controllers** — terminate HTTP, send immediate response, delegate to service. No business logic.
- **Services** — parse provider events, orchestrate workflows, call repositories and handlers.
- **Repositories** — Prisma access only. Return explicit result tuples `{ created: true }` or `{ created: false; reason }`. No throwing for expected database outcomes.
- **Handlers** — thin wrappers around provider SDK actions (answer, transfer). Live under `modules/*/handlers/`.
- **Integrations** — SDK client factories and middleware. Live under `src/integrations/*`. Never instantiate provider clients in controllers or repositories.
- **Utils** — pure functions for payload normalization. No side effects, no DB access.

### Data Flow

```
Webhook → Controller (200 OK) → Service → Repository → PostgreSQL
                                       → Handler → Provider SDK action
```

### Multi-Tenant Safety

- Tenant ownership is derived from the inbound phone number at call creation time.
- Never trust tenant identity from provider payloads or tool call arguments.
- Orders inherit their tenant from the persisted Call record.

### Runtime Flow

1. Telnyx delivers `call.initiated` → service looks up phone → creates Call record → answers.
2. Telnyx delivers `call.answered` → service updates status → transfers to Vapi SIP URI.
3. Vapi delivers tool calls during conversation → `save_order` creates Order linked to Call.
4. Vapi delivers `end-of-call-report` → updates Call with final status and duration.
5. Telnyx delivers `call.hangup` → updates Call with hangup cause and end time.

## TypeScript

- Strict mode enabled. Do not use `@ts-ignore` or `any` without justification.
- Target: ES2020, CommonJS modules.
- Prisma client is generated to `src/generated/prisma/`.

## Environment Variables

- All runtime config reads go through `env` from `src/config/env.ts`.
- Do not use `process.env` directly outside `src/config/env.ts`.
- Keep `dotenv/config` import only in `src/config/env.ts`.
- For new variables: update `env.ts` (with `requireEnv` if mandatory), `.env.example`, and README.
