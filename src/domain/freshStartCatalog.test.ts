import { resolveContentReferences } from './contentReferences.mjs';
import navigationPresentation from '../../requirements/global/navigation.json';
import { advisorFlow } from '../content/docs/flows/advisorFlow';
import { pagesDefaults } from '../content/defaults/pages';
import { projectLibraryCatalog } from '../services/libraryCatalogService';
import { pageHelpItems } from '../content/helpContent';
import { requirementPageHelp } from './requirementContent';
import { resolveCoverageJourneyPolicy } from './coverageJourneyPolicy';
import { resumeFlow } from '../content/docs/flows/resumeFlow';
import { afterEach, describe, expect, it } from "vitest";
import { setImmediate as yieldToWorker } from 'node:timers/promises';
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { applicationFormRows, applicationFormSource } from "./applicationForms";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { freshStartSource, withFreshStartCatalog } from "./freshStartCatalog";
import { compileRequirementCatalog } from "./requirementCatalog.mjs";
import { resolveEffectiveSite } from "./effectiveSite";
import { resolvePrototypeLibrary } from "./prototypeLibrary";
import { buildGlobalTemplate } from "../dev/storybook/globalTemplate";
import { storedFieldRows, storedLibraryRows } from "../pages/admin/library/storedLibraryModel";
import { resolveEffectiveAmount, resolveEffectiveConfiguration } from "./effectiveConfiguration";
import { validateNormalizedCoverageAmount } from "./normalizedCoverageAmounts";
import { configurationRows } from "../pages/admin/library/configurationRows";
import { libraryRequirementRows } from "../pages/admin/library/libraryRequirementRows";
import { urlParameterRows } from "../pages/admin/library/UrlParametersLibrary";
import type { PageId } from '../types';
import { installPrototypeLibrary } from './prototypeLibrary';
import { fieldCatalog } from '../config/fields';
import { declaredPageComponents, confirmedRequirementBehaviors } from './requirementBehaviors';
import { receiptDefaults } from '../content/defaults/receipt';
import { buildPrototypeClient, buildPrototypeContent } from "./prototypeConfigurationProjection";
import { resolveHomePresentation, resolveHomePageSections } from "../config/homepagePresentation";
import { validatePhoneFieldBindings } from "./phoneFields";
import { filterEligibleStateOptions } from "./applicantExperience";
import { pageCatalogRows } from '../pages/admin/library/pageCatalogRows';
import { requirementUrlValues } from './requirementUrlParameters';
import { getCoverageCategories } from "../config/coverageCategories";
import { resolveStoredFieldSurfaces } from './fieldSurfaces';
import { resolveStoredFieldCollections } from './fieldCollections';
import { requirementPageValidations } from "./requirementValidations";
import { requirementCoverageControl } from "./requirementFields";
import { resolveCoverageQuestionSections } from "../config/resolvers/resolveCoverageQuestionSections";
import { evaluateCondition } from '../config/conditions/evaluateConditions';
import { validateFieldCollection } from './fieldCollections';
import { applicationApplicantFactSet } from '../utils/applicantFacts';
import { coveragePolicyConfigurationDefinitions } from './requirementCoveragePolicy';
import { urlParameters as referenceUrlParameters } from '../content/docs/urlParameters';
import { resolveApplicationCoverage } from './coverageRuntime';
import { resolveActiveAssociationFromApplication } from '../data/activeAssociation';

const deployed = validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8")));
// Keep the established page-review fixture scoped to ASCE. Synthetic Sites in
// this suite exercise inheritance; restoredSites.test.ts covers all enrollments.
const baseline = Object.fromEntries(Object.entries(deployed.data).map(([table, rows]) => [table,
  table === 'sites' ? rows.filter(row => 'key' in row && row.key === 'asce') : rows.filter(row =>
    (!('siteKey' in row) || !row.siteKey || row.siteKey === 'asce') &&
    (!('siteId' in row) || !row.siteId || row.siteId === 'asce')),
])) as typeof deployed.data;
const catalog = { ...deployed, data: baseline, siteScope: ["asce"], revision: "fresh-start-test" };
const reviewedPages = Object.values(freshStartSource().pages).map(page => (page.consumerKey ?? page.page) as PageId);
const reviewed = new Set<string>(reviewedPages);
// Compilation is synchronous. Let IPC progress between cases so result reports
// are not held until the complete source-reconstruction suite has finished.
afterEach(() => yieldToWorker());

// Resolve an explicitly edited source projection directly, without replacing it
// with the installed authoring files or invoking historical-snapshot audits.
function compiledConfiguration(data: typeof catalog.data, siteKey: string) {
  const site = data.sites.find(site => site.key === siteKey)!;
  const clientKey = data.clients.find(client => client.id === site.clientId)!.key;
  const products = data.siteProducts.filter(product => product.siteId === site.id && product.enabled).map(product => product.productKey);
  return { siteKey, clientKey, configuration: resolveEffectiveConfiguration(data, siteKey, clientKey, site.id, products) };
}

function withoutReviewedRecords() {
  const data = structuredClone(catalog.data);
  const sections = new Set(data.pageSections.filter(row => reviewed.has(row.pageKey)).map(row => row.key));
  const fields = new Set(data.pageFields.filter(row => reviewed.has(row.pageKey)).map(row => row.fieldKey));
  for (const row of data.pageSectionFields) if (sections.has(row.sectionKey)) fields.add(row.fieldKey);
  const surfaces = catalog.data.configurationValues.find(row => row.configurationKey === "field-surfaces" && row.scope === "global")!.value as Record<string, { fields: Array<{ fieldKey: string }> }>;
  for (const field of surfaces.quoteInputs.fields) fields.add(field.fieldKey);
  data.pages = data.pages.filter(row => !reviewed.has(row.key));
  data.sitePages = data.sitePages.filter(row => !reviewed.has(row.pageKey));
  data.pageFields = data.pageFields.filter(row => !reviewed.has(row.pageKey));
  data.pageSections = data.pageSections.filter(row => !reviewed.has(row.pageKey));
  data.pageSectionFields = data.pageSectionFields.filter(row => !sections.has(row.sectionKey));
  data.siteFieldConfigurations = data.siteFieldConfigurations.filter(row => !reviewed.has(row.pageKey));
  data.fields = data.fields.filter(row => !fields.has(row.key));
  data.contentValues = data.contentValues.filter(row => ![...reviewed].some(page => row.contentKey.startsWith(`pages.${page}.`)));
  data.contentEntries = data.contentEntries.filter(row => ![...reviewed].some(page => row.key.startsWith(`pages.${page}.`)));
  data.eligibilityConstraints = data.eligibilityConstraints.filter(row => row.siteKey !== "asce");
  // Remove the underlying product graph too, rather than proving only page
  // layout ownership while leaving benefit/rider/underwriting inputs behind.
  const source = freshStartSource();
  const tables = new Set([...Object.keys(source.products.catalog), ...Object.keys(source.siteProducts.asce.catalog!)]);
  const definitions = new Set(source.products.catalog.configurationDefinitions.map(row => row.key));
  for (const table of tables) {
    if (table === 'configurationDefinitions') data.configurationDefinitions = data.configurationDefinitions.filter(row => !definitions.has(row.key));
    else if (table === 'configurationValues') data.configurationValues = data.configurationValues.filter(row => !definitions.has(row.configurationKey));
    else (data as unknown as Record<string, unknown[]>)[table] = [];
  }
  return data;
}

