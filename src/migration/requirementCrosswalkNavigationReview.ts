import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { DatabaseSchema } from "../persistence/types";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { resolvePageCatalog } from "../domain/pageCatalog";
import { activeSiteMigrationScope } from "./activeSiteScope";
import type { CrosswalkRow } from "./requirementCrosswalk";
import evidence from "../../docs/project-review/step1-navigation-review-evidence.json";

export const navigationReviewRuleKeys = new Set([
  "rule-application-flow-resolved-next-back-navigation",
  "rule-application-flow-client-page-mode-none",
  "rule-application-flow-beneficiary-routing",
  "rule-application-flow-health-si-routing",
  "rule-application-flow-health-tele-supp-routing",
  "rule-application-flow-health-uw-cir-routing",
  "rule-application-flow-health-qd-routing",
  "rule-progress-navigation-health-grouped-in-progress",
  "rule-progress-navigation-skipped-stages-removed",
  "rule-progress-navigation-post-review-back-disabled",
  "rule-progress-navigation-back-button-hidden-with-no-previous-page",
  "rule-validation-page-advance",
]);
export function reviewedNavigationCodeMatches(read = (path: string) => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../..", path))) {
  return Object.keys(evidence.files).length > 0 && Object.entries(evidence.files).every(([path, hash]) => createHash("sha256").update(read(path)).digest("hex") === hash);
}
export function navigationReviewSnapshot(db: DatabaseSchema) {
  return activeSiteMigrationScope.sites.map(({ key }) => {
    const site = resolveEffectiveSite(db, key);
    return { siteKey: key, catalog: resolvePageCatalog(db, key), routing: site.configuration.routing,
      pages: site.configuration.pages, products: site.products, configurationProducts: site.configuration.products,
      beneficiaries: site.configuration.beneficiaryParticipationPolicies, questionnaires: site.configuration.healthQuestionnairePolicies };
  });
}
export function navigationReviewHash(db: DatabaseSchema) {
  return createHash("sha256").update(JSON.stringify(navigationReviewSnapshot(db))).digest("hex");
}
export function reviewNavigationRequirements(db: DatabaseSchema, rows: CrosswalkRow[]) {
  const snapshots = navigationReviewSnapshot(db);
  const matches = reviewedNavigationCodeMatches() && createHash("sha256").update(JSON.stringify(snapshots)).digest("hex") === evidence.nativeHash;
  const owners = snapshots.flatMap(snapshot => [
    ...(snapshot.routing?.provenance ?? []), ...snapshot.pages.flatMap(page => [...page.provenance, ...(page.definition?.provenance ?? [])]),
    ...snapshot.beneficiaries.flatMap(policy => policy.provenance), ...snapshot.questionnaires.flatMap(policy => policy.provenance),
    ...snapshot.configurationProducts.flatMap(product => product.journeyPolicies.flatMap(policy => policy.provenance)),
  ]).map(({ table, key }) => ({ table, key })).filter((owner, index, owners) => owners.findIndex(other => other.table === owner.table && other.key === owner.key) === index);
  for (const row of rows.filter(row => row.kind === "template-behavior" && row.ruleKeys.some(key => navigationReviewRuleKeys.has(key)))) {
    row.atomization = "reviewed"; row.scope.unresolved = [];
    row.scope.modes = ["current mock prototype; single and multi template shared flow"];
    row.executionOwners = owners; row.ownerCandidates = []; row.ownerResolution = "code-owned";
    row.codeOwner = "formFlow / resolvePageParticipation / FormRoutePage / getActiveProgressSteps over captured Site configuration";
    row.implementationReferences = [...new Set([...row.implementationReferences, "src/config/formFlow.ts", "src/config/flowGates.ts", "src/domain/routingRules.ts", "src/app/RoutePage.tsx", "src/config/progressSteps.ts"])];
    row.verificationReferences = ["src/migration/navigationReview.test.ts", "src/config/flowGates.test.ts", "src/migration/routingRuleOwnership.test.ts", "src/app/RoutePage.navigation.test.tsx", "src/app/RoutePage.persistence.test.tsx"];
    row.verificationStatus = matches ? "recorded-evidence" : "not-verified";
    row.disposition = matches ? "reviewed-current-template-functionality" : "review-pending";
    row.finding = matches ? "Bounded shared routing/validation review: captured page order and participation, five executable routing owners/six gates, active applicant health-page overrides, source-questionnaire supersession, beneficiary exceptions, next/Back symmetry, progress grouping, post-Review Back suppression and validation boundaries. Native snapshots and implementation/test fingerprints match. Planned pages, individual questionnaire wording and other navigation/UI catalog entries retain their separate dispositions." : "Captured routing/page/product/questionnaire values or implementation/test evidence changed; repeat the bounded navigation review.";
  }
}
