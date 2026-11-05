import type { SourceCell } from "./mcr";

/** Source scope only. These labels do not approve vendor behavior, decision
 * copy, payment order or the source's production claims in the mock prototype. */
export function decisionWordingSourceScopes(cells: readonly SourceCell[], businessSites: readonly string[]) {
  const sheet = "Standard Decision Wording ";
  const source = new Map(cells.filter(cell => cell.sheet === sheet).map(cell => [cell.cell, String(cell.value).trim()]));
  for (const [cell, label] of [["A1", "Standard Decision Wording Verification"], ["A6", "AAFP"], ["A11", "AMA QD Decision Wording Verification"], ["A18", "NYSBA/NYSSCPA"]]) {
    if (source.get(cell) !== label) throw new Error(`Decision wording source boundary changed: ${cell}`);
  }
  const scopes = new Map<string, { siteKeys: string[]; modes: string[]; evidence: string[]; basis: string }>();
  const add = (rows: number[], sites: readonly string[], evidence: string[], basis: string) => {
    for (const row of rows) for (const column of ["A", "B"]) if (source.has(`${column}${row}`)) scopes.set(`${sheet}!${column}${row}`, {
      siteKeys: [...sites], modes: ["application", "decision"], evidence: evidence.map(cell => `${sheet}!${cell}`),
      basis: `${basis} Product/applicant, QD outcome, vendor, amount and payment-flow conditions remain per-clause review work. No live decision behavior is inferred from this scope.`,
    });
  };
  add([2, 3, 4, 5], businessSites.filter(site => site !== "ama"), ["A1", "A6", "A11"], "The common decision matrix precedes the separate AAFP and AMA sections. Current AMA uses its dedicated section; AAFP remains outside scope.");
  add([12, 13, 14, 15, 16, 17], ["ama"], ["A11", "A18"], "Dedicated AMA section starts at A11 and ends before NYSBA/NYSSCPA at A18. Row 17 is the mixed non-QD-product instruction within that bounded section.");
  return scopes;
}
