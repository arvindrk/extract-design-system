import type { NormalizedDesignSystem } from "../schemas/normalized.js";

function pushLine(lines: string[], name: string, value: string | undefined): void {
  if (value) {
    lines.push(`  ${name}: ${value};`);
  }
}

export function generateCssVars(normalized: NormalizedDesignSystem): string {
  const lines = [":root {"];

  pushLine(lines, "--color-primary", normalized.colors.primary);
  pushLine(lines, "--color-secondary", normalized.colors.secondary);
  pushLine(lines, "--color-accent", normalized.colors.accent);
  pushLine(lines, "--color-background", normalized.colors.background);
  pushLine(lines, "--color-foreground", normalized.colors.foreground);
  pushLine(lines, "--font-heading", normalized.typography.headingFont);
  pushLine(lines, "--font-body", normalized.typography.bodyFont);
  pushLine(lines, "--font-mono", normalized.typography.monoFont);

  normalized.spacing.scale.forEach((value, index) => {
    pushLine(lines, `--space-${index + 1}`, value);
  });

  normalized.radius.scale.forEach((value, index) => {
    pushLine(lines, `--radius-${index + 1}`, value);
  });

  normalized.shadows.scale.forEach((value, index) => {
    pushLine(lines, `--shadow-${index + 1}`, value);
  });

  Object.entries(normalized.colors.cssVariables).forEach(([key, value]) => {
    pushLine(lines, key.startsWith("--") ? key : `--${key}`, value);
  });

  lines.push("}");

  return `${lines.join("\n")}\n`;
}
