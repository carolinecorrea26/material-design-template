import { compileCoveragePolicies } from "./requirementCoveragePolicies.mjs";
import { resolveMappedFields } from './requirementFieldDefinitions.mjs';
import { libraryMetadata } from './provenance.ts';
import { parseCoverageAssignments } from './requirementCoverageValidation.mjs';
import { compileProductCatalog } from './requirementProductCatalog.mjs';
import { compileApplicationCatalog } from './requirementApplicationCatalog.mjs';
import { compileBoundPage } from './requirementBoundPages.mjs';

const answerKey = (field, person) => person === 'self' ? field : `${person}-${field}`;
const scoped = (siteKey, extra) => ({ scope: 'site', siteKey, clientKey: null, ...extra });
const row = (table, key, sourceReference, extra) => ({ id: key, key, ...libraryMetadata(table, key, sourceReference), ...extra });

/** Compile reviewed requirements into the shared consumer contract. Legacy page
 * records are discarded, never used as defaults or to supply missing placement.
 * The generated records are projections, not another authoring source. */
export function compileRequirementCatalog(data, source, selectedSite) {
  const sites = data.sites.filter(site => (!selectedSite || site.key === selectedSite) && source.fields.sites[site.key]);
  data = compileProductCatalog(data, source, sites);
  data = compileApplicationCatalog(data, source, sites);
  const pages = Object.values(source.pages).filter(page => page.definition && page.layout);
  const output = { ...data };
  for (const table of ['underwritingBands', 'coverageAmountPatterns', 'amountBands', 'amountOptions', 'productAmountRules', 'products', 'pages', 'sitePages', 'fields', 'pageFields', 'pageSectionFields', 'siteFieldConfigurations', 'conditions', 'contentEntries', 'contentValues', 'configurationDefinitions', 'configurationValues', 'validationRules', 'eligibilityConstraints']) output[table] = [...data[table]];
  const text = key => {
    const value = source.content[key];
    if (value === undefined) throw new Error(`Missing fresh-start content: ${key}`);
    return structuredClone(value);
  };
  const clientKey = site => data.clients.find(client => client.id === site.clientId)?.key;
  const setConfiguration = (site, path, value, reference) => {
    const matches = output.configurationDefinitions.filter(row => row.definition.path?.join('.') === path);
    if (matches.length > 1) throw new Error(`Ambiguous fresh-start configuration path: ${path}`);
    const key = matches[0]?.key ?? `requirements.${path}`;
    if (!matches.length) output.configurationDefinitions.push(row('configurationDefinitions', key, reference, { position: output.configurationDefinitions.length, definition: { path: path.split('.') } }));
    output.configurationValues = output.configurationValues.filter(value => value.configurationKey !== key || !(value.siteKey === site.key || value.scope === 'client' && value.clientKey === clientKey(site)));
    const valueKey = `requirements.${site.key}.${path}`;
    output.configurationValues.push(row('configurationValues', valueKey, reference, scoped(site.key, { configurationKey: key, value: structuredClone(value), position: 0 })));
  };
  const configurationValue = path => {
    const keys = new Set(output.configurationDefinitions.filter(row => row.definition.path?.join('.') === path).map(row => row.key));
    return output.configurationValues.find(row => keys.has(row.configurationKey) && row.scope === 'global')?.value ?? {};
  };
  const setContent = (site, key, value, reference) => {
    output.contentEntries = output.contentEntries.filter(entry => entry.key !== key);
    output.contentEntries.push(row('contentEntries', key, reference, { position: output.contentEntries.length, definition: { path: key.split('.') } }));
    output.contentValues = output.contentValues.filter(entry => entry.contentKey !== key || !(entry.scope === 'global' || entry.siteKey === site.key || entry.scope === 'client' && entry.clientKey === clientKey(site)));
    const identity = `requirements.${site.key}.${key}`;
    output.contentValues.push(row('contentValues', identity, reference, scoped(site.key, { contentKey: key, value, position: output.contentValues.length })));
  };

  // Page-owned dialog surfaces use the same consumer contract as shared tools.
  // Materialize global placement before any Site configuration is composed, so
  // later pages cannot overwrite a previously compiled dialog with old defaults.
  const authoredSurfaces = pages.flatMap(page => Object.entries(page.surfaces ?? {}).filter(([, surface]) => surface.definition).map(([name, surface]) => ({ page, name, surface })));
  if (authoredSurfaces.length) {
    const definition = output.configurationDefinitions.find(row => row.definition.path?.join('.') === 'fieldSurfaces');
    const defaults = output.configurationValues.filter(row => row.configurationKey === definition?.key && row.scope === 'global');
    if (defaults.length !== 1) throw new Error('Missing or ambiguous fresh-start field surface defaults');
    const surfaces = structuredClone(defaults[0].value);
    const declared = new Set();
    for (const { page, name, surface } of authoredSurfaces) {
      if (declared.has(name)) throw new Error(`Duplicate fresh-start surface: ${name}`);
      declared.add(name);
      const person = surface.for ?? 'self';
      const placed = new Set([...(page.controls ?? []), ...Object.values(page.layout.dialogs ?? {}).filter(group => (group.for ?? 'self') === person).flatMap(group => group.fields ?? [])]);
      const fields = resolveMappedFields(surface.mapping, { person, page: page.page, source: source.fields });
      for (const binding of surface.definition.fields) {
        const id = surface.aliases?.[binding.fieldKey]?.field ?? binding.fieldKey;
        const field = fields.find(field => field.id === id);
        if (!field || !placed.has(id)) throw new Error(`Unmapped fresh-start dialog field: ${page.page}/${name}/${id}`);
        output.fields = output.fields.filter(field => field.key !== binding.fieldKey);
        output.fields.push(row('fields', binding.fieldKey, `requirements/parked/${page.page}.json`, {
          definition: { ...field, id: binding.fieldKey, ...(surface.aliases?.[binding.fieldKey]?.label ? { label: text(surface.aliases[binding.fieldKey].label) } : {}) }, position: output.fields.length,
        }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== binding.fieldKey);
      }
      surfaces[name] = { ...structuredClone(surface.definition), pageKey: page.consumerKey ?? page.page,
        label: text(surface.definition.label),
        ...(surface.definition.libraryGroup ? { libraryGroup: { ...surface.definition.libraryGroup, label: text(surface.definition.libraryGroup.label) } } : {}) };
    }
    output.configurationValues = output.configurationValues.map(value => value === defaults[0] ? { ...value, value: surfaces } : value);
  }
  if (!sites.length) return output;

  for (const page of pages) {
    const requirementKey = page.page;
    const pageKey = page.consumerKey ?? requirementKey;
    const reference = `requirements/parked/${requirementKey}.json`;
    for (const transition of Object.values(page.transitions ?? {})) {
      const mapping = source.fields.mappings.find(mapping => page.fieldMapping?.component ? mapping.component === page.fieldMapping.component : mapping.page === page.fieldMapping?.page);
      const targets = new Set();
      if (!transition.id || !transition.trigger || !Array.isArray(transition.fieldMappings)) throw new Error(`Invalid fresh-start page transition: ${pageKey}`);
      for (const field of transition.fieldMappings) {
        if (!source.fields.fieldIds.fields.some(entry => entry.id === field.source) || !mapping?.fields.some(entry => entry.field === field.targetFieldId) || targets.has(field.targetFieldId) || !['always', 'if-empty'].includes(field.overwrite)) throw new Error(`Invalid fresh-start transition field: ${pageKey}/${field.targetFieldId}`);
        targets.add(field.targetFieldId);
      }
    }
    for (const root of page.contentRoots ?? []) {
      output.contentValues = output.contentValues.filter(value => !value.contentKey.startsWith(`${root}.`) || !(value.scope === 'global' || sites.some(site => value.siteKey === site.key || value.scope === 'client' && value.clientKey === clientKey(site))));
      output.contentEntries = output.contentEntries.filter(value => !value.key.startsWith(`${root}.`));
    }
    // A reviewed page owns its whole content object, including the absence of an
    // old note. Unknown properties from an earlier snapshot cannot leak back in.
    output.contentValues = output.contentValues.filter(value => !value.contentKey.startsWith(`pages.${pageKey}.`) || !(value.scope === 'global' || sites.some(site => value.siteKey === site.key || value.scope === 'client' && value.clientKey === clientKey(site))));
    output.contentEntries = output.contentEntries.filter(value => !value.key.startsWith(`pages.${pageKey}.`));
    const sectionKeys = new Set(output.pageSections.filter(section => section.pageKey === pageKey).map(section => section.key));
    output.pages = output.pages.filter(row => row.key !== pageKey);
    output.pages.push(row('pages', pageKey, reference, { definition: structuredClone(page.definition), position: page.position }));
    output.pageFields = output.pageFields.filter(row => row.pageKey !== pageKey);
    output.pageSections = output.pageSections.filter(row => row.pageKey !== pageKey);
    output.pageSectionFields = output.pageSectionFields.filter(row => !sectionKeys.has(row.sectionKey));
    output.conditions = output.conditions.filter(row => !row.key.startsWith(`condition-requirements-${pageKey}-`));

    if (page.fieldBindings) {
      compileBoundPage(output, source, page, sites, { row, text });
      continue;
    }

    // Global placement is compiled once; per-site definitions and inclusion follow
    // the page mapping and site file, never saved field overrides.
    const used = new Set();
    const groups = [];
    const sharedByPerson = Object.fromEntries(['self', 'spouse', 'child'].map(person => [person,
      new Map(page.fieldMapping ? resolveMappedFields(page.fieldMapping, { page: requirementKey, person, includeAll: true, source: source.fields }).map(field => [field.id, field]) : [])]));
    const allByPerson = Object.fromEntries(['self', 'spouse', 'child'].map(person => [person,
      page.fieldMapping ? [...new Map(sites.flatMap(site => resolveMappedFields(page.fieldMapping, { siteId: site.key, page: requirementKey, person, source: source.fields })).map(field => [field.id, field])).values()] : []]));
    for (const [name, group] of Object.entries(page.layout.sections)) {
      if (!group.id) continue;
      const person = group.for ?? 'self';
      if (!page.fieldMapping) throw new Error(`Missing fresh-start field mapping: ${requirementKey}`);
      const mapping = source.fields.mappings.find(mapping => page.fieldMapping.component ? mapping.component === page.fieldMapping.component : mapping.page === page.fieldMapping.page);
      for (const id of group.fields ?? []) if (!mapping.fields.some(field => field.field === id && field.people.includes(person))) throw new Error(`Unmapped fresh-start field: ${pageKey}/${name}/${id}`);
      const fields = group.remaining ? allByPerson[person].filter(field => !used.has(answerKey(field.id, person)) && !Object.values(page.companions ?? {}).flat().includes(field.id))
        : (group.fields ?? []).flatMap(id => allByPerson[person].filter(field => field.id === id));
      const ids = fields.map(field => answerKey(field.id, person));
      if (ids.some(id => used.has(id))) throw new Error(`Duplicate fresh-start field placement: ${pageKey}/${name}`);
      ids.forEach(id => used.add(id));
      const sectionKey = `${pageKey}.${group.id}`;
      const conditionKey = group.when ? `condition-requirements-${pageKey}-${name}` : undefined;
      if (group.when) {
        output.conditions = output.conditions.filter(row => row.key !== conditionKey);
        output.conditions.push(row('conditions', conditionKey, reference, { position: output.conditions.length, definition: { id: conditionKey, match: 'all', conditions: [{ fieldId: group.when.field, operator: Object.hasOwn(group.when, 'includes') ? 'includes' : 'equals', value: group.when.includes ?? group.when.equals }] } }));
      }
      const definition = { id: group.id, pageId: pageKey, applicant: person, fieldIds: ids,
        ...(group.title ? { description: text(group.title) } : {}),
        ...(group.collection ? { collectionName: group.collection } : {}),
        ...(conditionKey ? { visibilityConditionId: conditionKey } : {}),
        ...(group.presentation ? { presentation: group.presentation } : {}) };
      output.pageSections.push(row('pageSections', sectionKey, reference, { pageKey: pageKey, definition, position: groups.length }));
      groups.push({ name, group, fields, sectionKey });
      for (const [position, id] of ids.entries()) output.pageSectionFields.push(row('pageSectionFields', `${sectionKey}.${id}`, reference, { sectionKey, fieldKey: id, position }));
    }

    for (const site of sites) {
      const sitePage = source.fields.sitePages?.[site.key]?.[requirementKey] ?? {};
      const siteReference = `requirements/parked/sites/${site.key}/pages/${requirementKey}.json`;
      output.sitePages = output.sitePages.filter(row => row.siteKey !== site.key || row.pageKey !== pageKey);
      output.sitePages.push(row('sitePages', `${site.key}.${pageKey}`, reference, { siteKey: site.key, pageKey: pageKey, requirement: sitePage.requirement ?? source.pageDefaults.pages[requirementKey].requirement, position: sitePage.position ?? page.position }));
      output.siteFieldConfigurations = output.siteFieldConfigurations.filter(row => row.pageKey !== pageKey || !(row.scope === 'global' || row.siteKey === site.key || row.scope === 'client' && row.clientKey === clientKey(site)));
      const available = Object.fromEntries(['self', 'spouse', 'child'].map(person => [person, new Map(page.fieldMapping ? resolveMappedFields(page.fieldMapping, { page: requirementKey, person, siteId: site.key, source: source.fields }).map(field => [field.id, field]) : [])]));
      for (const { name, group, fields } of groups) for (const base of fields) {
        const person = group.for ?? 'self', id = answerKey(base.id, person);
        const definition = { ...(available[person].get(base.id) ?? base), id, ...(group.when ? { visibilityConditionId: `condition-requirements-${pageKey}-${name}` } : {}) };
        output.fields = output.fields.filter(field => field.key !== id);
        output.fields.push(row('fields', id, 'requirements/parked/field-details.json', { position: output.fields.length, definition: { ...(sharedByPerson[person].get(base.id) ?? base), id } }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
        if (!group.collection && !output.pageFields.some(field => field.pageKey === pageKey && field.fieldKey === id)) output.pageFields.push(row('pageFields', `${pageKey}.${id}`, reference, { pageKey: pageKey, fieldKey: id, position: output.pageFields.filter(field => field.pageKey === pageKey).length }));
        output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.${site.key}.${pageKey}.${id}`, siteReference, scoped(site.key, { pageKey: pageKey, fieldKey: id, include: available[person].has(base.id), hidden: !available[person].has(base.id), values: definition, position: output.siteFieldConfigurations.filter(field => field.pageKey === pageKey).length })));
      }
      for (const { name, group } of groups) {
        const person = group.for ?? 'self';
        for (const [owner, companions] of Object.entries(group.companions ?? {})) {
          if (!(group.fields ?? []).includes(owner)) throw new Error(`Unplaced companion owner: ${pageKey}/${name}/${owner}`);
          for (const fieldId of companions) {
            const id = answerKey(fieldId, person);
            const shared = sharedByPerson[person].get(fieldId);
            if (!shared) throw new Error(`Missing mapped page companion: ${pageKey}/${person}/${fieldId}`);
            const selected = available[person].get(fieldId);
            const condition = group.when ? { visibilityConditionId: `condition-requirements-${pageKey}-${name}` } : {};
            output.fields = output.fields.filter(field => field.key !== id);
            output.fields.push(row('fields', id, reference, { definition: { ...shared, id }, position: output.fields.length }));
            output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
            if (!output.pageFields.some(field => field.pageKey === pageKey && field.fieldKey === id)) output.pageFields.push(row('pageFields', `${pageKey}.${id}`, reference, { pageKey, fieldKey: id, position: output.pageFields.filter(field => field.pageKey === pageKey).length }));
            output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.${site.key}.${pageKey}.${id}`, siteReference,
              scoped(site.key, { pageKey, fieldKey: id, include: !!selected && available[person].has(owner), hidden: !selected || !available[person].has(owner), values: { ...(selected ?? shared), id, ...condition }, position: output.siteFieldConfigurations.filter(field => field.pageKey === pageKey && field.siteKey === site.key).length })));
          }
        }
      }
      for (const id of [...Object.values(page.companions ?? {}).flat(), ...(page.controls ?? [])]) {
        const definition = available.self.get(id);
        if (!definition) throw new Error(`Missing mapped page control ${id}`);
        output.fields = output.fields.filter(field => field.key !== id);
        output.fields.push(row('fields', id, 'requirements/parked/field-details.json', { definition, position: output.fields.length }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
      }
      for (const [name, surface] of Object.entries(page.surfaces ?? {})) {
        const person = surface.for ?? 'self';
        const fields = new Map(resolveMappedFields(surface.mapping, { ...(surface.definition ? {} : { siteId: site.key }), person, page: requirementKey, source: source.fields }).map(field => [field.id, field]));
        const effective = surface.definition ? new Map(resolveMappedFields(surface.mapping, { siteId: site.key, person, page: requirementKey, source: source.fields }).map(field => [field.id, field])) : undefined;
        const bindings = configurationValue('fieldSurfaces')[name]?.fields;
        if (!bindings) throw new Error(`Missing fresh-start field surface: ${name}`);
        for (const binding of bindings) {
          const alias = surface.aliases?.[binding.fieldKey];
          const field = fields.get(alias?.field ?? binding.fieldKey);
          if (!field) throw new Error(`Unmapped fresh-start surface field: ${name}/${binding.fieldKey}`);
          const definition = { ...field, id: binding.fieldKey, ...(alias?.label ? { label: text(alias.label) } : {}) };
          output.fields = output.fields.filter(field => field.key !== definition.id);
          output.fields.push(row('fields', definition.id, reference, { definition, position: output.fields.length }));
          output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== definition.id);
          if (effective) {
            const selected = effective.get(alias?.field ?? binding.fieldKey);
            output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.${site.key}.${pageKey}.${binding.fieldKey}`, siteReference,
              scoped(site.key, { pageKey, fieldKey: binding.fieldKey, include: null, hidden: !selected,
                values: selected ? { ...selected, id: binding.fieldKey, ...(alias?.label ? { label: text(alias.label) } : {}) } : {}, position: output.siteFieldConfigurations.filter(field => field.pageKey === pageKey && field.siteKey === site.key).length })));
          }
        }
      }
      for (const key of Object.keys(source.content).filter(key => key.startsWith(`${requirementKey}.`))) setContent(site, key, text(key), reference);
      for (const [key, targets] of Object.entries(source.contentBindings)) if (key.startsWith(`${requirementKey}.`)) for (const target of [targets].flat()) setContent(site, target, text(key), reference);
      for (const [section, noteKey] of Object.entries(sitePage.notes ?? {})) {
        const group = page.layout.sections[section] ?? page.layout.sections[`${section}-personal`];
        const id = group?.id ?? section;
        setContent(site, `pages.${pageKey}.sectionNotes.${id === 'spouseCoverageQuestions' ? 'spouseSection' : id}`, text(noteKey), siteReference);
      }
      for (const [section, settings] of Object.entries(page.sections ?? {})) if (settings.note) setContent(site, `pages.${pageKey}.sectionNotes.${page.layout.sections[section]?.id ?? section}`, text(sitePage.notes?.[section] ?? settings.note), reference);
      if (page.productNotes) {
        const configurationKey = page.productNotes.configuration;
        if (!output.configurationDefinitions.some(row => row.key === configurationKey && row.definition.target?.kind === 'site-beneficiary-notes')) throw new Error(`Invalid product note configuration: ${configurationKey}`);
        const notes = Object.entries(sitePage.productNotes ?? {}).map(([productKey, note]) => {
          if (!output.siteProducts.some(row => row.siteId === site.id && row.productKey === productKey) || !Array.isArray(note.applicants) || !note.applicants.length || note.applicants.some(applicant => !['member', 'spouse'].includes(applicant)) || new Set(note.applicants).size !== note.applicants.length || !Array.isArray(note.sourceReferences) || !note.sourceReferences.length || note.sourceReferences.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Invalid product note assignment: ${site.key}/${pageKey}/${productKey}`);
          return { productKeys: [productKey], applicants: [...note.applicants], text: text(note.content), sourceReferences: [...note.sourceReferences] };
        });
        output.configurationValues = output.configurationValues.filter(value => value.configurationKey !== configurationKey || !(value.siteKey === site.key || value.scope === 'client' && value.clientKey === clientKey(site)));
        if (notes.length) output.configurationValues.push(row('configurationValues', `${site.key}.${pageKey}-notes`, siteReference, scoped(site.key, { configurationKey, value: { version: 1, notes }, position: 0 })));
      }
      if (sitePage.note ?? page.note) setContent(site, `pages.${pageKey}.infoNote`, text(sitePage.note ?? page.note), siteReference);
      if (pageKey === 'eligibility') {
        const group = page.layout.sections.children;
        const fields = [...available.child.values()];
        const children = { pageKey: pageKey, sectionId: group.id, storageName: group.collection, label: text(group.repeats.item), maxItems: group.repeats.max,
          fields: fields.map(field => ({ fieldKey: answerKey(field.id, 'child'), valueKey: answerKey(field.id, 'child'), grid: group.repeats.grid.includes(field.id) })), libraryGroup: { label: text('eligibility.children.library') } };
        children.maxItems = source.configurations.find(configuration => configuration.id === group.repeats.max)?.default;
        if (!Number.isSafeInteger(children.maxItems) || children.maxItems < 1) throw new Error('Invalid fresh-start child list maximum');
        setConfiguration(site, 'fieldCollections', { ...configurationValue('fieldCollections'), children }, reference);
        const verification = resolveMappedFields({ component: 'member-verification' }, { siteId: site.key, page: pageKey, source: source.fields });
        for (const field of verification) {
          output.fields = output.fields.filter(row => row.key !== field.id);
          output.fields.push(row('fields', field.id, 'requirements/parked/field-details.json', { definition: field, position: output.fields.length }));
        }
        for (const question of source.verification.questions) {
          const definition = { id: question.id, displayName: question.question, label: question.question, inputType: 'radio', required: true, options: question.options.map(value => ({ value, label: value })) };
          output.fields = output.fields.filter(field => field.key !== question.id);
          output.fields.push(row('fields', question.id, 'requirements/global/prototype-fixtures/verification.json', { definition, position: output.fields.length }));
        }
        setConfiguration(site, 'fieldSurfaces', { ...configurationValue('fieldSurfaces'),
          verificationControls: { pageKey: pageKey, label: text('eligibility.verification.methods-label'), fields: verification.map(field => ({ fieldKey: field.id, valueKey: field.id })), libraryGroup: { label: text('eligibility.verification.library-label') } },
          verificationQuestions: { pageKey: pageKey, label: text('eligibility.verification.questions-label'), fields: source.verification.questions.map(question => ({ fieldKey: question.id, valueKey: question.id })), libraryGroup: { label: text('eligibility.verification.library-label') } },
        }, reference);
        const settings = source.siteEligibility[site.key];
        if (settings) {
          for (const [key, value] of Object.entries(settings.tpa)) setConfiguration(site, `tpaIntegration.${key}`, value, `requirements/parked/sites/${site.key}/eligibility.json`);
          setConfiguration(site, 'tpaIntegration.mode', { 'member-lookup': 'coverage-verification', 'membership-auto-approval': 'membership-auto-approval', none: 'none' }[settings.configurations['tpa-integration']], reference);
          setConfiguration(site, 'applicantExperience.eligibleStatesOnly', settings.configurations['eligible-states-only'], reference);
          setConfiguration(site, 'applicantExperience.eligibleStates', settings.configurations['eligible-states'], reference);
          setConfiguration(site, 'applicantExperience.childEligibility.mode', 'details', reference);
          setConfiguration(site, 'applicantExperience.childEligibility.note', text('eligibility.note.children'), reference);
        }
      }
      if (pageKey === 'coverage') setConfiguration(site, 'coveragePolicy.questionRequirements', source.coverageQuestions, 'requirements/global/coverage-questions.json');
    }
  }
  // Approved product constraints are materialized before any consumer resolves
  // eligibility. There is no later page-only age or work-hours override.
  const properties = { 'coverage-minimum-age-days': 'minimumAgeDays', 'coverage-minimum-age-years': 'minimumAgeYears', 'coverage-maximum-age-years': 'maximumAgeYears', 'coverage-student-maximum-age-years': 'studentMaximumAgeYears', 'coverage-minimum-work-hours': 'minimumWorkHours' };
  for (const site of sites) {
    compileCoveragePolicies(output, source, site, row, setConfiguration);
    for (const [id, target] of Object.entries(source.configurationBindings)) {
      const configuration = source.configurations.find(configuration => configuration.id === id);
      if (!configuration) throw new Error(`Missing fresh-start configuration: ${id}`);
      const assigned = Object.values(source.fields.sitePages?.[site.key] ?? {}).find(page => page.configurations && Object.hasOwn(page.configurations, id));
      setConfiguration(site, target, assigned?.configurations[id] ?? configuration.default, 'requirements/global/configuration-bindings.json');
    }
    for (const definition of source.products.products) {
      const product = output.products.find(row => row.key === definition.id);
      if (!product) throw new Error(`Missing product identity: ${definition.id}`);
      const copy = Object.fromEntries(Object.entries(definition.content).map(([property, key]) => [property, text(key)]));
      const base = { ...product.definition };
      for (const property of ['name', 'definition', 'description', 'brochureUrl']) delete base[property];
      const values = { ...base, ...copy };
      output.products = output.products.map(row => row.key === definition.id ? { ...row, definition: values, sourceReference: 'requirements/global/products.json' } : row);
      const presentationKeys = new Set(output.configurationDefinitions.filter(row => row.definition.target?.kind === 'product-presentation' && row.definition.target.productKey === definition.id && (Object.hasOwn(copy, row.definition.target.property) || row.definition.target.property === 'brochureUrl')).map(row => row.key));
      output.configurationValues = output.configurationValues.filter(row => !presentationKeys.has(row.configurationKey) || !(row.scope === 'global' || row.siteKey === site.key || row.clientKey === clientKey(site)));
      // Site brochure links remain scoped values. A second enrolled site must
      // never overwrite the first site's product presentation in the shared row.
      for (const [property, value] of Object.entries(source.siteProducts[site.key]?.products[definition.id] ?? {})) {
        const reference = `requirements/parked/sites/${site.key}/products.json`;
        const matches = output.configurationDefinitions.filter(row => row.definition.target?.kind === 'product-presentation' && row.definition.target.productKey === definition.id && row.definition.target.property === property);
        if (matches.length > 1) throw new Error(`Ambiguous product presentation binding: ${definition.id}/${property}`);
        const path = matches[0]?.definition.path?.join('.') ?? `products.presentation.${definition.id}.${property}`;
        if (!matches.length) output.configurationDefinitions.push(row('configurationDefinitions', `requirements.${path}`, reference, { position: output.configurationDefinitions.length, definition: { path: path.split('.'), target: { kind: 'product-presentation', productKey: definition.id, property } } }));
        setConfiguration(site, path, value, reference);
      }
    }
    for (const [key, targets] of Object.entries(source.contentBindings)) for (const target of [targets].flat()) setContent(site, target, text(key), 'requirements/global/content-bindings.json');
    for (const [role, key] of [['member', 'self'], ['spouse', 'spouse'], ['child', 'child']]) {
      setConfiguration(site, `applicantLabels.${role}`, text(`people.${key}`), 'requirements/global/content/people.json');
      setContent(site, `shared.applicantLabels.${role}`, text(`people.${key}`), 'requirements/global/content/people.json');
    }
    const authored = source.siteCoverage[site.key];
    if (!authored) continue;
    const assignments = parseCoverageAssignments(authored, source.configurations, site.key);
    setConfiguration(site, 'coverageRequirements', assignments, `requirements/parked/sites/${site.key}/coverage.json`);
    const grouped = new Map();
    for (const assignment of assignments.filter(assignment => properties[assignment.configuration])) for (const applicant of assignment.applicants) {
      const key = `${assignment.product}:${applicant}`;
      if (!grouped.has(key)) grouped.set(key, { productKey: assignment.product, applicantTypeKey: applicant, minimumAgeDays: null, minimumAgeYears: null, maximumAgeYears: null, studentMaximumAgeYears: null, minimumWorkHours: null });
      grouped.get(key)[properties[assignment.configuration]] = assignment.value;
    }
    for (const value of grouped.values()) {
      const key = `${site.key}.${value.productKey}.approved-eligibility.${value.applicantTypeKey}`;
      output.eligibilityConstraints = output.eligibilityConstraints.filter(row => row.siteKey !== site.key || row.productKey !== value.productKey || row.applicantTypeKey !== value.applicantTypeKey);
      output.eligibilityConstraints.push(row('eligibilityConstraints', key, `requirements/parked/sites/${site.key}/coverage.json`, { ...value, siteKey: site.key }));
    }
  }
  return output;
}
