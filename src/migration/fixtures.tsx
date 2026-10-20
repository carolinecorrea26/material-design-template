import { consolidateRuleDocumentationOwnership } from "./ruleDocumentationOwnership";
import { consolidateSiteStructureOwnership } from "./siteStructureOwnership";
import { consolidateProductAvailabilityOwnership } from "./productAvailabilityOwnership";
import { consolidateRequiredFieldOwnership } from "./requiredFieldOwnership";
import { consolidateFieldDefinitionOwnership } from "./fieldDefinitionOwnership";
import { consolidatePageParticipationOwnership } from "./pageParticipationOwnership";
import { consolidateRoutingRuleOwnership } from "./routingRuleOwnership";
import { reviewStoredRules } from "../domain/ruleCatalogReview";
import { consolidateAmountOwnership } from "./amountOwnership";
import { consolidateRiderAmountOwnership } from "./riderAmountOwnership";
import { consolidateRiderOwnership } from "./riderOwnership";
import { applyWaepaLifeAmountAdoption } from "./waepaLifeAmountAdoption";
import { componentCatalog } from "../content/docs/components";
import { addPrototypeCutoverFields } from "./prototypeCutoverFields";
import { applyReviewAndRateAdoption } from "./reviewAndRateAdoption";
import { createQuestionFields as lifeHealthFields } from "../config/fields/healthLiFields";
import { createAnswerFields as disabilityHealthFields } from "../config/fields/healthDiFields";
import { createAnswerFields as simplifiedHealthFields } from "../config/fields/healthSiFields";
import { applyCoverageJourneyAdoption } from "./coverageJourneyAdoption";
import { applyCseaBenefitAdoption } from "./cseaBenefitAdoption";
import { applySelectionPolicyAdoption } from "./selectionPolicyAdoption";
import { applyRatePresentationAdoption } from "./ratePresentationAdoption";
import { applyResidencyAdoption } from "./residencyAdoption";
import { applyProvisionalSourceDecisions } from "./provisionalSourceDecisions";
import { applyDisabilityBenefitAdoption } from "./disabilityBenefitAdoption";
import { applyDependentCoverageAdoption } from "./dependentCoverageAdoption";
import { applyScalarSiteIdentifiers } from "./activeSiteIdentifierAdoption";
import { applyActiveSiteAgeAdoption } from "./activeSiteEligibilityAdoption";
import { applyActiveSiteNumericAdoption } from "./activeSiteNumericAdoption";
import { applyNsoLifeAndPaymentAdoption } from "./nsoAdoption";
import { applyWaepaGiAmountAdoption, applyWaepaGiPortfolioAndPayment, applyWaepaGiEligibilityAdoption } from "./waepaGiAdoption";
import { mcrSource } from "./mcr";
import { riderEntityKey } from "../domain/riderIdentity";
import { coverageFactFieldIds, eligibilityFactFieldIds } from "../config/fields/coverageFactFields";
import { homeQuotePlacements } from "../config/fields/homeQuoteFields";
import { seedCanonicalCatalog, seedMcr } from "./mcr";
import { normalizePrototypeCoverage } from "./normalizeCoverage";
import { applyAsceBusinessDecisions } from "./asceBusinessDecisions";
import { addLibraryMetadata } from "./canonical";
import { urlParameters } from "../content/docs/urlParameters";
import { activeMigrationSiteKeys } from "./activeSiteScope";
import { libraryMetadata } from "../domain/provenance";
/** The only migration module allowed to import static authoring sources.
 * Only the isolated Canonical Review page imports this compiler; runtime providers do not.
 */
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { createSeedDatabase } from "../persistence/seed";
import { applyStep1BusinessDecisions } from "./step1BusinessDecisions";
import { synchronizeAssociationStructure } from '../persistence/associationStructure';
import type { DatabaseSchema, Scope } from "../persistence/types";
import { clientEntities, siteEntities, tpaEntities } from "../data/registry";
import { associationEntities, siteAssociationEntities } from "../data/associations";
import { pages } from "../config/pages";
import { pageSections } from "../config/pageSections/pageSections";
import { fieldCatalog } from "../config/fields";
import { pageFieldOrder } from "../config/fields/pageFieldOrder";
import { siteFieldOverrides } from "../config/fields/fieldOverrides";
import { categoryMaxAggregate, categoryMaxAggregateNotes, siteMaxAggregateNoteOverrides } from "../config/coverageConstants";
import { coverageQuestionRequirements } from "../config/coverageQuestionRequirements";
import { coverageCategories } from "../config/coverageCategories";
import { coverages } from "../config/coverages";
import { conditionDefinitions } from "../config/conditions/conditions";
import { siteRules } from "../content/docs/siteRules";
import { allFlows } from "../content/docs/flows";
import type { FlowDefinition } from "../domain/flows";
import { featuresData } from "../content/docs/features";
import { configurationsData, getConfigurationDefaultDisplay, getConfigurationAvailableOptions } from "../content/docs/configurations";
import * as defaults from "../content/defaults";
import { siteContentOverrides } from "../content/clients";
import { HEALTH_PAGE_IDS } from "../config/progressSteps";
import { flowGateDefinitions } from "../config/flowGates";
import { identity, leaves, jsonValue, globalScope, clientScope, siteScope, scopeKey, pathKey, merge } from "./values";
import type { ClientConfigurationDefaults } from "../domain/organizations";

