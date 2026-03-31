import { execa } from "execa";

export interface DembrandtOptions {
  darkMode?: boolean;
  mobile?: boolean;
  slow?: boolean;
  browser?: "chromium" | "firefox";
}

function collectJsonObjectCandidates(output: string): string[] {
  const candidates: string[] = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let index = 0; index < output.length; index += 1) {
    const character = output[index];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === "\"") {
        inString = false;
      }

      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }

    if (character === "{") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
      continue;
    }

    if (character === "}" && depth > 0) {
      depth -= 1;

      if (depth === 0 && start !== -1) {
        candidates.push(output.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return candidates;
}

export function extractJsonPayload(output: string): unknown {
  const candidates = collectJsonObjectCandidates(output);

  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(candidates[index]);
    } catch {
      continue;
    }
  }

  throw new Error("dembrandt did not return a JSON payload");
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
