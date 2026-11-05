import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const cseaDependentBenefitDecisionKey = "business-decision.rules-review.csea-optional-dependent-benefits";
/** Preserve the approved existing controls. This does not certify the unresolved
 * CSEA program identity, pricing, or a separate collected age attestation. */
export function recordCseaDependentBenefitInterpretation(db: DatabaseSchema) {
  const key = cseaDependentBenefitDecisionKey;
  const authority = "User decisions October 21, 2026: keep CSEA spouse/child benefits optional; retain displayed under-19 note as a provisional exception to explicit child age confirmation";
  const owners = [
    ...db.riders.filter(row => ["csea.spouse-accident", "csea.child-outpatient"].includes(row.key)).map(row => ({ table: "riders", key: row.key, reviewedValue: structuredClone(row) })),
    ...db.productRiders.filter(row => row.siteKey === "csea" && row.productKey === "di-ltd" && ["csea.spouse-accident", "csea.child-outpatient"].includes(row.riderKey)).map(row => ({ table: "productRiders", key: row.key, reviewedValue: structuredClone(row) })),
  ];
  if (owners.length !== 4) throw new Error("Missing current CSEA dependent benefit owners");
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "csea", predicate: "optional-dependent-benefits", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["csea"], productKeys: ["di-ltd"], sourceReferences: ["Main!I246", "Main!J246", "Attestation Online and PDF!C69"],
    selected: { spouseOptional: true, spouseAmounts: [500, 1000], childOptional: true, childFixedBenefit: 50, childMaximumAgeYears: 18, visitsPerYear: 2, individualChildRecords: false, defaults: "preserve-current", childAgeCollection: "notice-only-provisional", explicitAgeConfirmation: false },
    completionBlocking: false, acceptedProvisionalException: { requirementId: "atomic.csea.di-ltd.child-age-attestation", currentBehavior: "Displayed under-19 note without an explicit confirmation checkbox", revisitTrigger: "User requests explicit age confirmation or provides corrected CSEA requirements", completionBlocking: false },
    owners, destinations: owners.map(({ table, key }) => ({ table, key })),
    supersededRequirementIds: ["atomic.csea.di-ltd.spouse-selected-locked"],
    interpretation: "Keep both attached benefit checkboxes editable, preserve current defaults, and permit independent opt-outs. Spouse offers $500/$1,000; child has a fixed $50 benefit with no amount control, under-19 eligibility and two visits per year. Preserve spouse details when selected and no individual child records. User explicitly accepts the displayed under-19 note without a collected confirmation as a provisional exception. Do not report the source checkbox as implemented or synthesize an attested answer. CSEA identity remains separately flagged.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(record => record.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
