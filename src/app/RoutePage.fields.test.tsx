import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { ApplicationFormProvider, applicationStorageKey } from './ApplicationFormContext';
import { ApplicationSessionProvider } from './ApplicationSessionContext';
import FormRoutePage from './RoutePage';
import FieldRenderer from '../components/forms/FieldRenderer';
import { freshStartSource } from '../domain/freshStartCatalog';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';

vi.mock('../analytics/runtime', () => ({ attachPageAnalytics: () => () => {}, emitPageAnalytics: () => {} }));
afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); vi.unstubAllGlobals(); });
it('renders and validates phone companions from effective page fields at the shared form boundary', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const source = structuredClone(freshStartSource());
  const siteFields = source.fields.sites.asce as { fields: Record<string, unknown> };
  siteFields.fields['phone-type'] = { options: ['mobile'], label: { self: 'Configured phone type' } };
  const library = resolvePrototypeLibrary(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')).data, 'asce', 'phone-page-scope', source);
  installPrototypeLibrary(library);
  window.history.replaceState(null, '', '/membership?site=asce');
  sessionStorage.setItem(applicationStorageKey('asce'), JSON.stringify({ membership: 'yes', phone: '2025550123', 'phone-type': 'home' }));
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<ApplicationFormProvider><ApplicationSessionProvider><MemoryRouter>
      <FormRoutePage pageId="membership">{({ allFields, control, errors, trigger }) => <>
        <FieldRenderer field={allFields.find(field => field.id === 'phone')!} control={control} errors={errors} />
        <button type="button" onClick={() => void trigger('phone-type')}>Validate phone type</button>
      </>}</FormRoutePage>
    </MemoryRouter></ApplicationSessionProvider></ApplicationFormProvider>));
    const companion = host.querySelector('[role="combobox"]')!;
    expect(companion.getAttribute('aria-label')).toBe('Configured phone type');
    await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === 'Validate phone type')!.click());
    expect(companion.getAttribute('aria-invalid')).toBe('true');
    await act(async () => companion.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
    expect([...document.querySelectorAll('[role="option"]')].map(option => option.getAttribute('data-value'))).toEqual(['mobile']);
    expect(getClientPageFields('membership', { membership: 'yes' }).find(field => field.id === 'phone-type')?.options?.map(option => option.value)).toEqual(['mobile']);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
