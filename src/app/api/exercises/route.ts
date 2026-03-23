import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { getCachedExercises, setCachedExercises, invalidateExercises } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger, withLogging } from "@/lib/logger";
import { MUSCLE_GROUPS, MAX_NAME_LENGTH } from "@/lib/constants";
import type { Exercise as ExerciseRow } from "@/types/workout";

const VALID_MUSCLE_GROUPS = new Set<string>(MUSCLE_GROUPS);

export const GET = withLogging(async function GET(request: Request) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = claims.claims.sub as string;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  // Serve full list from cache when no search query
  if (!q) {
    const cached = await getCachedExercises(userId);
    if (cached) return NextResponse.json(cached);
  }

  let exercises: ExerciseRow[];

  try {
    if (q) {
      // Use raw SQL so we can do partial ILIKE matching on both name and array elements.
      // EXISTS + unnest lets us check if any muscle group contains the search term.
      exercises = await prisma.$queryRaw<ExerciseRow[]>`
        SELECT id, name, muscle_groups, equipment, (user_id IS NOT NULL) AS is_custom
        FROM "Exercise"
        WHERE (user_id IS NULL OR user_id = ${userId}::uuid)
          AND (
            name ILIKE ${"%" + q + "%"}
            OR EXISTS (
              SELECT 1 FROM unnest(muscle_groups) AS mg
              WHERE mg ILIKE ${"%" + q + "%"}
            )
          )
        ORDER BY user_id ASC NULLS FIRST, name ASC
      `;
    } else {
      const raw = await prisma.exercise.findMany({
        where: { OR: [{ user_id: null }, { user_id: userId }] },
        orderBy: [{ user_id: "asc" }, { name: "asc" }],
        select: { id: true, name: true, muscle_groups: true, equipment: true, user_id: true },
      });
      exercises = raw.map(({ user_id, ...rest }) => ({
        ...rest,
        is_custom: user_id !== null,
      })) as ExerciseRow[];
    }
  } catch (err) {
    logger.error({ err }, "GET /api/exercises failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  if (!q) {
    void setCachedExercises(userId, exercises);
  }

  return NextResponse.json(exercises);
});

export const POST = withLogging(async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rateLimited = await checkRateLimit(`exercises-create:${user.id}`, 60, 3600);
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { name, muscle_groups, equipment } = body;
  if (!name?.trim() || !Array.isArray(muscle_groups) || muscle_groups.length === 0) {
    return NextResponse.json(
      { error: "name and muscle_groups are required" },
      { status: 400 }
    );
  }

  const trimmedName = name.trim();
  if (trimmedName.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MAX_NAME_LENGTH} characters or less` }, { status: 400 });
  }
  if (equipment && typeof equipment === "string" && equipment.trim().length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Equipment must be ${MAX_NAME_LENGTH} characters or less` }, { status: 400 });
  }

  const invalidGroups = muscle_groups.filter(
    (g: unknown) => typeof g !== "string" || !VALID_MUSCLE_GROUPS.has(g),
  );
  if (invalidGroups.length > 0) {
    return NextResponse.json({ error: "Invalid muscle group(s)" }, { status: 400 });
  }

  try {
    const { user_id: _, ...exercise } = await prisma.exercise.create({
      data: {
        name: trimmedName,
        muscle_groups,
        equipment: equipment?.trim() || null,
        user_id: user.id,
      },
    });

    await invalidateExercises(user.id);
    return NextResponse.json({ ...exercise, is_custom: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Exercise already exists" }, { status: 400 });
    }
    logger.error({ err }, "POST /api/exercises failed");
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
});
