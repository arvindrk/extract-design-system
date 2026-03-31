import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getOutputPaths } from "../src/utils/paths.js";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const cliEntryPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

async function createFakeDembrandt(binDir: string): Promise<void> {
  const executablePath = path.join(binDir, "dembrandt");
  const script = `#!/usr/bin/env node
const { writeFileSync } = await import("node:fs");

const mode = process.env.FAKE_DEMBRANDT_MODE ?? "success";
const argsPath = process.env.FAKE_DEMBRANDT_ARGS_PATH;
const payload = JSON.parse(process.env.FAKE_DEMBRANDT_PAYLOAD ?? '{"colors":{"palette":[]}}');

if (argsPath) {
  writeFileSync(argsPath, JSON.stringify(process.argv.slice(2)), "utf8");
}

if (mode === "failure") {
  console.error("fake dembrandt failure");
  process.exit(2);
}

if (mode === "invalid-json") {
  console.log("debug line");
  console.log("{invalid-json}");
  process.exit(0);
}

console.log("debug {not-json}");
console.log(JSON.stringify(payload, null, 2));
`;

  await writeFile(executablePath, script, "utf8");
  await chmod(executablePath, 0o755);
}

async function runCli(
  args: string[],
  projectRoot: string,
  env: NodeJS.ProcessEnv = {},
) {
  return execa(process.execPath, [cliEntryPath, ...args], {
    cwd: projectRoot,
    env,
    reject: false,
  });
}

describe("cli integration", () => {
  let projectRoot: string;
  let binDir: string;

  beforeAll(async () => {
    const result = await execa("npm", ["run", "build"], {
      cwd: repoRoot,
      reject: false
    });

    expect(result.exitCode).toBe(0);
  });

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), "extract-design-system-cli-"));
    binDir = path.join(projectRoot, "bin");
    await mkdir(binDir, { recursive: true });
    await createFakeDembrandt(binDir);
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("runs extraction end to end, forwards flags, and writes output files", async () => {
    const outputPaths = getOutputPaths(projectRoot);
    const argsPath = path.join(projectRoot, "dembrandt-args.json");
    const payload = {
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

    const result = await runCli(["https://example.com", "--mobile", "--browser", "firefox"], projectRoot, {
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
      FAKE_DEMBRANDT_ARGS_PATH: argsPath,
      FAKE_DEMBRANDT_PAYLOAD: JSON.stringify(payload)
    });

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(await readFile(argsPath, "utf8"))).toEqual([
      "https://example.com",
      "--json-only",
      "--mobile",
      "--browser=firefox"
    ]);
    expect(JSON.parse(await readFile(outputPaths.rawJson, "utf8"))).toEqual(payload);
    expect(JSON.parse(await readFile(outputPaths.normalizedJson, "utf8"))).toMatchObject({
      source: {
        url: "https://example.com",
        extractor: "dembrandt"
      },
      colors: {
        primary: "#111111",
        palette: ["#111111", "#ffffff"]
      }
    });
    expect(await readFile(outputPaths.tokensCss, "utf8")).toContain("--color-primary: #111111;");
  });

  it("skips token generation for extract-only runs", async () => {
    const outputPaths = getOutputPaths(projectRoot);
    const result = await runCli(["https://example.com", "--extract-only"], projectRoot, {
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
      FAKE_DEMBRANDT_PAYLOAD: JSON.stringify({
        colors: {
          palette: ["#111111"]
        }
      })
    });

    expect(result.exitCode).toBe(0);
    await expect(readFile(outputPaths.rawJson, "utf8")).resolves.toContain("#111111");
    await expect(readFile(outputPaths.tokensJson, "utf8")).rejects.toThrow();
    await expect(readFile(outputPaths.tokensCss, "utf8")).rejects.toThrow();
  });

  it("surfaces extractor failures with a non-zero exit code and no output files", async () => {
    const outputPaths = getOutputPaths(projectRoot);
    const result = await runCli(["https://example.com"], projectRoot, {
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`,
      FAKE_DEMBRANDT_MODE: "failure"
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("dembrandt extraction failed:");
    expect(result.stderr).toContain("fake dembrandt failure");
    await expect(readFile(outputPaths.rawJson, "utf8")).rejects.toThrow();
    await expect(readFile(outputPaths.normalizedJson, "utf8")).rejects.toThrow();
  });

  it("regenerates token files from normalized output through the init command", async () => {
    const outputPaths = getOutputPaths(projectRoot);

    await mkdir(outputPaths.extractionDir, { recursive: true });
    await writeFile(
      outputPaths.normalizedJson,
      `${JSON.stringify(
        {
          source: {
            url: "https://example.com",
            extractedAt: "2026-03-30T00:00:00.000Z",
            extractor: "dembrandt"
          },
          colors: {
            primary: "#111111",
            palette: ["#111111", "#ffffff"],
            cssVariables: {}
          },
          typography: {
            bodyFont: "Inter"
          },
          spacing: {
            scale: ["4px"]
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

    const result = await runCli(["init"], projectRoot, {
      PATH: `${binDir}${path.delimiter}${process.env.PATH ?? ""}`
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(await readFile(outputPaths.tokensJson, "utf8"))).toMatchObject({
      colors: {
        primary: "#111111"
      }
    });
    expect(await readFile(outputPaths.tokensCss, "utf8")).toContain("--font-body: Inter;");
  });
});
