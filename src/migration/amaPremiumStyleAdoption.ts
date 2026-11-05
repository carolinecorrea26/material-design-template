import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const amaPremiumStyleDecisionKey = "business-decision.rules-review.ama-premium-style";
export function applyAmaPremiumStyleAdoption(db: DatabaseSchema) {
  const authority = "User decision October 20, 2026; Attestation Online and PDF!C3: one AMA premium style per application, retaining separate Coverage cards";
  const owners = ["di-step-rated", "di-level-rated"].map((productKey, index, products) => {
    const key = `ama.${productKey}.reviewed-benefit-policy`;
    const row = db.configurationValues.find(row => row.key === key);
    if (!row?.value || typeof row.value !== "object" || Array.isArray(row.value) || !Array.isArray(row.value.exclusiveProducts)) throw new Error(`Missing AMA benefit owner ${key}`);
    row.value.exclusiveProducts = [products[1 - index]];
    return { table: "configurationValues", key, column: "value", reviewedValue: structuredClone(row.value) };
  });
  const key = amaPremiumStyleDecisionKey;
  const row = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "ama", predicate: "premium-style-exclusive", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    sourceReferences: ["Attestation Online and PDF!C3"], selected: "One premium style per application, including different applicants; the applicant must remove the other style before continuing. Preserve both Coverage cards and saved answers.", owners,
    destinations: owners.map(({ table, key, column }) => ({ table, key, column })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(row); else db.semanticRequirements[index] = row;
}
