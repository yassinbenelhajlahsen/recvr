import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { withLogging } from "@/lib/logger";

const DEFAULT_LIMIT = 20;

export const GET = withLogging(async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const limitParam = parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10);
  const limit = isNaN(limitParam) || limitParam < 1 || limitParam > 100 ? DEFAULT_LIMIT : limitParam;

  const rows = await prisma.suggestion.findMany({
    where: {
      user_id: userId,
      ...(cursor ? { created_at: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { created_at: "desc" },
    take: limit + 1,
    select: { id: true, title: true, presets: true, draft_id: true, created_at: true },
  });

  const hasMore = rows.length > limit;
  const suggestions = rows.slice(0, limit).map((r) => ({
    id: r.id,
    title: r.title,
    presets: r.presets,
    draft_id: r.draft_id,
    created_at: r.created_at.toISOString(),
  }));

  return NextResponse.json({ suggestions, hasMore });
});
