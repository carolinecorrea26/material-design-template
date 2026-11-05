import type { DatabaseSchema, Json } from "../persistence/types";
import { isReviewPolicy, type ReviewBlock } from "../domain/reviewPolicy";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";

export const supplementalHealthReviewPrefix = "review.rules-review.supplemental-health";
const reference = "Read & Sign!B115:B117, C117; source-backed adoption October 20, 2026; preserve accepted ABE Review";
export function applySupplementalHealthReviewAdoption(db: DatabaseSchema) {
  const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)?.value ?? "").trim();
  if (!source("B115").includes("14pt") || !source("B117").includes("AMA") || !source("C117").startsWith("I HEREBY ATTEST")) throw new Error("Supplemental Health Review source changed");
  for (const scope of activeSiteMigrationScope.sites.filter(site => site.mcrRequired && site.key !== "abe")) {
    const site = db.sites.find(site => site.key === scope.key)!;
    const products = db.siteProducts.filter(row => row.siteId === site.id && row.enabled && db.products.some(product => product.key === row.productKey && product.categoryKey === "SH")).map(row => row.productKey);
    if (!products.length) continue;
    const row = db.configurationValues.find(row => row.key === `${scope.key}.review-policy`);
    if (!row || !isReviewPolicy(row.value)) throw new Error(`Missing Supplemental Health Review owner ${scope.key}`);
    const block: ReviewBlock = { key: "supplemental-health-attestation", title: "Supplemental Health attestation", paragraphs: [source(scope.key === "ama" ? "C117" : "B116")], fields: [], placement: "before-signature", fontSizePt: 14, when: { products }, sourceReferences: ["Read & Sign!B115:B117", "Read & Sign!C117"] };
    const indexInPolicy = row.value.blocks.findIndex(previous => previous.key === block.key);
    row.value = { ...row.value, blocks: indexInPolicy < 0 ? [...row.value.blocks, block] : row.value.blocks.map((previous, index) => index === indexInPolicy ? block : previous) } as unknown as Json;
    const key = `${supplementalHealthReviewPrefix}.${scope.key}`;
    const decision = { id: key, key, ...libraryMetadata("semanticRequirements", key, reference), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: scope.key, predicate: "supplemental-health-attestation", status: "documented", value: {
      sourceReferences: block.sourceReferences, sourceReconciliation: "source-backed", runtimeActivation: "reviewed-seed", selected: block,
      interpretation: "Display the source HI/CI Supplemental Health attestation at 14pt before signature controls. AMA uses its no-title wording. No new checkbox is inferred. ABE retains accepted behavior.",
      destinations: [{ table: "configurationValues", key: row.key, column: "value.blocks" }],
    } as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === key);
    if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
  }
}
