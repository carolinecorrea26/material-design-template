import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMigrationScope } from "./activeSiteScope";
export const premiumContributionStatementKey = "source-review.premium-contribution-statement";
export function applyPremiumContributionStatementAdoption(db: DatabaseSchema) {
  const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Read & Sign" && row.cell === cell)?.value ?? "").trim();
  const text = source("B7");
  if (!text.startsWith("PLEASE READ CAREFULLY") || source("B24") !== "WAEPAGI") throw new Error("Premium contribution source boundary changed");
  const selected = activeSiteMigrationScope.sites.filter(site => site.mcrRequired && site.key !== "abe").map(scope => {
    const row = db.configurationValues.find(row => row.key === `${scope.key}.review-policy`);
    if (!row || !isReviewPolicy(row.value)) throw new Error(`Missing Review owner ${scope.key}`);
    const statement = scope.key === "waepa-gi" ? null : text;
    row.value.premiumContributionStatement = statement;
    return { siteKey: scope.key, key: row.key, statement };
  });
  const key = premiumContributionStatementKey, authority = "Current MCR v78 Read & Sign!B6/B7/B24; preserve user-accepted ABE Review";
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "reviewed-source-instruction", subjectTable: "pages", subjectKey: "review", predicate: "premium-contribution-statement", status: "documented", value: {
    authority, sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", selected,
    sourceReferences: ["Read & Sign!B6", "Read & Sign!B7", "Read & Sign!B24"],
    interpretation: "The source initial premium-contribution statement appears for current Sites except WAEPA GI, whose explicit source exclusion is retained. ABE accepted Review remains unchanged. Medical introduction and consent retain their separately approved health-question guards.",
    destinations: selected.map(row => ({ table: "configurationValues", key: row.key, column: "value.premiumContributionStatement" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
