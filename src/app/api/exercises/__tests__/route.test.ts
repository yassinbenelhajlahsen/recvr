import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/exercises/route";
import { mockUnauthorized, mockAuthorized, TEST_USER_ID } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const MOCK_EXERCISES = [
  { id: "ex-1", name: "Bench Press", muscle_groups: ["chest", "triceps"], equipment: "barbell", user_id: null },
  { id: "ex-2", name: "Squat", muscle_groups: ["quadriceps", "glutes"], equipment: "barbell", user_id: null },
];

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/exercises");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/exercises", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorized();
  (prisma.exercise.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_EXERCISES);
  (prisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_EXERCISES);
  (prisma.exercise.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "ex-new", name: "Custom", muscle_groups: ["chest"], equipment: null, user_id: TEST_USER_ID });
});

describe("GET /api/exercises", () => {
  it("returns 200 with exercises array for authenticated user", async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("calls prisma.exercise.findMany when no search query (uncached)", async () => {
    await GET(makeGetRequest());
    // With redis = null, cache is always a miss so prisma is called
    expect(prisma.exercise.findMany).toHaveBeenCalled();
  });

  it("calls $queryRaw when search param provided", async () => {
    await GET(makeGetRequest({ q: "bench" }));
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });
});

describe("POST /api/exercises", () => {
  const validPayload = {
    name: "Custom Curl",
    muscle_groups: ["biceps"],
    equipment: "dumbbell",
  };

  it("returns 201 for valid exercise", async () => {
    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(201);
  });

  it("returns 400 for duplicate exercise name (P2002)", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "7.0.0",
    });
    (prisma.exercise.create as ReturnType<typeof vi.fn>).mockRejectedValue(error);
    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already exists/i);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makePostRequest({ muscle_groups: ["biceps"] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when muscle_groups is empty array", async () => {
    const res = await POST(makePostRequest({ name: "Test", muscle_groups: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(401);
  });
});
