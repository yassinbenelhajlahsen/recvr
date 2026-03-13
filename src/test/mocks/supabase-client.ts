import { vi } from "vitest";

export const mockClientSupabase = {
  auth: {
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
};

export const createClient = vi.fn().mockReturnValue(mockClientSupabase);
