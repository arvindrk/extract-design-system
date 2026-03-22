import { describe, expect, it } from "vitest";
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
});

describe("normalizeExtraction", () => {
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

    expect(normalized.colors.palette).toEqual(["#111111", "#ffffff"]);
    expect(normalized.typography.bodyFont).toBe("Inter");
  });
});
