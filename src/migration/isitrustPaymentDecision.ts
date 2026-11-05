import type { DatabaseSchema, Json } from "../persistence/types";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { libraryMetadata } from "../domain/provenance";

export const isitrustPaymentDecisionKey = "business-decision.rules-review.isitrust-payment";

/** Record the approved interpretation against existing native payment owners.
 * Processor authorization and delivery remain separate mock service contracts. */
export function recordIsitrustPaymentDecision(db: DatabaseSchema) {
  const values = db.configurationValues.filter(row => row.siteKey === "isitrust" && db.configurationDefinitions.some(definition => definition.key === row.configurationKey && definition.definition.target?.kind === "product-journey-policy"));
  if (values.length !== 10) throw new Error("ISITRUST payment portfolio changed");
  const selected = values.map(row => {
    if (!isCoverageJourneyPolicy(row.value)) throw new Error(`Invalid ISITRUST payment owner ${row.key}`);
    const { payment, billing } = row.value;
    if (payment.collection !== "required" || payment.methods.length !== 2 || !["bank-account", "bill-me"].every(method => payment.methods.some(option => option.method === method && option.frequencies.length === 1 && option.frequencies[0] === "monthly"))) throw new Error(`ISITRUST monthly payment choice changed: ${row.key}`);
    return { key: row.key, payment, billing };
  });
  const reference = "User decision October 20, 2026; Main!AE179:AH185, AE278:AH287";
  const key = isitrustPaymentDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, reference), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "monthly-payment-method-required", status: "documented", value: {
    approvalStatus: "approved", authority: reference, sourceReconciliation: "approved", runtimeActivation: "reviewed-seed", scope: ["isitrust"], associationScope: "All current selectable Associations, including ATPE; product availability remains separately scoped",
    interpretation: "Retain a required monthly ACH or Bill me choice. Skip Payment=Y means no upfront bank collection through Bill me; it does not remove the Payment step. Bill me does not require bank details.",
    selected, destinations: values.map(row => ({ table: "configurationValues", key: row.key, column: "value" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
