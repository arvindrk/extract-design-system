import { describe, expect, it } from "vitest";
import { buildDembrandtArgs, extractJsonPayload } from "../src/adapters/dembrandt.js";

describe("dembrandt adapter", () => {
  it("builds args for json extraction", () => {
    expect(buildDembrandtArgs("https://example.com", { mobile: true })).toEqual([
      "https://example.com",
      "--json-only",
      "--mobile"
    ]);
  });

  it("extracts a trailing json payload from mixed stdout", () => {
    const payload = extractJsonPayload('log line\n{"url":"https://example.com/","colors":{"palette":[]}}\n');

    expect(payload).toEqual({
      url: "https://example.com/",
      colors: {
        palette: []
      }
    });
  });
});
