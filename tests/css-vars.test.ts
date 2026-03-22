import { describe, expect, it } from "vitest";
import { generateCssVars } from "../src/generators/css-vars.js";

describe("generateCssVars", () => {
  it("renders root-level custom properties from normalized tokens", () => {
    const css = generateCssVars({
      source: {
        url: "https://example.com",
        extractedAt: "2026-03-22T00:00:00.000Z",
        extractor: "dembrandt"
      },
      colors: {
        primary: "#111111",
        palette: ["#111111"],
        cssVariables: {}
      },
      typography: { bodyFont: "Inter" },
      spacing: { scale: ["4px"] },
      radius: { scale: ["6px"] },
      shadows: { scale: ["0 1px 2px rgba(0,0,0,0.1)"] }
    });

    expect(css).toContain("--color-primary: #111111;");
    expect(css).toContain("--font-body: Inter;");
  });
});
