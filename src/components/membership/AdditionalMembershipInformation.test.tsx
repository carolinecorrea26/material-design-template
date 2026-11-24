import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { expect, it, vi } from 'vitest';
import AdditionalMembershipInformation from './AdditionalMembershipInformation';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../../domain/prototypeLibrary';
import { getClientPageFields } from '../../config/clientFields/getClientPageFields';
import { resolveMappedFields } from '../../domain/requirementFields';

it('uses person-specific military wording and renders the selected declaration last', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/membership?site=waepa');
  const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const library = resolvePrototypeLibrary(catalog.data, 'waepa', 'membership-order');
  installPrototypeLibrary(library);
  const values = { membership: 'new', 'waepa-attestation': 'federal-active' };
  const section = library.site.configuration.pages.find(page => page.key === 'membership')!.sections.find(section => section.definition.value.id === 'membershipInformation')!.definition.value;
  expect(section.fieldIds.at(-1)).toBe('waepa-declaration');
  const fields = getClientPageFields('membership', values).filter(field => section.fieldIds.some(id => id === field.id));
  function Example() {
    const form = useForm<Record<string, string | boolean | string[]>>({ defaultValues: values });
    return <AdditionalMembershipInformation fields={fields} client={library.client} control={form.control} errors={{}} setValue={form.setValue} qualificationValue="federal-active" />;
  }
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<Example />));
    expect(host.textContent).toContain('Are you on active duty in the Armed Forces?');
    expect(host.textContent).not.toContain('Is the child on active duty');
    expect(host.querySelector('input[name="waepa-declaration"]')).not.toBeNull();
    expect([...host.querySelectorAll('input[name]')].at(-1)?.getAttribute('name')).toBe('waepa-declaration');
    expect(resolveMappedFields({ component: 'eligibility' }, { siteId: 'waepa', person: 'child', includeAll: true }).find(field => field.id === 'active-military')?.label).toBe('Is the child on active duty in the Armed Forces?');
  } finally {
    await act(async () => root.unmount()); host.remove(); installPrototypeLibrary(null); vi.unstubAllGlobals();
  }
});
