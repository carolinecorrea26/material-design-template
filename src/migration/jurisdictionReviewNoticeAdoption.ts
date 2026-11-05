import type { DatabaseSchema, Json } from "../persistence/types";
import { isReviewPolicy, type ReviewBlock } from "../domain/reviewPolicy";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";

export const jurisdictionReviewNoticePrefix = "business-decision.rules-review.jurisdiction-notices";
export function applyJurisdictionReviewNoticeAdoption(db: DatabaseSchema) {
  const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)?.value ?? "").trim();
  if (!source("B118").includes("Member e-signature") || !source("B119").includes("REVIEW THE ANSWERS") || !source("C75").includes("WAR RESTRICTION")) throw new Error("Jurisdiction Review notice source changed");
  for (const scope of activeSiteMigrationScope.sites.filter(site => site.mcrRequired && site.key !== "abe")) {
    const row = db.configurationValues.find(row => row.key === `${scope.key}.review-policy`);
    if (!row || !isReviewPolicy(row.value)) throw new Error(`Missing Review owner ${scope.key}`);
    const blocks: ReviewBlock[] = [{ key: "connecticut-underwritten-notice", title: "Connecticut notice", paragraphs: [source("B119").replace(/^[“"]|[”"]$/g, "")], fields: [], placement: "before-member-signature", when: { jurisdictions: ["CT"], healthQuestions: true }, sourceReferences: ["Read & Sign!B118", "Read & Sign!B119"] }];
    if (scope.key === "waepa") {
      const text = source("C75"), split = text.indexOf("NOTICE FOR NEW YORK RESIDENTS");
      blocks.push({ key: "accelerated-death-benefit-notice", title: "Accelerated death benefit notice", paragraphs: [text.slice(0, split).trim()], fields: [], placement: "before-consent", when: { products: ["li-group-term"] }, sourceReferences: ["Read & Sign!B75", "Read & Sign!C75"] });
      blocks.push({ key: "new-york-war-restriction", title: "New York war restriction", paragraphs: [text.slice(split).split('"')[0].trim()], fields: [], placement: "before-consent", emphasis: "bold", when: { products: ["li-group-term"], jurisdictions: ["NY"] }, sourceReferences: ["Read & Sign!B75", "Read & Sign!C75"] });
    }
    const previous = row.value.blocks;
    row.value = { ...row.value, blocks: [...previous.map(block => blocks.find(next => next.key === block.key) ?? block), ...blocks.filter(block => !previous.some(old => old.key === block.key))] } as unknown as Json;
    const key = `${jurisdictionReviewNoticePrefix}.${scope.key}`;
    const reference = "User decisions October 20, 2026: CT source notice with actual-health guard, preserve ABE; Standard WAEPA Life/NY C75 notices";
    const decision = { id: key, key, ...libraryMetadata("semanticRequirements", key, reference), domain: "approved-business-decision", subjectTable: "sites", subjectKey: scope.key, predicate: "jurisdiction-review-notices", status: "documented", value: {
      approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", selected: blocks,
      sourceReferences: [...new Set(blocks.flatMap(block => block.sourceReferences))],
      interpretation: "CT notice appears immediately before member signature when actual health questions participate. Standard WAEPA Life notices follow Fraud Notice and precede Consent; NY war restriction is bold uppercase and NY-only. STD-only and WAEPA GI do not inherit C75. ABE Review remains preserved.",
      destinations: [{ table: "configurationValues", key: row.key, column: "value.blocks" }],
    } as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === key);
    if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
  }
}
