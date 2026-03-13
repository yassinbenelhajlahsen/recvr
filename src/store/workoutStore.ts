import { create } from "zustand";
import type { WorkoutPreview } from "@/types/workout";

export type DrawerView = "create" | "view" | "edit";

interface WorkoutStore {
  isDrawerOpen: boolean;
  drawerView: DrawerView | null;
  selectedWorkoutId: string | null;
  previewData: WorkoutPreview | null;
  openDrawer: (workoutId?: string, preview?: WorkoutPreview) => void;
  closeDrawer: () => void;
  setDrawerView: (view: DrawerView) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  isDrawerOpen: false,
  drawerView: null,
  selectedWorkoutId: null,
  previewData: null,
  openDrawer: (workoutId, preview) =>
    set({
      isDrawerOpen: true,
      drawerView: workoutId ? "view" : "create",
      selectedWorkoutId: workoutId ?? null,
      previewData: preview ?? null,
    }),
  closeDrawer: () =>
    set({
      isDrawerOpen: false,
      drawerView: null,
      selectedWorkoutId: null,
      previewData: null,
    }),
  setDrawerView: (view) => set({ drawerView: view }),
}));
