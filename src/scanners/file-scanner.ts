import { readdir } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".extract-design-system",
  "design-system",
  ".next",
  ".nuxt",
  ".turbo",
  "coverage",
  ".cache",
  "build",
  "out",
]);

export const DEFAULT_EXTENSIONS = new Set([
  "css",
  "scss",
  "less",
  "ts",
  "tsx",
  "js",
  "jsx",
  "vue",
  "svelte",
  "html",
]);

export async function* walkFiles(
  dir: string,
  extensions: Set<string>,
  skipDirs: Set<string>
): AsyncGenerator<string> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!skipDirs.has(entry.name)) {
        yield* walkFiles(fullPath, extensions, skipDirs);
      }
    } else if (entry.isFile()) {
      const ext = entry.name.split(".").pop() ?? "";
      if (extensions.has(ext)) {
        yield fullPath;
      }
    }
  }
}
