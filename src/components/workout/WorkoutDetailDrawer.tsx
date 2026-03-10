"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "@/components/ui/Drawer";
import { DeleteWorkoutButton } from "@/components/workout/DeleteWorkoutButton";
import { WorkoutForm } from "@/components/workout/WorkoutForm";
import { useWorkoutStore } from "@/store/workoutStore";
import type { SessionSummaryData, WorkoutDetail } from "@/types/workout";

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr));
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr));
}

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.15, ease: "easeOut" },
} as const;

export function WorkoutDetailDrawer() {
  const {
    isDrawerOpen,
    drawerView,
    selectedWorkoutId,
    previewData,
    activeSession,
    closeDrawer,
    setDrawerView,
  } = useWorkoutStore();
  const router = useRouter();

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset loaded data when the selected workout changes
  const [trackedId, setTrackedId] = useState<string | null>(null);
  if (isDrawerOpen && selectedWorkoutId && selectedWorkoutId !== trackedId) {
    setTrackedId(selectedWorkoutId);
    setWorkout(null);
    setLoading(true);
  } else if (!isDrawerOpen && trackedId !== null) {
    setTrackedId(null);
    setWorkout(null);
  }

  const fetchWorkout = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/workouts/${id}`);
      setWorkout(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loading && selectedWorkoutId) fetchWorkout(selectedWorkoutId);
  }, [loading, selectedWorkoutId, fetchWorkout]);

  function handleCreateSave(data: SessionSummaryData) {
    setDrawerView("summary", data);
    router.refresh();
  }

  function handleEditSave(data: SessionSummaryData) {
    setWorkout({
      id: data.id,
      date: data.date,
      duration_minutes: data.duration_minutes,
      notes: data.notes,
      workout_exercises: data.workout_exercises.map((we, i) => ({
        ...we,
        order: i,
      })),
    });
    setDrawerView("view");
    router.refresh();
  }

  function handleViewDetails() {
    if (!activeSession) return;
    setWorkout({
      id: activeSession.id,
      date: activeSession.date,
      duration_minutes: activeSession.duration_minutes,
      notes: activeSession.notes,
      workout_exercises: activeSession.workout_exercises.map((we, i) => ({
        ...we,
        order: i,
      })),
    });
    useWorkoutStore.setState({ selectedWorkoutId: activeSession.id });
    setDrawerView("view");
  }

  const drawerTitle =
    drawerView === "create" ? "Log Workout"
    : drawerView === "summary" ? "Workout Logged"
    : drawerView === "edit" ? "Edit Workout"
    : workout ? formatDate(workout.date)
    : previewData ? previewData.dateFormatted
    : loading ? " "
    : undefined;

  // Freeze the title during close animation — closeDrawer() resets drawerView
  // immediately, which would drop the title to undefined and collapse the header
  // before the drawer finishes sliding out.
  const frozenTitle = useRef<string | undefined>(undefined);
  if (drawerTitle !== undefined) frozenTitle.current = drawerTitle;
  const effectiveTitle = isDrawerOpen ? drawerTitle : frozenTitle.current;

  const totalSets =
    workout?.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0) ?? 0;

  const summaryTotalSets =
    activeSession?.workout_exercises.reduce((sum, we) => sum + we.sets.length, 0) ?? 0;

  const initialData = workout
    ? {
        date: workout.date.split("T")[0],
        notes: workout.notes,
        duration_minutes: workout.duration_minutes,
        exercises: workout.workout_exercises.map((we) => ({
          exercise_id: we.exercise.id,
          exercise_name: we.exercise.name,
          muscle_groups: we.exercise.muscle_groups,
          order: we.order,
          sets: we.sets.map((s) => ({
            set_number: s.set_number,
            reps: s.reps,
            weight: s.weight,
          })),
        })),
      }
    : undefined;

  return (
    <Drawer open={isDrawerOpen} onClose={closeDrawer} title={effectiveTitle}>
      <div className="px-5 py-5">
        <AnimatePresence mode="wait" initial={false}>

          {/* ── Create ── */}
          {drawerView === "create" && (
            <motion.div key="create" {...fadeSlide}>
              <WorkoutForm
                compact
                onSave={handleCreateSave}
                onCancel={closeDrawer}
              />
            </motion.div>
          )}

          {/* ── Summary ── */}
          {drawerView === "summary" && activeSession && (
            <motion.div key="summary" {...fadeSlide} className="space-y-8">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-white"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <p className="text-sm text-secondary">{formatDateShort(activeSession.date)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {activeSession.duration_minutes && (
                  <div className="col-span-2 rounded-xl bg-surface border border-border-subtle px-5 py-3 flex items-center justify-between">
                    <span className="text-xs text-muted uppercase tracking-wider font-semibold">Duration</span>
                    <span className="text-sm font-bold text-primary tabular-nums">{activeSession.duration_minutes} min</span>
                  </div>
                )}
                <div className="rounded-xl bg-surface border border-border-subtle p-5 text-center">
                  <p className="text-3xl font-bold text-primary tabular-nums">
                    {activeSession.workout_exercises.length}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {activeSession.workout_exercises.length === 1 ? "exercise" : "exercises"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface border border-border-subtle p-5 text-center">
                  <p className="text-3xl font-bold text-primary tabular-nums">{summaryTotalSets}</p>
                  <p className="text-xs text-muted mt-1">{summaryTotalSets === 1 ? "set" : "sets"}</p>
                </div>
              </div>

              {activeSession.workout_exercises.length > 0 && (
                <div className="space-y-1.5">
                  {activeSession.workout_exercises.map((we) => (
                    <div
                      key={we.id}
                      className="flex items-center justify-between px-4 py-3 rounded-lg bg-surface"
                    >
                      <p className="text-sm font-medium text-primary">{we.exercise.name}</p>
                      <p className="text-xs text-muted tabular-nums">
                        {we.sets.length} {we.sets.length === 1 ? "set" : "sets"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={closeDrawer}
                  className="flex-1 bg-accent text-white text-sm font-semibold rounded-lg py-3 hover:bg-accent-hover transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={handleViewDetails}
                  className="flex-1 text-sm font-medium text-primary border border-border rounded-lg py-3 hover:bg-surface transition-colors"
                >
                  View details
                </button>
              </div>
            </motion.div>
          )}

          {/* ── View ── */}
          {drawerView === "view" && (
            <motion.div key="view" {...fadeSlide} className="space-y-5">
              {/* Preview skeleton while fetching */}
              {loading && previewData && (
                <>
                  <div className="flex items-center gap-3 text-sm text-secondary">
                    {previewData.durationMinutes && (
                      <span className="tabular-nums">{previewData.durationMinutes} min</span>
                    )}
                    <span className="tabular-nums">{previewData.totalSets} {previewData.totalSets === 1 ? "set" : "sets"}</span>
                  </div>
                  {previewData.notes && (
                    <p className="text-sm text-secondary italic border-l-2 border-accent/30 pl-3">
                      {previewData.notes}
                    </p>
                  )}
                  <div className="space-y-3">
                    {previewData.exerciseNames.map((name) => (
                      <div key={name} className="rounded-xl bg-surface border border-border-subtle overflow-hidden">
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
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm text-secondary">
                      {workout.duration_minutes && (
                        <span className="tabular-nums">{workout.duration_minutes} min</span>
                      )}
                      <span className="tabular-nums">{totalSets} {totalSets === 1 ? "set" : "sets"}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setDrawerView("edit")}
                        className="text-sm font-medium text-primary border border-border rounded-lg px-3 py-1.5 hover:bg-surface transition-colors"
                      >
                        Edit
                      </button>
                      <DeleteWorkoutButton
                        workoutId={workout.id}
                        onDelete={() => {
                          closeDrawer();
                          router.refresh();
                        }}
                      />
                    </div>
                  </div>

                  {workout.notes && (
                    <p className="text-sm text-secondary italic border-l-2 border-accent/30 pl-3">
                      {workout.notes}
                    </p>
                  )}

                  <div className="space-y-3">
                    {workout.workout_exercises.map((we) => (
                      <div key={we.id} className="rounded-xl bg-surface border border-border-subtle overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-border">
                          <p className="font-semibold text-sm text-primary">{we.exercise.name}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {we.exercise.muscle_groups.map((m) => (
                              <span key={m} className="text-xs text-muted bg-bg rounded-md px-2 py-0.5">
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
                              <span className="text-sm font-medium text-muted tabular-nums">{s.set_number}</span>
                              <span className="text-sm font-medium text-primary tabular-nums">{s.reps}</span>
                              <span className="text-sm font-medium text-primary tabular-nums">{s.weight} lbs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── Edit ── */}
          {drawerView === "edit" && workout && (
            <motion.div key="edit" {...fadeSlide}>
              <WorkoutForm
                compact
                workoutId={workout.id}
                initialData={initialData}
                onSave={handleEditSave}
                onCancel={() => setDrawerView("view")}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </Drawer>
  );
}
