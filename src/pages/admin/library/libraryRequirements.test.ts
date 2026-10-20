import { describe, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../../../migration/fixtures';
import { normalizedSnapshotTables } from '../../../persistence/snapshot';
import { configurationOwner, flagOwner, libraryOwners } from '../../../domain/libraryOwnership';
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { libraryRequirementRows } from './libraryRequirementRows';
import { configurationRows } from './configurationRows';
import { urlParameterRows } from './UrlParametersLibrary';

const catalog: LibraryCatalog = { revision: 'test', data: JSON.parse(JSON.stringify(createReviewedMigrationDatabase())), analyticsTags: [] };

describe('Library requirements ownership and relationships', () => {
  it('accounts for every snapshot table exactly once', () => {
    const tables = Object.values(libraryOwners).flat();
    expect(new Set(tables).size).toBe(tables.length);
    expect([...tables].sort()).toEqual([...new Set(normalizedSnapshotTables)].sort());
  });
  it('separates settings, derived decisions and stored application state', () => {
    expect(flagOwner('configuration')).toBe('configurations');
    expect(flagOwner('derived-runtime')).toBe('rules');
    expect(flagOwner('application-record')).toBe('flows');
    const rules = libraryRequirementRows(catalog, 'asce');
    expect(rules.some(row => row.key === 'application.has-underwritten-coverage')).toBe(true);
    expect(rules.some(row => row.key === 'qd.decision' || row.key === 'site.has-product-rates')).toBe(false);
    expect(configurationRows(catalog, 'asce').find(row => row.key === 'site.has-product-rates')?.values).toBe('Not configured');
  });
  it('keeps business policy values in rules and configuration references free of duplicate values', () => {
    const definition = catalog.data.configurationDefinitions.find(row => row.definition.target?.kind === 'product-benefit-policy')!;
    expect(configurationOwner(definition)).toBe('rules');
    const configurations = configurationRows(catalog, 'all');
    expect(configurations.find(row => row.key === definition.key)).toMatchObject({ owner: 'rules', values: 'See owning requirements' });
    expect(libraryRequirementRows(catalog, 'all').some(row => row.key === definition.key && row.dataset === 'configurationValues')).toBe(true);
  });
  it('shows shared routing execution under Rules while configuration contains references', () => {
    const rows = libraryRequirementRows(catalog, 'asce');
    const routing = rows.find(row => row.key === 'rule-application-flow-beneficiary-routing');
    expect(routing).toMatchObject({ status: 'Executable routing rule' });
    expect(routing?.behavior).toContain('Routing definition:');
    const definition = catalog.data.configurationDefinitions.find(row => row.key === 'routing.gates')!;
    expect(configurationOwner(definition)).toBe('rules');
    expect(configurationRows(catalog, 'asce').find(row => row.key === definition.key)).toMatchObject({ owner: 'rules', values: 'See owning requirements' });
  });
  it('shows amount bands and options at the assignment, without mixing other sites or disabled products', () => {
    const rows = libraryRequirementRows(catalog, 'asce');
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
    const amounts = rows.filter(row => row.dataset === 'productAmountRules');
    expect(amounts.length).toBeGreaterThan(0);
    expect(amounts.every(row => row.site === 'asce')).toBe(true);
    expect(amounts.some(row => row.behavior.includes('Increment:') && row.behavior.includes('Minimum:'))).toBe(true);
    const changed = structuredClone(catalog);
    const product = amounts[0].product;
    changed.data.siteProducts.find(row => row.productKey === product && row.siteId === 'asce')!.enabled = false;
    expect(libraryRequirementRows(changed, 'asce').some(row => row.product === product && row.dataset !== 'siteProducts')).toBe(false);
    expect(libraryRequirementRows(changed, 'asce').find(row => row.product === product && row.dataset === 'siteProducts')?.status).toBe('Disabled assignment');
  });
  it('keeps planned requirements visible and their status explicit', () => {
    const rows = libraryRequirementRows(catalog, 'all');
    expect(rows.some(row => row.status === 'Planned')).toBe(true);
  });
  it('joins URL definitions, values and site settings without inventing an assignment', () => {
    const rows = urlParameterRows(catalog, 'asce');
    expect(rows.find(row => row.parameter === 'category')?.values.length).toBeGreaterThan(0);
    expect(rows.every(row => row.siteSettings === 'No site assignment recorded')).toBe(true);
    const changed = structuredClone(catalog);
    const key = rows[0].key;
    changed.data.siteUrlParameters.push({ id: 'test', key: 'test', displayId: 1, providedBy: null, sourceReference: 'test', siteKey: 'asce', urlParameterKey: key, enabled: false, defaultValue: 'test-default' });
    expect(urlParameterRows(changed, 'asce')[0].siteSettings).toBe('asce: Disabled; default: test-default');
    expect(urlParameterRows(changed, 'waepa')[0].siteSettings).toBe('No site assignment recorded');
  });
});
