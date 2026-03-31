import { beforeEach, describe, expect, it, vi } from "vitest";

const { execaMock } = vi.hoisted(() => ({
  execaMock: vi.fn()
}));

vi.mock("execa", () => ({
  execa: execaMock
}));

import {
  buildDembrandtArgs,
  extractJsonPayload,
  runDembrandt
} from "../src/adapters/dembrandt.js";

describe("dembrandt adapter", () => {
  beforeEach(() => {
    execaMock.mockReset();
  });

  it("builds args for all supported extraction flags", () => {
    expect(
      buildDembrandtArgs("https://example.com", {
        darkMode: true,
        mobile: true,
        slow: true,
        browser: "firefox"
      })
    ).toEqual([
      "https://example.com",
      "--json-only",
      "--dark-mode",
      "--mobile",
      "--slow",
      "--browser=firefox"
    ]);
  });

  it("omits optional flags when no options are provided", () => {
    expect(buildDembrandtArgs("https://example.com")).toEqual([
      "https://example.com",
      "--json-only"
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

  it("ignores brace noise before the final json payload", () => {
    const payload = extractJsonPayload(
      'debug {not-json}\n{"url":"https://example.com/","colors":{"palette":["#111111"]}}\n'
    );

    expect(payload).toEqual({
      url: "https://example.com/",
      colors: {
        palette: ["#111111"]
      }
    });
  });

  it("throws when stdout does not contain a json object", () => {
    expect(() => extractJsonPayload("log line only")).toThrow(
      "dembrandt did not return a JSON payload"
    );
  });

  it("throws when the extracted slice is not valid json", () => {
    expect(() => extractJsonPayload('log line\n{"url": }\n')).toThrow();
  });

  it("runs dembrandt via execa and parses stdout", async () => {
    execaMock.mockResolvedValue({
      stdout: 'debug line\n{"url":"https://example.com/","ok":true}\n'
    });

    await expect(
      runDembrandt("https://example.com", {
        mobile: true
      })
    ).resolves.toEqual({
      url: "https://example.com/",
      ok: true
    });

    expect(execaMock).toHaveBeenCalledWith(
      "dembrandt",
      ["https://example.com", "--json-only", "--mobile"],
      { preferLocal: true }
    );
  });

  it("wraps execa errors with a command-specific message", async () => {
    execaMock.mockRejectedValue(new Error("spawn ENOENT"));

    await expect(runDembrandt("https://example.com")).rejects.toThrow(
      "dembrandt extraction failed: spawn ENOENT"
    );
  });

  it("rethrows non-Error failures unchanged", async () => {
    const failure = { code: "EFAIL" };
    execaMock.mockRejectedValue(failure);

    await expect(runDembrandt("https://example.com")).rejects.toBe(failure);
  });
});
