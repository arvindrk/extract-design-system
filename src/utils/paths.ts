import path from "node:path";

export function getOutputPaths(projectRoot: string = process.cwd()) {
  const extractionDir = path.join(projectRoot, ".extract-design-system");
  const designSystemDir = path.join(projectRoot, "design-system");

  return {
    extractionDir,
    rawJson: path.join(extractionDir, "raw.json"),
    normalizedJson: path.join(extractionDir, "normalized.json"),
    designSystemDir,
    tokensJson: path.join(designSystemDir, "tokens.json"),
    tokensCss: path.join(designSystemDir, "tokens.css")
  };
}
