import { prisma } from "@/lib/prisma";
import {
  getCachedSuggestion,
  setCachedSuggestion,
  getSuggestionCooldown,
  getSuggestionDraftId,
  setSuggestionDraftId,
  getCachedSuggestionId,
  setCachedSuggestionId,
  getCooldownBypass,
} from "@/lib/cache";
import { logger } from "@/lib/logger";
import type { WorkoutSuggestion } from "@/types/suggestion";

const COOLDOWN_SECONDS = 3600;

// In-process bypass for dev reset — works without Redis (module lives in the dev server process).
// Never used in production.
const _devBypass = process.env.NODE_ENV !== "production"
  ? new Map<string, number>() // userId → expiresAt (ms)
  : null;

export function setDevBypass(userId: string, ttlMs = 30_000): void {
  _devBypass?.set(userId, Date.now() + ttlMs);
}

function checkDevBypass(userId: string): boolean {
  if (!_devBypass) return false;
  const expiresAt = _devBypass.get(userId);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) { _devBypass.delete(userId); return false; }
  return true;
}

export type SuggestionState = {
  cooldown: number;
  suggestion: WorkoutSuggestion | null;
  draftId: string | null;
  suggestionId: string | null;
};

/**
 * Persist a new suggestion to the database.
 * Returns the new row ID, or null if the DB write fails (degraded gracefully).
 */
export async function persistSuggestion(
  userId: string,
  suggestion: WorkoutSuggestion,
  presets: string[],
): Promise<string | null> {
  try {
    const row = await prisma.suggestion.create({
      data: {
        user_id: userId,
        title: suggestion.title,
        rationale: suggestion.rationale,
        exercises: suggestion.exercises as object[],
        presets,
      },
      select: { id: true },
    });
    return row.id;
  } catch (err) {
    logger.error({ err }, "persistSuggestion failed (DB may need migration)");
    return null;
  }
}

/**
 * Update an existing Suggestion row to link it to a draft workout.
 */
export async function linkDraftToSuggestion(
  suggestionId: string,
  draftId: string,
  userId: string,
): Promise<void> {
  try {
    await prisma.suggestion.update({
      where: { id: suggestionId, user_id: userId },
      data: { draft_id: draftId },
    });
  } catch (err) {
    logger.error({ err, suggestionId, draftId }, "linkDraftToSuggestion failed");
  }
}

/**
 * Query the most recent suggestion row for a user.
 * Returns null if the latest suggestion is older than COOLDOWN_SECONDS or doesn't exist.
 */
async function getLatestSuggestionFromDb(userId: string): Promise<{
  id: string;
  suggestion: WorkoutSuggestion;
  draftId: string | null;
  cooldown: number;
} | null> {
  const row = await prisma.suggestion.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      title: true,
      rationale: true,
      exercises: true,
      draft_id: true,
      created_at: true,
    },
  });
  if (!row) return null;

  const secondsSince = (Date.now() - row.created_at.getTime()) / 1000;
  if (secondsSince >= COOLDOWN_SECONDS) return null;

  const cooldown = Math.max(0, Math.floor(COOLDOWN_SECONDS - secondsSince));
  const suggestion: WorkoutSuggestion = {
    title: row.title,
    rationale: row.rationale,
    exercises: row.exercises as WorkoutSuggestion["exercises"],
  };

  return { id: row.id, suggestion, draftId: row.draft_id, cooldown };
}

/**
 * Get the current suggestion cooldown state.
 * Checks Redis first (fast path), falls back to DB if Redis is empty/unavailable.
 * If DB has a recent suggestion but Redis is empty, rehydrates Redis.
 */
export async function getSuggestionState(userId: string): Promise<SuggestionState> {
  // Dev bypass: in-process (works without Redis) + Redis-backed
  if (checkDevBypass(userId)) {
    return { cooldown: 0, suggestion: null, draftId: null, suggestionId: null };
  }
  const bypassed = await getCooldownBypass(userId);
  if (bypassed) {
    return { cooldown: 0, suggestion: null, draftId: null, suggestionId: null };
  }

  // Fast path: check Redis TTL
  const redisCooldown = await getSuggestionCooldown(userId);

  if (redisCooldown > 0) {
    const [suggestion, draftId, suggestionId] = await Promise.all([
      getCachedSuggestion(userId),
      getSuggestionDraftId(userId),
      getCachedSuggestionId(userId),
    ]);
    return {
      cooldown: redisCooldown,
      suggestion,
      draftId,
      suggestionId,
    };
  }

  // DB fallback: check if a suggestion was generated within the cooldown window
  const dbResult = await getLatestSuggestionFromDb(userId);
  if (!dbResult) return { cooldown: 0, suggestion: null, draftId: null, suggestionId: null };

  // Rehydrate Redis so subsequent reads are fast
  await Promise.all([
    setCachedSuggestion(userId, dbResult.suggestion),
    setCachedSuggestionId(userId, dbResult.id),
    ...(dbResult.draftId ? [setSuggestionDraftId(userId, dbResult.draftId)] : []),
  ]);

  return {
    cooldown: dbResult.cooldown,
    suggestion: dbResult.suggestion,
    draftId: dbResult.draftId,
    suggestionId: dbResult.id,
  };
}
