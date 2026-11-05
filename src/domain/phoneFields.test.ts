import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { getPhoneTypeFieldId, validatePhoneFieldBindings } from './phoneFields';
import { fieldCatalog } from '../config/fields';
import { validateSharedCatalog } from '../persistence/sharedCatalog';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { pageCatalogRows } from '../pages/admin/library/pageCatalogRows';
const saved = () => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
it('defaults companion IDs to the individual number field and rejects reused bindings', () => {
  expect(getPhoneTypeFieldId({ id: 'custom-phone' })).toBe('custom-phone-type');
  const fields = Object.values(fieldCatalog);
  expect(() => validatePhoneFieldBindings(fields)).not.toThrow();
  expect(() => validatePhoneFieldBindings(fields.map(field => field.id === 'business-phone' ? { ...field, phoneTypeFieldId: 'phone-type' } : field))).toThrow('Shared phone type binding');
  expect(() => validatePhoneFieldBindings(fields.filter(field => field.id !== 'business-phone-type'))).toThrow('Missing configured phone type field: business-phone-type');
});
it('rejects duplicate field identities and shared phone answers in saved catalogs', () => {
  const duplicate = saved();
  duplicate.data.fields.find((row: { key: string }) => row.key === 'business-phone').definition.id = 'phone';
  expect(() => validateSharedCatalog(duplicate)).toThrow('Duplicate field binding ID');
  const shared = saved();
  shared.data.fields.find((row: { key: string }) => row.key === 'business-phone').definition.phoneTypeFieldId = 'phone-type';
  expect(() => validateSharedCatalog(shared)).toThrow('Shared phone type binding');
});
it('preserves independent phone definitions and Library companion rows across every saved Site', () => {
  const catalog = validateSharedCatalog(saved());
  for (const site of catalog.data.sites) {
    const prototype = resolvePrototypeLibrary(catalog.data, site.key, 'phone-independence');
    const business = prototype.fields.find(field => field.id === 'business-phone')!;
    expect(getPhoneTypeFieldId(business)).toBe('business-phone-type');
    expect(prototype.fields.find(field => field.id === 'health-source-detail-physician-phone')?.showPhoneTypeSelector).toBe(false);
    const contact = pageCatalogRows({ ...catalog, revision: "phone-independence" }, site.key).find(page => page.key === 'contact');
    if (contact?.fields.some(field => field.key === 'business-phone')) {
      const ids = contact.fields.map(field => field.key);
      expect(ids[ids.indexOf('business-phone') + 1]).toBe('business-phone-type');
    }
  }
});
it('rejects a Site override that reconnects business phone to the member type', () => {
  const catalog = validateSharedCatalog(saved());
  const override = catalog.data.siteFieldConfigurations.find(row => row.fieldKey === 'business-phone' && row.siteKey === 'abe');
  if (override) override.values = { ...override.values, phoneTypeFieldId: 'phone-type' };
  else catalog.data.siteFieldConfigurations.push({ id: 'test-business-type', key: 'test-business-type', displayId: 999999, providedBy: null, sourceReference: null, scope: 'site', siteKey: 'abe', clientKey: null, pageKey: 'contact', fieldKey: 'business-phone', position: 99999, include: true, hidden: false, values: { phoneTypeFieldId: 'phone-type' } });
  expect(() => resolvePrototypeLibrary(catalog.data, 'abe', 'bad-binding')).toThrow('Shared phone type binding');
});
