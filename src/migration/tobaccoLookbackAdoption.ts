import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isRateInputPolicy } from "../domain/rateInputPolicy";
import { currentMcrSource } from "./currentMcr";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
export const tobaccoLookbackDecisionKey = "business-decision.rules-review.isitrust-group-term-tobacco-lookback";
export function applyTobaccoLookbackAdoption(db: DatabaseSchema) {
  const authority = "Main!AD278 and Main!AD179; user decision October 21, 2026: apply source lookbacks to mock rating";
  const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === cell)?.value ?? "").trim();
  if (source("AD278") !== "12 months" || source("AD179") !== "Jet Issue Version (Same smoking question as ISI Trust Full Site)\n24 months lookback") throw new Error("ISITRUST tobacco lookback source changed");
  const key = "isitrust.li-group-term.rate-input-policy", definitionKey = "shared.li-group-term.rate-input-policy";
  const value = db.configurationValues.find(row => row.key === key);
  if (!value || !isRateInputPolicy(value.value) || !db.siteAssociations.some(row => row.siteKey === "isitrust" && row.associationKey === atpeAssociationKey && row.enabled)) throw new Error("Missing ISITRUST tobacco rating baseline");
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const definition = { ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "product-rate-input-policy" as const, productKey: "li-group-term" } } };
  const index = db.configurationDefinitions.findIndex(row => row.key === definitionKey); if (index < 0) db.configurationDefinitions.push(definition); else db.configurationDefinitions[index] = definition;
  const previousDefinition = value.configurationKey;
  value.configurationKey = definitionKey;
  if (value.value.rateClass?.revisit) value.value.rateClass.revisit = "Full underwriting quote mapping; QD and age/amount exceptions require separate production rating reconciliation. The approved mock tobacco lookback is captured in this policy.";
  value.value = { ...value.value, tobaccoLookback: { months: 12, sourceReferences: ["Main!AD278"], associationOverrides: [{ associationKeys: [atpeAssociationKey], months: 24, sourceReferences: ["Main!AD179"] }] }, sourceReferences: [...new Set([...value.value.sourceReferences, "Main!AD278", "Main!AD179"])] } as unknown as Json;
  if (previousDefinition !== definitionKey && !db.configurationValues.some(row => row.configurationKey === previousDefinition)) db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== previousDefinition);
  const decisionKey = tobaccoLookbackDecisionKey;
  const decision = { ...meta("semanticRequirements", decisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "product-association-tobacco-lookback", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "source-adopted", runtimeActivation: "reviewed-seed", scope: ["isitrust"], productKeys: ["li-group-term"], sourceReferences: ["Main!AD278", "Main!AD179"],
    selected: { generalMonths: 12, atpeMonths: 24, originalAnswers: "preserved", estimates: "synthetic", atpeEstimates: "suppressed" },
    owners: [{ table: "configurationDefinitions", key: definitionKey, reviewedValue: structuredClone(definition) }, { table: "configurationValues", key, reviewedValue: structuredClone(value) }],
    interpretation: "For mock Group Term rating only, an affirmative tobacco answer becomes a nonsmoker rating input once the last-use calendar anniversary reaches 12 months, or 24 months for ATPE. The original answer/date are unchanged. Missing, invalid or future dates retain the affirmative classification. Other products/Sites keep their existing policies; health questions, underwriting, ATPE estimate suppression and unresolved production rating assumptions remain separate.",
  } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === decisionKey); if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
