import {
  normalizedDesignSystemSchema,
  type NormalizedDesignSystem,
} from "../schemas/normalized.js";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as UnknownRecord)
    : undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && Boolean(value.trim());
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isNonEmptyString);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value)) {
      const first = value.find(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      );
      if (first) {
        return first;
      }
    }
  }

  return undefined;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

export function normalizeExtraction(
  raw: unknown,
  sourceUrl: string,
): NormalizedDesignSystem {
  const root = asRecord(raw) ?? {};
  const colors = asRecord(root.colors) ?? {};
  const typography = asRecord(root.typography) ?? {};
  const spacing = asRecord(root.spacing) ?? {};
  const borderRadius =
    asRecord(root.borderRadius) ?? asRecord(root.borders) ?? {};
  const shadows = root.shadows;
  const semanticColors = asRecord(colors.semantic) ?? {};
  const typographyStyles = Array.isArray(typography.styles)
    ? typography.styles
    : [];
  const spacingCommonValues = Array.isArray(spacing.commonValues)
    ? spacing.commonValues
    : [];
  const borderRadiusValues = Array.isArray(borderRadius.values)
    ? borderRadius.values
    : [];
  const shadowValues = Array.isArray(shadows)
    ? shadows
    : asStringArray(asRecord(shadows)?.values);

  const normalized: NormalizedDesignSystem = {
    source: {
      url: firstString(root.url, sourceUrl) ?? sourceUrl,
      extractedAt:
        firstString(root.extractedAt, new Date().toISOString()) ??
        new Date().toISOString(),
      extractor: "dembrandt",
    },
    colors: {
      primary: firstString(
        colors.primary,
        colors.brand,
        colors.main,
        semanticColors.primary,
      ),
      secondary: firstString(colors.secondary, semanticColors.secondary),
      accent: firstString(
        colors.accent,
        colors.highlight,
        semanticColors.accent,
      ),
      background: firstString(
        colors.background,
        colors.surface,
        semanticColors.background,
      ),
      foreground: firstString(
        colors.foreground,
        colors.text,
        semanticColors.foreground,
      ),
      palette: dedupe(
        asStringArray(colors.palette).concat(
          asStringArray(colors.palette).length === 0
            ? Object.values(semanticColors).filter(
                isNonEmptyString,
              )
            : [],
        ),
      ),
      cssVariables: asRecord(colors.cssVariables)
        ? Object.fromEntries(
            Object.entries(colors.cssVariables as UnknownRecord).filter(
              (entry): entry is [string, string] =>
                isNonEmptyString(entry[1]),
            ),
          )
        : {},
    },
    typography: {
      headingFont: firstString(
        typography.headingFont,
        typography.heading,
        typography.headings,
        typographyStyles
          .map((style) => asRecord(style)?.family)
          .filter(isNonEmptyString),
      ),
      bodyFont: firstString(
        typography.bodyFont,
        typography.body,
        typography.fonts,
        typographyStyles
          .map((style) => asRecord(style)?.family)
          .filter(isNonEmptyString),
      ),
      monoFont: firstString(typography.monoFont, typography.mono),
    },
    spacing: {
      scale: dedupe(
        asStringArray(spacing.scale).concat(
          spacingCommonValues
            .map((value) => asRecord(value)?.px)
            .filter(isNonEmptyString),
        ),
      ),
    },
    radius: {
      scale: dedupe(
        asStringArray(borderRadius.radius).concat(
          borderRadiusValues.filter(
            isNonEmptyString,
          ),
        ),
      ),
    },
    shadows: {
      scale: dedupe(
        asStringArray(shadowValues).concat(
          shadowValues
            .map((value) => asRecord(value)?.value)
            .filter(isNonEmptyString),
        ),
      ),
    },
  };

  return normalizedDesignSystemSchema.parse(normalized);
}
