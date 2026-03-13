import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "@/app/api/workouts/[id]/route";
import { mockUnauthorized, mockAuthorized, TEST_USER_ID } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const WORKOUT_ID = "workout-id-1";
const OTHER_USER_ID = "other-user-456";

const MOCK_WORKOUT = {
  id: WORKOUT_ID,
  user_id: TEST_USER_ID,
  date: new Date("2024-01-15"),
  notes: null,
  duration_minutes: 60,
  body_weight: null,
  is_draft: false,
  source: "manual",
  workout_exercises: [],
};

function makeRequest(method = "GET", body?: unknown) {
  return new Request(`http://localhost/api/workouts/${WORKOUT_ID}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthorized();
  (prisma.workout.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_WORKOUT);
  (prisma.workout.update as ReturnType<typeof vi.fn>).mockResolvedValue({ id: WORKOUT_ID, is_draft: false });
  (prisma.workout.delete as ReturnType<typeof vi.fn>).mockResolvedValue({});
});

describe("GET /api/workouts/[id]", () => {
  it("returns 200 with workout when authenticated and user owns it", async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: WORKOUT_ID }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(WORKOUT_ID);
  });

  it("returns 404 when workout belongs to another user", async () => {
    (prisma.workout.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...MOCK_WORKOUT,
      user_id: OTHER_USER_ID,
    });
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: WORKOUT_ID }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when workout does not exist", async () => {
    (prisma.workout.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: WORKOUT_ID }) });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: WORKOUT_ID }) });
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/workouts/[id]", () => {
  it("returns 200 and updates is_draft when body is valid", async () => {
    const res = await PATCH(makeRequest("PATCH", { is_draft: false }), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(prisma.workout.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { is_draft: false } }),
    );
  });

  it("returns 400 when body is missing is_draft boolean", async () => {
    const res = await PATCH(makeRequest("PATCH", { foo: "bar" }), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when is_draft is not a boolean (string)", async () => {
    const res = await PATCH(makeRequest("PATCH", { is_draft: "true" }), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 when workout does not exist", async () => {
    (prisma.workout.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await PATCH(makeRequest("PATCH", { is_draft: false }), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await PATCH(makeRequest("PATCH", { is_draft: false }), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/workouts/[id]", () => {
  it("returns 200 when authenticated user owns workout", async () => {
    const res = await DELETE(makeRequest("DELETE"), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(prisma.workout.delete).toHaveBeenCalledWith({ where: { id: WORKOUT_ID } });
  });

  it("returns 404 when workout belongs to another user", async () => {
    (prisma.workout.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...MOCK_WORKOUT,
      user_id: OTHER_USER_ID,
    });
    const res = await DELETE(makeRequest("DELETE"), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(404);
    expect(prisma.workout.delete).not.toHaveBeenCalled();
  });

  it("returns 401 when unauthenticated", async () => {
    mockUnauthorized();
    const res = await DELETE(makeRequest("DELETE"), {
      params: Promise.resolve({ id: WORKOUT_ID }),
    });
    expect(res.status).toBe(401);
    expect(prisma.workout.delete).not.toHaveBeenCalled();
  });
});
