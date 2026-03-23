import { describe, expect, it } from "vitest";
import { getOutputPaths } from "../src/utils/paths.js";

describe("output paths", () => {
  it("builds the expected output paths from the project root", () => {
    expect(getOutputPaths("/repo")).toEqual({
      extractionDir: "/repo/.extract-design-system",
      rawJson: "/repo/.extract-design-system/raw.json",
      normalizedJson: "/repo/.extract-design-system/normalized.json",
      designSystemDir: "/repo/design-system",
      tokensJson: "/repo/design-system/tokens.json",
      tokensCss: "/repo/design-system/tokens.css"
    });
  });
});
