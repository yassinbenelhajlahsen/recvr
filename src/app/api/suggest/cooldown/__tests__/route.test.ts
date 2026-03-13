import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "@/app/api/suggest/cooldown/route";
import { mockUnauthorized, mockAuthorized } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Prevent setDevBypass from mutating the module-level Map so the DELETE
// test does not bleed into GET tests running after it in the same file.
vi.mock("@/lib/suggestion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/suggestion")>();
  return {
    ...actual,
    setDevBypass: vi.fn(),
  };
});

function makeRequest(method = "GET") {
  return new Request("http://localhost/api/suggest/cooldown", { method });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorized();
  // Default: no DB row → cooldown: 0
  (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
});

describe("GET /api/suggest/cooldown", () => {
  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns { cooldown: 0 } when no suggestion exists", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cooldown).toBe(0);
  });

  it("returns cooldown > 0 and suggestion when DB has a recent row", async () => {
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sug-recent",
      title: "Push Day",
      rationale: "Recovery plan",
      exercises: [{ name: "Bench Press", muscleGroups: ["chest"], sets: [] }],
      draft_id: null,
      created_at: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cooldown).toBeGreaterThan(0);
    expect(data.cooldown).toBeLessThanOrEqual(3600);
    expect(data.suggestion).toBeDefined();
    expect(data.suggestionId).toBe("sug-recent");
  });

  it("includes draftId in response when suggestion has a linked draft", async () => {
    (prisma.suggestion.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sug-with-draft",
      title: "Leg Day",
      rationale: "Plan",
      exercises: [],
      draft_id: "draft-xyz",
      created_at: new Date(Date.now() - 5 * 60 * 1000),
    });

    const res = await GET(makeRequest());
    const data = await res.json();
    expect(data.draftId).toBe("draft-xyz");
  });
});

describe("DELETE /api/suggest/cooldown", () => {
  it("returns 403 in production environment", async () => {
    const original = process.env.NODE_ENV;
    // @ts-expect-error — override for test
    process.env.NODE_ENV = "production";
    try {
      const res = await DELETE(makeRequest("DELETE"));
      expect(res.status).toBe(403);
    } finally {
      // @ts-expect-error — restore
      process.env.NODE_ENV = original;
    }
  });

  it("returns 401 when unauthenticated in dev", async () => {
    mockUnauthorized();
    const res = await DELETE(makeRequest("DELETE"));
    expect(res.status).toBe(401);
  });

  it("returns 200 { ok: true } when authenticated in dev (non-production)", async () => {
    const res = await DELETE(makeRequest("DELETE"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });
});
