"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { DeleteWorkoutButton } from "@/components/workout/DeleteWorkoutButton";
import { fetchWithAuth } from "@/lib/fetch";
import type { WorkoutDetail, WorkoutPreview } from "@/types/workout";

type Props = {
  workout: WorkoutDetail | null;
  loading: boolean;
  previewData: WorkoutPreview | null;
  onEdit: () => void;
  onDelete: () => void;
};

export function WorkoutViewDetail({
  workout,
  loading,
  previewData,
  onEdit,
  onDelete,
}: Props) {
  const totalSets =
    workout?.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0) ??
    0;
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish() {
    if (!workout) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetchWithAuth(`/api/workouts/${workout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_draft: false }),
      });
      if (!res.ok) {
        setPublishError("Failed to save workout");
        return;
      }
      globalMutate(
        (k) => typeof k === "string" && k.startsWith("/api/workouts/"),
        undefined,
        { revalidate: false },
      );
      globalMutate("/api/recovery");
      globalMutate("/api/progress");
      onDelete(); // closes drawer and calls router.refresh() in WorkoutDetailDrawer
    } catch {
      setPublishError("Failed to save workout");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Preview skeleton while fetching */}
      {loading && previewData && (
        <>
          <div className="flex items-center gap-3 text-sm text-secondary">
            {previewData.durationMinutes && (
              <span className="tabular-nums">
                {previewData.durationMinutes} min
              </span>
            )}
            <span className="tabular-nums">
              {previewData.totalSets}{" "}
              {previewData.totalSets === 1 ? "set" : "sets"}
            </span>
          </div>
          {previewData.notes && (
            <p className="text-sm text-secondary italic border-l-2 border-accent/30 pl-3">
              {previewData.notes}
            </p>
          )}
          <div className="space-y-3">
            {previewData.exerciseNames.map((name) => (
              <div
                key={name}
                className="rounded-xl bg-surface border border-border-subtle overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-border">
                  <p className="font-semibold text-sm text-primary">{name}</p>
                </div>
                <div className="px-5 py-3.5 animate-pulse">
                  <div className="h-3 bg-bg rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading skeleton fallback */}
      {loading && !previewData && (
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-surface rounded-lg w-1/3" />
          <div className="h-24 bg-surface rounded-xl" />
          <div className="h-24 bg-surface rounded-xl" />
        </div>
      )}

      {/* Loaded workout */}
      {!loading && workout && (
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-secondary">
              {workout.duration_minutes && (
                <span className="tabular-nums">
                  {workout.duration_minutes} min
                </span>
              )}
              <span className="tabular-nums">
                {totalSets} {totalSets === 1 ? "set" : "sets"}
              </span>
              {workout.body_weight && (
                <span className="tabular-nums">{workout.body_weight} lbs</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {workout.is_draft && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="text-sm font-medium bg-accent text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {publishing ? "Saving..." : "Save Draft"}
                </button>
              )}
              <button
                onClick={onEdit}
                className="text-sm font-medium text-primary border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-colors"
              >
                Edit
              </button>
              <DeleteWorkoutButton workoutId={workout.id} onDelete={onDelete} />
            </div>
          </div>
          {publishError && (
            <p className="text-xs text-danger">{publishError}</p>
          )}

          {workout.notes && (
            <p className="text-sm text-secondary italic border-l-2 border-accent/30 pl-3 mb-2 mt-4">
              {workout.notes}
            </p>
          )}

          <div className="space-y-3">
            {workout.workout_exercises.map((we) => (
              <div
                key={we.id}
                className="rounded-xl bg-surface border border-border-subtle overflow-hidden"
              >
                <div className="px-5 py-3.5 border-b border-border">
                  <p className="font-semibold text-sm text-primary">
                    {we.exercise.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {we.exercise.muscle_groups.map((m) => (
                      <span
                        key={m}
                        className="text-xs text-muted bg-bg rounded-md px-2 py-0.5"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-5 py-3.5">
                  <div className="grid grid-cols-[40px_1fr_1fr] gap-4 mb-2 text-[11px] font-semibold text-muted uppercase tracking-wider">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight</span>
                  </div>
                  {we.sets.map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-[40px_1fr_1fr] gap-4 py-1.5 border-b border-border-subtle last:border-0"
                    >
                      <span className="text-sm font-medium text-muted tabular-nums">
                        {s.set_number}
                      </span>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        {s.reps}
                      </span>
                      <span className="text-sm font-medium text-primary tabular-nums">
                        {s.weight} lbs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
