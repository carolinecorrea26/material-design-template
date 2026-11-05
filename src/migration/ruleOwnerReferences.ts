import type { DatabaseSchema } from "../persistence/types";
import type { RuleDefinition } from "../domain/rules";
import { libraryMetadata } from "../domain/provenance";
import { reviewedRule } from "../domain/ruleCatalogReview";

/** Discovery records for established execution owners, never competing policies. */
const owners: Array<Pick<RuleDefinition, "id" | "area" | "rule" | "behavior" | "ref">> = [
  { id: "rule-persistence-resume-verification", area: "Persistence", rule: "Saved application recovery controls",
    behavior: "The applicant recovery service owns save retention, link and code expiry, incorrect-attempt and issue/request limits, revocation, single-use verification and write-capability rotation. Values and enforcement remain in the mock service; delivery is simulated. This catalog reference does not configure a production service.",
    ref: "scripts/applicant-saves.mjs; scripts/applicant-saves.test.mjs; src/services/applicantSaveService.ts" },
  { id: "rule-persistence-revision-revalidation", area: "Persistence", rule: "Revalidate saved applications after Library revision changes",
    behavior: "A recovered or locally remembered save whose Library revision differs requires explicit Coverage or Review completion before mock submission. Ordinary autosaves do not clear that state. The save service and applicant submission check own this client-assisted mock behavior; no warning banner is required.",
    ref: "scripts/applicant-saves.mjs; src/services/applicantSaveService.ts; src/app/RoutePage.tsx; src/pages/Payment.tsx" },
  { id: "rule-coverage-product-policy-owners", area: "Coverage", rule: "Product eligibility and benefit limits use captured policies",
    behavior: "Product eligibility constraints, scoped Association eligibility, additional eligibility facts, structured amount assignments, benefit policies and selection/dependent policies own their respective decisions. Explicit Site/product/Association/applicant assignments determine applicability. Association residency lists and identifier roles use their dedicated captured policies. This record references those owners; individual requirements still need semantic coverage verification.",
    ref: "src/domain/effectiveSite.ts; src/domain/associationEligibilityPolicy.ts; src/domain/associationAmountPolicy.ts; src/domain/residencyPolicy.ts; src/domain/coverageJourneyPolicy.ts; src/domain/coveragePolicyValidation.ts; src/domain/structuredBenefitPolicy.ts; src/domain/benefitPolicy.ts; src/domain/coverageSelectionPolicy.ts; src/domain/coverageRuntime.ts" },
  { id: "rule-rates-billing-modifier-owners", area: "Rates", rule: "Billing and premium modifiers use captured product policies",
    behavior: "Captured product rate modifier policies and journey billing policies own membership adjustments, billing factors and applicable fees. The rating and billing resolvers execute them; rule prose does not supply competing values.",
    ref: "src/domain/mockRating.ts; src/domain/rateModifiers.ts; src/domain/coverageJourneyPolicy.ts" },
  { id: "rule-review-jurisdiction-fraud-notices", area: "Review", rule: "Fraud notice follows the captured Review policy",
    behavior: "The Site Review policy owns jurisdiction text and scoped product exceptions. resolveFraudNotice selects the applicable notice using residence and selected products; missing residence is not silently assigned a jurisdiction.",
    ref: "src/domain/reviewPolicy.ts; src/content/reviewPolicies.ts; src/pages/Review.tsx" },
  { id: "rule-review-conditional-consent-blocks", area: "Review", rule: "Consent blocks follow captured applicability and fields",
    behavior: "The captured Review policy owns applicant, product and application-mode conditions for consent blocks, source consent selection and role-specific openings. Active block field definitions own required acknowledgements; the Review resolver and page execute applicability and validation.",
    ref: "src/domain/reviewPolicy.ts; src/content/reviewPolicies.ts; src/pages/Review.tsx" },
];

export function addRuleOwnerReferences(db: DatabaseSchema) {
  const authority = "Rules owner crosswalk October 20, 2026; existing implemented behavior";
  for (const [position, definition] of owners.entries()) {
    if (db.rules.some(row => row.key === definition.id)) continue;
    const key = definition.id;
    db.rules.push({ id: key, key, ...libraryMetadata("rules", key, authority), position: 8000 + position,
      definition: reviewedRule({ ...definition, documentationStatus: "current", documentedIn: "rules", sequence: 8000 + position }, position) });
    const assignmentKey = `${key}.global`;
    db.ruleAssignments.push({ id: assignmentKey, key: assignmentKey, ...libraryMetadata("ruleAssignments", assignmentKey, authority), ruleKey: key,
      position, scope: "global", siteKey: null, clientKey: null });
  }
}
