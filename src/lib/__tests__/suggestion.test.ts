import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  persistSuggestion,
  linkDraftToSuggestion,
  getSuggestionState,
  setDevBypass,
} from "@/lib/suggestion";
import { prisma } from "@/lib/prisma";

const USER_ID = "sug-test-user";
const BYPASS_USER_ID = "bypass-user-999";

const MOCK_SUGGESTION = {
  title: "Push Day",
  rationale: "Focus on chest and shoulders",
  exercises: [
    { name: "Bench Press", muscleGroups: ["chest"], sets: [{ reps: 8, weight: 135 }] },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("persistSuggestion", () => {
  it("returns row ID string on success", async () => {
    (prisma.suggestion.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "sug-row-1" });
    const result = await persistSuggestion(USER_ID, MOCK_SUGGESTION, ["push"]);
    expect(result).toBe("sug-row-1");
    expect(prisma.suggestion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          user_id: USER_ID,
          title: MOCK_SUGGESTION.title,
        }),
      }),
    );
  });

  it("returns null when DB throws — does not rethrow", async () => {
    (prisma.suggestion.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB error"),
    );
    const result = await persistSuggestion(USER_ID, MOCK_SUGGESTION, []);
    expect(result).toBeNull();
  });
});

describe("linkDraftToSuggestion", () => {
  it("calls prisma.suggestion.update with correct args on success", async () => {
    (prisma.suggestion.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    await linkDraftToSuggestion("sug-id-1", "draft-id-1", USER_ID);
    expect(prisma.suggestion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "sug-id-1", user_id: USER_ID },
        data: { draft_id: "draft-id-1" },
      }),
    );
  });

  it("swallows error without rethrowing when DB throws", async () => {
    (prisma.suggestion.update as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Update failed"),
    );
    await expect(linkDraftToSuggestion("sug-id-1", "draft-id-1", USER_ID)).resolves.toBeUndefined();
  });
});

describe("getSuggestionState (redis=null, DB fallback)", () => {
  it("returns cooldown: 0 and null suggestion when no DB row exists", async () => {
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const state = await getSuggestionState(USER_ID);
    expect(state.cooldown).toBe(0);
    expect(state.suggestion).toBeNull();
    expect(state.draftId).toBeNull();
    expect(state.suggestionId).toBeNull();
  });

  it("returns cooldown > 0 when DB has a suggestion within the 1h window", async () => {
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sug-recent",
      title: "Push Day",
      rationale: "Recovery plan",
      exercises: [],
      draft_id: null,
      created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    });
    const state = await getSuggestionState(USER_ID);
    expect(state.cooldown).toBeGreaterThan(0);
    expect(state.cooldown).toBeLessThanOrEqual(3600);
    expect(state.suggestion).not.toBeNull();
    expect(state.suggestionId).toBe("sug-recent");
  });

  it("returns cooldown: 0 when DB row is older than 1h", async () => {
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sug-old",
      title: "Old Workout",
      rationale: "Old plan",
      exercises: [],
      draft_id: null,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    });
    const state = await getSuggestionState(USER_ID);
    expect(state.cooldown).toBe(0);
    expect(state.suggestion).toBeNull();
  });

  it("returns draftId when DB row has a linked draft", async () => {
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sug-with-draft",
      title: "Workout",
      rationale: "Plan",
      exercises: [],
      draft_id: "draft-abc",
      created_at: new Date(Date.now() - 10 * 60 * 1000), // 10 min ago
    });
    const state = await getSuggestionState(USER_ID);
    expect(state.draftId).toBe("draft-abc");
  });
});

describe("setDevBypass + getSuggestionState", () => {
  it("returns cooldown: 0 immediately after setDevBypass is called", async () => {
    // Use a dedicated user ID so the bypass doesn't leak to other tests
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sug-bypass",
      title: "Bypass Workout",
      rationale: "Plan",
      exercises: [],
      draft_id: null,
      created_at: new Date(Date.now() - 10 * 60 * 1000),
    });

    setDevBypass(BYPASS_USER_ID, 30_000);
    const state = await getSuggestionState(BYPASS_USER_ID);

    // Even though DB has a recent suggestion, bypass returns cooldown: 0
    expect(state.cooldown).toBe(0);
    expect(state.suggestion).toBeNull();
  });
});
