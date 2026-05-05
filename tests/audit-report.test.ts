import { describe, expect, it } from "vitest";
import { computeSummary, formatAuditReport, formatAuditJson } from "../src/formatters/audit-report.js";
import type { AuditFinding } from "../src/schemas/audit.js";

function finding(overrides: Partial<AuditFinding> = {}): AuditFinding {
  return {
    file: "src/Button.tsx",
    line: 10,
    column: 5,
    rawValue: "#3b82f6",
    property: "color",
    category: "color",
    suggestion: "--color-primary",
    distance: 0,
    isExactMatch: true,
    ...overrides,
  };
}

describe("computeSummary", () => {
  it("counts exact matches, near-matches, and unmatched", () => {
    const findings = [
      finding({ suggestion: "--color-primary", isExactMatch: true, distance: 0 }),
      finding({ suggestion: "--color-primary", isExactMatch: false, distance: 5 }),
      finding({ suggestion: null, isExactMatch: false, distance: null }),
    ];
    const s = computeSummary(findings);
    expect(s.total).toBe(3);
    expect(s.matched).toBe(1);
    expect(s.nearMatched).toBe(1);
    expect(s.unmatched).toBe(1);
    expect(s.coveragePct).toBeCloseTo(66.67, 1);
  });

  it("returns 100% coverage when all are matched", () => {
    const findings = [finding(), finding()];
    expect(computeSummary(findings).coveragePct).toBe(100);
  });

  it("returns 0% coverage for empty findings", () => {
    expect(computeSummary([]).coveragePct).toBe(0);
  });
});

describe("formatAuditReport", () => {
  it("groups findings by file", () => {
    const findings = [
      finding({ file: "src/Button.tsx", line: 1, suggestion: "--color-primary", isExactMatch: true, distance: 0 }),
      finding({ file: "src/Button.tsx", line: 5, suggestion: null, isExactMatch: false, distance: null }),
      finding({ file: "src/Card.tsx", line: 2, suggestion: "--space-2", isExactMatch: true, distance: null, category: "spacing" }),
    ];
    const summary = computeSummary(findings);
    const output = formatAuditReport(findings, summary);
    expect(output).toContain("src/Button.tsx");
    expect(output).toContain("src/Card.tsx");
    expect(output).toContain("--color-primary");
    expect(output).toContain("no match");
    expect(output).toContain("--space-2");
  });

  it("includes summary line", () => {
    const summary = computeSummary([finding()]);
    const output = formatAuditReport([finding()], summary);
    expect(output).toContain("1 total");
  });
});

describe("formatAuditJson", () => {
  it("produces valid JSON with findings and summary", () => {
    const findings = [finding()];
    const summary = computeSummary(findings);
    const json = JSON.parse(formatAuditJson(findings, summary));
    expect(json.findings).toHaveLength(1);
    expect(json.summary.total).toBe(1);
  });
});
