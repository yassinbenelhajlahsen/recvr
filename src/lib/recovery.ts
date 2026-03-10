import { prisma } from "@/lib/prisma";

export type MuscleRecovery = {
  muscle: string;
  recoveryPct: number; // 0–1
  status: "recovered" | "partial" | "fatigued";
  lastTrainedAt: string | null; // ISO date string
  hoursSince: number | null;
  lastSessionVolume: number | null; // total lbs
  lastSessionSets: number | null;
  lastSessionReps: number | null;
  lastSessionExercises: string[];
};

export const MUSCLE_GROUPS = [
  "chest",
  "triceps",
  "shoulders",
  "lower back",
  "hamstrings",
  "glutes",
  "traps",
  "back",
  "biceps",
  "rear shoulders",
  "quadriceps",
  "calves",
  "forearms",
  "core",
  "hip flexors",
  "tibialis",
] as const;

const BASE_RECOVERY_HOURS = 48;
const VOLUME_THRESHOLD = 5000; // lbs — "normal" session volume for a muscle group
const WINDOW_HOURS = 96; // how far back to look for workouts

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function getStatus(pct: number): MuscleRecovery["status"] {
  if (pct >= 0.85) return "recovered";
  if (pct >= 0.45) return "partial";
  return "fatigued";
}

export async function calculateRecovery(userId: string): Promise<MuscleRecovery[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_HOURS * 60 * 60 * 1000);

  // Fetch all workouts in the last 96 hours with full exercise/set data
  const workouts = await prisma.workout.findMany({
    where: {
      user_id: userId,
      date: { gte: windowStart },
    },
    select: {
      id: true,
      date: true,
      workout_exercises: {
        select: {
          exercise: { select: { name: true, muscle_groups: true } },
          sets: { select: { reps: true, weight: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // Build per-muscle data: track the worst fatigue across all workouts
  // Each workout contributes independently; we keep the worst (lowest pct)
  const muscleData = new Map<
    string,
    {
      recoveryPct: number;
      lastTrainedAt: string;
      hoursSince: number;
      lastSessionVolume: number;
      lastSessionSets: number;
      lastSessionReps: number;
      lastSessionExercises: string[];
    }
  >();

  for (const workout of workouts) {
    const workoutDate = new Date(workout.date);
    const hoursSince = (now.getTime() - workoutDate.getTime()) / (1000 * 60 * 60);

    // Aggregate volume and exercises per muscle group within this workout
    const muscleVolume = new Map<string, number>();
    const muscleSets = new Map<string, number>();
    const muscleReps = new Map<string, number>();
    const muscleExercises = new Map<string, string[]>();

    for (const we of workout.workout_exercises) {
      const { muscle_groups, name } = we.exercise;
      const exerciseVolume = we.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
      const exerciseSets = we.sets.length;
      const exerciseReps = we.sets.reduce((sum, s) => sum + s.reps, 0);

      for (const muscle of muscle_groups) {
        muscleVolume.set(muscle, (muscleVolume.get(muscle) ?? 0) + exerciseVolume);
        muscleSets.set(muscle, (muscleSets.get(muscle) ?? 0) + exerciseSets);
        muscleReps.set(muscle, (muscleReps.get(muscle) ?? 0) + exerciseReps);
        const exList = muscleExercises.get(muscle) ?? [];
        if (!exList.includes(name)) exList.push(name);
        muscleExercises.set(muscle, exList);
      }
    }

    // Compute recovery pct per muscle for this workout
    for (const [muscle, volume] of muscleVolume) {
      const volumeFactor = clamp(volume / VOLUME_THRESHOLD, 0.8, 1.5);
      const adjustedHours = BASE_RECOVERY_HOURS * volumeFactor;
      const recoveryPct = clamp(hoursSince / adjustedHours, 0, 1);

      const existing = muscleData.get(muscle);
      // Keep the worst (most fatigued) result across workouts
      if (!existing || recoveryPct < existing.recoveryPct) {
        muscleData.set(muscle, {
          recoveryPct,
          lastTrainedAt: workout.date.toISOString(),
          hoursSince,
          lastSessionVolume: muscleVolume.get(muscle) ?? 0,
          lastSessionSets: muscleSets.get(muscle) ?? 0,
          lastSessionReps: muscleReps.get(muscle) ?? 0,
          lastSessionExercises: muscleExercises.get(muscle) ?? [],
        });
      }
    }
  }

  // Return all 15 muscle groups, defaulting to fully recovered if untrained
  return MUSCLE_GROUPS.map((muscle) => {
    const data = muscleData.get(muscle);
    if (!data) {
      return {
        muscle,
        recoveryPct: 1,
        status: "recovered" as const,
        lastTrainedAt: null,
        hoursSince: null,
        lastSessionVolume: null,
        lastSessionSets: null,
        lastSessionReps: null,
        lastSessionExercises: [],
      };
    }
    return {
      muscle,
      recoveryPct: data.recoveryPct,
      status: getStatus(data.recoveryPct),
      lastTrainedAt: data.lastTrainedAt,
      hoursSince: data.hoursSince,
      lastSessionVolume: data.lastSessionVolume,
      lastSessionSets: data.lastSessionSets,
      lastSessionReps: data.lastSessionReps,
      lastSessionExercises: data.lastSessionExercises,
    };
  });
}
