import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';

// Read the saved catalog and reuse the Library projection. No seed or runtime
// values are written by this document-only export.
const dom = new JSDOM('', { url: 'http://localhost/?site=abe' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const { fieldSurfaceRows } = await server.ssrLoadModule('/src/pages/admin/library/fieldSurfaceRows.ts');
  const { fieldCatalogRows, fieldCatalogMarkdown, fieldUsageMarkdown } = await server.ssrLoadModule('/src/pages/admin/library/fieldCatalogRows.ts');
  const { validateSharedCatalog } = await server.ssrLoadModule('/src/persistence/sharedCatalog.ts');
  const catalog = { ...validateSharedCatalog(JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'))), revision: 'document-export' };
  const { resolvePrototypeLibrary } = await server.ssrLoadModule('/src/domain/prototypeLibrary.ts');
  for (const site of catalog.data.sites) resolvePrototypeLibrary(catalog.data, site.key, catalog.revision);
  const { storedApplicationPageRows } = await server.ssrLoadModule('/src/pages/admin/library/storedLibraryModel.ts');
  const pages = storedApplicationPageRows(catalog, 'abe');
  const pageTable = ['| ID | Page name | Route | Flow |', '| --- | --- | --- | --- |', ...pages.map(page => `| \`${page.key}\` | ${page.definition.displayName ?? page.key} | \`${page.route}\` | ${page.flow} |`)].join('\n');
  const usages = fieldSurfaceRows(catalog, 'abe');
  const fields = fieldCatalogRows(catalog, 'abe', usages);
  const path = 'docs/project-review/abe-template-requirements.md';
  let markdown = readFileSync(path, 'utf8');
  const original = markdown;
  const pageStart = '<!-- ABE-PAGE-CATALOG:START -->', pageEnd = '<!-- ABE-PAGE-CATALOG:END -->';
  if (!markdown.includes(pageStart) || !markdown.includes(pageEnd)) throw new Error('Missing Pages catalog markers');
  markdown = markdown.slice(0, markdown.indexOf(pageStart) + pageStart.length) + '\n' + pageTable + '\n' + markdown.slice(markdown.indexOf(pageEnd));
  for (const [name, content] of [['CATALOG', fieldCatalogMarkdown(fields)], ['USAGE', fieldUsageMarkdown(usages)]]) {
    const start = `<!-- ABE-FIELD-${name}:START -->`, end = `<!-- ABE-FIELD-${name}:END -->`;
    const before = markdown.indexOf(start), after = markdown.indexOf(end);
    if (before < 0 || after <= before) throw new Error(`Missing Fields ${name} markers`);
    markdown = markdown.slice(0, before + start.length) + '\n' + content + '\n' + markdown.slice(after);
  }
  const componentStart = '<!-- ABE-COMPONENT-CATALOG:START -->', componentEnd = '<!-- ABE-COMPONENT-CATALOG:END -->';
  const componentBefore = markdown.indexOf(componentStart), componentAfter = markdown.indexOf(componentEnd);
  if (componentBefore < 0 || componentAfter <= componentBefore) throw new Error('Missing Components catalog markers');
  const cell = value => String(value).replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
  const componentTable = ['| ID | Name | Description | Category | Example |', '| --- | --- | --- | --- | --- |', ...catalog.data.components.map(row => `| \`${row.key}\` | ${cell(row.definition.name)} | ${cell(row.definition.description)} | ${cell(row.definition.section)} | \`${row.definition.storyId}\` |`)].join('\n');
  markdown = markdown.slice(0, componentBefore + componentStart.length) + '\n' + componentTable + '\n' + markdown.slice(componentAfter);
  if (process.argv.includes('--check')) {
    if (markdown !== original) throw new Error('Requirements tables differ from the shared catalog. Run npm run docs:abe.');
  } else writeFileSync(path, markdown);
  console.log(JSON.stringify({ source: 'public/catalog/portal.json', sites: catalog.data.sites.length, pages: pages.length, fields: fields.length, usages: usages.length, components: catalog.data.components.length, check: process.argv.includes('--check') }));
} finally {
  await server.close();
  dom.window.close();
}
