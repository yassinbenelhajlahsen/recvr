import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSuggestionCooldown, getCachedSuggestion, getSuggestionDraftId } from "@/lib/cache";

export async function GET() {
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
}
