import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const waepaSpouseMembershipDecisionKey = "business-decision.rules-review.waepa-dependent-spouse-membership";
const reference = "Attestation Online and PDF!C122; user decision October 20, 2026: restrict dependent-spouse coverage when spouse is already or becoming a WAEPA member; preserve separate member/Associate Member applications";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
const message = "A spouse who is currently a WAEPA member or becoming one cannot apply as a dependent spouse. Remove spouse from this application; your spouse may apply separately as an eligible member or Associate Member.";

export function applyWaepaSpouseMembershipAdoption(db: DatabaseSchema) {
  const assignment = { ...meta("siteFieldConfigurations", "site:waepa.eligibility.spouse-membership.include"), position: 30000, scope: "site" as const, siteKey: "waepa", clientKey: null, pageKey: "eligibility", fieldKey: "spouse-membership", include: true, hidden: false, values: { label: "Is your spouse currently a WAEPA member or becoming a WAEPA member?", required: true } };
  const index = db.siteFieldConfigurations.findIndex(row => row.key === assignment.key);
  if (index < 0) db.siteFieldConfigurations.push(assignment); else db.siteFieldConfigurations[index] = assignment;
  const definitions = [
    { key: "shared.li-group-term.spouse.member-eligibility", path: null, target: { kind: "product-eligibility-facts" as const, productKey: "li-group-term", applicantKey: "spouse" } },
    { key: "applicantExperience.eligibilityDisqualifications", path: ["applicantExperience", "eligibilityDisqualifications"], target: null },
  ];
  for (const definition of definitions) if (!db.configurationDefinitions.some(row => row.key === definition.key)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", definition.key), position: 0, definition: { path: definition.path, target: definition.target, metadata: { reusable: true, assignmentRequired: true } } });
  const values = [
    { key: "waepa.li-group-term.spouse.member-eligibility", configurationKey: definitions[0].key, value: [{ fact: "associationMember", equals: false }] },
    { key: "site:waepa.applicantExperience.eligibilityDisqualifications", configurationKey: definitions[1].key, value: [{ applicant: "spouse", fieldId: "spouse-membership", value: "yes", message }] },
  ];
  for (const value of values) {
    const row = { ...meta("configurationValues", value.key), position: 0, scope: "site" as const, siteKey: "waepa", clientKey: null, configurationKey: value.configurationKey, value: value.value as Json };
    const index = db.configurationValues.findIndex(row => row.key === value.key);
    if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
  }
  const key = waepaSpouseMembershipDecisionKey;
  const decision = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "dependent-spouse-membership", status: "documented", value: {
    approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    selected: { field: assignment, values: values.map(row => ({ key: row.key, value: row.value })) },
    sourceReferences: ["Attestation Online and PDF!C122"],
    interpretation: "Require the member/becoming-member Yes/No question in the active spouse section. Yes disables Eligibility advancement and shows the scoped explanation; No satisfies this additional restriction, while other eligibility remains separate. Missing/invalid facts cannot establish dependent-spouse eligibility at Coverage/native validation. Hidden stale spouse answers do not block a member-only application.",
    preserved: "Independent member/Associate Member entry, other WAEPA qualifications, WAEPA GI, other Sites and ABE Review",
    destinations: [{ table: "siteFieldConfigurations", key: assignment.key }, ...values.map(row => ({ table: "configurationValues", key: row.key, column: "value" }))],
  } as unknown as Json };
  const decisionIndex = db.semanticRequirements.findIndex(row => row.key === key);
  if (decisionIndex < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[decisionIndex] = decision;
}