const html = (node: ReactNode) => renderToStaticMarkup(createElement(MemoryRouter, {}, node));
const row = <T,>(key: string, definition: T, position = 0) => ({ ...identity(key), definition, position });
export const migrationSiteKeys = activeMigrationSiteKeys;

export function createMigrationDatabase(): DatabaseSchema {
  const db = createSeedDatabase();
  db.organizationProfiles = tpaEntities.map(({ id, ...definition }, position) => ({ ...row(id, definition, position), organizationKey: id }));
  db.associations = associationEntities.map(({ id, clientId, ...definition }, position) => ({ ...row(id, definition, position), clientKey: clientId }));
  db.siteAssociations = siteAssociationEntities.map(({ id, siteId, associationId, enabled }, position) => ({ ...identity(id), siteKey: siteId, associationKey: associationId, enabled, position }));
  db.sitePolicies = siteEntities.map(({ id, associationSelection, associationBranding }) => ({ ...row(id, { associationSelection, associationBranding }), siteKey: id }));
  db.components = componentCatalog.map(({ id, ...definition }, position) => ({ ...row(id, { ...definition, storybookPath: `?path=/story/${definition.storyId}` }, position), providedBy: null, sourceReference: definition.source }));
  db.pages = pages.map((page, position) => row(page.id, { ...page, healthGate: HEALTH_PAGE_IDS.includes(page.id) }, position));
  db.pageSections = Object.values(pageSections).flatMap((sections) => (sections ?? []).map((section, position) => ({ ...row(`${section.pageId}.${section.id}`, section, position), pageKey: section.pageId })));
  db.fields = Object.values(fieldCatalog).map((field, position) => row(field.id, field, position));
  db.pageFields = Object.entries(pageFieldOrder).flatMap(([pageKey, fields]) => fields.map((fieldKey, position) => ({ ...identity(`${pageKey}.${fieldKey}`), pageKey, fieldKey, position })));
  db.validationRules = db.fields.map(({ key, definition }) => ({ ...row(`${key}.validation`, { required: definition.required, format: definition.format, inputType: definition.inputType }), fieldKey: key }));
  db.siteFieldConfigurations = siteFieldOverrides.flatMap((override, position) => {
    const scopes = override.scope === "global" ? [globalScope] : override.scope === "client" ? (override.clientIds ?? []).map(clientScope) : (override.siteIds ?? []).map(siteScope);
    return scopes.map((scope) => ({ ...identity(`${scopeKey(scope)}.${override.pageId}.${override.fieldId}.override`), ...scope, pageKey: override.pageId, fieldKey: override.fieldId, position, include: override.include ?? null, hidden: override.hidden ?? null, values: override.values ?? {} }));
  });
  db.coverageCategories = coverageCategories.map(({ id, label, ...rest }, position) => row(id, { label, ...("shortLabel" in rest ? { shortLabel: rest.shortLabel } : {}), iconKey: id }, position));
  db.products = coverages.map(({ riders, gNumber, planCode, ...definition }, position) => {
    for (const [kind, value] of Object.entries({ gNumber, planCode })) if (value !== undefined) db.productIdentifiers.push({ ...row(`${definition.id}.${kind}`, jsonValue(value)), ...globalScope, productKey: definition.id, kind: kind as "gNumber" | "planCode" });
    (riders ?? []).forEach((rider, index) => {
      const key = `${definition.id}.${rider.id}`;
      const riderKey = riderEntityKey(definition.id, rider);
      if (!db.riders.some(r => r.key === riderKey)) db.riders.push(row(riderKey, rider, index));
      db.productRiders.push({ ...identity(key), ...globalScope, productKey: definition.id, riderKey, position: index });
    });
    return { ...row(definition.id, definition, position), categoryKey: definition.categoryId };
  });
  db.applicantTypes = (["member", "spouse", "child"] as const).map((applicantType, position) => row(applicantType, { label: applicantType, applicantType }, position));
  db.conditions = conditionDefinitions.map((definition, position) => row(definition.id, definition, position));
  db.rules = siteRules.map(({ scope, siteIds, clientIds, conditionIds, ...definition }, position) => {
    (conditionIds ?? []).forEach((conditionKey, index) => db.ruleConditions.push({ ...identity(`${definition.id}.${conditionKey}`), ruleKey: definition.id, conditionKey, position: index }));
    db.ruleActions.push({ ...row(`${definition.id}.behavior`, { kind: "documented-behavior" as const, description: definition.behavior, source: definition.ref }), ruleKey: definition.id });
    const scopes = scope === "site" ? (siteIds ?? []).map(siteScope) : scope === "client" ? (clientIds ?? []).map(clientScope) : [globalScope];
    scopes.forEach((assignment) => db.ruleAssignments.push({ ...identity(`${definition.id}.${scopeKey(assignment)}`), ...assignment, ruleKey: definition.id, position }));
    return row(definition.id, definition, position);
  });
  function addFlow(flow: FlowDefinition, scope: Scope, position: number) {
    const key = `${scopeKey(scope)}.${flow.id}`;
    const { nodes, edges, ...definition } = flow;
    db.flows.push(row(key, definition, position));
    db.flowSteps.push(...nodes.map((node, i) => ({ ...row(`${key}.${node.id}`, node, i), flowKey: key })));
    db.flowTransitions.push(...edges.map((edge, i) => ({ ...row(`${key}.${edge.id}`, edge, i), flowKey: key, sourceStepKey: `${key}.${edge.source}`, targetStepKey: `${key}.${edge.target}` })));
    db.siteFlows.push({ ...identity(key), ...scope, flowKey: key, flowId: flow.id, position });
  }
  allFlows.forEach((flow, position) => addFlow(flow, globalScope, position));
  db.features = featuresData.map((feature, position) => row(feature.id, { name: feature.name, descriptionHtml: html(feature.description), impactedAreasHtml: html(feature.impactedAreas) }, position));
  db.configurationDefinitions = configurationsData.map((definition, position) => row(definition.id, { path: null, metadata: jsonValue({ ...definition, defaultValue: getConfigurationDefaultDisplay(definition), options: getConfigurationAvailableOptions(definition) }) }, position));
  // Legacy paths are interpreted only at the migration boundary, then persisted as semantic targets.
  function configurationTarget(path: string[]): import("../persistence/types/content").ConfigurationTarget | null {
    if (path[0] !== "coverages") return null;
    if (path[1] === "descriptions" && path.length === 3) return { kind: "product-presentation", productKey: path[2], property: "description" };
    if (path[1] !== "overrides" || path.length !== 4) return null;
    return path[3] === "riders" ? { kind: "product-rider-set", productKey: path[2] } : { kind: "product-presentation", productKey: path[2], property: path[3] };
  }
  function addSettings(settings: Partial<ClientConfigurationDefaults>, scope: Scope) {
    const { flows, ...rest } = settings;
    for (const [productKey, override] of Object.entries(settings.coverages?.overrides ?? {})) {
      (override?.riders ?? []).forEach((rider, position) => {
        const key = `${scopeKey(scope)}.${productKey}.${rider.id}`;
        const riderKey = riderEntityKey(productKey, rider);
        if (!db.riders.some(r => r.key === riderKey)) db.riders.push(row(riderKey, rider, position));
        db.productRiders.push({ ...identity(key), ...scope, productKey, riderKey, position });
      });

      for (const kind of ["gNumber", "planCode"] as const) {
        const value = override?.[kind];
        if (value !== undefined) db.productIdentifiers.push({ ...row(`${scopeKey(scope)}.${productKey}.${kind}`, jsonValue(value)), ...scope, productKey, kind });
      }
    }

    Object.values(flows?.overrides ?? {}).forEach((flow, i) => { if (flow) addFlow(flow, scope, i); });
    leaves(rest).forEach(({ path, value }, position) => {
      const key = pathKey(path);
      if (!db.configurationDefinitions.some((r) => r.key === key)) db.configurationDefinitions.push(row(key, { path, metadata: null, target: configurationTarget(path) }));
      db.configurationValues.push({ ...identity(`${scopeKey(scope)}.${key}`), ...scope, configurationKey: key, value, position });
    });
  }
  clientEntities.forEach((client) => {
    const scope = clientScope(client.id);
    db.brandingProfiles.push({ ...row(scopeKey(scope), client.branding), ...scope });
    db.supportProfiles.push({ ...row(scopeKey(scope), client.support), ...scope });
    addSettings(client.configurationDefaults, scope);
  });
  siteEntities.forEach((site) => {
    const scope = siteScope(site.id);
    if (site.brandingOverride) db.brandingProfiles.push({ ...row(scopeKey(scope), site.brandingOverride), ...scope });
    if (site.supportOverride) db.supportProfiles.push({ ...row(scopeKey(scope), site.supportOverride), ...scope });
    if (site.configurationOverrides) addSettings(site.configurationOverrides, scope);
    db.siteFeatures.push(...db.features.map((feature, position) => ({ ...identity(`${site.id}.${feature.key}`), siteKey: site.id, featureKey: feature.key, enabled: true, position })));
  });
  // Routing is executable configuration. Its declarative gates are preserved separately from rule prose.
  db.configurationDefinitions.push(row("routing.gates", { path: ["routingGates"], metadata: null }));
  db.configurationValues.push({ ...identity("global.routing.gates"), ...globalScope, configurationKey: "routing.gates", value: jsonValue(flowGateDefinitions), position: 0 });
  function policyValue(path: string[], value: unknown, scope: Scope) {
    const key = pathKey(path);
    if (!db.configurationDefinitions.some((r) => r.key === key)) db.configurationDefinitions.push(row(key, { path, metadata: null, target: configurationTarget(path) }));
    db.configurationValues.push({ ...identity(`${scopeKey(scope)}.${key}`), ...scope, configurationKey: key, value: jsonValue(value), position: 0 });
  }
  policyValue(["coveragePolicy", "categoryMaxAggregate"], categoryMaxAggregate, globalScope);
  policyValue(["coveragePolicy", "questionRequirements"], coverageQuestionRequirements, globalScope);
  for (const category of coverageCategories) policyValue(["coveragePolicy", "aggregateNotes", category.id], categoryMaxAggregateNotes[category.id] ?? null, globalScope);
  for (const [siteKey, overrides] of Object.entries(siteMaxAggregateNoteOverrides)) {
    for (const [category, note] of Object.entries(overrides ?? {})) policyValue(["coveragePolicy", "aggregateNotes", category], note, siteScope(siteKey));
  }
  function addContent(content: unknown, scope: Scope) {
    leaves(content).forEach(({ path, value }, position) => {
      const key = pathKey(path);
      if (!db.contentEntries.some((entry) => entry.key === key)) db.contentEntries.push(row(key, { path }));
      db.contentValues.push({ ...identity(`${scopeKey(scope)}.${key}`), ...scope, contentKey: key, value, position });
    });
  }
  addContent(Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key.replace(/Defaults$/, ""), value])), globalScope);
  Object.entries(siteContentOverrides).forEach(([site, content]) => addContent(content, siteScope(site)));
  const emailTypes = ["autosave", "receipt", "resume-magic-link", "pending-reminder", "purge-reminder", "advisor-sent-for-signature", "advisor-sent-to-applicant", "advisor-pending-reminder", "advisor-edit-request", "advisor-application-complete"];
  db.emailTemplates = emailTypes.map((key, position) => row(key, { rendererKey: key, source: "src/utils/mockEmail.ts" }, position));
  for (const key of ["footer.termsOfUseContent", "footer.privacyNoticeContent"]) {
    // A document is a structured content subtree, including all its text and sections.
    db.documentDefinitions.push(row(key, { contentKey: null, productKey: null, source: key }));
  }
  for (const product of db.products) if (product.definition.brochureUrl || db.configurationDefinitions.some((r) => r.definition.path?.join(".") === `coverages.overrides.${product.key}.brochureUrl`)) {
    db.documentDefinitions.push(row(`product.${product.key}.brochure`, { contentKey: null, productKey: product.key, source: "brochureUrl" }));
  }
  for (const site of db.sites) {
    db.siteEmailTemplates.push(...db.emailTemplates.map((template, position) => ({ ...identity(`${site.key}.${template.key}`), siteKey: site.key, emailTemplateKey: template.key, enabled: true, position })));
    db.siteDocuments.push(...db.documentDefinitions.map((document, position) => ({ ...identity(`${site.key}.${document.key}`), siteKey: site.key, documentKey: document.key, position })));
  }
  db.siteProducts = [];
  db.siteCoverages = [];
  db.siteRiders = [];
  // Compile authored defaults + overrides into explicit placement/assignment rows.
  // This deliberately does not call getEffectiveSiteConfig or any old resolver.
  for (const site of siteEntities) {
    const client = clientEntities.find((r) => r.id === site.clientId)!;
    const settings = merge(client.configurationDefaults, site.configurationOverrides);
    db.sitePages.push(...pages.map((page, position) => {
      const explicit = page.id === "beneficiary" || page.id === "payment" ? settings.pages.requirements?.[page.id] : undefined;
      const requirement = explicit ?? (settings.pages.excluded?.includes(page.id) ? "none" : settings.pages.optional?.includes(page.id) ? "optional" : "required");
      return { ...identity(`${site.id}.${page.id}`), siteKey: site.id, pageKey: page.id, requirement, position };
    }));
    const enabledRiders = new Set<string>();
    for (const product of coverages) {
      const enabled = settings.coverages.enabled?.includes(product.id) ?? false;
      const timestamp = { createdAt: "2026-09-01T12:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z" };
      db.siteProducts.push({ id: `${site.id}--${product.id}--product`, siteId: site.id, productKey: product.id, enabled, ...timestamp });
      db.siteCoverages.push({ id: `${site.id}--${product.id}`, siteId: site.id, coverageKey: product.id, enabled, ...timestamp });
      if (enabled) for (const rider of settings.coverages.overrides?.[product.id]?.riders ?? product.riders ?? []) enabledRiders.add(riderEntityKey(product.id, rider));
      const applicants = settings.coverages.overrides?.[product.id]?.applicants ?? product.applicants;
      db.siteProductApplicants.push(...applicants.map((applicantKey, position) => ({ ...identity(`${site.id}.${product.id}.${applicantKey}`), siteKey: site.id, productKey: product.id, applicantKey, position })));
    }
    db.siteRiders.push(...[...enabledRiders].map((riderKey) => ({ id: `${site.id}--${riderKey}`, siteId: site.id, riderKey, enabled: true, createdAt: "2026-09-01T12:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z" })));
    const requirementProducts = coverages.filter(product => settings.coverages.enabled?.includes(product.id)).map(product => ({ ...product, ...settings.coverages.overrides?.[product.id] }));
    for (const [pageKey, fieldIds] of [["coverage", coverageFactFieldIds(requirementProducts)], ["eligibility", eligibilityFactFieldIds(requirementProducts)]] as const) {
      db.siteFieldConfigurations.push(...fieldIds.map((fieldKey, position) => ({ ...identity(`${site.id}.${pageKey}.${fieldKey}.requirement`), ...siteScope(site.id), pageKey, fieldKey, position: 11000 + position, include: true, hidden: null, values: {} })));
    }
    db.siteFieldConfigurations.push(...homeQuotePlacements(settings).map((placement, position) => ({ ...identity(`${site.id}.home.${placement.fieldId}.placement`), ...siteScope(site.id), pageKey: "home", fieldKey: placement.fieldId, position: 10000 + position, include: null, hidden: placement.hidden ?? null, values: {} })));
    for (const [pageKey, config] of Object.entries(settings.fields)) {
      if (!config) continue;
      const assignments = [
        ...(config.extra ?? []).map((fieldKey) => ({ fieldKey, operation: "include", include: true, hidden: null, values: {} })),
        ...Object.entries(config.overrides ?? {}).flatMap(([fieldKey, values]) => values ? [{ fieldKey, operation: "override", include: null, hidden: null, values: Object.fromEntries(Object.entries(values).filter(([key]) => key !== "id")) }] : []),
        ...(config.required ?? []).map((fieldKey) => ({ fieldKey, operation: "required", include: null, hidden: null, values: { required: true } })),
        ...(config.hidden ?? []).map((fieldKey) => ({ fieldKey, operation: "hidden", include: null, hidden: true, values: {} })),
      ];
      db.siteFieldConfigurations.push(...assignments.map(({ operation, ...r }, position) => ({ ...identity(`${site.id}.${pageKey}.${r.fieldKey}.authored.${operation}`), ...siteScope(site.id), pageKey, ...r, position: position - 10000 })));
    }
  }
  seedCanonicalCatalog(db);
  normalizePrototypeCoverage(db);
  db.urlParameters = urlParameters.map(parameter => ({ ...identity(parameter.parameter), ...libraryMetadata("urlParameters", parameter.parameter, "src/content/docs/urlParameters.ts"), parameter: parameter.parameter, behavior: parameter.newBehavior.join("\n"), status: parameter.status }));
  // Metadata assigned below; identities are preserved independently from row order.
  db.urlParameters.forEach(parameter => { const metadata = urlParameters.find(p => p.parameter === parameter.key)!; db.urlParameterValues.push(...metadata.newValues.map(value => ({ ...identity(`${parameter.key}.${value}`), ...libraryMetadata("urlParameterValues", `${parameter.key}.${value}`, "src/content/docs/urlParameters.ts"), urlParameterKey: parameter.key, value }))); });
  seedMcr(db);
  applyStep1BusinessDecisions(db);
  applyAsceBusinessDecisions(db);
  reviewStoredRules(db);
  addLibraryMetadata(db);
  // Strict JSON boundary: prototypes and undefined object members never reach storage.
  return synchronizeAssociationStructure(jsonValue(db) as unknown as DatabaseSchema);
}

