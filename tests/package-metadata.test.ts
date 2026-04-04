import pkg from "../package.json" with { type: "json" };
import codexPlugin from "../.codex-plugin/plugin.json" with { type: "json" };
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
      ".codex-plugin",
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
    expect(pkg.repository).toEqual({
      type: "git",
      url: "git+https://github.com/arvindrk/extract-design-system.git"
    });
    expect(pkg.homepage).toBe(
      "https://github.com/arvindrk/extract-design-system#readme"
    );
    expect(pkg.bugs).toEqual({
      url: "https://github.com/arvindrk/extract-design-system/issues"
    });
    expect(pkg.funding).toEqual({
      type: "github",
      url: "https://github.com/sponsors/arvindrk"
    });
    expect(pkg.license).toBe("MIT");
    expect(pkg.keywords).toEqual(
      expect.arrayContaining([
        "design-tokens",
        "token-generator",
        "css-custom-properties",
        "website-analysis"
      ])
    );
  });

  it("ships a codex plugin manifest aligned with package metadata", () => {
    expect(codexPlugin).toEqual({
      name: pkg.name,
      version: pkg.version,
      description: "Extract design primitives from public websites into starter token files.",
      skills: "./skills/"
    });
  });

  it("does not depend on itself", () => {
    expect(pkg.dependencies).not.toHaveProperty("extract-design-system");
  });
});
