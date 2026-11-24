import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { projectLibraryCatalog } from '../../../services/libraryCatalogService';
vi.mock('./LibraryCatalogContext', () => ({ useLibraryCatalog: () => catalog }));
import BusinessRulesLibrary from './BusinessRulesLibrary';

const catalog = projectLibraryCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')));
function table(layout: string | undefined, query: string) {
  const search = new URLSearchParams({ q: query, ...(layout ? { templates: layout } : {}) });
  const html = renderToStaticMarkup(<MemoryRouter initialEntries={[`/library?${search}`]}><BusinessRulesLibrary siteKey="asce" /></MemoryRouter>);
  return new DOMParser().parseFromString(html, 'text/html').querySelector('tbody')!.textContent;
}
it('filters by layout while retaining shared rules and global layout definitions under the Site filter', async () => {
  const single = 'rule-form-template-single-template-forces-the-narrow-screen-layout-not-a-separate-one-page-form';
  expect(table(undefined, single)).toContain('Single template embeds');
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(table('Single page', single)).toContain('Single page');
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(table('Multi page', single)).toContain('No business rules match these filters.');
  for (const layout of ['Single page', 'Multi page']) {
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(table(layout, 'effective-site-configuration-resolution')).toContain('All layouts');
  }
}, 60000);
