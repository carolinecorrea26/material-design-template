import { canonicalContentKey, resolveContentReferences } from './contentReferences.mjs';
import { validatePageNotes } from './pageNotes.mjs';
import { compileRequirementComponents, validateRequirementComponentParts } from './requirementComponents.mjs';
import { validatePrototypeHandoffs } from './prototypeHandoffs.mjs';
import { resumePolicy } from './resumePolicy.mjs';
import { applicationSessionPolicy } from './applicationSessionPolicy.mjs';
import { validateRecoveryDefinition } from './recoveryDefinition.mjs';
import { compileCoveragePolicies } from "./requirementCoveragePolicies.mjs";
import { resolveMappedFields, resolveAnswerKey } from './requirementFieldDefinitions.mjs';
import { libraryMetadata } from './provenance.ts';
import { parseCoverageAssignments } from './requirementCoverageValidation.mjs';
import { compileProductCatalog } from './requirementProductCatalog.mjs';
import { compileApplicationCatalog, compileApplicationSiteIdentities } from './requirementApplicationCatalog.mjs';
import { requirementPageSections, validateRequirementOutcomeCondition, validateRequirementPageAssignments } from './requirementPagePresentation.mjs';
import { requirementSurfaceFields } from './requirementSurfaceFields.mjs';

const answerKey = (field, person) => person === 'self' ? field : `${person}-${field}`;
const scoped = (siteKey, extra) => ({ scope: 'site', siteKey, clientKey: null, ...extra });
const row = (table, key, sourceReference, extra) => ({ id: key, key, ...libraryMetadata(table, key, sourceReference), ...extra });
const projectedConfigurationValue = (configuration, value) => configuration.runtimeValues ? configuration.runtimeValues[value] : value;

const sectionConditions = (when, fieldKey = answerKey) => {
  const clauses = when.all ?? [when];
  if (!Array.isArray(clauses) || !clauses.length || when.all && Object.keys(when).some(key => key !== 'all')) throw new Error('Invalid fresh-start section condition');
  return clauses.map(clause => {
    if (!clause || typeof clause.field !== 'string' || Object.keys(clause).some(key => !['field', 'of', 'equals', 'includes'].includes(key)) ||
        clause.of !== undefined && !['self', 'spouse', 'child', 'beneficiary'].includes(clause.of) || Object.hasOwn(clause, 'equals') === Object.hasOwn(clause, 'includes')) throw new Error('Invalid fresh-start section condition');
    return { fieldId: fieldKey(clause.field, clause.of ?? 'self'), operator: Object.hasOwn(clause, 'includes') ? 'includes' : 'equals', value: clause.includes ?? clause.equals };
  });
};

/** Compile reviewed requirements into the shared consumer contract. Legacy page
 * records are discarded, never used as defaults or to supply missing placement.
 * The generated records are projections, not another authoring source. */
