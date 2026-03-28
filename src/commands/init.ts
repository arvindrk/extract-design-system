import { normalizedDesignSystemSchema } from "../schemas/normalized.js";
import { readJson } from "../utils/files.js";
import { getOutputPaths } from "../utils/paths.js";
import { writeDesignSystemFiles } from "./write-design-system.js";

export async function initCommand(projectRoot: string = process.cwd()): Promise<void> {
  const outputPaths = getOutputPaths(projectRoot);
  const normalized = normalizedDesignSystemSchema.parse(await readJson(outputPaths.normalizedJson));

  await writeDesignSystemFiles(normalized, projectRoot);
}
