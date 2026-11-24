import { validateRuleTemplates } from './ruleTemplates.mjs';
import { normalizedSnapshotTables } from '../persistence/catalogTables.ts';
import { libraryMetadata } from './provenance.ts';
import { validateFlowDefinitions } from './flowDefinitions.mjs';

const identity = row => row.key ?? row.id;
const tables = new Set(['sites', 'siteAssociations', 'configurationDefinitions', 'configurationValues', 'conditions', 'rules', 'ruleAssignments', 'ruleConditions', 'ruleActions', 'rulePredicates', 'structuredRuleActions', 'ruleFlags', 'flagDefinitions', 'flagRules', 'flows', 'siteFlows', 'flowSteps', 'flowTransitions', 'brandingProfiles', 'supportProfiles', 'documentDefinitions', 'siteDocuments', 'emailTemplates', 'siteEmailTemplates', 'contentEntries', 'contentValues']);
const instantiate = (value, site) => typeof value === 'string' ? value.replaceAll('{{site}}', site.key).replaceAll('{{siteId}}', site.id)
  : Array.isArray(value) ? value.map(item => instantiate(item, site))
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, instantiate(item, site)])) : value;

/** Relational application inputs retain their consumer identities. Global
 * definitions/defaults and effective-Site assignments have separate owners. */
export function validateApplicationCatalog(document, scope) {
  if (!document || typeof document !== 'object' || !document.records || typeof document.records !== 'object') throw new Error(`Invalid fresh-start ${scope} application source`);
  for (const property of ['retiredRuleKeys', 'retiredConfigurationKeys', 'retiredContentRoots', 'retiredFlowKeys']) if (document[property] !== undefined) {
    const keys = document[property];
    if (scope !== 'global' || !Array.isArray(keys) || new Set(keys).size !== keys.length || keys.some(key => typeof key !== 'string' || !key.trim())) throw new Error(`Invalid global application retirement: ${property}`);
    const active = property === 'retiredRuleKeys' ? document.records.rules : property === 'retiredFlowKeys' ? document.records.flows : property === 'retiredContentRoots' ? document.records.contentEntries : document.records.configurationDefinitions;
    if (active?.some(row => property === 'retiredContentRoots' ? keys.some(root => identity(row) === root || identity(row).startsWith(`${root}.`)) : keys.includes(identity(row)) || keys.includes(row.definition?.path?.join('.')))) throw new Error(`Active retired application definition: ${property}`);
  }
  for (const [table, rows] of Object.entries(document.records)) {
    if (scope === 'global' && ['sites', 'siteAssociations'].includes(table)) throw new Error('Effective Site identity belongs to its Site application source');
    if (!tables.has(table) || !normalizedSnapshotTables.includes(table) || !Array.isArray(rows)) throw new Error(`Invalid fresh-start application table: ${table}`);
    const keys = new Set();
    for (const row of rows) {
      if (!row || typeof row.id !== 'string' || typeof identity(row) !== 'string' || keys.has(identity(row))) throw new Error(`Invalid fresh-start application identity: ${table}`);
      keys.add(identity(row));
      if (scope === 'global' && (row.scope && row.scope !== 'global' || row.siteKey != null || row.siteId != null || row.clientKey != null)) throw new Error(`Site assignment in global application definitions: ${table}`);
      if (scope === 'site' && (row.scope && row.scope !== 'site' || row.siteKey != null && row.siteKey !== '{{site}}' || row.siteId != null && row.siteId !== '{{siteId}}' || row.clientKey != null)) throw new Error(`Invalid effective-Site application assignment: ${table}`);
    }
  }
  return document.records;
}

/** Enroll authored Site identities before resolving their product and page
 * assignments. Client/association identities retain their existing owners. */
