import { libraryMetadata } from './provenance.ts';

const globalTables = new Set(['products', 'coverageCategories', 'riders', 'productIdentifiers', 'configurationDefinitions', 'configurationValues', 'urlParameters', 'urlParameterValues', 'features']);
const siteTables = new Set(['configurationValues', 'siteProducts', 'siteProductApplicants', 'productApplicantEligibility', 'underwritingBands', 'coverageDependencies', 'maximumPlanRules', 'aggregateLimits', 'benefitCaps', 'benefitPeriodOptions', 'productAmountRules', 'productIdentifiers', 'productRiders', 'siteRiders', 'riderAmountRules', 'coverageAmountPatterns', 'amountBands', 'amountOptions', 'siteUrlParameters', 'siteFeatures', 'sitePolicies']);
const identity = row => row.key ?? row.id;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/** The relational consumer contract is also the fresh-start product authoring
 * vocabulary. Definitions/defaults are global; enrolled Sites own assignments.
 * Keeping stable identities preserves saved applications and policy references. */
export function validateProductCatalog(catalog, scope) {
  if (!object(catalog)) throw new Error(`Invalid fresh-start ${scope} product catalog`);
  const tables = scope === 'global' ? globalTables : siteTables;
  for (const table of tables) if (!Array.isArray(catalog[table])) throw new Error(`Missing fresh-start ${scope} product table: ${table}`);
  for (const [table, rows] of Object.entries(catalog)) {
    if (!tables.has(table) || !Array.isArray(rows)) throw new Error(`Invalid fresh-start product table: ${table}`);
    const ids = new Set(), keys = new Set();
    for (const row of rows) {
      if (!object(row) || typeof row.id !== 'string' || !row.id || typeof identity(row) !== 'string' || !identity(row) || ids.has(row.id) || keys.has(identity(row))) throw new Error(`Invalid fresh-start product identity: ${table}`);
      ids.add(row.id); keys.add(identity(row));
      if (scope === 'global' && (row.siteKey != null || row.siteId != null || row.clientKey != null || row.scope && row.scope !== 'global')) throw new Error(`Site assignment in global product definitions: ${table}/${identity(row)}`);
      if (scope === 'site' && (row.siteKey != null && row.siteKey !== '{{site}}' || row.siteId != null && row.siteId !== '{{siteId}}' || row.clientKey != null || row.scope && row.scope !== 'site')) throw new Error(`Invalid effective-Site product assignment: ${table}/${identity(row)}`);
    }
  }
  return catalog;
}

const instantiate = (value, site) => {
  if (value === '{{lifeMaximum}}') {
    if (!Number.isSafeInteger(site.lifeMaximum)) throw new Error('Missing fresh-start Life maximum');
    return site.lifeMaximum;
  }
  if (typeof value === 'string') return value.replaceAll('{{site}}', site.key).replaceAll('{{siteId}}', site.id);
  if (Array.isArray(value)) return value.map(item => instantiate(item, site));
  if (object(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, instantiate(item, site)]));
  return value;
};
const targetIdentity = definition => JSON.stringify(definition.target ? Object.entries(definition.target).sort(([a], [b]) => a.localeCompare(b)) : definition.path);

/** Replace owned records before page/policy compilation. Stale snapshot values
 * for the same target cannot compete with fresh-start authoring. */
export function compileProductCatalog(data, source, sites) {
  const output = { ...data };
  const merge = (table, records, reference) => {
    // Domain-only snapshots omit Library URL tables; keep their contract intact.
    if (!Array.isArray(output[table])) return;
    const keys = new Set(records.map(identity));
    output[table] = [...output[table].filter(row => !keys.has(identity(row))), ...records.map(record => ({ ...libraryMetadata(table, identity(record)), ...structuredClone(record), sourceReference: `${reference}#${table}/${identity(record)}${record.sourceReference ? `; ${record.sourceReference}` : ''}` }))];
  };
  const global = validateProductCatalog(source.products.catalog, 'global');
  const definitions = new Map(global.configurationDefinitions.map(row => [row.key, row.definition]));
  const globalProducts = new Set(global.products.map(row => row.key));
  for (const product of source.products.products) if (!globalProducts.has(product.id)) throw new Error(`Missing fresh-start product definition: ${product.id}`);
  for (const value of global.configurationValues) if (!definitions.has(value.configurationKey)) throw new Error(`Missing fresh-start configuration definition: ${value.configurationKey}`);
  for (const [table, rows] of Object.entries(global)) {
    const records = rows.map(row => {
      if (table === 'coverageCategories') {
        const option = source.fields.optionLists['coverage-categories'].find(option => option.value === row.key);
        if (!option) throw new Error(`Missing fresh-start category option: ${row.key}`);
        return { ...row, definition: { ...row.definition, label: option.label, ...(option.shortLabel ? { shortLabel: option.shortLabel } : {}) } };
      }
      if (table === 'products') {
        const product = source.products.products.find(product => product.id === row.key);
        if (product) return { ...row, categoryKey: product.category, definition: { ...row.definition, categoryId: product.category } };
      }
      return row;
    });
    merge(table, records, 'requirements/global/products.json');
  }
  for (const site of sites) {
    const authored = source.siteProducts[site.key]?.catalog;
    if (!authored) throw new Error(`Missing fresh-start product assignments: ${site.key}`);
    const catalog = instantiate(validateProductCatalog(authored, 'site'), { ...site, lifeMaximum: source.siteCoveragePolicies[site.key]?.lifeMaximum?.maximum });
    for (const value of catalog.configurationValues) if (!definitions.has(value.configurationKey)) throw new Error(`Missing fresh-start configuration definition: ${value.configurationKey}`);
    for (const assignment of catalog.siteProducts) if (!globalProducts.has(assignment.productKey)) throw new Error(`Missing fresh-start product definition: ${assignment.productKey}`);
    const clientKey = data.clients.find(client => client.id === site.clientId)?.key;
    const productKeys = new Set(catalog.siteProducts.map(row => row.productKey));
    for (const [table, rows] of Object.entries(catalog)) {
      if (!Array.isArray(output[table])) continue;
      if (table === 'configurationValues') {
        const owned = new Set(rows.map(row => targetIdentity(definitions.get(row.configurationKey) ?? output.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition ?? {})));
        const ownedKeys = new Set(output.configurationDefinitions.filter(row => owned.has(targetIdentity(row.definition))).map(row => row.key));
        output[table] = output[table].filter(row => !ownedKeys.has(row.configurationKey) || !(row.siteKey === site.key || row.scope === 'client' && row.clientKey === clientKey));
        output.configurationDefinitions = output.configurationDefinitions.filter(row => !ownedKeys.has(row.key) || definitions.has(row.key) || output.configurationValues.some(value => value.configurationKey === row.key));
      } else {
        // Site tables are complete sets for the assigned products, including
        // empty applicant/underwriting sets. Additional stale rows cannot leak in.
        output[table] = output[table].filter(row => !(row.siteKey === site.key || row.siteId === site.id || row.scope === 'client' && row.clientKey === clientKey) || row.productKey && !productKeys.has(row.productKey));
      }
      merge(table, rows, `requirements/parked/sites/${site.key}/products.json`);
    }
  }
  return output;
}
