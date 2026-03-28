import { buildDembrandtArgs, runDembrandt, type DembrandtOptions } from "../adapters/dembrandt.js";
import { normalizeExtraction } from "../normalize/normalize.js";
import { ensureDir, writeJson } from "../utils/files.js";
import { logInfo } from "../utils/logger.js";
import { getOutputPaths } from "../utils/paths.js";
import { writeDesignSystemFiles } from "./write-design-system.js";

export interface ExtractCommandOptions extends DembrandtOptions {
  extractOnly?: boolean;
}

export function assertValidUrl(url: string): void {
  try {
    new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
}

export function summarizeNormalized(normalized: ReturnType<typeof normalizeExtraction>): string {
  const paletteCount = normalized.colors.palette.length;
  const fonts = [...new Set(
    [normalized.typography.headingFont, normalized.typography.bodyFont, normalized.typography.monoFont]
      .filter((value): value is string => Boolean(value))
  )]
    .join(", ");

  return [
    `Saved ${paletteCount} palette color${paletteCount === 1 ? "" : "s"} to .extract-design-system/.`,
    fonts ? `Fonts detected: ${fonts}.` : "Fonts detected: none."
  ].join(" ");
}

export async function extractCommand(
  url: string,
  options: ExtractCommandOptions,
  projectRoot: string = process.cwd()
): Promise<void> {
  assertValidUrl(url);
  const { extractOnly, ...dembrandtOptions } = options;

  const outputPaths = getOutputPaths(projectRoot);
  await ensureDir(outputPaths.extractionDir);

  logInfo(`Running dembrandt with args: ${buildDembrandtArgs(url, dembrandtOptions).join(" ")}`);
  const raw = await runDembrandt(url, dembrandtOptions);
  const normalized = normalizeExtraction(raw, url);

  await writeJson(outputPaths.rawJson, raw);
  await writeJson(outputPaths.normalizedJson, normalized);

  logInfo(summarizeNormalized(normalized));

  if (!extractOnly) {
    await writeDesignSystemFiles(normalized, projectRoot);
  }
}