export function compileApplicationSiteIdentities(data, source, selectedSite, siteScope) {
  const output = { ...data, sites: siteScope ? data.sites.filter(site => siteScope.includes(site.key)) : [...data.sites] };
  for (const [key, document] of Object.entries(source.siteApplication)) {
    if (selectedSite && key !== selectedSite || siteScope && !siteScope.includes(key) || !source.fields.sites[key] || !document.records.sites?.length) continue;
    const records = validateApplicationCatalog(document, 'site');
    if (document.site !== key || records.sites.length !== 1) throw new Error(`Invalid authored Site enrollment: ${key}`);
    const site = records.sites[0];
    // Authored identities own enrollment. Callers supply an explicit Site scope
    // for restricted snapshots; saved Site rows do not define that scope.
    if (!selectedSite && !data.clients.some(client => client.id === site.clientId)) continue;
    if (site.key !== key || site.id !== key || !data.clients.some(client => client.id === site.clientId) || !['single', 'multi'].includes(site.templateType) || output.sites.some(row => row.id === site.id && row.key !== key)) throw new Error(`Invalid authored Site identity: ${key}`);
    output.sites = [...output.sites.filter(row => row.key !== key), { ...libraryMetadata('sites', key), ...structuredClone(site), sourceReference: `requirements/parked/sites/${key}/application.json#sites/${key}` }];
  }
  return output;
}

