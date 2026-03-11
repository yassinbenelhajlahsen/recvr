import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { invalidateExercises, setSuggestionDraftId } from "@/lib/cache";
import type { WorkoutSuggestion, SuggestedExercise } from "@/types/suggestion";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { suggestion, date } = body as { suggestion: WorkoutSuggestion; date?: string };
  if (!suggestion || !Array.isArray(suggestion.exercises)) {
    return NextResponse.json({ error: "Invalid suggestion" }, { status: 400 });
  }

  // Load all exercises available to this user (global + user-created)
  const allExercises = await prisma.exercise.findMany({
    where: { OR: [{ user_id: null }, { user_id: user.id }] },
    select: { id: true, name: true, muscle_groups: true },
  });

  // Resolve each suggested exercise to a DB exercise ID sequentially to avoid
  // duplicate custom exercise creation if the AI repeats an unknown exercise name.
  const resolvedIds: string[] = [];
  let createdCustomExercise = false;
  for (const ex of suggestion.exercises as SuggestedExercise[]) {
    const { id, created } = await resolveExercise(ex, allExercises, user.id);
    resolvedIds.push(id);
    if (created) createdCustomExercise = true;
  }

  const now = new Date();
  const storedDate = date
    ? new Date(`${date}T${now.toISOString().slice(11)}`)
    : now;
  const dateLabel = storedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  const workout = await prisma.workout.create({
    data: {
      user_id: user.id,
      date: storedDate,
      notes: `Generated from recovery analysis on ${dateLabel}.`,
      duration_minutes: suggestion.estimatedMinutes ?? null,
      is_draft: true,
      source: "suggested",
      workout_exercises: {
        create: suggestion.exercises.map((ex: SuggestedExercise, i: number) => ({
          exercise_id: resolvedIds[i],
          order: i,
          sets: {
            create: ex.sets.map((s, j) => ({
              set_number: j + 1,
              reps: s.reps,
              weight: s.weight ?? 0,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  if (createdCustomExercise) {
    await invalidateExercises(user.id);
  }

  // Track that a draft was created from the current suggestion (for UI dedup)
  void setSuggestionDraftId(user.id, workout.id);

  return NextResponse.json({ id: workout.id }, { status: 201 });
}

async function resolveExercise(
  ex: SuggestedExercise,
  allExercises: { id: string; name: string; muscle_groups: string[] }[],
  userId: string,
): Promise<{ id: string; created: boolean }> {
  const suggestedLower = ex.name.toLowerCase();

  // Exact match
  const exact = allExercises.find((e) => e.name.toLowerCase() === suggestedLower);
  if (exact) return { id: exact.id, created: false };

  // Substring match (either direction)
  const fuzzy = allExercises.find(
    (e) =>
      e.name.toLowerCase().includes(suggestedLower) ||
      suggestedLower.includes(e.name.toLowerCase()),
  );
  if (fuzzy) return { id: fuzzy.id, created: false };

  // Create a custom exercise for this user
  const created = await prisma.exercise.create({
    data: {
      name: ex.name,
      muscle_groups: ex.muscleGroups,
      user_id: userId,
    },
    select: { id: true },
  });
  return { id: created.id, created: true };
}
