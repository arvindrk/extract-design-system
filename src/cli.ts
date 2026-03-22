import { Command } from "commander";
import { pathToFileURL } from "node:url";
import { extractCommand } from "./commands/extract.js";
import { initCommand } from "./commands/init.js";

export function buildCli(): Command {
  const program = new Command();

  program
    .name("extract-design-system")
    .description("Extract design primitives from public websites and generate starter token files.");

  program
    .command("extract")
    .argument("<url>", "Public website URL to extract")
    .option("--dark-mode", "Extract the dark mode variant when available")
    .option("--mobile", "Use a mobile viewport during extraction")
    .option("--slow", "Use slower timeouts for JavaScript-heavy sites")
    .option("--browser <browser>", "Choose dembrandt browser", "chromium")
    .action(async (url, options) => {
      await extractCommand(url, {
        darkMode: options.darkMode,
        mobile: options.mobile,
        slow: options.slow,
        browser: options.browser
      });
    });

  program
    .command("init")
    .description("Generate starter token files from the last extraction")
    .action(async () => {
      await initCommand();
    });

  return program;
}

async function run(): Promise<void> {
  await buildCli().parseAsync(process.argv);
}

const entrypoint = process.argv[1];

if (entrypoint && import.meta.url === pathToFileURL(entrypoint).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
