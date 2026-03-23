import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { logInfoMock } = vi.hoisted(() => ({
  logInfoMock: vi.fn()
}));

vi.mock("../src/utils/logger.js", () => ({
  logInfo: logInfoMock
}));

import { initCommand } from "../src/commands/init.js";
import { getOutputPaths } from "../src/utils/paths.js";

describe("init command", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), "extract-design-system-init-"));
    logInfoMock.mockReset();
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("writes tokens.json and tokens.css from the normalized extraction", async () => {
    const outputPaths = getOutputPaths(projectRoot);

    await mkdir(outputPaths.extractionDir, { recursive: true });
    await writeFile(
      outputPaths.normalizedJson,
      `${JSON.stringify(
        {
          source: {
            url: "https://example.com",
            extractedAt: "2026-03-22T00:00:00.000Z",
            extractor: "dembrandt"
          },
          colors: {
            primary: "#111111",
            palette: ["#111111", "#ffffff"],
            cssVariables: {
              brand: "#111111"
            }
          },
          typography: {
            bodyFont: "Inter"
          },
          spacing: {
            scale: ["4px", "8px"]
          },
          radius: {
            scale: ["6px"]
          },
          shadows: {
            scale: ["0 1px 2px rgba(0,0,0,0.1)"]
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    await initCommand(projectRoot);

    const tokensJson = JSON.parse(await readFile(outputPaths.tokensJson, "utf8"));
    const tokensCss = await readFile(outputPaths.tokensCss, "utf8");

    expect(tokensJson.colors.primary).toBe("#111111");
    expect(tokensJson.spacing.scale).toEqual(["4px", "8px"]);
    expect(tokensCss).toContain("--color-primary: #111111;");
    expect(tokensCss).toContain("--font-body: Inter;");
    expect(tokensCss).toContain("--brand: #111111;");
    expect(logInfoMock).toHaveBeenCalledWith(`Wrote ${outputPaths.tokensJson}`);
    expect(logInfoMock).toHaveBeenCalledWith(`Wrote ${outputPaths.tokensCss}`);
  });

  it("fails when no normalized extraction exists", async () => {
    await expect(initCommand(projectRoot)).rejects.toThrow();
  });

  it("fails when normalized.json is not valid json", async () => {
    const outputPaths = getOutputPaths(projectRoot);

    await mkdir(outputPaths.extractionDir, { recursive: true });
    await writeFile(outputPaths.normalizedJson, "{not-json}\n", "utf8");

    await expect(initCommand(projectRoot)).rejects.toThrow();
  });

  it("fails when normalized.json does not satisfy the schema", async () => {
    const outputPaths = getOutputPaths(projectRoot);

    await mkdir(outputPaths.extractionDir, { recursive: true });
    await writeFile(
      outputPaths.normalizedJson,
      `${JSON.stringify(
        {
          source: {
            url: "not-a-url",
            extractedAt: "2026-03-22",
            extractor: "dembrandt"
          },
          colors: {
            palette: [],
            cssVariables: {}
          },
          typography: {},
          spacing: {
            scale: []
          },
          radius: {
            scale: []
          },
          shadows: {
            scale: []
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    await expect(initCommand(projectRoot)).rejects.toThrow();
  });
});
