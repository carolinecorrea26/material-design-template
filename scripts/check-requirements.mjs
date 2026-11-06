// Checks that the requirements files map to each other correctly.
// Usage: node scripts/check-requirements.mjs [--page <id>] [--map]
//   --page <id>  prints one page's mapped sections, fields and people
//   --map        prints which pages each field is on
import fs from 'node:fs';
import { pricingFormulas } from '../src/domain/pricingFormulas.mjs';
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
for (const page of pageList) {
  const file = `${root}/parked/${page.id}.json`;
  if (!fs.existsSync(file)) continue;
  const components = read(file).components ?? [];
  pageComponents.set(page.id, components.map(component => component.type));
  for (const component of components) {
    if (componentIds.has(component.type)) fail(file, `duplicate component ${component.type}`);
    componentIds.add(component.type);
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
  for (const key of Object.keys(mapping)) if (!['component', 'fields', ...relationshipRoles].includes(key)) fail(file, `unexpected property ${key}`);
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
  if (field.helperText && typeof field.helperText === 'object') for (const person of Object.keys(field.helperText)) if (!peopleOf(field).includes(person)) fail(fieldsFile, `field ${field.id} has helper text for ${person}, who it is not asked of`);
  const labels = [field.label, ...Object.values(field.configurations ?? {}).map(c => c.label)];
  for (const label of labels) if (label && typeof label === 'object') for (const key of Object.keys(label)) if (key !== 'default' && !peopleOf(field).includes(key) && !pagesOf(field).includes(key)) fail(fieldsFile, `field ${field.id} has a label for ${key}, which is neither a person it is asked of nor a page it is on`);
  if (!field.configurations && ['radio', 'dropdown', 'searchable-select', 'checkbox-group', 'multi-select'].includes(field.type) && !field.options) fail(fieldsFile, `field ${field.id} is a ${field.type} with no options or option source`);
  if (field.options && !Array.isArray(field.options) && !lists[field.options.list] && !SOURCES.includes(field.options)) fail(fieldsFile, `field ${field.id} uses unknown list ${field.options.list}`);
  for (const [configId, config] of Object.entries(field.configurations ?? {})) {
    if (!kebab.test(configId)) fail(fieldsFile, `configuration ${configId} of ${field.id} is not lowercase with hyphens`);
    for (const key of ['type', 'label', 'options']) if (!config[key]) fail(fieldsFile, `configuration ${configId} of ${field.id} has no ${key}`);
    if (Array.isArray(config.options)) for (const option of config.options) if (!OUTCOMES.includes(option.outcome)) fail(fieldsFile, `configuration ${configId} option ${option.value} has no valid outcome`);
  }
  for (const page of pagesOf(field)) if (!pageIds.has(page)) fail(fieldsFile, `field ${field.id} is on unknown page ${page}`);
}
function checkFieldMappings(file, entries) {
  const seen = new Set();
  for (const entry of entries) {
    const field = fields.get(entry.field);
    if (!field) fail(file, `unknown field ${entry.field}`);
    for (const key of Object.keys(entry)) if (!['field', 'people'].includes(key)) fail(file, `${entry.field} has unexpected property ${key}`);
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
        ...(kind === 'configurations' ? ['type', 'options', 'default', 'format'] : ['statement']),
        ...(['rules', 'workflows'].includes(kind) ? ['fields'] : []),
        ...(kind === 'validations' ? ['check'] : []),
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
      if (!['draft', 'confirmed'].includes(entry.status)) fail(where, 'status must be draft or confirmed');
      if (kind === 'configurations') {
        if (entry.type !== 'string-list' && Object.hasOwn(entry, 'format')) fail(where, 'format is only supported on string-list configurations');
        if (entry.type === 'boolean') {
          if (typeof entry.default !== 'boolean') fail(where, 'boolean default must be true or false');
          if (Object.hasOwn(entry, 'options')) fail(where, 'boolean configuration must not declare options');
        } else if (entry.type === 'string-list') {
          if (entry.format !== 'state-code') fail(where, 'string-list format must be state-code');
          if (Object.hasOwn(entry, 'options')) fail(where, 'string-list configuration must not declare options');
          if (!Array.isArray(entry.default) || entry.default.some(value => typeof value !== 'string' || !/^[A-Z]{2}$/.test(value))) fail(where, 'state-code default must be an array of two-letter uppercase codes');
          else if (new Set(entry.default).size !== entry.default.length) fail(where, 'duplicate state code');
        } else if (entry.type !== 'enum') fail(where, 'configuration type must be enum, boolean or string-list');
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
        if (kind === 'validations' && !['required-fields', 'date-format', 'field-definition', 'page-check', 'category-selection', 'product-selection'].includes(entry.check)) fail(where, `unknown validation check ${entry.check}`);
      }
    }
  }
}

