import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";

export const paymentReviewDecisionKey = "business-decision.rules-review.waepa-nso-payment";
export function recordPaymentReviewDecisions(db: DatabaseSchema) {
  const selected = db.configurationValues.filter(row => ["waepa", "waepa-gi", "nso"].includes(row.siteKey ?? "") && row.key.endsWith(".journey-policy")).map(row => {
    if (!isCoverageJourneyPolicy(row.value)) throw new Error(`Invalid payment owner ${row.key}`);
    const { payment, billing } = row.value;
    if (row.siteKey === "nso") {
      if (billing.feePerCollection["bill-me"] !== 0) throw new Error("NSO unconfirmed fee must remain zero");
    } else if (payment.collection !== "required" || !payment.frequencyLocked || payment.methods.length !== 2 || !["bank-account", "credit-card"].every(method => payment.methods.some(option => option.method === method && option.frequencies.length === 1 && option.frequencies[0] === "monthly"))) throw new Error(`WAEPA monthly method choice changed ${row.key}`);
    return { siteKey: row.siteKey!, key: row.key, payment: structuredClone(payment), billing: structuredClone(billing) };
  });
  if (selected.length !== 9) throw new Error("Reviewed WAEPA/NSO payment portfolio changed");
  const key = paymentReviewDecisionKey, authority = "User decision October 20, 2026: retain WAEPA monthly ACH/credit card; NSO zero Direct Bill fee provisionally with confirmation deferred as nonblocking";
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "reviewed-payment-interpretation", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", selected,
    sourceReferences: ["Main!AE379", "Main!AK379", "Main!AE380", "Main!AK380", "Main!AE386", "Main!AK386", "Main!AH318", "Main!AI318"],
    interpretation: "Standard and GI WAEPA retain required monthly ACH/credit-card choices. AE379/AE386 and the approved interpretation supersede the conflicting AK379/AK386 no-credit-card statements. STD retains its explicit credit-card permission. Existing mock payment handling remains separate from processor integration. NSO retains zero collection fees provisionally.",
    feeConfirmation: { status: "deferred-by-user", completionBlocking: false, currentFee: 0, unconfirmedSourceFee: 5, revisitTrigger: "User supplies confirmed NSO Direct Bill fee and collection basis" },
    destinations: selected.map(row => ({ table: "configurationValues", key: row.key, column: row.siteKey === "nso" ? "value.billing.feePerCollection.bill-me" : "value.payment" })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
