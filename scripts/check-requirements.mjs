import { validateRuleTemplates } from '../src/domain/ruleTemplates.mjs';
import { canonicalContentKey, resolveContentReferences } from '../src/domain/contentReferences.mjs';
import { validatePageNotes } from '../src/domain/pageNotes.mjs';
import { compileRequirementComponents, validateRequirementComponentParts } from '../src/domain/requirementComponents.mjs';
// Checks that the requirements files map to each other correctly.
// Usage: node scripts/check-requirements.mjs [--page <id>] [--map]
//   --page <id>  prints one page's mapped sections, fields and people
//   --map        prints which pages each field is on
import fs from 'node:fs';
import { resolveAnswerKey, resolveMappedFields, validateFieldMappingConstraints } from '../src/domain/requirementFieldDefinitions.mjs';
import { parseCoverageAssignments } from '../src/domain/requirementCoverageValidation.mjs';
import { parseCoveragePolicies } from '../src/domain/requirementCoveragePolicies.mjs';
import { validateProductCatalog } from '../src/domain/requirementProductCatalog.mjs';
import { validateApplicationCatalog } from '../src/domain/requirementApplicationCatalog.mjs';
import { pricingFormulas } from '../src/domain/pricingFormulas.mjs';
import { requirementPageSections, validateRequirementOutcomeCondition, validateRequirementPageAssignments } from '../src/domain/requirementPagePresentation.mjs';
import path from 'node:path';

const root = 'requirements';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const list = dir => (fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f)) : []);
const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);
const kebab = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const PEOPLE = ['self', 'spouse', 'child', 'beneficiary'];
const OUTCOMES = ['member', 'new-member', 'not-eligible'];
const SOURCES = ['site-defined', 'site-associations', 'product-defined', 'product-range', 'product-set', 'product-fixed'];
const peopleOf = field => field.people ?? ['self'];
const pagesOf = field => field.pages ?? [];
const siteDirs = fs.existsSync(`${root}/parked/sites`) ? fs.readdirSync(`${root}/parked/sites`) : [];
// Fresh-start product definitions/defaults and Site assignments are authored
// here; the public catalog parts are no longer their source.
for (const [file, scope] of [[`${root}/global/products.json`, 'global'], ...siteDirs.map(site => [`${root}/parked/sites/${site}/products.json`, 'site'])]) {
  if (!fs.existsSync(file)) continue;
  try { validateProductCatalog(read(file).catalog, scope); } catch (error) { fail(file, error.message); }
}

// Pages: the list of ids
const pageList = read(`${root}/global/pages.json`).pages;
const pageIds = new Set(pageList.map(page => page.id));
for (const page of pageList) if (!kebab.test(page.id)) fail('pages.json', `page id ${page.id} is not lowercase with hyphens`);

// Shared component IDs and the top-level page components are separate inventories.
const componentIds = new Set();
const pageComponents = new Map();
const componentFile = `${root}/global/shared-components.json`;
for (const component of read(componentFile).components) {
  if (!kebab.test(component.id)) fail(componentFile, `invalid component id ${component.id}`);
  if (componentIds.has(component.id)) fail(componentFile, `duplicate component ${component.id}`);
  componentIds.add(component.id);
}
const sharedComponentIds = new Set(componentIds);
const application = read(`${root}/global/application.json`);
try { validateApplicationCatalog(application, 'global'); } catch (error) { fail('global/application.json', error.message); }
for (const template of application.records.emailTemplates ?? []) {
  if (template.definition.supportComponent && !sharedComponentIds.has(template.definition.supportComponent)) fail('global/application.json', `unknown email support component ${template.definition.supportComponent}`);
}
for (const page of pageList) {
  const file = `${root}/parked/${page.id}.json`;
  if (!fs.existsSync(file)) continue;
  // Field-mapping components on the page: a tree node's `mapping`, or an older draft's lowercase `type`.
  const mapped = [];
  const collect = list => { for (const component of list ?? []) { const id = component.mapping ?? (/^[a-z]/.test(component.type ?? '') ? component.type : undefined); if (id) mapped.push(id); collect(component.components); } };
  collect(read(file).components);
  pageComponents.set(page.id, mapped);
  for (const id of mapped) {
    if (sharedComponentIds.has(id)) continue;
    if (componentIds.has(id)) fail(file, `duplicate component ${id}`);
    componentIds.add(id);
  }
}
const componentMappings = new Map();
const componentFields = new Map();
const componentFiles = new Set();
const relationshipRoles = ['calculators', 'drawers', 'menus'];
for (const file of list(`${root}/mappings/components`)) {
  const mapping = read(file);
  if (!componentIds.has(mapping.component)) fail(file, `unknown component ${mapping.component}`);
  if (path.basename(file, '.json') !== mapping.component) fail(file, 'file name does not match the component id');
  if (componentFiles.has(mapping.component)) fail(file, `duplicate mapping for ${mapping.component}`);
  componentFiles.add(mapping.component);
  for (const key of Object.keys(mapping)) if (!['component', 'fields', 'constraints', ...relationshipRoles].includes(key)) fail(file, `unexpected property ${key}`);
  if (!['fields', ...relationshipRoles].some(key => Object.hasOwn(mapping, key))) fail(file, 'mapping must contain fields or role-based relationships');
  const children = [];
  const seen = new Set();
  for (const role of relationshipRoles) {
    if (!Object.hasOwn(mapping, role)) continue;
    if (!Array.isArray(mapping[role])) {
      fail(file, `${role} must be an array`);
      continue;
    }
    for (const child of mapping[role]) {
      if (!componentIds.has(child)) fail(file, `unknown component ${child}`);
      if (seen.has(child)) fail(file, `duplicate component ${child}`);
      seen.add(child);
      children.push(child);
    }
  }
  componentMappings.set(mapping.component, children);
  if (Object.hasOwn(mapping, 'fields')) {
    if (!Array.isArray(mapping.fields)) fail(file, 'fields must be an array');
    else componentFields.set(mapping.component, mapping.fields);
  }
}
const visitedComponents = new Set();
const activeComponents = new Set();
function checkComponentCycles(component) {
  if (activeComponents.has(component)) {
    fail(`${root}/mappings/components`, `component relationship cycle involving ${component}`);
    return;
  }
  if (visitedComponents.has(component)) return;
  activeComponents.add(component);
  for (const child of componentMappings.get(component) ?? []) checkComponentCycles(child);
  activeComponents.delete(component);
  visitedComponents.add(component);
}
for (const component of componentMappings.keys()) checkComponentCycles(component);

function reachableComponents(roots) {
  const reached = new Set();
  function visit(component) {
    if (reached.has(component)) return;
    reached.add(component);
    for (const child of componentMappings.get(component) ?? []) visit(child);
  }
  for (const root of roots) visit(root);
  return reached;
}