describe("fresh-start reviewed page ownership", () => {
  it('owns flow preview variants and retires preview-only timestamps and boolean copy', () => {
    const source = freshStartSource();
    const input = withoutReviewedRecords();
    input.components = [];
    for (const key of ['application.document-preview.prepared-on', 'application.document-preview.yes', 'application.document-preview.no']) {
      input.contentEntries.push({ ...catalog.data.contentEntries[0], id: key, key, definition: { path: key.split('.') } });
      input.contentValues.push({ ...catalog.data.contentValues[0], id: key, key, contentKey: key, scope: 'global', siteKey: null, clientKey: null, value: 'Old display copy' });
    }
    const data = compileRequirementCatalog(input, source, 'asce');
    expect(data.components.find(row => row.key === 'component-send-application-dialog')?.definition.examples?.find(example => example.key === 'to-advisor')?.storyId).toBe('overlays-sendapplicationdialog--to-advisor');
    expect(data.contentEntries.some(row => row.key === 'application.document-preview.prepared-on' || row.key === 'application.document-preview.no')).toBe(false);
    expect(source.fields.optionLists).toHaveProperty('yes-no');
  });

  it('reconstructs canonical shared content and rejects a second authored reference value', () => {
    const source = structuredClone(freshStartSource());
    source.content['action.cancel'] = 'Shared dismiss';
    const data = withoutReviewedRecords();
    const projected = compileRequirementCatalog(data, source, 'asce');
    const model = resolvePrototypeLibrary(projected, 'asce', 'canonical-content', source);
    expect(model.site.configuration.content.find(row => row.key === 'dialogs.sendApplication.shared.cancel')?.value).toBe('Shared dismiss');
    expect(projected.contentEntries.find(row => row.key === 'dialogs.sendApplication.shared.cancel')?.definition.sourceKey).toBe('action.cancel');
    expect(projected.contentEntries.some(row => row.key === 'health.applicant.member')).toBe(false);
    expect(projected.contentEntries.find(row => row.key === 'coverage.applicantLabels.member')?.definition.sourceKey).toBe('people.self');
    const invalid = structuredClone(source);
    invalid.content['dialogs.send-application.cancel'] = 'Another dismiss';
    expect(() => compileRequirementCatalog(data, invalid)).toThrow('second authored value');
  });

  it('separates Membership entry text from transition pairs and shares applicant rider copy', () => {
    const model = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'prototype-regressions');
    expect(model.content.pages.membership!.loading).toBe('Loading your membership application...');
    expect(model.content.navigation.transitionMessages.membership).toEqual(['Saving your membership information...', 'Checking your member details before we continue...']);
    for (const pair of Object.values(model.content.navigation.transitionMessages)) {
      expect(pair).toHaveLength(2); expect(pair?.every(message => message.length > 1)).toBe(true);
    }
    expect(model.site.configuration.pages.find(page => page.key === 'membership')!.fields.find(field => field.key === 'phone-type')?.definition.defaultValue).toBe('mobile');
    const rider = model.products.find(product => product.id === 'li-term')!.riders!.find(rider => rider.id === 'cir')!;
    expect(rider.applicantDescriptions?.member).not.toContain('spouses');
    expect(rider.applicantDescriptions?.spouse).not.toContain('members');
  });

  it.each([false, true])('projects canonical components and parts globally with saved component definitions=%s', saved => {
    const source = structuredClone(freshStartSource());
    const data = withoutReviewedRecords();
    if (!saved) data.components = [];
    const compiled = compileRequirementCatalog(data, source, 'asce');
    expect(compiled.components).toHaveLength(source.components.length);
    const prototype = resolvePrototypeLibrary(data, 'asce', 'component-source-only', source);
    const library = projectLibraryCatalog({ ...catalog, data });
    const story = buildGlobalTemplate({ ...catalog, data });
    const view = (rows: typeof data.components) => rows.map(row => ({ key: row.key, definition: row.definition })).sort((a, b) => a.key.localeCompare(b.key));
    expect(view(library.data.components)).toEqual(view(prototype.components));
    expect(view(story.components)).toEqual(view(prototype.components));
    for (const scope of ['all', 'asce']) expect(storedLibraryRows({ ...catalog, data: compiled }, 'components', scope)).toHaveLength(source.components.length);
    expect(source.components.some(component => ['FieldGroup', 'SectionNote', 'Snackbar', 'HelpChip', 'ConfirmationAlert', 'ResumeEmailRequest', 'ResumeDeliveryMethod', 'ResumeCodeEntry', 'AdvisorLoginTabs', 'ESignInstructions'].includes(component.name))).toBe(false);
    expect(declaredPageComponents('eligibility').has('SectionDivider')).toBe(true);
    expect(declaredPageComponents('eligibility').has('FieldGroup')).toBe(false);
    expect(compiled.components.find(row => row.definition.name === 'PrototypeHandoffPage')?.definition.contains).toEqual(['component-form-route-page']);
    for (const id of ['health-qd', 'docusign']) expect(source.pages[id].components?.[0].type).toBe('PrototypeHandoffPage');
    expect(compiled.components.find(row => row.definition.name === 'AppSnackbar')?.definition.parts.some(part => part.name === 'Snackbar')).toBe(true);
  });

  it('reconstructs R1–R6 page compositions globally and removes superseded wrappers', () => {
    const source = structuredClone(freshStartSource());
    const data = withoutReviewedRecords();
    const retired = ['SpouseContact', 'ReceiptNextSteps', 'YesNoDetailList'];
    for (const name of retired) {
      const key = 'component-' + name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      data.components.push({ ...data.components[0], id: key, key, definition: { ...data.components[0].definition, name } });
    }
    const compiled = compileRequirementCatalog(data, source, 'asce');
    expect(compiled.components.some(row => retired.includes(row.definition.name))).toBe(false);
    for (const name of ['StandaloneFormPage', 'InformationAlert', 'HealthQuestion']) {
      expect(applicationFormSource().components.some(row => row.name === name)).toBe(true);
      expect(compiled.components.find(row => row.definition.name === name)?.definition.source).toBeTruthy();
    }
    for (const id of ['resume', 'resume-method', 'resume-code']) expect(declaredPageComponents(id).has('StandaloneFormPage')).toBe(true);
    for (const id of ['health-si', 'health-tele', 'health-di-supp']) {
      const components = declaredPageComponents(id);
      expect(components.has('HealthQuestion')).toBe(true);
      expect(components.has('YesNoDetailList')).toBe(false);
    }
    const prototype = resolvePrototypeLibrary(compiled, 'asce', 'shared-compositions');
    const rows = pageCatalogRows({ ...catalog, data: compiled }, 'asce');
    const story = buildGlobalTemplate({ ...catalog, data: compiled });
    for (const id of ['contact', 'receipt', 'resume', 'resume-method', 'resume-code', 'health-si', 'health-tele', 'health-di-supp']) {
      const projected = prototype.pages.find(page => page.key === id)!;
      expect(rows.find(page => page.key === id)?.definition).toEqual(projected.definition);
      expect(story.pages.find(page => page.key === id)?.definition).toEqual(projected.definition);
    }
  });

  it('reconstructs Advisor and Resume from source with shared policy, fields and consumer parity', () => {
    const source = freshStartSource();
    const data = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const prototype = resolvePrototypeLibrary(data, 'asce', 'advisor-resume-final', source);
    const story = buildGlobalTemplate({ ...catalog, data });
    const pages = ['advisor-login', 'advisor-send-confirmation', 'application-edit-confirmation', 'resume', 'resume-method', 'resume-code'];
    const library = pageCatalogRows({ ...catalog, data }, 'asce');
    for (const id of pages) {
      expect(library.find(page => page.key === id)?.definition).toEqual(prototype.pages.find(page => page.key === id)?.definition);
      expect(story.pages.find(page => page.key === id)?.definition).toEqual(prototype.pages.find(page => page.key === id)?.definition);
      expect(story.content.pages[id as PageId]).toEqual(prototype.content.pages[id as PageId]);
    }
    for (const id of pages.slice(0, 3)) expect(data.pages.find(page => page.key === id)?.definition.saveProgress).toBe(false);
    expect(data.fields.find(field => field.key === 'advisor-flow-type')?.definition.required).toBe(true);
    expect(data.fields.find(field => field.key === 'applicant-email')?.definition.autoComplete).toBe('off');
    expect(data.fields.find(field => field.key === 'resume-phone')?.definition).toMatchObject({ required: true, format: 'phone', showPhoneTypeSelector: false });
    expect(data.flowSteps.filter(row => row.flowKey === 'global:*.advisor').sort((a, b) => a.position - b.position).map(row => row.definition)).toEqual(advisorFlow.nodes);
    expect(data.flowTransitions.filter(row => row.flowKey === 'global:*.advisor').sort((a, b) => a.position - b.position).map(row => row.definition)).toEqual(advisorFlow.edges);
    expect(data.fields.find(field => field.key === 'resume-security-code')?.definition).toMatchObject({ minLength: 6, maxLength: 6, format: 'digits', autoComplete: 'one-time-code' });
    const rows = configurationRows({ ...catalog, data }, 'asce');
    const policy = { retentionDays: 10, linkValiditySeconds: 600, codeValiditySeconds: 600, codeAttemptLimit: 3, codeIssueLimit: 5, requestLimit: 5, requestWindowSeconds: 900, mfaValiditySeconds: 1800, mfaWarningSeconds: 120, codeIssueWindowSeconds: 900, codeIssueCooldownSeconds: 1800, codeAttemptLockSeconds: 1800, requestCooldownSeconds: 600 };
    for (const [key, value] of Object.entries(policy)) {
      const definition = data.configurationDefinitions.find(row => row.definition.path?.join('.') === `recoveryPolicy.${key}`)!;
      expect(definition.definition.metadata).toMatchObject({ scope: 'Global template; Site overrides prohibited', globalOnly: true, defaultValue: value });
      expect(rows.find(row => row.key === definition.key)?.scope).toBe('Global template; Site overrides prohibited');
      expect(data.configurationValues.filter(row => row.configurationKey === definition.key).map(row => row.scope)).toEqual(['global']);
      expect(data.configurationValues.find(row => row.configurationKey === definition.key && row.scope === 'global')?.value).toBe(value);
    }
    expect(data.configurationDefinitions.some(row => row.definition.path?.join('.') === 'confirmation.signatureRetentionDays')).toBe(false);
    expect(data.flowSteps.filter(row => row.flowKey === 'global:*.resume').sort((a, b) => a.position - b.position).map(row => row.definition)).toEqual(resumeFlow.nodes);
    expect(data.flowTransitions.filter(row => row.flowKey === 'global:*.resume').sort((a, b) => a.position - b.position).map(row => row.definition)).toEqual(resumeFlow.edges);
    expect(resumeFlow.nodes.find(node => node.id === 'resume-restored')?.description).toContain('Eligibility');
    expect(resumeFlow.edges.some(edge => edge.condition?.includes('Third incorrect attempt'))).toBe(true);
    expect(data.urlParameters.find(row => row.parameter === 'mfaSessionId')?.behavior).toContain('not a campaign setting');
    const sharedMessages = storedLibraryRows({ ...catalog, data }, 'contentValues', 'asce');
    expect(sharedMessages.find(row => row.contentKey === 'resume.error.codeLimit')?.value).toBe(source.content['resume.error.code-limit']);
    expect(sharedMessages.find(row => row.contentKey === 'resume.mfa.warningMessage')?.value).toBe(source.content['resume.mfa.warning-message']);
    for (const suffix of ['default-title', 'default-intro', 'send', 'cancel', 'name', 'email', 'missing-value']) {
      const key = `dialogs.send-application.${suffix}`, target = source.contentBindings[key];
      expect(sharedMessages.find(row => row.contentKey === target)?.value).toBe(resolveContentReferences(source.content, source.contentReferences)[key]);
    }
    const behavior = confirmedRequirementBehaviors(pages);
    for (const id of ['advisor-entry-and-identity', 'advisor-new-application', 'resume-entry-and-privacy', 'resume-retention-and-limits']) expect(behavior.some(rule => rule.id === id)).toBe(true);
    expect(data.rules.some(rule => ['rule-advisor-flow-send-to-applicant-dialog', 'rule-advisor-flow-advisor-mode-review-edit-dialog', 'rule-persistence-resume-verification'].includes(rule.key))).toBe(false);
    const globals = compileRequirementCatalog({ ...withoutReviewedRecords(), sites: [] }, source);
    expect(globals.configurationDefinitions.filter(row => row.definition.path?.[0] === 'recoveryPolicy')).toHaveLength(13);
  });

  it('keeps recovery settings global and rejects authored scoped replacements', () => {
    const source = structuredClone(freshStartSource());
    const page = source.fields.sitePages!.asce.resume as { configurations?: Record<string, unknown> };
    for (const definition of source.configurations.filter(configuration => configuration.policyKey)) {
      expect(definition.globalOnly).toBe(true);
      page.configurations = { [definition.id]: definition.default };
      expect(() => compileRequirementCatalog(withoutReviewedRecords(), source, 'asce')).toThrow(`Global-only configuration cannot be overridden: asce/${definition.id}`);
    }
    page.configurations = {};
    source.siteEligibility.asce.configurations['saved-application-retention-days' as keyof typeof source.siteEligibility.asce.configurations] = 2 as never;
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), source, 'asce')).toThrow('Global-only configuration cannot be overridden: asce/saved-application-retention-days');
    delete (source.siteEligibility.asce.configurations as Record<string, unknown>)['saved-application-retention-days'];
    source.siteApplication.asce.records.configurationValues!.push({ id: 'forbidden-recovery-value', key: 'forbidden-recovery-value', configurationKey: 'requirements.recoveryPolicy.codeAttemptLimit', scope: 'site', siteKey: '{{site}}', value: 2 } as never);
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), source, 'asce')).toThrow('Global-only application configuration cannot be overridden: asce');
  });

  it('replaces captured recovery assignments and validates global policy values', () => {
    const source = structuredClone(freshStartSource());
    const input = withoutReviewedRecords();
    const baseline = compileRequirementCatalog(input, source, 'asce');
    for (const definition of baseline.configurationDefinitions.filter(row => row.definition.path?.[0] === 'recoveryPolicy')) {
      input.configurationValues.push({ id: `captured-${definition.key}`, key: `captured-${definition.key}`, configurationKey: definition.key, scope: 'site', siteKey: 'asce', value: 1 } as never);
    }
    const compiled = compileRequirementCatalog(input, source, 'asce');
    const prototype = resolvePrototypeLibrary(compiled, 'asce', 'global-recovery-settings', source);
    const story = buildGlobalTemplate({ ...catalog, data: compiled });
    expect(prototype.settings.recoveryPolicy).toEqual(story.settings.recoveryPolicy);
    expect(prototype.settings.recoveryPolicy).toMatchObject({ retentionDays: 10, codeAttemptLimit: 3, mfaValiditySeconds: 1800 });
    const keys = new Set(compiled.configurationDefinitions.filter(row => row.definition.path?.[0] === 'recoveryPolicy').map(row => row.key));
    expect(compiled.configurationValues.filter(row => keys.has(row.configurationKey)).every(row => row.scope === 'global')).toBe(true);
    const attempt = source.configurations.find(definition => definition.id === 'resume-code-attempt-limit')!;
    for (const value of [0, 1.5]) {
      attempt.default = value;
      expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Invalid fresh-start configuration');
    }
    attempt.default = 3;
    source.configurations.find(definition => definition.id === 'resume-mfa-warning-seconds')!.default = 1800;
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('MFA warning must precede expiry');
  });

  it('reconstructs Coverage composition and control surfaces from source without superseded records', () => {
    const input = withoutReviewedRecords();
    input.fields = input.fields.filter(field => !['coverage-amount', 'add-coverage', 'rider', 'rider-amount', 'waiting-period', 'benefit-option', 'rate-frequency'].some(id => field.key === id || field.key === `spouse-${id}` || field.key === `child-${id}`));
    const library = resolvePrototypeLibrary(input, 'asce', 'coverage-source');
    const page = library.site.configuration.pages.find(page => page.key === 'coverage')!;
    const sections = page.sections.map(section => section.definition.value);
    expect(sections.map(section => section.role)).toEqual(['portfolio', 'categories', 'questions', 'questions', 'questions', 'questions', 'questions', 'questions', 'questions', 'reveal', 'products', 'summary']);
    expect(resolveCoverageQuestionSections({ sections, selectedCategories: ['DI'] }, library).flatMap(section => section.fieldIds)).toContain('self-employed-under-one-year');
    expect(resolveCoverageQuestionSections({ sections, selectedCategories: ['AD'] }, library)).toEqual([]);
    for (const person of ['member', 'spouse', 'child'] as const) {
      expect(requirementCoverageControl('coverage-amount', person, library).inputType).toBe('dropdown');
      expect(requirementCoverageControl('add-coverage', person, library).inputType).toBe('checkbox');
    }
    expect(requirementPageValidations('coverage').find(row => row.id === 'coverage-election-acceptance')).toBeDefined();
    const story = buildGlobalTemplate({ ...catalog, data: input });
    expect(story.fieldSurfaces.coverageSpouseControls).toEqual(library.fieldSurfaces.coverageSpouseControls);
  });
  it('keeps Coverage definitions global while effective control overrides stay independent', () => {
    const source = structuredClone(freshStartSource());
    const site = source.fields.sites.asce as { fields: Record<string, unknown> };
    site.fields['coverage-amount'] = { label: { self: 'Requested protection', spouse: 'Spouse protection', child: 'Child protection' } };
    const compiled = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const configuration = compiledConfiguration(compiled, 'asce');
    const controls = resolveStoredFieldSurfaces(compiled, configuration);
    expect(controls.coverageControls.mapping.fields.find(field => field.id === 'coverage-amount')?.label).toBe('Requested protection');
    expect(controls.coverageSpouseControls.mapping.fields.find(field => field.id === 'spouse-coverage-amount')?.label).toBe('Spouse protection');
    expect(compiled.fields.find(field => field.key === 'coverage-amount')?.definition.label).not.toBe('Requested protection');
    const key = compiled.configurationDefinitions.find(row => row.definition.path?.join('.') === 'coveragePolicy.questionRequirements')!.key;
    expect(compiled.configurationValues.filter(row => row.configurationKey === key).map(row => row.scope)).toEqual(['global']);
  });

  it('projects the confirmed Coverage decisions and replaces superseded URL contracts', () => {
    const input = withoutReviewedRecords();
    const source = freshStartSource();
    const preselect = source.products.catalog.urlParameters.find(row => row.parameter === 'preselect')!;
    input.urlParameters.push({ ...source.products.catalog.urlParameters.find(row => row.parameter === 'ctg')!, status: 'Migrated', behavior: 'Stale active ctg ordering' } as typeof input.urlParameters[number]);
    input.urlParameterValues.push({ ...catalog.data.urlParameterValues[0], id: 'ctg.stale', key: 'ctg.stale', urlParameterKey: 'ctg', value: 'firstCategory=di' });
    input.urlParameters.push({ ...preselect, key: 'preselect (TBD)', id: 'preselect (TBD)', parameter: 'preselect (TBD)', behavior: 'Stale deferred behavior', status: 'TBD' } as typeof input.urlParameters[number]);
    const data = compileRequirementCatalog(input, source, 'asce');
    expect(data.urlParameters.filter(row => row.parameter.startsWith('preselect')).map(row => row.parameter)).toEqual(['preselect']);
    const parameters = urlParameterRows({ ...catalog, data }, 'asce');
    expect(parameters.find(row => row.parameter === 'preselect')?.values).toEqual(['TRUE']);
    expect(parameters.find(row => row.parameter === 'ctg')?.status).toBe('Removed');
    expect(parameters.find(row => row.parameter === 'ctg')?.values).toEqual([]);
    expect(parameters.find(row => row.parameter === 'firstCategory')?.values).toEqual(['li', 'ad', 'di', 'oo', 'sh']);
    expect(parameters.find(row => row.parameter === 'dprods')?.behavior).toContain('only when amt');
    for (const parameter of ['category', 'categories', 'prods', 'applicant', 'featured_prod', 'firstCategory', 'amt', 'dprods', 'preselect']) {
      const library = parameters.find(row => row.parameter === parameter)!;
      const reference = referenceUrlParameters.find(row => row.parameter === parameter)!;
      expect(reference.newValues, parameter).toEqual(library.values);
      expect(reference.newBehavior, parameter).toEqual([library.behavior]);
    }
    const site = compiledConfiguration(data, 'asce');
    const policy = site.configuration.products.find(product => product.productKey === 'li-term')!.selectionPolicies[0].value as { riders: Array<{ baseAmountSource?: string }> };
    expect(policy.riders[0].baseAmountSource).toBe('requested-and-verified-existing');
    expect(libraryRequirementRows({ ...catalog, data }, 'asce').find(row => row.key === 'coverage-existing-policy-participation')?.site).toBe('Global template');
  });
  it('owns Eligibility sections, repeated records and verification surfaces globally without superseded records', () => {
    const input = withoutReviewedRecords(), source = freshStartSource();
    const library = resolvePrototypeLibrary(input, 'asce', 'eligibility-fresh-source');
    const page = library.site.configuration.pages.find(page => page.key === 'eligibility')!;
    expect(page.sections.map(section => section.definition.value.id)).toEqual(['selfEligibility', 'spouseSection', 'childSection']);
    expect(page.sections[0].definition.value.composition?.[1].components).toEqual([
      { type: 'EligibilityFields', fieldIds: ['zip-postal-code', 'state-province', 'birth-date'] },
      { type: 'FieldRenderer', fieldIds: ['dependents'] },
    ]);
    expect(library.fieldCollections.children.mapping.fields.map(field => field.id)).toEqual(['child-first-name', 'child-last-name', 'child-birth-date', 'child-gender', 'child-full-time-student']);
    expect(library.fieldSurfaces.verificationAddress.mapping.fields.map(field => field.id)).toEqual(['street-address', 'apt-suite', 'city', 'state', 'zip-code']);
    expect(library.fieldSurfaces.verificationQuestions.mapping.fields.map(field => field.label)).toEqual(source.verification.questions.map(question => question.question));
    const globalSource = structuredClone(source); globalSource.fields.sites = {};
    const globalOnly = compileRequirementCatalog(input, globalSource);
    const configuration = (path: string) => {
      const key = globalOnly.configurationDefinitions.find(row => row.definition.path?.join('.') === path)!.key;
      return globalOnly.configurationValues.find(row => row.configurationKey === key && row.scope === 'global')!.value;
    };
    expect(configuration('tpaIntegration.mode')).toBe('none');
    expect(configuration('tpaIntegration.lookupFields')).toEqual(['first-name', 'last-name', 'birth-date']);
    expect(configuration('fieldSurfaces')).toHaveProperty('verificationAddress');
    expect(configuration('fieldSurfaces')).toHaveProperty('verificationQuestions');
    expect(configuration('fieldCollections')).toHaveProperty('children.maxItems', 10);
    const childrenKey = globalOnly.configurationDefinitions.find(row => row.definition.path?.join('.') === 'fieldCollections')!.key;
    expect(globalOnly.configurationValues.find(row => row.configurationKey === childrenKey && row.scope === 'global')?.sourceReference).toContain('eligibility.json#layout/sections/children');
    expect(globalOnly.fields.find(row => row.key === 'sq-1')?.sourceReference).toBe('requirements/global/prototype-fixtures/verification.json');
  });
  it('inherits five Eligibility copy slots, resolves Site section notes and protects notice-only content', () => {
    const source = structuredClone(freshStartSource());
    expect(source.content['eligibility.note.self']).toBe('');
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const wording = { 'eligibility.title': 'Example Eligibility heading', 'eligibility.subhead': 'Example Eligibility introduction', 'eligibility.note.self': 'Example member note', 'eligibility.note.spouse': 'Example spouse note', 'eligibility.note.children': 'Example child notice' };
    source.fields.sitePages!.example.eligibility = { page: 'eligibility', content: wording, configurations: { 'child-collection-mode': 'notice-only' } };
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    const base = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'eligibility-copy-default');
    expect(base.content.pages.eligibility?.sectionNotes?.selfEligibility).toBe('');
    const example = buildPrototypeContent(compiled, { ...base.site, ...compiledConfiguration(compiled, 'example') });
    expect(example.pages.eligibility).toMatchObject({ title: wording['eligibility.title'], subhead: wording['eligibility.subhead'], sectionNotes: { selfEligibility: wording['eligibility.note.self'], spouseSection: wording['eligibility.note.spouse'], childSection: wording['eligibility.note.children'] } });
    expect(base.content.pages.eligibility?.sectionNotes?.spouseSection).toBe(source.content['eligibility.note.spouse']);
    expect(base.content.pages.eligibility?.title).toBe(source.content['eligibility.title']);
    expect(buildGlobalTemplate(catalog).content.pages.eligibility).toEqual(base.content.pages.eligibility);
    for (const scope of ['all', 'asce']) {
      const rows = configurationRows(catalog, scope).filter(row => row.group === 'Eligibility content');
      expect(rows.map(row => row.key).sort()).toEqual(Object.keys(wording).map(key => `content:${key}`).sort());
      expect(rows.find(row => row.key === 'content:eligibility.note.self')?.values).toBe('—');
      expect(rows.find(row => row.key === 'content:eligibility.note.children')?.description).toContain('child-collection-mode equals notice-only');
    }
    for (const key of ['eligibility.breadcrumb', 'eligibility.loading', 'eligibility.verification.method-intro', 'validation.page.ineligible', 'navigation.next']) {
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.example.eligibility = { page: 'eligibility', content: { [key]: source.content[key] } };
      expect(() => compileRequirementCatalog(data, invalid), key).toThrow(`Undeclared Site content slot: eligibility/${key}`);
    }
    const blank = structuredClone(source);
    (blank.fields.sitePages!.example.eligibility as { content: Record<string, unknown> }).content['eligibility.note.children'] = ' ';
    expect(() => compileRequirementCatalog(data, blank)).toThrow('Missing enabled content: example/eligibility/eligibility.note.children');
    blank.pages.eligibility.contentSlots!['eligibility.note.children'].requiredWhen!.equals = 'unsupported';
    expect(() => compileRequirementCatalog(data, blank)).toThrow('Invalid conditional content requirement: eligibility/eligibility.note.children');
    const malformed = structuredClone(source);
    (malformed.fields.sitePages!.example.eligibility as { content: Record<string, unknown> }).content['eligibility.note.self'] = [];
    expect(() => compileRequirementCatalog(data, malformed)).toThrow('Invalid Site content value: eligibility.note.self');
  });

  it('isolates effective Eligibility participation and collection overrides in synthetic assignments', () => {
    const fixture = buildGlobalTemplate(catalog, 'standard', undefined, { coveredPeople: ['self'], childMaximum: 2, includeStudent: false, tpaMode: 'none' });
    const page = fixture.site.configuration.pages.find(page => page.key === 'eligibility')!;
    expect(page.fields.filter(field => field.included).map(field => field.key)).toEqual(['zip-postal-code', 'state-province', 'birth-date']);
    expect(fixture.fieldCollections.children.maxItems).toBe(2);
    expect(fixture.client.tpaIntegration?.mode).toBe('none');
    const base = resolvePrototypeLibrary(catalog.data, 'asce', 'eligibility-unchanged');
    expect(base.fieldCollections.children.maxItems).toBe(10);
    expect(base.fieldCollections.children.mapping.fields.some(field => field.id === 'child-full-time-student')).toBe(true);
    expect(base.client.tpaIntegration?.mode).toBe('coverage-verification');
    expect(() => buildGlobalTemplate(catalog, 'standard', undefined, { childMaximum: 0 })).toThrow('Invalid fresh-start repeated list maximum');
    expect(() => buildGlobalTemplate(catalog, 'standard', undefined, { eligibleStates: ['ZZ'] })).toThrow('Invalid fresh-start eligible states');
  });
  it('keeps member Eligibility fields global and configures dependent defaults and additional questions independently', () => {
    const source = structuredClone(freshStartSource());
    const input = withoutReviewedRecords();
    source.fields.sitePages!.asce.eligibility = { ...source.fields.sitePages!.asce.eligibility as object,
      fieldParticipation: { spouse: { hide: ['membership', 'birth-date'] }, child: { hide: ['gender', 'last-name'], include: ['active-military'] } } };
    const library = resolvePrototypeLibrary(input, 'asce', 'synthetic:dependent-fields', source);
    const page = library.site.configuration.pages.find(page => page.key === 'eligibility')!;
    for (const id of ['zip-postal-code', 'state-province', 'birth-date']) expect(page.fields.find(field => field.key === id)).toMatchObject({ included: true, definition: { required: true } });
    expect(page.fields.some(field => field.included && ['spouse-membership', 'spouse-birth-date'].includes(field.key))).toBe(false);
    expect(library.fieldCollections.children.mapping.fields.map(field => field.id)).toEqual(['child-first-name', 'child-birth-date', 'child-full-time-student', 'child-active-military']);
    const child = { 'child-first-name': 'Avery', 'child-birth-date': '2015-05-14', 'child-full-time-student': 'yes', 'child-active-military': 'no' };
    expect(validateFieldCollection(library.fieldCollections.children, [child])).toBeUndefined();
    expect(validateFieldCollection(library.fieldCollections.children, [{ ...child, 'child-active-military': '' }])).toBeTruthy();
    expect(applicationApplicantFactSet({ children: [child] }, 'child')[0].activeMilitary).toBe(false);
    const asce = resolvePrototypeLibrary(input, 'asce', 'unchanged:dependent-defaults');
    expect(asce.fieldCollections.children.mapping.fields.map(field => field.id)).toEqual(['child-first-name', 'child-last-name', 'child-birth-date', 'child-gender', 'child-full-time-student']);
    expect(storedFieldRows({ ...catalog, data: input }, 'all').some(row => row.key === 'child-active-military')).toBe(true);
  });
  it('validates active TPA lookup inputs and unambiguous fixtures through the fresh source', () => {
    const source = structuredClone(freshStartSource());
    const input = withoutReviewedRecords();
    const tpa = source.siteEligibility.asce.tpa as { lookupFields: string[]; prototypeRecords: Array<{ facts: Record<string, string>; activeCoverage: boolean }> };
    const originalFields = [...tpa.lookupFields];
    tpa.lookupFields = ['street-address'];
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Unavailable fresh-start TPA lookup field');
    tpa.lookupFields = originalFields;
    const record = structuredClone(tpa.prototypeRecords[0]);
    delete tpa.prototypeRecords[0].facts['member-id'];
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Incomplete fresh-start TPA fixture');
    tpa.prototypeRecords = [record, { facts: Object.fromEntries(Object.entries(record.facts).map(([key, value]) => [key, ` ${value.toUpperCase()} `])), activeCoverage: false }];
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Ambiguous fresh-start TPA fixture');
    tpa.prototypeRecords = [record];
    const overrides = source.fields.sites.asce as { fields: Record<string, unknown> };
    overrides.fields['birth-date'] = { required: { spouse: false, child: false } };
    const optional = compiledConfiguration(compileRequirementCatalog(input, source, 'asce'), 'asce').configuration;
    expect(optional.pages.find(page => page.key === 'eligibility')?.fields.find(field => field.key === 'birth-date')?.definition.required).toBe(true);
    expect(optional.pages.find(page => page.key === 'eligibility')?.fields.find(field => field.key === 'spouse-birth-date')?.definition.required).toBe(false);
    expect(optional.pages.find(page => page.key === 'home')?.fields.find(field => field.key === 'birth-date')?.definition.required).toBe(true);
    source.fields.sitePages!.asce.membership = { ...source.fields.sitePages!.asce.membership as object, include: [] };
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Unavailable fresh-start TPA lookup field');
    source.siteEligibility.asce.configurations['tpa-integration'] = 'none';
    const configured = compiledConfiguration(compileRequirementCatalog(input, source, 'asce'), 'asce').configuration;
    expect(configured.pages.find(page => page.key === 'membership')?.fields.some(field => field.key === 'member-id' && field.included)).toBe(false);
    const modeKey = catalog.data.configurationDefinitions.find(row => row.definition.path?.join('.') === 'tpaIntegration.mode')?.key;
    expect(configured.configurations.find(row => row.key === modeKey)?.value).toBe('none');
  });
  it('compiles Membership composition, field ownership and effective option outcomes without old page records', () => {
    const data = compileRequirementCatalog(withoutReviewedRecords(), freshStartSource(), 'asce');
    const page = compiledConfiguration(data, 'asce').configuration.pages.find(page => page.key === 'membership')!;
    expect(page.sections.map(section => section.definition.value.id)).toEqual(['default', 'membershipInformation']);
    expect(page.sections[0].definition.value.composition).toEqual([{ type: 'FieldGroup', components: [
      { type: 'MembershipStatus', fieldIds: ['membership'] },
      { type: 'MemberInformation', fieldIds: ['title', 'first-name', 'last-name', 'email', 'phone'] },
    ] }]);
    const fields = page.fields.filter(field => field.included).map(field => field.definition);
    for (const id of ['first-name', 'phone', 'phone-type', 'member-id']) {
      const field = fields.find(field => field.id === id)!;
      const condition = data.conditions.find(condition => condition.key === field.visibilityConditionId)!.definition;
      expect(evaluateCondition(condition, { membership: 'yes' }, fields)).toBe(true);
      for (const membership of ['no', '', 'new']) expect(evaluateCondition(condition, { membership }, fields)).toBe(false);
    }
    const fixture = buildGlobalTemplate(catalog, 'standard', { configuration: 'new-or-current' });
    const example = fixture.site.configuration.pages.find(page => page.key === 'membership')!;
    const exampleFields = example.fields.filter(field => field.included).map(field => field.definition);
    const condition = fixture.site.configuration.conditions.find(row => row.value.definition.id === exampleFields.find(field => field.id === 'first-name')!.visibilityConditionId)!.value.definition;
    for (const membership of ['new', 'current']) expect(evaluateCondition(condition, { membership }, exampleFields)).toBe(true);
    expect(evaluateCondition(condition, { membership: 'yes' }, exampleFields)).toBe(false);
    expect(fields.find(field => field.id === 'member-id')).toMatchObject({ required: true, format: 'digits', minLength: 6 });
    expect(exampleFields.some(field => field.id === 'member-id')).toBe(false);
  });
  it('validates Site-defined Membership category semantics through the fresh projection without changing ASCE defaults', () => {
    const source = structuredClone(freshStartSource());
    const fields = source.fields.sites.asce as { fields: Record<string, unknown> };
    const options = [
      { value: 'professional', label: 'Professional', outcome: 'member' },
      { value: 'joining', label: 'Joining', outcome: 'new-member' },
      { value: 'not-qualified', label: 'Not qualified', outcome: 'not-eligible' },
    ];
    fields.fields.membership = { configuration: 'category', options };
    const compiled = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const page = compiledConfiguration(compiled, 'asce').configuration.pages.find(row => row.key === 'membership')!;
    expect(page.fields.find(row => row.key === 'membership')?.definition).toMatchObject({ configuration: 'category', options });
    fields.fields.membership = { configuration: 'category', options: [{ value: 'professional', label: 'Professional', outcome: 'unsupported' }] };
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), source, 'asce')).toThrow('Invalid site option outcome: asce/membership');
    const original = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'membership-config-defaults');
    expect(original.site.configuration.pages.find(row => row.key === 'membership')?.fields.find(row => row.key === 'membership')?.definition.configuration).toBe('yes-no');
  });
  it('fixes global pages and order while supporting only Beneficiary/Payment participation choices', () => {
    const source = structuredClone(freshStartSource());
    const input = withoutReviewedRecords();
    const stale = { ...catalog.data.pages.find(row => row.key === 'membership')!, id: 'stale-site-page', key: 'stale-site-page' };
    stale.definition = { ...stale.definition, id: stale.key as PageId, path: '/stale-site-page' };
    input.pages.push(stale);
    for (const requirement of ['none', 'optional', 'required']) {
      for (const key of ['beneficiary', 'payment']) source.fields.sitePages!.asce[key] = { ...source.fields.sitePages!.asce[key] as object, requirement };
      const compiled = compileRequirementCatalog(input, source, 'asce');
      expect(compiled.pages.some(page => page.key === stale.key)).toBe(false);
      const effective = compiledConfiguration(compiled, 'asce').configuration.pages;
      for (const page of Object.values(source.pages)) {
        const key = page.consumerKey ?? page.page;
        expect(compiled.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === key)?.position, key).toBe(page.position);
        expect(effective.find(row => row.key === key)?.requirement, key).toBe(['beneficiary', 'payment'].includes(key) ? requirement : 'required');
      }
    }
  });
  it('enforces global Membership entry and field constraints without superseded records', () => {
    const source = structuredClone(freshStartSource());
    const data = withoutReviewedRecords();
    const sitePage = source.fields.sitePages!.asce as Record<string, Record<string, unknown>>;
    for (const assignment of [{ requirement: 'none' }, { requirement: 'optional' }, { position: 2 }]) {
      const original = sitePage.membership;
      sitePage.membership = { ...original, ...assignment };
      expect(() => compileRequirementCatalog(data, source, 'asce')).toThrow(assignment.position !== undefined ? 'Page order is global' : 'Page participation is not configurable');
      sitePage.membership = original;
    }
    for (const position of [0, 1]) {
      const original = sitePage.coverage;
      sitePage.coverage = { ...original, position };
      expect(() => compileRequirementCatalog(data, source, 'asce')).toThrow('Page order is global');
      sitePage.coverage = original;
    }
    const fields = source.fields.sites.asce as { fields: Record<string, unknown> };
    fields.fields.email = { required: false };
    expect(() => compileRequirementCatalog(data, source, 'asce')).toThrow('Required mapped field cannot be optional');
    fields.fields.email = { format: 'digits' };
    expect(() => compileRequirementCatalog(data, source, 'asce')).toThrow('Fixed mapped field property');
    delete fields.fields.email;
    sitePage.membership = { ...sitePage.membership, requirement: 'required', position: 1 };
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const page = compiledConfiguration(compiled, 'asce').configuration.pages.find(page => page.key === 'membership')!;
    expect(page.requirement).toBe('required');
    expect(compiled.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'membership')?.position).toBe(1);
    const core = ['membership', 'first-name', 'last-name', 'email', 'phone', 'phone-type'];
    expect(core.every(id => page.fields.some(field => field.key === id && field.included && field.definition.required))).toBe(true);
    expect(page.fields.find(field => field.key === 'email')?.definition.format).toBe('email');
    expect(page.fields.find(field => field.key === 'phone')?.definition.format).toBe('phone');
    expect(libraryRequirementRows({ ...catalog, data: compiled }, 'asce').some(row => row.key === 'membership-core-configuration-constraints')).toBe(true);
  });
  it('projects Membership copy overrides while keeping global defaults, note ownership and protected messages intact', () => {
    const source = structuredClone(freshStartSource());
    const note = 'membership.page-note';
    expect(source.content[note]).toBe('');
    expect(Object.hasOwn(source.content, 'membership.note.member-profession')).toBe(false);
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.fields.sitePages!.example.membership = { page: 'membership' };
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const base = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'membership-copy-defaults');
    const compiled = compileRequirementCatalog(data, source);
    const asceNote = (source.fields.sitePages!.asce.membership as { content: Record<string, string> }).content[note];
    const contentFor = (data: typeof compiled, key: string) => buildPrototypeContent(data, { ...base.site, ...compiledConfiguration(data, key) });
    expect(contentFor(compiled, 'asce').pages.membership?.infoNote).toBe(asceNote);
    expect(contentFor(compiled, 'example').pages.membership?.infoNote).toBe('');
    const wording = {
      'membership.physician.title': 'Associated professional information',
      'membership.physician.note': 'Supply the associated professional details.',
      'membership.title': 'Example application title',
      'membership.subhead': 'Example application introduction',
      'membership.page-note': 'Example membership note',
      'membership.not-member.heading': 'Example joining heading',
      'membership.not-member.body': 'Example joining guidance',
      'membership.not-member.website': 'Contact {{clientWebsite}} or {{clientPhone}}.',
    };
    source.fields.sitePages!.example.membership = { page: 'membership', content: wording };
    const changed = compileRequirementCatalog(data, source);
    const example = contentFor(changed, 'example');
    for (const [key, value] of Object.entries(wording)) {
      const target = [source.contentBindings[key] ?? key].flat()[0];
      expect(target.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], example)).toBe(value);
    }
    expect(contentFor(changed, 'asce').pages.membership?.title).toBe(source.content['membership.title']);
    expect(contentFor(changed, 'asce').pages.membership?.infoNote).toBe(asceNote);
    expect(changed.contentValues.find(row => row.scope === 'global' && row.contentKey === 'pages.membership.infoNote')?.value).toBe('');
    const slots = Object.keys(source.pages.membership.contentSlots!);
    expect(slots.sort()).toEqual(Object.keys(wording).sort());
    for (const scope of ['all', 'asce']) {
      expect(configurationRows(catalog, scope).filter(row => row.group === 'Membership content').map(row => row.key).sort()).toEqual(slots.map(key => `content:${key}`).sort());
    }
    for (const key of ['membership.breadcrumb', 'membership.loading', 'membership.not-member.message', 'navigation.next']) {
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.example.membership = { page: 'membership', content: { [key]: source.content[key] } };
      expect(() => compileRequirementCatalog(data, invalid), key).toThrow(`Undeclared Site content slot: membership/${key}`);
    }
  });

  it('shares approved headers across the remaining form pages without enabling pages or exposing Coverage policy copy', () => {
    const source = structuredClone(freshStartSource());
    const pages = ['coverage', 'beneficiary', 'contact', 'profile', 'review', 'payment', 'health-si', 'health-tele', 'health-qd', 'health-di-supp', 'health-cir', 'advisor-login', 'receipt'] as const;
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const expected: Record<string, { title: string; subhead: string }> = {};
    const keys: string[] = [];
    for (const page of pages) {
      const values: Record<string, string> = {};
      expected[page] = { title: `Configured ${page} heading`, subhead: `Configured ${page} introduction` };
      for (const part of ['title', 'subhead'] as const) {
        const key = Object.keys(source.contentBindings).find(key => [source.contentBindings[key]].flat().includes(`pages.${page}.${part}`))!;
        expect(source.pages[page].contentSlots).toHaveProperty([key]);
        values[key] = expected[page][part]; keys.push(key);
      }
      const assignment = source.fields.sitePages!.example[page] as { content?: Record<string, unknown> };
      source.fields.sitePages!.example[page] = { ...assignment, content: { ...assignment?.content, ...values } };
    }
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    const base = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'shared-header-defaults');
    const exampleConfiguration = compiledConfiguration(compiled, 'example');
    const content = buildPrototypeContent(compiled, { ...base.site, ...exampleConfiguration });
    for (const page of pages) {
      expect(content.pages[page]).toMatchObject(expected[page]);
      expect(pagesDefaults[page]?.title).toBe(base.content.pages[page]?.title);
      expect(pagesDefaults[page]?.subhead).toBe(base.content.pages[page]?.subhead);
      expect(base.content.pages[page]?.title).not.toBe(expected[page].title);
      expect(exampleConfiguration.configuration.pages.find(row => row.key === page)?.requirement).toBe(base.site.configuration.pages.find(row => row.key === page)?.requirement);
    }
    for (const scope of ['all', 'asce']) {
      const rows = configurationRows(catalog, scope);
      expect(rows.map(row => row.key)).toEqual(expect.arrayContaining(keys.map(key => `content:${key}`)));
    }
    for (const key of ['coverage.increase.total-note', 'coverage.increase.additional-note', 'coverage.error.combined-life-maximum', 'coverage.coverage-cart.quoted-cost-is-the-best-rate-available-final', 'coverage.breadcrumb']) {
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.example.coverage = { page: 'coverage', content: { [key]: source.content[key] } };
      expect(() => compileRequirementCatalog(data, invalid), key).toThrow(`Undeclared Site content slot: coverage/${key}`);
    }
    for (const [page, protectedKeys] of Object.entries({
      profile: ['profile.section.personal', 'profile.section.other-coverage', 'profile.section.financial-questionnaire', 'profile.other-coverage-note'],
      review: ['application.ui.preview-your-application', 'application.ui.check-your-answers-and-use-edit-to-make-corrections-before-continuing', 'application.ui.read-and-consent', 'application.ui.read-the-statements-and-electronic-consent-below-then-confirm-your-agreement-t'],
    })) {
      const headerKeys = Object.keys(source.pages[page].contentSlots!);
      expect(headerKeys.sort()).toEqual([`page.${page}.subhead`, `page.${page}.title`]);
      for (const key of protectedKeys) {
        expect(source.content[key], key).toEqual(expect.any(String));
        const invalid = structuredClone(source);
        invalid.fields.sitePages!.example[page] = { page, content: { [key]: 'Unsupported Site wording' } };
        expect(() => compileRequirementCatalog(data, invalid), key).toThrow(`Undeclared Site content slot: ${page}/${key}`);
      }
    }
  });

  it('keeps confirmation, Resume and DocuSign page copy global while declaring only Advisor entry headers', () => {
    const source = freshStartSource(), data = withoutReviewedRecords();
    expect(Object.keys(source.pages['advisor-login'].contentSlots!).sort()).toEqual(['page.advisor-login.subhead', 'page.advisor-login.title']);
    const protectedPages: Record<string, string[]> = {
      'advisor-login': ['page.advisor-login.section-notes.advisor-login-new', 'page.advisor-login.section-notes.advisor-login-saved'],
      'advisor-send-confirmation': ['confirmation.advisor.title', 'confirmation.advisor.message'],
      'application-edit-confirmation': ['confirmation.edit.title', 'confirmation.edit.message'],
      resume: ['page.resume.title', 'resume.error.link-limit'],
      'resume-method': ['page.resume-method.title'],
      'resume-code': ['page.resume-code.title', 'resume.error.invalid-code'],
      docusign: ['page.docusign.title', 'handoff.continue'],
    };
    for (const [page, keys] of Object.entries(protectedPages)) {
      if (page !== 'advisor-login') expect(Object.keys(source.pages[page].contentSlots ?? {})).toEqual([]);
      for (const key of keys) {
        const invalid = structuredClone(source);
        invalid.fields.sitePages!.asce[page] = { page, content: { [key]: 'Unsupported Site wording' } };
        expect(() => compileRequirementCatalog(data, invalid, 'asce'), key).toThrow(`Undeclared Site content slot: ${page}/${key}`);
      }
    }
    const model = resolvePrototypeLibrary(data, 'asce', 'global-terminal-copy', source);
    for (const page of ['advisor-send-confirmation', 'application-edit-confirmation', 'resume', 'resume-method', 'resume-code', 'docusign'] as const) {
      const content = model.content.pages[page]!;
      expect(content).toBeDefined();
      expect(pagesDefaults[page]).toMatchObject({ title: content.title, subhead: content.subhead, navTitle: content.navTitle });
    }
  });
  it('projects all approved Receipt copy while rejecting global security, section and email-signature overrides', () => {
    const source = structuredClone(freshStartSource()), data = withoutReviewedRecords();
    const slots = Object.keys(source.pages.receipt.contentSlots!);
    expect(slots).toHaveLength(18);
    const protectedKeys = ['receipt.documents-note', 'receipt.coverage-decisions.description', 'receipt.email.signature'];
    const copy = Object.fromEntries(slots.map(key => [key, key === 'receipt.underwriting-note' ? { title: 'Configured provider heading', text: 'Configured provider explanation' } : `Configured ${key}`]));
    source.fields.sitePages!.asce.receipt = { ...source.fields.sitePages!.asce.receipt as object, content: copy };
    const pathFor = (key: string) => [source.contentBindings[key]].flat()[0];
    for (const key of protectedKeys) {
      expect(slots).not.toContain(key);
      data.contentValues.push({ ...catalog.data.contentValues[0], id: `stale-${key}`, key: `stale-${key}`, contentKey: pathFor(key), scope: 'site', siteKey: 'asce', clientKey: null, value: 'Superseded Site copy' });
    }
    const model = resolvePrototypeLibrary(data, 'asce', 'receipt-approved-copy', source);
    const read = (path: string) => {
      let value: unknown = model.content;
      for (const part of path.split('.')) value = (value as Record<string, unknown>)[part];
      return value;
    };
    for (const [key, value] of Object.entries(copy)) {
      expect(read(pathFor(key)), key).toEqual(value);
      expect(source.content[key], key).not.toEqual(value);
    }
    for (const key of protectedKeys) {
      expect(read(pathFor(key)), key).toEqual(source.content[key]);
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.asce.receipt = { page: 'receipt', content: { [key]: 'Unsupported Site wording' } };
      expect(() => compileRequirementCatalog(data, invalid, 'asce'), key).toThrow(`Undeclared Site content slot: receipt/${key}`);
    }
    for (const scope of ['all', 'asce']) {
      const rows = configurationRows(catalog, scope).filter(row => slots.some(key => row.key === `content:${key}`));
      expect(rows).toHaveLength(18);
    }
  });
  it('inherits Maintenance copy and permits only its three overrides across redirect variants', () => {
    const source = structuredClone(freshStartSource()), data = withoutReviewedRecords();
    const copy = { 'recovery.maintenance.title': 'Configured maintenance title', 'recovery.maintenance.message': 'Configured maintenance explanation', 'recovery.maintenance.guidance': '' };
    expect(Object.keys(source.pages.maintenance.contentSlots!).sort()).toEqual(Object.keys(copy).sort());
    source.fields.sitePages!.asce.maintenance = { ...source.fields.sitePages!.asce.maintenance as object, content: copy };
    const changed = resolvePrototypeLibrary(data, 'asce', 'maintenance-site-copy', source);
    expect(changed.content.pages.maintenance).toMatchObject({ title: copy['recovery.maintenance.title'], subhead: copy['recovery.maintenance.message'], recoveryGuidance: '' });
    const inherited = resolvePrototypeLibrary(data, 'asce', 'maintenance-default-copy');
    expect(inherited.content.pages.maintenance).toMatchObject({ title: source.content['recovery.maintenance.title'], subhead: source.content['recovery.maintenance.message'], recoveryGuidance: source.content['recovery.maintenance.guidance'] });
    expect(pagesDefaults.maintenance).toMatchObject(inherited.content.pages.maintenance!);
    for (const [page, key] of [['error-400', 'recovery.400.title'], ['not-found', 'recovery.404.message'], ['error-500', 'recovery.500.guidance'], ['technical-error', 'recovery.technical-error.title'], ['session-expired', 'recovery.session-expired.guidance'], ['maintenance', 'recovery.action.resume']]) {
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.asce[page] = { page, content: { [key]: 'Unsupported Site wording' } };
      expect(() => compileRequirementCatalog(data, invalid, 'asce'), key).toThrow(`Undeclared Site content slot: ${page}/${key}`);
    }
    for (const scope of ['all', 'asce']) {
      expect(configurationRows(catalog, scope).filter(row => Object.keys(copy).some(key => row.key === `content:${key}`))).toHaveLength(3);
    }
    expect(changed.site.configuration.pages.find(page => page.key === 'maintenance')?.requirement).toBe(inherited.site.configuration.pages.find(page => page.key === 'maintenance')?.requirement);
    expect(source.recovery.states.maintenance.actions).toEqual([]);
  });
  it('owns confirmed application inactivity timing globally and retires provisional rules', () => {
    const source = structuredClone(freshStartSource());
    const input = withoutReviewedRecords();
    const data = compileRequirementCatalog(input, source, 'asce');
    const prototype = resolvePrototypeLibrary(data, 'asce', 'confirmed-application-timing', source);
    const story = buildGlobalTemplate({ ...catalog, data });
    expect(prototype.settings.applicationSessionPolicy).toEqual({ inactivityMinutes: 45, warningMinutes: 2 });
    expect(story.settings.applicationSessionPolicy).toEqual(prototype.settings.applicationSessionPolicy);
    const sitePage: { page: string; configurations: Record<string, unknown> } = { page: 'technical-error', configurations: {} };
    source.fields.sitePages!.asce['technical-error'] = sitePage;
    const inspections = ['all', 'asce'].map(scope => ({ configurations: configurationRows({ ...catalog, data }, scope), rules: libraryRequirementRows({ ...catalog, data }, scope) }));
    for (const id of ['application-inactivity-minutes', 'application-session-warning-minutes']) {
      const configuration = source.configurations.find(row => row.id === id)!;
      const definition = data.configurationDefinitions.find(row => row.definition.path?.join('.') === source.configurationBindings[id])!;
      expect(definition.definition.metadata).toMatchObject({ globalOnly: true, scope: 'Global template; Site overrides prohibited' });
      expect(data.configurationValues.filter(row => row.configurationKey === definition.key).map(row => row.scope)).toEqual(['global']);
      for (const rows of inspections) expect(rows.configurations.find(row => row.key === definition.key)?.scope).toBe('Global template; Site overrides prohibited');
      sitePage.configurations = { [id]: configuration.default };
      expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow(`Global-only configuration cannot be overridden: asce/${id}`);
    }
    sitePage.configurations = {};
    for (const id of ['application-session-warning', 'application-session-expired']) {
      for (const rows of inspections) expect(rows.rules.filter(row => row.key === id)).toHaveLength(1);
      expect(data.rules.some(row => row.key === `rule-${id}`)).toBe(false);
      expect(confirmedRequirementBehaviors(['session-expired']).some(row => row.id === id)).toBe(true);
    }
    source.configurations.find(row => row.id === 'application-inactivity-minutes')!.default = 1.5;
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Invalid application session configuration');
    source.configurations.find(row => row.id === 'application-inactivity-minutes')!.default = 45;
    source.configurations.find(row => row.id === 'application-session-warning-minutes')!.default = 45;
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('Application warning must precede expiry');
  }, 45_000);
  it('retires workbook content paths and reconstructs the active Library without parked imports', () => {
    const source = freshStartSource(), input = withoutReviewedRecords();
    const evidence = JSON.parse(readFileSync('docs/archive/content-workbook-extracts.json', 'utf8'));
    expect(evidence.contentEntries).toHaveLength(86);
    input.contentEntries.push(...evidence.contentEntries);
    input.contentValues.push(...evidence.contentValues);
    const library = projectLibraryCatalog({ ...catalog, data: input }, input.sites.map(site => site.key));
    expect(library.data.sites.map(site => site.key)).toEqual(input.sites.filter(site => Object.hasOwn(source.fields.sites, site.key)).map(site => site.key));
    expect(library.data.products.map(row => row.key).sort()).toEqual(source.products.catalog.products.map(row => row.key).sort());
    for (const table of ['contentEntries', 'contentValues', 'products', 'coveragePlanDefinitions'] as const) expect(library.data[table].some(row => row.key?.startsWith('mcr.')), table).toBe(false);
    const invalid = structuredClone(source);
    invalid.application.records.contentEntries.push(evidence.contentEntries[0]);
    expect(() => compileRequirementCatalog(input, invalid, 'asce')).toThrow('Active retired application definition: retiredContentRoots');
    const invalidValue = structuredClone(source);
    invalidValue.application.records.contentValues.push(evidence.contentValues[0]);
    expect(() => compileRequirementCatalog(input, invalidValue, 'asce')).toThrow('Assignment to retired application content');
  });
  it('maps Home presentation settings and all effective quote-entry field checks', () => {
    const mapping = JSON.parse(readFileSync('requirements/mappings/requirements/home.json', 'utf8'));
    expect(mapping.configurations).toEqual(expect.arrayContaining(['home-variant', 'applying-steps-presentation', 'form-template']));
    expect(mapping.validations).toContainEqual({ validation: 'field-definition-checks', trigger: 'get-quote', fields: ['zip-postal-code', 'state-province', 'birth-date'] });
    const quoteEntry = freshStartSource().application.records.flowSteps.find(row => (row.definition as { id?: string })?.id === 'quote-entry');
    const entry = quoteEntry?.definition as { description: string; workflowKeys: string[] };
    expect(entry.description).toContain('Membership has no quote helper.');
    expect(entry.workflowKeys).toEqual(expect.arrayContaining(['quote-entry-open-calculator', 'home-quote-entry-handoff']));
  });
  it('inherits the updated global Home defaults and shared interaction requirements without new Site copy', () => {
    const source = freshStartSource(), data = withoutReviewedRecords();
    const model = resolvePrototypeLibrary(data, 'asce', 'global-home-interactions', source);
    expect(model.content.home.hero.title).toBe('Coverage for what matters most.');
    expect(model.content.home.hero.tagline).toBe('{{clientAcronym}} Member Insurance');
    expect(model.content.home.hero.ctaLabel).toBe('Start application here');
    expect(model.content.home.hero.secondaryCtaLabel).toBe('Continue here.');
    expect(model.content.home.quoteSection.title).toBe('Get a quote in seconds.');
    expect(Object.keys(source.pages.home.contentSlots!)).toHaveLength(12);
    const siteCopy = (source.fields.sitePages!.asce.home as { content?: Record<string, unknown> } | undefined)?.content ?? {};
    for (const key of ['home.hero.title', 'home.hero.description', 'home.hero.tagline', 'home.hero.cta-label', 'home.hero.resume-prefix', 'home.quote-section.title']) expect(siteCopy).not.toHaveProperty(key);
    for (const scope of ['all', 'asce']) {
      const rows = libraryRequirementRows({ ...catalog, data }, scope);
      for (const id of ['home-entry-presentation', 'shared-action-typography', 'eligibility-shared-feedback-spacing']) expect(rows.filter(row => row.key === id)).toHaveLength(1);
    }
  });
  it('uses the shared expiration page for MFA sessions while retaining inline link/code expiry', () => {
    const source = freshStartSource(), data = withoutReviewedRecords();
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const steps = compiled.flowSteps.filter(row => row.flowKey === 'global:*.resume');
    const edges = compiled.flowTransitions.filter(row => row.flowKey === 'global:*.resume');
    expect(steps.find(row => row.definition.id === 'resume-session-expired')?.definition).toMatchObject({ kind: 'page', pageId: 'session-expired' });
    for (const condition of ['MFA session expired', 'Existing MFA session expired']) expect(edges.find(row => row.definition.condition === condition)?.definition.target).toBe('resume-session-expired');
    expect(edges.find(row => row.definition.condition === 'Invalid, expired or used link')?.definition.target).toBe('resume-request');
    expect(edges.find(row => row.definition.condition?.startsWith('Code expired/replaced'))?.definition.target).toBe('resume-code');
    expect(compiled.contentEntries.some(row => ['resume.error.mfa-expired', 'resume.error.mfaExpired'].includes(row.key))).toBe(false);
    const site = compiledConfiguration(compiled, 'asce');
    expect(site.configuration.pages.find(row => row.key === 'session-expired')).toBeDefined();
    expect(source.recovery.states['session-expired'].family).toBe('expired');
  });
  it('inherits Home content and shared category/product presentation, with isolated Site overrides', () => {
    const source = structuredClone(freshStartSource());
    const marketing = {
      "home.hero.tagline": "Example hero tagline",
      "home.how-applying-works.title": "Example how applying works heading",
      "home.how-applying-works.description": "Example how applying works introduction",
      "home.coverage-options.title": "Example coverage options heading",
      "home.coverage-options.description": "Example coverage options introduction",
      "home.quote-section.title": "Example quote introduction heading",
      "home.quote-section.description": "Example quote introduction description"
    };
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.fields.sitePages!.example.home = { page: 'home', content: {
      ...marketing,
      'home.hero.title': 'Shared template, local headline',
      'home.hero.description': 'Designed for {{clientName}}.',
      'home.client-section': { tagline: 'About the association', paragraphs: ['Association introduction.'] },
      'home.hero.image': { src: '/quote.jpg', alt: 'Example Site hero' },
      'home.landing-notice': { title: 'Example notice', text: 'Example Site entry content.' },
    }, configurations: { 'home-variant': 'hero-image', 'home-landing-notice': true, 'form-template': 'single' } };
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteProducts.example.categories = { LI: { name: 'Life protection', description: 'Shared category introduction.' } };
    source.siteProducts.example.products['li-term'] = { name: 'Local Term Life', description: 'Shared product introduction.' };
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    const base = resolvePrototypeLibrary(catalog.data, 'asce', 'home-presentation');
    for (const key of ['asce', 'example']) {
      const compiledSite = compiledConfiguration(compiled, key);
      const effective = { ...base.site, ...compiledSite, configuration: { ...compiledSite.configuration, ratePresentationPolicies: base.site.configuration.ratePresentationPolicies } };
      const { client } = buildPrototypeClient(compiled, effective);
      const content = buildPrototypeContent(compiled, effective);
      for (const [key, value] of Object.entries(marketing)) {
        const target = [source.contentBindings[key]].flat()[0];
        const projected = target.split('.').reduce<unknown>((current, key) => (current as Record<string, unknown>)[key], content);
        expect(projected, `${key}/${effective.siteKey}`).toBe(effective.siteKey === 'example' ? value : source.content[key]);
      }
      expect(content.home.applyingSteps).toEqual(source.content['home.applying-steps']);
      expect(content.home.hero.ctaLabel).toBe(source.content['home.hero.cta-label']);
      expect(content.home.hero.secondaryCtaLabel).toBe(source.content['home.hero.secondary-cta-label']);
      expect(content.home.hero.title).toBe(key === 'example' ? 'Shared template, local headline' : source.content['home.hero.title']);
      expect(content.home.clientSection).toEqual(key === 'example' ? { tagline: 'About the association', paragraphs: ['Association introduction.'] } : { tagline: '', paragraphs: [] });
      expect(getCoverageCategories(client.coverages.categoryNames).find(category => category.id === 'LI')?.label).toBe(key === 'example' ? 'Life protection' : 'Life');
      expect(content.coverage.categoryDescriptions.LI).toBe(key === 'example' ? 'Shared category introduction.' : source.content['coverage.category.li.description']);
      const term = effective.configuration.products.find(product => product.productKey === 'li-term')!;
      expect(term.presentation.find(value => value.key === 'name')?.value).toBe(key === 'example' ? 'Local Term Life' : source.content[source.products.products.find(product => product.id === 'li-term')!.content.name!]);
      expect(term.presentation.find(value => value.key === 'description')?.value).toBe(key === 'example' ? 'Shared product introduction.' : source.siteProducts.asce.products['li-term'].description);
      expect(client.features?.homePageVariant).toBe(key === 'example' ? 'hero-image' : 'default');
      expect(client.features?.homeLandingNotice).toBe(key === 'example');
      expect(client.features?.defaultTemplate).toBe(key === 'example' ? 'single' : 'multi');
      expect(compiled.sites.find(site => site.key === key)?.templateType).toBe(client.features?.defaultTemplate);
      expect(content.home.hero.image.src).toBe(key === 'example' ? '/quote.jpg' : '/hero.svg');
      expect(content.home.landingNotice.title).toBe(key === 'example' ? 'Example notice' : '');
      expect(buildPrototypeClient(compiled, { ...effective, configuration: { ...effective.configuration, ratePresentationPolicies: [] } }).client.features?.homePageVariant).toBe('hero-image');
    }
    const invalid = structuredClone(source);
    (invalid.fields.sitePages!.example.home as { content: Record<string, unknown> }).content['home.unknown'] = 'Unbound content';
    expect(() => compileRequirementCatalog(data, invalid)).toThrow('Undeclared Site content slot');
    delete (invalid.fields.sitePages!.example.home as { content: Record<string, unknown> }).content['home.unknown'];
    (invalid.fields.sitePages!.example.home as { content: Record<string, unknown> }).content['home.client-section'] = 'Incorrect shape';
    expect(() => compileRequirementCatalog(data, invalid)).toThrow('Invalid Site content value');
  });

  it('exposes only declared Home copy slots in the Library and rejects global process/action overrides', () => {
    const source = freshStartSource();
    const approved = Object.keys(source.pages.home.contentSlots!);
    expect(approved).toHaveLength(12);
    const additions = ['home.hero.tagline', 'home.how-applying-works.title', 'home.how-applying-works.description', 'home.coverage-options.title', 'home.coverage-options.description', 'home.quote-section.title', 'home.quote-section.description'];
    expect(approved).toEqual(expect.arrayContaining(additions));
    const locked = ['home.applying-steps', 'home.hero.cta-label', 'home.hero.secondary-cta-label', 'home.quote-section.action'];
    for (const scope of ['all', 'asce']) {
      const rows = configurationRows(catalog, scope).filter(row => row.group === 'Home content');
      expect(rows.map(row => row.key).sort()).toEqual(approved.map(key => `content:${key}`).sort());
      for (const key of locked) expect(rows.some(row => row.key === `content:${key}`)).toBe(false);
    }
    for (const key of locked) {
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.asce.home = { page: 'home', content: { [key]: source.content[key] } };
      expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalid), key).toThrow(`Undeclared Site content slot: home/${key}`);
    }
    const invalid = structuredClone(source);
    invalid.fields.sitePages!.asce.home = { page: 'home', content: { 'home.hero.tagline': ['invalid shape'] } };
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalid)).toThrow('Invalid Site content value: home.hero.tagline');
  });

  it('reconstructs Home sections, tool hosting, notice and assets without superseded authored records', () => {
    const source = freshStartSource(), input = withoutReviewedRecords();
    input.configurationDefinitions = input.configurationDefinitions.filter(row => row.key !== 'shared.applicantExperience.landingNotice');
    input.configurationValues = input.configurationValues.filter(row => row.configurationKey !== 'shared.applicantExperience.landingNotice');
    const library = resolvePrototypeLibrary(input, 'asce', 'home-complete-source');
    const story = buildGlobalTemplate({ ...catalog, data: input }, 'multipleTerms');
    const sections = library.site.configuration.pages.find(page => page.key === 'home')!.sections.map(section => section.definition.value);
    expect(sections.map(section => section.id)).toEqual(source.sectionOrders.home);
    expect(sections.map(section => section.components)).toEqual([['HomeHero'], ['HowApplyingWorksPanel'], ['HomeCoverageSection'], ['AssociationIntroduction', 'UnderwriterCredentials']]);
    expect(sections[0].fieldIds).toEqual(['zip-postal-code', 'state-province', 'birth-date']);
    expect(story.site.configuration.pages.find(page => page.key === 'home')!.sections.map(section => section.definition.value)).toEqual(sections);
    expect(pageCatalogRows(catalog, 'asce').find(page => page.key === 'home')!.sections).toEqual(sections);
    expect(resolveHomePageSections('single', 'default', library).map(section => section.id)).toEqual(['hero']);
    expect(resolveHomePageSections('multi', 'welcome-back', library).map(section => section.id)).toEqual(['hero', 'about']);
    expect(source.products.catalog.configurationValues.some(row => row.configurationKey === 'field-surfaces')).toBe(false);
    for (const name of ['quoteInputs', 'needsCalculator']) {
      expect(source.pages.home.surfaces![name].definition?.fields.length).toBeGreaterThan(0);
      expect(library.fieldSurfaces[name]).toEqual(story.fieldSurfaces[name]);
    }
    expect(library.fieldSurfaces.quoteInputs.mapping.fields.some(field => field.id === 'self-employed-under-one-year')).toBe(true);
    expect(library.client.fields.home?.extra).not.toContain('monthly-business-expenses');
    expect(library.client.features?.homeLandingNotice).toBe(false);
    expect(withFreshStartCatalog(catalog.data).configurationDefinitions.some(row => row.definition.path?.join('.') === 'features.defaultTemplate')).toBe(false);
    expect(library.content.home.hero.image).toEqual(source.content['home.hero.image']);
    expect(library.content.shared.insurerLogo).toEqual(source.content['insurer.logo']);
    expect(library.content.home.nylCredentials.ratings).toEqual(library.content.footer.ratings);
    expect(library.content.home.nylCredentials.ratingsNote).toBe(library.content.footer.ratingsAsOf);
    const stale = structuredClone(input), retired = 'shared.applicantExperience.landingNotice';
    stale.configurationDefinitions.push({ ...stale.configurationDefinitions[0], id: retired, key: retired, definition: { path: ['applicantExperience', 'landingNotice'], metadata: null } });
    stale.configurationValues.push({ ...stale.configurationValues[0], id: 'stale-home-notice', key: 'stale-home-notice', configurationKey: retired, scope: 'site', siteKey: 'asce', clientKey: null, value: { title: 'Old notice', text: 'Must not activate Home.' } });
    const replaced = resolvePrototypeLibrary(stale, 'asce', 'home-stale-notice');
    expect(replaced.client.applicantExperience?.landingNotice).toBeUndefined();
    expect(replaced.client.features?.homeLandingNotice).toBe(false);
    for (const scope of ['all', 'asce']) {
      const rows = configurationRows(catalog, scope);
      expect(rows.find(row => row.name === 'Show entry notice before starting')?.scope).toBe('Global template');
      expect(rows.some(row => row.name === 'Hero image')).toBe(true);
      expect(rows.some(row => row.key === 'shared.applicantExperience.landingNotice')).toBe(false);
      expect(urlParameterRows(catalog, scope).find(row => row.parameter === 'variant')?.values).toEqual(requirementUrlValues('variant'));
    }
  });

  it('keeps Home definitions/defaults global and validates section and Site content assignments', () => {
    const source = structuredClone(freshStartSource()), input = withoutReviewedRecords();
    source.fields.sites = {};
    const globalOnly = compileRequirementCatalog(input, source);
    expect(globalOnly.pageSections.filter(section => section.pageKey === 'home').map(section => section.definition.id)).toEqual(source.sectionOrders.home);
    expect(globalOnly.pageSectionFields.filter(field => field.sectionKey === 'home.hero').map(field => field.fieldKey)).toEqual(['zip-postal-code', 'state-province', 'birth-date']);
    expect(globalOnly.configurationValues.find(row => row.configurationKey === 'requirements.features.homeLandingNotice' && row.scope === 'global')?.value).toBe(false);
    const reordered = structuredClone(freshStartSource());
    reordered.sectionOrders.home.reverse();
    expect(compileRequirementCatalog(input, reordered, 'asce').pageSections.filter(section => section.pageKey === 'home').map(section => section.definition.id)).toEqual(reordered.sectionOrders.home);
    reordered.sectionOrders.home.pop();
    expect(() => compileRequirementCatalog(input, reordered, 'asce')).toThrow('Invalid fresh-start section order');
    const invalid = structuredClone(freshStartSource());
    invalid.fields.sitePages!.asce.home = { page: 'home', configurations: { 'home-landing-notice': true } };
    expect(() => compileRequirementCatalog(input, invalid, 'asce')).toThrow('Missing enabled content: asce/home/home.landing-notice');
    invalid.fields.sitePages!.asce.home = { page: 'home', configurations: { 'home-variant': 'welcome-back' } };
    expect(() => compileRequirementCatalog(input, invalid, 'asce')).toThrow('Invalid fresh-start configuration assignment');
    invalid.fields.sitePages!.asce.home = { page: 'home', content: { 'home.hero.image': { src: '', alt: '' } } };
    expect(() => compileRequirementCatalog(input, invalid, 'asce')).toThrow('Invalid fresh-start image');
  });

  it('defaults to quote only with rates, permits images, and separates legacy URL previews from Site configuration', () => {
    const rates = { praseConfigured: true, quoteToolEnabled: true };
    expect(resolveHomePresentation('default', rates)).toBe('default');
    expect(resolveHomePresentation('hero-image', rates)).toBe('hero-image');
    expect(resolveHomePresentation('default', { ...rates, praseConfigured: false })).toBe('hero-image');
    expect(resolveHomePresentation('default', { ...rates, quoteToolEnabled: false })).toBe('hero-image');
    expect(resolveHomePresentation('default')).toBe('hero-image');
    expect(resolveHomePresentation('welcome-back', rates)).toBe('welcome-back');
    const source = freshStartSource();
    expect(source.configurations.find(config => config.id === 'home-variant')?.options).toEqual(['default', 'hero-image']);
    expect(source.configurations.find(config => config.id === 'home-variant')?.options).not.toContain('welcome-back');
    expect(requirementUrlValues('variant')).toContain('welcome-back');
    expect(source.content['home.hero.description']).toContain('{{clientAcronym}} members');
    for (const scope of ['all', 'asce']) {
      const settings = configurationRows(catalog, scope);
      expect(settings.find(row => row.name === 'Hero quote or image')?.options).not.toContain('welcome-back');
      for (const name of ['Hero text', 'Hero subtext', 'About client section', 'Category names', 'Category descriptions', 'Product names', 'Product descriptions']) expect(settings.some(row => row.name === name), name).toBe(true);
    }
  });

  it('does not resurrect replaced ordering rules or their associations from saved catalogs', () => {
    const source = freshStartSource();
    const canonical = source.rules!.find(rule => rule.id === 'category-product-presentation-order')!;
    const retired = canonical.replaces![0] as `rule-${string}`;
    expect(source.application.records.rules.some(rule => rule.key === retired)).toBe(false);
    const data = structuredClone(catalog.data);
    data.rules = data.rules.filter(rule => rule.key !== retired);
    data.rules.push({ ...data.rules[0], id: retired, key: retired, definition: { ...data.rules[0].definition, id: retired } });
    data.ruleAssignments.push({ ...data.ruleAssignments[0], id: 'stale-order-assignment', key: 'stale-order-assignment', ruleKey: retired });
    data.ruleActions.push({ ...data.ruleActions[0], id: 'stale-order-action', key: 'stale-order-action', ruleKey: retired });
    const before = JSON.stringify(data);
    const compiled = compileRequirementCatalog(data, source, 'asce');
    expect(compiled.rules.some(rule => rule.key === retired)).toBe(false);
    expect(compiled.ruleAssignments.some(row => row.ruleKey === retired)).toBe(false);
    expect(compiled.ruleActions.some(row => row.ruleKey === retired)).toBe(false);
    const rows = libraryRequirementRows({ ...catalog, data: compiled }, 'asce');
    expect(rows.filter(row => row.key === canonical.id)).toHaveLength(1);
    expect(rows.some(row => row.key === retired)).toBe(false);
    expect(JSON.stringify(data)).toBe(before);
  });

  it('normalizes every page and rejects reintroduced transitional bindings', () => {
    const source = structuredClone(freshStartSource());
    for (const page of Object.values(source.pages)) {
      expect(page).not.toHaveProperty('fieldBindings');
      expect(page).not.toHaveProperty('looseFields');
    }
    expect(source.fields.fieldDetails).not.toHaveProperty('bindings');
    const prototype = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'cir-health-normalized');
    expect(prototype.site.configuration.pages.find(page => page.key === 'health-cir')).toMatchObject({ requirement: 'required', fields: [] });
    for (const key of source.pages['health-cir'].controls!) expect(prototype.fields.some(field => field.id === key)).toBe(true);
    (source.pages.home as unknown as Record<string, unknown>).fieldBindings = [];
    expect(() => compileRequirementCatalog(catalog.data, source, 'asce')).toThrow('Retired fresh-start page bindings');
  });
  it('owns configured Critical Illness fields while retaining explicit questionnaire assignment', () => {
    const source = freshStartSource();
    expect(source.pages['health-tele']).not.toHaveProperty('fieldBindings');
    const prototype = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'ci-health-normalized');
    expect(prototype.site.configuration.pages.find(page => page.key === 'health-tele')).toMatchObject({ requirement: 'required' });
    for (const field of source.pages['health-tele'].controls!) expect(prototype.fields.some(row => row.id === field)).toBe(true);
    expect(prototype.fields.find(field => field.id === 'health-ci-q11-ca')?.label).toContain('Substance Abuse?');
    expect(prototype.site.configuration.healthQuestionnairePolicies.some(row => (row.value as { pageId?: string }).pageId === 'health-tele')).toBe(false);
  });
  it('owns product presentation slots globally and replaces captured aliases with effective ASCE wording', () => {
    const source = freshStartSource(), data = withoutReviewedRecords();
    const canonical = source.products.catalog.configurationDefinitions.find(row => row.key === 'products.presentation.li-term.description')!;
    data.configurationDefinitions.push({ ...data.configurationDefinitions[0], id: 'old-term-copy', key: 'old-term-copy', definition: canonical.definition as never });
    data.configurationValues.push({ ...data.configurationValues[0], id: 'old-term-copy', key: 'old-term-copy', configurationKey: 'old-term-copy', scope: 'site', siteKey: 'asce', clientKey: null, value: 'Superseded copy' });
    const compiled = compileRequirementCatalog(data, source, 'asce');
    expect(compiled.configurationDefinitions.some(row => row.key === 'old-term-copy')).toBe(false);
    const policy = compiledConfiguration(compiled, 'asce').configuration.products.find(product => product.productKey === 'li-term')!;
    expect(policy.presentation.find(row => row.key === 'description')?.value).toBe(source.siteProducts.asce.products['li-term'].description);
    for (const property of ['name', 'description', 'descriptionNotice', 'applicantNotes']) expect(compiled.configurationDefinitions.filter(row => row.definition.target?.kind === 'product-presentation' && row.definition.target.productKey === 'li-term' && row.definition.target.property === property)).toHaveLength(1);
    const invalid = structuredClone(source);
    invalid.siteProducts.asce.products['li-10yr'].descriptionNotice = [] as never;
    expect(() => compileRequirementCatalog(data, invalid, 'asce')).toThrow('Invalid product presentation: li-10yr/descriptionNotice');
  });
  it('owns Disability question-specific details without duplicated field definitions', () => {
    const source = freshStartSource();
    expect(source.pages['health-di-supp']).not.toHaveProperty('fieldBindings');
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'di-health-normalized');
    const page = prototype.site.configuration.pages.find(page => page.key === 'health-di-supp')!;
    expect(page.requirement).toBe('required');
    expect(page.fields).toHaveLength(14);
    expect(page.fields).toEqual(buildGlobalTemplate(catalog, 'multipleTerms').site.configuration.pages.find(page => page.key === 'health-di-supp')!.fields);
    expect(prototype.fieldCollections.healthDiQ1SelfDetails).toMatchObject({ name: 'health-di-q1-details', maxItems: 10 });
    expect(prototype.fieldCollections.healthDiQ7SpouseDetails).toMatchObject({ name: 'health-di-q7-spouse-details', maxItems: 10 });
    expect(prototype.fieldSurfaces.healthDiq1Details.mapping.fields.map(field => field.id)).toContain('health-di-q1-detail-assistanceType');
    expect(prototype.fieldSurfaces.healthDiq2Details.mapping.fields.map(field => field.id)).toContain('health-di-q2-detail-fallType');
    expect(prototype.fieldSurfaces.healthDiq7Details.mapping.fields).toHaveLength(1);
    expect(prototype.fieldSurfaces.healthDiq3Details.mapping.fields.find(field => field.id.endsWith('physicianAddress'))?.required).toBe(false);
    expect(storedFieldRows({ ...catalog, data }, 'all').find(field => field.key === 'health-di-q1')?.definition).toEqual(page.fields[0].definition);
  });
  it('owns Simplified Issue fields and required physician records without enabling ASCE', () => {
    const source = freshStartSource();
    expect(source.pages['health-si']).not.toHaveProperty('fieldBindings');
    expect(source.pages['health-si']).not.toHaveProperty('looseFields');
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'si-health-normalized');
    const page = prototype.site.configuration.pages.find(page => page.key === 'health-si')!;
    expect(page.requirement).toBe('required');
    expect(page.fields).toHaveLength(10);
    expect(page.fields.find(field => field.key === 'health-si-q2')?.definition.label).toContain('albumin, blood, pus or sugar');
    expect(page.fields).toEqual(buildGlobalTemplate(catalog, 'multipleTerms').site.configuration.pages.find(page => page.key === 'health-si')!.fields);
    const fields = prototype.fieldCollections.healthSiQ1SelfDetails.mapping.fields;
    expect(fields.find(field => field.id === 'health-si-detail-physicianAddress')?.required).toBe(true);
    expect(fields.find(field => field.id === 'health-si-detail-conditionsDetails')?.label).toContain('e.g. Medical Advice');
    expect(prototype.fieldCollections.healthSiQ5SpouseDetails).toMatchObject({ name: 'health-si-q5-spouse-details', maxItems: 10 });
    expect(storedFieldRows({ ...catalog, data }, 'all').find(field => field.key === 'health-si-q1')?.definition).toEqual(page.fields[0].definition);
  });
  it('owns internal Life health questions, saved answer keys and detail collections without enabling ASCE', () => {
    const source = structuredClone(freshStartSource());
    const page = source.pages['health-tele'];
    expect(page).not.toHaveProperty('fieldBindings');
    expect(page).not.toHaveProperty('looseFields');
    expect(page.answerKeyPatterns).toEqual({ spouse: '{field}-spouse' });
    expect(Object.keys(page.collections!)).toHaveLength(30);
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'life-health-normalized');
    const story = buildGlobalTemplate(catalog, 'multipleTerms');
    const effective = prototype.site.configuration.pages.find(page => page.key === 'health-tele')!;
    expect(effective.requirement).toBe('required');
    expect(effective.fields).toHaveLength(30);
    expect(effective.sections.map(section => section.definition.value.id)).toEqual(['healthLiSelf', 'healthLiSpouse']);
    expect(effective.fields.map(field => field.key)).toEqual([
      ...Array.from({ length: 15 }, (_, i) => `health-li-q${i + 1}`),
      ...Array.from({ length: 15 }, (_, i) => `health-li-q${i + 1}-spouse`),
    ]);
    expect(effective.fields).toEqual(story.site.configuration.pages.find(page => page.key === 'health-tele')!.fields);
    expect(prototype.fieldSurfaces.healthLiDetails).toEqual(story.fieldSurfaces.healthLiDetails);
    const rows = storedFieldRows({ ...catalog, data }, 'all');
    for (const field of [...effective.fields.map(field => field.definition), ...prototype.fieldSurfaces.healthLiDetails.mapping.fields]) {
      expect(rows.find(row => row.key === field.id)?.definition).toEqual(field);
    }
    expect(prototype.fieldCollections.healthLiQ1SelfDetails).toMatchObject({ name: 'health-li-q1-details', maxItems: 10 });
    expect(prototype.fieldCollections.healthLiQ1SpouseDetails).toMatchObject({ name: 'health-li-q1-spouse-details', maxItems: 10 });
    expect(prototype.fieldCollections.healthLiQ1SelfDetails.mapping).toEqual(prototype.fieldCollections.healthLiQ15SpouseDetails.mapping);
    page.answerKeyPatterns = { spouse: 'invalid' };
    expect(() => compileRequirementCatalog(data, source, 'asce')).toThrow('Invalid fresh-start answer key pattern');
  });
  it('owns Payment controls, banking validation and surface placement without batch defaults', () => {
    const source = freshStartSource();
    expect(source.pages.payment).not.toHaveProperty('fieldBindings');
    expect(source.pages.payment).not.toHaveProperty('looseFields');
    const defaults = source.application.records.configurationValues.find(row => row.configurationKey === 'field-surfaces' && row.scope === 'global')!.value;
    expect(defaults).not.toHaveProperty('paymentControls');
    expect(defaults).not.toHaveProperty('paymentBank');
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'payment-normalized');
    const story = buildGlobalTemplate(catalog, 'multipleTerms');
    const rows = storedFieldRows({ ...catalog, data }, 'asce');
    expect(prototype.site.configuration.pages.find(page => page.key === 'payment')!.fields).toEqual([]);
    for (const name of ['paymentControls', 'paymentBank']) {
      expect(prototype.fieldSurfaces[name]).toEqual(story.fieldSurfaces[name]);
      for (const field of prototype.fieldSurfaces[name].mapping.fields) {
        expect(field.required, field.id).toBe(true);
        expect(rows.find(row => row.key === field.id)?.definition).toEqual(field);
      }
    }
    expect(prototype.fieldSurfaces.paymentBank.mapping.fields.find(field => field.id === 'bank-routing-number')).toMatchObject({ minLength: 9, maxLength: 9 });
    expect(prototype.content.pages.payment).toMatchObject({ title: source.content['page.payment.title'], subhead: source.content['page.payment.subhead'] });
    expect(libraryRequirementRows({ ...catalog, data }, 'asce').find(rule => rule.key === 'payment-effective-product-elections')?.dependsOn).toContain('rule-payment-bank-account-detail-display');
  });
  it('reconstructs Payment sections, defaults and ASCE notes with Library/prototype/Storybook parity', () => {
    const source = freshStartSource();
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'payment-final', source);
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const library = projectLibraryCatalog({ ...catalog, data });
    const story = buildGlobalTemplate({ ...catalog, data });
    expect(source.pageDefaults.pages.payment.requirement).toBe('required');
    expect(library.data.sitePages.find(page => page.siteKey === 'asce' && page.pageKey === 'payment')?.requirement).toBe('optional');
    const expectedSections = ['paymentOptIn', 'paymentElections', 'paymentBanking'];
    for (const model of [prototype, story]) {
      const payment = model.site.configuration.pages.find(page => page.key === 'payment')!;
      expect(payment.requirement).toBe('optional');
      expect(model.site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe('optional');
      expect(payment.sections.map(section => section.definition.value.id)).toEqual(expectedSections);
      expect(model.client.applicantExperience?.payment).toMatchObject({ allowSharedMethod: false, allowSharedFrequency: false });
      for (const key of ['li-term', 'di-ltd']) expect(resolveCoverageJourneyPolicy(model.site, key)?.payment).toMatchObject({ defaultMethod: 'bank-account', defaultFrequency: 'monthly', synchronizeAcrossProducts: false });
    }
    expect(library.data.pageSections.filter(section => section.pageKey === 'payment').map(section => section.definition.id)).toEqual(expectedSections);
    expect(compiled.contentValues.find(row => row.contentKey === 'payment.notes' && row.siteKey === 'asce')?.value).toEqual(prototype.site.configuration.content.find(row => row.key === 'payment.notes')?.value);
    expect(prototype.site.configuration.content.find(row => row.key === 'payment.notes')?.value).toEqual(story.site.configuration.content.find(row => row.key === 'payment.notes')?.value);
    const noteRow = configurationRows({ ...catalog, data }, 'asce').find(row => row.key === 'content:payment.notes')!;
    expect(noteRow.values).toContain('Ontario and Manitoba');
    expect(noteRow.options).toContain('productKeys');
    expect(source.content['payment.notes']).toEqual([]);
    const notes = (source.fields.sitePages!.asce.payment as { content: Record<string, unknown> }).content['payment.notes'];
    expect(notes).toEqual([expect.objectContaining({ productKeys: [], text: expect.stringMatching(/8%.*6%/) })]);
  });
  it('compiles independently configurable Payment sharing and shared/product notes through source assignments', () => {
    const notes = [{ id: 'page', text: 'Shared billing note', productKeys: [] }, { id: 'life', text: 'Life billing note', productKeys: ['li-term'] }];
    const changed = buildGlobalTemplate(catalog, 'multipleTerms', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, { sharedMethod: false, sharedFrequency: true, notes });
    expect(changed.client.applicantExperience?.payment).toMatchObject({ allowSharedMethod: false, allowSharedFrequency: true });
    expect(changed.site.configuration.content.find(row => row.key === 'payment.notes')?.value).toEqual(notes);
    expect(resolvePrototypeLibrary(catalog.data, 'asce', 'payment-original').client.applicantExperience?.payment?.allowSharedFrequency).toBe(false);
    const invalid = structuredClone(freshStartSource());
    (invalid.fields.sitePages!.asce.payment as { content: Record<string, unknown> }).content['payment.notes'] = [{ id: 'unassigned', text: 'Invalid', productKeys: ['not-assigned'] }];
    expect(() => compileRequirementCatalog(catalog.data, invalid, 'asce')).toThrow('Invalid configurable page notes');
    const source = freshStartSource();
    expect(Object.keys(source.pages.payment.contentSlots!).sort()).toEqual(['page.payment.subhead', 'page.payment.title', 'payment.notes']);
    for (const key of ['application.ui.you-will-not-be-charged-yet', 'application.ui.your-payment-information-is-collected-as-part-of-the-application-but-you-will', 'application.ui.quoted-cost-is-the-best-rate-available-based-on-the-information-you-provided-f']) {
      const protectedCopy = structuredClone(source);
      protectedCopy.fields.sitePages!.asce.payment = { page: 'payment', content: { [key]: 'Unsupported Site wording' } };
      expect(() => compileRequirementCatalog(catalog.data, protectedCopy, 'asce'), key).toThrow(`Undeclared Site content slot: payment/${key}`);
    }
  });
  it('inherits one global Review policy/default while retaining independent effective overrides and preview structure', () => {
    const source = structuredClone(freshStartSource());
    const key = 'shared.review-policy';
    const assignment = source.siteApplication.asce.records.configurationValues.find(row => row.configurationKey === key)!;
    expect(assignment.value).toEqual({ $default: true });
    expect(requirementUrlValues('flow')).toEqual(['advisor']);
    expect(source.pages.review.retiredDecisionKeys).toContain('business-decision.rules-review.important-notice-viewer-deferral');
    const global = source.application.records.configurationValues.find(row => row.configurationKey === key && row.scope === 'global')!;
    (global.value as { premiumContributionStatement: string }).premiumContributionStatement = 'Shared source statement';
    const data = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const site = compiledConfiguration(data, 'asce');
    expect(site.configuration.reviewPolicies[0].value).toMatchObject({ premiumContributionStatement: 'Shared source statement' });
    for (const retired of source.pages.review.retiredDecisionKeys!) expect(data.semanticRequirements.some(row => row.key === retired)).toBe(false);
    expect(site.configuration.reviewPolicies[0].value).toMatchObject({
      underwritingFlag: { rules: [{ applicants: ['member', 'spouse'], categories: ['LI', 'DI', 'OO'] }] },
      authorization: { when: 'underwriting-flag', pageIds: [] },
      consent: { underwrittenWhenUnderwritingFlag: true },
    });
    expect(site.configuration.reviewPolicies[0].value).not.toHaveProperty('consent.underwrittenWhenHealthQuestions');
    expect(data.pages.find(page => page.key === 'review')!.definition.previewPageIds).toEqual(['membership', 'eligibility', 'coverage', 'beneficiary', 'contact', 'profile']);
    expect(data.pages.find(page => page.key === 'review')!.definition.legalSections).toEqual({ 'read-and-sign': { maxHeight: null }, 'electronic-consent': { maxHeight: 240 } });
    const removedMessage = 'application.ui.steps-completed-by-your-advisor-getting-started-coverage-and-profile-are-locke';
    expect(source.pages.review.retiredContentKeys).toContain(removedMessage);
    expect(data.contentEntries.some(entry => entry.key === removedMessage)).toBe(false);
    expect(data.contentValues.some(value => value.contentKey === removedMessage)).toBe(false);
    for (const retired of ['rule-review-edit-confirmation-consumer-flow', 'rule-review-jurisdiction-fraud-notices', 'rule-review-conditional-consent-blocks']) expect(data.rules.some(row => row.key === retired)).toBe(false);
    assignment.value = { ...(global.value as object), underwritingFlag: { $default: true }, premiumContributionStatement: 'Independent effective override' };
    (global.value as { underwritingFlag: { rules: unknown[] } }).underwritingFlag.rules = [{ applicants: ['member'], categories: ['LI'] }];
    expect(compiledConfiguration(compileRequirementCatalog(withoutReviewedRecords(), source, 'asce'), 'asce').configuration.reviewPolicies[0].value).toMatchObject({ premiumContributionStatement: 'Independent effective override' });
    expect(compiledConfiguration(compileRequirementCatalog(withoutReviewedRecords(), source, 'asce'), 'asce').configuration.reviewPolicies[0].value).toMatchObject({ underwritingFlag: { rules: [{ applicants: ['member'], categories: ['LI'] }] } });
    expect(global.value).toMatchObject({ premiumContributionStatement: 'Shared source statement' });
    const missing = structuredClone(source);
    missing.siteApplication.asce.records.configurationValues.find(row => row.configurationKey === key)!.value = { $default: true };
    missing.application.records.configurationValues = missing.application.records.configurationValues.filter(row => row.configurationKey !== key);
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), missing, 'asce')).toThrow(/Missing or ambiguous shared configuration default/);
  });
  it('owns cross-page applicant rules and URL scope globally without superseded display records', () => {
    const source = freshStartSource();
    const data = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const applicantRows = libraryRequirementRows({ ...catalog, data }, 'asce');
    const behaviorsByPage = ['eligibility', 'coverage', 'profile', 'contact', 'review', 'receipt'].map(page => confirmedRequirementBehaviors([page]));
    const ids = ['applicant-section-headings', 'applicant-active-participation', 'applicant-owner-requirements', 'applicant-availability-url'];
    for (const id of ids) {
      const record = source.rules!.find(rule => rule.id === id)!;
      expect(record).toMatchObject({ status: 'confirmed' });
      for (const old of record.replaces ?? []) expect(data.rules.some(rule => rule.key === old)).toBe(false);
      const rows = applicantRows.filter(row => row.key === id);
      expect(rows).toHaveLength(1);
      expect(rows[0].site).toBe('Global template');
      for (const behaviors of behaviorsByPage) expect(behaviors.some(rule => rule.id === id)).toBe(true);
    }
    expect(requirementUrlValues('applicant')).toEqual(['member', 'member,spouse']);
    const example = buildGlobalTemplate({ ...catalog, data }, 'standard', undefined, { coveredPeople: ['self'] });
    expect(example.client.applicantExperience?.coveredPeople).toEqual(['self']);
    expect(resolvePrototypeLibrary(data, 'asce', 'applicant-scope-unchanged').client.applicantExperience?.coveredPeople).toEqual(['self', 'spouse', 'child']);
  });
  it('owns Review acknowledgements and optional notice fields without batch or scalar placement', () => {
    const source = structuredClone(freshStartSource());
    expect(source.pages.review).not.toHaveProperty('fieldBindings');
    expect(source.pages.review).not.toHaveProperty('looseFields');
    expect(source.pages.review.fieldMapping).toEqual({ page: 'review' });
    expect(source.fields.fieldDetails).not.toHaveProperty('bindings');
    const data = withoutReviewedRecords();
    const rows = storedFieldRows({ ...catalog, data }, 'asce');
    const prototype = resolvePrototypeLibrary(data, 'asce', 'review-normalized');
    const story = buildGlobalTemplate(catalog, 'multipleTerms');
    const fields = [...prototype.fieldSurfaces.reviewAcknowledgements.mapping.fields, ...prototype.fieldSurfaces.reviewSpouseAcknowledgement.mapping.fields];
    expect(fields.map(field => field.id)).toEqual(['review-self-consent', 'review-spouse-consent']);
    expect(fields[0].label).toBe(fields[1].label);
    expect(fields.every(field => field.required === true)).toBe(true);
    expect(prototype.fieldSurfaces.reviewPolicyFields.mapping.fields.find(field => field.id === 'dividend-acknowledgement')?.required).toBe(true);
    for (const id of ['dividend-first-name', 'dividend-last-name', 'dividend-birth-date']) expect(prototype.fieldSurfaces.reviewPolicyFields.mapping.fields.find(field => field.id === id)?.required).not.toBe(true);
    expect(prototype.site.configuration.pages.find(page => page.key === 'review')!.fields).toEqual([]);
    for (const name of ['reviewAcknowledgements', 'reviewSpouseAcknowledgement', 'reviewPolicyFields']) {
      expect(prototype.fieldSurfaces[name]).toEqual(story.fieldSurfaces[name]);
      for (const field of prototype.fieldSurfaces[name].mapping.fields) {
        expect(rows.find(row => row.key === field.id)?.definition).toEqual(field);
      }
    }
    expect(prototype.content.review).toMatchObject({ readAndSignContent: source.content['review.read-and-sign-content'], electronicConsentContent: source.content['review.electronic-consent-content'] });
    (source.fields.sites.asce as { fields: Record<string, unknown> }).fields['review-consent'] = { label: { self: 'Member acknowledgement', spouse: 'Spouse acknowledgement' } };
    expect(() => compileRequirementCatalog(data, source, 'asce')).toThrow(/Fixed mapped field property/);
  });
  it('owns Profile sections, adult variants and disability dialogs without the batch records', () => {
    const source = freshStartSource();
    expect(source.pages.profile).not.toHaveProperty('fieldBindings');
    expect(source.pages.profile).not.toHaveProperty('looseFields');
    expect(source.pages.profile.fieldMapping).toEqual({ page: 'profile' });
    expect(source.pages.profile.layout.sections['profile-financial-self'].coverageCategories).toEqual(['LI', 'DI']);
    expect(source.pages.profile.layout.sections['profile-financial-spouse'].coverageCategories).toEqual(['LI', 'DI']);
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'profile-normalized');
    const story = buildGlobalTemplate(catalog, 'standard');
    const page = prototype.site.configuration.pages.find(page => page.key === 'profile')!;
    expect(prototype.site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')?.enabled).toBe(false);
    expect(page.fields.some(field => field.key.endsWith('outside-us-months'))).toBe(false);
    const qdFields = ['weight-12-months-ago-lbs', 'has-drivers-license', 'drivers-license-number', 'drivers-license-state', 'intend-live-outside-us', 'outside-us-country'];
    for (const id of qdFields) expect(page.fields.find(field => field.key === id)?.definition.underwritingVariants).toMatchObject({ default: { hidden: true }, QD: { hidden: false } });
    const policy = libraryRequirementRows({ ...catalog, data }, 'asce').find(rule => rule.key === 'profile-other-coverage-applicability')!;
    expect(policy.dependsOn).toContain('rule-dynamiclist-add-edit-remove-modal-pattern');
    expect(policy.dependsOn).toContain('applicant-active-participation');
    expect(page.sections.map(section => section.definition.value.id)).toEqual(Object.values(source.pages.profile.layout.sections).map(section => section.id));
    const rows = storedFieldRows({ ...catalog, data }, 'asce');
    const storyFields = story.site.configuration.pages.find(page => page.key === 'profile')!.fields;
    for (const field of page.fields) {
      expect(rows.find(row => row.key === field.key)?.definition, field.key).toEqual(field.definition);
      expect(storyFields.find(row => row.key === field.key)?.definition, field.key).toEqual(field.definition);
      expect(field.key).not.toMatch(/^di-company-/); // Modal validation has its own boundary.
    }
    expect(page.fields.find(field => field.key === 'spouse-has-drivers-license')?.definition.label).toBe("Does your spouse have a valid driver's license?");
    expect(page.fields.find(field => field.key === 'spouse-medical-facility-name')?.definition.autoComplete).toBe('off');
    for (const name of ['selfDisabilityCompanies', 'spouseDisabilityCompanies']) {
      expect(prototype.fieldCollections[name]).toEqual(story.fieldCollections[name]);
      expect(prototype.fieldCollections[name].mapping.fields.map(field => field.id)).toEqual(source.pages.profile.layout.dialogs!['disability-company'].fields);
      for (const field of prototype.fieldCollections[name].mapping.fields) expect(rows.find(row => row.key === field.id)?.definition).toEqual(field);
    }
  });
  it('reconstructs Profile predicates, carrier minimum, SSN assignment and shared totals without superseded page records', () => {
    const source = structuredClone(freshStartSource());
    const data = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const site = compiledConfiguration(data, 'asce');
    const fields = site.configuration.pages.find(page => page.key === 'profile')!.fields;
    expect(fields.find(field => field.key === 'social-security-number')!.definition).toMatchObject({ required: true });
    expect(fields.find(field => field.key === 'spouse-social-security-number')!.definition).toMatchObject({ required: true, optionalForProducts: ['di-ltd'] });
    const visibility = (id: string, values: Parameters<typeof evaluateCondition>[1]) => evaluateCondition(data.conditions.find(condition => condition.key === fields.find(field => field.key === id)!.definition.visibilityConditionId)!.definition, values);
    expect(visibility('existing-life-insurance-amount', { 'has-other-life-insurance': 'no' })).toBe(false);
    expect(visibility('existing-life-insurance-amount', { 'has-other-life-insurance': 'yes' })).toBe(true);
    expect(visibility('spouse-existing-life-insurance-amount', { dependents: ['spouse'], 'has-other-life-insurance': 'yes' })).toBe(false);
    expect(visibility('spouse-existing-life-insurance-amount', { dependents: ['spouse'], 'spouse-has-other-life-insurance': 'yes' })).toBe(true);
    expect(visibility('work-location-details', { 'is-self-employed': 'yes', 'work-from-home': 'no', 'has-work-location-outside-home': 'yes' })).toBe(false);
    const collections = resolveStoredFieldCollections(data, site as Parameters<typeof resolveStoredFieldCollections>[1]);
    for (const key of ['rule-profile-repeatable-insurance-company-records', 'rule-profile-outside-u-s-follow-up', 'rule-profile-financial-questionnaire-visibility']) {
      expect(data.rules.some(row => row.key === key)).toBe(false);
      expect(data.ruleAssignments.some(row => row.ruleKey === key)).toBe(false);
    }
    expect(collections.selfDisabilityCompanies).toMatchObject({ minItems: 1, maxItems: 10 });
    expect(collections.spouseDisabilityCompanies).toMatchObject({ minItems: 1, maxItems: 10 });
    expect(fields.find(field => field.key === 'professional-corporation-bonus')!.definition.defaultValue).toBe('0');
    const key = 'shared.profile.financialCalculations';
    expect(site.configuration.configurations.find(row => row.key === key)?.value).toEqual(source.application.records.configurationValues.find(row => row.configurationKey === key)!.value);
    const synthetic = buildGlobalTemplate(catalog, 'standard', undefined, undefined, undefined, undefined, undefined, { financialQuestionnaire: { productKeys: ['di-ltd'], minimumAmount: 7000, inclusive: true } });
    const applicability = 'shared.profile-financial-questionnaire';
    expect(data.configurationDefinitions.filter(row => row.definition.target?.kind === 'site-financial-questionnaire').map(row => row.key)).toEqual([applicability]);
    for (const scope of ['all', 'asce']) expect(configurationRows({ ...catalog, data }, scope).some(row => row.key === applicability && row.group === 'Profile policy')).toBe(true);
    expect(site.configuration.financialQuestionnairePolicies).toEqual([]);
    expect(synthetic.site.configuration.financialQuestionnairePolicies[0].key).toBe(applicability);
    expect(synthetic.site.configuration.financialQuestionnairePolicies[0].value).toMatchObject({ rules: [{ minimumAmount: 7000 }] });
    expect(synthetic.site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')?.enabled).toBe(true);
    expect(resolvePrototypeLibrary(data, 'asce', 'unchanged-site').site.configuration.features.find(feature => feature.key === 'feature-financial-questionnaire')?.enabled).toBe(false);
  });
  it('keeps Profile follow-up dependencies and calculations global with configurable personal fields', () => {
    const source = structuredClone(freshStartSource());
    Object.assign(source.fields.sitePages!.asce.profile as object, { fieldParticipation: { self: { hide: ['has-drivers-license'] } } });
    const data = withoutReviewedRecords();
    const key = 'shared.profile.financialCalculations';
    const globalValue = source.application.records.configurationValues.find(row => row.configurationKey === key)!;
    data.configurationValues.push({ ...data.configurationValues[0], id: 'stale-profile-calculations', key: 'stale-profile-calculations', configurationKey: key, scope: 'site', siteKey: 'asce', clientKey: null, value: { obsolete: true } });
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const site = compiledConfiguration(compiled, 'asce');
    const fields = site.configuration.pages.find(page => page.key === 'profile')!.fields;
    expect(fields.find(field => field.key === 'has-drivers-license')?.included).toBe(false);
    expect(fields.find(field => field.key === 'drivers-license-number')?.definition.visibilityDependencies).toEqual(['has-drivers-license']);
    expect(fields.find(field => field.key === 'spouse-drivers-license-number')?.definition.visibilityDependencies).toEqual(['spouse-has-drivers-license']);
    expect(fields.find(field => field.key === 'disability-replacement-amount')?.definition.visibilityDependencies).toEqual(['has-disability-insurance', 'is-replacing-disability-insurance']);
    expect(site.configuration.configurations.find(row => row.key === key)?.value).toEqual(globalValue.value);
    const invalid = structuredClone(source);
    invalid.siteApplication.asce.records.configurationValues.push({ ...globalValue, id: 'site-profile-calculations', key: 'site-profile-calculations', scope: 'site', siteKey: '{{site}}' });
    expect(() => compileRequirementCatalog(data, invalid, 'asce')).toThrow(/Global-only application configuration/);
    compiled.configurationValues.push({ ...compiled.configurationValues[0], id: 'direct-profile-calculations', key: 'direct-profile-calculations', scope: 'site', siteKey: 'asce', clientKey: null, configurationKey: key, value: { obsolete: true } });
    expect(() => compiledConfiguration(compiled, 'asce')).toThrow(/Global-only configuration/);
  });
  it('rejects invalid Profile field predicates and optional-product assignments', () => {
    const source = structuredClone(freshStartSource());
    source.pages.profile.fieldVisibility![0].when.all[0].field = 'missing-field';
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), source, 'asce')).toThrow(/Unmapped fresh-start field predicate/);
    const invalid = structuredClone(freshStartSource());
    (invalid.fields.sites.asce as { fields: Record<string, unknown> }).fields['social-security-number'] = { optionalForProducts: { spouse: ['unassigned-product'] } };
    const data = compileRequirementCatalog(withoutReviewedRecords(), invalid, 'asce');
    expect(() => compiledConfiguration(data, 'asce')).toThrow(/Unassigned optional field product/);
  });
  it('keeps physician fields identical while an effective Site hides the complete section', () => {
    const source = structuredClone(freshStartSource());
    const data = withoutReviewedRecords();
    const shown = compiledConfiguration(compileRequirementCatalog(data, source, 'asce'), 'asce').configuration;
    Object.assign(source.fields.sitePages!.asce.profile as object, { configurations: { 'physician-information': false } });
    const hidden = compiledConfiguration(compileRequirementCatalog(data, source, 'asce'), 'asce').configuration;
    const physicianIds = source.pages.profile.layout.sections['profile-personal-self-physician'].fields!;
    for (const prefix of ['', 'spouse-']) for (const id of physicianIds) {
      const before = shown.pages.find(page => page.key === 'profile')!.fields.find(field => field.key === `${prefix}${id}`)!;
      const after = hidden.pages.find(page => page.key === 'profile')!.fields.find(field => field.key === `${prefix}${id}`)!;
      expect(before.included).toBe(true);
      expect(after.included).toBe(false);
      expect(after.definition).toEqual(before.definition);
    }
    const configuration = 'requirements.applicantExperience.physicianInformation';
    expect(shown.configurations.find(row => row.key === configuration)?.value).toBe(true);
    expect(hidden.configurations.find(row => row.key === configuration)?.value).toBe(false);
  });
  it('shares one configured Profile record dialog while preserving separate member/spouse storage', () => {
    const source = structuredClone(freshStartSource());
    source.pages.profile.surfaces!.disabilityCompany.definition!.maxItems = 3;
    source.content['profile.disability.company'] = 'Carrier';
    (source.fields.sites.asce as { fields: Record<string, unknown> }).fields['di-company-name'] = { label: 'Configured carrier' };
    const data = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const site = compiledConfiguration(data, 'asce');
    const collections = resolveStoredFieldCollections(data, site as Parameters<typeof resolveStoredFieldCollections>[1]);
    for (const name of ['selfDisabilityCompanies', 'spouseDisabilityCompanies']) {
      expect(collections[name]).toMatchObject({ name, label: 'Carrier', maxItems: 3 });
      expect(collections[name].mapping.fields.find(field => field.id === 'di-company-name')?.label).toBe('Configured carrier');
    }
    expect(site.configuration.pages.find(page => page.key === 'profile')!.fields.some(field => field.key.startsWith('di-company-'))).toBe(false);
    const invalid = structuredClone(source);
    invalid.pages.profile.collections!.selfDisabilityCompanies.surface = 'missing';
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalid, 'asce')).toThrow('Invalid fresh-start collection');
    const invalidLimit = structuredClone(source);
    invalidLimit.pages.profile.surfaces!.disabilityCompany.definition!.maxItems = 0;
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalidLimit, 'asce')).toThrow('Invalid fresh-start collection');
    const invalidCondition = structuredClone(source);
    invalidCondition.pages.profile.layout.sections['profile-personal-spouse-drivers-license'].when = { all: [] };
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalidCondition, 'asce')).toThrow('Invalid fresh-start section condition');
    const conditions = data.conditions.find(row => row.key === 'condition-requirements-profile-profile-personal-spouse-drivers-license')!.definition;
    expect(conditions.conditions).toEqual([{ fieldId: 'dependents', operator: 'includes', value: 'spouse' }, { fieldId: 'spouse-has-drivers-license', operator: 'equals', value: 'yes' }]);
  });
  it.each([
    ['resume', ['resume-email', 'resume-phone']],
    ['resume-method', ['resume-delivery-method']],
    ['resume-code', ['resume-security-code']],
    ['advisor-login', ['advisor-flow-type', 'advisor-email', 'advisor-phone', 'advisor-code', 'applicant-email']],
  ] as const)('normalizes %s fields and sections for the Library, prototype and Storybook', (pageKey, fieldKeys) => {
    const source = freshStartSource();
    expect(source.pages[pageKey]).not.toHaveProperty('fieldBindings');
    expect(source.pages[pageKey]).not.toHaveProperty('looseFields');
    expect(source.pages[pageKey].fieldMapping).toEqual({ page: pageKey });
    expect(source.fields.fieldDetails).not.toHaveProperty('bindings');
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'simple-page-normalized');
    const page = prototype.site.configuration.pages.find(page => page.key === pageKey)!;
    expect(page.fields.filter(field => field.included).map(field => field.key)).toEqual(fieldKeys);
    const library = storedFieldRows({ ...catalog, data }, 'asce');
    const storybook = buildGlobalTemplate(catalog, 'standard').site.configuration.pages.find(page => page.key === pageKey)!;
    for (const field of page.fields) {
      expect(library.find(row => row.key === field.key)?.definition).toEqual(field.definition);
      expect(storybook.fields.find(row => row.key === field.key)?.definition).toEqual(field.definition);
    }
    const content = prototype.content.pages[pageKey]!;
    expect(content.title).toBe(source.content[`page.${pageKey}.title`]);
    expect(content.subhead).toBe(source.content[`page.${pageKey}.subhead`]);
    expect(page.fields.every(field => field.included && field.definition.required)).toBe(true);
    if (pageKey !== 'advisor-login') {
      const invalid = structuredClone(source);
      (invalid.fields.sites.asce as { fields: Record<string, unknown> }).fields[fieldKeys[0]] = { label: 'Site-specific Resume wording' };
      expect(() => compileRequirementCatalog(data, invalid, 'asce')).toThrow(`Fixed mapped field property: asce/${pageKey}/${fieldKeys[0]}/label`);
    }
    if (pageKey === 'advisor-login') {
      const mode = page.fields.find(field => field.key === 'advisor-flow-type')!;
      expect(page.fields.every(field => field.included && field.definition.required)).toBe(true);
      const code = page.fields.find(field => field.key === 'advisor-code')!.definition;
      for (const property of ['format', 'minLength', 'maxLength']) expect(code).not.toHaveProperty(property);
      expect(mode.definition.options).toEqual([{ value: 'new', label: 'Start' }, { value: 'saved', label: 'Continue' }]);
      for (const [id, branch] of [['advisorLoginNew', 'new'], ['advisorLoginSaved', 'saved']]) {
        const section = page.sections.find(section => section.definition.value.id === id)!;
        expect(section.definition.value.visibilityConditionId).toBe(`condition-requirements-advisor-login-advisor-login-${branch}`);
      }
      for (const field of page.fields.filter(field => field.key !== 'advisor-flow-type')) expect(field.definition.labelVariant).toBe('floating');
      const invalid = structuredClone(source);
      (invalid.fields.sites.asce as { fields: Record<string, unknown> }).fields['advisor-code'] = { format: 'digits' };
      expect(() => compileRequirementCatalog(data, invalid, 'asce')).toThrow('Fixed mapped field property: asce/advisor-login/advisor-code/format');
    }
  });
  it('rejects dynamic substitutions in shared or Site decision descriptions', () => {
    const key = 'receipt.decision-statuses.conditionally-approved.description';
    const source = structuredClone(freshStartSource());
    source.content[key] = 'Approved for {{amount}} in {{coverageName}}.';
    expect(() => compileRequirementCatalog(catalog.data, source, 'asce')).toThrow('Receipt decision descriptions must be literal configured copy');
    const siteSource = structuredClone(freshStartSource());
    siteSource.fields.sitePages!.asce.receipt = { ...siteSource.fields.sitePages!.asce.receipt as object, content: { [key]: 'Approved for {{amount}}.' } };
    expect(() => compileRequirementCatalog(catalog.data, siteSource, 'asce')).toThrow('Receipt decision descriptions must be literal configured copy');
  });
  it('normalizes Receipt without batch bindings or a separate summary, with content owned by fresh start', () => {
    const source = freshStartSource();
    const page = source.pages.receipt;
    expect(page).not.toHaveProperty('fieldBindings');
    expect(page).not.toHaveProperty('looseFields');
    const components = declaredPageComponents('receipt');
    for (const name of ['ReceiptConfirmation', 'InformationAlert', 'ReceiptDecisions', 'ReceiptCoverageDecision', 'SiteSupport']) expect(components.has(name), name).toBe(true);
    expect(components.has('ReceiptApplicationSummary')).toBe(false);
    const authored = JSON.parse(readFileSync('requirements/global/content/receipt.json', 'utf8'));
    for (const [key, value] of Object.entries(authored)) expect(source.content[key], key).toEqual(value);
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'receipt-normalized');
    for (const key of Object.keys(receiptDefaults) as Array<keyof typeof receiptDefaults>) expect(prototype.content.receipt[key], key).toEqual(receiptDefaults[key]);
    for (const key of ['summaryLabels', 'coverageCardLabels', 'decisionSteps']) expect(prototype.content.receipt).not.toHaveProperty(key);
    expect(prototype.site.configuration.pages.find(page => page.key === 'receipt')?.fields).toEqual([]);
    expect(prototype.site.configuration.pages.find(page => page.key === 'receipt')?.sections.map(section => section.definition.value.id)).toEqual(['receiptConfirmation', 'receiptDecisions']);
    const content = storedLibraryRows({ ...catalog, data }, 'contentValues', 'asce');
    expect(content.find(row => row.contentKey === 'receipt.coverageDecisions.description')?.value).toBe(prototype.content.receipt.coverageDecisions.description);
  });
  it('keeps fieldless Receipt composition mapped and isolates effective email wording', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sitePages!.asce.receipt = { page: 'receipt', content: { 'receipt.email.intro': 'A configured receipt for {{associationName}}.' } };
    const model = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'receipt-email-override', source);
    expect(model.content.receipt.email.intro).toBe('A configured receipt for {{associationName}}.');
    expect(model.content.receipt.underwritingNote).toEqual(receiptDefaults.underwritingNote);
    expect(freshStartSource().content['receipt.underwriting-note']).toEqual(receiptDefaults.underwritingNote);
    expect(freshStartSource().content['receipt.email.intro']).not.toBe(model.content.receipt.email.intro);
    for (const scope of ['all', 'asce']) {
      const rules = libraryRequirementRows(catalog, scope);
      for (const id of ['receipt-source-composition', 'receipt-confirmation-reference', 'receipt-confirmation-email', 'receipt-document-boundary', 'receipt-result-integrity', 'receipt-underwriting-next-steps', 'receipt-payment-notice-applicability']) expect(rules.filter(row => row.key === id)).toHaveLength(1);
    }
    source.pages.receipt.layout.sections.confirmation.fields = ['first-name'];
    expect(() => compileRequirementCatalog(catalog.data, source)).toThrow('Missing fresh-start field mapping: receipt');
  });
  it('inherits the global ExamOne note across Sites and consumers while isolating genuine content overrides', () => {
    const source = structuredClone(freshStartSource());
    expect(Object.keys((source.fields.sitePages!.asce.receipt as { content?: Record<string, unknown> }).content ?? {})).not.toContain('receipt.underwriting-note');
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const base = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'receipt-global-default');
    const compiled = compileRequirementCatalog(data, source);
    for (const key of ['asce', 'example']) {
      const effective = { ...base.site, ...compiledConfiguration(compiled, key) };
      expect(buildPrototypeContent(compiled, effective).receipt.underwritingNote).toEqual(receiptDefaults.underwritingNote);
    }
    expect(buildGlobalTemplate(catalog).content.receipt.underwritingNote).toEqual(receiptDefaults.underwritingNote);
    const globalValue = compiled.contentValues.find(row => row.scope === 'global' && row.contentKey === 'receipt.underwritingNote');
    expect(globalValue?.value).toEqual(receiptDefaults.underwritingNote);
    const override = { title: 'Alternate provider', text: 'Synthetic Site review instructions.' };
    source.fields.sitePages!.example.receipt = { page: 'receipt', content: { 'receipt.underwriting-note': override } };
    const changed = compileRequirementCatalog(data, source);
    for (const key of ['asce', 'example']) {
      const effective = { ...base.site, ...compiledConfiguration(changed, key) };
      expect(buildPrototypeContent(changed, effective).receipt.underwritingNote).toEqual(key === 'example' ? override : receiptDefaults.underwritingNote);
    }
    expect(source.content['receipt.underwriting-note']).toEqual(receiptDefaults.underwritingNote);
  });
  it('owns shared support content once and projects it consistently into the Library and prototype', () => {
    const source = freshStartSource();
    expect(Object.keys(source.content).some(key => key.startsWith('receipt.support.'))).toBe(false);
    const data = compileRequirementCatalog(structuredClone(catalog.data), source, 'asce');
    const prototype = resolvePrototypeLibrary(data, 'asce', 'support-parity');
    expect(prototype.content.shared.support.technicalTitle).toBe(source.content['support.technical-title']);
    expect(prototype.content.shared.support).not.toHaveProperty('applicationTitle');
    expect(prototype.content.shared.support.technicalEmailAddress).toBe('portalsupport@newyorklife.com');
    expect(prototype.content.receipt).not.toHaveProperty('support');
    const content = storedLibraryRows({ ...catalog, data }, 'contentValues', 'asce');
    expect(content.find(row => row.contentKey === 'shared.support.technicalTitle')?.value).toBe(prototype.content.shared.support.technicalTitle);
    expect(content.some(row => row.contentKey === 'shared.support.applicationTitle')).toBe(false);
    const supportPages = Object.values(source.pages).filter(page => JSON.stringify(page.components).includes('site-support'));
    expect(supportPages.map(page => page.page).sort()).toEqual(['error-400', 'error-500', 'maintenance', 'not-found', 'receipt', 'session-expired', 'technical-error']);
    for (const page of supportPages) {
      expect(page.content?.support).toEqual(Object.keys(source.content).filter(key => key.startsWith('support.')));
      expect(declaredPageComponents(page.page).has('SiteSupport')).toBe(true);
      expect(confirmedRequirementBehaviors([page.page]).some(rule => rule.id === 'shared-site-support')).toBe(true);
    }
  });
  it('keeps form hosting in one global inventory, separate from prototype simulations', () => {
    const { forms } = JSON.parse(readFileSync('requirements/global/forms.json', 'utf8')) as { forms: Array<{ id: string; hosting: string; usedIn: Array<{ page?: string; component?: string; parentsOf?: string }>; target: { page?: string; component?: string }; prototype: { mode: string }; sourceReferences: string[] }> };
    expect(new Set(forms.map(form => form.id)).size).toBe(forms.length);
    const pages = freshStartSource().pages;
    for (const form of forms) {
      expect(['Internal', 'External']).toContain(form.hosting);
      expect(form.usedIn.length).toBeGreaterThan(0);
      for (const placement of form.usedIn) if (placement.page) expect(pages[placement.page], `${form.id}: ${placement.page}`).toBeDefined();
      for (const source of form.sourceReferences) expect(existsSync(source), source).toBe(true);
    }
    for (const page of Object.values(pages).filter(page => page.definition?.type === 'form' && page.fieldMapping)) expect(forms.some(form => form.target.page === (page.consumerKey ?? page.page) || form.usedIn.some(placement => placement.page === (page.consumerKey ?? page.page))), page.page).toBe(true);
    for (const id of ['docusign', 'health-qd', 'payment-credit-card', 'member-authentication']) expect(forms.find(form => form.id === id)?.hosting, id).toBe('External');
    for (const id of ['membership', 'eligibility', 'coverage', 'review', 'quote-calculator', 'needs-calculator', 'payment', 'member-verification', 'resume-email-request', 'resume-delivery-method', 'resume-code', 'dividend-notices']) expect(forms.find(form => form.id === id)?.hosting, id).toBe('Internal');
    expect(forms.find(form => form.id === 'member-authentication')?.prototype.mode).toBe('Portal simulation');
    expect(forms.find(form => form.id === 'resume-code')?.prototype.mode).toBe('Portal UI');
  });
  it('accounts for every production form-state owner in the applicant and advisor prototype', () => {
    const rows = applicationFormRows();
    const declared = new Set(rows.flatMap(row => row.sourceReferences));
    const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const path = `${directory}/${entry.name}`;
      return entry.isDirectory() ? ['admin', 'docs', 'dev'].includes(entry.name) ? [] : files(path) : /\.tsx$/.test(path) && !/\.(?:test|stories)\.tsx$/.test(path) ? [path] : [];
    });
    const owners = ['src/pages', 'src/components', 'src/app/workflows'].flatMap(files)
      .filter(path => path !== 'src/components/forms/ControlledFieldRenderer.tsx' && /\buseForm(?:<|\()/.test(readFileSync(path, 'utf8')));
    expect(owners.length).toBeGreaterThan(0);
    for (const owner of owners) expect(declared.has(owner), `Form missing from inventory: ${owner}`).toBe(true);
    expect(rows.find(row => row.id === 'beneficiary')?.sourceReferences).toContain('src/pages/Beneficiary.tsx');
    expect(rows.filter(row => row.prototype.mode === 'Not implemented').map(row => row.id)).toEqual(['payment-credit-card']);
  });
  it('resolves form names and descriptions from existing fresh-start definitions instead of copied inventory wording', () => {
    const source = structuredClone(applicationFormSource());
    const review = source.forms.find(form => form.id === 'review')!;
    expect(review).not.toHaveProperty('name');
    expect(review).not.toHaveProperty('surface');
    expect(review).not.toHaveProperty('provider');
    source.pages.review.definition.displayName = 'Configured review name';
    source.content['page.review.subhead'] = 'Applicant-facing subtitle';
    source.content[review.description.content!] = 'Configured review description';
    source.components.find(component => component.name === 'QuoteCalculator')!.description = 'Configured quote description';
    source.components.find(component => component.name === 'QuoteCalculator')!.displayName = 'Configured quote name';
    source.content['forms.member-authentication.description'] = 'Configured authentication description';
    const rows = applicationFormRows(source);
    expect(rows.find(row => row.id === 'membership')?.description).toMatch(/membership attestation.*name, email address and phone number/i);
    expect(rows.find(row => row.id === 'review')?.description).not.toBe(source.content['page.review.subhead']);
    for (const form of source.forms) expect(form.description.content ?? '').not.toMatch(/\.(?:subhead|prompt)$/);
    expect(rows.find(row => row.id === 'review')).toMatchObject({ name: 'Configured review name', description: 'Configured review description' });
    expect(rows.find(row => row.id === 'quote-calculator')).toMatchObject({ name: 'Configured quote name', description: 'Configured quote description' });
    expect(rows.find(row => row.id === 'member-authentication')?.description).toBe('Configured authentication description');
    const dividend = rows.find(row => row.id === 'dividend-notices')!;
    expect(dividend).toMatchObject({ name: 'Dividend notices', hosting: 'Internal' });
    const invalid = structuredClone(source);
    delete invalid.content['forms.member-authentication.description'];
    expect(() => applicationFormRows(invalid)).toThrow('Missing fresh-start form content: forms.member-authentication.description');
  });
  it('uses configured usage names, consistent descriptions and component relationships for form placement', () => {
    const source = structuredClone(applicationFormSource());
    const rows = applicationFormRows(source);
    expect(rows.find(row => row.id === 'needs-calculator')?.placements).toEqual([{ kind: 'component', key: 'AppMenu', name: 'App menu' }]);
    expect(rows.find(row => row.id === 'quote-calculator')?.placements).toEqual([{ kind: 'page', key: 'home', name: 'Home' }]);
    expect(rows).toHaveLength(21);
    expect(rows.find(row => row.id === 'health-questionnaires')?.name).toBe('Health (SI, TELE, DI SUPP, CIR)');
    expect(rows.find(row => row.id === 'health-questionnaires')?.placements.map(placement => placement.key)).toEqual(['health-si', 'health-tele', 'health-di-supp', 'health-cir']);
    expect(rows.find(row => row.id === 'payment')?.description).toContain('bank account details');
    expect(rows.find(row => row.id === 'member-verification')?.sourceReferences).toContain('src/components/verification/VerificationAddress.tsx');
    expect(rows.find(row => row.id === 'dividend-notices')?.placements.map(placement => placement.key)).toEqual(['home', 'review']);
    for (const row of rows) expect(row.description, row.id).toMatch(/^Collects /);
    source.relationships.find(mapping => mapping.component === 'app-header')!.calculators = ['needs-calculator'];
    expect(applicationFormRows(source).find(row => row.id === 'needs-calculator')?.placements.map(placement => placement.name)).toEqual(['Application header', 'App menu']);
    source.content['forms.health-questionnaires.name'] = 'Configured health form';
    expect(applicationFormRows(source).find(row => row.id === 'health-questionnaires')?.name).toBe('Configured health form');
  });
  it('owns generic page help globally and removes superseded Health help and page wrappers', () => {
    const source = structuredClone(freshStartSource());
    const data = withoutReviewedRecords();
    for (const [key, name] of [['component-health-information-help', 'HealthInformationHelp'], ['component-membership-help', 'MembershipHelp'], ['component-help-chips', 'HelpChips']]) data.components.push({ ...data.components[0], id: key, key, definition: { ...data.components[0].definition, name } });
    data.contentEntries.push({ ...data.contentEntries[0], id: 'health.information', key: 'health.information' });
    data.contentValues.push({ ...data.contentValues[0], id: 'old-health-help', key: 'old-health-help', contentKey: 'health.information' });
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const prototype = resolvePrototypeLibrary(compiled, 'asce', 'page-help-final');
    const rows = storedLibraryRows({ ...catalog, data: compiled }, 'pages', 'asce');
    for (const id of ['membership', 'beneficiary', 'payment']) {
      const expected = requirementPageHelp(id);
      expect(prototype.pages.find(page => page.key === id)?.definition.help).toEqual(expected);
      expect(rows.find(page => page.key === id)).toMatchObject({ definition: { help: expected } });
      expect(declaredPageComponents(id).has('PageHelp')).toBe(true);
    }
    for (const page of prototype.pages.filter(page => page.key.startsWith('health-'))) {
      expect(page.definition.help).toEqual([]);
      expect(declaredPageComponents(page.key).has('HealthInformationHelp')).toBe(false);
    }
    expect(compiled.contentEntries.some(row => row.key === 'health.information')).toBe(false);
    expect(compiled.contentValues.some(row => row.contentKey === 'health.information')).toBe(false);
    expect(compiled.components.some(row => ['HealthInformationHelp', 'MembershipHelp', 'HelpChips'].includes(row.definition.name))).toBe(false);
    source.pages.membership.help = source.pages.membership.help!.slice(1);
    source.content['help.how-applying-works.title'] = 'Source-selected application help';
    const changed = resolvePrototypeLibrary(data, 'asce', 'changed-page-help', source);
    installPrototypeLibrary(changed);
    try { expect(pageHelpItems('membership').map(item => item.label)).toEqual(['Source-selected application help']); }
    finally { installPrototypeLibrary(null); }
  });
  it('reconstructs the final Health projection, ASCE routing and current rules without superseded evidence', () => {
    const data = withoutReviewedRecords();
    const projected = compileRequirementCatalog(data, freshStartSource(), 'asce');
    const library = resolvePrototypeLibrary(data, 'asce', 'health-final');
    const healthPages = library.site.configuration.pages.filter(row => row.key.startsWith('health-')).map(row => row.key);
    expect(healthPages).toEqual(['health-si', 'health-tele', 'health-qd', 'health-di-supp', 'health-cir']);
    for (const key of ['health-li', 'health-ci', 'health-di']) {
      expect(projected.pages.some(row => row.key === key)).toBe(false);
      for (const table of ['sitePages', 'pageFields', 'pageSections', 'siteFieldConfigurations'] as const) expect(projected[table].some(row => row.pageKey === key)).toBe(false);
      expect(projected.contentEntries.some(row => row.key.startsWith(`pages.${key}.`))).toBe(false);
    }
    expect(library.pages.find(row => row.definition.id === 'health-tele')?.definition.displayName).toBe('Health TELE');
    expect(library.pages.find(row => row.definition.id === 'health-di-supp')?.definition.displayName).toBe('Health DI SUPP');
    for (const key of ['li-term', 'li-10yr', 'li-20yr']) expect(resolveCoverageJourneyPolicy(library.site, key)?.healthPageByUnderwriting).toEqual({ QD: 'health-qd', FUW: 'health-qd' });
    expect(resolveCoverageJourneyPolicy(library.site, 'di-ltd')?.healthPageByUnderwriting).toEqual({ FUW: null });
    for (const page of ['health-si', 'health-tele', 'health-di-supp', 'health-cir']) expect(library.site.configuration.pages.find(row => row.key === page)?.requirement).toBe('required');
    expect(library.site.configuration.pages.find(row => row.key === 'health-qd')?.requirement).toBe('required');
    expect(projected.semanticRequirements.some(row => row.key === 'business-decision.rules-review.external-qd-questionnaire')).toBe(false);
    for (const scope of ['all', 'asce']) {
      const rows = libraryRequirementRows({ ...catalog, data: projected }, scope);
      for (const key of ['health-external-qd-boundary', 'health-participation-and-storage']) expect(rows.filter(row => row.key === key)).toHaveLength(1);
    }
    const example = buildGlobalTemplate({ ...catalog, data: projected }, 'multipleTerms', undefined, undefined, undefined, undefined, undefined, undefined, undefined, { page: 'health-tele', product: 'li-term', questionnaire: 'life' });
    expect(example.site.configuration.pages.find(row => row.key === 'health-tele')?.requirement).toBe('required');
    expect(example.site.configuration.healthQuestionnairePolicies).toHaveLength(1);
    expect(example.fields.find(row => row.id === 'health-li-q1')?.label).toEqual(library.fields.find(row => row.id === 'health-li-q1')?.label);
    expect(library.site.configuration.pages.find(row => row.key === 'health-tele')?.requirement).toBe('required');
  });
  it('keeps generic Health wording and medical field contracts global independently of page headers and questionnaire assignments', () => {
    const source = freshStartSource();
    const pages = ['health-si', 'health-tele', 'health-qd', 'health-di-supp', 'health-cir'];
    for (const page of pages) {
      expect(Object.keys(source.pages[page].contentSlots!).sort()).toEqual([`page.${page}.subhead`, `page.${page}.title`]);
    }
    for (const key of ['health.question-title', 'health.condition-details-label']) {
      const invalid = structuredClone(source);
      invalid.fields.sitePages!.asce['health-tele'] = { page: 'health-tele', content: { [key]: 'Unsupported Site wording' } };
      expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalid, 'asce'), key).toThrow(`Undeclared Site content slot: health-tele/${key}`);
    }
    const invalid = structuredClone(source);
    (invalid.fields.sites.asce as { fields: Record<string, unknown> }).fields['health-li-q1'] = { label: 'Unsupported Site medical wording' };
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalid, 'asce')).toThrow('Fixed mapped field property: asce/health-tele/health-li-q1/label');
  });
  it('reconstructs DocuSign content, empty portal fields and mapped rules across consumers without obsolete simulator copy', () => {
    const source = freshStartSource(), data = withoutReviewedRecords();
    const retired = source.pages.docusign.retiredContentKeys!;
    for (const key of retired) {
      data.contentEntries.push({ ...catalog.data.contentEntries[0], id: key, key, definition: { path: key.split('.') } });
      data.contentValues.push({ ...catalog.data.contentValues[0], id: key, key, contentKey: key, scope: 'global', siteKey: null, clientKey: null, value: 'Obsolete simulator action' });
    }
    const compiled = compileRequirementCatalog(data, source);
    expect(compiled.contentEntries.some(row => retired.includes(row.key))).toBe(false);
    expect(compiled.contentValues.some(row => retired.includes(row.contentKey))).toBe(false);
    const prototype = resolvePrototypeLibrary(compiled, 'asce', 'docusign-final', source);
    const story = buildGlobalTemplate({ ...catalog, data: compiled });
    const library = pageCatalogRows({ ...catalog, data: compiled }, 'asce');
    const page = prototype.pages.find(page => page.key === 'docusign')!;
    expect(page.definition.displayName).toBe('DocuSign');
    expect(library.find(row => row.key === 'docusign')?.definition).toEqual(page.definition);
    expect(story.pages.find(row => row.key === 'docusign')?.definition).toEqual(page.definition);
    for (const consumer of [prototype, story]) {
      expect(consumer.site.configuration.pages.find(page => page.key === 'docusign')).toMatchObject({ requirement: 'required', fields: [], sections: [] });
      expect(consumer.settings.prototypeHandoffs).toMatchObject({ docusign: [{ src: '/prototype/docusign.png' }] });
    }
    for (const scope of ['all', 'asce']) {
      const rules = libraryRequirementRows({ ...catalog, data: compiled }, scope);
      for (const id of ['docusign-shared-handoff', 'docusign-shared-document-content', 'signing-evidence-integrity', 'docusign-required-signers', 'docusign-completion-submits']) expect(rules.filter(row => row.key === id)).toHaveLength(1);
    }
    expect(confirmedRequirementBehaviors(['docusign']).some(rule => rule.id === 'docusign-shared-document-content')).toBe(true);
  });
  it('keeps prototype handoff defaults global and supplied image selections with the effective Site', () => {
    const source = structuredClone(freshStartSource());
    for (const page of ['health-qd', 'docusign']) {
      expect(source.pages[page]).not.toHaveProperty('fieldBindings');
      expect(source.pages[page]).not.toHaveProperty('looseFields');
      expect(source.pages[page].layout.sections).toEqual({});
      expect(declaredPageComponents(page).has('PrototypeHandoffPage')).toBe(true);
    }
    source.prototypeHandoffs.docusign[0].placeholder = 'Shared pending image';
    const input = withoutReviewedRecords();
    input.configurationDefinitions.push({ ...input.configurationDefinitions[0], id: 'captured-handoff-alias', key: 'captured-handoff-alias', definition: { path: ['prototypeHandoffs'], metadata: null } });
    input.configurationValues.push({ ...input.configurationValues[0], id: 'captured-handoff-value', key: 'captured-handoff-value', configurationKey: 'captured-handoff-alias', scope: 'site', siteKey: 'asce', clientKey: null, value: { docusign: [{ src: '/prototype/stale.png', alt: 'Stale screen' }] } });
    const data = compileRequirementCatalog(input, source);
    expect(data.configurationDefinitions.filter(row => row.definition.path?.join('.') === 'prototypeHandoffs')).toHaveLength(1);
    expect(data.configurationValues.some(row => row.configurationKey === 'captured-handoff-alias')).toBe(false);
    const shared = data.configurationValues.find(row => row.configurationKey === 'prototype-handoffs' && row.scope === 'global')!.value;
    const effective = compiledConfiguration(data, 'asce').configuration.configurations.find(row => row.key === 'prototype-handoffs')!.value;
    expect(shared).toMatchObject({ docusign: [{ placeholder: 'Shared pending image' }], 'health-qd': [{ placeholder: 'Image TBD' }, { placeholder: 'Image TBD' }] });
    expect(effective).toMatchObject({ docusign: [{ src: '/prototype/docusign.png' }], 'health-qd': [{ src: '/prototype/qd-page-1.png' }, { src: '/prototype/qd-page-2.png' }] });
    const inspection = { ...catalog, siteScope: ['asce', 'handoff-template-test'], data: { ...data, sites: [...data.sites, { ...data.sites[0], id: 'handoff-template-test', key: 'handoff-template-test', name: 'Handoff template test' }] } };
    for (const scope of ['all', 'asce', 'handoff-template-test']) {
      const rows = configurationRows(inspection, scope).filter(row => row.key === 'prototype-handoffs');
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ name: 'External prototype screens', scope: 'Global template', group: 'Prototype fixtures' });
      expect(rows[0].description).toContain('Effective Sites may replace either page sequence');
      expect(rows[0].options).toContain('alt plus local src or placeholder');
    }
    const invalid = structuredClone(source);
    invalid.prototypeHandoffs.docusign[0] = { src: 'https://example.test/remote.png', alt: 'Invalid source' };
    expect(() => compileRequirementCatalog(withoutReviewedRecords(), invalid)).toThrow('Invalid prototype handoff screens');
  });
  it('keeps Eligibility content units intact and shared across the Library, prototype and Storybook', () => {
    const data = structuredClone(catalog.data);
    for (const row of data.contentValues) if (row.contentKey.startsWith('eligibility.') || row.contentKey.startsWith('pages.eligibility.') || row.contentKey.startsWith('validation.') || row.contentKey === 'recovery.resume-loaded') row.value = 'Stale saved wording';
    const words = freshStartSource().content;
    const rows = storedLibraryRows({ ...catalog, data }, 'contentValues', 'asce');
    for (const key of ['eligibility.verification.steps', 'validation.page.ineligible', 'recovery.resume-loaded', 'eligibility.verification.code-notice', ...Object.keys(words).filter(key => key.startsWith('validation.field.'))]) {
      expect(rows.find(row => row.contentKey === key)?.value, key).toEqual(words[key]);
    }
    expect(rows.find(row => row.contentKey === 'navigation.transitionMessages.eligibility')?.value).toEqual(words['eligibility.loading']);
    const prototype = resolvePrototypeLibrary(data, 'asce', 'eligibility-content');
    const story = buildGlobalTemplate({ ...catalog, data }, 'standard');
    expect(prototype.content.pages.eligibility?.title).toBe(words['eligibility.title']);
    expect(story.content.pages.eligibility).toEqual(prototype.content.pages.eligibility);
  });

  it('projects the Contact business heading as Site copy without changing its shared section definition', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    source.fields.sitePages!.example.contact = { ...source.fields.sitePages!.example.contact as object, content: { 'contact.section.business': 'Example employer heading' } };
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    const base = resolvePrototypeLibrary(withoutReviewedRecords(), 'asce', 'contact-copy-default');
    const configuration = compiledConfiguration(compiled, 'example');
    const example = buildPrototypeContent(compiled, { ...base.site, ...configuration });
    expect(example.pages.contact?.messages?.businessHeading).toBe('Example employer heading');
    expect(base.content.pages.contact?.messages?.businessHeading).toBe(source.content['contact.section.business']);
    expect(pagesDefaults.contact?.messages?.businessHeading).toBe(source.content['contact.section.business']);
    const shape = (sections: typeof base.site.configuration.pages[number]['sections']) => sections.map(section => ({ id: section.definition.value.id, fields: section.definition.value.fieldIds, participation: section.definition.value.applicantParticipation }));
    expect(shape(configuration.configuration.pages.find(page => page.key === 'contact')!.sections)).toEqual(shape(base.site.configuration.pages.find(page => page.key === 'contact')!.sections));
    for (const scope of ['all', 'asce']) expect(configurationRows(catalog, scope).filter(row => row.group === 'Contact content').map(row => row.key).sort()).toEqual(['contact.title', 'contact.subhead', 'contact.section.business'].map(key => `content:${key}`).sort());
    const invalid = structuredClone(source);
    invalid.fields.sitePages!.example.contact = { page: 'contact', content: { 'contact.section.business': ['invalid'] } };
    expect(() => compileRequirementCatalog(data, invalid)).toThrow('Invalid Site content value: contact.section.business');
  });

  it('keeps Contact definitions global while Site field and presentation overrides remain independent', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = { fields: { city: { label: 'Locality' }, 'phone-type': { options: ['mobile', 'home'] }, 'business-name': { required: false } } };
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    Object.assign(source.fields.sitePages!.example.contact as object, { hide: ['apt-suite'], configurations: { 'contact-hide-business-address': true, 'contact-hide-correspondence': true, 'contact-business-address-products': ['di-ltd'] } });
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    source.content['contact.section.business'] = 'Shared employer heading';
    const data = withoutReviewedRecords();
    for (const key of ['rule-contact-business-address-same-as-home', 'rule-contact-eligibility-address-carry-forward']) {
      data.rules.push({ ...data.rules[0], id: key, key });
      data.ruleAssignments.push({ ...data.ruleAssignments[0], id: `stale.${key}`, key: `stale.${key}`, ruleKey: key });
    }
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    for (const key of source.pages.contact.retiredFieldKeys!) data.fields.push({ ...data.fields[0], id: key, key, definition: { ...data.fields[0].definition, id: key } });
    const compiled = compileRequirementCatalog(data, source);
    expect(compiled.fields.some(field => field.key.startsWith('spouse-business-'))).toBe(false);
    expect(compiled.fields.find(field => field.key === 'city')?.definition.label).toBe('City');
    expect(compiled.fields.find(field => field.key === 'spouse-phone-type')?.definition.options).toHaveLength(3);
    for (const siteKey of ['asce', 'example']) {
      const site = compiledConfiguration(compiled, siteKey);
      const contact = site.configuration.pages.find(page => page.key === 'contact')!;
      expect(contact.fields.find(field => field.key === 'city')?.definition.label).toBe(siteKey === 'asce' ? 'City' : 'Locality');
      for (const key of ['street-address', 'city', 'state', 'zip-code']) expect(contact.fields.find(field => field.key === key)).toMatchObject({ included: true, definition: { required: true } });
      expect(contact.fields.find(field => field.key === 'business-name')?.definition.required).toBe(siteKey === 'asce');
      expect(contact.fields.find(field => field.key === 'apt-suite')?.included).toBe(siteKey === 'asce');
      expect(contact.fields.find(field => field.key === 'spouse-phone-type')?.definition.options).toHaveLength(siteKey === 'asce' ? 3 : 2);
      expect(contact.fields.find(field => field.key === 'spouse-phone')?.definition.autoComplete).toBe('off');
      expect(contact.fields.find(field => field.key === 'spouse-email')?.definition.autoComplete).toBe('off');
      expect(contact.fields.find(field => field.key === 'spouse-phone-type')?.definition.defaultValue).toBe('mobile');
      expect(() => validatePhoneFieldBindings(contact.fields.filter(field => field.included).map(field => field.definition))).not.toThrow();
      expect(contact.fields.some(field => field.key.startsWith('spouse-business-'))).toBe(false);
      const businessState = contact.fields.find(field => field.key === 'business-state')!.definition;
      expect(filterEligibleStateOptions(businessState, { eligibleStatesOnly: true, eligibleStates: ['NY'] }).options?.map(option => option.value)).toEqual(['NY']);
      expect(contact.sections.find(section => section.definition.value.id === 'contactBusinessInfo')?.definition.value.description).toBe('Shared employer heading');
      const flagKey = compiled.configurationDefinitions.find(row => row.definition.path?.join('.') === 'applicantExperience.contact.hideBusinessAddress')!.key;
      const flags = site.configuration.configurations.filter(row => row.key === flagKey);
      expect(flags[0]?.value).toBe(siteKey === 'example');
    }
    for (const key of ['contactResidentialAddress', 'contactBusinessInfo']) expect(compiled.pageSections.find(section => section.key === `contact.${key}`)?.definition).toMatchObject({ applicantParticipation: 'always' });
    expect(compiled.rules.some(rule => ['rule-contact-business-address-same-as-home', 'rule-contact-eligibility-address-carry-forward'].includes(rule.key))).toBe(false);
    expect(confirmedRequirementBehaviors(['contact']).map(rule => rule.id)).toEqual(expect.arrayContaining(['contact-owner-address', 'effective-site-configuration-resolution']));
    expect(source.pages.contact.businessPolicy?.hiddenCorrespondenceValue).toBe('residential');
    const wrongProduct = structuredClone(source);
    (wrongProduct.fields.sitePages!.example.contact as { configurations: Record<string, unknown> }).configurations['contact-business-address-products'] = ['missing-product'];
    expect(() => compileRequirementCatalog(data, wrongProduct)).toThrow('Invalid Contact business product scope');
    const wrongParticipation = structuredClone(source);
    Object.assign(wrongParticipation.pages.contact.layout.sections['residential-address'], { applicantParticipation: 'unknown' });
    expect(() => compileRequirementCatalog(data, wrongParticipation)).toThrow('Invalid fresh-start section participation');
    const invalid = structuredClone(source);
    invalid.pages.contact.layout.sections.spouse.companions = { missing: ['phone-type'] };
    expect(() => compileRequirementCatalog(data, invalid)).toThrow('Unplaced companion owner');
    const duplicate = structuredClone(source);
    duplicate.pages.contact.transitions!.enter.fieldMappings.push(duplicate.pages.contact.transitions!.enter.fieldMappings[0]);
    expect(() => compileRequirementCatalog(data, duplicate)).toThrow('Invalid fresh-start transition field');
  });

  it('reconstructs Beneficiary dialogs and product notes without saved bindings or note text', () => {
    const source = structuredClone(freshStartSource());
    const data = withoutReviewedRecords();
    data.fields = data.fields.filter(row => !row.key.startsWith('beneficiary'));
    data.configurationValues = data.configurationValues.filter(row => row.configurationKey !== 'shared.beneficiary-notes');
    source.content['beneficiary.note.replaces-prior'] = 'A newly authored shared designation note';
    const details = source.fields.fieldDetails as { fields: Array<{ id: string; label: unknown }> };
    details.fields.find(field => field.id === 'first-name')!.label = { default: 'First Name', beneficiary: 'Beneficiary given name' };
    expect(details).not.toHaveProperty('bindings');
    const globalOnly = compileRequirementCatalog(data, source, 'unconfigured');
    expect(source.pageDefaults.pages.beneficiary.requirement).toBe('optional');
    expect(globalOnly.fields.find(field => field.key === 'beneficiary-firstName')?.definition.label).toBe('Beneficiary given name');
    expect(globalOnly.configurationValues.find(row => row.configurationKey === 'field-surfaces' && row.scope === 'global')?.value).toHaveProperty('beneficiaryIndividual');
    delete (source.fields.sitePages!.asce.beneficiary as { requirement?: string }).requirement;
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const site = compiledConfiguration(compiled, 'asce');
    const surfaces = resolveStoredFieldSurfaces(compiled, site);
    expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe('optional');
    expect(surfaces.beneficiaryIndividual.mapping.fields[0]).toMatchObject({ id: 'beneficiary-firstName', label: 'Beneficiary given name', autoComplete: 'off' });
    expect(surfaces.beneficiaryIndividual.mapping.fieldToKey['beneficiary-firstName']).toBe('firstName');
    expect(surfaces.beneficiaryTrust.mapping.fieldToKey['beneficiary-trustDate']).toBe('trustDate');
    expect(surfaces.beneficiaryTrust.maxItems).toBe(1);
    expect(surfaces.beneficiaryControls.kind).toBe('controls');
    expect(surfaces.beneficiaryCopyControls.mapping.fields.find(field => field.id === 'beneficiaryApplyTarget')?.inputType).toBe('checkbox');
    expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.sections.map(section => section.definition.value.id)).toEqual(['beneficiaryParticipation', 'selfBeneficiaries', 'spouseBeneficiaries']);
    expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.sections[1].definition.value.components).toEqual(['BeneficiaryProductRecords']);

    expect(site.configuration.beneficiaryNotePolicies).toHaveLength(1);
    const policy = site.configuration.beneficiaryNotePolicies[0].value as { notes: Array<{ productKeys: string[]; text: string }> };
    expect(policy.notes.find(note => note.productKeys.includes('li-term'))?.text).toBe('A newly authored shared designation note');
    const invalid = structuredClone(source);
    invalid.pages.beneficiary.surfaces!.beneficiaryIndividual.aliases!['beneficiary-firstName'].field = 'email';
    expect(() => compileRequirementCatalog(data, invalid, 'asce')).toThrow('Unmapped fresh-start dialog field');
  });

  it('resolves Site Beneficiary wording independently of product/applicant assignment and global defaults', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const wording = { 'beneficiary.note.replaces-prior': 'Example Site replaces-prior designation', 'beneficiary.note.new-insurance': 'Example Site new-insurance designation' };
    const page = source.fields.sitePages!.example.beneficiary as { content?: Record<string, unknown>; productNotes: Record<string, { content: string; applicants: string[] }> };
    page.content = wording;
    const assignments = structuredClone(page.productNotes);
    const data = withoutReviewedRecords();
    data.configurationValues = data.configurationValues.filter(row => row.configurationKey !== 'shared.beneficiary-notes');
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    for (const key of ['asce', 'example']) {
      const config = compiledConfiguration(compiled, key).configuration;
      const policy = config.beneficiaryNotePolicies[0].value as { notes: Array<{ productKeys: string[]; applicants: string[]; text: string }> };
      for (const [product, assignment] of Object.entries(assignments)) {
        const note = policy.notes.find(note => note.productKeys.includes(product))!;
        expect(note.applicants).toEqual(assignment.applicants);
        expect(note.text).toBe(key === 'example' ? wording[assignment.content as keyof typeof wording] : source.content[assignment.content]);
      }
      expect(config.pages.find(page => page.key === 'beneficiary')?.requirement).toBe('optional');
      for (const [contentKey, value] of Object.entries(wording)) expect(config.content.find(row => row.key === contentKey)?.value).toBe(key === 'example' ? value : source.content[contentKey]);
    }
    expect(Object.keys(source.pages.beneficiary.contentSlots!)).toHaveLength(4);
    for (const scope of ['all', 'asce']) {
      const rows = configurationRows(catalog, scope).filter(row => row.group === 'Beneficiary content');
      expect(rows.map(row => row.key).sort()).toEqual(Object.keys(source.pages.beneficiary.contentSlots!).map(key => `content:${key}`).sort());
    }
    for (const key of ['beneficiary.error.primary-required', 'beneficiary.error.allocation-total', 'beneficiary.dialog.add-title', 'beneficiary.help.what-is']) {
      const invalid = structuredClone(source);
      (invalid.fields.sitePages!.example.beneficiary as { content: Record<string, unknown> }).content = { [key]: source.content[key] };
      expect(() => compileRequirementCatalog(data, invalid), key).toThrow(`Undeclared Site content slot: beneficiary/${key}`);
    }
    const blank = structuredClone(source);
    (blank.fields.sitePages!.example.beneficiary as { content: Record<string, unknown> }).content['beneficiary.note.replaces-prior'] = ' ';
    expect(() => compileRequirementCatalog(data, blank)).toThrow('Invalid product note text: example/beneficiary/li-term');
    const malformed = structuredClone(source);
    (malformed.fields.sitePages!.example.beneficiary as { content: Record<string, unknown> }).content['beneficiary.note.replaces-prior'] = [];
    expect(() => compileRequirementCatalog(data, malformed)).toThrow('Invalid Site content value: beneficiary.note.replaces-prior');
  });

  it('shares Beneficiary definitions while keeping Site field, participation and note selections independent', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = { fields: { 'first-name': { label: { beneficiary: 'Recipient given name' } } } };
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const page = source.fields.sitePages!.example.beneficiary as { requirement: string; productNotes: Record<string, { content: string }> };
    page.requirement = 'required';
    page.productNotes['li-term'].content = 'beneficiary.note.new-insurance';
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    for (const siteKey of ['asce', 'example']) {
      const site = compiledConfiguration(compiled, siteKey);
      const surface = resolveStoredFieldSurfaces(compiled, site).beneficiaryIndividual;
      expect(surface.mapping.fields[0].label).toBe(siteKey === 'asce' ? 'First Name' : 'Recipient given name');
      expect(surface.mapping.fieldToKey['beneficiary-firstName']).toBe('firstName');
      expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe(siteKey === 'asce' ? 'optional' : 'required');
      expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.fields).toEqual([]);
      expect(site.configuration.issues.some(issue => issue.domain === 'fields' && issue.key.startsWith(`requirements.${siteKey}.beneficiary.`))).toBe(false);
      const policy = site.configuration.beneficiaryNotePolicies[0].value as { notes: Array<{ productKeys: string[]; text: string }> };
      expect(policy.notes.find(note => note.productKeys.includes('li-term'))?.text).toBe(source.content[siteKey === 'asce' ? 'beneficiary.note.replaces-prior' : 'beneficiary.note.new-insurance']);
    }
    expect(compiled.fields.filter(field => field.key === 'beneficiary-firstName')).toHaveLength(1);
    expect(compiled.fields.find(field => field.key === 'beneficiary-firstName')?.definition.label).toBe('First Name');
  });

  it('keeps Beneficiary core collection and validation global across the fresh source consumers', () => {
    const data = withoutReviewedRecords();
    const prototype = resolvePrototypeLibrary(data, 'asce', 'beneficiary-core-fields');
    const story = buildGlobalTemplate({ ...catalog, data }, 'standard');
    for (const model of [prototype, story]) {
      expect(model.site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe('optional');
      expect(model.fieldSurfaces.beneficiaryIndividual.maxItems).toBe(10);
      expect(model.fieldSurfaces.beneficiaryTrust.maxItems).toBe(1);
      for (const name of ['beneficiaryIndividual', 'beneficiaryTrust']) {
        expect(model.fieldSurfaces[name].mapping.fields.every(field => field.required)).toBe(true);
      }
      expect(model.fieldSurfaces.beneficiaryControls.mapping.fields.find(field => field.id === 'beneficiary-information-opt-in')?.required).toBe(true);
      expect(model.fieldSurfaces.beneficiaryIndividual.mapping.fieldToKey['beneficiary-firstName']).toBe('firstName');
      try {
        installPrototypeLibrary(model);
        expect(resolveActiveAssociationFromApplication(model.site.siteKey, { membership: 'yes' }).status).toBe('resolved');
      } finally { installPrototypeLibrary(null); }
    }
    const rows = storedFieldRows({ ...catalog, data }, 'asce');
    for (const name of ['beneficiaryIndividual', 'beneficiaryTrust']) for (const field of prototype.fieldSurfaces[name].mapping.fields) {
      expect(rows.find(row => row.key === field.id)?.definition).toEqual(field);
    }
    expect(configurationRows({ ...catalog, data }, 'asce').find(row => row.key === 'shared.beneficiary-participation')).toMatchObject({ scope: 'Global template', owner: 'rules' });
  });

  it('retires category expansion and isolates additional/total message selection from amount policy', () => {
    const input = withoutReviewedRecords(), source = structuredClone(freshStartSource());
    const retired = 'rule-coverage-category-initial-expansion';
    input.rules.push({ ...catalog.data.rules[0], id: retired, key: retired, definition: { ...catalog.data.rules[0].definition, id: retired, behavior: 'Stale allCategoriesExpanded behavior' } });
    input.ruleAssignments.push({ ...catalog.data.ruleAssignments[0], id: 'stale.expansion', key: 'stale.expansion', ruleKey: retired });
    input.ruleActions.push({ ...catalog.data.ruleActions[0], id: 'stale.expansion.action', key: 'stale.expansion.action', ruleKey: retired });
    const retiredSettings = ['coverages.allCategoriesExpanded', 'stale.expansion.alias', 'config-coverages-categorysectionlabels-allcategoriesexpanded'];
    for (const key of retiredSettings) {
      input.configurationDefinitions.push({ ...catalog.data.configurationDefinitions[0], id: key, key, definition: { path: key.startsWith('config-') ? null : ['coverages', 'allCategoriesExpanded'], metadata: { description: 'Stale allCategoriesExpanded control' } } });
      input.configurationValues.push({ ...catalog.data.configurationValues[0], id: key, key, configurationKey: key, scope: 'global', siteKey: null, clientKey: null, value: true });
    }
    const compiled = compileRequirementCatalog(input, source, 'asce');
    expect(compiled.rules.some(row => row.key === retired)).toBe(false);
    for (const rows of [compiled.ruleAssignments, compiled.ruleActions]) expect(rows.some(row => row.ruleKey === retired)).toBe(false);
    expect(compiled.configurationDefinitions.some(row => row.definition.path?.join('.') === 'coverages.allCategoriesExpanded')).toBe(false);
    expect(compiled.configurationValues.some(row => retiredSettings.includes(row.configurationKey))).toBe(false);
    expect(configurationRows({ ...catalog, data: compiled }, 'asce').filter(row => /allCategoriesExpanded|initial expansion/i.test(JSON.stringify(row)))).toEqual([]);
    const baseline = resolvePrototypeLibrary(input, 'asce', 'test:additional-message', source);
    const page = source.fields.sitePages!.asce.coverage as { configurations?: Record<string, unknown> };
    page.configurations = { ...page.configurations, 'coverage-increase-note': 'applyForTotal' };
    const total = resolvePrototypeLibrary(input, 'asce', 'test:total-message', source);
    expect(baseline.client.coverages.additionalCoverageWarning).toBe('applyForAdditional');
    expect(total.client.coverages.additionalCoverageWarning).toBe('applyForTotal');
    expect(total.products).toEqual(baseline.products);
    expect(total.site.configuration.products).toEqual(baseline.site.configuration.products);
    const values = { membership: 'yes', 'birth-date': '1990-01-01', 'state-province': 'VA', 'tpa-existing-member': true, 'tpa-active-coverage': true, 'tpa-verified': true, 'tpa-portfolio-enabled': true };
    try {
      installPrototypeLibrary(baseline);
      const amounts = resolveApplicationCoverage(baseline.products.find(row => row.id === 'li-term')!, 'member', values, baseline.products).amounts;
      expect(amounts.length).toBeGreaterThan(0);
      installPrototypeLibrary(total);
      expect(resolveApplicationCoverage(total.products.find(row => row.id === 'li-term')!, 'member', values, total.products).amounts).toEqual(amounts);
    } finally { installPrototypeLibrary(null); }
    const invalid = structuredClone(source);
    invalid.application.records.configurationDefinitions.push({ id: 'stale.expansion', key: 'stale.expansion', definition: { path: ['coverages', 'allCategoriesExpanded'] } });
    expect(() => compileRequirementCatalog(input, invalid, 'asce')).toThrow('Active retired application definition');
  });

  it('owns the optional Coverage breakdown and question overrides without captured display pricing', () => {
    const source = structuredClone(freshStartSource());
    const input = withoutReviewedRecords();
    for (const suffix of ['', '.policyFee']) {
      const key = `stale-breakdown${suffix}`;
      input.configurationDefinitions.push({ ...catalog.data.configurationDefinitions[0], id: key, key, definition: { path: `coverages.productEstimatedCostBreakdown${suffix}`.split('.'), metadata: {} } });
      input.configurationValues.push({ ...catalog.data.configurationValues[0], id: key, key, configurationKey: key, scope: 'site', siteKey: 'asce', clientKey: null, value: suffix ? 999 : { enabled: true, policyFee: { amount: 999 } } });
    }
    const baseline = compileRequirementCatalog(input, source, 'asce');
    expect(baseline.configurationDefinitions.some(row => row.key.startsWith('stale-breakdown'))).toBe(false);
    const inherited = buildPrototypeClient(baseline, resolveEffectiveSite(baseline, 'asce')).client;
    expect(inherited.coverages.productEstimatedCostBreakdown).toEqual({ enabled: false });
    const page = source.fields.sitePages!.asce.coverage as { hide?: string[]; configurations?: Record<string, unknown> };
    page.hide = ['smoker'];
    page.configurations = { 'coverage-cost-breakdown': true };
    (source.fields.sites.asce as { fields: Record<string, unknown> }).fields['hours-worked-per-week'] = { required: { coverage: false } };
    const changed = compileRequirementCatalog(input, source, 'asce');
    const effective = compiledConfiguration(changed, 'asce');
    const coverage = effective.configuration.pages.find(row => row.key === 'coverage')!;
    expect(coverage.fields.find(row => row.key === 'smoker')).toMatchObject({ included: false, definition: { id: 'smoker' } });
    expect(coverage.fields.find(row => row.key === 'hours-worked-per-week')?.definition.required).toBe(false);
    expect(effective.configuration.pages.find(row => row.key === 'home')?.fields.find(row => row.key === 'smoker')?.included).not.toBe(false);
    expect(changed.eligibilityConstraints).toEqual(baseline.eligibilityConstraints);
    expect(buildPrototypeClient(changed, { ...resolveEffectiveSite(changed, 'asce'), ...effective }).client.coverages.productEstimatedCostBreakdown).toEqual({ enabled: true });
    expect(configurationRows({ ...catalog, data: changed }, 'asce').find(row => row.name === 'Show itemized product cost breakdown')?.scope).toBe('Global template');
  });

  it('rejects Coverage assignments outside their declared setting, product and applicant scopes', () => {
    const input = withoutReviewedRecords();
    const source = structuredClone(freshStartSource());
    const document = source.siteCoverage.asce as { assignments: Array<Record<string, unknown>> };
    const original = structuredClone(document.assignments[0]);
    document.assignments[0] = { ...original, configuration: 'saved-application-retention-days', value: 10 };
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('does not support product/applicant overrides');
    document.assignments[0] = { ...original, product: 'not-assigned' };
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('unknown product');
    document.assignments[0] = { ...original, product: 'di-ltd', applicants: ['child'] };
    expect(() => compileRequirementCatalog(input, source, 'asce')).toThrow('invalid applicants');
    document.assignments[0] = original;
    expect(() => compileRequirementCatalog(input, source, 'asce')).not.toThrow();
  });
  it.each(["all", "asce", "template-test"])("documents global amount controls for %s while Site values remain effective assignments", scope => {
    // An unconfigured Site proves visibility is independent of ASCE rollout
    // assignments. It shares the template without introducing another rollout.
    const unconfigured = { ...catalog, siteScope: ["asce", "template-test"], data: { ...catalog.data, sites: [...catalog.data.sites, { ...catalog.data.sites[0], id: "template-test", key: "template-test", name: "Template test" }] } };
    {
      const settings = configurationRows(unconfigured, scope);
      const policyRows = libraryRequirementRows(unconfigured, scope);
      for (const definition of coveragePolicyConfigurationDefinitions) {
        expect(settings.find(row => row.referenceKey === definition.id && row.scope === 'Global template'), definition.id).toBeDefined();
        expect(policyRows.find(row => row.key === definition.id && row.site === 'Global template'), definition.id).toBeDefined();
      }
      for (const id of ["coverage-amount-order", "coverage-amount-default-mode", "coverage-amount-default-value", "coverage-amount-locked"]) {
        const row = settings.find(row => row.referenceKey === id)!;
        expect(row, `${scope}: ${id}`).toBeDefined();
        expect(row.scope).toBe("Global template");
        expect(row.description).toContain("runtime supported");
        expect(row.source).toContain("requirements/global/configurations/coverage-amount-controls.json");
      }
      expect(settings.find(row => row.referenceKey === "coverage-amount-order")?.options).toContain("maximum-to-minimum");
      expect(settings.find(row => row.referenceKey === "coverage-amount-default-value")?.values).toBe("No specific amount assigned");
      for (const id of ["category-order", "product-order"]) {
        const setting = settings.find(row => row.referenceKey === id)!;
        expect(setting.scope).toBe("Global template");
        expect(setting.source).toContain("requirements/global/configurations/product-presentation.json");
        expect(setting.description).toContain("featured_prod takes precedence");
        expect(setting.values).toContain("Declared default:");
        expect(setting.usedIn).toContain("Home");
        expect(setting.usedIn).toContain("application menu");
      }
      const rules = libraryRequirementRows(unconfigured, scope);
      for (const id of ["category-product-presentation-order", "coverage-amount-presentation-defaults", "coverage-url-product-presentation", "coverage-configured-rider-participation", "coverage-configured-benefit-periods", "coverage-child-one-life-plan"]) {
        const rows = rules.filter(row => row.key === id);
        expect(rows, `${scope}: ${id}`).toHaveLength(1);
        expect(rows[0].status).toBe("Confirmed requirement; declarative");
        expect(rows[0].site).toBe("Global template");
        expect(rows[0].behavior).not.toMatch(/ASCE/);
      }
    }
    const params = urlParameterRows(catalog, "asce");
    expect(params.find(row => row.parameter === "amt")).toMatchObject({ behavior: expect.stringContaining("specified amount"), values: expect.arrayContaining(["G-0000-0_2000000"]) });
    expect(params.find(row => row.parameter === "dprods")?.behavior).toContain("Disables");
  });
  it("shares template definitions across effective Sites while keeping assigned values independent", () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    const assignment = structuredClone(source.siteCoverage.asce) as { site: string; assignments: Array<{ configuration: string; value: unknown }> };
    assignment.site = "example";
    assignment.assignments.find(row => row.configuration === "coverage-minimum-work-hours")!.value = 35;
    assignment.assignments.find(row => row.configuration === "coverage-verified-existing-minimum-amount")!.value = 30000;
    source.siteCoverage.example = assignment;
    source.content["coverage.title"] = "Shared template heading";
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === "asce")!, key: "example", id: "example" });
    const compiled = compileRequirementCatalog(data, source);
    for (const siteKey of ["asce", "example"]) {
      expect(compiled.contentValues.find(row => row.siteKey === siteKey && row.contentKey === "pages.coverage.title")?.value).toBe("Shared template heading");
      const key = compiled.configurationDefinitions.find(row => row.definition.path?.join(".") === "coverageRequirements")!.key;
      const values = compiled.configurationValues.find(row => row.siteKey === siteKey && row.configurationKey === key)!.value as Array<{ configuration: string; value: unknown }>;
      expect(values.find(row => row.configuration === "coverage-minimum-work-hours")?.value).toBe(siteKey === "asce" ? 30 : 35);
      expect(values.find(row => row.configuration === "coverage-verified-existing-minimum-amount")?.value).toBe(siteKey === "asce" ? 10000 : 30000);
    }
    // A Site changes values, not the identity or number of shared definitions.
    expect(compiled.sitePolicies.filter(row => ['asce', 'example'].includes(row.siteKey)).map(row => row.siteKey).sort()).toEqual(['asce', 'example']);
    expect(compiled.configurationDefinitions.filter(row => row.definition.target?.kind === 'site-life-aggregate')).toHaveLength(1);
    expect(compiled.pages.filter(row => row.key === "coverage")).toHaveLength(1);
    expect(compiled.fields.filter(row => row.key === "self-employed-under-one-year")).toHaveLength(1);
    expect(compiled.pageSections.filter(row => row.key === "coverage.selfCoverageWorkIncome")).toHaveLength(1);
  });
  it("reconstructs reviewed pages after removing all superseded records, without mutating its input", () => {
    const data = withoutReviewedRecords();
    const before = structuredClone(data);
    const compiled = withFreshStartCatalog(data, "asce");
    expect(data).toEqual(before);
    const actual = resolveEffectiveSite(compiled, "asce");
    const expected = resolveEffectiveSite(catalog.data, "asce");
    for (const page of reviewedPages) expect(actual.configuration.pages.find(row => row.key === page)).toEqual(expected.configuration.pages.find(row => row.key === page));
    expect(actual.products).toEqual(expected.products);
    expect(actual.configuration.products).toEqual(expected.configuration.products);
    const prototype = resolvePrototypeLibrary(data, 'asce', catalog.revision);
    const expectedPrototype = resolvePrototypeLibrary(catalog.data, 'asce', catalog.revision);
    expect(prototype.products).toEqual(expectedPrototype.products);
    expect(prototype.client).toEqual(expectedPrototype.client);
    expect(prototype.associationContext).toEqual(expectedPrototype.associationContext);
    expect(urlParameterRows({ ...catalog, data }, 'asce')).toEqual(urlParameterRows(catalog, 'asce'));
    const story = buildGlobalTemplate({ ...catalog, data }, 'multipleTerms');
    expect(story.products).toEqual(buildGlobalTemplate(catalog, 'multipleTerms').products);
    const repeated = withFreshStartCatalog(compiled, "asce");
    expect(resolveEffectiveSite(repeated, "asce").configuration).toEqual(actual.configuration);
  });

  it('reconstructs the full application without legacy fields, policy inputs or workflow records', () => {
    const source = freshStartSource();
    const data = withoutReviewedRecords();
    data.fields = [];
    data.validationRules = [];
    const tables = new Set([...Object.keys(source.application.records), ...Object.keys(source.siteApplication.asce.records)]);
    for (const table of tables) (data as unknown as Record<string, unknown[]>)[table] = [];
    const library = resolvePrototypeLibrary(data, 'asce', catalog.revision);
    const expected = resolvePrototypeLibrary(catalog.data, 'asce', catalog.revision);
    expect(library.client).toEqual(expected.client);
    expect(library.content).toEqual(expected.content);
    expect(library.fieldSurfaces).toEqual(expected.fieldSurfaces);
    expect(library.fieldCollections).toEqual(expected.fieldCollections);
    const contactRows = storedFieldRows({ ...catalog, data }, 'asce').filter(row => row.placements.some(placement => placement.page === 'contact'));
    for (const field of library.site.configuration.pages.find(page => page.key === 'contact')!.fields) if (field.included) expect(contactRows.find(row => row.key === field.key)?.definition).toEqual(field.definition);
    const beneficiaryRows = storedFieldRows({ ...catalog, data }, 'asce').filter(row => row.placements.some(placement => placement.page === 'beneficiary'));
    for (const name of ['beneficiaryIndividual', 'beneficiaryTrust', 'beneficiaryControls', 'beneficiaryCopyControls']) {
      for (const field of library.fieldSurfaces[name].mapping.fields) expect(beneficiaryRows.find(row => row.key === field.id)?.definition).toEqual(field);
    }
    for (const page of reviewedPages) expect(library.site.configuration.pages.find(row => row.key === page)).toEqual(expected.site.configuration.pages.find(row => row.key === page));
    expect(Object.values(source.pages)).toHaveLength(28);
    installPrototypeLibrary(library);
    try {
      expect(fieldCatalog['review-self-consent']).toBe(library.fields.find(field => field.id === 'review-self-consent'));
      expect(fieldCatalog['street-address']).toBe(library.fields.find(field => field.id === 'street-address'));
    } finally { installPrototypeLibrary(null); }
    expect(buildGlobalTemplate({ ...catalog, data }, 'multipleTerms').content.pages).toEqual(buildGlobalTemplate(catalog, 'multipleTerms').content.pages);
  });

  it('replaces stale product policies and derives all Life ceiling displays from one assignment', () => {
    const changed = structuredClone(catalog);
    for (const row of changed.data.configurationValues) {
      const target = changed.data.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.target;
      if (['product-benefit-policy', 'product-selection-policy', 'product-dependent-policy'].includes(target?.kind ?? '')) row.value = { stale: true };
    }
    for (const row of changed.data.underwritingBands) row.maximumAmount = 1;
    const prototype = resolvePrototypeLibrary(changed.data, 'asce', changed.revision);
    expect(prototype.products).toEqual(resolvePrototypeLibrary(catalog.data, 'asce', catalog.revision).products);
    expect(buildGlobalTemplate(changed, 'multipleTerms').products).toEqual(buildGlobalTemplate(catalog, 'multipleTerms').products);
    expect(libraryRequirementRows(changed, 'asce')).toEqual(libraryRequirementRows(catalog, 'asce'));
    const source = structuredClone(freshStartSource());
    (source.siteCoveragePolicies.asce as { lifeMaximum: { maximum: number } }).lifeMaximum.maximum = 1800000;
    const compiled = compileRequirementCatalog(withoutReviewedRecords(), source, 'asce');
    const definition = compiled.configurationDefinitions.find(row => row.definition.path?.join('.') === 'coveragePolicy.aggregateNotes.LI')!;
    expect(compiled.configurationValues.find(row => row.siteKey === 'asce' && row.configurationKey === definition.key)?.value).toMatchObject({ member: expect.stringContaining('$1,800,000'), spouse: expect.stringContaining('$1,800,000') });
    expect(compiled.underwritingBands.some(rule => rule.siteKey === 'asce' && rule.productKey === 'li-10yr' && rule.maximumAmount === 1800000)).toBe(true);
  });

  it("uses source layout, field definitions, content and policy assignments in the shared contract", () => {
    const source = structuredClone(freshStartSource());
    source.content["coverage.title"] = "A newly authored heading";
    source.pages.coverage.layout.sections["self-work"].fields = ["self-employed-under-one-year", "hours-worked-per-week", "average-monthly-income"];
    const details = source.fields.fieldDetails as { fields: Array<{ id: string; label: string }> };
    details.fields.find(field => field.id === "self-employed-under-one-year")!.label = "A newly authored question";
    const document = source.siteCoverage.asce as { assignments: Array<{ configuration: string; value: unknown }> };
    document.assignments.find(row => row.configuration === "coverage-minimum-work-hours")!.value = 31;
    const page = source.fields.sitePages!.asce.coverage as { configurations?: Record<string, unknown> };
    page.configurations = { ...page.configurations, "coverage-amount-order": "maximum-to-minimum", "coverage-amount-default-mode": "specified", "coverage-amount-default-value": 200000, "coverage-amount-locked": true };
    const compiled = compileRequirementCatalog(withoutReviewedRecords(), source, "asce");
    expect(compiled.contentValues.find(row => row.contentKey === "pages.coverage.title")?.value).toBe("A newly authored heading");
    expect(compiled.pageSections.find(row => row.key === "coverage.selfCoverageWorkIncome")?.definition.fieldIds).toEqual(["self-employed-under-one-year", "hours-worked-per-week", "average-monthly-income"]);
    expect(compiled.fields.find(row => row.key === "self-employed-under-one-year")?.definition.label).toBe("A newly authored question");
    expect(compiled.eligibilityConstraints.some(row => row.siteKey === "asce" && row.productKey === "di-ltd" && row.minimumWorkHours === 31)).toBe(true);
    for (const [property, value] of Object.entries({ order: "maximum-to-minimum", defaultMode: "specified", defaultValue: 200000, locked: true })) {
      const key = compiled.configurationDefinitions.find(row => row.definition.path?.join(".") === `coverages.amountSelection.${property}`)!.key;
      expect(compiled.configurationValues.find(row => row.siteKey === "asce" && row.configurationKey === key)?.value).toBe(value);
    }
  });

  it('reconstructs one redirect component and every content case while retiring superseded records', () => {
    const source = structuredClone(freshStartSource());
    expect(Object.keys(source.recovery.families).sort()).toEqual(['error', 'expired', 'maintenance']);
    const data = withoutReviewedRecords();
    for (const key of source.recovery.retiredPageKeys) {
      data.pages.push({ ...catalog.data.pages[0], id: key, key, definition: { id: key as PageId, path: `/${key}`, type: 'error', flow: 'utility', healthGate: false } });
      data.sitePages.push({ ...catalog.data.sitePages[0], id: `asce.${key}`, key: `asce.${key}`, siteKey: 'asce', pageKey: key, requirement: 'required' });
    }
    data.components.push({ ...catalog.data.components[0], id: 'component-recovery-alert', key: 'component-recovery-alert' });
    data.contentEntries.push({ ...catalog.data.contentEntries[0], id: 'pages.application-unavailable.title', key: 'pages.application-unavailable.title', definition: { path: ['pages', 'application-unavailable', 'title'] } });
    data.contentValues.push({ ...catalog.data.contentValues[0], id: 'stale-unavailable-title', key: 'stale-unavailable-title', contentKey: 'pages.application-unavailable.title', value: 'Saved application unavailable' });
    const compiled = compileRequirementCatalog(data, source);
    expect(compiled.contentEntries.some(row => row.key.startsWith('pages.application-unavailable.'))).toBe(false);
    expect(compiled.pages.some(page => source.recovery.retiredPageKeys.includes(page.key))).toBe(false);
    expect(compiled.sitePages.some(page => source.recovery.retiredPageKeys.includes(page.pageKey))).toBe(false);
    expect(compiled.components.some(component => component.key === 'component-recovery-alert')).toBe(false);
    const prototype = resolvePrototypeLibrary(compiled, 'asce', 'recovery-parity', source);
    const library = pageCatalogRows({ ...catalog, data: compiled }, 'asce');
    const story = buildGlobalTemplate({ ...catalog, data: compiled });
    for (const key of ['error-400', 'error-404', 'error-500', 'technical-error', 'maintenance', 'session-expired']) {
      expect(prototype.pages.find(page => page.key === key)?.definition).toMatchObject({ flow: 'utility' });
      expect(library.find(page => page.key === key)?.definition).toEqual(prototype.pages.find(page => page.key === key)?.definition);
      expect(story.pages.find(page => page.key === key)?.definition).toEqual(prototype.pages.find(page => page.key === key)?.definition);
    }
    expect(prototype.pages.some(page => page.key === 'link-expired')).toBe(false);
    expect(storedLibraryRows({ ...catalog, data: compiled }, 'contentValues', 'asce').find(row => row.contentKey === 'pages.resume.linkExpiredTitle')?.value).toBe(source.content['recovery.link-expired.title']);
    expect(source.recovery.states['link-expired']).toMatchObject({ placement: 'alert', hostPage: 'resume', actions: [] });
    expect(confirmedRequirementBehaviors(['technical-error']).some(rule => rule.id === 'recovery-resume-privacy')).toBe(true);
    source.recovery.template.sections.pop();
    expect(() => compileRequirementCatalog(data, source)).toThrow('Invalid shared recovery template');
  });

  it('owns Home, recovery and confirmation content despite stale saved records', () => {
    const changed = structuredClone(catalog);
    for (const row of changed.data.contentValues) if (['help.quickDecision.availability', 'help.quickDecision.showMore', 'help.quickDecision.showLess'].includes(row.contentKey)) row.value = 'Stale QuickDecision copy';
    for (const row of changed.data.contentValues) if (row.contentKey.startsWith('home.') || row.contentKey.startsWith('pages.advisor-send-confirmation.') || row.contentKey.startsWith('pages.technical-error.')) row.value = 'Stale copy';
    changed.data.contentEntries.push({ ...changed.data.contentEntries[0], id: 'home.clientSection', key: 'home.clientSection', definition: { path: ['home', 'clientSection'] } });
    changed.data.contentValues.push({ ...changed.data.contentValues[0], id: 'stale-home-section', key: 'stale-home-section', contentKey: 'home.clientSection', scope: 'site', siteKey: 'asce', clientKey: null, value: { tagline: 'Stale section', paragraphs: [] } });
    const current = resolvePrototypeLibrary(changed.data, 'asce', changed.revision);
    const source = freshStartSource();
    expect(current.content.home.hero.title).toBe(source.content['home.hero.title']);
    expect(current.content.home.clientSection).toEqual({ tagline: '', paragraphs: [] });
    expect(current.content.pages['advisor-send-confirmation']?.title).toBe(source.content['confirmation.advisor.title']);
    expect(current.content.pages['technical-error']?.title).toBe(source.content['recovery.technical-error.title']);
    const story = buildGlobalTemplate(changed, 'multipleTerms');
    expect(story.content.home.hero.title).toBe(current.content.home.hero.title);
    for (const [property, key] of [['availability', 'availability'], ['showMore', 'show-more'], ['showLess', 'show-less']] as const) {
      const expected = source.content[`help.quick-decision.${key}`];
      expect(current.content.help.quickDecision[property]).toBe(expected);
      expect(story.content.help.quickDecision[property]).toBe(expected);
      expect(storedLibraryRows(changed, 'contentValues', 'asce').find(row => row.contentKey === `help.quickDecision.${property}`)?.value).toBe(expected);
    }
    expect(story.content.pages['advisor-send-confirmation']).toEqual(current.content.pages['advisor-send-confirmation']);
    expect(storedLibraryRows(changed, 'contentValues', 'asce').find(row => row.contentKey === 'home.hero.title')?.value).toBe(current.content.home.hero.title);
    expect(current.fieldSurfaces.quoteInputs.mapping.fields.find(field => field.id === 'quote-selection')?.label).toBe(source.content['home.quote.selection-label']);
    expect(current.site.configuration.pages.find(page => page.key === 'home')?.fields.filter(field => field.included).map(field => field.key)).toEqual(['zip-postal-code', 'state-province', 'birth-date']);
    expect(story.client.features?.homePageVariant).toBe(current.client.features?.homePageVariant);
  });

  it("keeps Library, prototype and Storybook on the fresh source despite stale saved page records", () => {
    const changed = structuredClone(catalog);
    for (const page of changed.data.pages) if (reviewed.has(page.key)) page.definition.path = "/stale";
    for (const field of changed.data.fields) if (field.key === "self-employed-under-one-year") Object.assign(field.definition, { label: "Stale", required: false, helperText: "Stale" });
    for (const field of changed.data.fields) if (field.key === "coverage-categories") Object.assign(field.definition, { label: "Stale", required: false, options: [{ value: "old", label: "Old" }] });
    for (const row of changed.data.contentValues) if (row.contentKey === "pages.coverage.title") row.value = "Stale";
    const prototype = resolvePrototypeLibrary(changed.data, "asce", changed.revision);
    const story = buildGlobalTemplate(changed, "multipleTerms");
    for (const page of reviewedPages) {
      const expectedPath = Object.values(freshStartSource().pages).find(source => (source.consumerKey ?? source.page) === page)!.definition.path;
      expect(prototype.site.configuration.pages.find(row => row.key === page)?.definition?.value.path).toBe(expectedPath);
      expect(story.content.pages[page]).toEqual(prototype.content.pages[page]);
    }
    expect(storedLibraryRows(changed, "contentValues", "asce").find(row => row.contentKey === "pages.coverage.title")?.value).toBe(prototype.content.pages.coverage!.title);
    const fields = storedFieldRows(changed, "asce").filter(row => row.placements.some(placement => placement.page === "coverage"));
    const question = fields.filter(row => row.key === "self-employed-under-one-year");
    expect(question).toHaveLength(1);
    expect(question[0].definition).toMatchObject({ required: true, label: "Are you self-employed for less than 1 year?" });
    expect(question[0].definition.helperText).not.toBe("Stale");
    expect(question[0].placements).toEqual(expect.arrayContaining([expect.objectContaining({ section: "selfCoverageWorkIncome" })]));
    expect(fields.some(row => ["is-self-employed", "years-self-employed"].includes(row.key))).toBe(false);
    const categoryQuestion = prototype.fields.find(field => field.id === "coverage-categories")!;
    expect(categoryQuestion.required).toBe(true);
    expect(categoryQuestion.label).not.toBe("Stale");
    expect(categoryQuestion.options?.map(option => option.value)).toEqual(["LI", "AD", "DI", "OO", "SH"]);
    expect(prototype.fieldSurfaces.coverageControls.mapping.fields.find(field => field.id === "coverage-categories")?.options?.map(option => option.value)).toEqual(["LI", "AD", "DI"]);
    const site = resolveEffectiveSite(changed.data, "asce");
    expect(validateNormalizedCoverageAmount(site, "li-term", "member", 10000).allowed).toBe(true);
    expect(validateNormalizedCoverageAmount(site, "li-term", "member", 20000).allowed).toBe(true);
    expect(resolveEffectiveAmount(site.configuration, "li-term", { applicantKey: "member", amount: 10000 }).allowed).toBe(true);
    expect(resolveEffectiveAmount(site.configuration, "li-term", { applicantKey: "member", amount: 10000, mode: "increase" }).allowed).toBe(true);
  });

  it("rejects missing source content, configurations and unmapped layout fields", () => {
    const missingAssignments = structuredClone(freshStartSource());
    delete missingAssignments.siteProducts.asce.catalog;
    expect(() => compileRequirementCatalog(catalog.data, missingAssignments, 'asce')).toThrow(/Missing fresh-start product assignments/);
    const missingDefinition = structuredClone(freshStartSource());
    missingDefinition.products.catalog.products = missingDefinition.products.catalog.products.filter(row => row.key !== 'li-term');
    expect(() => compileRequirementCatalog(catalog.data, missingDefinition, 'asce')).toThrow(/Missing fresh-start product definition/);
    const missingPolicy = structuredClone(freshStartSource());
    missingPolicy.products.catalog.configurationDefinitions = missingPolicy.products.catalog.configurationDefinitions.filter(row => row.key !== 'template.di-ltd.reviewed-benefit-policy');
    expect(() => compileRequirementCatalog(catalog.data, missingPolicy, 'asce')).toThrow(/Missing fresh-start configuration definition/);
    const missingContent = structuredClone(freshStartSource());
    delete missingContent.content["coverage.title"];
    expect(() => compileRequirementCatalog(catalog.data, missingContent, "asce")).toThrow(/Missing fresh-start content/);
    const missingConfiguration = structuredClone(freshStartSource());
    missingConfiguration.configurations = missingConfiguration.configurations.filter(row => row.id !== "estimated-rate-frequency");
    expect(() => compileRequirementCatalog(catalog.data, missingConfiguration, "asce")).toThrow(/Missing fresh-start configuration/);
    const missingField = structuredClone(freshStartSource());
    missingField.pages.coverage.layout.sections["self-work"].fields!.push("not-a-mapped-field");
    expect(() => compileRequirementCatalog(catalog.data, missingField, "asce")).toThrow(/Unmapped fresh-start field/);
  });

  it("keeps site product presentation scoped when another site adopts the same model", () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = structuredClone(source.fields.sites.asce);
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = { ...structuredClone(source.siteProducts.asce), products: { "li-term": { brochureUrl: "https://example.com/term.pdf" } } };
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    const data = structuredClone(catalog.data);
    data.sites.push({ ...data.sites.find(site => site.key === "asce")!, key: "example", id: "example" });
    const compiled = compileRequirementCatalog(data, source);
    const key = compiled.configurationDefinitions.find(row => row.definition.target?.kind === "product-presentation" && row.definition.target.productKey === "li-term" && row.definition.target.property === "brochureUrl")!.key;
    expect(compiled.configurationValues.find(row => row.siteKey === "asce" && row.configurationKey === key)?.value).toBe(source.siteProducts.asce.products["li-term"].brochureUrl);
    expect(compiled.configurationValues.find(row => row.siteKey === "example" && row.configurationKey === key)?.value).toBe("https://example.com/term.pdf");
    expect(compiled.products.find(row => row.key === "li-term")?.definition.brochureUrl).toBeUndefined();
  });
});

