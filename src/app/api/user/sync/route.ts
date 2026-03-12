import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logger, withLogging } from "@/lib/logger";

export const POST = withLogging(async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.email) {
    return NextResponse.json({ error: "User email is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
        name: typeof body.name === "string" ? body.name : null,
      },
      select: { onboarding_completed: true },
    });

    return NextResponse.json({ ok: true, onboarding_completed: dbUser.onboarding_completed });
  } catch (err) {
    logger.error({ err }, "POST /api/user/sync failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
});
