import type { DatabaseSchema } from '../persistence/types';
import type { SnapshotTable } from '../persistence/snapshot';

type CatalogData = Pick<DatabaseSchema, SnapshotTable>;
const internalSource = (value: string) => /src\/(?:pages\/admin\/|components\/admin\/|admin\/|pages\/(?:PortalAdmin|PortalTemplateProject|PortalRequirementsProject|SiteDetails|SiteFeatures|Cms|DesignSystem))/.test(value);
const internalRoute = (value: string) => /^\/(?:admin-center|portal-admin|site-details|design-system|portal-template-project|portal-requirements-project|mock-email-preview)(?:[/?#]|$)/.test(value);

/** Portal browsing is a projection. Operational definitions remain available to their own screens. */
export function portalLibraryData(data: CatalogData): CatalogData {
  const result = { ...data };
  const internalPages = new Set(data.pages.filter(page => page.definition.flow === 'internal' || page.definition.type === 'internal' || internalRoute(page.definition.path)).map(page => page.key));
  const sectionKeys = new Set(data.pageSections.filter(section => internalPages.has(section.pageKey)).map(section => section.key));
  const internalFields = new Set(data.fields.filter(field => {
    const placements = [...data.pageFields.filter(row => row.fieldKey === field.key).map(row => row.pageKey), ...data.pageSectionFields.filter(row => row.fieldKey === field.key).flatMap(row => data.pageSections.filter(section => section.key === row.sectionKey).map(section => section.pageKey))];
    return placements.length > 0 && placements.every(key => internalPages.has(key));
  }).map(field => field.key));
  const internalConditions = new Set(data.conditions.filter(condition => condition.definition.conditions.length > 0 && condition.definition.conditions.every(clause => internalFields.has(clause.fieldId))).map(condition => condition.key));
  const internalRules = new Set(data.rules.filter(rule => {
    const refs = rule.definition.ref.split(';').map(ref => ref.trim()).filter(Boolean);
    const conditions = data.ruleConditions.filter(row => row.ruleKey === rule.key);
    return refs.length > 0 && refs.every(internalSource) || conditions.length > 0 && conditions.every(row => internalConditions.has(row.conditionKey));
  }).map(rule => rule.key));
  const internalConfigurations = new Set(data.configurationDefinitions.filter(row => {
    const path = row.definition.path ?? [];
    const metadata = row.definition.metadata as Record<string, unknown> | null;
    return ['admin', 'adminCenter', 'portalAdmin', 'devtools'].includes(path[0]) || internalSource(String(metadata?.sourcePath ?? ''));
  }).map(row => row.key));
  const internalContent = new Set(data.contentEntries.filter(row => (row.definition.path ?? []).some(part => internalPages.has(part) || ['adminCenter', 'portalAdmin'].includes(part))).map(row => row.key));
  const internalFeatures = new Set(data.features.filter(row => /href=["']\/(?:admin-center|portal-admin)(?:[/?#"'])/.test(row.definition.impactedAreasHtml)).map(row => row.key));
  const internalFlowSteps = new Set(data.flowSteps.filter(row => row.definition.pageId && internalPages.has(row.definition.pageId)).map(row => row.key));
  result.pages = data.pages.filter(row => !internalPages.has(row.key));
  result.pageSections = data.pageSections.filter(row => !internalPages.has(row.pageKey));
  result.sitePages = data.sitePages.filter(row => !internalPages.has(row.pageKey));
  result.fields = data.fields.filter(row => !internalFields.has(row.key));
  result.pageFields = data.pageFields.filter(row => !internalPages.has(row.pageKey) && !internalFields.has(row.fieldKey));
  result.pageSectionFields = data.pageSectionFields.filter(row => !sectionKeys.has(row.sectionKey) && !internalFields.has(row.fieldKey));
  result.siteFieldConfigurations = data.siteFieldConfigurations.filter(row => !internalPages.has(row.pageKey) && !internalFields.has(row.fieldKey));
  result.validationRules = data.validationRules.filter(row => !internalFields.has(row.fieldKey));
  result.conditions = data.conditions.filter(row => !internalConditions.has(row.key));
  result.rules = data.rules.filter(row => !internalRules.has(row.key));
  result.ruleConditions = data.ruleConditions.filter(row => !internalRules.has(row.ruleKey) && !internalConditions.has(row.conditionKey));
  result.ruleActions = data.ruleActions.filter(row => !internalRules.has(row.ruleKey));
  result.ruleAssignments = data.ruleAssignments.filter(row => !internalRules.has(row.ruleKey));
  result.rulePredicates = data.rulePredicates.filter(row => !internalRules.has(row.ruleKey));
  result.structuredRuleActions = data.structuredRuleActions.filter(row => !internalRules.has(row.ruleKey));
  result.ruleFlags = data.ruleFlags.filter(row => !internalRules.has(row.ruleKey));
  result.flagRules = data.flagRules.filter(row => !internalConditions.has(row.conditionKey));
  result.patternRules = data.patternRules.filter(row => !internalRules.has(row.relatedKey));
  result.patternConditions = data.patternConditions.filter(row => !internalConditions.has(row.relatedKey));
  result.configurationDefinitions = data.configurationDefinitions.filter(row => !internalConfigurations.has(row.key));
  result.configurationValues = data.configurationValues.filter(row => !internalConfigurations.has(row.configurationKey));
  result.contentEntries = data.contentEntries.filter(row => !internalContent.has(row.key));
  result.contentValues = data.contentValues.filter(row => !internalContent.has(row.contentKey));
  result.features = data.features.filter(row => !internalFeatures.has(row.key));
  result.siteFeatures = data.siteFeatures.filter(row => !internalFeatures.has(row.featureKey));
  result.flowSteps = data.flowSteps.filter(row => !internalFlowSteps.has(row.key));
  result.flowTransitions = data.flowTransitions.filter(row => !internalFlowSteps.has(row.sourceStepKey) && !internalFlowSteps.has(row.targetStepKey));
  const internalFlows = new Set(data.flows.filter(flow => {
    const steps = data.flowSteps.filter(step => step.flowKey === flow.key);
    return steps.length > 0 && steps.every(step => internalFlowSteps.has(step.key));
  }).map(flow => flow.key));
  result.flows = data.flows.filter(row => !internalFlows.has(row.key));
  result.siteFlows = data.siteFlows.filter(row => !internalFlows.has(row.flowKey));
  result.components = data.components.filter(row => !internalSource(row.definition.source));
  return result;
}
