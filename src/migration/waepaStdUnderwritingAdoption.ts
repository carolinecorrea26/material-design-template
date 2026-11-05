import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";

export const waepaStdUnderwritingDecisionKey = "business-decision.rules-review.waepa-std-underwriting";
const reference = "User decision October 20, 2026; QD DI!J15/O15; Main!U380/Z380/AA380: WAEPA STD QD ages 17–49, FUW ages 50–69; existing DI questions provisional for longer flow";
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
export function applyWaepaStdUnderwritingAdoption(db: DatabaseSchema) {
  const policy = db.configurationValues.find(row => row.key === "waepa.di-short-term.journey-policy");
  if (!policy || !isCoverageJourneyPolicy(policy.value)) throw new Error("Missing native WAEPA STD journey policy");
  policy.value.healthPageByUnderwriting = { QD: "health-qd", FUW: "health-di" };
  // Reuse the canonical age/amount contract consumed by every Site. The Site
  // column is the explicit assignment; no Site-name runtime branch is needed.
  const bands = ([{ minimumAge: 17, maximumAge: 49, pathway: "QD" }, { minimumAge: 50, maximumAge: 69, pathway: "FUW" }] as const).map(band => {
    const key = `waepa.di-short-term.member.reviewed-${band.pathway.toLowerCase()}`;
    return { ...meta("underwritingBands", key), siteKey: "waepa", productKey: "di-short-term", applicantTypeKey: "member", ...band, minimumAmount: 100, maximumAmount: 6500, minimumAmountExclusive: false, applicantClass: null, mortalityMorbidity: null, conditionKey: null, status: "documented" };
  });
  const firstBand = db.underwritingBands.findIndex(row => row.siteKey === "waepa" && row.productKey === "di-short-term");
  db.underwritingBands = db.underwritingBands.filter(row => row.siteKey !== "waepa" || row.productKey !== "di-short-term");
  db.underwritingBands.splice(firstBand < 0 ? db.underwritingBands.length : firstBand, 0, ...bands);
  const key = waepaStdUnderwritingDecisionKey;
  const record = { ...meta("semanticRequirements", key), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "std-underwriting", status: "documented", value: {
    approvalStatus: "approved", authority: "User decision October 20, 2026", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed",
    sourceReferences: ["QD DI!J15", "QD DI!O15", "Main!U380", "Main!Z380", "Main!AA380"],
    selected: { bands, questions: policy.value.questions, healthPageByUnderwriting: policy.value.healthPageByUnderwriting },
    interpretation: "Use QD at ages 17–49 and FUW at 50–69 across permitted STD amounts. QD is a processing page without a health questionnaire; FUW uses existing DI questions provisionally. Review participation follows actual health questions. Supporting QD DI evidence and this decision resolve the conflicting Main No QD flag.",
    preserved: "Eligibility ages 17–69, 30-hour work rule, existing amount/income limits and other Sites",
    questionnaireStatus: "accepted-provisional-existing-DI-questionnaire",
    revisitTrigger: "Corrected authoritative WAEPA STD questionnaire or underwriting instructions become available",
    destinations: [...bands.map(row => ({ table: "underwritingBands", key: row.key })), { table: "configurationValues", key: policy.key, column: "value" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
