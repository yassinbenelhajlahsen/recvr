import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { invalidateSuggestionDraftId, setCooldownBypass } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { getSuggestionState, setDevBypass } from "@/lib/suggestion";
import { withLogging } from "@/lib/logger";

export const GET = withLogging(async function GET() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  const state = await getSuggestionState(userId);
  if (state.cooldown <= 0) return NextResponse.json({ cooldown: 0 });

  return NextResponse.json({
    cooldown: state.cooldown,
    ...(state.suggestion ? { suggestion: state.suggestion } : {}),
    ...(state.draftId ? { draftId: state.draftId } : {}),
    ...(state.suggestionId ? { suggestionId: state.suggestionId } : {}),
  });
});

/** Dev-only: clear suggestion + draft cache so a new one can be generated immediately. */
export const DELETE = withLogging(async function DELETE() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  // Clear Redis cache + set a short-lived bypass so DB fallback is also skipped.
  // Does NOT delete from DB — history is preserved.
  if (redis) {
    await Promise.all([
      redis.del(`suggestion:${userId}`),
      redis.del(`suggestion-id:${userId}`),
      invalidateSuggestionDraftId(userId),
    ]);
  }
  await setCooldownBypass(userId); // Redis bypass (if Redis available)
  setDevBypass(userId);            // In-process bypass (always works)

  return NextResponse.json({ ok: true });
});