it('accounts for every authored content item as displayed wording or explicitly excluded Library metadata', () => {
  const source = freshStartSource();
  const owner = (key: string): string => {
    const refs = source.contentReferences ?? {};
    return refs[key] ? owner(refs[key]) : key;
  };
  const declared = new Set(Object.values(source.pages).flatMap(page => [...Object.values(page.content ?? {}).flat(), ...Object.keys(page.contentSlots ?? {})]).map(owner));
  const ids = new Set<string>();
  for (const placement of source.contentInventory.placements) {
    expect(ids.has(placement.id), placement.id).toBe(false); ids.add(placement.id);
    expect(placement.location.trim()).not.toBe('');
    expect(placement.when.trim()).not.toBe('');
    expect([placement.component, placement.renderer].filter(Boolean), placement.id).toHaveLength(1);
    if (placement.component) expect(source.components.some(component => component.name === placement.component), placement.component).toBe(true);
    else {
      expect(placement.renderer, placement.id).toMatch(/^src\/.+\.(ts|tsx)$/);
      expect(() => readFileSync(placement.renderer!, 'utf8'), placement.renderer).not.toThrow();
    }
    for (const page of placement.pages ?? []) expect(source.pages[page], page).toBeDefined();
    for (const key of placement.keys) { expect(Object.hasOwn(source.content, owner(key)), key).toBe(true); declared.add(owner(key)); }
  }
  for (const group of source.contentInventory.exclusions) {
    expect(group.reason.trim()).not.toBe('');
    for (const key of group.keys) { expect(Object.hasOwn(source.content, owner(key)), key).toBe(true); declared.add(owner(key)); }
  }
  expect(Object.keys(source.content).filter(key => !declared.has(owner(key)))).toEqual([]);
  for (const key of Object.keys(source.content)) expect(source.contentSources[key], key).toMatch(/^requirements\/global\/content\/[^/]+\.json$/);
});

