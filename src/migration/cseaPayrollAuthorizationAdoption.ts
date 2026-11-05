import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isReviewPolicy, type ReviewBlock } from "../domain/reviewPolicy";
import { currentMcrSource } from "./currentMcr";

export const cseaPayrollAuthorizationKey = "source-review.csea.payroll-authorization";
export function applyCseaPayrollAuthorizationAdoption(db: DatabaseSchema) {
  const source = (sheet: string, cell: string) => String(currentMcrSource.cells.find(row => row.sheet === sheet && row.cell === cell)?.value ?? "").trim();
  if (!source("Read & Sign", "B120").startsWith("CA CSEA") || source("Main", "AE246") !== "No need to collect data, payroll deduct") throw new Error("CSEA source payroll scope changed");
  const row = db.configurationValues.find(row => row.key === "csea.review-policy");
  if (!row || !isReviewPolicy(row.value)) throw new Error("Missing CSEA native Review policy");
  const block: ReviewBlock = { key: "california-payroll-authorization", title: "Payroll deduction authorization", paragraphs: [source("Read & Sign", "C120")], fields: [], placement: "before-member-signature", when: { applicant: "member", products: ["di-ltd"], jurisdictions: ["CA"] }, sourceReferences: ["Read & Sign!B120", "Read & Sign!C120", "Main!AE246"] };
  const index = row.value.blocks.findIndex(row => row.key === block.key);
  if (index < 0) row.value.blocks.push(block); else row.value.blocks[index] = block;
  const key = cseaPayrollAuthorizationKey, authority = "Current MCR v78 Read & Sign!B120/C120; Main!AE246";
  const review = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "reviewed-source-instruction", subjectTable: "sites", subjectKey: "csea", predicate: "payroll-deduction-authorization", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", selected: block,
    sourceReferences: block.sourceReferences, interpretation: "Source California CSEA payroll statement appears above the member signature for the source-linked DI product, regardless of health participation. Standalone AD&D has no established payroll source assignment and does not inherit this statement. No additional acknowledgement field is requested by this source.",
    destinations: [{ table: "configurationValues", key: row.key, column: "value.blocks" }],
  } as unknown as Json };
  const reviewIndex = db.semanticRequirements.findIndex(row => row.key === key);
  if (reviewIndex < 0) db.semanticRequirements.push(review); else db.semanticRequirements[reviewIndex] = review;
}
