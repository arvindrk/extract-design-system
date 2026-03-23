import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ensureDir, readJson, writeJson, writeText } from "../src/utils/files.js";

describe("file utilities", () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(os.tmpdir(), "extract-design-system-files-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("creates directories idempotently", async () => {
    const nestedDir = path.join(projectRoot, "design-system", "nested");

    await ensureDir(nestedDir);
    await expect(ensureDir(nestedDir)).resolves.toBeUndefined();
  });

  it("writes and reads json with a trailing newline", async () => {
    const jsonPath = path.join(projectRoot, "tokens.json");
    const value = {
      colors: ["#111111"],
      spacing: ["4px"]
    };

    await writeJson(jsonPath, value);

    expect(await readFile(jsonPath, "utf8")).toBe(`${JSON.stringify(value, null, 2)}\n`);
    await expect(readJson<typeof value>(jsonPath)).resolves.toEqual(value);
  });

  it("throws when readJson receives invalid json", async () => {
    const jsonPath = path.join(projectRoot, "broken.json");
    await writeFile(jsonPath, "{broken}\n", "utf8");

    await expect(readJson(jsonPath)).rejects.toThrow();
  });

  it("writes exact text content", async () => {
    const textPath = path.join(projectRoot, "tokens.css");

    await writeText(textPath, ":root {\n  --color-primary: #111111;\n}\n");

    await expect(readFile(textPath, "utf8")).resolves.toBe(
      ":root {\n  --color-primary: #111111;\n}\n"
    );
  });
});
