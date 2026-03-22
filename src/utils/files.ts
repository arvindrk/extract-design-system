import { mkdir, readFile, writeFile } from "node:fs/promises";

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJson<T>(path: string): Promise<T> {
  const contents = await readFile(path, "utf8");
  return JSON.parse(contents) as T;
}

export async function writeText(path: string, value: string): Promise<void> {
  await writeFile(path, value, "utf8");
}
