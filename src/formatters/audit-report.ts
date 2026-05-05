import type { AuditFinding, AuditSummary } from "../schemas/audit.js";

export function computeSummary(findings: AuditFinding[]): AuditSummary {
  const total = findings.length;
  const matched = findings.filter((f) => f.suggestion !== null && f.isExactMatch).length;
  const nearMatched = findings.filter((f) => f.suggestion !== null && !f.isExactMatch).length;
  const unmatched = findings.filter((f) => f.suggestion === null).length;
  const coveragePct = total === 0 ? 0 : Math.round(((matched + nearMatched) / total) * 10000) / 100;
  return { total, matched, nearMatched, unmatched, coveragePct };
}

export function formatAuditReport(findings: AuditFinding[], summary: AuditSummary): string {
  const byFile = new Map<string, AuditFinding[]>();
  for (const f of findings) {
    const existing = byFile.get(f.file) ?? [];
    existing.push(f);
    byFile.set(f.file, existing);
  }

  const lines: string[] = [];
  for (const [file, fileFindings] of byFile) {
    lines.push(`\n${file}`);
    const sorted = [...fileFindings].sort((a, b) => a.line - b.line);
    for (const f of sorted) {
      const loc = `line ${f.line}`.padEnd(10);
      const val = f.rawValue.padEnd(30);
      const sug = f.suggestion
        ? `→ var(${f.suggestion})${f.isExactMatch ? "" : ` (~${f.distance?.toFixed(0)} distance)`}`
        : "→ no match";
      lines.push(`  ${loc}  ${val}  ${sug}`);
    }
  }

  lines.push(
    `\nSummary: ${summary.total} total | ${summary.matched} exact | ${summary.nearMatched} near | ${summary.unmatched} unmatched | ${summary.coveragePct}% coverage`
  );

  return lines.join("\n");
}

export function formatAuditJson(findings: AuditFinding[], summary: AuditSummary): string {
  return JSON.stringify({ findings, summary }, null, 2);
}
