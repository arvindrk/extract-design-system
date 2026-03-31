import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { buildDembrandtArgsMock, runDembrandtMock, logInfoMock } = vi.hoisted(() => ({
  buildDembrandtArgsMock: vi.fn(),
  runDembrandtMock: vi.fn(),
  logInfoMock: vi.fn()
}));

vi.mock("../src/adapters/dembrandt.js", () => ({
  buildDembrandtArgs: buildDembrandtArgsMock,
  runDembrandt: runDembrandtMock
}));

vi.mock("../src/utils/logger.js", () => ({
  logInfo: logInfoMock
}));

import {
  assertValidUrl,
  extractCommand,
  summarizeNormalized
} from "../src/commands/extract.js";
import { getOutputPaths } from "../src/utils/paths.js";

describe("extract command", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), "extract-design-system-extract-"));
    buildDembrandtArgsMock.mockReset();
    runDembrandtMock.mockReset();
    logInfoMock.mockReset();
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("rejects invalid urls before invoking dembrandt", async () => {
    await expect(extractCommand("not-a-url", {}, projectRoot)).rejects.toThrow(
      "Invalid URL: not-a-url"
    );
    expect(runDembrandtMock).not.toHaveBeenCalled();
  });

  it("rejects non-http urls before invoking dembrandt", async () => {
    await expect(extractCommand("ftp://example.com", {}, projectRoot)).rejects.toThrow(
      "Invalid URL: ftp://example.com"
    );
    expect(runDembrandtMock).not.toHaveBeenCalled();
  });

  it("summarizes palette counts and deduplicated fonts", () => {
    expect(
      summarizeNormalized({
        source: {
          url: "https://example.com",
          extractedAt: "2026-03-23T00:00:00.000Z",
          extractor: "dembrandt"
        },
        colors: {
          palette: ["#111111", "#ffffff"],
          cssVariables: {}
        },
        typography: {
          headingFont: "Inter",
          bodyFont: "Inter",
          monoFont: "JetBrains Mono"
        },
        spacing: { scale: [] },
        radius: { scale: [] },
        shadows: { scale: [] }
      })
    ).toBe("Saved 2 palette colors to .extract-design-system/. Fonts detected: Inter, JetBrains Mono.");
  });

  it("reports when no fonts were detected", () => {
    expect(
      summarizeNormalized({
        source: {
          url: "https://example.com",
          extractedAt: "2026-03-23T00:00:00.000Z",
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
      })
    ).toBe("Saved 0 palette colors to .extract-design-system/. Fonts detected: none.");
  });

  it("writes raw, normalized, and token outputs by default", async () => {
    const raw = {
      colors: {
        primary: "#111111",
        palette: ["#111111", "#ffffff"]
      },
      typography: {
        fonts: ["Inter"]
      },
      spacing: {
        scale: ["4px", "8px"]
      },
      borders: {
        radius: ["6px"]
      },
      shadows: {
        values: ["0 1px 2px rgba(0,0,0,0.1)"]
      }
    };

    buildDembrandtArgsMock.mockReturnValue(["https://example.com", "--json-only", "--mobile"]);
    runDembrandtMock.mockResolvedValue(raw);

    await extractCommand("https://example.com", { mobile: true }, projectRoot);

    const outputPaths = getOutputPaths(projectRoot);
    const rawJson = JSON.parse(await readFile(outputPaths.rawJson, "utf8"));
    const normalizedJson = JSON.parse(await readFile(outputPaths.normalizedJson, "utf8"));
    const tokensJson = JSON.parse(await readFile(outputPaths.tokensJson, "utf8"));
    const tokensCss = await readFile(outputPaths.tokensCss, "utf8");

    expect(rawJson).toEqual(raw);
    expect(normalizedJson.source.url).toBe("https://example.com");
    expect(normalizedJson.colors.palette).toEqual(["#111111", "#ffffff"]);
    expect(normalizedJson.typography.bodyFont).toBe("Inter");
    expect(tokensJson.colors.palette).toEqual(["#111111", "#ffffff"]);
    expect(tokensCss).toContain("--color-primary: #111111;");
    expect(runDembrandtMock).toHaveBeenCalledWith("https://example.com", {
      mobile: true
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      "Running dembrandt with args: https://example.com --json-only --mobile"
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      "Saved 2 palette colors to .extract-design-system/. Fonts detected: Inter."
    );
    expect(logInfoMock).toHaveBeenCalledWith(`Wrote ${outputPaths.tokensJson}`);
    expect(logInfoMock).toHaveBeenCalledWith(`Wrote ${outputPaths.tokensCss}`);
  });

  it("skips token generation when extractOnly is enabled", async () => {
    buildDembrandtArgsMock.mockReturnValue(["https://example.com", "--json-only"]);
    runDembrandtMock.mockResolvedValue({
      colors: {
        palette: ["#111111"]
      }
    });

    await extractCommand("https://example.com", { extractOnly: true }, projectRoot);

    const outputPaths = getOutputPaths(projectRoot);
    await expect(access(outputPaths.tokensJson)).rejects.toThrow();
    await expect(access(outputPaths.tokensCss)).rejects.toThrow();
    expect(runDembrandtMock).toHaveBeenCalledWith("https://example.com", {});
  });

  it("propagates dembrandt failures without writing output files", async () => {
    buildDembrandtArgsMock.mockReturnValue(["https://example.com", "--json-only"]);
    runDembrandtMock.mockRejectedValue(new Error("dembrandt exploded"));

    await expect(extractCommand("https://example.com", {}, projectRoot)).rejects.toThrow(
      "dembrandt exploded"
    );

    const outputPaths = getOutputPaths(projectRoot);
    await expect(access(outputPaths.rawJson)).rejects.toThrow();
    await expect(access(outputPaths.normalizedJson)).rejects.toThrow();
  });

  it("accepts well-formed public urls", () => {
    expect(() => assertValidUrl("https://example.com")).not.toThrow();
  });
});
