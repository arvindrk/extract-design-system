import { describe, expect, it } from "vitest";
import {
  normalizeHex,
  rgbStringToHex,
  rgbDistance,
  nearestPaletteColor,
} from "../src/matchers/color-matcher.js";
import type { NormalizedDesignSystem } from "../src/schemas/normalized.js";

const baseTokens = (overrides: Partial<NormalizedDesignSystem["colors"]> = {}): NormalizedDesignSystem => ({
  source: { url: "https://example.com", extractedAt: "2026-01-01T00:00:00.000Z", extractor: "dembrandt" },
  colors: {
    primary: "#3b82f6",
    palette: ["#3b82f6", "#111111"],
    cssVariables: {},
    ...overrides,
  },
  typography: {},
  spacing: { scale: [] },
  radius: { scale: [] },
  shadows: { scale: [] },
});

describe("normalizeHex", () => {
  it("lowercases a 6-digit hex", () => expect(normalizeHex("#3B82F6")).toBe("#3b82f6"));
  it("expands 3-digit hex", () => expect(normalizeHex("#abc")).toBe("#aabbcc"));
  it("expands 4-digit hex, stripping alpha channel", () => expect(normalizeHex("#abcd")).toBe("#aabbcc"));
  it("strips alpha from 8-digit hex", () => expect(normalizeHex("#3b82f6ff")).toBe("#3b82f6"));
  it("is idempotent", () => expect(normalizeHex("#3b82f6")).toBe("#3b82f6"));
});

describe("rgbStringToHex", () => {
  it("converts rgb()", () => expect(rgbStringToHex("rgb(59, 130, 246)")).toBe("#3b82f6"));
  it("converts rgba(), stripping alpha", () => expect(rgbStringToHex("rgba(59, 130, 246, 0.5)")).toBe("#3b82f6"));
  it("returns null for non-rgb input", () => expect(rgbStringToHex("#3b82f6")).toBeNull());
  it("returns null for garbage input", () => expect(rgbStringToHex("red")).toBeNull());
});

describe("rgbDistance", () => {
  it("returns 0 for identical colors", () => expect(rgbDistance("#000000", "#000000")).toBe(0));
  it("returns ~441.67 for black vs white", () => {
    expect(rgbDistance("#000000", "#ffffff")).toBeCloseTo(441.67, 1);
  });
  it("returns a small value for near-identical colors", () => {
    expect(rgbDistance("#3b82f6", "#3a81f5")).toBeLessThan(5);
  });
});

describe("nearestPaletteColor", () => {
  it("returns exact match on semantic color (distance 0)", () => {
    const match = nearestPaletteColor("#3b82f6", baseTokens(), 15);
    expect(match).not.toBeNull();
    expect(match?.token).toBe("--color-primary");
    expect(match?.isExact).toBe(true);
    expect(match?.distance).toBe(0);
  });

  it("prefers semantic token over palette when both match", () => {
    const match = nearestPaletteColor("#3b82f6", baseTokens({ primary: "#3b82f6", palette: ["#3b82f6"] }), 15);
    expect(match?.token).toBe("--color-primary");
  });

  it("falls back to palette token when no semantic match", () => {
    const match = nearestPaletteColor("#111111", baseTokens(), 15);
    expect(match?.token).toBe("--palette-2");
  });

  it("matches cssVariables by their CSS name", () => {
    const tokens = baseTokens({ cssVariables: { "--brand": "#3b82f6" }, primary: undefined, palette: [] });
    const match = nearestPaletteColor("#3b82f6", tokens, 15);
    expect(match?.token).toBe("--brand");
  });

  it("returns a near-match within threshold", () => {
    const match = nearestPaletteColor("#3a81f5", baseTokens(), 15);
    expect(match).not.toBeNull();
    expect(match?.isExact).toBe(false);
  });

  it("returns null when outside threshold", () => {
    expect(nearestPaletteColor("#ff0000", baseTokens(), 15)).toBeNull();
  });

  it("handles rgb() string input", () => {
    const match = nearestPaletteColor("rgb(59, 130, 246)", baseTokens(), 15);
    expect(match?.token).toBe("--color-primary");
  });

  it("returns null for unrecognised color syntax", () => {
    expect(nearestPaletteColor("red", baseTokens(), 15)).toBeNull();
  });
});
