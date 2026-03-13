import { describe, it, expect } from "vitest";
import {
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  parseFeetInches,
  resolveHeightToInches,
  resolveWeightToLbs,
  displayHeight,
  displayWeight,
} from "@/lib/units";

describe("cmToInches", () => {
  it("converts 180cm to ~71 inches", () => {
    expect(cmToInches(180)).toBe(71);
  });
  it("converts 0 to 0", () => {
    expect(cmToInches(0)).toBe(0);
  });
});

describe("inchesToCm", () => {
  it("converts 71 inches to ~180cm", () => {
    expect(inchesToCm(71)).toBe(180);
  });
  it("round-trip is stable", () => {
    expect(inchesToCm(cmToInches(175))).toBe(175);
  });
});

describe("kgToLbs", () => {
  it("converts 80kg to ~176 lbs", () => {
    expect(kgToLbs(80)).toBe(176);
  });
  it("converts 0 to 0", () => {
    expect(kgToLbs(0)).toBe(0);
  });
});

describe("lbsToKg", () => {
  it("converts 176 lbs to ~80 kg", () => {
    expect(lbsToKg(176)).toBe(80);
  });
  it("round-trip is stable", () => {
    expect(lbsToKg(kgToLbs(70))).toBe(70);
  });
});

describe("parseFeetInches", () => {
  it("parses '5'11' correctly", () => {
    expect(parseFeetInches("5'11")).toBe(71);
  });
  it("parses '6'0' correctly", () => {
    expect(parseFeetInches("6'0")).toBe(72);
  });
  it("parses '5'' (no inches) as 60", () => {
    expect(parseFeetInches("5'")).toBe(60);
  });
  it("returns null for invalid input 'abc'", () => {
    expect(parseFeetInches("abc")).toBeNull();
  });
  it("returns null for empty string", () => {
    expect(parseFeetInches("")).toBeNull();
  });
  it("returns null for '0'0' (zero height)", () => {
    expect(parseFeetInches("0'0")).toBeNull();
  });
});

describe("resolveHeightToInches", () => {
  it("resolves imperial feet/inches string", () => {
    expect(resolveHeightToInches("5'10", "imperial")).toBe(70);
  });
  it("resolves metric cm string", () => {
    expect(resolveHeightToInches("178", "metric")).toBe(cmToInches(178));
  });
  it("returns null for invalid imperial", () => {
    expect(resolveHeightToInches("bad", "imperial")).toBeNull();
  });
  it("returns null for zero metric", () => {
    expect(resolveHeightToInches("0", "metric")).toBeNull();
  });
  it("returns null for NaN metric", () => {
    expect(resolveHeightToInches("abc", "metric")).toBeNull();
  });
});

describe("resolveWeightToLbs", () => {
  it("returns lbs directly for imperial", () => {
    expect(resolveWeightToLbs("185", "imperial")).toBe(185);
  });
  it("converts kg to lbs for metric", () => {
    expect(resolveWeightToLbs("80", "metric")).toBe(kgToLbs(80));
  });
  it("returns null for zero weight", () => {
    expect(resolveWeightToLbs("0", "imperial")).toBeNull();
  });
  it("returns null for NaN weight", () => {
    expect(resolveWeightToLbs("abc", "imperial")).toBeNull();
  });
  it("returns null for negative weight", () => {
    expect(resolveWeightToLbs("-10", "imperial")).toBeNull();
  });
});

describe("displayHeight", () => {
  it("shows ft'in for imperial", () => {
    expect(displayHeight(71, "imperial")).toBe("5'11");
  });
  it("shows cm for metric", () => {
    expect(displayHeight(71, "metric")).toBe(String(inchesToCm(71)));
  });
});

describe("displayWeight", () => {
  it("shows lbs for imperial", () => {
    expect(displayWeight(185, "imperial")).toBe("185");
  });
  it("shows kg for metric", () => {
    expect(displayWeight(185, "metric")).toBe(String(lbsToKg(185)));
  });
});
