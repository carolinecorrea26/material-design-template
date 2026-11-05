import { activeSiteMigrationScope } from "./activeSiteScope";
import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isReviewPolicy, type ReviewPolicy } from "../domain/reviewPolicy";
import { currentMcrSource } from "./currentMcr";
export const qdDisabilityAuthorizationKey = "business-decision.rules-review.qd-disability-authorization";
export function applyQdDisabilityAuthorizationAdoption(db: DatabaseSchema) {
  const authority = "User decision October 20, 2026; Read & Sign!B52:C52: QD DI and QD Life + DI authorization, actual health-question guard, MN/VA priority and ABE preserved";
  const text = String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === "C52")?.value ?? "").trim();
  if (!text.startsWith("AUTHORIZATION:")) throw new Error("C52 source authorization changed");
  const processingVariants: NonNullable<NonNullable<NonNullable<ReviewPolicy["authorization"]>["wording"]>["processingVariants"]> = [{ when: "qd-disability-or-qd-life-with-disability", text, sourceReferences: ["Read & Sign!B52", "Read & Sign!C52"] }];
  const selected = db.sites.filter(site => activeSiteMigrationScope.sites.some(scope => scope.mcrRequired && scope.key === site.key) && site.key !== "abe" && db.siteProducts.some(link => link.siteId === site.id && link.enabled && db.products.some(product => product.key === link.productKey && product.categoryKey === "DI"))).map(site => {
    const row = db.configurationValues.find(row => row.key === `${site.key}.review-policy`);
    if (!row || !isReviewPolicy(row.value) || !row.value.authorization?.wording) throw new Error(`Missing captured authorization ${site.key}`);
    row.value.authorization.wording.processingVariants = structuredClone(processingVariants);
    return { siteKey: site.key, key: row.key, processingVariants };
  });
  const key = qdDisabilityAuthorizationKey, row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "review", predicate: "qd-disability-authorization", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["Read & Sign!B52", "Read & Sign!C52"], selected,
    interpretation: "When health questions actually participate, use C52 if an adult DI request processes as QD, or an adult QD Life request is combined with DI. Existing jurisdiction variants take priority. QD-only no-health requests do not acquire an authorization. Preserve ABE and consent wording.",
    destinations: selected.map(row => ({ table: "configurationValues", key: row.key, column: "value" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
