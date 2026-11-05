// Data-only table views over one saved catalog. No renderer or browser imports.
/** Explicit allowlist: compatibility blobs and extraction tables cannot enter resolution. */
export const effectiveConfigurationTables = [
  "coveragePlanDefinitions", "coveragePlanVariants", "productCoveragePlans", "planAmountRules", "planBenefitPeriods",
  "pageSections", "pageSectionFields", "questionSets", "questionDefinitions", "questionSetQuestions", "questionSetFields", "productQuestionSets",
  "products", "coverageCategories", "productConfigurationValues", "productIdentifiers",
  "underwritingBands", "residencyRules", "residencyJurisdictions", "productApplicantEligibility", "coverageDependencies", "maximumPlanRules", "aggregateLimits", "benefitCaps", "benefitPeriodOptions",
  "productAmountRules", "coverageAmountPatterns", "amountBands", "amountOptions",
  "riders", "productRiders", "siteRiders", "riderAmountRules", "rateTables", "productRateTables", "rateTablePresentations",
  "pages", "sitePages", "fields", "pageFields", "siteFieldConfigurations", "validationRules",
  "flows", "siteFlows", "flowSteps", "flowTransitions", "conditions", "rules", "ruleAssignments", "ruleConditions", "ruleActions",
  "configurationDefinitions", "configurationValues", "contentEntries", "contentValues", "brandingProfiles", "supportProfiles", "features", "siteFeatures",
] as const;

export const effectiveSiteSnapshotTables = [...effectiveConfigurationTables, "sites", "clients", "organizations", "organizationProfiles", "siteProducts", "siteProductApplicants", "eligibilityConstraints", "semanticRequirements", "associations", "siteAssociations", "sitePolicies"] as const;

/** Read boundary only. Raw extraction, compatibility blobs and operational data are excluded. */
export const normalizedSnapshotTables = [
  'associationEntities', 'associationAliases', 'associationAffiliations', 'siteAssociationContexts',
  ...effectiveConfigurationTables, "components",
  "sites", "clients", "siteProducts", "siteProductApplicants", "eligibilityConstraints", "semanticRequirements",
  "organizations", "organizationProfiles", "associations", "siteAssociations", "sitePolicies", "siteEnvironmentLinks",
  "emailTemplates", "siteEmailTemplates", "documentDefinitions", "siteDocuments",
  "urlParameters", "urlParameterValues", "siteUrlParameters",
  "patterns", "patternAssignments", "patternRules", "patternConditions", "patternFlagDefinitions", "patternFlows", "patternProducts", "patternCoverageCategories", "patternConfigurationDefinitions",
  "flagDefinitions", "flagValues", "flagAssignments", "flagRules", "ruleFlags", "rulePredicates", "structuredRuleActions", "provenanceTags",
] as const;
