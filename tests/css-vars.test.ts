import { describe, expect, it } from "vitest";
import { generateCssVars } from "../src/generators/css-vars.js";

describe("generateCssVars", () => {
  it("renders indexed scales and custom color variables", () => {
    const css = generateCssVars({
      source: {
        url: "https://example.com",
        extractedAt: "2026-03-22T00:00:00.000Z",
        extractor: "dembrandt"
      },
      colors: {
        primary: "#111111",
        secondary: "#222222",
        palette: ["#111111"],
        cssVariables: {
          brand: "#111111",
          "--surface": "#ffffff"
        }
      },
      typography: {
        headingFont: "Satoshi",
        bodyFont: "Inter",
        monoFont: "JetBrains Mono"
      },
      spacing: { scale: ["4px", "8px"] },
      radius: { scale: ["6px", "999px"] },
      shadows: {
        scale: [
          "0 1px 2px rgba(0,0,0,0.1)",
          "0 8px 24px rgba(0,0,0,0.12)"
        ]
      }
    });

    expect(css).toContain("--color-primary: #111111;");
    expect(css).toContain("--color-secondary: #222222;");
    expect(css).toContain("--font-heading: Satoshi;");
    expect(css).toContain("--font-body: Inter;");
    expect(css).toContain("--font-mono: JetBrains Mono;");
    expect(css).toContain("--space-1: 4px;");
    expect(css).toContain("--space-2: 8px;");
    expect(css).toContain("--radius-2: 999px;");
    expect(css).toContain("--shadow-2: 0 8px 24px rgba(0,0,0,0.12);");
    expect(css).toContain("--brand: #111111;");
    expect(css).toContain("--surface: #ffffff;");
  });

  it("omits undefined optional values but still returns a valid root block", () => {
    const css = generateCssVars({
      source: {
        url: "https://example.com",
        extractedAt: "2026-03-22T00:00:00.000Z",
        extractor: "dembrandt"
      },
      colors: {
        palette: [],
        cssVariables: {}
      },
      typography: {},
      spacing: { scale: [] },
      radius: { scale: [] },
      shadows: { scale: [] }
    });

    expect(css).toBe(":root {\n}\n");
  });
});
