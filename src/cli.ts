#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { Command } from "commander";
import { fileURLToPath } from "node:url";
import { extractCommand } from "./commands/extract.js";
import { initCommand } from "./commands/init.js";

export function buildCli(): Command {
  const program = new Command();

  program
    .name("extract-design-system")
    .description("Extract design primitives from public websites and generate starter token files.");

  program
    .argument("[url]", "Public website URL to extract")
    .option("--dark-mode", "Extract the dark mode variant when available")
    .option("--mobile", "Use a mobile viewport during extraction")
    .option("--slow", "Use slower timeouts for JavaScript-heavy sites")
    .option("--browser <browser>", "Choose dembrandt browser", "chromium")
    .option("--extract-only", "Only save raw and normalized extraction output")
    .action(async (url, options) => {
      if (!url) {
        program.outputHelp();
        return;
      }

      await extractCommand(url, {
        darkMode: options.darkMode,
        mobile: options.mobile,
        slow: options.slow,
        browser: options.browser,
        extractOnly: options.extractOnly
      });
    });

  program
    .command("init")
    .description("Regenerate starter token files from the last normalized extraction")
    .action(async () => {
      await initCommand();
    });

  return program;
}

async function run(): Promise<void> {
  await buildCli().parseAsync(process.argv);
}

const entrypoint = process.argv[1];
const cliFilePath = fileURLToPath(import.meta.url);

function wasInvokedDirectly(): boolean {
  if (!entrypoint) {
    return false;
  }

  try {
    return realpathSync(entrypoint) === realpathSync(cliFilePath);
  } catch {
    return false;
  }
}

if (wasInvokedDirectly()) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