it('retires unused diagnostic wording and obsolete status copy even when loading an older saved catalog', () => {
  const source = freshStartSource();
  const input = structuredClone(catalog.data);
  const retired = ['application.ui.challenge-failed', 'application.ui.resume-request-failed', 'application.ui.resend-failed', 'application.ui.recovery-failed', 'statusMessages.healthCir.body'];
  for (const key of retired) {
    input.contentEntries.push({ ...input.contentEntries[0], id: key, key, definition: { path: key.split('.') } });
    input.contentValues.push({ ...input.contentValues[0], id: `audit.${key}`, key: `audit.${key}`, contentKey: key, value: 'Obsolete diagnostic' });
    expect(source.content[key]).toBeUndefined();
    expect(source.contentBindings[key]).toBeUndefined();
  }
  const compiled = compileRequirementCatalog(input, source);
  for (const key of retired) {
    expect(compiled.contentEntries.some(entry => entry.key === key), key).toBe(false);
    expect(compiled.contentValues.some(value => value.contentKey === key), key).toBe(false);
  }
});

it('reconstructs every flow from global JSON and retires superseded Site graphs across consumers', () => {
  const source = freshStartSource(), input = structuredClone(catalog.data);
  const oldKey = 'client:asce.tpaVerification';
  input.flows.push({ ...input.flows[0], id: oldKey, key: oldKey, definition: { id: 'tpaVerification', title: 'Stale Site graph', intro: 'Superseded' } });
  input.flowSteps = [{ ...input.flowSteps[0], id: 'stale', key: 'stale', flowKey: oldKey }];
  input.flowTransitions = [];
  input.siteFlows.push({ ...input.siteFlows[0], id: 'stale-site-flow', key: 'stale-site-flow', flowKey: oldKey, scope: 'site', siteKey: 'asce', flowId: 'tpaVerification' });
  const data = compileRequirementCatalog(input, source);
  expect(data.flows.some(flow => flow.key === oldKey)).toBe(false);
  expect(data.siteFlows.some(flow => flow.flowKey === oldKey)).toBe(false);
  const prototype = resolvePrototypeLibrary(input, 'asce', 'canonical-flows', source);
  const story = buildGlobalTemplate({ ...catalog, data: input });
  for (const flow of source.application.records.flows) {
    const key = flow.key as string, id = (flow.definition as { id: string }).id;
    const nodes = source.application.records.flowSteps.filter(row => row.flowKey === key).sort((a, b) => Number(a.position) - Number(b.position));
    const edges = source.application.records.flowTransitions.filter(row => row.flowKey === key).sort((a, b) => Number(a.position) - Number(b.position));
    expect(data.flowSteps.filter(row => row.flowKey === key).sort((a, b) => a.position - b.position).map(row => row.definition)).toEqual(nodes.map(row => row.definition));
    for (const model of [prototype, story]) {
      const effective = model.site.configuration.flows.find(flow => flow.key === id)!;
      expect(effective.steps.map(row => row.value.definition)).toEqual(nodes.map(row => row.definition));
      expect(effective.transitions.map(row => row.value.definition)).toEqual(edges.map(row => row.definition));
    }
  }
});

it('owns progress placements and Library labels in one global JSON definition', () => {
  const source = freshStartSource();
  const ids = navigationPresentation.progressSteps.map(step => step.id);
  expect(new Set(ids).size).toBe(ids.length);
  const placed = navigationPresentation.progressSteps.flatMap(step => step.pages);
  expect(new Set(placed).size).toBe(placed.length);
  for (const step of navigationPresentation.progressSteps) {
    expect(step.libraryLabel.trim()).not.toBe('');
    expect(source.content[`navigation.progress-step-labels.${step.id}`]).toEqual(expect.any(String));
    for (const page of step.pages) expect(source.pages[page], page).toBeDefined();
  }
  expect(placed.filter(page => page.startsWith('health-')).sort()).toEqual(Object.values(source.pages).filter(page => page.definition.groupId === 'health').map(page => page.page).sort());
});