// Fields: the global list is ids only; the definitions are parked until fields are placed
const lists = read(`${root}/global/option-lists.json`);
const idsFile = `${root}/global/fields.json`;
const fieldsFile = `${root}/parked/field-details.json`;
if (Object.hasOwn(read(fieldsFile), 'bindings')) fail(fieldsFile, 'retired field binding table is not supported');
const globalIds = read(idsFile).fields.map(field => field.id);
const mappingFiles = list(`${root}/mappings/page-fields`);
const mappings = new Map();
for (const file of mappingFiles) {
  const mapping = read(file);
  if (!pageIds.has(mapping.page)) fail(file, `unknown page ${mapping.page}`);
  if (path.basename(file, '.json') !== mapping.page) fail(file, 'file name does not match the page id');
  if (mappings.has(mapping.page)) fail(file, `duplicate mapping for ${mapping.page}`);
  if (!Array.isArray(mapping.fields)) {
    fail(file, 'fields must be an array');
    continue;
  }
  mappings.set(mapping.page, mapping.fields);
}
const possiblePageFields = new Map();
for (const [page, roots] of pageComponents) {
  const entries = [];
  for (const component of reachableComponents(roots)) {
    for (const row of componentFields.get(component) ?? []) entries.push({ ...row, component });
  }
  possiblePageFields.set(page, entries);
}
const sectionMappings = new Map();
for (const file of list(`${root}/mappings/page-sections`)) {
  const mapping = read(file);
  if (!pageIds.has(mapping.page)) fail(file, `unknown page ${mapping.page}`);
  if (path.basename(file, '.json') !== mapping.page) fail(file, 'file name does not match the page id');
  if (sectionMappings.has(mapping.page)) fail(file, `duplicate mapping for ${mapping.page}`);
  if (!Array.isArray(mapping.sections)) {
    fail(file, 'sections must be an array');
    continue;
  }
  const seen = new Set();
  for (const section of mapping.sections) {
    if (typeof section !== 'string' || !kebab.test(section)) fail(file, `invalid section id ${section}`);
    if (seen.has(section)) fail(file, `duplicate section ${section}`);
    seen.add(section);
  }
  sectionMappings.set(mapping.page, mapping.sections);
}
const fields = new Map();
const detailIds = read(fieldsFile).fields.map(field => field.id);
for (const id of globalIds) if (!detailIds.includes(id)) fail(idsFile, `field ${id} has no parked definition`);
for (const id of detailIds) if (!globalIds.includes(id)) fail(fieldsFile, `field ${id} is not in the global list`);
for (const field of read(fieldsFile).fields) {
  field.pages = pageList.filter(({ id }) =>
    [...(mappings.get(id) ?? []), ...(possiblePageFields.get(id) ?? [])].some(entry => entry.field === field.id)
  ).map(({ id }) => id);
  if (fields.has(field.id)) fail(fieldsFile, `field ${field.id} is defined twice`);
  fields.set(field.id, field);
  if (!kebab.test(field.id)) fail(fieldsFile, `field id ${field.id} is not lowercase with hyphens`);
  if (!field.name) fail(fieldsFile, `field ${field.id} has no name`);
  if (field.configurations) {
    const defaults = Object.values(field.configurations).filter(c => c.default).length;
    if (defaults !== 1) fail(fieldsFile, `field ${field.id} needs exactly one default configuration`);
  } else for (const key of field.type === 'tabs' ? ['type'] : ['type', 'label']) if (!field[key]) fail(fieldsFile, `field ${field.id} has no ${key}`);
  for (const person of field.people ?? []) if (!PEOPLE.includes(person)) fail(fieldsFile, `field ${field.id} has unknown person ${person}`);
  if (field.required && typeof field.required === 'object') for (const page of Object.keys(field.required)) if (!pagesOf(field).includes(page)) fail(fieldsFile, `field ${field.id} has a required setting for ${page}, which it is not on`);
  if (field.defaultValue && typeof field.defaultValue === 'object' && !Array.isArray(field.defaultValue)) {
    for (const key of Object.keys(field.defaultValue)) if (key !== 'default' && !PEOPLE.includes(key) && !pagesOf(field).includes(key)) fail(fieldsFile, `field ${field.id} has a default value for unknown context ${key}`);
  }
  if (field.helperText && typeof field.helperText === 'object') for (const person of Object.keys(field.helperText)) if (!peopleOf(field).includes(person)) fail(fieldsFile, `field ${field.id} has helper text for ${person}, who it is not asked of`);
  const labels = [field.label, ...Object.values(field.configurations ?? {}).map(c => c.label)];
  for (const label of labels) if (label && typeof label === 'object') for (const key of Object.keys(label)) if (key !== 'default' && !peopleOf(field).includes(key) && !pagesOf(field).includes(key)) fail(fieldsFile, `field ${field.id} has a label for ${key}, which is neither a person it is asked of nor a page it is on`);
  if (!field.configurations && ['radio', 'dropdown', 'searchable-select', 'checkbox-group', 'multi-select'].includes(field.type) && !field.options) fail(fieldsFile, `field ${field.id} is a ${field.type} with no options or option source`);
  if (field.options && !Array.isArray(field.options) && !lists[field.options.list] && !SOURCES.includes(field.options)) fail(fieldsFile, `field ${field.id} uses unknown list ${field.options.list}`);
  for (const [configId, config] of Object.entries(field.configurations ?? {})) {
    if (!kebab.test(configId)) fail(fieldsFile, `configuration ${configId} of ${field.id} is not lowercase with hyphens`);
    for (const key of ['type', 'label', 'options']) if (!config[key]) fail(fieldsFile, `configuration ${configId} of ${field.id} has no ${key}`);
    if (Array.isArray(config.options)) for (const option of config.options) if (!OUTCOMES.includes(option.outcome)) fail(fieldsFile, `configuration ${configId} option ${option.value} has no valid outcome`);
    if (config.optionOutcome !== undefined && !OUTCOMES.includes(config.optionOutcome)) fail(fieldsFile, `configuration ${configId} has no valid option outcome`);
  }
  for (const page of pagesOf(field)) if (!pageIds.has(page)) fail(fieldsFile, `field ${field.id} is on unknown page ${page}`);
}
function checkFieldMappings(file, entries) {
  const seen = new Set();
  for (const entry of entries) {
    const field = fields.get(entry.field);
    if (!field) fail(file, `unknown field ${entry.field}`);
    for (const key of Object.keys(entry)) if (!['field', 'people', 'default', 'replaces'].includes(key)) fail(file, `${entry.field} has unexpected property ${key}`);
    if (entry.replaces !== undefined && (!Array.isArray(entry.replaces) || !entry.replaces.length || new Set(entry.replaces).size !== entry.replaces.length || entry.replaces.some(id => !fields.has(id) || id === entry.field))) fail(file, `${entry.field} has invalid replacement fields`);
    if (entry.default !== undefined && entry.default !== 'off') fail(file, `${entry.field} default must be "off" (fields are on unless marked)`);
    if (seen.has(entry.field)) fail(file, `duplicate field ${entry.field}`);
    seen.add(entry.field);
    if (!Array.isArray(entry.people) || entry.people.length === 0) fail(file, `${entry.field} must have a non-empty people array`);
    const seenPeople = new Set();
    for (const person of Array.isArray(entry.people) ? entry.people : []) {
      if (!PEOPLE.includes(person)) fail(file, `unknown person ${person}`);
      else if (field && !peopleOf(field).includes(person)) fail(file, `${entry.field} is not available for ${person}`);
      if (seenPeople.has(person)) fail(file, `duplicate person ${person} for ${entry.field}`);
      seenPeople.add(person);
    }
  }
}
for (const [page, entries] of mappings) checkFieldMappings(`${root}/mappings/page-fields/${page}.json`, entries);
for (const [component, entries] of componentFields) checkFieldMappings(`${root}/mappings/components/${component}.json`, entries);

