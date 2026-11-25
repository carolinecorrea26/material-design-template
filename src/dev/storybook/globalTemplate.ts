import presentation from '../../../requirements/global/prototype-fixtures/storybook-presentation.json';
import type { HomeContent } from '../../content/types';
import type { PaymentPolicy } from '../../domain/paymentPolicy';
import type { PageNote } from '../../domain/pageNotes.mjs';
import questionnaireExamples from '../../../requirements/global/prototype-fixtures/health-questionnaires.json';
import type { HealthQuestionnairePolicy } from '../../domain/configuredHealthQuestionnaire';
import type { ReviewPolicy, ReviewBlock } from '../../domain/reviewPolicy';
import { resolveCompiledPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from '../../domain/prototypeLibrary';
import { prototypeCatalogData, type SharedCatalog } from '../../persistence/sharedCatalog';
import { withFreshStartCatalog, freshStartSource } from '../../domain/freshStartCatalog';
import type { FieldOption } from '../../domain/fields';

export type HomeExampleConfiguration = { clientSection?: HomeContent['clientSection']; landingNotice?: HomeContent['landingNotice']; showLandingNotice?: boolean };
export type MembershipExampleConfiguration = { configuration: 'yes-no' | 'new-or-current' | 'category' | 'association'; options?: FieldOption[]; includeTitle?: boolean; memberId?: boolean };
export type EligibilityExampleConfiguration = { coveredPeople?: Array<'self' | 'spouse' | 'child'>; eligibleStates?: string[]; childMode?: 'details' | 'notice-only'; childMaximum?: number; includeStudent?: boolean; includeArmedForces?: boolean; tpaMode?: 'none' | 'member-lookup' | 'membership-auto-approval' };

export type BeneficiaryExampleConfiguration = { requirement?: 'required' | 'optional' | 'none' };
export type CoverageExampleConfiguration = { referenceRates?: boolean; costBreakdown?: boolean; increaseNote?: 'applyForAdditional' | 'applyForTotal' };
export type ReviewExampleConfiguration = { blocks?: ReviewBlock[]; applicantType?: boolean; withoutHealthQuestions?: boolean };
export type HealthExampleConfiguration = { page: 'health-si' | 'health-tele' | 'health-di-supp' | 'health-cir'; product: 'li-term' | 'di-ltd'; questionnaire?: keyof typeof questionnaireExamples };
export type PaymentExampleConfiguration = { requirement?: 'required' | 'optional' | 'none'; sharedMethod?: boolean; sharedFrequency?: boolean; notes?: PageNote[]; products?: Record<string, PaymentPolicy> };
export type ProfileExampleConfiguration = { physicianInformation?: boolean; otherCoverageInformation?: boolean; financialQuestionnaire?: { minimumAmount: number; inclusive: boolean; productKeys: string[] } };
export type ContactExampleConfiguration = { hideBusinessAddress?: boolean; hideCorrespondence?: boolean; businessAddressProducts?: string[] };

export const globalTemplateKey = 'storybook-template';
const hasField = (library: PrototypeLibrary, key: string) => library.site.configuration.pages.some(page => page.fields.some(field => field.included && field.key === key));
/** Capabilities select saved definitions, never a customer/site identity. Source
 * provenance is retained by the separate audit, not used as a Storybook setting. */
export const templateCapabilities = {
  standard: (library: PrototypeLibrary) => library.site.configuration.pages.find(page => page.key === 'membership')?.fields.filter(field => field.included).length === 5 && !library.associationContext.selection && library.products.some(product => product.categoryId === 'SH'),
  optionalBeneficiaries: (library: PrototypeLibrary) => hasField(library, 'abe-member-id'),
  multipleTerms: (library: PrototypeLibrary) => hasField(library, 'member-id'),
  physicianMembership: (library: PrototypeLibrary) => hasField(library, 'ama-physician-type'),
  professionalEducation: (library: PrototypeLibrary) => hasField(library, 'avma-vet-college'),
  occupationAndChildNotice: (library: PrototypeLibrary) => hasField(library, 'csea-occupation-group'),
  nursingMembership: (library: PrototypeLibrary) => hasField(library, 'nurse-type'),
  associationSelection: (library: PrototypeLibrary) => library.associationContext.selection?.mode === 'select',
  employmentMembership: (library: PrototypeLibrary) => hasField(library, 'waepa-declaration'),
  membershipStatus: (library: PrototypeLibrary) => hasField(library, 'membership-status'),
} satisfies Record<string, (library: PrototypeLibrary) => boolean>;
export type TemplateCapability = keyof typeof templateCapabilities;
const cache = new WeakMap<SharedCatalog, PrototypeLibrary[]>();
export function templateSourceLibraries(catalog: SharedCatalog) {
  let libraries = cache.get(catalog);
  if (!libraries) {
    const data = withFreshStartCatalog(prototypeCatalogData(catalog), undefined, catalog.siteScope);
    libraries = data.sites.map(site => resolveCompiledPrototypeLibrary(data, site.key, 'storybook:global-template'));
    cache.set(catalog, libraries);
  }
  return libraries;
}

/** Presentation-only substitutions on a detached fixture. Stable field/product
 * keys, conditions, requirements and source catalog records are preserved. */
function genericPresentation<T>(value: T, names: string[]): T {
  if (typeof value === 'string') {
    let result = value.replace(/\b(?:ABE|AMA|ASCE|AVMA|CSEA|NSO|WAEPA|ABA|ISI Trust|ISITrust)\b/g, presentation.clientIdentity.name);
    for (const name of names) if (name.length > 4) result = result.split(name).join(presentation.clientIdentity.name);
    result = result.replace(/\/client\/[^/]+\/logo\.[a-z]+/g, presentation.branding.logo).replace(/\/client\/[^/]+\/hero\.[a-z]+/g, presentation.assets.hero).replace(/\/client\/[^/]+\/[^/]+\.pdf/g, presentation.assets.referenceRatesPdf).replace(/\/client\/[^/]+\/[^/]+\.png/g, presentation.assets.referenceRatesImage);
    return result.replace(/\ba Example Association/g, `an ${presentation.clientIdentity.name}`) as T;
  }
  if (Array.isArray(value)) return value.map(item => genericPresentation(item, names)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, (['id', 'key', 'fieldId', 'fieldKey', 'productKey', 'conditionId', 'visibilityConditionId'].includes(key) || key === 'value' && (typeof item !== 'object' || Array.isArray(item))) ? structuredClone(item) : genericPresentation(item, names)])) as T;
  return value;
}
export function buildGlobalTemplate(catalog: SharedCatalog, capability: TemplateCapability = 'standard', membership?: MembershipExampleConfiguration, eligibility?: EligibilityExampleConfiguration, coverage?: CoverageExampleConfiguration, beneficiary?: BeneficiaryExampleConfiguration, contact?: ContactExampleConfiguration, profile?: ProfileExampleConfiguration, review?: ReviewExampleConfiguration, health?: HealthExampleConfiguration, payment?: PaymentExampleConfiguration, home?: HomeExampleConfiguration): PrototypeLibrary {
  const sources = templateSourceLibraries(catalog);
  // Optional examples inherit the common multi-product template when their
  // additional fields are unassigned. Enrollment must not change that base.
  let source = sources.find(templateCapabilities[capability]) ?? sources.find(templateCapabilities.multipleTerms);
  if (!source) throw new Error(`Missing global template capability: ${capability}`);
  if (membership || eligibility || coverage || beneficiary || contact || profile || review || health || payment || home) {
    // Compile an isolated effective assignment through the real source pipeline;
    // examples never patch generated fields or change an enrolled Site.
    const requirements = structuredClone(freshStartSource());
    const key = source.site.siteKey;
    const siteFields = requirements.fields.sites[key] as { fields: Record<string, unknown> };
    if (home) {
      const page = (requirements.fields.sitePages![key].home ??= { page: 'home' }) as { content?: Record<string, unknown>; configurations?: Record<string, unknown> };
      page.content = { ...page.content, ...(home.clientSection ? { 'home.client-section': home.clientSection } : {}), ...(home.landingNotice ? { 'home.landing-notice': home.landingNotice } : {}) };
      if (home.showLandingNotice !== undefined) page.configurations = { ...page.configurations, 'home-landing-notice': home.showLandingNotice };
    }

    if (payment) {
      const page = requirements.fields.sitePages![key].payment as { requirement?: string; configurations?: Record<string, unknown>; content?: Record<string, unknown> };
      if (payment.requirement) page.requirement = payment.requirement;
      page.configurations = { ...page.configurations,
        ...(payment.sharedMethod !== undefined ? { 'payment-share-method': payment.sharedMethod } : {}),
        ...(payment.sharedFrequency !== undefined ? { 'payment-share-frequency': payment.sharedFrequency } : {}),
      };
      if (payment.notes) page.content = { ...page.content, 'payment.notes': payment.notes };
      for (const row of requirements.siteProducts[key].catalog!.configurationValues) {
        const policy = row.value as { payment?: PaymentPolicy; productKey?: string };
        const productKey = String(row.configurationKey).split('.').at(-2)!;
        if (policy.payment && payment.products?.[productKey]) policy.payment = structuredClone(payment.products[productKey]);
      }
    }
    if (membership) {
      siteFields.fields.membership = { configuration: membership.configuration, ...(membership.options ? { options: membership.options } : {}) };
      requirements.fields.sitePages![key].membership = { page: 'membership', include: membership.memberId ? ['member-id'] : [], hide: membership.includeTitle ? [] : ['title'] };
      if (!membership.memberId) {
        const tpa = requirements.siteEligibility[key].tpa;
        if (Array.isArray(tpa.lookupFields)) tpa.lookupFields = tpa.lookupFields.filter(id => id !== 'member-id');
      }
    }
    if (eligibility) {
      const page = requirements.fields.sitePages![key].eligibility as { configurations?: Record<string, unknown>; include?: string[] };
      page.configurations = { ...page.configurations,
        ...(eligibility.coveredPeople ? { 'site-people': eligibility.coveredPeople } : {}),
        ...(eligibility.childMode ? { 'child-collection-mode': eligibility.childMode } : {}),
        ...(eligibility.childMaximum !== undefined ? { 'child-list-maximum': eligibility.childMaximum } : {}),
      };
      const included = new Set(page.include ?? []);
      for (const [field, enabled] of [['full-time-student', eligibility.includeStudent], ['active-military', eligibility.includeArmedForces]] as const)
        if (enabled !== undefined) { if (enabled) included.add(field); else included.delete(field); }
      page.include = [...included];
      const settings = requirements.siteEligibility[key];
      if (eligibility.eligibleStates) { settings.configurations['eligible-states'] = eligibility.eligibleStates; settings.configurations['eligible-states-only'] = true; }
      if (eligibility.tpaMode) settings.configurations['tpa-integration'] = eligibility.tpaMode;
    }
    if (coverage?.costBreakdown !== undefined) {
      const page = requirements.fields.sitePages![key].coverage as { configurations?: Record<string, unknown> };
      page.configurations = { ...page.configurations, 'coverage-cost-breakdown': coverage.costBreakdown };
    }
    if (coverage?.increaseNote !== undefined) {
      const page = requirements.fields.sitePages![key].coverage as { configurations?: Record<string, unknown> };
      page.configurations = { ...page.configurations, 'coverage-increase-note': coverage.increaseNote };
    }
    if (coverage?.referenceRates) {
      const assignment = requirements.siteProducts[key].catalog!.configurationValues.find(row => row.configurationKey === 'rates.reviewed-presentation')!;
      assignment.value = { version: 1, praseConfigured: false, quoteToolEnabled: false, coverageQuoteEnabled: false };
      const configurationKey = 'storybook.di-reference-rates';
      requirements.products.catalog.configurationDefinitions.push({ id: configurationKey, key: configurationKey, position: 0, definition: { target: { kind: 'product-reference-rate-table', productKey: 'di-ltd' } } });
      requirements.siteProducts[key].catalog!.configurationValues.push({ id: configurationKey, key: configurationKey, configurationKey, scope: 'site', siteKey: '{{site}}', hostingAssociationKey: null, position: 0,
        value: { version: 1, kind: 'html-table', title: 'Sample disability reference rates', notes: ['Reference rates. Your actual premium depends on the issued coverage. Fictional prototype values.'], columns: ['Monthly benefit', 'Sample monthly cost'], rows: [['$1,000', '$12.00'], ['$2,000', '$24.00']] } });
    }
    if (beneficiary?.requirement) {
      const page = requirements.fields.sitePages![key].beneficiary as { requirement: string };
      page.requirement = beneficiary.requirement;
    }
    if (contact) {
      const page = requirements.fields.sitePages![key].contact as { configurations?: Record<string, unknown> };
      page.configurations = { ...page.configurations,
        ...(contact.hideBusinessAddress !== undefined ? { 'contact-hide-business-address': contact.hideBusinessAddress } : {}),
        ...(contact.hideCorrespondence !== undefined ? { 'contact-hide-correspondence': contact.hideCorrespondence } : {}),
        ...(contact.businessAddressProducts !== undefined ? { 'contact-business-address-products': contact.businessAddressProducts } : {}),
      };
    }
    if (profile?.physicianInformation !== undefined || profile?.otherCoverageInformation !== undefined) {
      const page = requirements.fields.sitePages![key].profile as { configurations?: Record<string, unknown> };
      page.configurations = { ...page.configurations,
        ...(profile.physicianInformation !== undefined ? { 'physician-information': profile.physicianInformation } : {}),
        ...(profile.otherCoverageInformation !== undefined ? { 'other-coverage-information': profile.otherCoverageInformation } : {}),
      };
    }
    if (profile?.financialQuestionnaire) {
      const assignment = requirements.siteProducts[key].catalog!;
      assignment.siteFeatures.find(row => row.featureKey === 'feature-financial-questionnaire')!.enabled = true;
      const definitions = requirements.products.catalog.configurationDefinitions.filter(row => (row.definition as { target?: { kind: string } }).target?.kind === 'site-financial-questionnaire');
      if (definitions.length !== 1) throw new Error('Missing unique global Profile questionnaire definition');
      const keyName = definitions[0].key;
      const keys = new Set([keyName]);
      const existing = assignment.configurationValues.filter(row => keys.has(row.configurationKey));
      if (existing.length > 1) throw new Error('Ambiguous synthetic Profile questionnaire policy');
      const value = { version: 1, enabled: true, applicant: 'member', rules: [profile.financialQuestionnaire], sourceReferences: ['Synthetic Storybook Profile policy'] };
      if (existing.length) existing[0].value = value;
      else {
        assignment.configurationValues.push({ id: keyName, key: keyName, configurationKey: keyName, scope: 'site', siteKey: '{{site}}', hostingAssociationKey: null, position: 0, value });
      }
    }
    if (review) {
      const assignment = requirements.siteApplication[key].records.configurationValues.find(row => row.configurationKey === 'shared.review-policy')!;
      const inherited = assignment.value as Record<string, unknown>;
      const policy = structuredClone(inherited.$default === true ? requirements.application.records.configurationValues.find(row => row.configurationKey === 'shared.review-policy' && row.scope === 'global')!.value : assignment.value) as ReviewPolicy;
      if (review.blocks) policy.blocks.push(...structuredClone(review.blocks));
      if (review.applicantType) {
        policy.consent!.underwrittenWhen = [{ productKey: 'di-ltd', applicants: ['member', 'spouse'] }];
        delete policy.consent!.underwrittenWhenHealthQuestions;
        delete policy.consent!.underwrittenWhenUnderwritingFlag;
        delete policy.consent!.underwrittenWhenUnderwritingTypes;
        policy.consent!.otherOpening = { fieldId: 'membership', answer: 'yes', acceptedAnswers: ['yes', 'no'], prefix: 'as a member, ' };
      }
      assignment.value = policy;
      if (review.withoutHealthQuestions) {
        // Model absent health participation through the product policies, never page switches.
        const journeyKeys = new Set(requirements.products.catalog.configurationDefinitions.filter(row => (row.definition as { target?: { kind: string } }).target?.kind === 'product-journey-policy').map(row => row.key));
        for (const row of requirements.siteProducts[key].catalog!.configurationValues.filter(row => journeyKeys.has(row.configurationKey))) {
          const policy = row.value as { healthPageByUnderwriting?: Record<string, string | null>; healthPageForPortfolio?: unknown; questions: Array<{ healthPage: string | null }> };
          policy.healthPageByUnderwriting = Object.fromEntries(['QD', 'FUW', 'SI', 'TELE', 'GI', 'NA', 'NCGI'].map(pathway => [pathway, null]));
          delete policy.healthPageForPortfolio;
          for (const question of policy.questions) question.healthPage = null;
        }
        const questionnaireKeys = new Set(requirements.application.records.configurationDefinitions.filter(row => (row.definition as { target?: { kind: string } }).target?.kind === 'site-health-questionnaires').map(row => row.key));
        requirements.siteApplication[key].records.configurationValues = requirements.siteApplication[key].records.configurationValues.filter(row => !questionnaireKeys.has(row.configurationKey));
      }
    }
    if (health) {
      // Configure supported source assignments before compilation, never resolved output.
      const definitions = requirements.products.catalog.configurationDefinitions;
      const journey = definitions.find(row => {
        const target = (row.definition as { target?: { kind: string; productKey?: string } }).target;
        return target?.kind === 'product-journey-policy' && target.productKey === health.product;
      });
      const assignment = requirements.siteProducts[key].catalog!.configurationValues.find(row => row.configurationKey === journey?.key);
      if (!assignment || !assignment.value || typeof assignment.value !== 'object') throw new Error('Missing synthetic Health journey assignment');
      const policy = assignment.value as { healthPageByUnderwriting?: Record<string, string | null> };
      if (health.page !== 'health-cir') policy.healthPageByUnderwriting = { ...policy.healthPageByUnderwriting, QD: health.page, FUW: health.page, SI: health.page };
      const authoring = requirements.siteApplication[key].records;
      const currentDefinitions = new Set(requirements.application.records.configurationDefinitions.filter(row => (row.definition as { target?: { kind: string } }).target?.kind === 'site-health-questionnaires').map(row => row.key));
      authoring.configurationValues = authoring.configurationValues.filter(row => !currentDefinitions.has(row.configurationKey));
      if (health.questionnaire) {
        const value = structuredClone(questionnaireExamples[health.questionnaire]) as HealthQuestionnairePolicy;
        if (value.pageId !== health.page) throw new Error('Mismatched synthetic Health questionnaire');
        const id = `storybook.${health.page}.questionnaire`;
        requirements.application.records.configurationDefinitions.push({ id, key: id, position: 0, definition: { target: { kind: 'site-health-questionnaires' } } });
        authoring.configurationValues.push({ id, key: id, configurationKey: id, scope: 'site', siteKey: '{{site}}', hostingAssociationKey: null, position: 0, value });
      }
    }
    const data = structuredClone(prototypeCatalogData(catalog));
    if (membership?.configuration === 'association') data.sitePolicies.find(policy => policy.siteKey === key)!.definition.associationSelection = { mode: 'select' };
    source = resolvePrototypeLibrary(data, key, 'storybook:synthetic-configuration', requirements);
  }
  const names = sources.flatMap(library => [library.clientIdentity.name, ...library.associationContext.allAssociations.map(association => association.name)]);
  const library = genericPresentation(structuredClone(source), names);
  library.site.siteKey = globalTemplateKey;
  library.site.hostingAssociationKey = 'demo';
  library.site.name.value = presentation.siteName;
  library.client.id = 'demo';
  library.clientIdentity.key = 'demo';
  library.clientIdentity.name = presentation.clientIdentity.name;
  library.clientIdentity.acronym = presentation.clientIdentity.acronym;
  library.client.branding = { ...library.client.branding, ...presentation.branding };
  library.client.support = { ...library.client.support, ...structuredClone(presentation.support) };
  library.associationContext.associations.forEach(association => { association.name = presentation.clientIdentity.name; association.hostingAssociationId = library.site.hostingAssociationKey; });
  library.associationContext.allAssociations.forEach((association, index) => { association.name = `${presentation.clientIdentity.name} ${index + 1}`; association.hostingAssociationId = library.site.hostingAssociationKey; });
  // Keep relational data in the same synthetic scope as the installed library.
  library.associationContext.links.forEach(link => { if (link.siteKey === source.site.siteKey) link.siteKey = globalTemplateKey; });
  library.pageData.sitePages = library.pageData.sitePages.filter(page => page.siteKey === source.site.siteKey).map(page => ({ ...page, siteKey: globalTemplateKey }));
  library.associationContext.tpa.name = presentation.administrator.name;
  library.associationContext.tpa.acronym = presentation.administrator.acronym;
  library.associationContext.tpa.branding = structuredClone(presentation.administrator);
  library.associationContext.tpa.support = structuredClone(library.client.support);
  library.associationContext.tpa.administrationContacts = [];
  library.sourceSiteKey = globalTemplateKey;
  return library;
}
