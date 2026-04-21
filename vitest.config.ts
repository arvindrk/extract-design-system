import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/mcp.ts"],
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 90
      }
    }
  }
});
