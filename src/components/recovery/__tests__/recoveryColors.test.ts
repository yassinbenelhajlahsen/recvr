import { describe, it, expect } from "vitest";
import {
  getRecoveryStatus,
  getRecoveryFill,
  getNeutralFill,
  buildStaticBodyMapCss,
  buildBodyMapVars,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/components/recovery/recoveryColors";
import type { Slug } from "@mjcdev/react-body-highlighter";

describe("getRecoveryStatus", () => {
  it("returns 'recovered' for pct >= 0.85", () => {
    expect(getRecoveryStatus(0.85)).toBe("recovered");
    expect(getRecoveryStatus(1.0)).toBe("recovered");
    expect(getRecoveryStatus(0.9)).toBe("recovered");
  });
  it("returns 'partial' for 0.84 (boundary below recovered)", () => {
    expect(getRecoveryStatus(0.84)).toBe("partial");
  });
  it("returns 'partial' for pct in [0.45, 0.84]", () => {
    expect(getRecoveryStatus(0.45)).toBe("partial");
    expect(getRecoveryStatus(0.65)).toBe("partial");
  });
  it("returns 'fatigued' for 0.44 (boundary below partial)", () => {
    expect(getRecoveryStatus(0.44)).toBe("fatigued");
  });
  it("returns 'fatigued' for pct < 0.45", () => {
    expect(getRecoveryStatus(0.0)).toBe("fatigued");
    expect(getRecoveryStatus(0.2)).toBe("fatigued");
  });
});

describe("getRecoveryFill", () => {
  it("returns a valid HSL string in dark mode", () => {
    const result = getRecoveryFill(0.5, true);
    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  it("returns a valid HSL string in light mode", () => {
    const result = getRecoveryFill(0.5, false);
    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  it("returns a valid HSL string at 0.0 (fatigued)", () => {
    expect(getRecoveryFill(0.0, false)).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  it("returns a valid HSL string at 1.0 (recovered)", () => {
    expect(getRecoveryFill(1.0, true)).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  it("returns different values for dark vs light mode", () => {
    expect(getRecoveryFill(0.5, true)).not.toBe(getRecoveryFill(0.5, false));
  });
});

describe("getNeutralFill", () => {
  it("returns a valid HSL string in dark mode", () => {
    expect(getNeutralFill(true)).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  it("returns a valid HSL string in light mode", () => {
    expect(getNeutralFill(false)).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
  it("returns different values for dark vs light mode", () => {
    expect(getNeutralFill(true)).not.toBe(getNeutralFill(false));
  });
});

describe("STATUS_LABELS", () => {
  it("has all 3 statuses", () => {
    expect(STATUS_LABELS.recovered).toBeDefined();
    expect(STATUS_LABELS.partial).toBeDefined();
    expect(STATUS_LABELS.fatigued).toBeDefined();
  });
  it("labels are non-empty strings", () => {
    expect(STATUS_LABELS.recovered.length).toBeGreaterThan(0);
    expect(STATUS_LABELS.partial.length).toBeGreaterThan(0);
    expect(STATUS_LABELS.fatigued.length).toBeGreaterThan(0);
  });
});

describe("STATUS_COLORS", () => {
  it("has all 3 statuses", () => {
    expect(STATUS_COLORS.recovered).toBeDefined();
    expect(STATUS_COLORS.partial).toBeDefined();
    expect(STATUS_COLORS.fatigued).toBeDefined();
  });
  it("color strings are non-empty", () => {
    expect(STATUS_COLORS.recovered.length).toBeGreaterThan(0);
    expect(STATUS_COLORS.partial.length).toBeGreaterThan(0);
    expect(STATUS_COLORS.fatigued.length).toBeGreaterThan(0);
  });
});

describe("buildStaticBodyMapCss", () => {
  const ENTRIES = [
    { muscle: "chest", slug: "chest" as Slug },
    { muscle: "biceps", slug: "bicep" as Slug },
  ];
  const CONTAINER_ID = "body-map-front";

  it("includes the container id selector in CSS for each slug", () => {
    const css = buildStaticBodyMapCss(ENTRIES, CONTAINER_ID);
    expect(css).toContain(`#${CONTAINER_ID} #chest`);
    expect(css).toContain(`#${CONTAINER_ID} #bicep`);
  });

  it("uses CSS custom property var(--fill-<slug>) for each entry", () => {
    const css = buildStaticBodyMapCss(ENTRIES, CONTAINER_ID);
    expect(css).toContain("fill: var(--fill-chest)");
    expect(css).toContain("fill: var(--fill-bicep)");
  });

  it("includes an SVG width rule for the container", () => {
    const css = buildStaticBodyMapCss(ENTRIES, CONTAINER_ID);
    expect(css).toContain(`#${CONTAINER_ID} svg`);
    expect(css).toContain("width: 100%");
  });

  it("returns an empty CSS (only SVG rule) when entries array is empty", () => {
    const css = buildStaticBodyMapCss([], CONTAINER_ID);
    expect(css).toContain(`#${CONTAINER_ID} svg`);
    expect(css).not.toContain("var(--fill-");
  });
});

describe("buildBodyMapVars", () => {
  const ENTRIES = [
    { muscle: "chest", slug: "chest" as Slug },
    { muscle: "biceps", slug: "bicep" as Slug },
  ];

  it("returns a record with --fill-<slug> keys for each entry", () => {
    const vars = buildBodyMapVars(ENTRIES, {}, false);
    expect(vars).toHaveProperty("--fill-chest");
    expect(vars).toHaveProperty("--fill-bicep");
  });

  it("uses getRecoveryFill for muscles with recovery data", () => {
    const vars = buildBodyMapVars(
      ENTRIES,
      { chest: { recoveryPct: 0.9 } },
      false,
    );
    // Should be an HSL color, not the neutral fill
    expect(vars["--fill-chest"]).toMatch(/^hsl\(/);
  });

  it("uses getNeutralFill for muscles with no recovery data", () => {
    const neutral = getNeutralFill(false);
    const vars = buildBodyMapVars(ENTRIES, {}, false);
    expect(vars["--fill-chest"]).toBe(neutral);
    expect(vars["--fill-bicep"]).toBe(neutral);
  });

  it("uses dark-mode neutral fill when isDark is true", () => {
    const neutralLight = getNeutralFill(false);
    const neutralDark = getNeutralFill(true);
    const vars = buildBodyMapVars(ENTRIES, {}, true);
    expect(vars["--fill-chest"]).toBe(neutralDark);
    expect(vars["--fill-chest"]).not.toBe(neutralLight);
  });

  it("HSL values differ between dark and light mode for the same recovery pct", () => {
    const muscles = { chest: { recoveryPct: 0.5 } };
    const dark = buildBodyMapVars(ENTRIES, muscles, true);
    const light = buildBodyMapVars(ENTRIES, muscles, false);
    expect(dark["--fill-chest"]).not.toBe(light["--fill-chest"]);
  });
});
