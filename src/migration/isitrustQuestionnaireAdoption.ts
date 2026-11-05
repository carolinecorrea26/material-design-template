import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { healthQuestionnaireFieldKeys, isHealthQuestionnairePolicy, type HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { currentMcrSource } from "./currentMcr";
import { atpeAssociationKey } from "./atpeAssociationAdoption";

export const isitrustQuestionnaireDecisionKey = "business-decision.rules-review.isitrust-source-questionnaires";
const reference = "User decision October 20, 2026: adopt current ISITRUST Life/CI source forms for other Associations; preserve approved processing and STD exception";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
export function applyIsitrustQuestionnaireAdoption(db: DatabaseSchema) {
  const cells = new Map(currentMcrSource.cells.filter(cell => cell.sheet === "Health Questions").map(cell => [cell.cell, String(cell.value ?? "")]));
  const generalReferences = new Map([[87, 63], [88, 64], [89, 65], [90, 66], [91, 67], [96, 72], [98, 74], [99, 75]].map(([from, to]) => [`Health Questions!B${from}`, `Health Questions!B${to}`]));
  const normalize = (text: string) => text.replace(/\s+/g, " ").trim();
  for (const [from, to] of generalReferences) if (normalize(cells.get(from.split("!")[1]) ?? "") !== normalize(cells.get(to.split("!")[1]) ?? "")) throw new Error(`General/combined Life wording changed: ${from}/${to}; review field sharing`);
  const base = db.configurationValues.find(row => row.key === "isitrust.atpe.health-questionnaires");
  if (!base || !isHealthQuestionnairePolicy(base.value)) throw new Error("Missing reviewed shared source questionnaire definitions");
  const associations = db.siteAssociations.filter(row => row.siteKey === "isitrust" && row.enabled && row.associationKey !== atpeAssociationKey).sort((a, b) => a.position - b.position).map(row => row.associationKey);
  if (!associations.length) throw new Error("Missing current general ISITRUST Association assignments");
  const policy = structuredClone(base.value) as HealthQuestionnairePolicy;
  policy.associationKeys = associations;
  const life = policy.variants.find(variant => variant.key === "life")!;
  life.items = life.items.map(item => ({ ...item, sourceReferences: item.sourceReferences.map(ref => generalReferences.get(ref) ?? ref) }));
  const definitionKey = "shared.general-life-ci-questionnaires", key = "isitrust.general.health-questionnaires";
  if (!db.configurationDefinitions.some(row => row.key === definitionKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-health-questionnaires" } } });
  const value = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "isitrust", clientKey: null, configurationKey: definitionKey, value: policy as unknown as Json };
  const index = db.configurationValues.findIndex(row => row.key === key);
  if (index < 0) db.configurationValues.push(value); else db.configurationValues[index] = value;
  const review = db.configurationValues.find(row => row.key === "isitrust.review-policy");
  if (!review || !isReviewPolicy(review.value)) throw new Error("Missing captured ISITRUST Review policy");
  const atpeCertification = review.value.blocks.find(block => block.key === "ci-virginia-certification");
  if (!atpeCertification) throw new Error("Missing shared source Virginia certification");
  const certification = { ...structuredClone(atpeCertification), key: "ci-virginia-certification-general", when: { ...atpeCertification.when, associationKeys: associations } };
  const blockIndex = review.value.blocks.findIndex(block => block.key === certification.key);
  if (blockIndex < 0) review.value.blocks.push(certification); else review.value.blocks[blockIndex] = certification;
  const fieldKeys = healthQuestionnaireFieldKeys(policy);
  const decision = { ...meta("semanticRequirements", isitrustQuestionnaireDecisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-source-questionnaires", status: "documented", value: {
    approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    sourceReferences: ["Health Questions!A62:B75", "Health Questions!A81:B84", "Health Questions!A86:B100"],
    selected: { policy, certification, fields: db.fields.filter(row => fieldKeys.includes(row.key)).map(row => ({ key: row.key, definition: row.definition })) },
    interpretation: "Use general source Life, CI-only and combined Life/CI questionnaires, including their guarded details, jurisdiction variants and Virginia CI certification, for the explicitly assigned current ISITRUST Associations. Shared field wording matches the reviewed form after whitespace normalization; preserve distinct general/combined source references. Actual health-page participation remains governed by approved underwriting. ATPE keeps its separate policy; STD-only retains the accepted no-health exception and other DI/OO questionnaires remain separate.",
    destinations: [{ table: "configurationValues", key, column: "value" }, { table: "configurationValues", key: review.key, column: "value.blocks" }, ...fieldKeys.map(key => ({ table: "fields", key, column: "definition" }))],
  } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === decision.key);
  if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
