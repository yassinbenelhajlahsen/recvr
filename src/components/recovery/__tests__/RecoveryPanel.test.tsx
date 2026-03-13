import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecoveryPanel } from "@/components/recovery/RecoveryPanel";
import type { MuscleRecovery } from "@/types/recovery";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useRecovery to return controlled data
vi.mock("@/lib/hooks", () => ({
  useRecovery: vi.fn((fallback: MuscleRecovery[]) => ({ data: fallback })),
  useProgress: vi.fn(() => ({ data: null })),
  useDebouncedValue: vi.fn((v: unknown) => v),
}));

// Mock BodyMapFront and BodyMapBack (they use SVG library which may have issues in jsdom)
vi.mock("@/components/recovery/BodyMapFront", () => ({
  BodyMapFront: () => <div data-testid="body-map-front" />,
}));
vi.mock("@/components/recovery/BodyMapBack", () => ({
  BodyMapBack: () => <div data-testid="body-map-back" />,
}));

function makeRecovery(overrides: Partial<MuscleRecovery> = {}): MuscleRecovery {
  return {
    muscle: "chest",
    recoveryPct: 1,
    status: "recovered",
    lastTrainedAt: null,
    hoursSince: null,
    lastSessionVolume: null,
    lastSessionSets: null,
    lastSessionReps: null,
    lastSessionExercises: [],
    lastWorkoutId: null,
    lastWorkoutDuration: null,
    lastWorkoutNotes: null,
    ...overrides,
  };
}

const MUSCLES = ["chest", "triceps", "shoulders", "lower back", "hamstrings", "glutes",
  "traps", "back", "biceps", "rear shoulders", "quadriceps", "calves",
  "forearms", "core", "hip flexors", "tibialis"];

function makeFullRecovery(statusOverrides: Partial<Record<string, MuscleRecovery["status"]>> = {}): MuscleRecovery[] {
  return MUSCLES.map((muscle) => makeRecovery({
    muscle,
    status: statusOverrides[muscle] ?? "recovered",
    recoveryPct: statusOverrides[muscle] === "fatigued" ? 0.2 : statusOverrides[muscle] === "partial" ? 0.6 : 1,
  }));
}

describe("RecoveryPanel", () => {
  it("renders body maps", () => {
    render(<RecoveryPanel recovery={makeFullRecovery()} />);
    expect(screen.getByTestId("body-map-front")).toBeInTheDocument();
    expect(screen.getByTestId("body-map-back")).toBeInTheDocument();
  });

  it("renders 'Full view' link pointing to /recovery", () => {
    render(<RecoveryPanel recovery={makeFullRecovery()} />);
    const link = screen.getByText("Full view").closest("a");
    expect(link).toHaveAttribute("href", "/recovery");
  });

  it("shows correct recovered count when all muscles recovered", () => {
    render(<RecoveryPanel recovery={makeFullRecovery()} />);
    const recoveredEl = screen.getByText("recovered", { exact: false });
    // The span before "recovered" should show 16
    expect(recoveredEl.closest("span")).toHaveTextContent("16 recovered");
  });

  it("shows correct fatigued count", () => {
    const recovery = makeFullRecovery({ chest: "fatigued", back: "fatigued" });
    render(<RecoveryPanel recovery={recovery} />);
    const fatigued = screen.getByText("fatigued", { exact: false });
    expect(fatigued.closest("span")).toHaveTextContent("2 fatigued");
  });

  it("shows correct partial count", () => {
    const recovery = makeFullRecovery({ chest: "partial", triceps: "partial", shoulders: "partial" });
    render(<RecoveryPanel recovery={recovery} />);
    const partial = screen.getByText("recovering", { exact: false });
    expect(partial.closest("span")).toHaveTextContent("3 recovering");
  });

  it("renders Recovery heading", () => {
    render(<RecoveryPanel recovery={makeFullRecovery()} />);
    expect(screen.getByText("Recovery")).toBeInTheDocument();
  });
});
