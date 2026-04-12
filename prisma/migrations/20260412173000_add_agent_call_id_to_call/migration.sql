ALTER TABLE "Call" ADD COLUMN "agentCallId" TEXT;

CREATE UNIQUE INDEX "Call_agentCallId_key" ON "Call"("agentCallId");
