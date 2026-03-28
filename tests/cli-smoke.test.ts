import { describe, expect, it, vi } from "vitest";

const { extractCommandMock, initCommandMock } = vi.hoisted(() => ({
  extractCommandMock: vi.fn(),
  initCommandMock: vi.fn()
}));

vi.mock("../src/commands/extract.js", () => ({
  extractCommand: extractCommandMock
}));

vi.mock("../src/commands/init.js", () => ({
  initCommand: initCommandMock
}));

import { buildCli } from "../src/cli.js";

describe("cli", () => {
  it("registers init as the only explicit subcommand", () => {
    const cli = buildCli();
    expect(cli.commands.map((command) => command.name())).toEqual(["init"]);
  });

  it("routes the root command into extractCommand", async () => {
    const cli = buildCli();

    await cli.parseAsync(
      [
        "https://example.com",
        "--dark-mode",
        "--mobile",
        "--slow",
        "--browser",
        "firefox",
        "--extract-only"
      ],
      { from: "user" }
    );

    expect(extractCommandMock).toHaveBeenCalledWith("https://example.com", {
      darkMode: true,
      mobile: true,
      slow: true,
      browser: "firefox",
      extractOnly: true
    });
  });

  it("uses chromium as the default browser for extraction", async () => {
    const cli = buildCli();

    await cli.parseAsync(["https://example.com"], { from: "user" });

    expect(extractCommandMock).toHaveBeenCalledWith("https://example.com", {
      darkMode: undefined,
      mobile: undefined,
      slow: undefined,
      browser: "chromium",
      extractOnly: undefined
    });
  });

  it("routes init to initCommand", async () => {
    const cli = buildCli();

    await cli.parseAsync(["init"], { from: "user" });

    expect(initCommandMock).toHaveBeenCalledTimes(1);
  });
});
