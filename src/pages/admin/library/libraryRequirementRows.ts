import { ruleAuthority } from "../../../domain/ruleAuthority";
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import type { ConfigurationDefinitionRow } from '../../../persistence/types';
import type { SnapshotTable } from '../../../persistence/snapshot';
import { resolveEffectiveSite } from '../../../domain/effectiveSite';
import { configurationOwner, configurationPath, flagOwner, primaryConfigurationDefinitions } from '../../../domain/libraryOwnership';
import { storedLibraryRows, type StoredRow } from './storedLibraryModel';
import { humanize, readableValue } from './libraryRecordColumns';

export type LibraryRequirementRow = {
  id: string; key: string; dataset: SnapshotTable; name: string; behavior: string; categories: string[];
  sequence: number; dependsOn: string[]; source: string; site: string; product: string; applicant: string; status: string;
};

export const businessDatasets = [
  ['productApplicantEligibility', 'Availability'], ['eligibilityConstraints', 'Eligibility'], ['residencyRules', 'Eligibility'],
  ['productAmountRules', 'Coverage amounts'], ['riderAmountRules', 'Coverage amounts'], ['planAmountRules', 'Coverage amounts'],
  ['aggregateLimits', 'Coverage limits'], ['maximumPlanRules', 'Coverage limits'], ['coverageDependencies', 'Coverage dependencies'],
  ['benefitPeriodOptions', 'Benefit periods'], ['planBenefitPeriods', 'Benefit periods'], ['underwritingBands', 'Underwriting'],
  ['productRateTables', 'Rates'], ['rateTablePresentations', 'Rates'], ['sitePolicies', 'Payment & membership'],
] as const satisfies ReadonlyArray<readonly [SnapshotTable, string]>;

/** Null remains visible: absent source information must not become a fabricated default. */
export function requirementValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not specified';
  if (Array.isArray(value)) return value.map(requirementValue).join('\n') || 'None recorded';
  if (typeof value === 'object') return Object.entries(value).map(([key, item]) => `${humanize(key)}: ${requirementValue(item)}`).join('\n');
  return readableValue(value);
}
const metadata = new Set(['id', 'key', 'displayId', 'providedBy', 'sourceReference', 'createdAt', 'updatedAt', 'deletedAt', 'position', 'scope', 'siteKey', 'siteId', 'clientKey', 'clientId', 'productKey', 'riderKey', 'applicantTypeKey', 'applicantKey', 'definition']);

export function configurationCategory(row: ConfigurationDefinitionRow): string {
  const kind = row.definition.target?.kind ?? configurationPath(row);
  if (/residency|eligibility|applicants/.test(kind)) return 'Eligibility';
  if (/^coverages\.(enabled|categories)/.test(kind)) return 'Availability';
  if (/rate|rating/.test(kind)) return 'Rates';
  if (/benefit|aggregate|amount-cap|coverageAmounts|coveragePolicy|ranges|PeriodOptions/.test(kind)) return 'Coverage amounts & benefits';
  if (/dependent|selection|requirements/.test(kind)) return 'Coverage dependencies';
  if (/underwriting|coverageQuestions/.test(kind)) return 'Underwriting';
  if (/tpaIntegration/.test(kind)) return 'Verification & integrations';
  if (/payment/.test(kind)) return 'Payment';
  if (/review/.test(kind)) return 'Review & disclosures';
  return 'Application behavior';
}

