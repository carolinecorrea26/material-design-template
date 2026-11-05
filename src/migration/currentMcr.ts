import { createHash } from "node:crypto";
import raw from "./sources/mcr-v78.json";
import { mcrSource as historicalMcrSource, type SourceCell } from "./mcr";
import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMigrationScope } from "./activeSiteScope";

export const currentMcrSource = raw as unknown as { workbook: string; sha256: string; authority: string;
  sheets: Array<{ name: string; cells: number; mergedRanges: string[]; images: number }>; cells: SourceCell[]; assets: Array<{ path: string; sha256: string }> };
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const evidence = (cell: SourceCell | undefined) => cell ? JSON.stringify([cell.value, cell.formula, cell.comment, cell.hyperlink]) : null;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Review overlay only. Compiled policies and historical source requirements
 * stay intact; current changed evidence receives no inherited adoption status. */
export function currentMcrReviewData(db: DatabaseSchema) {
  if (currentMcrSource.sha256 !== activeSiteMigrationScope.sources.currentMcr.sha256) throw new Error("Current MCR source contract changed");
  const previous = new Map(historicalMcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const oldRequirements = new Map(db.sourceRequirements.map(row => [row.key, row]));
  const sourceChanges: Array<{ reference: string; previousValue: unknown; currentValue: unknown; kind: string }> = [];
  const sourceRequirements = currentMcrSource.cells.map(cell => {
    const reference = `${cell.sheet}!${cell.cell}`, key = `mcr.${slug(cell.sheet)}.${cell.cell}`;
    const before = previous.get(reference);
    const unchanged = evidence(before) === evidence(cell);
    if (!unchanged) sourceChanges.push({ reference, previousValue: before?.value ?? null, currentValue: cell.value,
      kind: JSON.stringify(before?.value) === JSON.stringify(cell.value) ? "metadata-changed" : "content-changed" });
    previous.delete(reference);
    const old = oldRequirements.get(key);
    return { ...(old ?? { id: key, key, sheetKey: slug(cell.sheet), cell: cell.cell }), ...libraryMetadata("sourceRequirements", key, `${currentMcrSource.workbook}#${reference}`),
      value: cell.value, formula: cell.formula, comment: cell.comment, hyperlink: cell.hyperlink,
      classification: unchanged && old ? old.classification : "UNMAPPED_SEMANTIC",
      reason: unchanged && old ? `Same cell evidence as historical compiler baseline. ${old.reason}` : "Latest workbook evidence changed or is new; interpretation/adoption requires review.",
      promotionState: unchanged && old ? old.promotionState : "SOURCE_ONLY" as const,
      promotionReason: unchanged && old ? old.promotionReason : "New or changed current evidence does not inherit historical execution adoption.",
      activeSiteKeys: unchanged && old ? old.activeSiteKeys : [], checklistNotes: null,
    };
  });
  for (const sheet of currentMcrSource.sheets.filter(sheet => sheet.images)) {
    const key = `mcr.${slug(sheet.name)}.embedded-images`;
    sourceRequirements.push({ id: key, key, ...libraryMetadata("sourceRequirements", key, `${currentMcrSource.workbook}#${sheet.name}`), sheetKey: slug(sheet.name),
      cell: "embedded-images", value: sheet.images, formula: null, comment: null, hyperlink: null, classification: "IMAGE_REVIEW_REQUIRED",
      reason: "Current workbook drawing content requires visual/source review.", promotionState: "SOURCE_ONLY", promotionReason: "Current embedded evidence; no adoption inferred.", activeSiteKeys: [], checklistNotes: null });
  }
  for (const [reference, before] of previous) sourceChanges.push({ reference, previousValue: before.value, currentValue: null, kind: "removed" });
  const sourceSheets = db.sourceSheets.map(sheet => {
    const latest = currentMcrSource.sheets.find(current => slug(current.name) === sheet.key);
    if (!latest) throw new Error(`Current MCR sheet missing: ${sheet.name}`);
    return { ...sheet, cellCount: latest.cells, mergedRanges: latest.mergedRanges, imageCount: latest.images };
  });
  return { data: { ...db, sourceRequirements, sourceSheets }, sourceChanges,
    historicalSource: { workbook: historicalMcrSource.workbook, sha256: historicalMcrSource.sha256, sourceRequirementsHash: hash(db.sourceRequirements) } };
}
