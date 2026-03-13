import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
});