export function libraryRequirementRows(catalog: LibraryCatalog, siteKey: string): LibraryRequirementRow[] {
  const { data } = catalog;
  const site = siteKey === 'all' ? null : data.sites.find(row => row.key === siteKey);
  if (siteKey !== 'all' && !site) return [];
  const resolved = site ? resolveEffectiveSite(data, siteKey) : null;
  const products = new Set(resolved ? resolved.products.map(row => row.productKey) : data.products.map(row => row.key));
  const riders = new Set(storedLibraryRows(catalog, 'riders', siteKey).map(row => String(row.key)));
  const plans = new Set(data.productCoveragePlans.filter(row => products.has(row.productKey)).map(row => row.planKey));
  const variants = new Set(data.coveragePlanVariants.filter(row => plans.has(row.planKey)).map(row => row.key));
  const source = (row: { sourceReference?: string | null }) => row.sourceReference ?? 'Source not recorded';
  const scope = (row: StoredRow) => String(row.siteKey ?? row.clientKey ?? row.scope ?? 'Global');
  const rows: LibraryRequirementRow[] = [];
  for (const assignment of data.siteProducts.filter(row => !site || row.siteId === site.id)) {
    const assignedSite = data.sites.find(row => row.id === assignment.siteId);
    const applicants = data.siteProductApplicants.filter(row => row.siteKey === assignedSite?.key && row.productKey === assignment.productKey);
    const product = data.products.find(row => row.key === assignment.productKey);
    rows.push({ id: `siteProducts:${assignment.id}`, key: assignment.key ?? assignment.id, dataset: 'siteProducts', name: `${product?.definition.name ?? assignment.productKey} · Site availability`, behavior: `Offered on this site: ${assignment.enabled ? 'Yes' : 'No'}\nAssigned applicant roles: ${applicants.map(row => row.applicantKey).join(', ') || 'None recorded'}\nApplicant eligibility and coverage limits apply separately.`, categories: ['Availability'], sequence: 2000, dependsOn: [], source: assignment.sourceReference ?? 'Source not recorded', site: assignedSite?.key ?? assignment.siteId, product: assignment.productKey, applicant: '', status: assignment.enabled ? 'Enabled assignment' : 'Disabled assignment' });
  }
  const visible = new Set(storedLibraryRows(catalog, 'rules', siteKey).map(row => row.key));
  for (const row of data.rules.filter(row => visible.has(row.key) && (row.definition.documentedIn ?? 'rules') === 'rules')) {
    const rule = row.definition;
    const authority = ruleAuthority(row);
    const assignments = data.ruleAssignments.filter(assignment => assignment.ruleKey === row.key && (!site || assignment.scope === 'global' || assignment.siteKey === siteKey || assignment.scope === 'client' && assignment.clientKey === resolved?.clientKey));
    const predicates = data.rulePredicates.filter(item => item.ruleKey === row.key);
    const actions = data.structuredRuleActions.filter(item => item.ruleKey === row.key);
    const conditions = data.ruleConditions.filter(item => item.ruleKey === row.key).map(item => item.conditionKey);
    const decisions = data.ruleFlags.filter(item => item.ruleKey === row.key).map(({ flagKey, operator, value }) => ({ condition: flagKey, operator, value }));
    rows.push({ id: `rules:${row.key}`, key: row.key, dataset: 'rules', name: rule.rule,
      behavior: [rule.behavior, ...(rule.execution ? [`Routing definition:\n${requirementValue(rule.execution)}`] : []), ...(conditions.length ? [`Conditions: ${conditions.join(', ')}`] : []), ...(decisions.length ? [`Decision inputs:\n${requirementValue(decisions)}`] : []), ...(predicates.length ? [`Inputs / conditions:\n${requirementValue(predicates.map(({ fact, operator, value }) => ({ fact, operator, value })))}`] : []), ...(actions.length ? [`Recorded outcomes (${authority.kind === 'source-pattern' || authority.kind === 'source-reference' ? 'reference model; not a running rule' : 'documentation'}):\n${requirementValue(actions.map(({ actionType, value }) => ({ actionType, value })))}`] : [])].join('\n\n'),
      categories: rule.categories ?? [rule.area], sequence: rule.sequence ?? row.position + 9000, dependsOn: rule.dependsOn ?? [], source: source(row) === 'Source not recorded' || row.sourceReference?.startsWith('prototype:') ? rule.ref : source(row),
      site: assignments.map(item => item.siteKey ?? item.clientKey ?? 'Global').join(', ') || 'Unassigned', product: '', applicant: '', status: rule.documentationStatus === 'planned' ? 'Planned' : resolved?.configuration.routing?.ruleKeys.includes(row.key) ? 'Executable routing rule' : !resolved && rule.execution ? 'Routing definition; assignment required' : authority.kind === 'source-pattern' || authority.kind === 'source-reference' ? authority.label : 'Documented behavior',
    });
  }
  for (const [dataset, category] of businessDatasets) {
    // Site coverage sets are explicit in the resolver. Catalog rows are not inherited policies.
    let records = storedLibraryRows(catalog, dataset, siteKey);
    if (site && !['sitePolicies', 'riderAmountRules', 'planAmountRules', 'planBenefitPeriods', 'residencyRules'].includes(dataset)) records = records.filter(row => row.siteKey === siteKey);
    if (site && dataset === 'riderAmountRules') records = records.filter(row => riders.has(String(row.riderKey)) && (!row.baseProductKey || products.has(String(row.baseProductKey))));
    if (site && (dataset === 'planAmountRules' || dataset === 'planBenefitPeriods')) records = records.filter(row => variants.has(String(row.variantKey)));
    for (const row of records) {
      const criteria: Record<string, unknown> = Object.fromEntries(Object.entries(row).filter(([key]) => !metadata.has(key)));
      if (row.definition) Object.assign(criteria, row.definition);
      if (dataset === 'residencyRules') criteria.jurisdictions = data.residencyJurisdictions.filter(item => item.residencyRuleKey === row.key).map(item => item.jurisdiction);
      if (row.amountPatternKey) {
        const pattern = data.coverageAmountPatterns.find(item => item.key === row.amountPatternKey);
        criteria.amountSchedule = pattern ? Object.fromEntries(Object.entries(pattern).filter(([key]) => !metadata.has(key) && key !== 'patternKey')) : 'Missing amount schedule';
        criteria.bands = data.amountBands.filter(item => item.amountPatternKey === row.amountPatternKey).map(item => ({ minimum: item.minimum, maximum: item.maximum, increment: item.increment, conditionKey: item.conditionKey }));
        criteria.options = data.amountOptions.filter(item => item.amountPatternKey === row.amountPatternKey).map(item => ({ value: item.value, label: item.label }));
      }
      if (dataset === 'aggregateLimits') criteria.conditionalCaps = data.benefitCaps.filter(item => item.aggregateLimitKey === row.key).map(item => Object.fromEntries(Object.entries(item).filter(([key]) => !metadata.has(key))));
      if (row.conditionKey) criteria.condition = data.conditions.find(item => item.key === row.conditionKey)?.definition ?? 'Condition definition not recorded';
      const product = String(row.productKey ?? row.baseProductKey ?? '');
      const subject = data.products.find(item => item.key === product)?.definition.name ?? data.riders.find(item => item.key === row.riderKey)?.definition.name ?? (row.variantKey ? data.coveragePlanVariants.find(item => item.key === row.variantKey)?.name : null) ?? (product || 'Site');
      rows.push({ id: `${dataset}:${row.key}`, key: String(row.key), dataset, name: `${subject} · ${category}`, behavior: requirementValue(criteria), categories: [category], sequence: 5000, dependsOn: [], source: source({ sourceReference: row.sourceReference as string | null }), site: scope(row), product, applicant: String(row.applicantTypeKey ?? row.applicantKey ?? ''), status: String(row.status ?? 'Stored policy') });
    }
  }
  const effective = resolved?.configuration.configurations ?? [];
  for (const definition of primaryConfigurationDefinitions(data.configurationDefinitions).filter(row => configurationOwner(row) === 'rules')) {
    const target = definition.definition.target;
    const product = target && 'productKey' in target ? target.productKey : /^coverages\.(?:coverageAmounts|ranges|overrides)\.([^.]+)/.exec(configurationPath(definition))?.[1] ?? '';
    if (site && product && !products.has(product)) continue;
    const values = site ? effective.filter(row => row.key === definition.key).map(row => ({ key: row.key, value: row.value, provenance: row.provenance, scope: siteKey })) : data.configurationValues.filter(row => row.configurationKey === definition.key).map(row => ({ key: row.key, value: row.value, provenance: [row], scope: row.siteKey ?? row.clientKey ?? 'Global' }));
    for (const value of values) {
      const assignedSite = data.sites.find(row => row.key === value.scope);
      const normalizedAvailability = configurationPath(definition) === 'coverages.enabled' && assignedSite && data.siteProducts.some(row => row.siteId === assignedSite.id);
      // Legacy amount values are compatibility references when a normalized assignment exists.
      const normalizedAmounts = /^coverages\.(coverageAmounts|ranges)\./.test(configurationPath(definition)) && data.productAmountRules.some(row => row.productKey === product && row.siteKey === value.scope);
      rows.push({ id: `configurationValues:${value.key}:${value.scope}`, key: definition.key, dataset: 'configurationValues', name: humanize(target?.kind ?? (configurationPath(definition) || definition.key)), behavior: normalizedAvailability ? 'Compatibility setting. Offered products are specified by the site availability assignments.' : normalizedAmounts ? 'Compatibility setting. Coverage amounts are specified by the normalized amount rules for this product and site.' : requirementValue(value.value), categories: [configurationCategory(definition)], sequence: 5000, dependsOn: [], source: value.provenance.map(source).join('\n'), site: value.scope, product, applicant: target && 'applicantKey' in target ? target.applicantKey : '', status: normalizedAmounts || normalizedAvailability ? 'Compatibility reference' : 'Stored policy' });
    }
  }
  const conditionKeys = new Set(rows.flatMap(row => data.ruleConditions.filter(item => item.ruleKey === row.key).map(item => item.conditionKey)));
  if (resolved) {
    const pageKeys = new Set(resolved.configuration.pages.filter(page => page.requirement !== 'none').map(page => page.key));
    for (const page of resolved.configuration.pages.filter(page => page.requirement !== 'none')) for (const field of page.fields.filter(field => field.included)) if (field.definition.visibilityConditionId) conditionKeys.add(field.definition.visibilityConditionId);
    for (const section of data.pageSections.filter(section => pageKeys.has(section.pageKey))) if (section.definition.visibilityConditionId) conditionKeys.add(section.definition.visibilityConditionId);
  }
  for (const condition of data.conditions.filter(row => !site || conditionKeys.has(row.key))) {
    rows.push({ id: `conditions:${condition.key}`, key: condition.key, dataset: 'conditions', name: 'Shared condition', behavior: requirementValue(condition.definition), categories: ['Conditions & decision outputs'], sequence: 8000, dependsOn: [], source: source(condition), site: 'Shared definition', product: '', applicant: '', status: 'Condition definition' });
  }
  for (const flag of data.flagDefinitions.filter(row => flagOwner(row.persistence) === 'rules')) {
    rows.push({ id: `flagDefinitions:${flag.key}`, key: flag.key, dataset: 'flagDefinitions', name: flag.name, behavior: [flag.description, `Derivation: ${flag.derivation ?? 'Not recorded'}`, `Allowed values: ${requirementValue(flag.allowedValues ?? (flag.valueType === 'boolean' ? [true, false] : null))}`, ...data.flagRules.filter(row => row.flagKey === flag.key).map(row => `When ${row.conditionKey}: ${requirementValue(row.value)} (priority ${row.priority})`)].join('\n'), categories: ['Conditions & decision outputs'], sequence: 8000, dependsOn: [], source: source(flag), site: `${flag.level} · shared definition`, product: '', applicant: '', status: 'Definition; evaluated during the journey' });
  }
  return rows.sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
}
