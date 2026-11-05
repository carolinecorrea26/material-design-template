import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { urlParameters } from "../content/docs/urlParameters";
export const entryUrlDecisionKey = "business-decision.rules-review.entry-url-scope";
export function recordEntryUrlReviewDecisions(db: DatabaseSchema) {
  const key = entryUrlDecisionKey, authority = "User decision October 20, 2026: keep AMA's separate Coverage choices; implement category and prods; defer remaining unimplemented URL behavior";
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "urlParameters", subjectKey: "prods", predicate: "entry-url-interpretation", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    selected: { category: "Comma-separated categories narrow the current Site portfolio; category=all resets the category restriction", prods: "Comma-separated captured G-numbers narrow products within the category filter; a prods entry requires category. Unknown/incompatible IDs produce no available products, never a broader fallback", featured_prod: "An available requested product and its category precede configured presentation order; preserve the remaining order and each saved application's own context. It never enables unavailable products", amaPremiumStyle: "Separate Step Rated and Level Rated Coverage cards; do not add the duplicate Membership selector", persistence: "Site-scoped context persists across routes and is captured/restored with each application. Opening another campaign does not overwrite saved answers. Unavailable previous selections require explicit removal" },
    deferredOtherUrlBehavior: { completionBlocking: false, status: "deferred-by-user", parameterNames: urlParameters.filter(row => !["category", "prods", "featured_prod"].includes(row.parameter)).map(row => row.parameter), scope: "Unimplemented behavior only; existing Site/Association navigation, ordering and other working behavior remain intact", revisitTrigger: "Separate URL-parameter implementation work" },
    sourceReferences: ["Attestation Online and PDF!C3", "URLs", "src/content/docs/urlParameters.ts", "User decision October 20, 2026"],
    implementationReferences: ["src/config/client/coverageCategoryScope.ts", "src/config/client/coverageProductScope.ts", "src/config/client/getActiveClientCoverages.ts", "src/app/ApplicationFormContext.tsx"],
    verificationReferences: ["src/config/client/coverageProductScope.test.ts", "src/app/ApplicationFormContext.entryScope.test.tsx"],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
