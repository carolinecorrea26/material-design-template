import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const waepaReferralDecisionKey = "business-decision.rules-review.waepa-referral";
const reference = "Attestation Online and PDF!C125; user clarification October 20, 2026: TV, Radio, Newspaper; Membership Information for new WAEPA members; user clarification October 26, 2026: required multiselect dropdown";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
export function applyWaepaReferralAdoption(db: DatabaseSchema) {
  const fieldKey = "membership-referral-source";
  const field = { ...meta("fields", fieldKey), position: 30001, definition: { id: fieldKey, label: "How did you hear about WAEPA? (select all that apply)", inputType: "multi-select" as const, required: true,
    options: [{ value: "tv", label: "TV" }, { value: "radio", label: "Radio" }, { value: "newspaper", label: "Newspaper" }] } };
  const conditionKey = "condition-membership-confirmed-new";
  const condition = { ...meta("conditions", conditionKey), position: 30001, definition: { id: conditionKey, match: "all" as const, conditions: [{ fieldId: "membership" as const, operator: "equals" as const, value: "yes" }, { fieldId: "membership-status" as const, operator: "equals" as const, value: "new" }] } };
  const status = { ...meta("fields", "membership-status"), position: 30001, definition: { id: "membership-status", label: "Are you a current WAEPA member, or are you becoming a new member?", inputType: "radio" as const, required: true, visibilityConditionId: "condition-membership-confirmed" as const, options: [{ value: "new", label: "New Member" }, { value: "current", label: "Current Member" }] } };
  const assignments = [
    ...(["waepa", "waepa-gi"] as const).map(siteKey => ({ ...meta("siteFieldConfigurations", `site:${siteKey}.membership.membership-referral-source.include`), position: 30002, scope: "site" as const, siteKey, clientKey: null, pageKey: "membership", fieldKey, include: true, hidden: false, values: { visibilityConditionId: siteKey === "waepa" ? "condition-membership-waepa-new" : conditionKey } })),
    { ...meta("siteFieldConfigurations", "site:waepa-gi.membership.membership-status.include"), position: 30001, scope: "site" as const, siteKey: "waepa-gi", clientKey: null, pageKey: "membership", fieldKey: "membership-status", include: true, hidden: false, values: {} },
  ];
  for (const [table, record] of [["fields", field], ["fields", status], ["conditions", condition], ...assignments.map(row => ["siteFieldConfigurations", row] as const)] as const) {
    const rows = db[table] as Array<{ key: string }>;
    const index = rows.findIndex(row => row.key === record.key);
    if (index < 0) rows.push(record); else rows[index] = record;
  }
  const key = waepaReferralDecisionKey;
  const record = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "membership-referral-collection", status: "documented", value: {
    approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    selected: { field, status, condition, assignments }, sourceReferences: ["Attestation Online and PDF!C125"],
    interpretation: "Collect TV, Radio and Newspaper selections in a required multiselect dropdown in Membership Information for new members on both WAEPA Sites. Require at least one configured choice. GI adds a required new/current status question after its existing Yes gate; this status controls referral visibility only and does not replace eligibility. Shared field placement stays standardized.",
    destinations: [{ table: "fields", key: fieldKey }, { table: "fields", key: status.key }, { table: "conditions", key: condition.key }, ...assignments.map(row => ({ table: "siteFieldConfigurations", key: row.key }))],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
