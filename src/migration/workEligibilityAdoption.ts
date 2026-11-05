import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { mcrSource, type SourceCell } from "./mcr";

/** Reviewed member work requirements. An explicit absence is different from an unknown requirement. */
export const reviewedWorkEligibility = [
  { siteKey: "abe", productKey: "di-ltd-plus", cell: "R44", hours: 30 },
  { siteKey: "abe", productKey: "di-ltd", cell: "R45", hours: 30 },
  { siteKey: "abe", productKey: "di-mtd", cell: "R46", hours: 30 },
  { siteKey: "abe", productKey: "oo-professional", cell: "R48", hours: 30 },
  { siteKey: "asce", productKey: "di-ltd", cell: "R169", hours: 30 },
  { siteKey: "avma", productKey: "di-ltd", cell: "R192", hours: 20 },
  { siteKey: "avma", productKey: "di-ltd-plus", cell: "R193", hours: null },
  { siteKey: "avma", productKey: "di-short-term", cell: "R194", hours: 20 },
  { siteKey: "avma", productKey: "oo-professional", cell: "R196", hours: 20 },
  { siteKey: "avma", productKey: "li-term", cell: "R197", hours: 20 },
  { siteKey: "isitrust", productKey: "di-ltd", cell: "R279", hours: 20 },
  { siteKey: "isitrust", productKey: "oo-professional", cell: "R280", hours: 20 },
  { siteKey: "isitrust", productKey: "di-short-term", cell: "R281", hours: 20 },
  { siteKey: "nso", productKey: "di-ltd", cell: "R321", hours: 20 },
  { siteKey: "waepa", productKey: "di-short-term", cell: "R380", hours: 30 },
] as const;

/** Updates only the explicitly sourced work dimension, preserving age approvals and provisional decisions. */
export function applyWorkEligibilityAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const work = reviewedWorkEligibility.map(spec => {
    const supplied = cells.filter(cell => cell.sheet === "Main" && cell.cell === spec.cell);
    const expected = mcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === spec.cell);
    if (supplied.length !== 1 || !expected || JSON.stringify(supplied[0]) !== JSON.stringify(expected)) throw new Error(`Work eligibility source changed: Main!${spec.cell}`);
    const constraints = db.eligibilityConstraints.filter(row => row.siteKey === spec.siteKey && row.productKey === spec.productKey && row.applicantTypeKey === "member");
    if (constraints.length !== 1 || !db.sourceRequirements.some(row => row.key === `mcr.main.${spec.cell}`)) throw new Error(`Missing unique work eligibility target: ${spec.siteKey}/${spec.productKey}`);
    return { spec, row: constraints[0] };
  });
  // Complete preflight before changing any record.
  for (const { spec, row } of work) {
    const reference = `Main!${spec.cell}`;
    const evidenceKey = `work-eligibility.${spec.siteKey}.${spec.productKey}.member`;
    if (!db.semanticRequirements.some(record => record.key === evidenceKey)) db.semanticRequirements.push({ id: evidenceKey, key: evidenceKey,
      ...libraryMetadata("semanticRequirements", evidenceKey, reference), domain: "reviewed-work-eligibility", subjectTable: "eligibilityConstraints", subjectKey: row.key,
      predicate: "minimumWorkHours", status: "documented", value: { sourceReference: reference, previous: row.minimumWorkHours, adopted: spec.hours,
        disposition: "Only this member work threshold is reconciled. Other instructions in the source cell and other eligibility dimensions remain separate." } });
    row.minimumWorkHours = spec.hours;
    if (!row.sourceReference?.includes(`work eligibility: ${reference}`)) row.sourceReference = `${row.sourceReference ?? "Existing constraints"}; work eligibility: ${reference}`;
    const key = `requirement-target.${evidenceKey}`;
    if (!db.requirementTargets.some(target => target.key === key)) db.requirementTargets.push({ id: key, key,
      ...libraryMetadata("requirementTargets", key, reference), requirementKey: `mcr.main.${spec.cell}`, targetTable: "eligibilityConstraints", targetKey: row.key, targetColumn: "minimumWorkHours" });
  }
}
