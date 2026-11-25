import CommunicationsLibrary from './CommunicationsLibrary';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { projectLibraryCatalog } from '../../../services/libraryCatalogService';
import ContentLibrary from './ContentLibrary';
import ConfigurationsLibrary from './ConfigurationsLibrary';
import BusinessRulesLibrary from './BusinessRulesLibrary';
import ProductsLibrary from './ProductsLibrary';
import SiteInformationLibrary from './SiteInformationLibrary';
import UrlParametersLibrary from './UrlParametersLibrary';
import ValidationLibrary from './ValidationLibrary';
import StoredFlowsLibrary from './StoredFlowsLibrary';
import { configurationRows } from './configurationRows';
import { libraryRequirementRows } from './libraryRequirementRows';
import { libraryImplementation } from './libraryRecordColumns';

const catalog = projectLibraryCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
vi.mock('./LibraryCatalogContext', () => ({ useLibraryCatalog: () => catalog }));

it('keeps workbook citations out of all functional row text, including collapsed rows', () => {
  for (const scope of ['all', 'asce']) {
    const content = [
      ...configurationRows(catalog, scope).map(row => [row.name, row.description, row.owner === 'configurations' ? row.values : '', row.options, row.usedIn]),
      ...libraryRequirementRows(catalog, scope).map(row => [row.name, row.behavior, row.hierarchy, libraryImplementation(row.implementation, row.dataset)]),
    ];
    expect(JSON.stringify(content).match(/.{0,55}(?:\bmcr\b|Master Client Requirements).{0,90}/gi) ?? []).toEqual([]);
  }
}, 60000);

it.each([
  ['content', ContentLibrary, ''], ['content with old definition filter', ContentLibrary, '&dataset=contentEntries'], ['content with old document filter', ContentLibrary, '&dataset=documentDefinitions'],
  ['configurations', ConfigurationsLibrary, ''], ['coverage settings', ConfigurationsLibrary, '&view=coverage&coverageView=settings'],
  ['coverage review', ConfigurationsLibrary, '&view=coverage&coverageView=review'], ['applicant settings', ConfigurationsLibrary, '&view=applicants'],
  ['email content', CommunicationsLibrary, ''], ['theme settings', ConfigurationsLibrary, '&view=theme'], ['contact settings', ConfigurationsLibrary, '&view=contacts'],
  ['validation', ValidationLibrary, ''], ['flows', StoredFlowsLibrary, ''],
  ['rules', BusinessRulesLibrary, ''], ['products', ProductsLibrary, ''], ['client information', SiteInformationLibrary, ''], ['URL parameters', UrlParametersLibrary, ''],
] as const)('keeps workbook provenance outside the rendered %s Library', async (label, Component, search) => {
  for (const siteKey of ['all', 'asce']) {
    const view = <MemoryRouter initialEntries={[`/?site=${siteKey}${search}`]}><Component siteKey={siteKey} /></MemoryRouter>;
    let html: string;
    // Email previews render their own HTML; use the browser renderer for that view.
    if (label === 'email content') {
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
      const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
      try { await act(async () => root.render(view)); html = host.innerHTML; }
      finally { await act(async () => root.unmount()); host.remove(); vi.unstubAllGlobals(); }
    } else html = renderToStaticMarkup(view);
    expect(html.match(/.{0,60}(?:\bmcr\b|Master Client Requirements).{0,90}/gi) ?? []).toEqual([]);
  }
});

it.each(['all', 'asce'])('opens canonical email records from a flow reference (%s)', async siteKey => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<MemoryRouter initialEntries={[`/?site=${siteKey}&flow=emails&q=resume-magic-link`]}><StoredFlowsLibrary siteKey={siteKey} /></MemoryRouter>));
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(container.textContent).toContain('Application resume request');
    expect(container.textContent).toContain('advisor’s own email and phone');
    expect(container.textContent).not.toContain('Application autosaved');
    expect(container.querySelector('a[href*="/tutorials/"]')).toBeNull();
  } finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
