import type { ConfigurationDefinitionRow, ConfigurationTarget } from '../persistence/types';
import type { SnapshotTable } from '../persistence/snapshot';

/** Logical ownership is independent from storage. Shared/legacy tables are classified per row. */
export const libraryOwners = {
  'client-information': ['organizations', 'organizationProfiles', 'clients', 'sites', 'associations', 'siteAssociations', 'associationEntities', 'associationAliases', 'associationAffiliations', 'siteAssociationContexts', 'siteEnvironmentLinks', 'supportProfiles'],
  components: ['components'],
  pages: ['pages', 'sitePages', 'pageSections'],
  fields: ['fields', 'pageFields', 'pageSectionFields', 'siteFieldConfigurations', 'questionDefinitions', 'questionSets', 'questionSetQuestions', 'questionSetFields', 'productQuestionSets'],
  flows: ['flows', 'siteFlows', 'flowSteps', 'flowTransitions'],
  products: ['coverageCategories', 'products', 'riders', 'productRiders', 'siteRiders', 'productIdentifiers', 'productConfigurationValues', 'coveragePlanDefinitions', 'coveragePlanVariants', 'productCoveragePlans'],
  rules: ['rules', 'ruleAssignments', 'ruleConditions', 'ruleActions', 'conditions', 'rulePredicates', 'structuredRuleActions', 'siteProducts', 'siteProductApplicants', 'productApplicantEligibility', 'eligibilityConstraints', 'residencyRules', 'residencyJurisdictions', 'productAmountRules', 'coverageAmountPatterns', 'amountBands', 'amountOptions', 'riderAmountRules', 'planAmountRules', 'planBenefitPeriods', 'aggregateLimits', 'benefitCaps', 'benefitPeriodOptions', 'underwritingBands', 'coverageDependencies', 'maximumPlanRules', 'rateTables', 'productRateTables', 'rateTablePresentations', 'sitePolicies'],
  configurations: ['configurationDefinitions', 'configurationValues'],
  'url-parameters': ['urlParameters', 'urlParameterValues', 'siteUrlParameters'],
  validation: ['validationRules'],
  features: ['features', 'siteFeatures'],
  content: ['contentEntries', 'contentValues', 'documentDefinitions', 'siteDocuments'],
  communications: ['emailTemplates', 'siteEmailTemplates'],
  themes: ['brandingProfiles'],
  accessibility: [],
  analytics: [],
  // These relationships remain intact. Their business meaning appears in its owning view.
  shared: ['patterns', 'patternAssignments', 'patternRules', 'patternConditions', 'patternFlagDefinitions', 'patternFlows', 'patternProducts', 'patternCoverageCategories', 'patternConfigurationDefinitions', 'flagDefinitions', 'flagValues', 'flagAssignments', 'flagRules', 'ruleFlags'],
  evidence: ['semanticRequirements', 'provenanceTags'],
} as const satisfies Record<string, readonly SnapshotTable[]>;

export type LibraryOwner = Exclude<keyof typeof libraryOwners, 'shared' | 'evidence'>;
export const ownerLabels: Record<LibraryOwner, string> = {
  'client-information': 'Client information', components: 'Components', pages: 'Pages', fields: 'Fields', flows: 'Flows',
  products: 'Products & riders', rules: 'Business rules', configurations: 'Configurations', 'url-parameters': 'URL parameters',
  validation: 'Validations', accessibility: 'Accessibility', analytics: 'Analytics', features: 'Features', content: 'Content', communications: 'Emails', themes: 'Branding & Design',
};

const targetOwners = {
  'field-definition-ownership': 'fields',
  'site-page-participation': 'pages',
  'site-product-availability': 'products',
  'site-structure-ownership': 'fields',
  'site-routing-policy': 'rules',
  'site-life-aggregate-participation': 'rules', 'product-rate-modifier-policy': 'rules', 'site-review-policy': 'rules',
  'product-rate-input-policy': 'rules', 'product-journey-policy': 'rules', 'product-selection-policy': 'rules',
  'site-rate-presentation': 'configurations', 'product-reference-rate-table': 'rules', 'product-presentation': 'products',
  'product-rider-set': 'products', 'product-rider-override': 'products', 'product-rate-outcome': 'rules', 'product-rating-adjustments': 'rules',
  'product-residency-policy': 'rules', 'product-benefit-policy': 'rules', 'product-dependent-policy': 'rules',
  'site-life-aggregate': 'rules', 'product-eligibility-facts': 'rules', 'product-amount-cap-policy': 'rules',
} as const satisfies Record<ConfigurationTarget['kind'], LibraryOwner>;

export function configurationPath(row: ConfigurationDefinitionRow): string {
  const metadata = row.definition.metadata;
  const name = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata.name : null;
  return row.definition.path?.join('.') ?? (typeof name === 'string' ? name.replace(/^ClientConfig\./, '') : '');
}

/** A policy stored in configurationValues still has business ownership. No values are copied. */
export function configurationOwner(row: ConfigurationDefinitionRow): LibraryOwner {
  if (row.definition.target) return targetOwners[row.definition.target.kind];
  const path = configurationPath(row);
  if (/^(branding|theme)(\.|$)/.test(path)) return 'themes';
  if (/^(support|licenseInfo)(\.|$)/.test(path)) return 'client-information';
  if (/^pages(\.|$)/.test(path)) return 'pages';
  if (/^(fields|fieldSurfaces|fieldCollections)(\.|$)/.test(path)) return 'fields';
  if (/^flows(\.|$)/.test(path)) return 'flows';
  if (/^coverages\.(enabled|categories)(\.|$)/.test(path)) return 'rules';
  if (/^(coveragePolicy|coverageQuestions|reviewPolicy|routingGates|tpaIntegration|paymentPolicy|coveragePortfolioPolicy)(\.|$)/.test(path)) return 'rules';
  if (/^coverages\.(coverageAmounts|ranges)(\.|$)/.test(path)) return 'rules';
  if (/^coverages\.overrides\.[^.]+\.(requirements|underwritingType|underwritingBands|applicants|waitingPeriodOptions|maxBenefitPeriodOptions|coverageAmounts)(\.|$)/.test(path)) return 'rules';
  return 'configurations';
}

export function flagOwner(persistence: string): 'configurations' | 'rules' | 'flows' {
  if (persistence === 'configuration') return 'configurations';
  if (persistence === 'application-record') return 'flows';
  return 'rules';
}

/** Deduplicate schema descriptions of the same path; prefer the actual value-bearing definition. */
export function primaryConfigurationDefinitions(rows: ConfigurationDefinitionRow[]): ConfigurationDefinitionRow[] {
  const actualPaths = new Set(rows.filter(row => row.definition.path).map(configurationPath));
  return rows.filter(row => row.definition.path || !configurationPath(row) || !actualPaths.has(configurationPath(row)))
    .filter(row => configurationPath(row) !== 'features.defaultTemplate');
}
