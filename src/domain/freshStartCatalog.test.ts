import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
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
import { resolveStoredFieldSurfaces } from './fieldSurfaces';

const catalog = { ...validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8"))), revision: "fresh-start-test" };
const reviewedPages = Object.values(freshStartSource().pages).map(page => (page.consumerKey ?? page.page) as PageId);
const reviewed = new Set<string>(reviewedPages);

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

  it('keeps Contact definitions global while Site field and presentation overrides remain independent', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = { fields: { city: { label: 'Locality' }, 'phone-type': { options: ['mobile', 'home'] } } };
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    Object.assign(source.fields.sitePages!.example.contact as object, { hide: ['apt-suite'], configurations: { 'contact-hide-business-address': true, 'contact-hide-correspondence': true } });
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    source.content['contact.section.business'] = 'Shared employer heading';
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    expect(compiled.fields.find(field => field.key === 'city')?.definition.label).toBe('City');
    expect(compiled.fields.find(field => field.key === 'spouse-phone-type')?.definition.options).toHaveLength(3);
    for (const siteKey of ['asce', 'example']) {
      const site = compiledConfiguration(compiled, siteKey);
      const contact = site.configuration.pages.find(page => page.key === 'contact')!;
      expect(contact.fields.find(field => field.key === 'city')?.definition.label).toBe(siteKey === 'asce' ? 'City' : 'Locality');
      expect(contact.fields.find(field => field.key === 'apt-suite')?.included).toBe(siteKey === 'asce');
      expect(contact.fields.find(field => field.key === 'spouse-phone-type')?.definition.options).toHaveLength(siteKey === 'asce' ? 3 : 2);
      expect(contact.fields.find(field => field.key === 'spouse-phone')?.definition.autoComplete).toBe('off');
      expect(contact.fields.find(field => field.key === 'spouse-email')?.definition.autoComplete).toBe('off');
      expect(contact.fields.find(field => field.key === 'spouse-phone-type')?.definition.defaultValue).toBe('mobile');
      expect(contact.sections.find(section => section.definition.value.id === 'contactBusinessInfo')?.definition.value.description).toBe('Shared employer heading');
      const flagKey = compiled.configurationDefinitions.find(row => row.definition.path?.join('.') === 'applicantExperience.contact.hideBusinessAddress')!.key;
      const flags = site.configuration.configurations.filter(row => row.key === flagKey);
      expect(flags[0]?.value).toBe(siteKey === 'example');
    }
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
    const details = source.fields.fieldDetails as { fields: Array<{ id: string; label: unknown }>; bindings: Record<string, unknown> };
    details.fields.find(field => field.id === 'first-name')!.label = { default: 'First Name', beneficiary: 'Beneficiary given name' };
    expect(Object.keys(details.bindings).filter(id => id.startsWith('beneficiary'))).toEqual([]);
    const globalOnly = compileRequirementCatalog(data, source, 'unconfigured');
    expect(globalOnly.fields.find(field => field.key === 'beneficiary-firstName')?.definition.label).toBe('Beneficiary given name');
    expect(globalOnly.configurationValues.find(row => row.configurationKey === 'field-surfaces' && row.scope === 'global')?.value).toHaveProperty('beneficiaryIndividual');
    const compiled = compileRequirementCatalog(data, source, 'asce');
    const site = compiledConfiguration(compiled, 'asce');
    const surfaces = resolveStoredFieldSurfaces(compiled, site);
    expect(surfaces.beneficiaryIndividual.mapping.fields[0]).toMatchObject({ id: 'beneficiary-firstName', label: 'Beneficiary given name', autoComplete: 'off' });
    expect(surfaces.beneficiaryIndividual.mapping.fieldToKey['beneficiary-firstName']).toBe('firstName');
    expect(surfaces.beneficiaryTrust.mapping.fieldToKey['beneficiary-trustDate']).toBe('trustDate');
    expect(site.configuration.beneficiaryNotePolicies).toHaveLength(1);
    const policy = site.configuration.beneficiaryNotePolicies[0].value as { notes: Array<{ productKeys: string[]; text: string }> };
    expect(policy.notes.find(note => note.productKeys.includes('li-term'))?.text).toBe('A newly authored shared designation note');
    const invalid = structuredClone(source);
    invalid.pages.beneficiary.surfaces!.beneficiaryIndividual.aliases!['beneficiary-firstName'].field = 'email';
    expect(() => compileRequirementCatalog(data, invalid, 'asce')).toThrow('Unmapped fresh-start dialog field');
  });

  it('shares Beneficiary definitions while keeping Site field, participation and note selections independent', () => {
    const source = structuredClone(freshStartSource());
    source.fields.sites.example = { fields: { 'first-name': { label: { beneficiary: 'Recipient given name' } } } };
    source.fields.sitePages!.example = structuredClone(source.fields.sitePages!.asce);
    source.siteProducts.example = structuredClone(source.siteProducts.asce);
    source.siteCoveragePolicies.example = { ...(structuredClone(source.siteCoveragePolicies.asce) as object), site: 'example' };
    source.siteCoverage.example = { ...(structuredClone(source.siteCoverage.asce) as object), site: 'example' };
    const page = source.fields.sitePages!.example.beneficiary as { requirement: string; productNotes: Record<string, { content: string }> };
    page.requirement = 'optional';
    page.productNotes['li-term'].content = 'beneficiary.note.new-insurance';
    const data = withoutReviewedRecords();
    data.sites.push({ ...data.sites.find(site => site.key === 'asce')!, key: 'example', id: 'example' });
    const compiled = compileRequirementCatalog(data, source);
    for (const siteKey of ['asce', 'example']) {
      const site = compiledConfiguration(compiled, siteKey);
      const surface = resolveStoredFieldSurfaces(compiled, site).beneficiaryIndividual;
      expect(surface.mapping.fields[0].label).toBe(siteKey === 'asce' ? 'First Name' : 'Recipient given name');
      expect(surface.mapping.fieldToKey['beneficiary-firstName']).toBe('firstName');
      expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.requirement).toBe(siteKey === 'asce' ? 'required' : 'optional');
      expect(site.configuration.pages.find(page => page.key === 'beneficiary')?.fields).toEqual([]);
      expect(site.configuration.issues.some(issue => issue.domain === 'fields' && issue.key.startsWith(`requirements.${siteKey}.beneficiary.`))).toBe(false);
      const policy = site.configuration.beneficiaryNotePolicies[0].value as { notes: Array<{ productKeys: string[]; text: string }> };
      expect(policy.notes.find(note => note.productKeys.includes('li-term'))?.text).toBe(source.content[siteKey === 'asce' ? 'beneficiary.note.replaces-prior' : 'beneficiary.note.new-insurance']);
    }
    expect(compiled.fields.filter(field => field.key === 'beneficiary-firstName')).toHaveLength(1);
    expect(compiled.fields.find(field => field.key === 'beneficiary-firstName')?.definition.label).toBe('First Name');
  });

  it("documents global amount controls in every Library scope while Site values remain effective assignments", () => {
    // An unconfigured Site proves visibility is independent of ASCE rollout
    // assignments. It shares the template without introducing another rollout.
    const unconfigured = { ...catalog, data: { ...catalog.data, sites: [...catalog.data.sites, { ...catalog.data.sites[0], id: "template-test", key: "template-test", name: "Template test" }] } };
    for (const scope of ["all", "asce", "template-test"]) {
      const settings = configurationRows(unconfigured, scope);
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
    for (const name of ['beneficiaryIndividual', 'beneficiaryTrust', 'beneficiaryControls']) {
      for (const field of library.fieldSurfaces[name].mapping.fields) expect(beneficiaryRows.find(row => row.key === field.id)?.definition).toEqual(field);
    }
    for (const page of reviewedPages) expect(library.site.configuration.pages.find(row => row.key === page)).toEqual(expected.site.configuration.pages.find(row => row.key === page));
    expect(Object.values(source.pages)).toHaveLength(30);
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

  it('owns Home, recovery and confirmation content despite stale saved records', () => {
    const changed = structuredClone(catalog);
    for (const row of changed.data.contentValues) if (row.contentKey.startsWith('home.') || row.contentKey.startsWith('pages.advisor-send-confirmation.') || row.contentKey.startsWith('pages.technical-error.')) row.value = 'Stale copy';
    changed.data.contentEntries.push({ ...changed.data.contentEntries[0], id: 'home.clientSection', key: 'home.clientSection', definition: { path: ['home', 'clientSection'] } });
    changed.data.contentValues.push({ ...changed.data.contentValues[0], id: 'stale-home-section', key: 'stale-home-section', contentKey: 'home.clientSection', scope: 'site', siteKey: 'asce', clientKey: null, value: { tagline: 'Stale section', paragraphs: [] } });
    const current = resolvePrototypeLibrary(changed.data, 'asce', changed.revision);
    const source = freshStartSource();
    expect(current.content.home.hero.title).toBe(source.content['home.hero.title']);
    expect(current.content.home.clientSection).toBeUndefined();
    expect(current.content.pages['advisor-send-confirmation']?.title).toBe(source.content['confirmation.advisor.title']);
    expect(current.content.pages['technical-error']?.title).toBe(source.content['recovery.technical-error.title']);
    const story = buildGlobalTemplate(changed, 'multipleTerms');
    expect(story.content.home.hero.title).toBe(current.content.home.hero.title);
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
    expect(categoryQuestion.options?.map(option => option.value)).toEqual(["LI", "AD", "DI"]);
    const site = resolveEffectiveSite(changed.data, "asce");
    expect(validateNormalizedCoverageAmount(site, "li-term", "member", 10000).allowed).toBe(false);
    expect(validateNormalizedCoverageAmount(site, "li-term", "member", 20000).allowed).toBe(true);
    expect(resolveEffectiveAmount(site.configuration, "li-term", { applicantKey: "member", amount: 10000 }).allowed).toBe(false);
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
