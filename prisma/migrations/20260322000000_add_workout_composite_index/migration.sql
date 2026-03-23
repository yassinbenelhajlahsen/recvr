-- Replace single-column user_id index with composite (user_id, is_draft, date DESC)
-- Covers recovery engine, progress, and dashboard queries more efficiently
DROP INDEX IF EXISTS "Workout_user_id_idx";
CREATE INDEX "Workout_user_id_is_draft_date_idx" ON "Workout" ("user_id", "is_draft", "date" DESC);

-- Remove redundant single-column user_id index on Suggestion
-- The composite (user_id, created_at DESC) already covers user_id-only lookups
DROP INDEX IF EXISTS "Suggestion_user_id_idx";
