import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { normalizeGender } from "@/lib/utils";
import { logger, withLogging } from "@/lib/logger";
import { MAX_NAME_LENGTH, MAX_HEIGHT_INCHES, MAX_WEIGHT_LBS } from "@/lib/constants";

export const GET = withLogging(async function GET() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = claims.claims.sub as string;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        height_inches: true,
        weight_lbs: true,
        fitness_goals: true,
        gender: true,
        onboarding_completed: true,
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    logger.error({ err }, "GET /api/user/profile failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
});

export const PUT = withLogging(async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const data: Record<string, unknown> = {};

  if ("name" in body) {
    const trimmed = typeof body.name === "string" ? body.name.trim() : "";
    if (trimmed && trimmed.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: `Name must be ${MAX_NAME_LENGTH} characters or less` }, { status: 400 });
    }
    data.name = trimmed || null;
  }
  if ("height_inches" in body) {
    const v = body.height_inches;
    data.height_inches = typeof v === "number" && Number.isInteger(v) && v > 0 && v <= MAX_HEIGHT_INCHES ? v : null;
  }
  if ("weight_lbs" in body) {
    const v = body.weight_lbs;
    data.weight_lbs = typeof v === "number" && Number.isInteger(v) && v > 0 && v <= MAX_WEIGHT_LBS ? v : null;
  }
  if ("fitness_goals" in body) {
    const v = body.fitness_goals;
    if (Array.isArray(v)) {
      data.fitness_goals = v
        .filter((g: unknown) => typeof g === "string" && g.trim().length > 0 && g.length <= 100)
        .map((g: string) => g.trim())
        .slice(0, 3);
    } else {
      data.fitness_goals = [];
    }
  }
  if ("gender" in body) {
    data.gender = normalizeGender(body.gender);
  }
  if ("onboarding_completed" in body) {
    data.onboarding_completed = body.onboarding_completed === true;
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: {
        name: true,
        height_inches: true,
        weight_lbs: true,
        fitness_goals: true,
        gender: true,
        onboarding_completed: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    logger.error({ err }, "PUT /api/user/profile failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
});
