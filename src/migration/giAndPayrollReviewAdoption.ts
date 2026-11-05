import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isReviewPolicy, type ReviewBlock } from "../domain/reviewPolicy";
import { currentMcrSource } from "./currentMcr";
export const giAndPayrollReviewDecisionKey = "business-decision.rules-review.gi-certification-and-csea-payroll";
export function applyGiAndPayrollReviewAdoption(db: DatabaseSchema) {
  const authority = "User decision October 21, 2026; Read & Sign!B24:C24/B122:C122: WAEPA GI certification and current CSEA DI payroll authorization";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)?.value ?? "").trim();
  if (source("B24") !== "WAEPAGI" || !source("B122").startsWith("CSEA single page/ CSEACAP")) throw new Error("GI/payroll source scope changed");
  const copy = source("C24").replace(/^Add as a blue box message above the Read and Sign section\s*/, "");
  const selected = [
    { siteKey: "waepa-gi", key: "waepa-gi.review-policy", block: { key: "guaranteed-issue-certification", title: "Guaranteed issue certification", paragraphs: [copy], fields: [], placement: "before-review", appearance: "info", when: { applicant: "member", products: ["li-group-term"] }, sourceReferences: ["Read & Sign!B24", "Read & Sign!C24"] } as ReviewBlock },
    { siteKey: "csea", key: "csea.review-policy", block: { key: "csea-disability-payroll-authorization", title: "Payroll deduction authorization", paragraphs: [source("C122")], fields: [], placement: "after-electronic-consent", when: { applicant: "member", products: ["di-ltd"] }, sourceReferences: ["Read & Sign!B122", "Read & Sign!C122"] } as ReviewBlock },
  ];
  for (const selectedBlock of selected) {
    const row = db.configurationValues.find(row => row.key === selectedBlock.key); if (!row || !isReviewPolicy(row.value)) throw new Error(`Missing Review policy ${selectedBlock.key}`);
    const index = row.value.blocks.findIndex(block => block.key === selectedBlock.block.key); if (index < 0) row.value.blocks.push(structuredClone(selectedBlock.block)); else row.value.blocks[index] = structuredClone(selectedBlock.block);
  }
  const key = giAndPayrollReviewDecisionKey, row = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "review", predicate: "gi-certification-and-csea-payroll", status: "documented", value: {
    authority, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved-new-template-interpretation", selected,
    sourceReferences: selected.flatMap(row => row.block.sourceReferences),
    interpretation: "WAEPA GI uses the complete source certification in an informational blue notice above Read & Sign, covered by the existing signature consent; no separate eligibility answers are added. Current CSEA Disability uses C122 below Electronic Consent online. Retain the separate California payroll clause and ABE's accepted Review. Detailed PDF remains deferred.",
    flaggedRequirement: { key: "csea-standalone-add-payroll-applicability", completionBlocking: false, status: "awaiting-source-identity", revisitTrigger: "Resolve standalone CSEA AD&D source identity and payroll applicability", currentBehavior: "No unsupported AD&D assignment of C122" },
    destinations: selected.map(row => ({ table: "configurationValues", key: row.key, column: "value.blocks" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