// Fresh-start requirements are declarative records, not executable expressions.
const requirementRecords = new Map();
const requirementKinds = ['configurations', 'rules', 'validations', 'presentation', 'workflows', 'formulas'];
// Type-specific keys for formula records; values are checked by the shared evaluator.
const formulaTypeKeys = { 'category-rates': ['minimumMonthly', 'default', 'categories'], 'rider-factor': ['amount'], 'frequency-factors': ['factors'] };
const allRequirementIds = new Set();
const validationMessages = [];
const errorCodes = new Set(fs.existsSync(`${root}/global/error-codes.json`) ? read(`${root}/global/error-codes.json`).codes : []);
for (const kind of requirementKinds) {
  const ids = new Set();
  const records = [];
  requirementRecords.set(kind, records);
  for (const file of list(`${root}/global/${kind}`)) {
    const document = read(file);
    if (!document || typeof document !== 'object' || Array.isArray(document)) {
      fail(file, `${kind} document must be an object`);
      continue;
    }
    if (Object.keys(document).some(key => key !== kind)) fail(file, `unexpected document property for ${kind}`);
    if (!Array.isArray(document[kind])) {
      fail(file, `${kind} must be an array`);
      continue;
    }
    if (kind === 'formulas' && path.basename(file) === 'pricing.json') {
      try { pricingFormulas(document); } catch (error) { fail(file, error.message); }
    }
    for (const entry of document[kind]) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        fail(file, `${kind} entry must be an object`);
        continue;
      }
      records.push(entry);
      const where = `${file} (${entry.id})`;
      const allowed = ['id', 'name', 'status', 'source',
        ...(kind === 'configurations' ? ['type', 'options', 'default', 'format', 'replaces', 'runtimeValues', 'policyKey', 'minimum', 'maximum', 'productApplicantOverrides', 'contentProperty', 'globalOnly'] : ['statement']),
        ...(['rules', 'workflows'].includes(kind) ? ['fields', 'templates'] : []),
        ...(kind === 'rules' ? ['uses', 'replaces', 'appliesTo'] : []),
        ...(kind === 'validations' ? ['check', 'level', 'message', 'code'] : []),
        ...(kind === 'formulas' ? ['authority', 'type', ...(formulaTypeKeys[entry.type] ?? [])] : [])];
      for (const key of Object.keys(entry)) if (!allowed.includes(key)) fail(where, `unexpected property ${key}`);
      if (typeof entry.id !== 'string' || !kebab.test(entry.id)) fail(where, 'invalid requirement id');
      if (ids.has(entry.id)) fail(where, `duplicate ${kind} id ${entry.id}`);
      ids.add(entry.id);
      if (allRequirementIds.has(entry.id)) fail(where, `duplicate requirement id ${entry.id}`);
      allRequirementIds.add(entry.id);
      for (const key of ['name', 'source', ...(kind === 'configurations' ? [] : ['statement'])]) {
        if (typeof entry[key] !== 'string' || !entry[key].trim()) fail(where, `${key} must be a non-empty string`);
      }
      if (entry.replaces !== undefined && (!Array.isArray(entry.replaces) || !entry.replaces.length || new Set(entry.replaces).size !== entry.replaces.length || entry.replaces.some(key => typeof key !== 'string' || !(kind === 'configurations' ? /^[a-zA-Z][a-zA-Z0-9.-]*$/.test(key) : kebab.test(key)) || key === entry.id))) fail(where, 'replaces must list distinct retired requirement IDs');
      if (!['draft', 'confirmed'].includes(entry.status)) fail(where, 'status must be draft or confirmed');
      if (['rules', 'workflows'].includes(kind)) { try { validateRuleTemplates(entry.templates); } catch (error) { fail(where, error.message); } }
      if (entry.appliesTo !== undefined && entry.appliesTo !== 'all-pages') fail(where, 'appliesTo must be all-pages');
      if (['rules', 'workflows'].includes(kind) && /\b(prototype|storybook)\b/i.test(`${entry.name} ${entry.statement}`)) fail(where, 'System requirements must not contain project implementation commentary; keep it in project documentation');
      if (kind === 'configurations') {
        if (entry.contentProperty !== undefined && (entry.type !== 'content-map' || !['name', 'description', 'descriptionNotice', 'applicantNotes'].includes(entry.contentProperty))) fail(where, 'contentProperty must name a supported product content-map property');
        if (entry.productApplicantOverrides !== undefined && typeof entry.productApplicantOverrides !== 'boolean') fail(where, 'productApplicantOverrides must be a boolean');
        if (entry.globalOnly !== undefined && typeof entry.globalOnly !== 'boolean') fail(where, 'globalOnly must be a boolean');
        if (entry.globalOnly && entry.productApplicantOverrides) fail(where, 'global-only configurations cannot allow product/applicant overrides');
        if (entry.policyKey !== undefined && (entry.type !== 'number' || !/^[a-z][a-zA-Z0-9]*$/.test(entry.policyKey))) fail(where, 'policyKey must be a numeric configuration projection key');
        for (const bound of ['minimum', 'maximum']) if (entry[bound] !== undefined && (entry.type !== 'number' || !Number.isSafeInteger(entry[bound]) || entry[bound] < 0)) fail(where, `${bound} must be a non-negative whole number on a numeric configuration`);
        if (entry.minimum !== undefined && entry.maximum !== undefined && entry.minimum > entry.maximum) fail(where, 'minimum must not exceed maximum');
        if (entry.type === 'number' && (entry.default < entry.minimum || entry.default > entry.maximum)) fail(where, 'number default must be within its bounds');
        if (entry.runtimeValues !== undefined && (entry.type !== 'enum' || !entry.runtimeValues || typeof entry.runtimeValues !== 'object' || Array.isArray(entry.runtimeValues) || Object.keys(entry.runtimeValues).some(key => !entry.options?.includes(key)) || entry.options?.some(key => typeof entry.runtimeValues[key] !== 'string' || !entry.runtimeValues[key].trim()))) fail(where, 'runtimeValues must map every authored enum option once');
        if (entry.type !== 'string-list' && Object.hasOwn(entry, 'format')) fail(where, 'format is only supported on string-list configurations');
        if (entry.type === 'boolean') {
          if (typeof entry.default !== 'boolean') fail(where, 'boolean default must be true or false');
          if (Object.hasOwn(entry, 'options')) fail(where, 'boolean configuration must not declare options');
        } else if (entry.type === 'number') {
          if (typeof entry.default !== 'number' || !Number.isInteger(entry.default) || entry.default < 0) fail(where, 'number default must be a whole number of zero or more');
          if (Object.hasOwn(entry, 'options')) fail(where, 'number configuration must not declare options');
        } else if (entry.type === 'string-list' && Object.hasOwn(entry, 'options') && !Object.hasOwn(entry, 'format')) {
          if (!Array.isArray(entry.options) || !entry.options.length || entry.options.some(option => typeof option !== 'string' || !kebab.test(option))) fail(where, 'options must be a non-empty array of lowercase hyphenated values');
          else if (!Array.isArray(entry.default) || entry.default.some(value => !entry.options.includes(value)) || new Set(entry.default).size !== entry.default.length) fail(where, 'default must list authored options once each');
        } else if (entry.type === 'string-list') {
          const validItem = {
            'state-code': value => typeof value === 'string' && /^[A-Z]{2}$/.test(value),
            'category-code': value => ['LI', 'AD', 'DI', 'OO', 'SH'].includes(value),
            'product-id': value => typeof value === 'string' && kebab.test(value),
            'field-id': value => fields.has(value),
          }[entry.format];
          if (!validItem) fail(where, 'string-list format must be state-code, category-code, product-id or field-id');
          if (Object.hasOwn(entry, 'options')) fail(where, 'string-list configuration must not declare options');
          const checkItem = validItem ?? (value => typeof value === 'string' && /^[A-Z]{2}$/.test(value));
          if (!Array.isArray(entry.default) || entry.default.some(value => !checkItem(value))) fail(where, entry.format === 'state-code' || !validItem ? 'state-code default must be an array of two-letter uppercase codes' : `invalid ${entry.format} default`);
          else if (new Set(entry.default).size !== entry.default.length) fail(where, entry.format === 'state-code' ? 'duplicate state code' : `duplicate ${entry.format}`);
        } else if (entry.type === 'content-map') {
          if (!entry.default || Array.isArray(entry.default) || typeof entry.default !== 'object' || Object.keys(entry.default).length || Object.hasOwn(entry, 'options')) fail(where, 'content-map default must be empty: inherit canonical content');
        } else if (entry.type !== 'enum') fail(where, 'configuration type must be enum, boolean, number or string-list');
        else if (!Array.isArray(entry.options) || !entry.options.length || entry.options.some(option => typeof option !== 'string' || !option.trim())) {
          fail(where, 'options must be a non-empty array of strings');
        } else {
          if (new Set(entry.options).size !== entry.options.length) fail(where, 'duplicate configuration option');
          if (!entry.options.includes(entry.default)) fail(where, 'default must be an authored option');
        }
      } else {
        if (['rules', 'workflows'].includes(kind) && Object.hasOwn(entry, 'fields')) {
          if (!Array.isArray(entry.fields) || !entry.fields.length) fail(where, 'fields must be a non-empty array');
          else {
            if (new Set(entry.fields).size !== entry.fields.length) fail(where, 'duplicate field reference');
            for (const id of entry.fields) if (!fields.has(id)) fail(where, `unknown field ${id}`);
          }
        }
        if (kind === 'formulas') {
          if (!['mock', 'requirement'].includes(entry.authority)) fail(where, 'authority must be mock or requirement');
          if (!Object.hasOwn(formulaTypeKeys, entry.type)) fail(where, `unknown formula type ${entry.type}`);
        }
        if (kind === 'validations' && entry.level !== undefined && !['field', 'page'].includes(entry.level)) fail(where, 'level must be field or page');
        if (kind === 'validations' && entry.code !== undefined && !errorCodes.has(entry.code)) fail(where, `unknown error code ${entry.code} (see global/error-codes.json)`);
        if (kind === 'validations' && entry.message !== undefined) validationMessages.push([where, entry.message]);
        if (kind === 'validations' && !['required-fields', 'date-format', 'postal-code-format', 'field-definition', 'page-check', 'category-selection', 'product-selection'].includes(entry.check)) fail(where, `unknown validation check ${entry.check}`);
      }
    }
  }
}

