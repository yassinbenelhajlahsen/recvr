import { create } from "zustand";

type ModalName = "exerciseDrawer" | "sessionSummary";

export type SessionSummaryData = {
  id: string;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  workout_exercises: {
    id: string;
    exercise: { name: string; muscle_groups: string[] };
    sets: { id: string; set_number: number; reps: number; weight: number }[];
  }[];
};

interface WorkoutStore {
  activeModal: ModalName | null;
  selectedWorkoutId: string | null;
  activeSession: SessionSummaryData | null;
  openModal: (name: ModalName, workoutId?: string) => void;
  closeModal: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  activeModal: null,
  selectedWorkoutId: null,
  activeSession: null,
  openModal: (name, workoutId) =>
    set({
      activeModal: name,
      selectedWorkoutId: workoutId ?? null,
      activeSession: null,
    }),
  closeModal: () =>
    set({ activeModal: null, selectedWorkoutId: null, activeSession: null }),
}));
