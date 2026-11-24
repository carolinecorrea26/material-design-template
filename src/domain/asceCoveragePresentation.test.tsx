import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import ProductCard from '../components/layout/ProductCard';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { buildGlobalTemplate } from '../dev/storybook/globalTemplate';
import { configurationRows } from '../pages/admin/library/configurationRows';

const catalog = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
it('projects ASCE product wording, three QD products and the additional-coverage note consistently', async () => {
  const prototype = resolvePrototypeLibrary(catalog.data, 'asce', 'asce-product-copy');
  const story = buildGlobalTemplate(catalog, 'multipleTerms');
  for (const scope of ['all', 'asce']) {
    const rows = configurationRows(catalog, scope);
    for (const key of ['requirements:product-description-notices', 'requirements:product-applicant-notes']) expect(rows.find(row => row.key === key)?.scope).toBe('Global template');
    if (scope === 'asce') expect(rows.find(row => row.key === 'requirements:product-description-notices')?.values).toContain('Please note: If you are already insured');
  }
  for (const model of [prototype, story]) {
    expect(model.products.filter(product => product.underwritingType === 'QD').map(product => product.id).sort()).toEqual(['li-10yr', 'li-20yr', 'li-term']);
    expect(model.client.coverages.additionalCoverageWarning).toBe('applyForAdditional');
    expect(model.products.find(product => product.id === 'li-add')?.name).toBe('High-Limit Accident Insurance');
    expect(model.products.find(product => product.id === 'li-term')?.description).toContain('The simple, economical way');
    for (const key of ['li-term', 'li-10yr', 'li-20yr']) expect(model.products.find(product => product.id === key)?.applicantNotes?.spouse).toBe('Spouse benefit amount may not exceed the member benefit amount (whether already insured or applying now).');
  }
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try {
    for (const id of ['li-10yr', 'li-20yr']) {
      const product = prototype.products.find(product => product.id === id)!;
      await act(async () => root.render(<ProductCard productName={product.name} description={product.description} descriptionNotice={product.descriptionNotice} />));
      expect(host.querySelector('strong')?.textContent).toBe('Please note: If you are already insured under this policy, a new application will be based on your current age and amount of coverage requested.');
      expect(getComputedStyle(host.querySelector('strong')!).display).toBe('block');
      expect(getComputedStyle(host.querySelector('strong')!).fontWeight).toBe('700');
    }
  } finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
});