const requirementMappings = new Map();
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
const usedContent = new Set();
const useContent = (where, key) => { if (key === undefined) return; if (!content.has(key)) fail(where, `content ${key} does not exist`); usedContent.add(key); };
const checkCondition = (where, condition) => {
  if (!condition || typeof condition !== 'object') return;
  if (condition.field && !fields.has(condition.field)) fail(where, `condition uses unknown field ${condition.field}`);
  if (condition.of && !PEOPLE.includes(condition.of)) fail(where, `condition uses unknown person ${condition.of}`);
  for (const nested of condition.any ?? []) checkCondition(where, nested);
};

// Parked: layout (sections, order), content links, help, behavior and conditions. Placed when those are reviewed.
const parkedByPage = new Map();
for (const file of list(`${root}/parked`).filter(f => !['pages.json', 'fields.json', 'field-details.json', 'page-details.json'].includes(path.basename(f)))) {
  const pageDraft = read(file);
  const legacyFile = `${root}/parked/legacy/${pageDraft.page}.json`;
  const parked = fs.existsSync(legacyFile) ? { ...read(legacyFile), ...pageDraft } : pageDraft;
  parkedByPage.set(parked.page, parked);
  if (!pageIds.has(parked.page)) { fail(file, `page ${parked.page} is not in pages.json`); continue; }
  if (path.basename(file, '.json') !== parked.page) fail(file, 'file name does not match the page id');

  for (const key of Object.values(parked.content ?? {}).flat()) useContent(file, key);
  for (const help of parked.help ?? []) { useContent(file, help.chip ?? help); useContent(file, help.text); }

  const checkComponents = list => { for (const component of list ?? []) { for (const fieldId of component.fields ?? []) if (!fields.has(fieldId)) fail(file, `component ${component.type} uses unknown field ${fieldId}`); checkComponents(component.components); } };
  checkComponents(parked.components);
  const groups = [...Object.entries(parked.layout?.sections ?? {}).map(([id, g]) => ({ id, g, kind: 'section' })), ...Object.entries(parked.layout?.dialogs ?? {}).map(([id, g]) => ({ id, g, kind: 'dialog' }))];
  for (const { id, g, kind } of groups) {
    if (!kebab.test(id)) fail(file, `${kind} id ${id} is not lowercase with hyphens`);
    if (!PEOPLE.includes(g.for ?? 'self')) fail(file, `${kind} ${id} is for unknown person ${g.for}`);
  }
  for (const [id, section] of Object.entries(parked.sections ?? {})) {
    if (!parked.layout?.sections?.[id]) fail(file, `parked section ${id} is not on the page`);
    useContent(file, section.title); useContent(file, section.applicantTitle);
    for (const key of section.content ?? []) useContent(file, key);
    for (const key of Object.values(section.feedback ?? {}).flat()) useContent(file, key);
  }
  for (const [id, dialog] of Object.entries(parked.dialogs ?? {})) {
    if (!parked.layout?.dialogs?.[id]) fail(file, `parked dialog ${id} is not on the page`);
    for (const key of [dialog.title, dialog.editTitle, dialog.message, dialog.confirm, dialog.cancel]) useContent(file, key);
  }
  const rules = parked.shownWhen ?? {};
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
  if (fs.existsSync(`${dir}/pages.json`)) for (const id of Object.keys(read(`${dir}/pages.json`).pages ?? {})) if (!pageIds.has(id)) fail(`${dir}/pages.json`, `unknown page ${id}`);
  if (fs.existsSync(`${dir}/fields.json`)) for (const [id, override] of Object.entries(read(`${dir}/fields.json`).fields ?? {})) {
    const field = fields.get(id);
    if (!field) { fail(`${dir}/fields.json`, `unknown field ${id}`); continue; }
    if (override.configuration && !(field.configurations ?? {})[override.configuration]) fail(`${dir}/fields.json`, `${id} has no configuration ${override.configuration}`);
    if (override.options && Array.isArray(override.options)) {
      const values = Array.isArray(field.options) ? field.options.map(o => o.value) : lists[field.options?.list]?.map(o => o.value) ?? [];
      for (const value of override.options) if (!values.includes(value)) fail(`${dir}/fields.json`, `${id} has no option ${value}`);
    }
  }
  for (const file of list(`${dir}/pages`)) {
    const override = read(file);
    if (!parkedByPage.has(override.page)) { fail(file, `no layout for page ${override.page}`); continue; }
    for (const key of Object.values(override.notes ?? {})) useContent(file, key);
  }
}

for (const key of content.keys()) if (!usedContent.has(key)) fail('content', `${key} is not used by any page`);

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
      console.log(`    ${f.id.padEnd(32)} ${type.padEnd(17)} ${f.required ? 'required' : 'optional'}  ${person}  [${row.component}]`);
    }
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
