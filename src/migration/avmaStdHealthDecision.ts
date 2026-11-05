import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";

export const avmaStdHealthDecisionKey = "business-decision.rules-review.avma-std-health-exception";
export function recordAvmaStdHealthDecision(db: DatabaseSchema) {
  const row = db.configurationValues.find(row => row.key === "avma.di-short-term.journey-policy");
  if (!row || !isCoverageJourneyPolicy(row.value) || row.value.defaultUnderwritingPathway !== "GI" || row.value.questions.some(question => question.healthPage !== null)) throw new Error("AVMA STD accepted provisional flow changed");
  const key = avmaStdHealthDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, "User decision October 20, 2026: retain current AVMA STD health flow provisionally"), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "avma", predicate: "accepted-provisional-std-health-exception", status: "documented", value: {
    approvalStatus: "approved-provisional-exception", authority: "User decision October 20, 2026", sourceReconciliation: "accepted-provisional-exception", runtimeActivation: "reviewed-seed",
    sourceReferences: ["Main!U194", "Main!Z194", "Main!AA194"],
    selected: { defaultUnderwritingPathway: row.value.defaultUnderwritingPathway, questions: row.value.questions },
    interpretation: "Retain current guaranteed-issue processing and no health questions provisionally. Main U194 says underwriting applies but supplies no usable questionnaire instruction. This explicit user-approved exception remains flagged and does not prevent task completion.",
    revisitTrigger: "User supplies the missing AVMA STD form/underwriting information or approves a replacement flow",
    destinations: [{ table: "configurationValues", key: row.key, column: "value.defaultUnderwritingPathway" }, { table: "configurationValues", key: row.key, column: "value.questions" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