export function compileRequirementCatalog(data, source, selectedSite, siteScope) {
  data = compileApplicationSiteIdentities(data, source, selectedSite, siteScope);
  source = { ...source, content: resolveContentReferences(source.content, source.contentReferences), fields: { ...source.fields, pageMappings: Object.fromEntries(Object.values(source.pages).filter(page => page.fieldMapping).map(page => [page.page, page.fieldMapping])) } };
  const validateDecisionCopy = (key, value) => {
    if (/^receipt\.decision-statuses\.[^.]+\.description$/.test(key) && (typeof value !== 'string' || /\{\{/.test(value))) throw new Error(`Receipt decision descriptions must be literal configured copy: ${key}`);
  };
  for (const [key, value] of Object.entries(source.content)) validateDecisionCopy(key, value);
  for (const pages of Object.values(source.fields.sitePages ?? {})) for (const page of Object.values(pages)) for (const [key, value] of Object.entries(page.content ?? {})) validateDecisionCopy(key, value);
  validateRecoveryDefinition(source.recovery, source.content);
  if (Object.hasOwn(source.fields.fieldDetails, 'bindings')) throw new Error('Retired fresh-start field binding table is not supported');
  const sites = data.sites.filter(site => (!selectedSite || site.key === selectedSite) && (!siteScope || siteScope.includes(site.key)) && source.fields.sites[site.key]);
  // Enrolled Sites reconstruct their complete configuration from authored
  // defaults and assignments. Saved client/Site configuration is superseded.
  const siteKeys = new Set(sites.map(site => site.key));
  const clientKeys = new Set(data.clients.filter(client => sites.some(site => site.clientId === client.id)).map(client => client.key));
  data = { ...data, configurationValues: data.configurationValues.filter(value => !(value.scope === 'site' && siteKeys.has(value.siteKey) || value.scope === 'client' && clientKeys.has(value.clientKey))) };
  data = compileProductCatalog(data, source, sites);
  data = compileApplicationCatalog(data, source, sites);
  const pages = Object.values(source.pages).filter(page => page.definition && page.layout);
  validateRequirementPageAssignments(pages, source.pageDefaults, Object.fromEntries(sites.map(site => [site.key, source.fields.sitePages?.[site.key] ?? {}])));
  const output = { ...data, components: compileRequirementComponents(data.components, source.components) };
  for (const page of pages) {
    validateRequirementComponentParts(page.components, source.components);
    for (const [key, slot] of Object.entries(page.contentSlots ?? {})) if (slot.kind === 'notes') validatePageNotes(source.content[key], output.products.map(product => product.key));
  }
  const effectiveRequirementConfiguration = (site, id) => {
    const definition = source.configurations.find(configuration => configuration.id === id);
    const target = source.configurationBindings[id];
    const assignments = Object.values(source.fields.sitePages?.[site.key] ?? {}).filter(page => Object.hasOwn(page.configurations ?? {}, id));
    const eligibility = source.siteEligibility[site.key];
    const assigned = eligibility?.configurations?.[id] ?? (target?.startsWith('tpaIntegration.') ? eligibility?.tpa?.[target.split('.').at(-1)] : undefined);
    if (definition?.globalOnly && (assignments.length || Object.hasOwn(eligibility?.configurations ?? {}, id) || assigned !== undefined)) throw new Error(`Global-only configuration cannot be overridden: ${site.key}/${id}`);
    if (assignments.length > 1 || assignments.length && assigned !== undefined) throw new Error(`Duplicate fresh-start configuration assignment: ${site.key}/${id}`);
    return assignments[0]?.configurations[id] ?? assigned ?? definition?.default;
  };
  for (const table of ['underwritingBands', 'coverageAmountPatterns', 'amountBands', 'amountOptions', 'productAmountRules', 'products', 'pages', 'sitePages', 'fields', 'pageFields', 'pageSectionFields', 'siteFieldConfigurations', 'conditions', 'contentEntries', 'contentValues', 'configurationDefinitions', 'configurationValues', 'validationRules', 'eligibilityConstraints']) output[table] = [...data[table]];
  const retiredDecisions = new Set(pages.flatMap(page => {
    const keys = page.retiredDecisionKeys ?? [];
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !key.trim()) || new Set(keys).size !== keys.length) throw new Error(`Invalid retired page decisions: ${page.page}`);
    return keys;
  }));
  output.semanticRequirements = output.semanticRequirements.filter(record => !retiredDecisions.has(record.key));
  const retiredFields = new Set(pages.flatMap(page => {
    const keys = page.retiredFieldKeys ?? [];
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !/^[a-z][a-z0-9-]*$/.test(key) || source.fields.fieldIds.fields.some(field => field.id === key)) || new Set(keys).size !== keys.length) throw new Error(`Invalid retired page fields: ${page.page}`);
    return keys;
  }));
  output.fields = output.fields.filter(field => !retiredFields.has(field.key));
  for (const table of ['pageFields', 'pageSectionFields', 'siteFieldConfigurations', 'validationRules']) output[table] = output[table].filter(record => !retiredFields.has(record.fieldKey));
  const globalPageKeys = new Set(pages.map(page => page.consumerKey ?? page.page));
  const retiredPages = new Set([...data.pages.filter(page => page.definition.type !== 'internal' && !globalPageKeys.has(page.key)).map(page => page.key), ...source.recovery.retiredPageKeys, ...pages.flatMap(page => {
    const keys = page.retiredPageKeys ?? [];
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !/^[a-z][a-z0-9-]*$/.test(key) || source.pages[key]) || new Set(keys).size !== keys.length) throw new Error(`Invalid retired page identities: ${page.page}`);
    return keys;
  })]);
  const retiredSections = new Set(output.pageSections.filter(record => retiredPages.has(record.pageKey)).map(record => record.key));
  output.pages = output.pages.filter(record => !retiredPages.has(record.key));
  for (const table of ['sitePages', 'pageFields', 'pageSections', 'siteFieldConfigurations']) output[table] = output[table].filter(record => !retiredPages.has(record.pageKey));
  output.pageSectionFields = output.pageSectionFields.filter(record => !retiredSections.has(record.sectionKey));
  const retiredContentKeys = new Set(pages.flatMap(page => {
    const keys = page.retiredContentKeys ?? [];
    const active = new Set(Object.values(source.contentBindings).flat());
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !key.trim() || active.has(key)) || new Set(keys).size !== keys.length) throw new Error(`Invalid retired page content: ${page.page}`);
    return keys;
  }));
  const retiredContent = key => retiredContentKeys.has(key) || [...source.recovery.retiredContentRoots, ...[...retiredPages].map(page => `pages.${page}`)].some(root => key === root || key.startsWith(`${root}.`));
  output.contentEntries = output.contentEntries.filter(record => !retiredContent(record.key));
  output.contentValues = output.contentValues.filter(record => !retiredContent(record.contentKey));
  const retiredComponents = new Set([...source.recovery.retiredComponentKeys, ...pages.flatMap(page => {
    const keys = page.retiredComponentKeys ?? [];
    if (!Array.isArray(keys) || keys.some(key => typeof key !== 'string' || !/^component-[a-z0-9-]+$/.test(key)) || new Set(keys).size !== keys.length) throw new Error(`Invalid retired page components: ${page.page}`);
    return keys;
  })]);
  if (Array.isArray(output.components)) output.components = output.components.filter(record => !retiredComponents.has(record.key));
  const retiredConfigurations = new Set(source.configurations.flatMap(configuration => configuration.replaces ?? []));
  const currentPaths = new Set(Object.values(source.configurationBindings));
  const replacedPaths = [...retiredConfigurations];
  for (const record of output.configurationDefinitions) {
    const path = record.definition.path?.join('.');
    if (path && !currentPaths.has(path) && replacedPaths.some(replaced => path === replaced || path.startsWith(`${replaced}.`))) retiredConfigurations.add(record.key);
  }
  for (const record of output.configurationDefinitions) if (record.definition.path?.join('.') === 'features.defaultTemplate') retiredConfigurations.add(record.key);
  output.configurationDefinitions = output.configurationDefinitions.filter(record => !retiredConfigurations.has(record.key));
  output.configurationValues = output.configurationValues.filter(record => !retiredConfigurations.has(record.configurationKey));
  const siteContent = new Map();
  for (const site of sites.length ? sites : [{ key: undefined }]) {
    const overrides = {};
    for (const [pageKey, assignment] of Object.entries(source.fields.sitePages?.[site.key] ?? {})) {
      for (const [key, value] of Object.entries(assignment.content ?? {})) {
        if (!source.pages[pageKey]?.contentSlots?.[key]) throw new Error(`Undeclared Site content slot: ${pageKey}/${key}`);
        overrides[key] = value;
      }
    }
    for (const [id, values] of Object.entries(source.siteProducts[site.key]?.categories ?? {})) {
      if (!source.fields.optionLists['coverage-categories'].some(option => option.value === id) || Object.keys(values).some(key => !['name', 'description'].includes(key))) throw new Error(`Invalid category presentation: ${id}`);
      if (values.description !== undefined) overrides[`coverage.category.${id.toLowerCase()}.description`] = values.description;
      if (values.name !== undefined && (typeof values.name !== 'string' || !values.name.trim())) throw new Error(`Invalid category name: ${id}`);
    }
    const sameShape = (base, value) => typeof base === 'string' ? typeof value === 'string'
      : Array.isArray(base) ? Array.isArray(value) && value.every(item => sameShape(base[0] ?? '', item))
      : base && typeof base === 'object' ? value && typeof value === 'object' && !Array.isArray(value) && Object.keys(base).length === Object.keys(value).length && Object.keys(base).every(key => Object.hasOwn(value, key) && sameShape(base[key], value[key]))
      : typeof base === typeof value;
    for (const [key, value] of Object.entries(overrides)) {
      const notes = pages.some(page => page.contentSlots?.[key]?.kind === 'notes');
      if (!Object.hasOwn(source.content, key) || !notes && !sameShape(source.content[key], value)) throw new Error(`Invalid Site content value: ${key}`);
      if (notes) validatePageNotes(value, output.siteProducts.filter(product => product.siteId === site.id).map(product => product.productKey));
    }
    for (const page of pages) for (const [key, slot] of Object.entries(page.contentSlots ?? {})) {
      const value = overrides[key] ?? source.content[key];
      if (slot.kind === 'image' && (!value || typeof value.src !== 'string' || !/^(\/(?!\/)|https:\/\/)/.test(value.src) || typeof value.alt !== 'string' || !value.alt.trim())) throw new Error(`Invalid fresh-start image: ${page.page}/${key}`);
      if (slot.kind === 'notice' && (!value || typeof value.title !== 'string' || typeof value.text !== 'string')) throw new Error(`Invalid fresh-start notice: ${page.page}/${key}`);
      if (slot.requiredWhen) {
        const { configuration, properties, equals = true } = slot.requiredWhen;
        const definition = source.configurations.find(entry => entry.id === configuration);
        const validCondition = definition?.type === 'boolean' ? typeof equals === 'boolean' : definition?.type === 'enum' && definition.options?.includes(equals);
        const validShape = properties === undefined ? typeof source.content[key] === 'string' : Array.isArray(properties) && properties.length && properties.every(property => typeof property === 'string' && typeof source.content[key]?.[property] === 'string');
        if (!validCondition || !validShape) throw new Error(`Invalid conditional content requirement: ${page.page}/${key}`);
        const selected = effectiveRequirementConfiguration(site, configuration);
        if (selected === equals && (properties ? properties.some(property => !value?.[property]?.trim()) : !value?.trim())) throw new Error(`Missing enabled content: ${site.key}/${page.page}/${key}`);
      }
    }
    siteContent.set(site.key, overrides);
  }
  const text = (key, siteKey) => {
    const value = siteContent.get(siteKey)?.[key] ?? source.content[key];
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
  const contentOwners = new Map(Object.entries(source.content).map(([key]) => [key, canonicalContentKey(key, source.contentReferences)]));
  for (const [key, targets] of Object.entries(source.contentBindings)) for (const target of [targets].flat()) contentOwners.set(target, canonicalContentKey(key, source.contentReferences));
  const setContent = (site, key, value, reference, owner = contentOwners.get(key)) => {
    if (owner) contentOwners.set(key, canonicalContentKey(owner, source.contentReferences));
    output.contentEntries = output.contentEntries.filter(entry => entry.key !== key);
    output.contentEntries.push(row('contentEntries', key, reference, { position: output.contentEntries.length, definition: { path: key.split('.') } }));
    output.contentValues = output.contentValues.filter(entry => entry.contentKey !== key || !(entry.scope === 'global' || entry.siteKey === site.key || entry.scope === 'client' && entry.clientKey === clientKey(site)));
    const identity = `requirements.${site.key}.${key}`;
    output.contentValues.push(row('contentValues', identity, reference, scoped(site.key, { contentKey: key, value, position: output.contentValues.length })));
  };
  const globalContent = new Map();
  const setGlobalContent = (key, value, reference) => { globalContent.delete(key); globalContent.set(key, { value, reference }); };

  const questionPath = 'coveragePolicy.questionRequirements';
  const questionDefinitions = output.configurationDefinitions.filter(record => record.definition.path?.join('.') === questionPath);
  if (questionDefinitions.length > 1) throw new Error('Ambiguous Coverage question configuration');
  const questionKey = questionDefinitions[0]?.key ?? `requirements.${questionPath}`;
  const questionReference = 'requirements/global/coverage-questions.json';
  if (!questionDefinitions.length) output.configurationDefinitions.push(row('configurationDefinitions', questionKey, questionReference, { definition: { path: questionPath.split('.') }, position: output.configurationDefinitions.length }));
  const authoredQuestionSites = new Set(sites.filter(site => [...(source.siteApplication[site.key]?.records.configurationValues ?? []), ...(source.siteProducts[site.key]?.catalog?.configurationValues ?? [])].some(value => value.configurationKey === questionKey)).map(site => site.key));
  output.configurationValues = output.configurationValues.filter(record => record.configurationKey !== questionKey || record.scope === 'site' && authoredQuestionSites.has(record.siteKey));
  output.configurationValues.push(row('configurationValues', `requirements.global.${questionPath}`, questionReference, { configurationKey: questionKey, scope: 'global', siteKey: null, clientKey: null, value: structuredClone(source.coverageQuestions), position: 0 }));

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
      const fields = requirementSurfaceFields(surface, page.page, source);
      if (surface.dialog && !page.layout.dialogs?.[surface.dialog]) throw new Error(`Unknown fresh-start surface dialog: ${page.page}/${name}`);
      if (surface.kind === 'tool' || surface.kind === 'controls' || surface.dialog) for (const field of fields) placed.add(field.id);
      for (const binding of surface.definition.fields) {
        const id = surface.aliases?.[binding.fieldKey]?.field ?? binding.fieldKey;
        const field = fields.find(field => field.id === id);
        if (!field || !placed.has(id)) throw new Error(`Unmapped fresh-start ${surface.kind === 'tool' ? 'surface' : 'dialog'} field: ${page.page}/${name}/${id}`);
        output.fields = output.fields.filter(field => field.key !== binding.fieldKey);
        output.fields.push(row('fields', binding.fieldKey, `requirements/parked/${page.page}.json`, {
          definition: { ...field, id: binding.fieldKey, ...(surface.aliases?.[binding.fieldKey]?.label ? { label: text(surface.aliases[binding.fieldKey].label) } : {}) }, position: output.fields.length,
          ...(surface.fixture ? { sourceReference: 'requirements/global/prototype-fixtures/verification.json' } : {}),
        }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== binding.fieldKey);
      }
      surfaces[name] = { ...structuredClone(surface.definition), pageKey: page.consumerKey ?? page.page,
        ...(surface.kind ? { kind: surface.kind } : {}),
        label: text(surface.definition.label),
        ...(surface.definition.libraryGroup ? { libraryGroup: { ...surface.definition.libraryGroup, label: text(surface.definition.libraryGroup.label) } } : {}) };
    }
    output.configurationValues = output.configurationValues.map(value => value === defaults[0] ? { ...value, value: surfaces } : value);
  }
  // Repeating sections declare their record storage once, independently of page identity.
  const repeatingSections = pages.flatMap(page => requirementPageSections(page, source.sectionOrders).filter(([, group]) => group.collection && group.repeats).map(([name, group]) => ({ page, name, group })));
  if (repeatingSections.length) {
    const definition = output.configurationDefinitions.find(row => row.definition.path?.join('.') === 'fieldCollections');
    const defaults = output.configurationValues.filter(row => row.configurationKey === definition?.key && row.scope === 'global');
    if (defaults.length !== 1) throw new Error('Missing fresh-start field collection defaults');
    const collections = structuredClone(defaults[0].value);
    for (const { page, group } of repeatingSections) {
      const person = group.for ?? 'self';
      const fields = resolveMappedFields(page.fieldMapping, { person, page: page.page, includeAll: true, source: source.fields }).filter(field => group.remaining || group.fields?.includes(field.id));
      const maxItems = source.configurations.find(configuration => configuration.id === group.repeats.max)?.default;
      if (!Number.isSafeInteger(maxItems) || maxItems < 1 || maxItems > 100) throw new Error('Invalid fresh-start repeated list maximum');
      const keyFor = id => resolveAnswerKey(id, person, page.answerKeyPatterns);
      collections[group.collection] = { pageKey: page.consumerKey ?? page.page, sectionId: group.id, storageName: group.collection, label: text(group.repeats.item), maxItems,
        fields: fields.map(field => ({ fieldKey: keyFor(field.id), valueKey: keyFor(field.id), grid: group.repeats.grid.includes(field.id) })),
        ...(group.repeats.libraryLabel ? { libraryGroup: { label: text(group.repeats.libraryLabel) } } : {}) };
      for (const field of fields) {
        const id = keyFor(field.id);
        output.fields = output.fields.filter(row => row.key !== id);
        output.fields.push(row('fields', id, `requirements/parked/${page.page}.json`, { definition: { ...field, id }, position: output.fields.length }));
        output.validationRules = output.validationRules.filter(row => row.fieldKey !== id);
      }
    }
    output.configurationValues = output.configurationValues.map(value => value === defaults[0] ? { ...value, value: collections } : value);
  }
  // Repeated record storage and shared dialog fields have separate ownership:
  // each collection reuses a declared surface instead of copying its fields.
  const authoredCollections = pages.flatMap(page => Object.entries(page.collections ?? {}).map(([name, collection]) => ({ page, name, collection })));
  if (authoredCollections.length) {
    const definition = output.configurationDefinitions.find(row => row.definition.path?.join('.') === 'fieldCollections');
    const defaults = output.configurationValues.filter(row => row.configurationKey === definition?.key && row.scope === 'global');
    if (defaults.length !== 1) throw new Error('Missing or ambiguous fresh-start field collection defaults');
    const collections = structuredClone(defaults[0].value);
    const declared = new Set();
    for (const { page, name, collection } of authoredCollections) {
      const surface = configurationValue('fieldSurfaces')[collection.surface];
      const section = page.layout.sections[collection.section];
      if (declared.has(name) || !page.surfaces?.[collection.surface]?.definition || !Number.isSafeInteger(surface?.maxItems) || surface.maxItems < 1 || surface.maxItems > 100 || !section?.id || !collection.storageName) throw new Error(`Invalid fresh-start collection: ${page.page}/${name}`);
      declared.add(name);
      collections[name] = { pageKey: page.consumerKey ?? page.page, sectionId: section.id, storageName: collection.storageName,
        label: surface.label, maxItems: surface.maxItems, ...(surface.minItems !== undefined ? { minItems: surface.minItems } : {}), fields: structuredClone(surface.fields),
        ...(collection.libraryGroup ? { libraryGroup: { ...collection.libraryGroup, label: text(collection.libraryGroup.label) } } : {}) };
    }
    output.configurationValues = output.configurationValues.map(value => value === defaults[0] ? { ...value, value: collections, sourceReference: [...repeatingSections.map(({ page, name }) => `requirements/parked/${page.page}.json#layout/sections/${name}`), ...authoredCollections.map(({ page }) => `requirements/parked/${page.page}.json#collections`)].filter((value, index, all) => all.indexOf(value) === index).join('; ') } : value);
  }
  const handoffKey = 'prototype-handoffs';
  const containers = new Set(output.configurationDefinitions.filter(record => ['fieldSurfaces', 'fieldCollections'].includes(record.definition.path?.join('.'))).map(record => record.key));
  output.configurationValues = output.configurationValues.filter(record => !containers.has(record.configurationKey) || record.scope === 'global' || !sites.some(site => record.siteKey === site.key || record.scope === 'client' && record.clientKey === clientKey(site)));
  const handoffReference = 'requirements/global/prototype-fixtures/handoffs.json';
  const handoffDefaults = validatePrototypeHandoffs(source.prototypeHandoffs);
  const handoffDefinition = source.application.records.configurationDefinitions.find(entry => entry.key === handoffKey);
  if (handoffDefinition?.definition?.path?.join('.') !== 'prototypeHandoffs') throw new Error('Missing fresh-start prototype handoff definition');
  const handoffKeys = new Set(output.configurationDefinitions.filter(entry => entry.key === handoffKey || entry.definition.path?.join('.') === 'prototypeHandoffs').map(entry => entry.key));
  output.configurationDefinitions = output.configurationDefinitions.filter(entry => !handoffKeys.has(entry.key));
  output.configurationDefinitions.push(row('configurationDefinitions', handoffKey, 'requirements/global/application.json#configurationDefinitions/prototype-handoffs', { position: handoffDefinition.position, definition: structuredClone(handoffDefinition.definition) }));
  output.configurationValues = output.configurationValues.filter(entry => !handoffKeys.has(entry.configurationKey));
  output.configurationValues.push(row('configurationValues', 'global.prototype-handoffs', handoffReference, { configurationKey: handoffKey, scope: 'global', siteKey: null, clientKey: null, value: structuredClone(handoffDefaults), position: 0 }));
  for (const site of sites) setConfiguration(site, 'prototypeHandoffs', { ...handoffDefaults, ...validatePrototypeHandoffs(source.sitePrototypeHandoffs[site.key] ?? {}, true) }, `requirements/parked/sites/${site.key}/prototype-handoffs.json`);
  for (const page of pages) {
    if (Object.hasOwn(page, 'fieldBindings') || Object.hasOwn(page, 'looseFields')) throw new Error(`Retired fresh-start page bindings are not supported: ${page.page}`);
    const requirementKey = page.page;
    const pageAnswerKey = (field, person) => resolveAnswerKey(field, person, page.answerKeyPatterns);
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
    const help = page.help ?? [];
    if (!Array.isArray(help) || new Set(help.map(item => item?.id)).size !== help.length) throw new Error(`Invalid page help topics: ${pageKey}`);
    const resolvedHelp = help.map(item => {
      if (!item || typeof item.id !== 'string' || !item.id.trim() || Object.keys(item).some(key => !['id', 'chip', 'title'].includes(key))) throw new Error(`Invalid page help topic: ${pageKey}`);
      const label = text(item.chip), title = text(item.title);
      if (typeof label !== 'string' || !label.trim() || typeof title !== 'string' || !title.trim()) throw new Error(`Invalid page help wording: ${pageKey}`);
      return { id: item.id, label, title };
    });
    output.pages.push(row('pages', pageKey, reference, { definition: { ...structuredClone(page.definition), help: resolvedHelp }, position: page.position }));
    output.pageFields = output.pageFields.filter(row => row.pageKey !== pageKey);
    output.pageSections = output.pageSections.filter(row => row.pageKey !== pageKey);
    output.pageSectionFields = output.pageSectionFields.filter(row => !sectionKeys.has(row.sectionKey));
    output.conditions = output.conditions.filter(row => !row.key.startsWith(`condition-requirements-${pageKey}-`));
    output.siteFieldConfigurations = output.siteFieldConfigurations.filter(row => row.pageKey !== pageKey || row.scope !== 'global');
    const outcomeCondition = (condition, key) => {
      validateRequirementOutcomeCondition(condition);
      const person = condition.of ?? 'self';
      const field = sharedByPerson[person]?.get(condition.field);
      if (!field) throw new Error(`Unmapped fresh-start outcome field: ${pageKey}/${condition.field}`);
      output.conditions.push(row('conditions', key, reference, { position: output.conditions.length, definition: { id: key, match: 'all', conditions: [{ fieldId: pageAnswerKey(condition.field, person), operator: 'outcome', value: [...condition.outcome] }] } }));
      return key;
    };
    const fieldConditions = new Map();

    // Global placement is compiled once; per-site definitions and inclusion follow
    // the page mapping and site file, never saved field overrides.
    const used = new Set();
    const groups = [];
    const sharedByPerson = Object.fromEntries(['self', 'spouse', 'child'].map(person => [person,
      new Map(page.fieldMapping ? resolveMappedFields(page.fieldMapping, { page: requirementKey, person, includeAll: true, source: source.fields }).map(field => [field.id, field]) : [])]));
    const allByPerson = Object.fromEntries(['self', 'spouse', 'child'].map(person => [person, [...sharedByPerson[person].values()]]));
    const pageGroups = requirementPageSections(page, source.sectionOrders);
    for (const rule of page.shownWhen?.fields ?? []) {
      // Older descriptive shownWhen annotations are not executable contracts.
      // An explicit source field identifies the supported outcome predicate.
      if (!Object.hasOwn(rule.shownWhen ?? {}, 'outcome')) continue;
      const group = pageGroups.find(([name]) => name === rule.section)?.[1];
      const owner = Object.entries(page.companions ?? {}).find(([, fields]) => fields.includes(rule.field))?.[0];
      if (!sharedByPerson.self.has(rule.field) || !group || !group.remaining && !(group.fields ?? []).includes(owner ?? rule.field) || fieldConditions.has(rule.field)) throw new Error(`Invalid fresh-start field visibility: ${pageKey}/${rule.field}`);
      const key = outcomeCondition(rule.shownWhen, `condition-requirements-${pageKey}-field-${rule.field}`);
      fieldConditions.set(rule.field, key);
      output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.global.${pageKey}.${rule.field}`, reference, { scope: 'global', siteKey: null, clientKey: null, pageKey, fieldKey: rule.field, include: null, hidden: null, values: { visibilityConditionId: key }, position: fieldConditions.size }));
    }
    for (const binding of page.fieldVisibility ?? []) {
      const group = page.layout.sections[binding.section];
      const person = group?.for ?? 'self';
      const id = pageAnswerKey(binding.field, person);
      if (!group || !sharedByPerson[person].has(binding.field) || !(group.fields ?? []).includes(binding.field) || fieldConditions.has(id)) throw new Error(`Invalid fresh-start field visibility: ${pageKey}/${id}`);
      const key = `condition-requirements-${pageKey}-field-${id}`;
      const predicates = [...(group.when ? sectionConditions(group.when, pageAnswerKey) : []), ...sectionConditions(binding.when, pageAnswerKey)];
      const authoredKeys = new Set(source.fields.mappings.flatMap(mapping => (mapping.fields ?? []).flatMap(field => field.people.map(person => answerKey(field.field, person)))));
      if (predicates.some(predicate => !authoredKeys.has(predicate.fieldId))) throw new Error(`Unmapped fresh-start field predicate: ${pageKey}/${id}`);
      output.conditions.push(row('conditions', key, reference, { position: output.conditions.length, definition: { id: key, match: 'all', conditions: predicates } }));
      fieldConditions.set(id, key);
      output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.global.${pageKey}.${id}`, reference, { scope: 'global', siteKey: null, clientKey: null, pageKey, fieldKey: id, include: null, hidden: null, values: { visibilityConditionId: key }, position: fieldConditions.size }));
    }
    for (const [name, group] of pageGroups) {
      if (!group.id) continue;
      const person = group.for ?? 'self';
      const mapping = page.fieldMapping ? source.fields.mappings.find(mapping => page.fieldMapping.component ? mapping.component === page.fieldMapping.component : mapping.page === page.fieldMapping.page) : undefined;
      if (!mapping && (group.remaining || group.fields?.length)) throw new Error(`Missing fresh-start field mapping: ${requirementKey}`);
      for (const id of group.fields ?? []) if (!mapping?.fields.some(field => field.field === id && field.people.includes(person))) throw new Error(`Unmapped fresh-start field: ${pageKey}/${name}/${id}`);
      const fields = group.remaining ? allByPerson[person].filter(field => !used.has(pageAnswerKey(field.id, person)) && !Object.values(page.companions ?? {}).flat().includes(field.id))
        : (group.fields ?? []).flatMap(id => allByPerson[person].filter(field => field.id === id));
      const ids = fields.map(field => pageAnswerKey(field.id, person));
      if (ids.some(id => retiredFields.has(id))) throw new Error(`Retired page field is still placed: ${pageKey}`);
      for (const base of fields) {
        const id = pageAnswerKey(base.id, person);
        output.fields = output.fields.filter(field => field.key !== id);
        output.fields.push(row('fields', id, 'requirements/parked/field-details.json', { position: output.fields.length, definition: { ...(sharedByPerson[person].get(base.id) ?? base), id } }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
        if (!group.collection && !output.pageFields.some(field => field.pageKey === pageKey && field.fieldKey === id)) output.pageFields.push(row('pageFields', `${pageKey}.${id}`, reference, { pageKey, fieldKey: id, position: output.pageFields.filter(field => field.pageKey === pageKey).length }));
      }
      if (ids.some(id => used.has(id))) throw new Error(`Duplicate fresh-start field placement: ${pageKey}/${name}`);
      ids.forEach(id => used.add(id));
      const sectionKey = `${pageKey}.${group.id}`;
      const outcomeWhen = Object.hasOwn(page.shownWhen?.sections?.[name] ?? {}, 'outcome') ? page.shownWhen.sections[name] : undefined;
      const conditionKey = group.when ? `condition-requirements-${pageKey}-${name}` : outcomeWhen ? outcomeCondition(outcomeWhen, `condition-requirements-${pageKey}-${name}`) : undefined;
      if (group.when) {
        output.conditions = output.conditions.filter(row => row.key !== conditionKey);
        output.conditions.push(row('conditions', conditionKey, reference, { position: output.conditions.length, definition: { id: conditionKey, match: 'all', conditions: sectionConditions(group.when, pageAnswerKey) } }));
      }
      const definition = { id: group.id, pageId: pageKey, applicant: person, fieldIds: ids,
        ...(group.applicantParticipation ? { applicantParticipation: group.applicantParticipation } : {}),
        ...(group.role ? { role: group.role } : {}),
        ...(group.components ? { components: group.components } : {}),
        ...(group.composition ? { composition: group.composition.map(function project(component) { return { ...component, ...(component.fieldIds ? { fieldIds: component.fieldIds.map(id => pageAnswerKey(id, person)) } : {}), ...(component.components ? { components: component.components.map(project) } : {}) }; }) } : {}),
        ...(group.display ? { display: structuredClone(group.display) } : {}),
        ...(group.coverageCategories ? { coverageCategories: structuredClone(group.coverageCategories) } : {}),
        ...(group.enabledByConfiguration ? { enabledByConfiguration: group.enabledByConfiguration } : {}),
        ...(group.title ? { description: text(group.title) } : {}),
        ...(group.collection ? { collectionName: group.collection } : {}),
        ...(conditionKey ? { visibilityConditionId: conditionKey } : {}),
        ...(group.presentation ? { presentation: group.presentation } : {}) };
      output.pageSections.push(row('pageSections', sectionKey, reference, { pageKey: pageKey, definition, position: groups.length }));
      groups.push({ name, group, fields, sectionKey });
      for (const [position, id] of ids.entries()) output.pageSectionFields.push(row('pageSectionFields', `${sectionKey}.${id}`, reference, { sectionKey, fieldKey: id, position }));
    }

    for (const id of Object.values(page.companions ?? {}).flat().filter(id => fieldConditions.has(id))) {
      output.fields = output.fields.filter(row => row.key !== id);
      output.fields.push(row('fields', id, reference, { definition: sharedByPerson.self.get(id), position: output.fields.length }));
      output.pageFields.push(row('pageFields', `${pageKey}.${id}`, reference, { pageKey, fieldKey: id, position: output.pageFields.filter(row => row.pageKey === pageKey).length }));
    }
    if (page.hideFollowupsWhenQuestionHidden !== undefined && typeof page.hideFollowupsWhenQuestionHidden !== 'boolean') throw new Error(`Invalid fresh-start follow-up availability: ${pageKey}`);
    const visibilityDependencies = conditionId => page.hideFollowupsWhenQuestionHidden && conditionId
      ? [...new Set((output.conditions.find(condition => condition.key === conditionId)?.definition.conditions ?? []).map(clause => clause.fieldId).filter(id => used.has(id)))]
      : [];
    for (const site of sites) {
      const sitePage = source.fields.sitePages?.[site.key]?.[requirementKey] ?? {};
      const siteReference = `requirements/parked/sites/${site.key}/pages/${requirementKey}.json`;
      output.sitePages = output.sitePages.filter(row => row.siteKey !== site.key || row.pageKey !== pageKey);
      output.sitePages.push(row('sitePages', `${site.key}.${pageKey}`, reference, { siteKey: site.key, pageKey: pageKey, requirement: sitePage.requirement ?? source.pageDefaults.pages[requirementKey].requirement, position: page.position }));
      output.siteFieldConfigurations = output.siteFieldConfigurations.filter(row => row.pageKey !== pageKey || !(row.siteKey === site.key || row.scope === 'client' && row.clientKey === clientKey(site)));
      const coveredPeople = effectiveRequirementConfiguration(site, 'site-people');
      if (!Array.isArray(coveredPeople) || !coveredPeople.includes('self') || coveredPeople.some(person => !['self', 'spouse', 'child'].includes(person))) throw new Error(`Invalid fresh-start covered people: ${site.key}`);
      const available = Object.fromEntries(['self', 'spouse', 'child'].map(person => [person, new Map(page.fieldMapping ? resolveMappedFields(page.fieldMapping, { page: requirementKey, person, siteId: site.key, source: source.fields }).filter(() => requirementKey !== 'eligibility' || coveredPeople.includes(person)).flatMap(field => { const resolved = field.id === 'dependents' ? { ...field, options: field.options.filter(option => coveredPeople.includes(option.value)) } : field; return field.id === 'dependents' && !resolved.options.length ? [] : [[field.id, resolved]]; }) : [])]));
      for (const { name, group, fields } of groups) for (const base of fields) {
        const person = group.for ?? 'self', id = pageAnswerKey(base.id, person);
        if (group.enabledByConfiguration && source.configurations.find(configuration => configuration.id === group.enabledByConfiguration)?.type !== 'boolean') throw new Error(`Invalid fresh-start section configuration: ${pageKey}/${name}`);
        const sectionEnabled = !group.enabledByConfiguration || effectiveRequirementConfiguration(site, group.enabledByConfiguration) === true;
        const visibilityConditionId = fieldConditions.get(id) ?? base.visibilityConditionId ?? output.pageSections.find(section => section.key === `${pageKey}.${group.id}`)?.definition.visibilityConditionId;
        const dependencies = visibilityDependencies(visibilityConditionId);
        const definition = { ...(available[person].get(base.id) ?? base), id, ...(visibilityConditionId ? { visibilityConditionId } : {}), ...(dependencies.length ? { visibilityDependencies: dependencies } : {}) };
        output.fields = output.fields.filter(field => field.key !== id);
        output.fields.push(row('fields', id, 'requirements/parked/field-details.json', { position: output.fields.length, definition: { ...(sharedByPerson[person].get(base.id) ?? base), id } }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
        if (!group.collection && !output.pageFields.some(field => field.pageKey === pageKey && field.fieldKey === id)) output.pageFields.push(row('pageFields', `${pageKey}.${id}`, reference, { pageKey: pageKey, fieldKey: id, position: output.pageFields.filter(field => field.pageKey === pageKey).length }));
        output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.${site.key}.${pageKey}.${id}`, siteReference, scoped(site.key, { pageKey: pageKey, fieldKey: id, include: sectionEnabled && available[person].has(base.id), hidden: !sectionEnabled || !available[person].has(base.id), values: definition, position: output.siteFieldConfigurations.filter(field => field.pageKey === pageKey).length })));
      }
      for (const { name, group } of groups) {
        const person = group.for ?? 'self';
        for (const [owner, companions] of Object.entries(group.companions ?? {})) {
          if (!(group.fields ?? []).includes(owner)) throw new Error(`Unplaced companion owner: ${pageKey}/${name}/${owner}`);
          for (const fieldId of companions) {
            const id = pageAnswerKey(fieldId, person);
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
        output.fields.push(row('fields', id, 'requirements/parked/field-details.json', { definition: sharedByPerson.self.get(id) ?? definition, position: output.fields.length }));
        output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== id);
        if (fieldConditions.has(id)) {
          const owner = Object.entries(page.companions ?? {}).find(([, fields]) => fields.includes(id))?.[0];
          const included = !owner || available.self.has(owner);
          output.siteFieldConfigurations.push(row('siteFieldConfigurations', `requirements.${site.key}.${pageKey}.${id}`, siteReference, scoped(site.key, { pageKey, fieldKey: id, include: included, hidden: !included, values: { ...definition, visibilityConditionId: fieldConditions.get(id) }, position: output.siteFieldConfigurations.length })));
        }
      }
      for (const [name, surface] of Object.entries(page.surfaces ?? {})) {
        const fields = new Map(requirementSurfaceFields(surface, requirementKey, source, surface.definition ? undefined : site.key).map(field => [field.id, field]));
        const effective = surface.definition && !surface.fixture ? new Map(requirementSurfaceFields(surface, requirementKey, source, site.key).map(field => [field.id, field])) : undefined;
        const bindings = configurationValue('fieldSurfaces')[name]?.fields;
        if (!bindings) throw new Error(`Missing fresh-start field surface: ${name}`);
        for (const binding of bindings) {
          const alias = surface.aliases?.[binding.fieldKey];
          const field = fields.get(alias?.field ?? binding.fieldKey);
          if (!field) throw new Error(`Unmapped fresh-start surface field: ${name}/${binding.fieldKey}`);
          const definition = { ...field, id: binding.fieldKey, ...(alias?.label ? { label: text(alias.label) } : {}) };
          output.fields = output.fields.filter(field => field.key !== definition.id);
          output.fields.push(row('fields', definition.id, surface.fixture ? 'requirements/global/prototype-fixtures/verification.json' : reference, { definition, position: output.fields.length }));
          output.validationRules = output.validationRules.filter(rule => rule.fieldKey !== definition.id);
          if (effective) {
            const selected = effective.get(alias?.field ?? binding.fieldKey);
            const identity = `requirements.${site.key}.${pageKey}.${binding.fieldKey}`;
            const existing = output.siteFieldConfigurations.find(record => record.key === identity);
            output.siteFieldConfigurations = output.siteFieldConfigurations.filter(record => record.key !== identity);
            output.siteFieldConfigurations.push(row('siteFieldConfigurations', identity, siteReference,
              scoped(site.key, { pageKey, fieldKey: binding.fieldKey, include: existing?.include ?? null, hidden: selected ? existing?.hidden ?? false : true,
                values: selected ? { ...existing?.values, ...selected, id: binding.fieldKey, ...(alias?.label ? { label: text(alias.label) } : {}) } : {}, position: existing?.position ?? output.siteFieldConfigurations.filter(field => field.pageKey === pageKey && field.siteKey === site.key).length })));
          }
        }
      }
      for (const key of Object.keys(source.content).filter(key => key.startsWith(`${requirementKey}.`))) setContent(site, key, text(key, site.key), reference);
      for (const [key, targets] of Object.entries(source.contentBindings)) if (key.startsWith(`${requirementKey}.`)) for (const target of [targets].flat()) setContent(site, target, text(key, site.key), reference);
      for (const [section, noteKey] of Object.entries(sitePage.notes ?? {})) {
        const group = page.layout.sections[section] ?? page.layout.sections[`${section}-personal`];
        const id = group?.id ?? section;
        setContent(site, `pages.${pageKey}.sectionNotes.${id === 'spouseCoverageQuestions' ? 'spouseSection' : id}`, text(noteKey, site.key), siteReference, noteKey);
      }
      for (const [section, settings] of Object.entries(page.sections ?? {})) if (settings.note) setContent(site, `pages.${pageKey}.sectionNotes.${page.layout.sections[section]?.id ?? section}`, text(sitePage.notes?.[section] ?? settings.note, site.key), reference, sitePage.notes?.[section] ?? settings.note);
      if (page.productNotes) {
        const configurationKey = page.productNotes.configuration;
        if (!output.configurationDefinitions.some(row => row.key === configurationKey && row.definition.target?.kind === 'site-beneficiary-notes')) throw new Error(`Invalid product note configuration: ${configurationKey}`);
        const notes = Object.entries(sitePage.productNotes ?? {}).map(([productKey, note]) => {
          if (!output.siteProducts.some(row => row.siteId === site.id && row.productKey === productKey) || !Array.isArray(note.applicants) || !note.applicants.length || note.applicants.some(applicant => !['member', 'spouse'].includes(applicant) || !output.siteProductApplicants.some(row => row.siteKey === site.key && row.productKey === productKey && row.applicantKey === applicant)) || new Set(note.applicants).size !== note.applicants.length || !Array.isArray(note.sourceReferences) || !note.sourceReferences.length || note.sourceReferences.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Invalid product note assignment: ${site.key}/${pageKey}/${productKey}`);
          const wording = text(note.content, site.key);
          if (typeof wording !== 'string' || !wording.trim()) throw new Error(`Invalid product note text: ${site.key}/${pageKey}/${productKey}`);
          return { productKeys: [productKey], applicants: [...note.applicants], text: wording, sourceReferences: [...note.sourceReferences] };
        });
        output.configurationValues = output.configurationValues.filter(value => value.configurationKey !== configurationKey || !(value.siteKey === site.key || value.scope === 'client' && value.clientKey === clientKey(site)));
        if (notes.length) output.configurationValues.push(row('configurationValues', `${site.key}.${pageKey}-notes`, siteReference, scoped(site.key, { configurationKey, value: { version: 1, notes }, position: 0 })));
      }
      if (sitePage.note ?? page.note) setContent(site, `pages.${pageKey}.infoNote`, text(sitePage.note ?? page.note, site.key), siteReference, sitePage.note ?? page.note);
      for (const { group } of repeatingSections.filter(entry => entry.page.page === page.page)) {
        const assignments = Object.values(source.fields.sitePages?.[site.key] ?? {}).filter(page => Object.hasOwn(page.configurations ?? {}, group.repeats.max));
        const maxItems = assignments[0]?.configurations[group.repeats.max] ?? source.configurations.find(configuration => configuration.id === group.repeats.max)?.default;
        if (assignments.length > 1 || !Number.isSafeInteger(maxItems) || maxItems < 1 || maxItems > 100) throw new Error('Invalid fresh-start repeated list maximum');
        const collections = configurationValue('fieldCollections');
        if (maxItems !== collections[group.collection].maxItems) setConfiguration(site, 'fieldCollections', { ...collections, [group.collection]: { ...collections[group.collection], maxItems } }, reference);
      }
      if (pageKey === 'eligibility') {
        const settings = source.siteEligibility[site.key];
        {
          const tpa = settings?.tpa ?? {};
          const records = tpa.prototypeRecords ?? [];
          if (Object.keys(tpa).some(key => !['lookupFields', 'requireAddressBeforeVerification', 'prototypeRecords'].includes(key)) || !Array.isArray(records) || records.some(record => !record || !record.facts || !Object.keys(record.facts).length || Object.values(record.facts).some(value => typeof value !== 'string' || !value.trim()) || typeof record.activeCoverage !== 'boolean')) throw new Error(`Invalid fresh-start TPA fixture: ${site.key}`);
          setConfiguration(site, 'tpaIntegration.prototypeRecords', records, `requirements/parked/sites/${site.key}/eligibility.json`);
        }
      }
    }
  }
  // Approved product constraints are materialized before any consumer resolves
  // eligibility. There is no later page-only age or work-hours override.
  const properties = { 'coverage-minimum-age-days': 'minimumAgeDays', 'coverage-minimum-age-years': 'minimumAgeYears', 'coverage-maximum-age-years': 'maximumAgeYears', 'coverage-student-maximum-age-years': 'studentMaximumAgeYears', 'coverage-minimum-work-hours': 'minimumWorkHours' };
  const recoveryDefinitions = { configurations: source.configurations.filter(configuration => configuration.policyKey) };
  resumePolicy(recoveryDefinitions);
  applicationSessionPolicy(source);
  // Shared configuration definitions/defaults exist even without an enrolled Site.
  for (const [id, target] of Object.entries(source.configurationBindings)) {
    const configuration = source.configurations.find(configuration => configuration.id === id);
    if (!configuration) throw new Error(`Missing fresh-start configuration: ${id}`);
    if (configuration.policyKey && (!Number.isSafeInteger(configuration.default) || configuration.default <= 0)) throw new Error(`Invalid fresh-start configuration default: ${id}`);
    const matches = output.configurationDefinitions.filter(record => record.definition.path?.join('.') === target);
    if (matches.length > 1) throw new Error(`Ambiguous fresh-start configuration path: ${target}`);
    const key = matches[0]?.key ?? `requirements.${target}`;
    const metadata = matches[0]?.definition.metadata ?? {};
    output.configurationDefinitions = output.configurationDefinitions.filter(record => record.key !== key);
    output.configurationDefinitions.push(row('configurationDefinitions', key, 'requirements/global/configuration-bindings.json', { position: matches[0]?.position ?? output.configurationDefinitions.length, definition: {
      path: target.split('.'), metadata: { ...metadata, label: configuration.name, description: `Controls ${configuration.name.toLowerCase()}.`, scope: configuration.globalOnly ? 'Global template; Site overrides prohibited' : 'Global template', ...(configuration.globalOnly ? { globalOnly: true } : {}), defaultValue: configuration.default, options: configuration.options?.map(value => projectedConfigurationValue(configuration, value)) ?? null, sourcePath: 'requirements/global/configuration-bindings.json' },
    } }));
    output.configurationValues = output.configurationValues.filter(record => record.configurationKey !== key || !configuration.globalOnly && record.scope !== 'global');
    if (configuration.runtimeValues && (configuration.type !== 'enum' || configuration.options.some(value => typeof configuration.runtimeValues[value] !== 'string') || Object.keys(configuration.runtimeValues).some(value => !configuration.options.includes(value)))) throw new Error(`Invalid fresh-start configuration projection: ${id}`);
    output.configurationValues.push(row('configurationValues', `requirements.global.${target}`, 'requirements/global/configuration-bindings.json', { configurationKey: key, scope: 'global', siteKey: null, clientKey: null, value: structuredClone(projectedConfigurationValue(configuration, configuration.default)), position: 0 }));
  }
  for (const site of sites) {
    resumePolicy(recoveryDefinitions, definition => effectiveRequirementConfiguration(site, definition.id));
    compileCoveragePolicies(output, source, site, row, setConfiguration);
    // Template mode has one stored consumer owner: Site.templateType. The
    // compatibility features.defaultTemplate property is derived by the adapter.
    const templateDefinition = source.configurations.find(configuration => configuration.id === 'form-template');
    const templateAssignments = Object.values(source.fields.sitePages?.[site.key] ?? {}).filter(page => page.configurations && Object.hasOwn(page.configurations, 'form-template'));
    const template = templateAssignments[0]?.configurations['form-template'] ?? templateDefinition?.default;
    if (templateAssignments.length > 1 || !templateDefinition?.options?.includes(template)) throw new Error(`Invalid fresh-start configuration assignment: ${site.key}/form-template`);
    output.sites = output.sites.map(record => record.key === site.key ? { ...record, templateType: template } : record);
    for (const [id, target] of Object.entries(source.configurationBindings)) {
      const configuration = source.configurations.find(configuration => configuration.id === id);
      if (!configuration) throw new Error(`Missing fresh-start configuration: ${id}`);
      const value = effectiveRequirementConfiguration(site, id);
      if (configuration.globalOnly) continue;
      if (configuration.type === 'enum' && !configuration.options?.includes(value) || configuration.type === 'boolean' && typeof value !== 'boolean' || configuration.type === 'number' && !(value === null && configuration.default === null) && (typeof value !== 'number' || !Number.isFinite(value)) || configuration.type === 'string-list' && (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim() || configuration.options && !configuration.options.includes(item)) || new Set(value).size !== value.length)) throw new Error(`Invalid fresh-start configuration assignment: ${site.key}/${id}`);
      if (configuration.policyKey && !Number.isSafeInteger(value)) throw new Error(`Invalid fresh-start configuration assignment: ${site.key}/${id}`);
      if (configuration.type === 'number' && (configuration.minimum !== undefined && value < configuration.minimum || configuration.maximum !== undefined && value > configuration.maximum)) throw new Error(`Invalid fresh-start configuration range: ${site.key}/${id}`);
      if (id === 'eligible-states' && (value.some(code => !source.fields.optionLists['states-provinces'].some(option => option.value === code)) || effectiveRequirementConfiguration(site, 'eligible-states-only') && !value.length)) throw new Error(`Invalid fresh-start eligible states: ${site.key}`);
      if (id === 'contact-business-address-products' && value.some(key => !output.siteProducts.some(product => product.siteId === site.id && product.productKey === key && product.enabled))) throw new Error(`Invalid Contact business product scope: ${site.key}`);
      if (id === 'tpa-lookup-fields') {
        if (!value.length || value.some(id => !source.fields.fieldIds.fields.some(field => field.id === id))) throw new Error(`Invalid fresh-start TPA lookup fields: ${site.key}`);
        if (effectiveRequirementConfiguration(site, 'tpa-integration') !== 'none') {
          const lookupPage = source.pages.eligibility;
          const available = new Set(pages.filter(page => page.definition.type === 'form' && page.definition.flow === lookupPage.definition.flow && page.position <= lookupPage.position)
            .flatMap(page => page.fieldMapping ? resolveMappedFields(page.fieldMapping, { page: page.page, siteId: site.key, person: 'self', source: source.fields }) : []).map(field => field.id));
          if (value.some(field => !available.has(field))) throw new Error(`Unavailable fresh-start TPA lookup field: ${site.key}`);
          const signatures = new Set();
          for (const record of source.siteEligibility[site.key]?.tpa?.prototypeRecords ?? []) {
            if (value.some(field => typeof record.facts[field] !== 'string' || !record.facts[field].trim())) throw new Error(`Incomplete fresh-start TPA fixture: ${site.key}`);
            const signature = JSON.stringify(value.map(field => record.facts[field].trim().toLowerCase()));
            if (signatures.has(signature)) throw new Error(`Ambiguous fresh-start TPA fixture: ${site.key}`);
            signatures.add(signature);
          }
        }
      }
      setConfiguration(site, target, projectedConfigurationValue(configuration, value), 'requirements/global/configuration-bindings.json');
      const binding = output.configurationDefinitions.find(row => row.definition.path?.join('.') === target);
      const { options: _retiredOptions, ...metadata } = binding.definition.metadata ?? {};
      output.configurationDefinitions = output.configurationDefinitions.map(row => row === binding ? { ...row, definition: { ...binding.definition, metadata: { ...metadata, label: configuration.name, description: `Controls ${configuration.name.toLowerCase()}.`,
        defaultValue: configuration.default, scope: 'Global template', ...(configuration.options ? { options: configuration.options.map(value => projectedConfigurationValue(configuration, value)) } : {}), sourcePath: 'requirements/global/configuration-bindings.json' } } } : row);

    }
    const categoryNames = Object.fromEntries(Object.entries(source.siteProducts[site.key]?.categories ?? {}).filter(([, value]) => value.name !== undefined).map(([id, value]) => [id, value.name]));
    setConfiguration(site, 'coverages.categoryNames', categoryNames, `requirements/parked/sites/${site.key}/products.json#categories`);
    setConfiguration(site, 'coverages.categorySectionLabels', categoryNames, `requirements/parked/sites/${site.key}/products.json#categories`);
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
        if (['name', 'description', 'descriptionNotice', 'brochureUrl'].includes(property) && (typeof value !== 'string' || !value.trim()) || property === 'applicantNotes' && (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([person, text]) => !['member', 'spouse', 'child'].includes(person) || typeof text !== 'string' || !text.trim()))) throw new Error(`Invalid product presentation: ${definition.id}/${property}`);
        const matches = output.configurationDefinitions.filter(row => row.definition.target?.kind === 'product-presentation' && row.definition.target.productKey === definition.id && row.definition.target.property === property);
        if (matches.length > 1) throw new Error(`Ambiguous product presentation binding: ${definition.id}/${property}`);
        const path = matches[0]?.definition.path?.join('.') ?? `products.presentation.${definition.id}.${property}`;
        if (matches.length && !matches[0].definition.path) output.configurationDefinitions = output.configurationDefinitions.map(row => row === matches[0] ? { ...row, definition: { ...row.definition, path: path.split('.') } } : row);
        if (!matches.length) output.configurationDefinitions.push(row('configurationDefinitions', `requirements.${path}`, reference, { position: output.configurationDefinitions.length, definition: { path: path.split('.'), target: { kind: 'product-presentation', productKey: definition.id, property } } }));
        setConfiguration(site, path, value, reference);
      }
    }
    for (const [key, targets] of Object.entries(source.contentBindings)) for (const target of [targets].flat()) setContent(site, target, text(key, site.key), 'requirements/global/content-bindings.json');
    for (const [role, key] of [['member', 'self'], ['spouse', 'spouse'], ['child', 'child']]) {
      setConfiguration(site, `applicantLabels.${role}`, text(`people.${key}`), 'requirements/global/content/people.json');
    }
    const authored = source.siteCoverage[site.key];
    if (!authored) continue;
    const productApplicants = Object.fromEntries(output.siteProducts.filter(product => product.siteId === site.id && product.enabled)
      .map(product => [product.productKey, output.siteProductApplicants.filter(row => row.siteKey === site.key && row.productKey === product.productKey).map(row => row.applicantKey)]));
    const assignments = parseCoverageAssignments(authored, source.configurations, site.key, productApplicants);
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
  for (const page of pages) for (const key of Object.keys(source.content).filter(key => key.startsWith(`${page.page}.`))) setGlobalContent(key, source.content[key], `requirements/parked/${page.page}.json`);
  for (const [key, targets] of Object.entries(source.contentBindings)) for (const target of [targets].flat()) setGlobalContent(target, source.content[key], 'requirements/global/content-bindings.json');
  output.contentEntries = output.contentEntries.filter(entry => !globalContent.has(entry.key));
  output.contentValues = output.contentValues.filter(entry => entry.scope !== 'global' || !globalContent.has(entry.contentKey));
  for (const [key, { value, reference }] of globalContent) {
    output.contentEntries.push(row('contentEntries', key, reference, { position: output.contentEntries.length, definition: { path: key.split('.') } }));
    output.contentValues.push(row('contentValues', `requirements.global.${key}`, reference, { scope: 'global', siteKey: null, clientKey: null, contentKey: key, value: structuredClone(value), position: output.contentValues.length }));
  }
  output.contentEntries = output.contentEntries.map(entry => contentOwners.has(entry.key)
    ? { ...entry, definition: { ...entry.definition, sourceKey: contentOwners.get(entry.key) } } : entry);
  return output;
}
