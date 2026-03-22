import { buildDembrandtArgs, runDembrandt, type DembrandtOptions } from "../adapters/dembrandt.js";
import { normalizeExtraction } from "../normalize/normalize.js";
import { ensureDir, writeJson } from "../utils/files.js";
import { logInfo } from "../utils/logger.js";
import { getOutputPaths } from "../utils/paths.js";

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
  options: DembrandtOptions,
  projectRoot: string = process.cwd()
): Promise<void> {
  assertValidUrl(url);

  const outputPaths = getOutputPaths(projectRoot);
  await ensureDir(outputPaths.extractionDir);

  logInfo(`Running dembrandt with args: ${buildDembrandtArgs(url, options).join(" ")}`);
  const raw = await runDembrandt(url, options);
  const normalized = normalizeExtraction(raw, url);

  await writeJson(outputPaths.rawJson, raw);
  await writeJson(outputPaths.normalizedJson, normalized);

  logInfo(summarizeNormalized(normalized));
}
