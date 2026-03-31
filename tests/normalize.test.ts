import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeExtraction } from "../src/normalize/normalize.js";
import { normalizedDesignSystemSchema } from "../src/schemas/normalized.js";

describe("normalized schema", () => {
  it("accepts a minimal valid normalized design system", () => {
    const result = normalizedDesignSystemSchema.safeParse({
      source: {
        url: "https://example.com",
        extractedAt: "2026-03-22T00:00:00.000Z",
        extractor: "dembrandt"
      },
      colors: { palette: [], cssVariables: {} },
      typography: {},
      spacing: { scale: [] },
      radius: { scale: [] },
      shadows: { scale: [] }
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid source metadata", () => {
    const result = normalizedDesignSystemSchema.safeParse({
      source: {
        url: "not-a-url",
        extractedAt: "yesterday",
        extractor: "other"
      },
      colors: { palette: [], cssVariables: {} },
      typography: {},
      spacing: { scale: [] },
      radius: { scale: [] },
      shadows: { scale: [] }
    });

    expect(result.success).toBe(false);
  });
});

describe("normalizeExtraction", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-23T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps raw extraction into stable token buckets", () => {
    const normalized = normalizeExtraction(
      {
        colors: { primary: "#111111", palette: ["#111111", "#ffffff"] },
        typography: { fonts: ["Inter"] },
        spacing: { scale: ["4px", "8px"] },
        borders: { radius: ["6px"] },
        shadows: { values: ["0 1px 2px rgba(0,0,0,0.1)"] }
      },
      "https://example.com"
    );

    expect(normalized.source).toEqual({
      url: "https://example.com",
      extractedAt: "2026-03-23T00:00:00.000Z",
      extractor: "dembrandt"
    });
    expect(normalized.colors.primary).toBe("#111111");
    expect(normalized.colors.palette).toEqual(["#111111", "#ffffff"]);
    expect(normalized.typography.bodyFont).toBe("Inter");
    expect(normalized.spacing.scale).toEqual(["4px", "8px"]);
    expect(normalized.radius.scale).toEqual(["6px"]);
    expect(normalized.shadows.scale).toEqual(["0 1px 2px rgba(0,0,0,0.1)"]);
  });

  it("uses semantic fallbacks and filters non-string css variables", () => {
    const normalized = normalizeExtraction(
      {
        colors: {
          semantic: {
            primary: "#0f172a",
            secondary: "#475569",
            accent: "#22c55e",
            background: "#ffffff",
            foreground: "#020617"
          },
          cssVariables: {
            brand: "#0f172a",
            ignored: 12,
            "--surface": "#ffffff"
          }
        },
        typography: {
          styles: [
            { family: "General Sans" },
            { family: "IBM Plex Sans" }
          ]
        },
        spacing: {
          commonValues: [
            { px: "4px" },
            { px: "8px" },
            { px: "4px" }
          ]
        },
        borderRadius: {
          values: ["6px", "999px", "6px"]
        },
        shadows: [
          { value: "0 1px 2px rgba(0,0,0,0.08)" },
          { value: "0 8px 24px rgba(0,0,0,0.16)" },
          { value: "0 1px 2px rgba(0,0,0,0.08)" }
        ]
      },
      "https://example.com"
    );

    expect(normalized.colors.primary).toBe("#0f172a");
    expect(normalized.colors.secondary).toBe("#475569");
    expect(normalized.colors.accent).toBe("#22c55e");
    expect(normalized.colors.background).toBe("#ffffff");
    expect(normalized.colors.foreground).toBe("#020617");
    expect(normalized.colors.palette).toEqual([
      "#0f172a",
      "#475569",
      "#22c55e",
      "#ffffff",
      "#020617"
    ]);
    expect(normalized.colors.cssVariables).toEqual({
      brand: "#0f172a",
      "--surface": "#ffffff"
    });
    expect(normalized.typography.headingFont).toBe("General Sans");
    expect(normalized.typography.bodyFont).toBe("General Sans");
    expect(normalized.spacing.scale).toEqual(["4px", "8px"]);
    expect(normalized.radius.scale).toEqual(["6px", "999px"]);
    expect(normalized.shadows.scale).toEqual([
      "0 1px 2px rgba(0,0,0,0.08)",
      "0 8px 24px rgba(0,0,0,0.16)"
    ]);
  });

  it("prefers raw source metadata when provided", () => {
    const normalized = normalizeExtraction(
      {
        url: "https://raw.example.com",
        extractedAt: "2026-03-01T12:00:00.000Z",
        typography: {
          headingFont: "Satoshi",
          bodyFont: "Inter",
          monoFont: "JetBrains Mono"
        },
        spacing: {
          scale: ["2px", "4px", "2px"]
        },
        borders: {
          radius: ["2px", "4px", "2px"]
        },
        shadows: {
          values: ["0 0 0 transparent"]
        }
      },
      "https://fallback.example.com"
    );

    expect(normalized.source.url).toBe("https://raw.example.com");
    expect(normalized.source.extractedAt).toBe("2026-03-01T12:00:00.000Z");
    expect(normalized.typography).toEqual({
      headingFont: "Satoshi",
      bodyFont: "Inter",
      monoFont: "JetBrains Mono"
    });
    expect(normalized.spacing.scale).toEqual(["2px", "4px"]);
    expect(normalized.radius.scale).toEqual(["2px", "4px"]);
    expect(normalized.shadows.scale).toEqual(["0 0 0 transparent"]);
  });

  it("drops blank strings across normalized collections", () => {
    const normalized = normalizeExtraction(
      {
        colors: {
          palette: ["#111111", "   ", "#111111"],
          cssVariables: {
            brand: "#111111",
            blank: "   "
          }
        },
        typography: {
          styles: [
            { family: "  " },
            { family: "IBM Plex Sans" }
          ]
        },
        spacing: {
          scale: ["4px", " ", "4px"]
        },
        borderRadius: {
          values: ["6px", "  ", "6px"]
        },
        shadows: {
          values: ["0 1px 2px rgba(0,0,0,0.1)", "   "]
        }
      },
      "https://example.com"
    );

    expect(normalized.colors.palette).toEqual(["#111111"]);
    expect(normalized.colors.cssVariables).toEqual({
      brand: "#111111"
    });
    expect(normalized.typography.headingFont).toBe("IBM Plex Sans");
    expect(normalized.typography.bodyFont).toBe("IBM Plex Sans");
    expect(normalized.spacing.scale).toEqual(["4px"]);
    expect(normalized.radius.scale).toEqual(["6px"]);
    expect(normalized.shadows.scale).toEqual(["0 1px 2px rgba(0,0,0,0.1)"]);
  });

  it("throws when no valid source url can be derived", () => {
    expect(() => normalizeExtraction({}, "not-a-url")).toThrow();
  });
});
