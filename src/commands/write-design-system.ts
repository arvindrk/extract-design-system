import { generateCssVars } from "../generators/css-vars.js";
import type { NormalizedDesignSystem } from "../schemas/normalized.js";
import { ensureDir, writeJson, writeText } from "../utils/files.js";
import { logInfo } from "../utils/logger.js";
import { getOutputPaths } from "../utils/paths.js";

export async function writeDesignSystemFiles(
  normalized: NormalizedDesignSystem,
  projectRoot: string = process.cwd()
): Promise<void> {
  const outputPaths = getOutputPaths(projectRoot);

  await ensureDir(outputPaths.designSystemDir);
  await writeJson(outputPaths.tokensJson, normalized);
  await writeText(outputPaths.tokensCss, generateCssVars(normalized));

  logInfo(`Wrote ${outputPaths.tokensJson}`);
  logInfo(`Wrote ${outputPaths.tokensCss}`);
  logInfo("Import design-system/tokens.css into your app entrypoint when you are ready to apply the starter tokens.");
}
