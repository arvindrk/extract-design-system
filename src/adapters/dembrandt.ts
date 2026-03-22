import { execa } from "execa";

export interface DembrandtOptions {
  darkMode?: boolean;
  mobile?: boolean;
  slow?: boolean;
  browser?: "chromium" | "firefox";
}

export function extractJsonPayload(output: string): unknown {
  const firstBrace = output.indexOf("{");
  const lastBrace = output.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("dembrandt did not return a JSON payload");
  }

  return JSON.parse(output.slice(firstBrace, lastBrace + 1));
}

export function buildDembrandtArgs(url: string, options: DembrandtOptions = {}): string[] {
  const args = [url, "--json-only"];

  if (options.darkMode) {
    args.push("--dark-mode");
  }

  if (options.mobile) {
    args.push("--mobile");
  }

  if (options.slow) {
    args.push("--slow");
  }

  if (options.browser) {
    args.push(`--browser=${options.browser}`);
  }

  return args;
}

export async function runDembrandt(url: string, options: DembrandtOptions = {}): Promise<unknown> {
  const args = buildDembrandtArgs(url, options);

  try {
    const result = await execa("dembrandt", args, {
      preferLocal: true
    });

    return extractJsonPayload(result.stdout);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`dembrandt extraction failed: ${error.message}`);
    }

    throw error;
  }
}
