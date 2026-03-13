import { vi } from "vitest";

export const logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  child: vi.fn(() => logger),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withLogging<H extends (req: Request, ...args: any[]) => Promise<Response> | Response>(handler: H): H {
  return handler;
}