const requirementMappings = new Map();
const reusableRuleIds = new Set([...requirementRecords.get('rules').map(rule => rule.id), ...read(`${root}/global/application.json`).records.rules.map(rule => rule.key)]);
for (const rule of requirementRecords.get('rules')) {
  if (rule.uses !== undefined && (!Array.isArray(rule.uses) || new Set(rule.uses).size !== rule.uses.length)) fail('global/rules', `${rule.id}: invalid shared rule references`);
  for (const reference of Array.isArray(rule.uses) ? rule.uses : []) if (!reusableRuleIds.has(reference)) fail('global/rules', `${rule.id}: unknown shared rule ${reference}`);
}
const requirementPageBindings = new Map();
for (const file of list(`${root}/mappings/requirements`)) {
  const mapping = read(file);
  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    fail(file, 'requirement mapping must be an object');
    continue;
  }
  const kinds = requirementKinds;
  for (const key of Object.keys(mapping)) if (!['component', 'pages', ...kinds].includes(key)) fail(file, `unexpected property ${key}`);
  if (!componentIds.has(mapping.component)) fail(file, `unknown component ${mapping.component}`);
  if (path.basename(file, '.json') !== mapping.component) fail(file, 'file name does not match the component id');
  if (requirementMappings.has(mapping.component)) fail(file, `duplicate requirement mapping for ${mapping.component}`);
  if (!kinds.some(kind => Object.hasOwn(mapping, kind))) fail(file, 'mapping must contain requirement references');
  if (Object.hasOwn(mapping, 'pages')) {
    if (!Array.isArray(mapping.pages) || !mapping.pages.length) fail(file, 'pages must be a non-empty array');
    else {
      const seenPages = new Set();
      for (const page of mapping.pages) {
        if (!pageIds.has(page)) fail(file, `unknown page ${page}`);
        if (seenPages.has(page)) fail(file, `duplicate page ${page}`);
        seenPages.add(page);
        const components = requirementPageBindings.get(page) ?? new Set();
        components.add(mapping.component);
        requirementPageBindings.set(page, components);
      }
    }
  }
  const bound = new Map();
  requirementMappings.set(mapping.component, bound);
  const availableFields = new Set([...reachableComponents([mapping.component])]
    .flatMap(component => (componentFields.get(component) ?? []).map(row => row.field)));
  for (const kind of kinds) {
    if (!Object.hasOwn(mapping, kind)) continue;
    if (!Array.isArray(mapping[kind])) {
      fail(file, `${kind} must be an array`);
      continue;
    }
    const seen = new Set();
    const bindings = [];
    bound.set(kind, bindings);
    for (const reference of mapping[kind]) {
      if (kind === 'validations' && (!reference || typeof reference !== 'object' || Array.isArray(reference))) {
        fail(file, 'validation binding must be an object');
        continue;
      }
      const id = kind === 'validations' ? reference.validation : reference;
      const record = requirementRecords.get(kind).find(entry => entry.id === id);
      if (typeof id !== 'string' || !record) fail(file, `unknown ${kind} reference ${id}`);
      const bindingKey = kind === 'validations' ? `${id}:${reference.trigger}` : id;
      if (seen.has(bindingKey)) fail(file, `duplicate ${kind} reference ${id}`);
      seen.add(bindingKey);
      let boundFields = Array.isArray(record?.fields) ? record.fields : [];
      if (kind === 'validations') {
        for (const key of Object.keys(reference)) if (!['validation', 'trigger', 'fields', 'scope'].includes(key)) fail(file, `unexpected validation binding property ${key}`);
        if (typeof reference.trigger !== 'string' || !kebab.test(reference.trigger)) fail(file, 'validation trigger must be a lowercase hyphenated event id');
        const hasFields = Object.hasOwn(reference, 'fields');
        const hasScope = Object.hasOwn(reference, 'scope');
        if (hasFields === hasScope) fail(file, 'validation binding must declare fields or scope, not both');
        if (hasScope && !['visible-fields', 'registered-fields', 'page', 'quote-entry-fields', 'applicable-quote-fields'].includes(reference.scope)) fail(file, `unknown validation scope ${reference.scope}`);
        if (hasFields && (!Array.isArray(reference.fields) || !reference.fields.length)) {
          fail(file, 'validation binding fields must be a non-empty array');
          continue;
        }
        boundFields = hasFields ? reference.fields : [];
        if (new Set(boundFields).size !== boundFields.length) fail(file, 'duplicate field reference');
      }
      for (const field of boundFields) {
        if (!fields.has(field)) fail(file, `unknown field ${field}`);
        else if (!availableFields.has(field)) fail(file, `field ${field} is not mapped to component ${mapping.component}`);
      }
      if (record) bindings.push({ record, fields: boundFields,
        trigger: kind === 'validations' ? reference.trigger : undefined,
        scope: kind === 'validations' ? reference.scope : undefined });
    }
  }
}

