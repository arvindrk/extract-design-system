import type { NormalizedDesignSystem } from "../schemas/normalized.js";

export interface ColorMatch {
  token: string;
  distance: number;
  isExact: boolean;
}

export function normalizeHex(hex: string): string {
  const lower = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(lower)) {
    return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
  }
  if (/^#[0-9a-f]{4}$/.test(lower)) {
    return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
  }
  if (/^#[0-9a-f]{8}$/.test(lower)) {
    return lower.slice(0, 7);
  }
  return lower;
}

export function rgbStringToHex(value: string): string | null {
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return null;
  return (
    "#" +
    [Number(match[1]), Number(match[2]), Number(match[3])]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

export function rgbDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

export function nearestPaletteColor(
  rawColor: string,
  tokens: NormalizedDesignSystem,
  threshold: number
): ColorMatch | null {
  let hex: string;
  if (rawColor.startsWith("#")) {
    hex = normalizeHex(rawColor);
  } else {
    const converted = rgbStringToHex(rawColor);
    if (!converted) return null;
    hex = converted;
  }

  const candidates: Array<[string, string]> = [];
  const { colors } = tokens;

  if (colors.primary) candidates.push(["--color-primary", normalizeHex(colors.primary)]);
  if (colors.secondary) candidates.push(["--color-secondary", normalizeHex(colors.secondary)]);
  if (colors.accent) candidates.push(["--color-accent", normalizeHex(colors.accent)]);
  if (colors.background) candidates.push(["--color-background", normalizeHex(colors.background)]);
  if (colors.foreground) candidates.push(["--color-foreground", normalizeHex(colors.foreground)]);
  colors.palette.forEach((c, i) => candidates.push([`--palette-${i + 1}`, normalizeHex(c)]));
  Object.entries(colors.cssVariables).forEach(([k, v]) => {
    candidates.push([k.startsWith("--") ? k : `--${k}`, normalizeHex(v)]);
  });

  let best: ColorMatch | null = null;
  for (const [token, candidateHex] of candidates) {
    const dist = rgbDistance(hex, candidateHex);
    if (dist <= threshold && (best === null || dist < best.distance)) {
      best = { token, distance: dist, isExact: dist === 0 };
    }
  }

  return best;
}
