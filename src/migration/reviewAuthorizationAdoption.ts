import type { DatabaseSchema, Json } from "../persistence/types";
import { isReviewPolicy, type ReviewPolicy } from "../domain/reviewPolicy";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { currentMcrSource } from "./currentMcr";

export const reviewAuthorizationDecisionPrefix = "business-decision.rules-review.medical-authorization";
const reference = "User decision October 20, 2026; Read & Sign!B3:B4/B40: medical authorization and introductory medical statement follow actual health-question participation, including CI; adopt standard, Minnesota and Virginia QD source authorization versions; preserve ABE's accepted Review behavior. User clarification October 21, 2026: externally hosted QD questionnaires count as health participation while the prototype retains its loading state";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });

export function applyReviewAuthorizationAdoption(db: DatabaseSchema) {
  const text = (cell: string) => String(currentMcrSource.cells.find(source => source.sheet === "Read & Sign" && source.cell === cell)?.value ?? "").trim();
  const [minnesota, afterConsentText] = text("C43").split(/\nStandard Fraud Notice\nCONSENT: site specific or standard consent\n/).map(part => part.trim());
  if (![text("B41"), minnesota, text("C48")].every(copy => copy.startsWith("AUTHORIZATION:")) || !afterConsentText?.startsWith("This  AUTHORIZATION  excludes") || !text("B36").startsWith("I understand")) throw new Error("Reviewed medical authorization source boundaries changed");
  const definitionKey = "shared.review-policy";
  if (!db.configurationDefinitions.some(row => row.key === definitionKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", definitionKey), position: 0,
    definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-review-policy" } } });
  for (const site of activeSiteMigrationScope.sites.filter(site => site.mcrRequired && site.key !== "abe")) {
    const row = db.configurationValues.find(row => row.key === `${site.key}.review-policy`);
    if (!row || !isReviewPolicy(row.value)) throw new Error(`Missing Review policy ${site.key}`);
    const authorization: NonNullable<ReviewPolicy["authorization"]> = {
      when: "participating-health-questions", pageIds: ["health-li", "health-si", "health-di", "health-qd"],
      introductoryStatement: text("B36"), wording: { defaultText: text("B41"), variants: [
        { jurisdictions: ["MN"], text: minnesota, afterConsentText },
        { jurisdictions: ["VA"], underwritingTypes: ["QD"], text: text("C48") },
      ] },
      sourceReferences: ["Read & Sign!B3:B4", "Read & Sign!B35:B36", "Read & Sign!B40:B43", "Read & Sign!C43", "Read & Sign!B48:C48", "User decisions October 20, 2026"],
    };
    const processingVariants = row.value.authorization?.wording?.processingVariants;
    const previous = row.configurationKey;
    row.configurationKey = definitionKey;
    row.value = { ...row.value, authorization: processingVariants ? { ...authorization, wording: { ...authorization.wording!, processingVariants } } : authorization } as unknown as Json;
    if (previous !== definitionKey && !db.configurationValues.some(value => value.configurationKey === previous)) db.configurationDefinitions = db.configurationDefinitions.filter(definition => definition.key !== previous);
    const key = `${reviewAuthorizationDecisionPrefix}.${site.key}`;
    const decision = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: site.key, predicate: "medical-authorization-applicability", status: "documented", value: {
      approvalStatus: "approved", authority: reference, runtimeActivation: "reviewed-seed", sourceReconciliation: "approved-new-template-interpretation", scope: [site.key], selected: structuredClone(authorization),
      destinations: [{ table: "configurationValues", key: row.key, column: "value.authorization" }],
      preserved: "Existing consent wording, fraud notices and ABE Review remain preserved. Assigned external QD questionnaire participation triggers the approved Review guards; the unrelated health-cir placeholder does not. The prototype intentionally does not host QD questions.",
    } as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === key);
    if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
  }
}
