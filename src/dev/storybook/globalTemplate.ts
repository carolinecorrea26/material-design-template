import { resolvePrototypeLibrary, type PrototypeLibrary } from '../../domain/prototypeLibrary';
import { prototypeCatalogData, type SharedCatalog } from '../../persistence/sharedCatalog';

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
    const data = prototypeCatalogData(catalog);
    libraries = catalog.data.sites.map(site => resolvePrototypeLibrary(data, site.key, 'storybook:global-template'));
    cache.set(catalog, libraries);
  }
  return libraries;
}

/** Presentation-only substitutions on a detached fixture. Stable field/product
 * keys, conditions, requirements and source catalog records are preserved. */
function genericPresentation<T>(value: T, names: string[]): T {
  if (typeof value === 'string') {
    let result = value.replace(/\b(?:ABE|AMA|ASCE|AVMA|CSEA|NSO|WAEPA|ABA|ISI Trust|ISITrust)\b/g, 'Example Association');
    for (const name of names) if (name.length > 4) result = result.split(name).join('Example Association');
    result = result.replace(/\/client\/[^/]+\/logo\.[a-z]+/g, '/logo.svg').replace(/\/client\/[^/]+\/hero\.[a-z]+/g, '/hero.svg').replace(/\/client\/[^/]+\/[^/]+\.pdf/g, '/storybook/reference-rates.pdf').replace(/\/client\/[^/]+\/[^/]+\.png/g, '/storybook/reference-rates.svg');
    return result.replace(/\ba Example Association/g, 'an Example Association') as T;
  }
  if (Array.isArray(value)) return value.map(item => genericPresentation(item, names)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, (['id', 'key', 'fieldId', 'fieldKey', 'productKey', 'conditionId', 'visibilityConditionId'].includes(key) || key === 'value' && (typeof item !== 'object' || Array.isArray(item))) ? structuredClone(item) : genericPresentation(item, names)])) as T;
  return value;
}
export function buildGlobalTemplate(catalog: SharedCatalog, capability: TemplateCapability = 'standard'): PrototypeLibrary {
  const sources = templateSourceLibraries(catalog);
  // While the bundle carries a single site (ASCE-only switch), every capability renders from it.
  const source = sources.find(templateCapabilities[capability]) ?? (sources.length === 1 ? sources[0] : undefined);
  if (!source) throw new Error(`Missing global template capability: ${capability}`);
  const names = sources.flatMap(library => [library.clientIdentity.name, ...library.associationContext.allAssociations.map(association => association.name)]);
  const library = genericPresentation(structuredClone(source), names);
  library.site.siteKey = globalTemplateKey;
  library.site.clientKey = 'demo';
  library.site.name.value = 'Global application template';
  library.client.id = 'demo';
  library.clientIdentity.key = 'demo';
  library.clientIdentity.name = 'Example Association';
  library.clientIdentity.acronym = 'Example';
  library.client.branding = { ...library.client.branding, name: 'Example Association', acronym: 'Example', logo: '/logo.svg', logoAlt: 'Example association' };
  library.client.support = { ...library.client.support, website: 'example.org', phone: '8005550100', phoneDisplay: '(800) 555-0100', email: 'support@example.org', helpPhone: { phone: '8005550100', phoneDisplay: '(800) 555-0100' } };
  library.associationContext.associations.forEach(association => { association.name = 'Example Association'; });
  library.associationContext.allAssociations.forEach((association, index) => { association.name = `Example Association ${index + 1}`; });
  // Keep relational data in the same synthetic scope as the installed library.
  library.associationContext.links.forEach(link => { if (link.siteKey === source.site.siteKey) link.siteKey = globalTemplateKey; });
  library.pageData.sitePages = library.pageData.sitePages.filter(page => page.siteKey === source.site.siteKey).map(page => ({ ...page, siteKey: globalTemplateKey }));
  library.content.home.clientSection = { tagline: 'Coverage for association members', paragraphs: ['Learn about the benefits and coverage available through this example association.'] };
  if (library.client.applicantExperience?.landingNotice) library.client.applicantExperience.landingNotice = { title: 'Application information', text: 'Review this configured entry notice before starting your application.' };
  library.associationContext.tpa.name = 'Example administrator';
  library.associationContext.tpa.acronym = 'Example';
  library.associationContext.tpa.branding = { name: 'Example administrator', acronym: 'Example', logo: '/logo.svg', logoAlt: 'Example administrator' };
  library.associationContext.tpa.support = structuredClone(library.client.support);
  library.associationContext.tpa.administrationContacts = [];
  library.sourceSiteKey = globalTemplateKey;
  return library;
}
