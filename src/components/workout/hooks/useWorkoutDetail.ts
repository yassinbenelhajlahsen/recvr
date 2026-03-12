import useSWR from "swr";
import type { WorkoutDetail } from "@/types/workout";

export function useWorkoutDetail(
  isDrawerOpen: boolean,
  selectedWorkoutId: string | null
) {
  const key =
    isDrawerOpen && selectedWorkoutId
      ? `/api/workouts/${selectedWorkoutId}`
      : null;

  const { data, isLoading, isValidating, mutate } = useSWR<WorkoutDetail>(
    key,
    { dedupingInterval: 10_000 }
  );

  function setWorkout(w: WorkoutDetail | null) {
    mutate(w ?? undefined, { revalidate: false });
  }

  return {
    workout: data ?? null,
    setWorkout,
    loading: isLoading,
    isValidating,
    mutate,
  };
}
