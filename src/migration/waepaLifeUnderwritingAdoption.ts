import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
export const waepaLifeUnderwritingDecisionKey = "business-decision.rules-review.waepa-life-underwriting";
export function applyWaepaLifeUnderwritingAdoption(db: DatabaseSchema) {
  const reference = "User decision October 20, 2026; QD LI!J92/O92: WAEPA adult Life QD through age 49 up to $1 million, ages 50–59 up to $500,000; FUW otherwise within approved eligibility";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
  const scopes = [
    { minimumAge: 18, maximumAge: 49, minimumAmount: 0, maximumAmount: 1000000, minimumAmountExclusive: false, pathway: "QD" },
    { minimumAge: 18, maximumAge: 49, minimumAmount: 1000000, maximumAmount: Number.MAX_SAFE_INTEGER, minimumAmountExclusive: true, pathway: "FUW" },
    { minimumAge: 50, maximumAge: 59, minimumAmount: 0, maximumAmount: 500000, minimumAmountExclusive: false, pathway: "QD" },
    { minimumAge: 50, maximumAge: 59, minimumAmount: 500000, maximumAmount: Number.MAX_SAFE_INTEGER, minimumAmountExclusive: true, pathway: "FUW" },
    { minimumAge: 60, maximumAge: 69, minimumAmount: 0, maximumAmount: Number.MAX_SAFE_INTEGER, minimumAmountExclusive: false, pathway: "FUW" },
  ];
  // These are processing bands. Eligibility and permitted benefit amounts are
  // independently enforced by the existing native contracts.
  const bands = ["member", "spouse"].flatMap(applicantTypeKey => scopes.map((band, index) => {
    const key = `waepa.li-group-term.${applicantTypeKey}.reviewed-source-${index + 1}`;
    return { ...meta("underwritingBands", key), siteKey: "waepa", productKey: "li-group-term", applicantTypeKey, ...band, applicantClass: null, mortalityMorbidity: null, conditionKey: null, status: "documented" };
  }));
  db.underwritingBands = db.underwritingBands.filter(row => row.siteKey !== "waepa" || row.productKey !== "li-group-term" || !["member", "spouse"].includes(row.applicantTypeKey ?? ""));
  db.underwritingBands.push(...bands);
  const key = waepaLifeUnderwritingDecisionKey;
  const record = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "life-underwriting", status: "documented", value: {
    authority: "User decision October 20, 2026", approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["QD LI!J92", "QD LI!O92"], selected: bands,
    interpretation: "Adult Life uses QD through age 49 up to $1,000,000 and ages 50–59 up to $500,000; FUW otherwise within the separately approved eligibility and benefit limits. Both processing paths use the full source Life questionnaire.",
    preserved: "Adult eligibility ages 18–69, existing benefit/dependent limits, child routing, WAEPA GI and other Sites. Processing bands do not expand permitted benefits.",
    destinations: bands.map(row => ({ table: "underwritingBands", key: row.key })),
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
