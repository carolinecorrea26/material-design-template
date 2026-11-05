/** Step 1 contract. Scope approval does not approve business rules or activate runtime data. */
export const activeSiteMigrationScope = {
  version: 1,
  approvedOn: "2026-10-01",
  approvalReference: "User clarification in the project review: all sites means the sites currently active in the prototype.",
  schemaCompletionScope: {
    confirmedOn: "2026-10-13",
    approvalReference: "User instruction: focus on ASCE and the other main nine or ten Sites already being worked on; fill in the rest later.",
    prioritySiteKey: "asce",
    validationScope: "The ten Sites listed below; shared schema relationships still apply to all stored records.",
    deferredDataPolicy: "Preserve other imported records as source evidence; defer their Site configuration and business accuracy review.",
  },
  sites: [
    // Synthetic runtime/regression example, not an MCR business Site. Keep in
    // technical validation; exclude from the business ownership comparison.
    { key: "demo", clientKey: "demo", mcrRequired: false },
    { key: "abe", clientKey: "abe", mcrRequired: true },
    { key: "ama", clientKey: "ama", mcrRequired: true },
    { key: "asce", clientKey: "asce", mcrRequired: true },
    { key: "avma", clientKey: "avma", mcrRequired: true },
    { key: "csea", clientKey: "csea", mcrRequired: true },
    { key: "nso", clientKey: "nso", mcrRequired: true },
    { key: "isitrust", clientKey: "isitrust", mcrRequired: true },
    { key: "waepa", clientKey: "waepa", mcrRequired: true },
    { key: "waepa-gi", clientKey: "waepa", mcrRequired: true },
  ],
  sources: {
    currentMcr: {
      name: "Master Client Requirements_09_28_2026_v78 (1).xlsx",
      snapshotPath: "src/migration/sources/mcr-v78.json",
      snapshotSha256: "a93cb29e6ed20aa05b67e3bf22bb4554baf3a58ebf5d1df7b539a5466a49471a",
      sha256: "70071168a401dc3b7182f3769f6631cdae5178878495315f58ee920e2b9651ce",
      authority: "Latest MCR supplied and confirmed by the user October 20, 2026. Review current Library Sites only; user decisions and reviewed new-template interpretations take precedence over legacy workarounds.",
      currency: "Confirmed current by the user, October 20, 2026.",
    },
    mcr: {
      name: "04-MCR-new-version-full.xlsx",
      snapshotPath: "src/migration/sources/mcr.json",
      snapshotSha256: "8092f32013e2f74b2996da44cd3621a8ad40c7491f1e0a99a2dbbe525ceb9fe5",
      sha256: "4ff085ca5c52102010e9ea061a630eda41c3347d28f2e3e7a8dba44ef9d8617e",
      authority: "Coverage evidence for the scoped clients; explicit reviewed adoption is required.",
      currency: "Historical compiler baseline; superseded for new review by sources.currentMcr. Retained for captured migration evidence and original source addresses.",
    },
    checklist: {
      name: "05-requirements-to-fill-out-checklist.xlsx",
      sha256: "f13fddee8fe6acf1938454cd4ce1472bc86c7bb71813017afadc2b872c47a638",
      authority: "Completeness and discrepancy evidence; does not override the workbook.",
    },
    prototype: {
      authority: "Current page, field, flow and layout baseline; intentional changes require recorded decisions.",
    },
    decisions: {
      path: "docs/asce-business-decisions.md",
      authority: "Existing approved ASCE decisions apply only to their exact canonical targets.",
    },
  },
  // Source triage hints verified against the pinned Main sheet. These do not
  // approve Client ownership, create Sites or adopt any product configuration.
  clientIdentityReviewHints: [
    { clientKey: "avma", sourceAcronym: "AVMA LIFE", sourceReference: "Main!B187:B198", status: "review-required" },
    { clientKey: "isitrust", sourceAcronym: "ISI", sourceReference: "Main!B278:B287", status: "review-required" },
  ],
  // User confirmed standard CSEA; GI rows remain archived, never standard identity hints.
  excludedIdentityEvidence: [{ siteKey: "csea", sourceReference: "Main!B246:B247", reason: "CSEA GI is not the confirmed standard Site" }],
  deferred: ["Other MCR clients and Sites", "Runtime refactoring and activation", "Visual Site Builder", "Admin login and TOTP"],
} as const;

export const activeMigrationSiteKeys = activeSiteMigrationScope.sites.map(site => site.key);

/** Definitions for the per-product acceptance register, not executable business rules. */
export const coverageAcceptanceDomains = [
  { key: "identity", label: "Product and plan identity", tables: ["products", "productIdentifiers"], acceptance: "Reviewed Client/Site/product/plan mapping with G-number, plan-code and applicant/class variants; no ambiguous ownership." },
  { key: "applicants", label: "Applicant availability", tables: ["siteProductApplicants", "productApplicantEligibility"], acceptance: "Explicit member, spouse and child availability, including applicable classes and conditional assignments." },
  { key: "eligibility", label: "Eligibility", tables: ["eligibilityConstraints"], acceptance: "Reviewed age basis and boundaries, child/student/marital/work restrictions, and missing-fact behavior." },
  { key: "amounts", label: "Coverage amounts", tables: ["productAmountRules"], acceptance: "Reviewed ranges, increments, lists, formulas and derivations, including boundaries and dependent values." },
  { key: "limits", label: "Dependencies and limits", tables: ["coverageDependencies", "maximumPlanRules", "aggregateLimits"], acceptance: "Explicit applicability for dependencies, maximum plans, aggregate limits and ordered benefit caps." },
  { key: "underwriting", label: "Underwriting", tables: ["underwritingBands"], acceptance: "Reviewed pathways and applicant/class/age/amount bands; unresolved cases cannot inherit an approval." },
  { key: "riders", label: "Riders", tables: ["productRiders"], acceptance: "Reviewed enabled riders, applicants, amounts, derivations, eligibility and pricing availability." },
  { key: "residency", label: "Residency", tables: ["residencyRules"], acceptance: "Reviewed Site and product exclusions, jurisdiction applicability and effective conditions." },
  { key: "periods", label: "Waiting and benefit periods", tables: ["benefitPeriodOptions", "productCoveragePlans"], acceptance: "Reviewed selectable and mandatory periods, plan variants, combinations and conditional packages." },
  { key: "questions", label: "Question sets", tables: ["productQuestionSets"], acceptance: "Reviewed health, financial, tobacco and attestation versions, field mappings and conditional visibility/requiredness." },
  { key: "payment", label: "Payment", tables: [], acceptance: "Reviewed payment/skip rules, methods, frequency, billing fees and processor applicability." },
  { key: "documents", label: "Documents", tables: ["documentDefinitions"], acceptance: "Reviewed application forms, disclosures, consent, brochures and beneficiary requirements with exact versions or explicit missing assets." },
  { key: "rates", label: "Rates", tables: ["productRateTables"], acceptance: "Authoritative rate inputs and dimensions with calculation tests, or an approved unavailable outcome that suppresses prices." },
] as const;
