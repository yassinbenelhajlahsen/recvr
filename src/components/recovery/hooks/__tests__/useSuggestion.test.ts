import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { SuggestionDetail } from "@/types/suggestion";

// Mock swr before any imports that use it
vi.mock("swr", () => ({
  default: vi.fn().mockReturnValue({ data: undefined, isLoading: false }),
  mutate: vi.fn(),
}));

// swr/infinite is imported by useSuggestionHistory; we only need PAGE_SIZE from it.
// Stub the module so the import doesn't fail in jsdom.
vi.mock("swr/infinite", () => ({
  default: vi.fn().mockReturnValue({
    data: undefined,
    error: undefined,
    size: 1,
    setSize: vi.fn(),
    isLoading: false,
    isValidating: false,
  }),
}));

vi.mock("@/lib/fetch", () => ({
  fetchWithAuth: vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ error: "Not found" }),
    headers: { get: () => null },
  }),
}));

// next/navigation is used by some transitive imports
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/recovery",
}));

import useSWR from "swr";
import { useSuggestion } from "@/components/recovery/hooks/useSuggestion";

const mockUseSWR = vi.mocked(useSWR);

const MOCK_SUGGESTION_DETAIL: SuggestionDetail = {
  id: "sug-detail-1",
  title: "Pull Day",
  rationale: "Focus on back and biceps",
  exercises: [
    { name: "Pull-Up", muscleGroups: ["back"], sets: [{ reps: 8, weight: null }] },
  ],
  presets: ["pull"],
  draft_id: "draft-abc",
  created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default SWR: no cooldown data
  mockUseSWR.mockReturnValue({
    data: undefined,
    isLoading: false,
    isValidating: false,
    mutate: vi.fn(),
    error: undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
});

describe("useSuggestion — viewHistorical", () => {
  it("sets suggestion and marks isHistorical = true", async () => {
    const { result } = renderHook(() => useSuggestion());

    await act(async () => {
      result.current.viewHistorical(MOCK_SUGGESTION_DETAIL);
    });

    expect(result.current.suggestion?.title).toBe("Pull Day");
    expect(result.current.isHistorical).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets draftId from the historical detail", async () => {
    const { result } = renderHook(() => useSuggestion());

    await act(async () => {
      result.current.viewHistorical(MOCK_SUGGESTION_DETAIL);
    });

    expect(result.current.draftId).toBe("draft-abc");
    expect(result.current.suggestionId).toBe("sug-detail-1");
  });
});

describe("useSuggestion — dismiss", () => {
  it("resets state to idle after viewHistorical", async () => {
    const { result } = renderHook(() => useSuggestion());

    await act(async () => {
      result.current.viewHistorical(MOCK_SUGGESTION_DETAIL);
    });

    expect(result.current.suggestion).not.toBeNull();

    await act(async () => {
      result.current.dismiss();
    });

    expect(result.current.suggestion).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isHistorical).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe("useSuggestion — cooldownLabel", () => {
  it("returns null when cooldownSeconds is 0", async () => {
    const { result } = renderHook(() => useSuggestion());
    // No cooldown data → cooldownSeconds = 0
    await act(async () => {});
    expect(result.current.cooldownLabel).toBeNull();
  });

  it("formats 3599 seconds as '59:59'", async () => {
    // Override SWR to return a cooldown expiring in ~3599 seconds
    mockUseSWR.mockReturnValue({
      data: { expiresAt: Date.now() + 3599 * 1000 },
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
      error: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useSuggestion());
    await act(async () => {});

    // Allow a 2-second window because time elapses between mock setup and effect
    const label = result.current.cooldownLabel;
    expect(label).toMatch(/^5[89]:\d{2}$/);
  });
});

describe("useSuggestion — cooldown timer decrement", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("decrements cooldownSeconds by 1 each second", async () => {
    const expiresAt = Date.now() + 100 * 1000; // 100 seconds from now (real clock)
    mockUseSWR.mockReturnValue({
      data: { expiresAt },
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
      error: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useSuggestion());

    // Flush the useEffect that reads cooldownData and sets cooldownSeconds
    await act(async () => {});

    const initialSeconds = result.current.cooldownSeconds;
    expect(initialSeconds).toBeGreaterThan(0);

    // Advance fake timers by 1 second → setInterval fires once
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.cooldownSeconds).toBe(initialSeconds - 1);
  });

  it("resets to 0 when timer reaches 0", async () => {
    const expiresAt = Date.now() + 2 * 1000; // 2 seconds from now
    mockUseSWR.mockReturnValue({
      data: { expiresAt },
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
      error: undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useSuggestion());
    await act(async () => {});

    // Advance past the cooldown
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.cooldownSeconds).toBe(0);
    expect(result.current.cooldownLabel).toBeNull();
  });
});

describe("useSuggestion — isStreaming", () => {
  it("is false when not loading", async () => {
    const { result } = renderHook(() => useSuggestion());
    await act(async () => {});
    expect(result.current.isStreaming).toBe(false);
  });
});
