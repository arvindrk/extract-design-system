import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { walkFiles, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS } from "../src/scanners/file-scanner.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "file-scanner-"));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

async function touch(rel: string): Promise<void> {
  const full = path.join(tmpDir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, "");
}

describe("walkFiles", () => {
  it("yields .css and .tsx files", async () => {
    await touch("style.css");
    await touch("Component.tsx");
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files).toContain(path.join(tmpDir, "style.css"));
    expect(files).toContain(path.join(tmpDir, "Component.tsx"));
  });

  it("yields files in subdirectories", async () => {
    await touch("src/components/Button.tsx");
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files).toContain(path.join(tmpDir, "src/components/Button.tsx"));
  });

  it("skips node_modules", async () => {
    await touch("node_modules/lib/style.css");
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files.some((f) => f.includes("node_modules"))).toBe(false);
  });

  it("skips .extract-design-system", async () => {
    await touch(".extract-design-system/raw.css");
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files.some((f) => f.includes(".extract-design-system"))).toBe(false);
  });

  it("skips files with non-matching extensions", async () => {
    await touch("README.md");
    await touch("data.json");
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files.some((f) => f.endsWith(".md") || f.endsWith(".json"))).toBe(false);
  });

  it("accepts custom extensions", async () => {
    await touch("style.sass");
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, new Set(["sass"]), DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files).toContain(path.join(tmpDir, "style.sass"));
  });

  it("yields nothing in an empty directory", async () => {
    const files: string[] = [];
    for await (const f of walkFiles(tmpDir, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS)) {
      files.push(f);
    }
    expect(files).toHaveLength(0);
  });
});
