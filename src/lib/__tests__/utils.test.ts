import { describe, it, expect } from "vitest";
import { uid, normalizeGender, formatDate, formatDateShort, toLocalISODate } from "@/lib/utils";

describe("uid", () => {
  it("returns a string", () => {
    expect(typeof uid()).toBe("string");
  });
  it("values are monotonically increasing", () => {
    const a = parseInt(uid().split("-")[1]);
    const b = parseInt(uid().split("-")[1]);
    expect(b).toBeGreaterThan(a);
  });
});

describe("normalizeGender", () => {
  it("returns 'male' for 'male'", () => {
    expect(normalizeGender("male")).toBe("male");
  });
  it("returns 'female' for 'female'", () => {
    expect(normalizeGender("female")).toBe("female");
  });
  it("returns null for null", () => {
    expect(normalizeGender(null)).toBeNull();
  });
  it("returns null for undefined", () => {
    expect(normalizeGender(undefined)).toBeNull();
  });
  it("returns null for invalid string", () => {
    expect(normalizeGender("nonbinary")).toBeNull();
  });
  it("returns null for number", () => {
    expect(normalizeGender(42)).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats a date string to a readable format", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("2024");
    expect(result).toContain("January");
    expect(result).toContain("15");
  });
  it("includes weekday", () => {
    const result = formatDate("2024-01-15");
    expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
  });
});

describe("formatDateShort", () => {
  it("formats without year", () => {
    const result = formatDateShort("2024-01-15");
    expect(result).not.toContain("2024");
    expect(result).toContain("January");
  });
  it("includes weekday", () => {
    const result = formatDateShort("2024-01-15");
    expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
  });
});

describe("toLocalISODate", () => {
  it("returns YYYY-MM-DD format", () => {
    const result = toLocalISODate(new Date(2024, 0, 15)); // Jan 15, 2024 local
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it("returns local date without timezone drift", () => {
    // Create a date at midnight in local time — should not drift to previous day
    const d = new Date(2024, 5, 1, 0, 0, 0); // June 1
    const result = toLocalISODate(d);
    expect(result).toBe("2024-06-01");
  });
  it("pads month and day with leading zeros", () => {
    const d = new Date(2024, 0, 5); // Jan 5
    expect(toLocalISODate(d)).toBe("2024-01-05");
  });
  it("uses current date when no argument passed", () => {
    const result = toLocalISODate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
