import { describe, expect, it } from "vitest";
import { buildCli } from "../src/cli.js";

describe("cli", () => {
  it("registers extract and init commands", () => {
    const cli = buildCli();
    expect(cli.commands.map((command) => command.name())).toEqual(["extract", "init"]);
  });
});
