import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { withLogging } from "@/lib/logger";

export const GET = withLogging(async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  const { id } = await params;

  const row = await prisma.suggestion.findUnique({
    where: { id },
    select: {
      id: true,
      user_id: true,
      title: true,
      rationale: true,
      exercises: true,
      presets: true,
      draft_id: true,
      created_at: true,
    },
  });

  if (!row || row.user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    rationale: row.rationale,
    exercises: row.exercises,
    presets: row.presets,
    draft_id: row.draft_id,
    created_at: row.created_at.toISOString(),
  });
});
