import { readFile } from "node:fs/promises";
import type { NormalizedDesignSystem } from "../schemas/normalized.js";
import type { AuditFinding, AuditCommandOptions, AuditSummary } from "../schemas/audit.js";
import { readJson } from "../utils/files.js";
import { getOutputPaths } from "../utils/paths.js";
import { walkFiles, DEFAULT_EXTENSIONS, DEFAULT_SKIP_DIRS } from "../scanners/file-scanner.js";
import { scanContent } from "../scanners/pattern-scanner.js";
import { nearestPaletteColor } from "../matchers/color-matcher.js";
import { matchSpacing, matchRadius, matchShadow, matchFont } from "../matchers/token-matcher.js";
import { computeSummary } from "../formatters/audit-report.js";

const DEFAULT_THRESHOLD = 15;

export async function auditCommand(
  dir: string,
  options: AuditCommandOptions,
  projectRoot: string = process.cwd()
): Promise<{ findings: AuditFinding[]; summary: AuditSummary }> {
  const paths = getOutputPaths(projectRoot);
  let tokens: NormalizedDesignSystem;

  try {
    tokens = await readJson<NormalizedDesignSystem>(paths.tokensJson);
  } catch {
    throw new Error("No tokens found. Run extract-design-system first.");
  }

  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const extensions =
    options.extensions && options.extensions.length > 0
      ? new Set(options.extensions)
      : DEFAULT_EXTENSIONS;

  const findings: AuditFinding[] = [];

  for await (const filePath of walkFiles(dir, extensions, DEFAULT_SKIP_DIRS)) {
    let content: string;
    try {
      content = await readFile(filePath, "utf8");
    } catch {
      continue;
    }

    for (const raw of scanContent(content, filePath)) {
      let suggestion: string | null = null;
      let distance: number | null = null;
      let isExactMatch = false;

      if (raw.category === "color") {
        const match = nearestPaletteColor(raw.rawValue, tokens, threshold);
        if (match) {
          suggestion = match.token;
          distance = match.distance;
          isExactMatch = match.isExact;
        }
      } else if (raw.category === "spacing") {
        suggestion = matchSpacing(raw.rawValue, tokens);
        isExactMatch = suggestion !== null;
      } else if (raw.category === "radius") {
        suggestion = matchRadius(raw.rawValue, tokens);
        isExactMatch = suggestion !== null;
      } else if (raw.category === "shadow") {
        suggestion = matchShadow(raw.rawValue, tokens);
        isExactMatch = suggestion !== null;
      } else if (raw.category === "typography") {
        suggestion = matchFont(raw.rawValue, tokens);
        isExactMatch = suggestion !== null;
      }

      findings.push({ ...raw, suggestion, distance, isExactMatch });
    }
  }

  const filtered = options.onlyUnmatched ? findings.filter((f) => f.suggestion === null) : findings;
  return { findings: filtered, summary: computeSummary(filtered) };
}
