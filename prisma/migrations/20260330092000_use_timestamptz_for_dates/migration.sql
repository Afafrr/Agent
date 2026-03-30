-- Convert timestamp columns to timezone-aware timestamptz.
-- IMPORTANT: This migration assumes existing timestamp values are already in UTC.

ALTER TABLE "Tenant"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE "Call"
  ALTER COLUMN "startedAt" TYPE TIMESTAMPTZ(3)
  USING "startedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "endedAt" TYPE TIMESTAMPTZ(3)
  USING "endedAt" AT TIME ZONE 'UTC';

ALTER TABLE "Order"
  ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'UTC';
