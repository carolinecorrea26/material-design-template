import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import type { BeneficiaryParticipationPolicy } from "../domain/beneficiaryParticipation";
import { atpeAssociationKey } from "./atpeAssociationAdoption";

export const beneficiaryParticipationDecisionKey = "business-decision.rules-review.beneficiary-participation";
const authority = "User decision October 20, 2026: apply Main!AB126/AB278 adult restrictions and dedicated ATPE Main!AB182/AB184/AB185 participation flags; suppress general ISITRUST AD&D per AB282";
export function applyBeneficiaryParticipationAdoption(db: DatabaseSchema) {
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, authority) });
  const configurationKey = "shared.beneficiary-participation";
  if (!db.configurationDefinitions.some(row => row.key === configurationKey)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", configurationKey), position: 0, definition: { path: null, metadata: { reusable: true, assignmentRequired: true }, target: { kind: "site-beneficiary-participation" } } });
  const general = db.siteAssociations.filter(row => row.siteKey === "isitrust" && row.enabled && row.associationKey !== atpeAssociationKey).map(row => row.associationKey);
  const selected = [
    { siteKey: "ama", policy: { version: 1 as const, rules: [{ productKey: "li-premier-accident", applicantKey: "spouse" as const, collect: false }] } },
    { siteKey: "isitrust", policy: { version: 1 as const, rules: [
      ...(["member", "spouse"] as const).map(applicantKey => ({ productKey: "li-add", applicantKey, associationKeys: general, collect: false })),
      { productKey: "li-group-term", applicantKey: "spouse" as const, associationKeys: general, collect: false },
      ...(["member", "spouse"] as const).flatMap(applicantKey => [
        { productKey: "li-add", applicantKey, associationKeys: [atpeAssociationKey], collect: false },
        { productKey: "sh-critical-illness", applicantKey, associationKeys: [atpeAssociationKey], collect: true },
        { productKey: "li-50plus", applicantKey, associationKeys: [atpeAssociationKey], collect: false },
      ]),
    ] } },
  ] satisfies Array<{ siteKey: string; policy: BeneficiaryParticipationPolicy }>;
  for (const { siteKey, policy } of selected) {
    const key = `${siteKey}.beneficiary-participation`, row = { ...meta("configurationValues", key), position: 0, scope: "site" as const, siteKey, clientKey: null, configurationKey, value: policy as unknown as Json };
    const index = db.configurationValues.findIndex(row => row.key === key);
    if (index < 0) db.configurationValues.push(row); else db.configurationValues[index] = row;
  }
  const key = beneficiaryParticipationDecisionKey, row = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "beneficiary-participation", status: "documented", value: {
    authority, approvalStatus: "approved", runtimeActivation: "reviewed-seed", sourceReconciliation: "approved", selected,
    sourceReferences: ["Main!AB126", "Main!AB278", "Main!AB182", "Main!AB184", "Main!AB185", "Main!AB282"],
    interpretation: "Apply explicit source selection flags through reusable Site/product/applicant/Association rules. ATPE CI participates despite its SH category; ATPE AD&D and Graded Benefit Life do not. General Group Term spouse and AMA dependent Premier Accident spouse do not select beneficiaries. No automatic-beneficiary statement is invented. Existing child rules and other product/applicant collection remain separate.",
    destinations: selected.map(row => ({ table: "configurationValues", key: `${row.siteKey}.beneficiary-participation`, column: "value" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
