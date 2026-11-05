import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";

export const isitrustStdHealthDecisionKey = "business-decision.rules-review.isitrust-std-health-exception";
export function recordIsitrustStdHealthDecision(db: DatabaseSchema) {
  const row = db.configurationValues.find(row => row.key === "isitrust.di-short-term.journey-policy");
  if (!row || !isCoverageJourneyPolicy(row.value) || row.value.defaultUnderwritingPathway !== "GI" || row.value.questions.some(question => question.healthPage !== null)) throw new Error("ISITRUST STD accepted provisional flow changed");
  const key = isitrustStdHealthDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, "User decision October 20, 2026: retain current ISITRUST STD health flow as an accepted provisional exception"), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "accepted-provisional-std-health-exception", status: "documented", value: {
    approvalStatus: "approved-provisional-exception", authority: "User decision October 20, 2026", sourceReconciliation: "accepted-provisional-exception", runtimeActivation: "reviewed-seed",
    sourceReferences: ["Main!U281", "Main!Z281", "Main!AA281", "Health Questions!A14:C16"],
    selected: { defaultUnderwritingPathway: row.value.defaultUnderwritingPathway, questions: row.value.questions },
    interpretation: "Retain the current guaranteed-issue processing and no-health-question flow. Source U281 and AA281 require underwriting and EZ-3 for all ages/amounts; this explicit user-approved provisional exception takes precedence until revisited. ATPE does not offer STD.",
    revisitTrigger: "User approves source EZ-3 adoption or supplies corrected STD underwriting/questionnaire information",
    destinations: [{ table: "configurationValues", key: row.key, column: "value.defaultUnderwritingPathway" }, { table: "configurationValues", key: row.key, column: "value.questions" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
