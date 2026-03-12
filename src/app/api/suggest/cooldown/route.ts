import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSuggestionCooldown, getCachedSuggestion, getSuggestionDraftId, invalidateSuggestionDraftId } from "@/lib/cache";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/logger";

export const GET = withLogging(async function GET() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  const cooldown = await getSuggestionCooldown(userId);
  if (cooldown <= 0) return NextResponse.json({ cooldown: 0 });

  // Fetch suggestion + draftId in parallel while we have an active cooldown
  const [suggestion, draftId] = await Promise.all([
    getCachedSuggestion(userId),
    getSuggestionDraftId(userId),
  ]);

  return NextResponse.json({
    cooldown,
    ...(suggestion ? { suggestion } : {}),
    ...(draftId ? { draftId } : {}),
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

  if (redis) {
    await Promise.all([
      redis.del(`suggestion:${userId}`),
      invalidateSuggestionDraftId(userId),
    ]);
  }
  return NextResponse.json({ ok: true });
});
