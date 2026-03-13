import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/recovery/route";
import { mockUnauthorized, mockAuthorized } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorized();
  // Return empty workouts so getRecovery resolves with defaults
  (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

function makeRequest(url = "http://localhost/api/recovery") {
  return new Request(url);
}

describe("GET /api/recovery", () => {
  it("returns 200 with MuscleRecovery array for authenticated user", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty("muscle");
    expect(data[0]).toHaveProperty("recoveryPct");
    expect(data[0]).toHaveProperty("status");
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 500 when prisma throws", async () => {
    mockAuthorized();
    (prisma.workout.findMany as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("DB error"));
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
