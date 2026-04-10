---
applyTo: '**/prisma/**,**/*.repository.ts,**/prisma-errors.ts,**/prisma.ts'
---

# Database & Repository Conventions

## Repository Pattern

- Repositories are the only layer that touches Prisma.
- Return explicit result tuples, not exceptions, for expected outcomes:
  - Success: `{ created: true }` or `{ updated: true }`.
  - Expected failure: `{ created: false; reason: 'duplicate_call_control_id' }`.
- Re-throw unknown or non-idempotent database errors.
- Never embed business logic in repositories — that belongs in services.

## Prisma Error Handling

- Use centralized helpers from `src/lib/prisma-errors.ts`:
  - `isPrismaUniqueConstraint(error)` — P2002
  - `isPrismaRecordNotFound(error)` — P2025
  - `isPrismaRequiredRelationViolation(error)` — P2014
- Never inline Prisma error code strings (`'P2002'`) in repository code.

## Idempotency

- Duplicate webhook persistence is an expected outcome, not an error.
- Catch unique constraint violations and return `{ created: false; reason: 'duplicate_...' }`.
- Services log a warning for duplicates but do not throw.

## Schema Key Constraints

- `Call.callControlId` — unique, Telnyx idempotency key.
- `Order.callId` — unique, one order per call deduplication.
- `PhoneNumber.e164` — unique, routing key for tenant resolution.
- `CallStatus` enum: `initiated`, `in_progress`, `ended_by_user`, `ended_by_ai`, `ai_silence_timeout`, `failed`, `failed_telephony`, `failed_ai`, `no_answer`, `busy`.
- All date columns use `timestamptz`.

## Prisma Client

- Singleton lives in `src/lib/prisma.ts` (Neon adapter).
- Generated to `src/generated/prisma/`.
- Import the client from `src/lib/prisma.ts`, not from generated output directly.
