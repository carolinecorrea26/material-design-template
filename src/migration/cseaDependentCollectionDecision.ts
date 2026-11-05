import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { cseaDependentBenefitDecisionKey } from "./cseaDependentBenefitInterpretation";
export const cseaDependentCollectionDecisionKey = "business-decision.rules-review.csea-standard-dependent-collection";
export function recordCseaDependentCollectionDecision(db: DatabaseSchema) {
  const authority = "Attestation Online and PDF!C69; user decision October 21, 2026: keep standard spouse name/DOB fields; earlier approved no individual child records and provisional age note remain separate";
  const keys = ["spouse-first-name", "spouse-last-name", "spouse-birth-date"];
  const refs: Array<{ table: keyof DatabaseSchema; key: string }> = [
    ...db.fields.filter(row => keys.includes(row.key)).map(row => ({ table: "fields" as const, key: row.key })),
    ...db.pageFields.filter(row => row.pageKey === "eligibility" && keys.includes(row.fieldKey)).map(row => ({ table: "pageFields" as const, key: row.key })),
    ...db.pageSectionFields.filter(row => row.sectionKey === "eligibility.spouseSection" && keys.includes(row.fieldKey)).map(row => ({ table: "pageSectionFields" as const, key: row.key })),
    ...db.pageSections.filter(row => ["eligibility.spouseSection", "eligibility.childSection"].includes(row.key)).map(row => ({ table: "pageSections" as const, key: row.key })),
    ...db.conditions.filter(row => ["condition-spouse-selected", "condition-child-selected"].includes(row.key)).map(row => ({ table: "conditions" as const, key: row.key })),
    { table: "configurationValues", key: "csea.applicant-experience" },
  ];
  const owners = refs.map(ref => {
    const row = (db[ref.table] as Array<{ key: string }>).find(row => row.key === ref.key); if (!row) throw new Error(`Missing CSEA collection owner ${ref.key}`);
    return { ...ref, reviewedValue: structuredClone(row) };
  });
  const key = cseaDependentCollectionDecisionKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "csea", predicate: "standard-dependent-eligibility-collection", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "existing-template", scope: ["csea"], sourceReferences: ["Attestation Online and PDF!C69"],
    selected: { spouseFields: keys, pageKey: "eligibility", omittedLegacyNameParts: ["title", "middle-initial", "suffix"], individualChildRecords: false },
    retainedDecision: cseaDependentBenefitDecisionKey, owners,
    interpretation: "Keep the standardized required spouse First Name, Last Name and Date of Birth in the visible spouse Eligibility section. The user supersedes legacy title/middle-initial/suffix collection for current CSEA. No individual child records are collected for its attached outpatient benefit. The displayed under-19 note remains the separately approved provisional exception; do not fabricate a collected age attestation. Optional benefit elections, defaults and amounts retain their own owners.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