// Content
const content = new Map();
for (const file of list(`${root}/global/content`)) for (const [key, text] of Object.entries(read(file))) {
  if (content.has(key)) fail(file, `content key ${key} is defined twice`);
  if (!/^[a-z]+(\.[a-z0-9-]+){1,3}$/.test(key)) fail(file, `content key ${key} breaks the naming rule`);
  content.set(key, text);
}
try {
  const references = read(`${root}/global/content-references.json`);
  for (const [key, value] of Object.entries(resolveContentReferences(Object.fromEntries(content), references))) content.set(key, value);
} catch (error) { fail(`${root}/global/content-references.json`, error.message); }
const usedContent = new Set();
const contentReferences = read(`${root}/global/content-references.json`);
const useContent = (where, key) => { if (key === undefined) return; if (!content.has(key)) fail(where, `content ${key} does not exist`); usedContent.add(key); usedContent.add(canonicalContentKey(key, contentReferences)); };
const checkImage = (where, image) => {
  if (!image || typeof image.src !== 'string' || !/^(\/(?!\/)|https:\/\/)/.test(image.src) || typeof image.alt !== 'string' || !image.alt.trim()) { fail(where, 'image must provide a source and alternative text'); return; }
  if (image.src.startsWith('/') && fs.existsSync('public') && !fs.existsSync(path.join('public', image.src.split(/[?#]/)[0]))) fail(where, `image asset does not exist: ${image.src}`);
};
if (content.has('insurer.logo')) checkImage('insurer.logo', content.get('insurer.logo'));
for (const [where, key] of validationMessages) useContent(where, key);

// Page types and steps (parked/pages.json); order within a type is the order of global/pages.json.
const PAGE_TYPES = ['form', 'entry', 'resume', 'advisor', 'error'];
const pageMeta = read(`${root}/parked/pages.json`).pages ?? {};
for (const [id, meta] of Object.entries(pageMeta)) {
  if (!pageIds.has(id)) fail(`${root}/parked/pages.json`, `unknown page ${id}`);
  if (!PAGE_TYPES.includes(meta.type)) fail(`${root}/parked/pages.json`, `${id}: type must be one of ${PAGE_TYPES.join(', ')}`);
  if ((meta.type === 'form') !== (typeof meta.step === 'string' && meta.step.trim() !== '')) fail(`${root}/parked/pages.json`, `${id}: form pages, and only form pages, name a step`);
}
// Component names a page's component tree may use.
const componentDefinitions = Object.values(read(`${root}/global/components.json`)).flat();
const componentNames = new Set(componentDefinitions.map(component => component.name));
try { compileRequirementComponents([], componentDefinitions); } catch (error) { fail('components', error.message); }
for (const component of componentDefinitions) if (!component.displayName?.trim()) fail('components', `missing display name for ${component.name}`);
// Form inventory references the same page/component names and content owners.
const formsFile = `${root}/global/forms.json`;
const formIds = new Set();
for (const form of read(formsFile).forms ?? []) {
  if (!form.id || formIds.has(form.id)) fail(formsFile, `duplicate or missing form id ${form.id}`);
  formIds.add(form.id);
  if (!['Internal', 'External'].includes(form.hosting)) fail(formsFile, `invalid hosting for ${form.id}`);
  if (Boolean(form.target?.page) === Boolean(form.target?.component)) fail(formsFile, `${form.id} must reference one page or component`);
  if (form.target?.page && !pageIds.has(form.target.page)) fail(formsFile, `unknown form page ${form.target.page}`);
  if (form.target?.component && !componentNames.has(form.target.component)) fail(formsFile, `unknown form component ${form.target.component}`);
  if (Boolean(form.description?.content) === Boolean(form.description?.component)) fail(formsFile, `${form.id} must reference one description definition`);
  if (form.description?.content) useContent(formsFile, form.description.content);
  if (form.description?.component && !componentNames.has(form.description.component)) fail(formsFile, `unknown description component ${form.description.component}`);
  if (form.name?.content) useContent(formsFile, form.name.content);
  if (!form.usedIn?.length) fail(formsFile, `missing containing relationship for ${form.id}`);
  for (const placement of form.usedIn ?? []) {
    if ([placement.page, placement.component, placement.parentsOf].filter(Boolean).length !== 1) fail(formsFile, `invalid containing relationship for ${form.id}`);
    if (placement.page && !pageIds.has(placement.page)) fail(formsFile, `unknown placement page ${placement.page}`);
    if (placement.component && !componentNames.has(placement.component)) fail(formsFile, `unknown placement component ${placement.component}`);
    if (placement.parentsOf && !componentIds.has(placement.parentsOf)) fail(formsFile, `unknown shared form component ${placement.parentsOf}`);
  }
}
const checkCondition = (where, condition) => {
  if (!condition || typeof condition !== 'object') return;
  if (Object.hasOwn(condition, 'outcome')) {
    try { validateRequirementOutcomeCondition(condition); } catch (error) { fail(where, error.message); }
  }
  if (condition.field && !fields.has(condition.field)) fail(where, `condition uses unknown field ${condition.field}`);
  if (condition.of && !PEOPLE.includes(condition.of)) fail(where, `condition uses unknown person ${condition.of}`);
  for (const nested of condition.any ?? []) checkCondition(where, nested);
};

// Bindings project one authored fact into the existing consumer contract.
for (const [file, resolve] of [
  ['content-bindings.json', id => useContent(`${root}/global/content-bindings.json`, id)],
  ['configuration-bindings.json', id => { if (!requirementRecords.get('configurations').some(row => row.id === id)) fail(`${root}/global/configuration-bindings.json`, `unknown configuration ${id}`); }],
]) {
  const targets = new Set();
  for (const [id, binding] of Object.entries(read(`${root}/global/${file}`))) {
    resolve(id);
    for (const target of file === 'content-bindings.json' ? [binding].flat() : [binding]) {
      if (typeof target !== 'string' || !target.split('.').every(part => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(part) && !['constructor', 'prototype', '__proto__'].includes(part))) fail(file, `invalid consumer path ${target}`);
      if (targets.has(target)) fail(file, `duplicate consumer path ${target}`);
      targets.add(target);
    }
  }
}

// Reviewed pages own complete layout; unreviewed drafts may still refer to legacy.
const parkedByPage = new Map();
for (const file of list(`${root}/parked`).filter(f => !['pages.json', 'fields.json', 'field-details.json', 'page-details.json'].includes(path.basename(f)))) {
  const pageDraft = read(file);
  if (Object.hasOwn(pageDraft, 'fieldBindings') || Object.hasOwn(pageDraft, 'looseFields')) fail(file, 'retired page field bindings are not supported');
  try { resolveAnswerKey('field', 'self', pageDraft.answerKeyPatterns); } catch (error) { fail(file, error.message); }
  const legacyFile = `${root}/parked/legacy/${pageDraft.page}.json`;
  if (pageDraft.definition && pageDraft.layout && fs.existsSync(legacyFile)) fail(file, 'reviewed page must not have a legacy source');
  const parked = fs.existsSync(legacyFile) ? { ...read(legacyFile), ...pageDraft } : pageDraft;
  parkedByPage.set(parked.page, parked);
  if (parked.definition && parked.layout) {
    try { requirementPageSections(parked, Object.fromEntries(sectionMappings)); } catch (error) { fail(file, error.message); }
  }
  useContent(file, parked.note);
  if (!pageIds.has(parked.page)) { fail(file, `page ${parked.page} is not in pages.json`); continue; }
  if (path.basename(file, '.json') !== parked.page) fail(file, 'file name does not match the page id');

  for (const key of Object.values(parked.content ?? {}).flat()) useContent(file, key);
  for (const [key, slot] of Object.entries(parked.contentSlots ?? {})) {
    useContent(file, key);
    if (!slot.name || !parked.content?.wording?.includes(key)) fail(file, `invalid configurable content slot: ${key}`);
    if (slot.kind && !['image', 'notice', 'notes'].includes(slot.kind)) fail(file, `unknown content slot kind: ${key}`);
    if (slot.kind === 'notes') { try { validatePageNotes(content.get(key)); } catch (error) { fail(file, `${key}: ${error.message}`); } }
    if (slot.kind === 'image') checkImage(`${file} (${key})`, content.get(key));
    if (slot.requiredWhen) {
      const { configuration, properties, equals = true } = slot.requiredWhen;
      const definition = requirementRecords.get('configurations').find(row => row.id === configuration);
      const validCondition = definition?.type === 'boolean' ? typeof equals === 'boolean' : definition?.type === 'enum' && definition.options?.includes(equals);
      const validShape = properties === undefined ? typeof content.get(key) === 'string' : Array.isArray(properties) && properties.length && properties.every(property => typeof property === 'string' && typeof content.get(key)?.[property] === 'string');
      if (!validCondition || !validShape) fail(file, `invalid conditional content requirement: ${key}`);
    }
  }
  for (const help of parked.help ?? []) { useContent(file, help.chip ?? help); useContent(file, help.text); useContent(file, help.title); }

  try { validateRequirementComponentParts(parked.components, componentDefinitions); } catch (error) { fail(file, error.message); }
  const checkComponents = list => { for (const component of list ?? []) {
    for (const fieldId of component.fields ?? []) if (!fields.has(fieldId)) fail(file, `component ${component.type} uses unknown field ${fieldId}`);
    // Lowercase types are field-mapping components (older drafts); named types come from global/components.json.
    if (/^[A-Z]/.test(component.type ?? '') && !component.partOf && !componentNames.has(component.type)) fail(file, `component ${component.type} is not in global/components.json`);
    if (component.mapping !== undefined && !componentIds.has(component.mapping)) fail(file, `component ${component.type} maps unknown component ${component.mapping}`);
    if (component.section !== undefined && !parked.layout?.sections?.[component.section]) fail(file, `component ${component.type} is in unknown section ${component.section}`);
    if (component.dialog !== undefined && !parked.layout?.dialogs?.[component.dialog]) fail(file, `component ${component.type} is in unknown dialog ${component.dialog}`);
    checkComponents(component.components);
  } };
  checkComponents(parked.components);
  for (const [field, details] of Object.entries(parked.questionDetails ?? {})) {
    if (!parked.layout?.sections?.questions?.fields?.includes(field) || !parked.surfaces?.[details.surface] || !['assistance', 'fall', 'condition', 'general'].includes(details.summary)) fail(file, `invalid health question details: ${field}`);
  }
  for (const [name, surface] of Object.entries(parked.surfaces ?? {})) {
    if (!surface.definition) continue;
    const where = `${file} (${name})`;
    useContent(where, surface.definition.label);
    useContent(where, surface.definition.libraryGroup?.label);
    const person = surface.for ?? 'self';
    if (!PEOPLE.includes(person)) fail(where, `unknown surface person ${person}`);
    const mapping = surface.fixture === 'verification' ? read(`${root}/global/prototype-fixtures/verification.json`).questions.map(question => ({ field: question.id, people: ['self'] })) : surface.mapping?.component ? componentFields.get(surface.mapping.component) : mappings.get(surface.mapping?.page);
    if (!mapping) fail(where, 'unknown surface field mapping');
    if (surface.fixture && (surface.fixture !== 'verification' || surface.mapping)) fail(where, 'invalid surface fixture');
    if (surface.dialog && !parked.layout?.dialogs?.[surface.dialog]) fail(where, 'unknown surface dialog');
    const placed = new Set([...(parked.controls ?? []), ...Object.values(parked.layout?.dialogs ?? {}).filter(group => (group.for ?? 'self') === person).flatMap(group => group.fields ?? [])]);
    if (surface.kind === 'tool' || surface.kind === 'controls' || surface.dialog) for (const field of mapping ?? []) if (field.people.includes(person)) placed.add(field.field);
    if (!Array.isArray(surface.definition.fields) || !surface.definition.fields.length) fail(where, 'surface must list fields');
    for (const binding of surface.definition.fields ?? []) {
      const canonical = surface.aliases?.[binding.fieldKey]?.field ?? binding.fieldKey;
      if (!mapping?.some(row => row.field === canonical && row.people.includes(person)) || !placed.has(canonical)) fail(where, `unmapped dialog field ${canonical}`);
    }
  }
  for (const [name, collection] of Object.entries(parked.collections ?? {})) {
    const where = `${file} (${name})`;
    if (!parked.surfaces?.[collection.surface]?.definition?.maxItems || !parked.layout?.sections?.[collection.section]?.id) fail(where, 'collection must reuse a declared surface and section');
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(collection.storageName ?? '') || ['constructor', 'prototype', '__proto__'].includes(collection.storageName)) fail(where, 'invalid collection storage name');
    useContent(where, collection.libraryGroup?.label);
    if (collection.libraryGroup?.applicant && !PEOPLE.includes(collection.libraryGroup.applicant)) fail(where, 'unknown collection applicant');
    if (collection.libraryGroup?.afterFieldKey && !fields.has(collection.libraryGroup.afterFieldKey.replace(/^(spouse|child)-/, ''))) fail(where, 'unknown collection placement field');
  }
  let sectionGroups = Object.entries(parked.layout?.sections ?? {});
  if (parked.definition && parked.layout) {
    try { sectionGroups = requirementPageSections(parked, Object.fromEntries(sectionMappings)); } catch { /* Reported above. */ }
  }
  const groups = [...sectionGroups.map(([id, g]) => ({ id, g, kind: 'section' })), ...Object.entries(parked.layout?.dialogs ?? {}).map(([id, g]) => ({ id, g, kind: 'dialog' }))];
  const placements = new Set();
  const fieldMapping = parked.fieldMapping;
  const mapped = fieldMapping && (fieldMapping.component ? componentFields.get(fieldMapping.component) : mappings.get(fieldMapping.page));
  if (fieldMapping && !mapped) fail(file, 'unknown reviewed page field mapping');
  for (const id of [...(parked.controls ?? []), ...Object.values(parked.companions ?? {}).flat()]) {
    if (!mapped?.some(row => row.field === id && row.people.includes('self'))) fail(file, `unmapped page control ${id}`);
  }
  for (const { id, g, kind } of groups) {
    if (!kebab.test(id)) fail(file, `${kind} id ${id} is not lowercase with hyphens`);
    if (!PEOPLE.includes(g.for ?? 'self')) fail(file, `${kind} ${id} is for unknown person ${g.for}`);
    if (fieldMapping) {
      useContent(file, g.title);
      for (const field of g.fields ?? []) {
        if (!mapped?.some(row => row.field === field && row.people.includes(g.for ?? 'self'))) fail(file, `unmapped layout field ${field} for ${g.for ?? 'self'}`);
        const key = `${g.for ?? 'self'}:${field}`;
        if (placements.has(key)) fail(file, `duplicate layout field ${key}`);
        placements.add(key);
      }
      for (const [owner, companions] of Object.entries(g.companions ?? {})) {
        if (!(g.fields ?? []).includes(owner)) fail(file, `unplaced companion owner ${owner}`);
        if (!Array.isArray(companions) || !companions.length || new Set(companions).size !== companions.length) fail(file, `invalid companion list for ${owner}`);
        for (const field of Array.isArray(companions) ? companions : []) if (!mapped?.some(row => row.field === field && row.people.includes(g.for ?? 'self'))) fail(file, `unmapped companion ${field} for ${g.for ?? 'self'}`);
      }
      for (const condition of g.when ? g.when.all ?? [g.when] : []) {
        if (!fields.has(condition.field?.replace(/^(spouse|child)-/, ''))) fail(file, `unknown layout condition field ${condition.field}`);
        if (condition.of && !PEOPLE.includes(condition.of)) fail(file, `unknown layout condition person ${condition.of}`);
      }
      if (g.repeats) {
        useContent(file, g.repeats.item);
        useContent(file, g.repeats.libraryLabel);
        if (!requirementRecords.get('configurations').some(row => row.id === g.repeats.max && row.type === 'number')) fail(file, `unknown collection maximum ${g.repeats.max}`);
      }
    }
  }
  for (const [id, section] of Object.entries(parked.sections ?? {})) {
    if (!parked.layout?.sections?.[id]) fail(file, `parked section ${id} is not on the page`);
    useContent(file, section.title); useContent(file, section.applicantTitle); useContent(file, section.note);
    for (const key of section.content ?? []) useContent(file, key);
    for (const key of Object.values(section.feedback ?? {}).flat()) useContent(file, key);
  }
  for (const [id, dialog] of Object.entries(parked.dialogs ?? {})) {
    if (!parked.layout?.dialogs?.[id]) fail(file, `parked dialog ${id} is not on the page`);
    for (const key of [dialog.title, dialog.editTitle, dialog.message, dialog.confirm, dialog.cancel]) useContent(file, key);
  }
  const rules = parked.shownWhen ?? {};
  for (const transition of Object.values(parked.transitions ?? {})) {
    if (!transition.id || !transition.trigger || !Array.isArray(transition.fieldMappings)) { fail(file, 'invalid page transition'); continue; }
    for (const mapping of transition.fieldMappings) {
      if (!fields.has(mapping.source) || !mapped?.some(row => row.field === mapping.targetFieldId)) fail(file, `unmapped transition field ${mapping.source} → ${mapping.targetFieldId}`);
      if (!['always', 'if-empty'].includes(mapping.overwrite)) fail(file, `invalid transition overwrite ${mapping.overwrite}`);
    }
  }
  for (const [id, condition] of Object.entries(rules.sections ?? {})) {
    if (!parked.layout?.sections?.[id]) fail(file, `rule for section ${id}, which is not on the page`);
    checkCondition(file, condition);
  }
  for (const [id, condition] of Object.entries(rules.dialogs ?? {})) {
    if (!parked.layout?.dialogs?.[id]) fail(file, `rule for dialog ${id}, which is not on the page`);
    checkCondition(file, condition);
  }
  for (const rule of rules.fields ?? []) {
    if (!fields.has(rule.field)) fail(file, `rule for unknown field ${rule.field}`);
    else if (!pagesOf(fields.get(rule.field)).includes(parked.page)) fail(file, `rule: ${rule.field} is not on page ${parked.page}`);
    if (rule.section && !parked.layout?.sections?.[rule.section]) fail(file, `rule for unknown section ${rule.section}`);
    if (rule.dialog && !parked.layout?.dialogs?.[rule.dialog]) fail(file, `rule for unknown dialog ${rule.dialog}`);
    checkCondition(file, rule.shownWhen);
  }
}

// Sites: only what differs
for (const site of siteDirs) {
  const dir = `${root}/parked/sites/${site}`;
  if (fs.existsSync(`${dir}/coverage-policies.json`)) {
    try { parseCoveragePolicies(read(`${dir}/coverage-policies.json`), site); }
    catch (error) { fail(`${dir}/coverage-policies.json`, error.message); }
  }
  const policyFile = `${dir}/coverage.json`;
  if (fs.existsSync(policyFile)) {
    try {
      const products = read(`${dir}/products.json`).catalog;
      const productApplicants = Object.fromEntries(products.siteProducts.filter(row => row.enabled).map(row => [row.productKey, products.siteProductApplicants.filter(other => other.productKey === row.productKey).map(other => other.applicantKey)]));
      parseCoverageAssignments(read(policyFile), requirementRecords.get('configurations'), site, productApplicants);
    } catch (error) { fail(policyFile, error.message); }
  }
  if (fs.existsSync(`${dir}/pages.json`)) for (const id of Object.keys(read(`${dir}/pages.json`).pages ?? {})) if (!pageIds.has(id)) fail(`${dir}/pages.json`, `unknown page ${id}`);
  if (fs.existsSync(`${dir}/fields.json`)) for (const [id, override] of Object.entries(read(`${dir}/fields.json`).fields ?? {})) {
    const field = fields.get(id);
    if (!field) { fail(`${dir}/fields.json`, `unknown field ${id}`); continue; }
    for (const configuration of typeof override.configuration === 'object' ? Object.values(override.configuration) : [override.configuration].filter(Boolean))
      if (!(field.configurations ?? {})[configuration]) fail(`${dir}/fields.json`, `${id} has no configuration ${configuration}`);
    if (override.options && Array.isArray(override.options)) {
      // Category configurations accept effective-Site choices with semantic
      // outcomes. The shared resolver below validates their shape and outcomes.
      if (field.configurations?.[override.configuration]?.options === 'site-defined') continue;
      const values = Array.isArray(field.options) ? field.options.map(o => o.value) : lists[field.options?.list]?.map(o => o.value) ?? [];
      for (const value of override.options) if (!values.includes(value)) fail(`${dir}/fields.json`, `${id} has no option ${value}`);
    }
  }
  for (const file of list(`${dir}/pages`)) {
    const override = read(file);
    if (!parkedByPage.has(override.page)) { fail(file, `no layout for page ${override.page}`); continue; }
    for (const key of Object.keys(override.content ?? {})) {
      const slot = parkedByPage.get(override.page)?.contentSlots?.[key];
      if (!slot) fail(file, `undeclared configurable content slot: ${key}`);
      if (slot?.kind === 'image') checkImage(`${file} (${key})`, override.content[key]);
    }
    useContent(file, override.note);
    for (const key of Object.values(override.notes ?? {})) useContent(file, key);
    for (const [product, assignment] of Object.entries(override.productNotes ?? {})) {
      useContent(file, assignment.content);
      if (!parkedByPage.get(override.page)?.productNotes) fail(file, `page does not declare product notes for ${product}`);
      const catalog = read(`${dir}/products.json`).catalog;
      if (!catalog.siteProducts.some(row => row.productKey === product) || !Array.isArray(assignment.applicants) || !assignment.applicants.length || assignment.applicants.some(applicant => !['member', 'spouse'].includes(applicant) || !catalog.siteProductApplicants.some(row => row.productKey === product && row.applicantKey === applicant))) fail(file, `invalid product note applicant scope: ${product}`);
    }
    const onPage = new Map([...(mappings.get(override.page) ?? []), ...(possiblePageFields.get(override.page) ?? [])].map(row => [row.field, row]));
    for (const [key, off] of [['include', true], ['hide', false]]) {
      if (override[key] === undefined) continue;
      if (!Array.isArray(override[key])) { fail(file, `${key} must be a list of field ids`); continue; }
      for (const id of override[key]) {
        const row = onPage.get(id);
        if (!row) fail(file, `${key} names ${id}, which is not on ${override.page}`);
        else if ((row.default === 'off') !== off) fail(file, off ? `include names ${id}, which is already on by default` : `hide names ${id}, which is already off by default`);
      }
    }
  }
}

const constraintSource = {
  fieldIds: read(idsFile), fieldDetails: read(fieldsFile), optionLists: lists,
  pageMappings: Object.fromEntries([...parkedByPage.values()].filter(page => page.fieldMapping).map(page => [page.page, page.fieldMapping])),
  mappings: [...list(`${root}/mappings/components`), ...mappingFiles].map(read),
  sites: Object.fromEntries(siteDirs.map(site => [site, fs.existsSync(`${root}/parked/sites/${site}/fields.json`) ? read(`${root}/parked/sites/${site}/fields.json`) : {}])),
  sitePages: Object.fromEntries(siteDirs.map(site => [site, Object.fromEntries(list(`${root}/parked/sites/${site}/pages`).map(file => [path.basename(file, '.json'), read(file)]))])),
};
for (const mapping of constraintSource.mappings.filter(mapping => mapping.constraints !== undefined)) {
  try {
    validateFieldMappingConstraints(mapping);
    const pages = [...parkedByPage.values()].filter(page => mapping.component ? page.fieldMapping?.component === mapping.component : page.page === mapping.page);
    for (const page of pages) for (const siteId of [undefined, ...siteDirs]) for (const person of new Set(mapping.fields.flatMap(row => row.people)))
      resolveMappedFields(mapping, { page: page.page, siteId, person, source: constraintSource });
  } catch (error) { fail('mapping constraints', error.message); }
}
try { validateRequirementPageAssignments([...parkedByPage.values()].filter(page => page.definition && page.layout), read(`${root}/parked/pages.json`), constraintSource.sitePages); }
catch (error) { fail('page constraints', error.message); }
for (const [siteId, pages] of Object.entries(constraintSource.sitePages)) for (const [pageKey, assignment] of Object.entries(pages)) if (assignment.fieldParticipation !== undefined) {
  try {
    const mapping = parkedByPage.get(pageKey)?.fieldMapping;
    if (!mapping) throw new Error(`Missing mapped page for scoped field participation: ${pageKey}`);
    for (const person of PEOPLE) resolveMappedFields(mapping, { page: pageKey, siteId, person, source: constraintSource });
  } catch (error) { fail(`scoped fields ${siteId}/${pageKey}`, error.message); }
}

for (const key of content.keys()) if (!usedContent.has(key)) fail('content', `${key} is not used by any page or form`);

const pageArg = process.argv.indexOf('--page');
if (pageArg > -1) {
  const id = process.argv[pageArg + 1];
  const onPage = [...fields.values()].filter(f => pagesOf(f).includes(id));
  console.log(`\n${id}:`);
  if (sectionMappings.has(id)) {
    console.log('\n  sections');
    for (const section of sectionMappings.get(id)) console.log(`    ${section}`);
  } else console.log('\n  sections not yet mapped');
  console.log(`\n  ${onPage.length} possible field(s)`);
  for (const row of mappings.get(id) ?? []) {
    const f = fields.get(row.field);
    if (!f) continue;
    const type = f.type ?? Object.values(f.configurations ?? {}).find(c => c.default)?.type ?? '?';
    for (const person of Array.isArray(row.people) ? row.people : []) {
      console.log(`    ${f.id.padEnd(32)} ${type.padEnd(17)} ${f.required ? 'required' : 'optional'}  ${person}`);
    }
  }
  const componentRows = possiblePageFields.get(id) ?? [];
  if (componentRows.length) console.log('\n  component fields (possible; visibility not evaluated)');
  for (const row of componentRows) {
    const f = fields.get(row.field);
    if (!f) continue;
    const type = f.type ?? Object.values(f.configurations ?? {}).find(c => c.default)?.type ?? '?';
    for (const person of Array.isArray(row.people) ? row.people : []) {
      console.log(`    ${f.id.padEnd(32)} ${type.padEnd(17)} ${f.required ? 'required' : 'optional'}  ${person}  [${row.component}]${row.default === 'off' ? '  default off' : ''}`);
    }
  }
  for (const site of siteDirs) {
    const file = `${root}/parked/sites/${site}/pages/${id}.json`;
    if (!fs.existsSync(file)) continue;
    const { include = [], hide = [] } = read(file);
    if (include.length || hide.length) console.log(`\n  ${site}: ${[include.length ? `includes ${include.join(', ')}` : '', hide.length ? `hides ${hide.join(', ')}` : ''].filter(Boolean).join('; ')}`);
  }
  const pageRequirementComponents = reachableComponents(pageComponents.get(id) ?? []);
  for (const component of requirementPageBindings.get(id) ?? []) pageRequirementComponents.add(component);
  for (const kind of requirementRecords.keys()) {
    console.log(`\n  ${kind}`);
    let count = 0;
    for (const component of pageRequirementComponents) {
      for (const { record: entry, fields: boundFields, trigger, scope } of requirementMappings.get(component)?.get(kind) ?? []) {
        count++;
        console.log(`    ${entry.id} [${entry.status}]: ${entry.name} [${component}]`);
        if (boundFields.length) console.log(`      fields: ${boundFields.join(', ')}`);
        if (trigger) console.log(`      trigger: ${trigger}`);
        if (scope) console.log(`      scope: ${scope}`);
        if (kind === 'configurations') console.log(`      default: ${entry.default}${entry.type === 'enum' ? `; options: ${(Array.isArray(entry.options) ? entry.options : []).join(', ')}` : ''}`);
        else console.log(`      ${entry.statement}`);
        console.log(`      source: ${entry.source}`);
      }
    }
    if (!count) console.log('    not yet mapped');
  }
}
if (process.argv.includes('--map')) {
  console.log('\nPages where each field may be available (visibility not evaluated):');
  for (const field of fields.values()) console.log(`  ${field.id.padEnd(34)} ${pagesOf(field).join(', ')}`);
}

// Change log: one entry per agreed change, numbered in order.
const changelogFile = `${root}/changelog.json`;
const changelog = fs.existsSync(changelogFile) ? read(changelogFile) : null;
if (!changelog || Object.keys(changelog).join() !== 'changes' || !Array.isArray(changelog.changes)) fail(changelogFile, 'must contain only a changes array');
else changelog.changes.forEach((change, index) => {
  const expectedId = `CHG-${String(index + 1).padStart(3, '0')}`;
  if (!change || typeof change !== 'object' || Array.isArray(change)) return fail(changelogFile, `entry ${index + 1} must be an object`);
  if (change.id !== expectedId) fail(changelogFile, `entry ${index + 1} must have id ${expectedId}`);
  for (const key of Object.keys(change)) if (!['id', 'description', 'reason'].includes(key)) fail(changelogFile, `${change.id} has unexpected property ${key}`);
  for (const key of ['description', 'reason']) if (typeof change[key] !== 'string' || !change[key].trim()) fail(changelogFile, `${change.id} needs a ${key}`);
});

console.log(`${pageList.length} pages, ${fields.size} fields, ${content.size} content keys, ${siteDirs.length} site(s).`);
if (problems.length) { console.log(`\n${problems.length} problem(s):`); for (const p of problems) console.log(' -', p); process.exit(1); }
console.log('Requirements map correctly.');
