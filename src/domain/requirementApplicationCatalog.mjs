import { normalizedSnapshotTables } from '../persistence/catalogTables.ts';
import { libraryMetadata } from './provenance.ts';

const identity = row => row.key ?? row.id;
const tables = new Set(['configurationDefinitions', 'configurationValues', 'conditions', 'rules', 'ruleAssignments', 'ruleConditions', 'ruleActions', 'rulePredicates', 'structuredRuleActions', 'ruleFlags', 'flagDefinitions', 'flagRules', 'flows', 'siteFlows', 'flowSteps', 'flowTransitions', 'brandingProfiles', 'supportProfiles', 'documentDefinitions', 'siteDocuments', 'emailTemplates', 'siteEmailTemplates', 'contentEntries', 'contentValues']);
const instantiate = (value, site) => typeof value === 'string' ? value.replaceAll('{{site}}', site.key).replaceAll('{{siteId}}', site.id)
  : Array.isArray(value) ? value.map(item => instantiate(item, site))
    : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, instantiate(item, site)])) : value;

/** Relational application inputs retain their consumer identities. Global
 * definitions/defaults and effective-Site assignments have separate owners. */
export function validateApplicationCatalog(document, scope) {
  if (!document || typeof document !== 'object' || !document.records || typeof document.records !== 'object') throw new Error(`Invalid fresh-start ${scope} application source`);
  for (const [table, rows] of Object.entries(document.records)) {
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

export function compileApplicationCatalog(data, source, sites) {
  const output = { ...data };
  const merge = (table, records, reference) => {
    if (!Array.isArray(output[table])) return;
    const keys = new Set(records.map(identity));
    output[table] = [...output[table].filter(row => !keys.has(identity(row))), ...records.map(record => ({ ...libraryMetadata(table, identity(record)), ...structuredClone(record), sourceReference: `${reference}#${table}/${identity(record)}${record.sourceReference ? `; ${record.sourceReference}` : ''}` }))];
  };
  for (const [table, rows] of Object.entries(validateApplicationCatalog(source.application, 'global'))) merge(table, rows, 'requirements/global/application.json');
  for (const site of sites) {
    const document = source.siteApplication[site.key];
    if (!document) continue;
    for (const [table, rows] of Object.entries(validateApplicationCatalog(document, 'site'))) merge(table, instantiate(rows, site), `requirements/parked/sites/${site.key}/application.json`);
  }
  return output;
}
