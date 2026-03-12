import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRecovery } from "@/lib/recovery";
import { logger, withLogging } from "@/lib/logger";

export const GET = withLogging(async function GET() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  try {
    const recovery = await getRecovery(userId);
    return NextResponse.json(recovery);
  } catch (err) {
    logger.error({ err }, "GET /api/recovery failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
});
