import { describe, expect, it } from "vitest";
import { getOutputPaths } from "../src/utils/paths.js";

describe("output paths", () => {
  it("uses the expected extraction directory", () => {
    expect(getOutputPaths("/repo").rawJson).toBe("/repo/.extract-design-system/raw.json");
  });
});
