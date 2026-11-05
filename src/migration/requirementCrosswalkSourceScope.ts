import type { SourceCell } from "./mcr";

/** Explicit source-label review. Adjacent GI, student, upgrade and conference
 * rows are intentionally absent. Merged ONLINE/PDF cells retain their anchors. */
export const attestationSiteScopes = [
  { siteKey: "ama", row: 3, label: "AMA", through: 4 },
  { siteKey: "abe", row: 7, label: "ABE", through: 7 },
  { siteKey: "asce", row: 9, label: "ASCE", through: 9 },
  { siteKey: "avma", row: 38, label: "AVMA LIFE", through: 38 },
  { siteKey: "csea", row: 69, label: "CSEA", through: 69 },
  { siteKey: "isitrust", row: 86, label: "ISITrust", through: 86 },
  { siteKey: "nso", row: 98, label: "NSO", through: 98 },
  { siteKey: "waepa", row: 122, label: "WAEPA", through: 124 },
  { siteKey: "waepa-gi", row: 125, label: "WAEPA-GI", through: 125 },
] as const;

export function attestationSourceScopes(cells: readonly SourceCell[]) {
  const source = new Map(cells.filter(cell => cell.sheet === "Attestation Online and PDF").map(cell => [cell.cell, cell]));
  const scopes = new Map<string, { siteKey: string; mode: "online" | "PDF"; evidence: string[]; basis: string }>();
  for (const entry of attestationSiteScopes) {
    const anchor = `A${entry.row}`;
    if (source.get(anchor)?.value !== entry.label) throw new Error(`Attestation Site label changed: ${anchor}/${entry.siteKey}`);
    for (let row = entry.row; row <= entry.through; row++) {
      // An inserted Site label invalidates the reviewed merged-cell boundary.
      if (row !== entry.row && String(source.get(`A${row}`)?.value ?? "").trim()) throw new Error(`Attestation scope boundary changed: A${row}/${entry.siteKey}`);
      for (const column of ["C", "D", "E", "F"]) {
        const cell = source.get(`${column}${row}`);
        if (!cell || !String(cell.value ?? "").trim()) continue;
        const reference = `Attestation Online and PDF!${cell.cell}`;
        const mode = column === "C" || column === "D" ? "online" : "PDF";
        scopes.set(reference, { siteKey: entry.siteKey, mode,
          evidence: [`Attestation Online and PDF!${anchor}`, "Attestation Online and PDF!C1", "Attestation Online and PDF!E1"],
          basis: `Explicit ${anchor}=${JSON.stringify(entry.label)}; columns C/D describe ONLINE and E/F describe PDF. Reviewed row span ${entry.row}–${entry.through}; no adjacent Site variant inferred.` });
      }
    }
  }
  return scopes;
}
