import pkg from "../package.json" with { type: "json" };
import { describe, expect, it } from "vitest";

describe("package metadata", () => {
  it("uses the intended npm package name", () => {
    expect(pkg.name).toBe("extract-design-system");
  });

  it("publishes the expected cli and package surface", () => {
    expect(pkg.type).toBe("module");
    expect(pkg.bin).toEqual({
      "extract-design-system": "dist/cli.js"
    });
    expect(pkg.files).toEqual([
      "dist",
      "skills",
      "README.md",
      "LICENSE"
    ]);
    expect(pkg.engines).toEqual({
      node: ">=20"
    });
    expect(pkg.scripts).toMatchObject({
      build: expect.any(String),
      test: "vitest run",
      typecheck: "tsc --noEmit"
    });
  });
});
