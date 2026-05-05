import type { NormalizedDesignSystem } from "../schemas/normalized.js";

export function matchSpacing(value: string, tokens: NormalizedDesignSystem): string | null {
  const idx = tokens.spacing.scale.indexOf(value);
  return idx !== -1 ? `--space-${idx + 1}` : null;
}

export function matchRadius(value: string, tokens: NormalizedDesignSystem): string | null {
  const idx = tokens.radius.scale.indexOf(value);
  return idx !== -1 ? `--radius-${idx + 1}` : null;
}

export function matchShadow(value: string, tokens: NormalizedDesignSystem): string | null {
  const idx = tokens.shadows.scale.indexOf(value);
  return idx !== -1 ? `--shadow-${idx + 1}` : null;
}

export function matchFont(value: string, tokens: NormalizedDesignSystem): string | null {
  const { headingFont, bodyFont, monoFont } = tokens.typography;
  if (headingFont && value.includes(headingFont)) return "--font-heading";
  if (bodyFont && value.includes(bodyFont)) return "--font-body";
  if (monoFont && value.includes(monoFont)) return "--font-mono";
  return null;
}
