import { describe, expect, it } from "vitest";
import { scanContent } from "../src/scanners/pattern-scanner.js";

describe("scanContent — colors", () => {
  it("finds a 6-digit hex color in CSS", () => {
    const findings = scanContent("color: #3b82f6;", "test.css");
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ rawValue: "#3b82f6", category: "color", line: 1, column: 8 });
  });

  it("finds a 3-digit hex color", () => {
    const findings = scanContent("background: #fff;", "test.css");
    expect(findings.some((f) => f.rawValue === "#fff" && f.category === "color")).toBe(true);
  });

  it("finds an rgb() color", () => {
    const findings = scanContent("color: rgb(59, 130, 246);", "test.css");
    expect(findings.some((f) => f.category === "color" && f.rawValue.startsWith("rgb("))).toBe(true);
  });

  it("skips a line that only uses var()", () => {
    const findings = scanContent("color: var(--color-primary);", "test.css");
    expect(findings.filter((f) => f.category === "color")).toHaveLength(0);
  });

  it("finds hex in a JS inline style object", () => {
    const findings = scanContent('const s = { color: "#3b82f6" };', "Component.tsx");
    expect(findings.some((f) => f.category === "color" && f.rawValue === "#3b82f6")).toBe(true);
  });
});

describe("scanContent — spacing", () => {
  it("finds a pixel value in padding", () => {
    const findings = scanContent("  padding: 8px;", "test.css");
    expect(findings.some((f) => f.category === "spacing" && f.rawValue === "8px")).toBe(true);
  });

  it("finds multiple pixel values in shorthand padding", () => {
    const findings = scanContent("  padding: 8px 16px;", "test.css");
    const spacings = findings.filter((f) => f.category === "spacing");
    expect(spacings.map((f) => f.rawValue)).toEqual(expect.arrayContaining(["8px", "16px"]));
  });

  it("skips var() values in spacing", () => {
    const findings = scanContent("  padding: var(--space-1);", "test.css");
    expect(findings.filter((f) => f.category === "spacing")).toHaveLength(0);
  });

  it("finds pixel value in JS margin property", () => {
    const findings = scanContent('const s = { margin: "8px" };', "Component.tsx");
    expect(findings.some((f) => f.category === "spacing" && f.rawValue === "8px")).toBe(true);
  });
});

describe("scanContent — radius", () => {
  it("finds border-radius pixel value", () => {
    const findings = scanContent("border-radius: 4px;", "test.css");
    expect(findings.some((f) => f.category === "radius" && f.rawValue === "4px")).toBe(true);
  });

  it("finds JS borderRadius value", () => {
    const findings = scanContent('const s = { borderRadius: "4px" };', "test.tsx");
    expect(findings.some((f) => f.category === "radius" && f.rawValue === "4px")).toBe(true);
  });
});

describe("scanContent — shadow", () => {
  it("finds a box-shadow value", () => {
    const findings = scanContent("box-shadow: 0 1px 2px rgba(0,0,0,0.1);", "test.css");
    expect(
      findings.some((f) => f.category === "shadow" && f.rawValue === "0 1px 2px rgba(0,0,0,0.1)")
    ).toBe(true);
  });
});

describe("scanContent — typography", () => {
  it("finds a font-family value", () => {
    const findings = scanContent('font-family: "Inter", sans-serif;', "test.css");
    expect(
      findings.some((f) => f.category === "typography" && f.rawValue.includes("Inter"))
    ).toBe(true);
  });
});

describe("scanContent — multi-line", () => {
  it("reports correct line numbers", () => {
    const content = ["", "color: #111111;", ""].join("\n");
    const findings = scanContent(content, "test.css");
    expect(findings.find((f) => f.rawValue === "#111111")?.line).toBe(2);
  });
});
