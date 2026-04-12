ALTER TABLE "Call" ADD COLUMN "vapiCallId" TEXT;

CREATE UNIQUE INDEX "Call_vapiCallId_key" ON "Call"("vapiCallId");
