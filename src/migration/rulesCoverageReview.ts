import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { requirementCoverageDomain, type RequirementCoverage } from "../domain/requirementCoverage";
import { reviewedWorkEligibility } from "./workEligibilityAdoption";

/** An atomic coverage register, separate from rule classification and whole-cell promotion. */
export function addRulesCoverageReview(db: DatabaseSchema) {
  const reviews: RequirementCoverage[] = reviewedWorkEligibility.map(spec => {
    const owner = db.eligibilityConstraints.find(row => row.siteKey === spec.siteKey && row.productKey === spec.productKey && row.applicantTypeKey === "member")!;
    const evidence = db.semanticRequirements.find(row => row.key === `work-eligibility.${spec.siteKey}.${spec.productKey}.member`)?.value as { previous?: number | null } | undefined;
    return { id: `coverage-review.${spec.siteKey}.${spec.productKey}.work-hours`, area: "Eligibility", siteKey: spec.siteKey, productKey: spec.productKey, applicantKey: "member",
      title: spec.hours === null ? "No full-time-work threshold" : `Minimum work requirement of ${spec.hours} hours per week`,
      expectedBehavior: spec.hours === null ? "Do not disqualify this applicant based on hours worked." : `Below ${spec.hours} hours is ineligible; ${spec.hours} or more satisfies this requirement. A missing answer does not establish eligibility. Other eligibility requirements still apply.`,
      finding: evidence?.previous === spec.hours ? "Existing threshold matches the source; boundary and missing-answer checks cover both runtime paths."
        : `Reconciled the inherited ${evidence?.previous ?? "unspecified"} hour value to ${spec.hours ?? "no threshold"} in the owning eligibility constraint.`,
      status: "verified", sourceReferences: [`Main!${spec.cell}`], ruleKeys: ["rule-coverage-product-policy-owners"],
      owners: [{ table: "eligibilityConstraints", key: owner.key, column: "minimumWorkHours" }],
      implementationReferences: ["src/domain/effectiveSite.ts", "src/domain/coverageRequirements.ts", "src/domain/coverageRuntime.ts"],
      verificationReferences: ["src/migration/workEligibilityAdoption.test.ts"] };
  });
  for (const [productKey, cell] of [["di-step-rated", "R118"], ["di-level-rated", "R119"]]) reviews.push({
    id: `coverage-review.ama.${productKey}.active-work`, area: "Eligibility", siteKey: "ama", productKey, applicantKey: "member",
    title: "Actively performing occupation", expectedBehavior: "When DI is selected, ask the approved Yes/No active-work question instead of DI work hours. No makes this DI product ineligible, using the standard category alert. No numeric hours threshold.",
    finding: "Approved October 20 question and eligibility policy execute from stored data; single and mixed category alerts are tested.", status: "verified",
    sourceReferences: [`Main!${cell}`, "User decision October 20, 2026"], ruleKeys: ["rule-coverage-ama-active-work"],
    owners: [{ table: "configurationValues", key: `ama.${productKey}.active-work` }, { table: "configurationValues", key: "ama.coverage-question-overrides" }, { table: "fields", key: "actively-at-work" }],
    implementationReferences: ["src/domain/effectiveSite.ts", "src/config/coverageQuestionRequirements.ts", "src/pages/Coverage.tsx"], verificationReferences: ["src/migration/amaActiveWorkAdoption.test.tsx"] });
  reviews.push({ id: "coverage-review.ama.membership-category-eligibility", area: "Membership", siteKey: "ama", productKey: null, applicantKey: "member",
    title: "Applicant type restricts available coverage categories", expectedBehavior: "Physician: all offered categories. Resident: Life, Disability and Supplemental Health. Student/Retired Physician: Life and Supplemental Health. Spouse of Physician: Life only.",
    finding: "User confirmed the MCR category restrictions on October 20. The captured Site policy controls category presentation and eligibility, and removes incompatible saved elections after applicant type changes.", status: "verified",
    sourceReferences: ["Attestation Online and PDF!C3", "User decision October 20, 2026"], ruleKeys: ["rule-membership-ama-category-eligibility"], owners: [{ table: "configurationValues", key: "ama.applicant-category-eligibility" }],
    implementationReferences: ["src/app/useCoverageState.ts", "src/domain/categoryEligibilityPolicy.ts", "src/domain/effectiveSite.ts"], verificationReferences: ["src/migration/amaCategoryEligibilityAdoption.test.tsx"] });
  for (const [suffix, title, expected] of [
    ["active-uninsured-employee", "Active civilian federal employee not currently insured", "Require affirmation of active civilian federal employment and no current WAEPA insurance before GI application entry."],
    ["employer-details", "GI employer and employment start date", "Collect employer and employment start date for the eligible GI applicant."],
    ["required-acknowledgement", "GI membership acknowledgement", "Require the GI membership truthfulness acknowledgement before continuing."],
  ]) reviews.push({ id: `coverage-review.waepa-gi.${suffix}`, area: "Membership", siteKey: "waepa-gi", productKey: "li-group-term", applicantKey: "member", title,
    expectedBehavior: "Keep the existing generic GI membership question and separate military restriction. Do not add the C125 employer/start-date/acknowledgement entry flow.", finding: `User retained the current generic GI entry on October 20, superseding this source instruction for the template: ${expected}`,
    status: "accepted-exception", sourceReferences: ["Attestation Online and PDF!C125", "User decision October 20, 2026"], ruleKeys: [], owners: [{ table: "sites", key: "waepa-gi" }],
    implementationReferences: ["src/pages/Membership.tsx", "src/domain/applicantExperience.ts"], verificationReferences: ["src/migration/rulesCoverageReview.test.ts"] });
  reviews.push({ id: "coverage-review.waepa-gi.military-answer", area: "Eligibility", siteKey: "waepa-gi", productKey: "li-group-term", applicantKey: "member",
    title: "GI military restriction uses the collected answer", expectedBehavior: "The existing GI military question's Yes disqualifies; No satisfies this restriction. A missing answer requires information.",
    finding: "The coverage adapter now reads GI's existing product-scoped answer. It previously required an uncollected global field after additional eligibility facts were projected.", status: "verified",
    sourceReferences: ["Attestation Online and PDF!C125", "Main!O386"], ruleKeys: ["rule-membership-waepa-active-duty-prevents-application"],
    owners: [{ table: "configurationValues", key: "waepa-gi.li-group-term.military-exclusion" }], implementationReferences: ["src/utils/applicantFacts.ts", "src/domain/coverageRuntime.ts"], verificationReferences: ["src/migration/workEligibilityAdoption.test.ts"] });
  // Other domains remain open; these rows establish only the stated atomic requirements.
  const captured = reviews.map(review => ({ ...review, owners: review.owners.map(owner => {
    const rows = db[owner.table as keyof DatabaseSchema] as Array<{ key: string } & Record<string, unknown>>;
    const row = rows.find(row => row.key === owner.key);
    if (!row || owner.column && row[owner.column] === undefined) throw new Error(`Missing coverage review owner: ${owner.table}/${owner.key}`);
    return { ...owner, reviewedValue: JSON.parse(JSON.stringify(owner.column ? row[owner.column] : row)) as Json };
  }) }));
  for (const review of captured) {
    const metadata = libraryMetadata("semanticRequirements", review.id, review.sourceReferences.join("; "));
    const record = { id: review.id, key: review.id, ...metadata, domain: requirementCoverageDomain, subjectTable: review.owners[0].table,
      subjectKey: review.owners[0].key, predicate: "atomic-rule-requirement-review", status: "documented", value: review as unknown as Json };
    const index = db.semanticRequirements.findIndex(row => row.key === review.id);
    if (index < 0) db.semanticRequirements.push(record); else db.semanticRequirements[index] = record;
  }
}
