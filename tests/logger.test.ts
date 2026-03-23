import { afterEach, describe, expect, it, vi } from "vitest";
import { logError, logInfo, logWarn } from "../src/utils/logger.js";

describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes info messages to console.log", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    logInfo("hello");

    expect(logSpy).toHaveBeenCalledWith("hello");
  });

  it("writes warnings to console.warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logWarn("careful");

    expect(warnSpy).toHaveBeenCalledWith("careful");
  });

  it("writes errors to console.error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logError("boom");

    expect(errorSpy).toHaveBeenCalledWith("boom");
  });
});