export function compileApplicationCatalog(data, source, sites) {
  const output = { ...data };
  const globalRecords = validateApplicationCatalog(source.application, 'global');
  validateFlowDefinitions(globalRecords, source);
  for (const record of [...(source.rules ?? []), ...(source.workflows ?? [])]) validateRuleTemplates(record.templates);
  for (const record of globalRecords.rules ?? []) validateRuleTemplates(record.definition?.templates);
  const retiredFlows = new Set(source.application.retiredFlowKeys ?? []);
  for (const table of ['flows', 'flowSteps', 'flowTransitions', 'siteFlows']) output[table] = output[table].filter(row => !retiredFlows.has(table === 'flows' ? identity(row) : row.flowKey));
  const retiredContent = key => (source.application.retiredContentRoots ?? []).some(root => key === root || key?.startsWith(`${root}.`));
  if (Object.keys(source.content).some(retiredContent)) throw new Error('Active retired application content');
  const globalOnly = [
    ...globalRecords.configurationDefinitions?.filter(row => row.definition.metadata?.globalOnly === true) ?? [],
    ...source.configurations.filter(configuration => configuration.globalOnly && source.configurationBindings[configuration.id]).map(configuration => {
      const path = source.configurationBindings[configuration.id];
      return { key: `requirements.${path}`, definition: { path: path.split('.') } };
    }),
  ];
  const globalOnlyPaths = new Set(globalOnly.map(row => row.definition.path?.join('.')).filter(Boolean));
  const isGlobalOnly = row => globalOnly.some(definition => identity(definition) === identity(row)) || globalOnlyPaths.has(row.definition?.path?.join('.'));
  const globalOnlyKeys = new Set([...(output.configurationDefinitions ?? []).filter(isGlobalOnly), ...globalOnly].map(identity));
  // Reviewed global-only contracts cannot inherit captured scoped replacements.
  output.configurationValues = output.configurationValues.filter(row => row.scope === 'global' || !globalOnlyKeys.has(row.configurationKey));
  // Canonical shared requirements retire their captured relational descriptions
  // and associations, including those arriving from older saved catalogs.
  const explicitlyRetired = new Set(source.application.retiredRuleKeys ?? []);
  const retired = new Set(explicitlyRetired);
  if (source.rules?.some(rule => retired.has(rule.id))) throw new Error('Active retired application rule');
  for (const rule of source.rules ?? []) for (const key of rule.replaces ?? []) {
    if (typeof key !== 'string' || key === rule.id || retired.has(key) || source.application.records.rules?.some(row => identity(row) === key)) throw new Error(`Invalid replaced application rule: ${key}`);
    retired.add(key);
  }
  if (retired.size) for (const table of tables) {
    if (!Array.isArray(output[table])) continue;
    output[table] = output[table].filter(row => !(table === 'rules' && retired.has(identity(row))) && !retired.has(row.ruleKey));
  }
  const resolveDefault = record => {
    let inherited = false;
    const defaults = source.application.records.configurationValues.filter(value => value.configurationKey === record.configurationKey && value.scope === 'global');
    const resolve = (value, base) => {
      if (!value || typeof value !== 'object') return value;
      if (Object.hasOwn(value, '$default')) {
        if (record.scope === 'global' || value.$default !== true || Object.keys(value).length !== 1) throw new Error(`Invalid shared configuration default reference: ${identity(record)}`);
        if (defaults.length !== 1 || base === undefined || base && typeof base === 'object' && Object.hasOwn(base, '$default')) throw new Error(`Missing or ambiguous shared configuration default: ${record.configurationKey}`);
        inherited = true;
        return structuredClone(base);
      }
      if (Array.isArray(value)) return value.map((item, index) => resolve(item, base?.[index]));
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, base?.[key])]));
    };
    const value = resolve(record.value, defaults[0]?.value);
    return inherited ? { ...record, value, sourceReference: `${record.sourceReference ?? ''}; inherited from requirements/global/application.json#configurationValues/${identity(defaults[0])}` } : record;
  };
  const merge = (table, records, reference) => {
    if (!Array.isArray(output[table])) return;
    if (records.some(row => explicitlyRetired.has(row.ruleKey))) throw new Error(`Assignment to retired application rule: ${table}`);
    if ((table === 'contentEntries' || table === 'contentValues') && records.some(row => retiredContent(table === 'contentEntries' ? identity(row) : row.contentKey))) throw new Error('Assignment to retired application content');
    const keys = new Set(records.map(identity));
    output[table] = [...output[table].filter(row => !keys.has(identity(row))), ...records.map(authored => {
      const record = table === 'configurationValues' ? resolveDefault(authored) : authored;
      return { ...libraryMetadata(table, identity(record)), ...structuredClone(record), sourceReference: `${reference}#${table}/${identity(record)}${record.sourceReference ? `; ${record.sourceReference}` : ''}` };
    })];
  };
  // A reviewed graph owns its complete topology, including the absence of old nodes/edges.
  const ownedFlows = new Set(globalRecords.flows?.map(identity) ?? []);
  for (const table of ['flowSteps', 'flowTransitions']) output[table] = output[table].filter(row => !ownedFlows.has(row.flowKey));
  for (const [table, rows] of Object.entries(globalRecords)) merge(table, rows, 'requirements/global/application.json');
  for (const site of sites) {
    const document = source.siteApplication[site.key];
    if (!document) continue;
    if (['flows', 'flowSteps', 'flowTransitions'].some(table => document.records[table]?.length) || document.records.siteFlows?.some(row => retiredFlows.has(row.flowKey))) throw new Error('Shared flow definitions are global; Site assignments cannot restore retired graphs');
    if (document.records.configurationDefinitions?.some(isGlobalOnly) || document.records.configurationValues?.some(row => globalOnlyKeys.has(row.configurationKey))) throw new Error(`Global-only application configuration cannot be overridden: ${site.key}`);
    for (const [table, rows] of Object.entries(validateApplicationCatalog(document, 'site'))) merge(table, instantiate(rows, site), `requirements/parked/sites/${site.key}/application.json`);
  }
  // Retire by semantic key or path so aliased captured definitions and values
  // cannot restore a removed setting in Library, prototype or Storybook.
  const retiredConfigurations = new Set(source.application.retiredConfigurationKeys ?? []);
  if (Object.values(source.configurationBindings).some(path => retiredConfigurations.has(path))) throw new Error('Active retired application configuration binding');
  for (const definition of output.configurationDefinitions ?? []) if (retiredConfigurations.has(definition.definition.path?.join('.'))) retiredConfigurations.add(identity(definition));
  if (Array.isArray(output.configurationDefinitions)) output.configurationDefinitions = output.configurationDefinitions.filter(row => !retiredConfigurations.has(identity(row)));
  if (Array.isArray(output.configurationValues)) output.configurationValues = output.configurationValues.filter(row => !retiredConfigurations.has(row.configurationKey));
  output.contentEntries = output.contentEntries.filter(row => !retiredContent(identity(row)));
  output.contentValues = output.contentValues.filter(row => !retiredContent(row.contentKey));
  return output;
}
