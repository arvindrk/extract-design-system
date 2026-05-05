import { describe, expect, it } from "vitest";
import { buildCli } from "../src/cli.js";

describe("CLI audit subcommand", () => {
  it("is registered with the correct name", () => {
    const program = buildCli();
    const auditCmd = program.commands.find((c) => c.name() === "audit");
    expect(auditCmd).toBeDefined();
  });

  it("has --json option", () => {
    const program = buildCli();
    const auditCmd = program.commands.find((c) => c.name() === "audit")!;
    const jsonOpt = auditCmd.options.find((o) => o.long === "--json");
    expect(jsonOpt).toBeDefined();
  });

  it("has --only-unmatched option", () => {
    const program = buildCli();
    const auditCmd = program.commands.find((c) => c.name() === "audit")!;
    const opt = auditCmd.options.find((o) => o.long === "--only-unmatched");
    expect(opt).toBeDefined();
  });

  it("has --threshold option", () => {
    const program = buildCli();
    const auditCmd = program.commands.find((c) => c.name() === "audit")!;
    const opt = auditCmd.options.find((o) => o.long === "--threshold");
    expect(opt).toBeDefined();
  });

  it("has --fail option", () => {
    const program = buildCli();
    const auditCmd = program.commands.find((c) => c.name() === "audit")!;
    const opt = auditCmd.options.find((o) => o.long === "--fail");
    expect(opt).toBeDefined();
  });
});
