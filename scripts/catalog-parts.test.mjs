import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { readCatalogParts } from './catalog-parts.mjs';
import { validateIdentityCatalog } from '../src/persistence/identityCatalog.ts';
const saved = () => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
it('preserves every bundled record across separate entity files', () => {
  const parts = readCatalogParts();
  expect(parts).toEqual(saved());
  const groups = {
    tpas: ['organizations', 'organizationProfiles'], clients: ['clients', 'supportProfiles'],
    associations: ['associations', 'associationEntities', 'associationAliases', 'associationAffiliations'],
    sites: ['sites', 'siteEnvironmentLinks', 'siteAssociations', 'siteAssociationContexts'],
  };
  for (const [file, tables] of Object.entries(groups)) {
    const part = JSON.parse(readFileSync(`public/catalog/overview/${file}.json`, 'utf8'));
    expect(Object.keys(part)).toEqual(tables);
    for (const table of tables) expect(part[table]).toEqual(parts.data[table]);
  }
  expect(() => validateIdentityCatalog(parts.data)).not.toThrow();
});

it('separates page structure from Content and keeps supporting data explicit', () => {
  const manifest = JSON.parse(readFileSync('public/catalog/manifest.json', 'utf8'));
  const pages = JSON.parse(readFileSync('public/catalog/pages/pages.json', 'utf8'));
  const content = JSON.parse(readFileSync('public/catalog/content/content.json', 'utf8'));
  expect(Object.keys(pages).sort()).toEqual(['pageSections', 'pages', 'sitePages']);
  expect(Object.keys(content).sort()).toEqual(['contentEntries', 'contentValues', 'documentDefinitions', 'siteDocuments']);
  expect(manifest.parts).toContain('shared/shared.json');
  expect(manifest.parts).toContain('evidence/evidence.json');
  expect(manifest.parts).not.toContain('portal.json');
  const tableNames = manifest.parts.flatMap(file => Object.keys(JSON.parse(readFileSync(`public/catalog/${file}`, 'utf8'))));
  expect(new Set(tableNames).size).toBe(tableNames.length);
});

it('exports portable property contracts and existing page references for handoff', () => {
  const catalog = saved();
  const dictionaryText = readFileSync('docs/handoff/data-dictionary.json', 'utf8');
  expect(dictionaryText).not.toContain(process.cwd());
  const dictionary = JSON.parse(dictionaryText);
  expect(dictionary.tables.map(row => row.table).sort()).toEqual([...Object.keys(catalog.data), 'analyticsTags'].sort());
  const fields = dictionary.tables.find(row => row.table === 'fields');
  expect(fields.properties.find(row => row.name === 'definition').properties.some(row => row.name === 'inputType')).toBe(true);
  const maps = JSON.parse(readFileSync('docs/handoff/page-maps.json', 'utf8'));
  expect(maps.pages.map(page => page.pageKey)).toEqual(['membership', 'eligibility', 'coverage']);
  for (const page of maps.pages) for (const reference of page.references) {
    const part = JSON.parse(readFileSync(reference.file, 'utf8'));
    const keys = new Set(part[reference.table].map(row => row.key ?? row.id));
    expect(reference.keys.every(key => keys.has(key))).toBe(true);
  }
});

