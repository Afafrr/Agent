-- Sync migration: bridges all changes made outside migration history.
-- This migration was written manually and marked as applied via `prisma migrate resolve`.

-- 1. CallStatus enum
CREATE TYPE "CallStatus" AS ENUM ('initiated', 'in_progress', 'ended_by_user', 'ended_by_ai', 'ai_silence_timeout', 'failed', 'failed_telephony', 'failed_ai', 'no_answer', 'busy');

-- 2. Tenant: rename name → ownerName, drop slug
ALTER TABLE "Tenant" RENAME COLUMN "name" TO "ownerName";
DROP INDEX IF EXISTS "Tenant_slug_key";
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "slug";

-- 3. Call: rename telnyxCallControlId → callControlId, convert status to enum
DROP INDEX IF EXISTS "Call_telnyxCallControlId_key";
ALTER TABLE "Call" RENAME COLUMN "telnyxCallControlId" TO "callControlId";
CREATE UNIQUE INDEX "Call_callControlId_key" ON "Call"("callControlId");

ALTER TABLE "Call"
  ALTER COLUMN "status" TYPE "CallStatus" USING "status"::"CallStatus";

-- 4. Order: drop old columns, add new ones, add unique(callId)
DROP INDEX IF EXISTS "Order_tenantId_idempotencyKey_key";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "idempotencyKey";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "coalType";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "quantity";
ALTER TABLE "Order" ADD COLUMN "product" TEXT;
ALTER TABLE "Order" ADD COLUMN "amount_tons" DOUBLE PRECISION;
CREATE UNIQUE INDEX "Order_callId_key" ON "Order"("callId");

-- 5. TenantPromptConfig table
CREATE TABLE "TenantPromptConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "greeting" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "products" JSONB NOT NULL,
    "additionalInfo" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "TenantPromptConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TenantPromptConfig_tenantId_key" ON "TenantPromptConfig"("tenantId");

ALTER TABLE "TenantPromptConfig" ADD CONSTRAINT "TenantPromptConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
