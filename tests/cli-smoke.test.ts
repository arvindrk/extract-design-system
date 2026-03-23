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
  it("registers extract and init commands", () => {
    const cli = buildCli();
    expect(cli.commands.map((command) => command.name())).toEqual(["extract", "init"]);
  });

  it("wires extract options into extractCommand", async () => {
    const cli = buildCli();

    await cli.parseAsync(
      [
        "extract",
        "https://example.com",
        "--dark-mode",
        "--mobile",
        "--slow",
        "--browser",
        "firefox"
      ],
      { from: "user" }
    );

    expect(extractCommandMock).toHaveBeenCalledWith("https://example.com", {
      darkMode: true,
      mobile: true,
      slow: true,
      browser: "firefox"
    });
  });

  it("uses chromium as the default browser for extract", async () => {
    const cli = buildCli();

    await cli.parseAsync(["extract", "https://example.com"], { from: "user" });

    expect(extractCommandMock).toHaveBeenCalledWith("https://example.com", {
      darkMode: undefined,
      mobile: undefined,
      slow: undefined,
      browser: "chromium"
    });
  });

  it("routes init to initCommand", async () => {
    const cli = buildCli();

    await cli.parseAsync(["init"], { from: "user" });

    expect(initCommandMock).toHaveBeenCalledTimes(1);
  });
});