/** Explicit Step 3 review compiler. Compatibility fixtures and live consumers stay unchanged. */
export function createReviewedMigrationDatabase(): DatabaseSchema {
  const db = createMigrationDatabase();
  applyWaepaGiAmountAdoption(db, mcrSource.cells);
  applyWaepaGiPortfolioAndPayment(db);
  applyNsoLifeAndPaymentAdoption(db, mcrSource.cells);
  applyActiveSiteNumericAdoption(db, mcrSource.cells);
  applyActiveSiteAgeAdoption(db, mcrSource.cells);
  applyScalarSiteIdentifiers(db, mcrSource.cells);
  applyWaepaGiEligibilityAdoption(db, mcrSource.cells);
  applyDisabilityBenefitAdoption(db, mcrSource.cells);
  applyDependentCoverageAdoption(db, mcrSource.cells);
  applyCseaBenefitAdoption(db);
  applyProvisionalSourceDecisions(db, mcrSource.cells);
  applyWaepaLifeAmountAdoption(db, mcrSource.cells);
  applyResidencyAdoption(db, mcrSource.cells);
  applySelectionPolicyAdoption(db);
  applyRatePresentationAdoption(db);
  // Persist the existing page-owned health questions for candidate execution.
  // The compatibility/live fixture is untouched.
  for (const [pageKey, createFields] of [["health-li", lifeHealthFields], ["health-di", disabilityHealthFields], ["health-si", simplifiedHealthFields]] as const) {
    for (const applicant of ["self", "spouse"] as const) for (const [position, definition] of createFields(applicant).entries()) {
      const fieldKey = definition.id;
      if (!db.fields.some(f => f.key === fieldKey)) db.fields.push({ ...row(fieldKey, definition, position), ...libraryMetadata("fields", fieldKey, `prototype:${pageKey}`) });
      const key = `${pageKey}.${fieldKey}`;
      if (!db.pageFields.some(f => f.key === key)) db.pageFields.push({ ...identity(key), ...libraryMetadata("pageFields", key, `prototype:${pageKey}`), pageKey, fieldKey, position: 20000 + (applicant === "spouse" ? 1000 : 0) + position });
    }
  }
  applyCoverageJourneyAdoption(db);
  applyReviewAndRateAdoption(db);
  addPrototypeCutoverFields(db);
  consolidateAmountOwnership(db);
  consolidateRiderOwnership(db);
  consolidateRiderAmountOwnership(db);
  consolidateRoutingRuleOwnership(db);
  consolidatePageParticipationOwnership(db);
  consolidateFieldDefinitionOwnership(db);
  consolidateRequiredFieldOwnership(db);
  consolidateProductAvailabilityOwnership(db);
  consolidateSiteStructureOwnership(db);
  consolidateRuleDocumentationOwnership(db);
  return synchronizeAssociationStructure(jsonValue(db) as unknown as DatabaseSchema);
}
