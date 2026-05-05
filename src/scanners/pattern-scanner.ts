import type { RawFinding, AuditCategory } from "../schemas/audit.js";

const HEX_RE = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const RGB_RE = /\brgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
const PIXEL_RE = /(\d+(?:\.\d+)?(?:px|rem|em))/g;

const CSS_SPACING_RE = /\b(?:margin|padding|gap|top|right|bottom|left|row-gap|column-gap)\s*:\s*([^;{}\n]+)/i;
const CSS_RADIUS_RE = /\bborder-radius\s*:\s*([^;{}\n]+)/i;
const CSS_SHADOW_RE = /\bbox-shadow\s*:\s*([^;{}\n]+)/i;
const CSS_FONT_RE = /\bfont-family\s*:\s*([^;{}\n]+)/i;

const JS_SPACING_RE = /\b(?:margin|padding|gap|top|right|bottom|left|rowGap|columnGap)[A-Za-z]*\s*:\s*['"`]([^'"`]+)['"`]/i;
const JS_RADIUS_RE = /\bborderRadius(?:[A-Z][a-z]*)?\s*:\s*['"`]([^'"`]+)['"`]/i;
const JS_SHADOW_RE = /\bboxShadow\s*:\s*['"`]([^'"`]+)['"`]/i;
const JS_FONT_RE = /\bfontFamily\s*:\s*['"`]([^'"`]+)['"`]/i;

function hasVarOnly(value: string): boolean {
  return /^var\(--[^)]+\)\s*$/.test(value.trim());
}

function pixelValues(valueStr: string): string[] {
  const cleaned = valueStr.replace(/var\(--[^)]+\)/g, "");
  return [...cleaned.matchAll(PIXEL_RE)].map((m) => m[1]);
}

function addColorFindings(line: string, lineNumber: number, file: string, findings: RawFinding[]): void {
  if (line.includes("var(--")) return;

  for (const m of line.matchAll(HEX_RE)) {
    findings.push({ file, line: lineNumber, column: m.index! + 1, rawValue: m[0], property: "color", category: "color" });
  }

  for (const m of line.matchAll(RGB_RE)) {
    findings.push({ file, line: lineNumber, column: m.index! + 1, rawValue: m[0], property: "color", category: "color" });
  }
}

function addCategoryFinding(
  match: RegExpMatchArray,
  property: string,
  category: AuditCategory,
  lineNumber: number,
  file: string,
  findings: RawFinding[]
): void {
  const rawValue = match[1]?.trim();
  if (!rawValue || hasVarOnly(rawValue)) return;

  if (category === "spacing" || category === "radius") {
    for (const pv of pixelValues(rawValue)) {
      findings.push({ file, line: lineNumber, column: match.index! + 1, rawValue: pv, property, category });
    }
  } else {
    findings.push({ file, line: lineNumber, column: match.index! + 1, rawValue, property, category });
  }
}

export function scanContent(content: string, file: string): RawFinding[] {
  const findings: RawFinding[] = [];
  const lines = content.split("\n");

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1;

    addColorFindings(line, lineNumber, file, findings);

    const cssSpacing = line.match(CSS_SPACING_RE);
    if (cssSpacing) addCategoryFinding(cssSpacing, cssSpacing[0].split(":")[0].trim(), "spacing", lineNumber, file, findings);

    const cssRadius = line.match(CSS_RADIUS_RE);
    if (cssRadius) addCategoryFinding(cssRadius, "border-radius", "radius", lineNumber, file, findings);

    const cssShadow = line.match(CSS_SHADOW_RE);
    if (cssShadow) addCategoryFinding(cssShadow, "box-shadow", "shadow", lineNumber, file, findings);

    const cssFont = line.match(CSS_FONT_RE);
    if (cssFont) addCategoryFinding(cssFont, "font-family", "typography", lineNumber, file, findings);

    const jsSpacing = line.match(JS_SPACING_RE);
    if (jsSpacing) addCategoryFinding(jsSpacing, "margin/padding", "spacing", lineNumber, file, findings);

    const jsRadius = line.match(JS_RADIUS_RE);
    if (jsRadius) addCategoryFinding(jsRadius, "borderRadius", "radius", lineNumber, file, findings);

    const jsShadow = line.match(JS_SHADOW_RE);
    if (jsShadow) addCategoryFinding(jsShadow, "boxShadow", "shadow", lineNumber, file, findings);

    const jsFont = line.match(JS_FONT_RE);
    if (jsFont) addCategoryFinding(jsFont, "fontFamily", "typography", lineNumber, file, findings);
  });

  return findings;
}
