import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { auditCommand } from "../src/commands/audit.js";

let tmpDir: string;
let projectRoot: string;

const minimalTokens = {
  source: { url: "https://example.com", extractedAt: "2026-01-01T00:00:00.000Z", extractor: "dembrandt" },
  colors: { primary: "#3b82f6", palette: ["#3b82f6"], cssVariables: {} },
  typography: { headingFont: "Inter" },
  spacing: { scale: ["8px"] },
  radius: { scale: ["4px"] },
  shadows: { scale: ["0 1px 2px rgba(0,0,0,0.1)"] },
};

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "audit-cmd-scan-"));
  projectRoot = await mkdtemp(path.join(os.tmpdir(), "audit-cmd-root-"));
  await mkdir(path.join(projectRoot, "design-system"), { recursive: true });
  await writeFile(
    path.join(projectRoot, "design-system/tokens.json"),
    JSON.stringify(minimalTokens, null, 2)
  );
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
  await rm(projectRoot, { recursive: true, force: true });
});

describe("auditCommand", () => {
  it("returns an exact color match with a suggestion", async () => {
    await writeFile(path.join(tmpDir, "style.css"), "color: #3b82f6;");
    const { findings } = await auditCommand(tmpDir, {}, projectRoot);
    const colorFinding = findings.find((f) => f.rawValue === "#3b82f6");
    expect(colorFinding?.suggestion).toBe("--color-primary");
    expect(colorFinding?.isExactMatch).toBe(true);
  });

  it("returns an unmatched finding for an unknown color", async () => {
    await writeFile(path.join(tmpDir, "style.css"), "color: #ff0000;");
    const { findings } = await auditCommand(tmpDir, {}, projectRoot);
    expect(findings.find((f) => f.rawValue === "#ff0000")?.suggestion).toBeNull();
  });

  it("returns a spacing match with suggestion", async () => {
    await writeFile(path.join(tmpDir, "style.css"), "padding: 8px;");
    const { findings } = await auditCommand(tmpDir, {}, projectRoot);
    expect(findings.find((f) => f.rawValue === "8px")?.suggestion).toBe("--space-1");
  });

  it("filters to only-unmatched when option is set", async () => {
    await writeFile(path.join(tmpDir, "style.css"), "color: #3b82f6;\ncolor: #ff0000;");
    const { findings } = await auditCommand(tmpDir, { onlyUnmatched: true }, projectRoot);
    expect(findings.every((f) => f.suggestion === null)).toBe(true);
  });

  it("returns empty findings for a directory with no source files", async () => {
    const { findings, summary } = await auditCommand(tmpDir, {}, projectRoot);
    expect(findings).toHaveLength(0);
    expect(summary.total).toBe(0);
  });

  it("throws a descriptive error when tokens.json does not exist", async () => {
    const emptyRoot = await mkdtemp(path.join(os.tmpdir(), "no-tokens-"));
    try {
      await expect(auditCommand(tmpDir, {}, emptyRoot)).rejects.toThrow(
        "No tokens found. Run extract-design-system first."
      );
    } finally {
      await rm(emptyRoot, { recursive: true, force: true });
    }
  });

  it("uses a custom threshold via options", async () => {
    await writeFile(path.join(tmpDir, "style.css"), "color: #3a81f5;");
    const withThreshold = await auditCommand(tmpDir, { threshold: 5 }, projectRoot);
    const withoutThreshold = await auditCommand(tmpDir, { threshold: 0 }, projectRoot);
    expect(withThreshold.findings.find((f) => f.rawValue === "#3a81f5")?.suggestion).not.toBeNull();
    expect(withoutThreshold.findings.find((f) => f.rawValue === "#3a81f5")?.suggestion).toBeNull();
  });
});
