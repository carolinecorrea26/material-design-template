import type { DatabaseSchema, Json } from "../persistence/types";
import type { CategoryEligibilityPolicy } from "../domain/categoryEligibilityPolicy";
import { libraryMetadata } from "../domain/provenance";

export function applyAmaCategoryEligibilityAdoption(db: DatabaseSchema) {
  const key = "ama.applicant-category-eligibility", ruleKey = "rule-membership-ama-category-eligibility";
  const reference = "Attestation Online and PDF!C3; User decision October 20, 2026";
  const meta = (table: string, id: string) => ({ id, key: id, ...libraryMetadata(table, id, reference) });
  const policy: CategoryEligibilityPolicy = { version: 1, fieldId: "membership", allowedByAnswer: {
    physician: ["LI", "AD", "DI", "OO", "SH"], resident: ["LI", "DI", "SH"], student: ["LI", "SH"], retired: ["LI", "SH"], spouse: ["LI"],
  } };
  if (!db.configurationDefinitions.some(row => row.key === key)) {
    db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { authority: reference }, target: { kind: "site-category-eligibility" } } });
    db.configurationValues.push({ ...meta("configurationValues", key), configurationKey: key, scope: "site", siteKey: "ama", clientKey: null, position: 0, value: policy as unknown as Json });
  }
  if (!db.rules.some(row => row.key === ruleKey)) {
    db.rules.push({ ...meta("rules", ruleKey), position: 2999, definition: { id: ruleKey, area: "Membership", documentationStatus: "current", documentedIn: "rules", categories: ["Applicant eligibility"], sequence: 2999,
      rule: "AMA applicant type determines category eligibility",
      behavior: "The Site category eligibility policy owns the available categories for each AMA membership/applicant type. Category controls, product eligibility and saved-election reconciliation use that policy. An unanswered pre-membership quote defers this gate; the application and captured eligibility API require an answer. Changing applicant type removes incompatible coverage elections.",
      ref: "src/domain/categoryEligibilityPolicy.ts; src/domain/effectiveSite.ts; src/domain/coverageRuntime.ts; src/app/useCoverageState.ts; src/app/workflows/QuoteCalculator.tsx" } });
    db.ruleAssignments.push({ ...meta("ruleAssignments", `${ruleKey}.ama`), ruleKey, scope: "site", siteKey: "ama", clientKey: null, position: 0 });
  }
}
