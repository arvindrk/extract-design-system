import pkg from "../package.json" with { type: "json" };
import { describe, expect, it } from "vitest";

describe("package metadata", () => {
  it("uses the intended npm package name", () => {
    expect(pkg.name).toBe("extract-design-system");
  });
});
