import { FieldDefinitionsContext } from "../components/forms/FieldDefinitionsContext";
import { readFileSync } from 'node:fs';
import { act, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateSharedCatalog } from './sharedCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { pageCatalogRows } from '../pages/admin/library/pageCatalogRows';
import { fieldCatalogRows, fieldDefaultValue, fieldDisplayName } from '../pages/admin/library/fieldCatalogRows';
import { fieldSurfaceRows } from '../pages/admin/library/fieldSurfaceRows';
import { getPagePath } from '../config/pages';
import FieldRenderer from '../components/forms/FieldRenderer';
import type { FieldSurfaceDefinition } from '../domain/fieldSurfaces';
import type { FieldCollectionDefinition } from '../domain/fieldCollections';

const saved = () => ({ ...validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'))), revision: 'abe-verification' });
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

describe('ABE Pages and Fields single source verification', () => {
  it('uses saved ABE page assignments, names, routes and order in both projections', () => {
    const catalog = saved();
    const contact = catalog.data.pages.find(page => page.key === 'contact')!;
    contact.definition.path = '/saved-contact';
    contact.definition.displayName = 'Saved contact page';
    const assignments = catalog.data.sitePages.filter(page => page.siteKey === 'abe');
    const membership = assignments.find(page => page.pageKey === 'membership')!;
    const eligibility = assignments.find(page => page.pageKey === 'eligibility')!;
    [membership.position, eligibility.position] = [eligibility.position, membership.position];
    assignments.find(page => page.pageKey === 'payment')!.requirement = 'none';
    const prototype = resolvePrototypeLibrary(catalog.data, 'abe', catalog.revision);
    installPrototypeLibrary(prototype);
    const rows = pageCatalogRows(catalog, 'abe');
    expect(rows.map(page => [page.key, page.definition.path, page.requirement, page.enabled])).toEqual(
      prototype.pages.filter(page => page.assigned && page.definition.flow !== 'internal')
        .map(page => [page.key, page.definition.path, page.requirement, page.enabled]),
    );
    expect(rows.find(page => page.key === 'contact')?.name).toBe('Saved contact page');
    expect(getPagePath('contact')).toBe('/saved-contact');
    expect(rows.find(page => page.key === 'payment')).toMatchObject({ enabled: false, fields: [], fieldGroups: [] });
  });

  it('propagates authored field names, copy, input type, keyboard metadata and defaults', () => {
    const catalog = saved();
    const field = catalog.data.fields.find(field => field.key === 'resume-email')!.definition;
    Object.assign(field, { displayName: 'Saved recovery field', label: 'Saved recovery address', helperText: 'Saved help', inputType: 'text', format: 'email', inputMode: 'email', defaultValue: 'member@example.test' });
    const prototype = resolvePrototypeLibrary(catalog.data, 'abe', catalog.revision);
    const rendered = prototype.site.configuration.pages.find(page => page.key === 'resume')!.fields.find(row => row.key === field.id)!.definition;
    const listed = fieldCatalogRows(catalog, 'abe').find(row => row.key === field.id)!.field;
    for (const key of ['displayName', 'label', 'helperText', 'inputType', 'format', 'inputMode', 'defaultValue'] as const) expect(listed[key]).toEqual(rendered[key]);
    expect(fieldDisplayName(field.id, catalog)).toBe('Saved recovery field');
    expect(fieldDefaultValue(listed)).toBe('member@example.test');
    expect(pageCatalogRows(catalog, 'abe').find(page => page.key === 'resume')!.fields.find(row => row.key === field.id)?.name).toBe(field.displayName);
  });

  it('reads modal group labels, collection anchors and tool names from saved configuration', () => {
    const catalog = saved();
    const surfaces = catalog.data.configurationValues.find(row => row.configurationKey === 'field-surfaces' && row.scope === 'global')!.value as unknown as Record<string, FieldSurfaceDefinition>;
    surfaces.verificationControls.libraryGroup!.label = 'Saved verification group';
    surfaces.quoteInputs.inspectionLabel = 'Saved quote tool';
    const collections = catalog.data.configurationValues.find(row => row.configurationKey === 'field-collections' && row.siteKey === 'abe')!.value as unknown as Record<string, FieldCollectionDefinition>;
    collections.selfDisabilityCompanies.libraryGroup!.label = 'Saved company group';
    collections.selfDisabilityCompanies.libraryGroup!.afterFieldKey = 'is-replacing-disability-insurance';
    const rows = pageCatalogRows(catalog, 'abe');
    const eligibility = rows.find(page => page.key === 'eligibility')!;
    expect(eligibility.fieldGroups.find(group => group.label === 'Saved verification group')?.fields.some(field => field.key === 'verification-method')).toBe(true);
    expect(rows.find(page => page.key === 'home')!.fieldGroups.some(group => group.label === 'Saved quote tool drawer')).toBe(true);
    const profile = rows.find(page => page.key === 'profile')!;
    expect(profile.fieldGroups.some(group => group.label === 'Saved company group')).toBe(true);
    const keys = profile.fields.map(field => field.key);
    expect(keys[keys.indexOf('is-replacing-disability-insurance') + 1]).toBe('di-company-name');
    expect(fieldSurfaceRows(catalog, 'abe').some(row => row.container === 'Saved quote tool')).toBe(true);
  });

  it('renders the same phone options and default that the Fields table reads', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const catalog = saved();
    const companion = catalog.data.fields.find(field => field.key === 'phone-type')!.definition;
    companion.options = [{ value: 'business', label: 'Saved work phone' }, { value: 'mobile', label: 'Saved mobile phone' }];
    companion.defaultValue = 'business';
    const prototype = resolvePrototypeLibrary(catalog.data, 'abe', catalog.revision);
    installPrototypeLibrary(prototype);
    const phone = prototype.site.configuration.pages.find(page => page.key === 'membership')!.fields.find(field => field.key === 'phone')!.definition;
    const listed = fieldCatalogRows(catalog, 'abe').find(field => field.key === 'phone-type')!.field;
    expect(listed.options).toEqual(companion.options);
    expect(fieldDefaultValue(listed)).toBe('Saved work phone');
    let values: (() => unknown) | undefined;
    function Form() {
      const { control, getValues } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { phone: '' } });
      useEffect(() => { values = getValues; }, [getValues]);
      return <FieldRenderer field={phone} control={control} errors={{}} />;
    }
    const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
    try {
      await act(async () => root.render(<FieldDefinitionsContext value={prototype.fields}><Form /></FieldDefinitionsContext>));
      expect(container.querySelector('[role="combobox"]')?.textContent).toBe('Saved work phone');
      expect(values!()).toMatchObject({ 'phone-type': 'business' });
      await act(async () => container.querySelector('[role="combobox"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })));
      expect([...document.querySelectorAll('[role="option"]')].map(option => option.textContent)).toEqual(companion.options.map(option => option.label));
    } finally { await act(async () => root.unmount()); container.remove(); }
  });

  it('rejects missing source names and invalid defaults instead of inventing table values', () => {
    const catalog = saved();
    delete catalog.data.fields[0].definition.displayName;
    expect(() => validateSharedCatalog({ formatVersion: 1, data: catalog.data, analyticsTags: catalog.analyticsTags })).toThrow('Missing catalog display name');
    const valid = saved();
    valid.data.fields.find(field => field.key === 'phone-type')!.definition.defaultValue = 'unknown-phone';
    expect(() => validateSharedCatalog({ formatVersion: 1, data: valid.data, analyticsTags: valid.analyticsTags })).toThrow('Unknown field default option');
    expect(fieldDefaultValue({ defaultValue: false })).toBe('false');
  });
});
