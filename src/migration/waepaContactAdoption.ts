import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const waepaContactDecisionKey = "business-decision.rules-review.waepa-contact-products";
const reference = "User decisions October 20, 2026; Main!R379:R380: retain telephone on Membership; show business address for STD and hide it for Life-only applications";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });

export function applyWaepaContactAdoption(db: DatabaseSchema) {
  const configurationKey = "applicantExperience.contact.businessAddressProducts";
  if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0,
    definition: { path: ["applicantExperience", "contact", "businessAddressProducts"], metadata: { reusable: true, assignmentRequired: true }, target: null } });
  const key = "site:waepa.applicantExperience.contact.businessAddressProducts";
  const record = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey: "waepa", clientKey: null, configurationKey, value: ["di-short-term"] };
  const index = db.configurationValues.findIndex(row => row.key === key);
  if (index < 0) db.configurationValues.push(record); else db.configurationValues[index] = record;
  const refs: Array<{ table: string; key: string; column?: string }> = [
    { table: "configurationValues", key, column: "value" },
    { table: "configurationValues", key: "site:waepa.applicantExperience.contact.hideBusinessAddress", column: "value" },
    { table: "configurationValues", key: "site:waepa.applicantExperience.contact.hideCorrespondence", column: "value" },
    { table: "fields", key: "phone", column: "definition" },
    { table: "pageFields", key: "membership.phone" },
    { table: "pageSectionFields", key: "membership.default.phone" },
  ];
  const owners = refs.map(ref => {
    const row = (db[ref.table as keyof DatabaseSchema] as Array<{ key: string } & Record<string, unknown>>).find(row => row.key === ref.key);
    if (!row) throw new Error(`Missing reviewed WAEPA Contact owner ${ref.key}`);
    return { ...ref, reviewedValue: ref.column ? row[ref.column] : row };
  });
  const decision = { ...meta("semanticRequirements", waepaContactDecisionKey), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "contact-product-applicability", status: "documented", value: {
    authority: reference, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["waepa"],
    selected: { phonePage: "membership", selfPhoneOnContact: false, businessAddressProducts: ["di-short-term"], businessAddressForLifeOnly: false, correspondenceQuestion: false },
    sourceReferences: ["Main!R379", "Main!R380"], supersedes: { decisionKey: "business-decision.step1.waepa-contact", only: "Standard WAEPA business-address hiding when STD is selected", preserved: "WAEPA GI hiding and Standard Life-only hiding; existing correspondence choice remains hidden" },
    owners, destinations: refs,
  } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === waepaContactDecisionKey);
  if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
