import { describe, expect, it } from "vitest";
import { matchSpacing, matchRadius, matchShadow, matchFont } from "../src/matchers/token-matcher.js";
import type { NormalizedDesignSystem } from "../src/schemas/normalized.js";

const tokens = (overrides: Partial<NormalizedDesignSystem> = {}): NormalizedDesignSystem => ({
  source: { url: "https://example.com", extractedAt: "2026-01-01T00:00:00.000Z", extractor: "dembrandt" },
  colors: { palette: [], cssVariables: {} },
  typography: { headingFont: "Satoshi", bodyFont: "Inter", monoFont: "JetBrains Mono" },
  spacing: { scale: ["4px", "8px", "16px"] },
  radius: { scale: ["4px", "9999px"] },
  shadows: { scale: ["0 1px 2px rgba(0,0,0,0.1)", "0 8px 24px rgba(0,0,0,0.12)"] },
  ...overrides,
});

describe("matchSpacing", () => {
  it("returns --space-2 for 8px", () => expect(matchSpacing("8px", tokens())).toBe("--space-2"));
  it("returns --space-1 for 4px", () => expect(matchSpacing("4px", tokens())).toBe("--space-1"));
  it("returns null when value not in scale", () => expect(matchSpacing("9px", tokens())).toBeNull());
  it("returns null for empty scale", () => expect(matchSpacing("8px", tokens({ spacing: { scale: [] } }))).toBeNull());
  it("is case-insensitive to unit casing", () => expect(matchSpacing("8PX", tokens())).toBeNull()); // no match — units must be exact
});

describe("matchRadius", () => {
  it("returns --radius-1 for 4px", () => expect(matchRadius("4px", tokens())).toBe("--radius-1"));
  it("returns --radius-2 for 9999px", () => expect(matchRadius("9999px", tokens())).toBe("--radius-2"));
  it("returns null for unknown value", () => expect(matchRadius("8px", tokens())).toBeNull());
});

describe("matchShadow", () => {
  it("returns --shadow-1 for exact shadow string", () =>
    expect(matchShadow("0 1px 2px rgba(0,0,0,0.1)", tokens())).toBe("--shadow-1"));
  it("returns --shadow-2 for second shadow", () =>
    expect(matchShadow("0 8px 24px rgba(0,0,0,0.12)", tokens())).toBe("--shadow-2"));
  it("returns null for unknown shadow", () =>
    expect(matchShadow("0 0 0 1px red", tokens())).toBeNull());
});

describe("matchFont", () => {
  it("matches heading font", () => expect(matchFont("Satoshi, sans-serif", tokens())).toBe("--font-heading"));
  it("matches body font", () => expect(matchFont('"Inter", system-ui', tokens())).toBe("--font-body"));
  it("matches mono font", () => expect(matchFont("JetBrains Mono", tokens())).toBe("--font-mono"));
  it("returns null for unknown font", () => expect(matchFont("Comic Sans MS", tokens())).toBeNull());
  it("returns null when typography fonts are undefined", () =>
    expect(matchFont("Inter", tokens({ typography: {} }))).toBeNull());
});
