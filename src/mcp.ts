#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { extractCommand } from "./commands/extract.js";
import { initCommand } from "./commands/init.js";
import { readJson } from "./utils/files.js";
import { getOutputPaths } from "./utils/paths.js";
import type { NormalizedDesignSystem } from "./schemas/normalized.js";

const server = new McpServer({
  name: "extract-design-system",
  version: "0.1.9",
});

server.tool(
  "extract_design_system",
  "Extract design primitives (colors, typography, spacing, border-radius, shadows) from a public website URL. Runs a headless browser extraction, normalizes the output, and writes design-system/tokens.json and design-system/tokens.css into the current working directory. Returns the full normalized token set on success.",
  {
    url: z.string().url().describe("Public website URL to extract design tokens from"),
    darkMode: z.boolean().optional().describe("Extract dark mode variant when available"),
    mobile: z.boolean().optional().describe("Use mobile viewport during extraction"),
    slow: z.boolean().optional().describe("Use slower timeouts for JavaScript-heavy sites"),
    extractOnly: z.boolean().optional().describe("Only save raw and normalized JSON to .extract-design-system/; skip writing design-system/ token files"),
  },
  async ({ url, darkMode, mobile, slow, extractOnly }) => {
    try {
      await extractCommand(url, { darkMode, mobile, slow, extractOnly });
      const paths = getOutputPaths(process.cwd());
      const normalized = await readJson<NormalizedDesignSystem>(paths.normalizedJson);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true, normalized }, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
      };
    }
  }
);

server.tool(
  "init_design_system",
  "Regenerate design-system/tokens.json and design-system/tokens.css from the last successful extraction (.extract-design-system/normalized.json) without re-fetching the website. Use this when the normalizer or CSS generator has changed and you want to re-emit token files.",
  {},
  async () => {
    try {
      await initCommand(process.cwd());
      const paths = getOutputPaths(process.cwd());
      const tokens = await readJson<NormalizedDesignSystem>(paths.tokensJson);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true, tokens }, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
      };
    }
  }
);

server.tool(
  "get_tokens",
  "Read the current design-system/tokens.json from the project without re-extracting. Returns the full normalized token set including colors palette, typography fonts, spacing scale, border-radius scale, and shadows scale. Useful for inspecting what tokens are already available before deciding whether to re-extract.",
  {},
  async () => {
    try {
      const paths = getOutputPaths(process.cwd());
      const tokens = await readJson<NormalizedDesignSystem>(paths.tokensJson);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(tokens, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `No tokens found. Run extract_design_system first. Error: ${error instanceof Error ? error.message : String(error)}` }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
