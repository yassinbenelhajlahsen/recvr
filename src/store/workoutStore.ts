import { create } from "zustand";
import type { WorkoutPreview, SessionSummaryData } from "@/types/workout";

export type DrawerView = "create" | "view" | "edit" | "summary";

interface WorkoutStore {
  isDrawerOpen: boolean;
  drawerView: DrawerView | null;
  selectedWorkoutId: string | null;
  activeSession: SessionSummaryData | null;
  previewData: WorkoutPreview | null;
  openDrawer: (workoutId?: string, preview?: WorkoutPreview) => void;
  closeDrawer: () => void;
  setDrawerView: (view: DrawerView, session?: SessionSummaryData) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  isDrawerOpen: false,
  drawerView: null,
  selectedWorkoutId: null,
  activeSession: null,
  previewData: null,
  openDrawer: (workoutId, preview) =>
    set({
      isDrawerOpen: true,
      drawerView: workoutId ? "view" : "create",
      selectedWorkoutId: workoutId ?? null,
      activeSession: null,
      previewData: preview ?? null,
    }),
  closeDrawer: () =>
    set({
      isDrawerOpen: false,
      drawerView: null,
      selectedWorkoutId: null,
      activeSession: null,
      previewData: null,
    }),
  setDrawerView: (view, session) =>
    set((s) => ({ drawerView: view, activeSession: session ?? s.activeSession })),
}));
