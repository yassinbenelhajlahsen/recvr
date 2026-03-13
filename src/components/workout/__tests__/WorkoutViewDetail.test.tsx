import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkoutViewDetail } from "@/components/workout/WorkoutViewDetail";
import type { WorkoutDetail, WorkoutPreview } from "@/types/workout";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock swr mutate
vi.mock("swr", () => ({
  mutate: vi.fn(),
  default: vi.fn(),
}));

// Mock fetchWithAuth
vi.mock("@/lib/fetch", () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({ ok: true }),
}));

// Mock DeleteWorkoutButton
vi.mock("@/components/workout/DeleteWorkoutButton", () => ({
  DeleteWorkoutButton: ({ onDelete }: { workoutId: string; onDelete: () => void }) => (
    <button onClick={onDelete} aria-label="Delete workout">Delete</button>
  ),
}));

const mockWorkout: WorkoutDetail = {
  id: "workout-1",
  date: new Date("2024-01-15T10:00:00Z").toISOString(),
  notes: null,
  duration_minutes: 45,
  body_weight: null,
  is_draft: false,
  workout_exercises: [
    {
      id: "we-1",
      order: 0,
      exercise: { id: "ex-1", name: "Bench Press", muscle_groups: ["chest", "triceps"], equipment: null },
      sets: [
        { id: "s-1", set_number: 1, reps: 10, weight: 135 },
        { id: "s-2", set_number: 2, reps: 10, weight: 135 },
      ],
    },
  ],
};

const mockPreview: WorkoutPreview = {
  id: "workout-1",
  date: "2024-01-15",
  dateFormatted: "Monday, January 15",
  durationMinutes: 45,
  totalSets: 2,
  exerciseNames: ["Bench Press", "Squat"],
  notes: null,
};

describe("WorkoutViewDetail", () => {
  const defaultProps = {
    workout: null,
    loading: false,
    previewData: null,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows preview exercise names as skeletons while loading with previewData", () => {
    render(
      <WorkoutViewDetail
        {...defaultProps}
        loading={true}
        previewData={mockPreview}
      />
    );
    expect(screen.getByText("Bench Press")).toBeInTheDocument();
    expect(screen.getByText("Squat")).toBeInTheDocument();
  });

  it("shows generic skeleton boxes while loading without previewData", () => {
    const { container } = render(
      <WorkoutViewDetail
        {...defaultProps}
        loading={true}
        previewData={null}
      />
    );
    // animate-pulse div should be present
    const pulse = container.querySelector(".animate-pulse");
    expect(pulse).toBeInTheDocument();
  });

  it("shows duration and sets for a loaded non-draft workout", () => {
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={mockWorkout}
        loading={false}
      />
    );
    expect(screen.getByText("45 min")).toBeInTheDocument();
    expect(screen.getByText("2 sets")).toBeInTheDocument();
  });

  it("does not show 'Save Draft' button for non-draft workout", () => {
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={mockWorkout}
        loading={false}
      />
    );
    expect(screen.queryByText(/save draft/i)).not.toBeInTheDocument();
  });

  it("shows 'Save Draft' button for draft workout", () => {
    const draftWorkout = { ...mockWorkout, is_draft: true };
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={draftWorkout}
        loading={false}
      />
    );
    expect(screen.getByText("Save Draft")).toBeInTheDocument();
  });

  it("always shows Edit button for loaded workout", () => {
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={mockWorkout}
        loading={false}
      />
    );
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("always shows Delete button for loaded workout", () => {
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={mockWorkout}
        loading={false}
      />
    );
    expect(screen.getByLabelText("Delete workout")).toBeInTheDocument();
  });

  it("calls onEdit when Edit button clicked", async () => {
    const onEdit = vi.fn();
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={mockWorkout}
        loading={false}
        onEdit={onEdit}
      />
    );
    await userEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("calls onDelete when Delete button clicked", async () => {
    const onDelete = vi.fn();
    render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={mockWorkout}
        loading={false}
        onDelete={onDelete}
      />
    );
    await userEvent.click(screen.getByLabelText("Delete workout"));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("shows nothing meaningful when not loading and no workout", () => {
    const { container } = render(
      <WorkoutViewDetail
        {...defaultProps}
        workout={null}
        loading={false}
      />
    );
    // Should render empty space-y-5 div
    expect(container.querySelector("[class*='space-y']")).toBeInTheDocument();
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });
});
