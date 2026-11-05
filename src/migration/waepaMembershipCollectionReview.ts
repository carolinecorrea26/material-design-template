import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { currentMcrSource } from "./currentMcr";
export const waepaMembershipCollectionReviewKey = "business-decision.rules-review.waepa-new-member-collection";
export function applyWaepaMembershipCollectionReview(db: DatabaseSchema) {
  const authority = "Attestation Online and PDF!C122; user confirmation October 21, 2026: truthfulness checkbox is required whenever New Member is selected; retain established setup";
  const note = "Applying for coverage will make you a WAEPA member. Please provide the following information to complete your membership.";
  if (!String(currentMcrSource.cells.find(row => row.sheet === "Attestation Online and PDF" && row.cell === "C122")?.value ?? "").includes(note)) throw new Error("WAEPA new-member note source changed");
  const qualification = db.fields.find(row => row.key === "waepa-attestation"); if (!qualification) throw new Error("Missing WAEPA qualification field");
  qualification.definition.helperText = note;
  const keys = ["membership", "waepa-attestation", "waepa-declaration", "waepa-employer", "waepa-start-date", "waepa-retired-employer", "waepa-retirement-date", "active-military"];
  const owners = [
    ...db.fields.filter(row => keys.includes(row.key)).map(row => ({ table: "fields", key: row.key, reviewedValue: structuredClone(row) })),
    ...db.siteFieldConfigurations.filter(row => row.siteKey === "waepa" && row.pageKey === "membership" && keys.includes(row.fieldKey)).map(row => ({ table: "siteFieldConfigurations", key: row.key, reviewedValue: structuredClone(row) })),
    ...db.conditions.filter(row => ["condition-membership-waepa-new", "condition-waepa-federal-active", "condition-waepa-federal-annuitant"].includes(row.key)).map(row => ({ table: "conditions", key: row.key, reviewedValue: structuredClone(row) })),
    ...db.configurationValues.filter(row => row.key === "site:waepa.applicantExperience.membershipDisqualifications").map(row => ({ table: "configurationValues", key: row.key, reviewedValue: structuredClone(row) })),
  ];
  const key = waepaMembershipCollectionReviewKey;
  const record = { id: key, key, ...libraryMetadata("semanticRequirements", key, authority), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "waepa", predicate: "existing-new-member-collection", status: "documented", value: {
    authority, approvalStatus: "approved", sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", scope: ["waepa"], sourceReferences: ["Attestation Online and PDF!C122"],
    selected: { declarationWhen: "membership=new", declarationRequired: true, independentOfQualification: true, existingQualificationOptions: "six user-approved choices", newMemberNote: note, notePresentation: "qualification helper text", standardSectionTitle: "Additional Membership Information", militaryPage: "membership", memberNumberRequired: false }, owners,
    interpretation: "Preserve the established required truthfulness question whenever New Member is selected, including before a qualification is chosen. Current members do not see it or the new-member qualification form. Active federal employees supply the existing agency dropdown and employment start date; former federal employees have no qualification follow-ups; Associate reference fields retain their separate adoption. Show the source membership explanation with the new-member qualification field, retaining standardized template section naming and Membership military collection. Do not duplicate legacy pages or add a required member number.",
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key); if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
}
