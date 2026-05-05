export type AuditCategory = "color" | "spacing" | "radius" | "shadow" | "typography";

export interface RawFinding {
  file: string;
  line: number;
  column: number;
  rawValue: string;
  property: string;
  category: AuditCategory;
}

export interface AuditFinding extends RawFinding {
  suggestion: string | null;
  distance: number | null;
  isExactMatch: boolean;
}

export interface AuditSummary {
  total: number;
  matched: number;
  nearMatched: number;
  unmatched: number;
  coveragePct: number;
}

export interface AuditCommandOptions {
  onlyUnmatched?: boolean;
  threshold?: number;
  extensions?: string[];
}
