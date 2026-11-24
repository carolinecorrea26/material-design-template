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

const saved = () => ({ ...validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'))), revision: 'abe-verification' });
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });

describe('Effective Pages and Fields single source verification', () => {
  it('keeps shared routes, order and requirements authoritative in both projections', () => {
    const catalog = saved();
    const contact = catalog.data.pages.find(page => page.key === 'contact')!;
    contact.definition.path = '/saved-contact';
    contact.definition.displayName = 'Saved contact page';
    const assignments = catalog.data.sitePages.filter(page => page.siteKey === 'asce');
    const membership = assignments.find(page => page.pageKey === 'membership')!;
    const eligibility = assignments.find(page => page.pageKey === 'eligibility')!;
    [membership.position, eligibility.position] = [eligibility.position, membership.position];
    assignments.find(page => page.pageKey === 'payment')!.requirement = 'none';
    const prototype = resolvePrototypeLibrary(catalog.data, 'asce', catalog.revision);
    installPrototypeLibrary(prototype);
    const rows = pageCatalogRows(catalog, 'asce');
    expect(rows.map(page => [page.key, page.definition.path, page.requirement, page.enabled])).toEqual(
      prototype.pages.filter(page => page.assigned && page.definition.flow !== 'internal')
        .map(page => [page.key, page.definition.path, page.requirement, page.enabled]),
    );
    expect(rows.find(page => page.key === 'contact')?.name).toBe('Contact');
    expect(getPagePath('contact')).toBe('/contact');
    expect(rows.find(page => page.key === 'payment')).toMatchObject({ enabled: true, requirement: 'optional' });
  });

  it('propagates authored field names, copy, input type, keyboard metadata and defaults', () => {
    const catalog = saved();
    const field = catalog.data.fields.find(field => field.key === 'resume-email')!.definition;
    const prototype = resolvePrototypeLibrary(catalog.data, 'asce', catalog.revision);
    const rendered = prototype.site.configuration.pages.find(page => page.key === 'resume')!.fields.find(row => row.key === field.id)!.definition;
    const listed = fieldCatalogRows(catalog, 'asce').find(row => row.key === field.id)!.field;
    for (const key of ['displayName', 'label', 'helperText', 'inputType', 'format', 'inputMode', 'defaultValue'] as const) expect(listed[key]).toEqual(rendered[key]);
    expect(fieldDisplayName(field.id, catalog)).toBe(field.displayName);
    expect(fieldDefaultValue(listed)).toBe(fieldDefaultValue(field));
    expect(pageCatalogRows(catalog, 'asce').find(page => page.key === 'resume')!.fields.find(row => row.key === field.id)?.name).toBe(field.displayName);
  });

  it('keeps saved surface labels from bypassing the global definitions', () => {
    const catalog = saved(), baseline = pageCatalogRows(catalog, 'asce');
    const surfaces = catalog.data.configurationValues.find(row => row.configurationKey === 'field-surfaces' && row.scope === 'global')!.value as unknown as Record<string, FieldSurfaceDefinition>;
    surfaces.verificationControls.libraryGroup!.label = 'Obsolete verification group';
    surfaces.quoteInputs.inspectionLabel = 'Obsolete quote tool';
    expect(pageCatalogRows(catalog, 'asce')).toEqual(baseline);
    expect(fieldSurfaceRows(catalog, 'asce').some(row => row.container === 'Obsolete quote tool')).toBe(false);
  });

  it('renders the same phone options and default that the Fields table reads', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const catalog = saved();
    const companion = catalog.data.fields.find(field => field.key === 'phone-type')!.definition;
    const prototype = resolvePrototypeLibrary(catalog.data, 'asce', catalog.revision);
    installPrototypeLibrary(prototype);
    const phone = prototype.site.configuration.pages.find(page => page.key === 'membership')!.fields.find(field => field.key === 'phone')!.definition;
    const listed = fieldCatalogRows(catalog, 'asce').find(field => field.key === 'phone-type')!.field;
    expect(listed.options).toEqual(companion.options);
    expect(fieldDefaultValue(listed)).toBe(companion.options!.find(option => option.value === companion.defaultValue)!.label);
    let values: (() => unknown) | undefined;
    function Form() {
      const { control, getValues } = useForm<Record<string, string | boolean | string[]>>({ defaultValues: { phone: '' } });
      useEffect(() => { values = getValues; }, [getValues]);
      return <FieldRenderer field={phone} control={control} errors={{}} />;
    }
    const container = document.createElement('div'); document.body.append(container); const root = createRoot(container);
    try {
      await act(async () => root.render(<FieldDefinitionsContext value={prototype.fields}><Form /></FieldDefinitionsContext>));
      expect(container.querySelector('[role="combobox"]')?.textContent).toBe(fieldDefaultValue(listed));
      expect(values!()).toMatchObject({ 'phone-type': companion.defaultValue });
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
