import { afterEach, describe, expect, it, vi } from "vitest";

const originalArgv = [...process.argv];
const originalExitCode = process.exitCode;

async function importCliWithMocks(options?: {
  argv?: string[];
  realpathSyncImpl?: (path: string) => string;
  parseAsyncImpl?: (argv: string[]) => Promise<unknown>;
}) {
  const parseAsyncMock = vi.fn(
    options?.parseAsyncImpl ?? (async () => undefined)
  );
  const realpathSyncMock = vi.fn(
    options?.realpathSyncImpl ?? ((value: string) => value)
  );

  vi.resetModules();
  process.argv = options?.argv ?? ["node", "/fake-cli.js"];

  vi.doMock("node:fs", () => ({
    realpathSync: realpathSyncMock
  }));

  vi.doMock("commander", () => ({
    Command: class {
      name() {
        return this;
      }

      description() {
        return this;
      }

      command() {
        return this;
      }

      argument() {
        return this;
      }

      option() {
        return this;
      }

      action() {
        return this;
      }

      parseAsync(argv: string[]) {
        return parseAsyncMock(argv);
      }
    }
  }));

  vi.doMock("../src/commands/extract.js", () => ({
    extractCommand: vi.fn()
  }));

  vi.doMock("../src/commands/init.js", () => ({
    initCommand: vi.fn()
  }));

  await import("../src/cli.js");
  await Promise.resolve();

  return {
    parseAsyncMock,
    realpathSyncMock
  };
}

describe("cli entrypoint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.argv = [...originalArgv];
    process.exitCode = originalExitCode;
  });

  it("does not run when there is no entrypoint", async () => {
    const { parseAsyncMock } = await importCliWithMocks({
      argv: ["node"]
    });

    expect(parseAsyncMock).not.toHaveBeenCalled();
  });

  it("does not run when resolving the entrypoint fails", async () => {
    const { parseAsyncMock } = await importCliWithMocks({
      realpathSyncImpl: () => {
        throw new Error("missing path");
      }
    });

    expect(parseAsyncMock).not.toHaveBeenCalled();
  });

  it("runs parseAsync when invoked directly", async () => {
    const { parseAsyncMock } = await importCliWithMocks({
      argv: ["node", "/direct-cli.js", "init"],
      realpathSyncImpl: () => "/same-path"
    });

    expect(parseAsyncMock).toHaveBeenCalledWith(["node", "/direct-cli.js", "init"]);
  });

  it("logs Error messages and sets a failing exit code", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await importCliWithMocks({
      realpathSyncImpl: () => "/same-path",
      parseAsyncImpl: async () => {
        throw new Error("boom");
      }
    });

    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("boom");
    });
    expect(process.exitCode).toBe(1);
  });

  it("logs non-Error failures as-is", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await importCliWithMocks({
      realpathSyncImpl: () => "/same-path",
      parseAsyncImpl: async () => {
        throw "boom";
      }
    });

    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith("boom");
    });
    expect(process.exitCode).toBe(1);
  });
});
