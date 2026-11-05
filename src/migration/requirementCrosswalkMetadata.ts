import type { SourceCell } from "./mcr";

/** Exhaustive metadata inventory. Source destinations are references, not
 * instructions to visit services or import their legacy behavior. */
export function reviewSourceMetadata(cells: readonly SourceCell[], qdDocumentDeferred: boolean) {
  const knownComments = new Set(["Main!Q53", "New UX Multi-page Requirements!AA30", "New UX Multi-page Requirements!AA31"]);
  const records = cells.flatMap(cell => (["formula", "comment", "hyperlink"] as const).flatMap(kind => {
    const value = cell[kind]; if (!value) return [];
    const reference = `${cell.sheet}!${cell.cell}`;
    let disposition = "metadata-review-pending", reason = "New metadata requires source/scope review.";
    if (kind === "comment" && knownComments.has(reference)) {
      disposition = "reviewed-source-reference";
      reason = reference === "Main!Q53" ? "ACEP 10-Year Term child minimum-age discussion; Main B53/D53 establish an outside-scope Site/product. It does not amend current Site child eligibility." : "Historical UX income-removal discussion; the current prototype owns shared page/field layout. Source comments remain preserved without adopting a former screen design.";
    } else if (kind === "formula" && reference === "New UX Multi-page Requirements!D30" && value === "=+E30") {
      disposition = "reviewed-source-reference"; reason = "Historical UX cross-cell reference, outside current layout authority. No runtime computation is established by this formula.";
    } else if (kind === "hyperlink" && cell.sheet === "URLs") {
      disposition = "source-link-reference"; reason = "Legacy environment or parameter example. The URL value and hyperlink are preserved separately; exact current Site/parameter applicability is reviewed with URL requirements. No network verification or legacy parameter activation is inferred.";
    } else if (kind === "hyperlink" && cell.sheet === "Main" && ["L9", "L10", "L14", "L32"].includes(cell.cell)) {
      disposition = "reviewed-source-reference"; reason = "Internal rider-sheet link on an outside-scope Main row. Current rider assignments require their own explicit source/decision mapping.";
    } else if (kind === "hyperlink" && reference === "Associations!F346") {
      disposition = "reviewed-branding-reference"; reason = "WAEPA external logo URL, accounted as branding reference separately from application rules. No image fetch/replacement is requested.";
    } else if (kind === "hyperlink" && reference === "Associations!G360") {
      disposition = "reviewed-source-reference"; reason = "Legacy local Rutgers logo path; Rutgers is outside current Sites.";
    } else if (kind === "hyperlink" && reference === "Health Questions!B4" && String(cell.value).includes("Jet Issue State Variations Updated Sep,2018.docx")) {
      disposition = qdDocumentDeferred ? "deferred-by-user" : "missing-source-artifact";
      reason = "Linked 2018 QD state-variation document is unavailable. User explicitly retains current state behavior and defers missing source content as a flagged nonblocking requirement; do not guess its instructions.";
    }
    return [{ reference, kind, value, disposition, reason }];
  }));
  return { records, counts: { formulas: records.filter(row => row.kind === "formula").length, comments: records.filter(row => row.kind === "comment").length, hyperlinks: records.filter(row => row.kind === "hyperlink").length },
    pendingReferences: records.filter(row => ["metadata-review-pending", "missing-source-artifact"].includes(row.disposition)).map(row => row.reference),
    boundary: "This review resolves metadata identity/scope only. Legacy URL parameter behavior and current execution ownership remain separate requirements; reference links do not activate behavior." };
}
