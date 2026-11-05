import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";

export const workHoursCollectionDecisionKey = "business-decision.rules-review.category-work-hours-collection";
export function recordWorkHoursCollectionDecision(db: DatabaseSchema) {
  const authority = "User clarification October 21, 2026: work hours apply to DI/OO category selection unless explicitly required more broadly; WAEPA collects only for DI";
  const refs: Array<{ table: keyof DatabaseSchema; key: string }> = [
    { table: "fields", key: "hours-worked-per-week" },
    { table: "configurationDefinitions", key: "coveragePolicy.questionRequirements" },
    { table: "configurationValues", key: "global:*.coveragePolicy.questionRequirements" },
    { table: "pageFields", key: "coverage.hours-worked-per-week" },
    { table: "pageSectionFields", key: "coverage.selfCoverageWorkIncome.hours-worked-per-week" },
    ...db.siteFieldConfigurations.filter(row => ["isitrust", "waepa"].includes(row.siteKey ?? "") && row.fieldKey === "hours-worked-per-week").map(row => ({ table: "siteFieldConfigurations" as const, key: row.key })),
    ...db.eligibilityConstraints.filter(row => row.applicantTypeKey === "member" && (row.siteKey === "isitrust" && ["di-ltd", "di-short-term", "oo-professional"].includes(row.productKey) || row.siteKey === "waepa" && row.productKey === "di-short-term")).map(row => ({ table: "eligibilityConstraints" as const, key: row.key })),
  ];
  const owners = refs.map(ref => {
    const row = (db[ref.table] as Array<{ key: string }>).find(row => row.key === ref.key);
    if (!row) throw new Error(`Missing work-hours owner ${ref.table}/${ref.key}`);
    return { ...ref, reviewedValue: structuredClone(row) };
  });
  const key = workHoursCollectionDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "category-work-hours-collection", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "existing-template", scope: ["isitrust", "waepa"],
    selected: [{ siteKey: "isitrust", categories: ["DI", "OO"], sourceReference: "Attestation Online and PDF!C86" }, { siteKey: "waepa", categories: ["DI"], sourceReference: "Attestation Online and PDF!C122" }],
    page: "coverage", owners, sourceReferences: ["Attestation Online and PDF!C86", "Attestation Online and PDF!C122"],
    supersedes: { previousAnswer: "Collect hours for every ISITRUST member", replacement: "DI/OO category collection; do not add all-product Eligibility collection" },
    interpretation: "Retain the shared member weekly-hours field on Coverage for DI/OO category selection. WAEPA currently offers only DI from those categories. Source collection text is reconciled under this explicit correction, without changing product minimums, spouse requirements, captured application answers, standalone Quote, or separately sourced product exceptions such as AVMA Term Life. A client instruction explicitly requiring broader collection would need its own assignment.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
