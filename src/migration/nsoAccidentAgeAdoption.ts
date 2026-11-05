import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const nsoAccidentAgeReviewKey = "source-review.nso.accident-adult-ages";
export const nsoAccidentChildAgeReviewKey = "source-review.nso.accident-child-ages";
export function applyNsoAccidentAgeAdoption(db: DatabaseSchema) {
  const authority = "Current v78 Main!O320/P320: member and spouse NSO AD&D eligibility ages 17–69 inclusive";
  const specs = [["member", "O320"], ["spouse", "P320"]] as const;
  const targets = specs.map(([applicant, cell]) => {
    const source = String(currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === cell)?.value ?? "");
    if (!/^17-\s*through 69$/.test(source.trim())) throw new Error(`NSO AD&D age source changed: ${cell}`);
    const rows = db.eligibilityConstraints.filter(row => row.siteKey === "nso" && row.productKey === "li-add" && row.applicantTypeKey === applicant);
    if (rows.length !== 1) throw new Error(`Missing unique NSO AD&D age target: ${applicant}`);
    return { row: rows[0], cell };
  });
  for (const { row, cell } of targets) {
    row.minimumAgeYears = 17; row.maximumAgeYears = 69;
    if (!row.sourceReference?.includes(`source adoption: Main!${cell}`)) row.sourceReference = `${row.sourceReference ?? "Existing constraint"}; source adoption: Main!${cell}`;
  }
  const key = nsoAccidentAgeReviewKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "reviewed-source-instruction", subjectTable: "sites", subjectKey: "nso", predicate: "accident-adult-eligibility-ages", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", scope: ["nso"], productKeys: ["li-add"], sourceReferences: ["Main!O320", "Main!P320"],
    selected: specs.map(([applicantKey]) => ({ applicantKey, minimumAgeYears: 17, maximumAgeYears: 69 })),
    owners: targets.map(({ row }) => ({ table: "eligibilityConstraints", key: row.key, reviewedValue: structuredClone(row) })),
    interpretation: "Correct the captured NSO AD&D member/spouse age bounds to the current source. Preserve child constraints, dependency/family rules, amounts, underwriting, payment and other products. Existing explicit ASCE age approvals remain separate and unchanged.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}

/** Separate child source review; family benefit percentages remain provisional. */
export function applyNsoAccidentChildAgeAdoption(db: DatabaseSchema) {
  const source = String(currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === "Q320")?.value ?? "");
  if (source.trim() !== "through age 18 (through age 25 full time student)") throw new Error("NSO AD&D child age source changed: Q320");
  const targets = db.eligibilityConstraints.filter(row => row.siteKey === "nso" && row.productKey === "li-add" && row.applicantTypeKey === "child");
  if (targets.length !== 1) throw new Error("Missing unique NSO AD&D child age target");
  const row = targets[0]; row.maximumAgeYears = 18; row.studentMaximumAgeYears = 25;
  if (!row.sourceReference?.includes("source adoption: Main!Q320")) row.sourceReference = `${row.sourceReference ?? "Existing constraint"}; source adoption: Main!Q320`;
  const key = nsoAccidentChildAgeReviewKey, authority = "Current v78 Main!Q320: NSO AD&D children through 18, through 25 for full-time students";
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "reviewed-source-instruction", subjectTable: "sites", subjectKey: "nso", predicate: "accident-child-eligibility-ages", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", scope: ["nso"], productKeys: ["li-add"], sourceReferences: ["Main!Q320"],
    selected: { maximumAgeYears: 18, studentMaximumAgeYears: 25 },
    owners: [{ table: "eligibilityConstraints", key: row.key, reviewedValue: structuredClone(row) }],
    interpretation: "Use the shared full-time-student child field and canonical student extension. Ages 19–25 require Yes; older children are ineligible. Preserve other child constraints and the separately provisional family benefit percentages. No unmarried requirement is inferred from Main!T320=No.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
