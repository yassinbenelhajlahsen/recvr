-- CreateTable
CREATE TABLE "Suggestion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "exercises" JSONB NOT NULL,
    "presets" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "draft_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_draft_id_key" ON "Suggestion"("draft_id");

-- CreateIndex
CREATE INDEX "Suggestion_user_id_idx" ON "Suggestion"("user_id");

-- CreateIndex
CREATE INDEX "Suggestion_user_id_created_at_idx" ON "Suggestion"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_draft_id_fkey"
    FOREIGN KEY ("draft_id") REFERENCES "Workout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
