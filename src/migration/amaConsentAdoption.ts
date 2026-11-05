import type { DatabaseSchema, Json } from "../persistence/types";
import { isReviewPolicy, type ReviewPolicy } from "../domain/reviewPolicy";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";

export const amaConsentDecisionKey = "business-decision.rules-review.ama-consent";
const reference = "Read & Sign!B3:B4, C80, C97; User decision October 20, 2026: physician opening only for Physician applicants";

/** Adopt source consent inside the native captured Review policy. */
export function applyAmaConsentAdoption(db: DatabaseSchema) {
  const row = db.configurationValues.find(row => row.key === "ama.review-policy");
  if (!row || !isReviewPolicy(row.value)) throw new Error("Missing AMA Review policy");
  const text = (cell: string) => String(currentMcrSource.cells.find(source => source.sheet === "Read & Sign" && source.cell === cell)?.value ?? "").trim();
  const underwrittenText = text("C80"), original = text("C97"), opening = "I am a physician and ";
  if (!underwrittenText.startsWith("CONSENT:\nBy signing") || !original.startsWith(`CONSENT:\n${opening}by signing`)) throw new Error("AMA consent source changed");
  const site = db.sites.find(site => site.key === "ama")!;
  const products = db.siteProducts.filter(link => link.siteId === site.id && link.enabled).map(link => db.products.find(product => product.key === link.productKey)!);
  const consent: NonNullable<ReviewPolicy["consent"]> = {
    underwrittenWhen: products.filter(product => ["LI", "DI", "OO"].includes(product.categoryKey) && product.key !== "li-premier-accident").map(product => ({ productKey: product.key, applicants: ["member", "spouse"] })),
    underwrittenText, otherText: original.replace(`${opening}by signing`, "By signing"),
    otherOpening: { fieldId: "membership", answer: "physician", acceptedAnswers: ["physician", "resident", "student", "retired", "spouse"], prefix: opening },
    sourceReferences: ["Read & Sign!B3:B4", "Read & Sign!C80", "Read & Sign!C97", "User decision October 20, 2026"],
  };
  const policy = { ...row.value, consent };
  if (!isReviewPolicy(policy)) throw new Error("Invalid AMA consent policy");
  const definitionKey = "shared.review-policy";
  const definition = db.configurationDefinitions.find(definition => definition.key === definitionKey);
  if (definition && definition.definition.target?.kind !== "site-review-policy") throw new Error("Conflicting reusable Review definition");
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
  if (!definition) db.configurationDefinitions.push({ ...meta("configurationDefinitions", definitionKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-review-policy" } } });
  const previous = row.configurationKey;
  row.configurationKey = definitionKey; row.value = policy as unknown as Json; row.sourceReference = reference;
  if (previous !== definitionKey && !db.configurationValues.some(value => value.configurationKey === previous)) db.configurationDefinitions = db.configurationDefinitions.filter(definition => definition.key !== previous);
  const record = { ...meta("semanticRequirements", amaConsentDecisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "ama", predicate: "conditional-consent", status: "documented", value: {
    approvalStatus: "approved", authority: "User decision October 20, 2026", sourceReconciliation: "approved", runtimeActivation: "reviewed-seed", scope: ["ama"], selected: consent,
    destinations: [{ table: "configurationValues", key: row.key, column: "value.consent" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === amaConsentDecisionKey);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
