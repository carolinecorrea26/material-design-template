import type { DatabaseSchema, Json } from "../persistence/types";
import type { FinancialQuestionnairePolicy } from "../domain/financialQuestionnaire";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const abeFinancialDecisionKey = "business-decision.rules-review.abe-profile-financial";
export function applyAbeFinancialQuestionnaireAdoption(db: DatabaseSchema) {
  const authority = "User decision October 22, 2026: financial questionnaire is member-only on Profile, existing profileFinancialQuestionnaireSelf below Other coverage; configure Site/product/amount using latest MCR amounts, independent of Health-page completion.";
  const trigger = String(currentMcrSource.cells.find(row => row.sheet === "SUP DI Health questions" && row.cell === "U50")?.value ?? "");
  if (!trigger.includes("$7,000 or more") || !trigger.includes("excluding OO")) throw new Error("ABE financial source threshold changed");
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const configurationKey = "shared.profile-financial-questionnaire";
  if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-financial-questionnaire" } } });
  const policy: FinancialQuestionnairePolicy = { version: 1, enabled: true, applicant: "member", rules: [{ productKeys: ["di-ltd-plus", "di-ltd", "di-mtd"], minimumAmount: 7000, inclusive: true }], sourceReferences: ["SUP DI Health questions!A50", "SUP DI Health questions!O50", "SUP DI Health questions!U50", "Financial questions!B2:B10"] };
  const key = "abe.profile-financial-questionnaire", row = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "abe", clientKey: null, configurationKey, value: policy as unknown as Json };
  const index = db.configurationValues.findIndex(row => row.key === key); if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
  const decision = { ...meta("semanticRequirements", abeFinancialDecisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "abe", predicate: "member-profile-financial-questionnaire", status: "documented", value: { authority, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved-new-template-interpretation", selected: policy, sourceReferences: policy.sourceReferences, placement: { page: "profile", section: "profileFinancialQuestionnaireSelf", below: "profileFinancialSelf" }, interpretation: "Sum selected member DI only. At $7,000 inclusive, use the existing Financial questionnaire fields on Profile. Office Overhead and spouse amounts never contribute. No health completion or QD Life gate. Site configuration can disable the form or change products/thresholds without moving it or adding a spouse form.", destinations: [{ table: "configurationValues", key, column: "value" }] } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === decision.key); if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
