import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSharedCatalogReader, prototypeCatalogData, validateSharedCatalog } from './sharedCatalog';
import { JsonCatalogAdapter } from './jsonCatalogAdapter';
import { LocalStorageAdapter } from './localAdapter';
import { createSeedDatabase } from './seed';
import { resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { fieldCatalogRows } from '../pages/admin/library/fieldCatalogRows';
import { createPortalDataRepository } from '../repositories/portalDataRepository';
import { readLibraryCatalog } from '../services/libraryCatalogService';
import { getFieldValidationRules } from '../utils/fieldValidation';

const saved = () => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
afterEach(() => vi.restoreAllMocks());

describe('shared JSON catalog', () => {
  it('rejects invalid component ownership or orphan composition on catalog load', () => {
    const catalog = saved();
    catalog.data.components[0].definition.role = 'unknown';
    expect(() => validateSharedCatalog(catalog)).toThrow('Invalid component role');
    catalog.data.components[0].definition.role = 'shared-piece';
    catalog.data.components[0].definition.contains = ['missing-component'];
    expect(() => validateSharedCatalog(catalog)).toThrow('Invalid component composition');
  });
  it('serves the required WAEPA referral dropdown from one shared catalog definition', () => {
    const catalog = validateSharedCatalog(saved());
    const definitions = catalog.data.fields.filter(row => row.key === 'membership-referral-source');
    expect(definitions).toHaveLength(1);
    const definition = definitions[0].definition;
    expect(definition).toMatchObject({
      inputType: 'multi-select', required: true,
      options: [{ value: 'tv', label: 'TV' }, { value: 'radio', label: 'Radio' }, { value: 'newspaper', label: 'Newspaper' }],
    });
    for (const site of ['waepa', 'waepa-gi']) {
      const prototype = resolvePrototypeLibrary(prototypeCatalogData(catalog), site, 'referral-catalog-test');
      const field = prototype.site.configuration.pages.find(page => page.key === 'membership')?.fields.find(row => row.key === 'membership-referral-source');
      expect(field?.included).toBe(true);
      expect(field?.definition).toMatchObject({ inputType: 'multi-select', required: true });
      const libraryField = fieldCatalogRows({ ...catalog, revision: 'referral-catalog-test' }, site).find(row => row.key === 'membership-referral-source');
      expect(libraryField?.field).toMatchObject({ inputType: 'multi-select', options: definition.options });
    }
    const validate = getFieldValidationRules(definition).validate!;
    expect(validate([])).toBe('Select at least one option.');
    expect(validate(['tv', 'radio'])).toBe(true);
  });
  it('loads the configured button colors and shapes from saved Site settings', () => {
    const data = prototypeCatalogData(validateSharedCatalog(saved()));
    for (const site of ['waepa', 'waepa-gi']) {
      expect(resolvePrototypeLibrary(data, site, 'button-theme-test').client.theme).toMatchObject({
        primary: '#002c85', primaryAction: { main: '#f1b435', tone: 'light' },
        buttonShape: 'standard',
      });
    }
    expect(resolvePrototypeLibrary(data, 'ama', 'button-theme-test').client.theme?.buttonShape).toBe('pill');
    expect(resolvePrototypeLibrary(data, 'demo', 'button-theme-test').client.theme?.primaryAction).toBeUndefined();
  });
  it('resolves every saved Site from the checked-in file', () => {
    const catalog = validateSharedCatalog(saved());
    for (const site of catalog.data.sites) {
      const prototype = resolvePrototypeLibrary(prototypeCatalogData(catalog), site.key, 'json-test');
      expect(prototype.site.siteKey).toBe(site.key);
      expect(prototype.pages.some(page => page.enabled)).toBe(true);
      const eligibilityOrder = ['zip-postal-code', 'state-province', 'birth-date'];
      const quoteOrder = prototype.fieldSurfaces.quoteInputs.mapping.fields.map(field => field.id).filter(key => eligibilityOrder.includes(key));
      expect(quoteOrder).toEqual(eligibilityOrder.filter(key => quoteOrder.includes(key)));
      expect(prototype.site.configuration.pages.find(page => page.key === 'eligibility')?.fields.filter(field => eligibilityOrder.includes(field.key)).map(field => field.key)).toEqual(eligibilityOrder);
    }
    expect(Object.keys(catalog.data)).not.toContain('applications');
    expect(Object.keys(catalog.data)).not.toContain('users');
  });

  it('shares edited definitions across the prototype, Library and repository with one fetch', async () => {
    const file = saved();
    const email = file.data.fields.find((row: { key: string }) => row.key === 'resume-email');
    email.definition.label = 'Shared catalog recovery email';
    const network = vi.fn<typeof fetch>().mockResolvedValue(Response.json(file));
    const read = createSharedCatalogReader(network, '/preview/');
    const base = new LocalStorageAdapter(createSeedDatabase());
    const fallback = vi.spyOn(base, 'list');
    const adapter = new JsonCatalogAdapter(base, read);
    const catalog = await read();
    const prototype = resolvePrototypeLibrary(prototypeCatalogData(catalog), 'abe', catalog.revision);
    const fields = fieldCatalogRows(catalog, 'abe');
    expect(prototype.site.configuration.pages.find(row => row.key === 'resume')?.fields.find(field => field.key === 'resume-email')?.definition.label).toBe(email.definition.label);
    expect(fields.find(row => row.key === 'resume-email')?.field.label).toBe(email.definition.label);
    expect((await adapter.get('fields', email.id))?.definition.label).toBe(email.definition.label);
    const revision = await createPortalDataRepository(adapter).open(['fields']);
    expect(revision.get('fields', email.id)?.definition.label).toBe(email.definition.label);
    expect(revision.revision).toBe(catalog.revision);
    expect(fallback).not.toHaveBeenCalled();
    expect(network).toHaveBeenCalledTimes(1);
    expect(network).toHaveBeenCalledWith('/preview/catalog/portal.json', { cache: 'no-cache' });
    await expect(adapter.update('fields', email.id, { definition: email.definition })).rejects.toThrow('shared JSON catalog');
  });

  it('uses the static catalog in the deployed Library without a mock API or database', async () => {
    const network = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(saved()));
    const catalog = await readLibraryCatalog('abe');
    expect(catalog.data.pages.some(page => page.key === 'health-ci')).toBe(true);
    expect(catalog.revision).toMatch(/^local:v1:sha256:/);
    expect(network).toHaveBeenCalledTimes(1);
    expect(network.mock.calls[0][0]).toBe('/catalog/portal.json');
  });

  it('fails clearly for missing, malformed or unexpected catalog data without falling back', async () => {
    const network = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 404 }));
    const read = createSharedCatalogReader(network, '/');
    await expect(read()).rejects.toThrow('Shared JSON catalog unavailable');
    await expect(read()).rejects.toThrow();
    expect(network).toHaveBeenCalledTimes(1);
    const file = saved();
    delete file.data.fields;
    expect(() => validateSharedCatalog(file)).toThrow();
    file.data.fields = [];
    file.data.applications = [];
    expect(() => validateSharedCatalog(file)).toThrow();
  });
});
