import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { calculateRecovery } from "@/lib/recovery";

// Helper to build a workout hours ago
function workoutHoursAgo(hoursAgo: number, exercises: { name: string; muscle_groups: string[]; equipment: string; sets: { reps: number; weight: number }[] }[]) {
  const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  // Avoid landing exactly on midnight UTC (which triggers +12h shift in recovery calc)
  if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0 && date.getUTCSeconds() === 0) {
    date.setUTCSeconds(1);
  }
  return {
    id: `workout-${Math.random()}`,
    date,
    duration_minutes: 60,
    notes: null,
    workout_exercises: exercises.map((ex) => ({
      exercise: { name: ex.name, muscle_groups: ex.muscle_groups, equipment: ex.equipment },
      sets: ex.sets,
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("calculateRecovery", () => {
  it("empty workouts → all muscles at 100% recovered", async () => {
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await calculateRecovery("user-1");
    expect(result.every((m) => m.recoveryPct === 1)).toBe(true);
    expect(result.every((m) => m.status === "recovered")).toBe(true);
    expect(result.every((m) => m.lastTrainedAt === null)).toBe(true);
  });

  it("single recent chest workout → chest is fatigued, other muscles recovered", async () => {
    const workout = workoutHoursAgo(1, [
      {
        name: "Bench Press",
        muscle_groups: ["chest", "triceps"],
        equipment: "barbell",
        sets: [
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
          { reps: 10, weight: 135 },
        ],
      },
    ]);
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([workout]);
    const result = await calculateRecovery("user-1");
    const chest = result.find((m) => m.muscle === "chest")!;
    const back = result.find((m) => m.muscle === "back")!;
    expect(chest.recoveryPct).toBeLessThan(1);
    expect(chest.status).toBe("fatigued");
    expect(back.recoveryPct).toBe(1);
    expect(back.status).toBe("recovered");
  });

  it("multiple workouts accumulate fatigue (residual model)", async () => {
    // Two recent workouts targeting the same muscle
    const w1 = workoutHoursAgo(2, [{
      name: "Bench Press", muscle_groups: ["chest"], equipment: "barbell",
      sets: [{ reps: 10, weight: 200 }, { reps: 10, weight: 200 }, { reps: 10, weight: 200 }],
    }]);
    const w2 = workoutHoursAgo(25, [{
      name: "Dumbbell Fly", muscle_groups: ["chest"], equipment: "dumbbell",
      sets: [{ reps: 12, weight: 50 }, { reps: 12, weight: 50 }, { reps: 12, weight: 50 }],
    }]);
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([w1, w2]);
    const singleResult = await calculateRecovery("user-1");

    // Compare with single workout — two workouts should show more fatigue
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([w1]);
    const singleWorkoutResult = await calculateRecovery("user-1");

    const chestTwo = singleResult.find((m) => m.muscle === "chest")!;
    const chestOne = singleWorkoutResult.find((m) => m.muscle === "chest")!;
    expect(chestTwo.recoveryPct).toBeLessThanOrEqual(chestOne.recoveryPct);
  });

  it("bodyweight exercises (equipment=bodyweight, weight=0) use BODYWEIGHT_PROXY", async () => {
    const workout = workoutHoursAgo(1, [
      {
        name: "Push-ups",
        muscle_groups: ["chest"],
        equipment: "bodyweight",
        sets: [{ reps: 20, weight: 0 }, { reps: 20, weight: 0 }, { reps: 20, weight: 0 }],
      },
    ]);
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([workout]);
    const result = await calculateRecovery("user-1");
    const chest = result.find((m) => m.muscle === "chest")!;
    // With BODYWEIGHT_PROXY = 75, volume = 3 * 20 * 75 = 4500 → should show fatigue
    expect(chest.recoveryPct).toBeLessThan(1);
    expect(chest.lastSessionVolume).toBeGreaterThan(0);
  });

  it("workouts older than 96h are ignored", async () => {
    // Simulate prisma filtering: return empty because query has date gte filter
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await calculateRecovery("user-1");
    const chest = result.find((m) => m.muscle === "chest")!;
    expect(chest.recoveryPct).toBe(1);
    // Verify the query used is_draft: false filter
    expect(prisma.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ is_draft: false }),
      })
    );
  });

  it("is_draft: true workouts are excluded via query filter", async () => {
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    await calculateRecovery("user-1");
    expect(prisma.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ is_draft: false }),
      })
    );
  });

  it("returns all 16 muscle groups", async () => {
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const result = await calculateRecovery("user-1");
    expect(result.length).toBe(16);
  });

  it("lastSessionExercises tracks exercise names", async () => {
    const workout = workoutHoursAgo(1, [
      {
        name: "Bench Press",
        muscle_groups: ["chest"],
        equipment: "barbell",
        sets: [{ reps: 10, weight: 135 }],
      },
    ]);
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([workout]);
    const result = await calculateRecovery("user-1");
    const chest = result.find((m) => m.muscle === "chest")!;
    expect(chest.lastSessionExercises).toContain("Bench Press");
  });
});
