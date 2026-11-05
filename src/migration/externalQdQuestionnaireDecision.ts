import { activeSiteMigrationScope } from "./activeSiteScope";
import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
export const externalQdQuestionnaireDecisionKey = "business-decision.rules-review.external-qd-questionnaire";
export function recordExternalQdQuestionnaireDecision(db: DatabaseSchema) {
  const key = externalQdQuestionnaireDecisionKey, authority = "User clarification and decision October 21, 2026: GMA-JI-L identifies external QD health questions; the prototype intentionally shows their loading state; external questionnaire participation counts for Review";
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "pages", subjectKey: "health-qd", predicate: "external-qd-questionnaire", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    scope: activeSiteMigrationScope.sites.filter(site => site.mcrRequired).map(site => site.key),
    selected: { formCode: "GMA-JI-L", questionnaireHost: "external-iframe", prototypePresentation: "intentional-loading-state", prototypeHostsQuestions: false, countsForReviewParticipation: true, preserveAbeReview: true },
    sourceReferences: ["Health Questions!A4:B5", "Main!AA39", "Main!AA118", "Main!AA165", "User clarification October 21, 2026"],
    supersedes: "Any interpretation of health-qd as a missing prototype questionnaire or as no health-question participation. The separately deferred state-variation document and approved hosted source forms retain their own scope.",
    interpretation: "No new QD questions, iframe integration or missing-full-Life-form requirement is created for this prototype. Assigned external QD questionnaire participation triggers the approved medical authorization/introduction, underwriting consent and associated health-participation Review guards. ABE keeps its accepted Review. No answers are fabricated.",
    destinations: db.configurationValues.filter(row => row.key.endsWith(".review-policy") && activeSiteMigrationScope.sites.some(site => site.mcrRequired && site.key !== "abe" && site.key === row.siteKey)).map(row => ({ table: "configurationValues", key: row.key, column: "value.authorization" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(record => record.key === key); if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
