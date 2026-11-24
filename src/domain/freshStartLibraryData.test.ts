import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { projectLibraryCatalog, type LibraryCatalog } from '../services/libraryCatalogService';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { freshStartSource } from './freshStartCatalog';
import { withFreshStartCatalog } from './freshStartCatalog';
import { portalLibraryData } from './portalLibraryScope';

const catalog = () => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')) as LibraryCatalog;

it('reconstructs the Library from authored records without parked imports and preserves effective ASCE behavior', () => {
  const original = catalog(), before = JSON.stringify(original);
  const result = projectLibraryCatalog(original);
  const source = freshStartSource();
  expect(result.data.sites.map(row => row.key).sort()).toEqual(Object.keys(source.fields.sites).sort());
  expect(result.data.products.map(row => row.key).sort()).toEqual(source.products.catalog.products.map(row => row.key).sort());
  for (const table of ['products', 'coverageCategories', 'riders', 'contentEntries', 'contentValues', 'coveragePlanDefinitions', 'coveragePlanVariants'] as const)
    expect(result.data[table].some(row => String(row.key).startsWith('mcr.')), table).toBe(false);
  const previous = resolvePrototypeLibrary(portalLibraryData(withFreshStartCatalog(original.data)), 'asce', original.revision);
  const projected = resolvePrototypeLibrary(result.data, 'asce', original.revision);
  expect(projected.client).toEqual(previous.client);
  expect(projected.content).toEqual(previous.content);
  expect(projected.fieldSurfaces).toEqual(previous.fieldSurfaces);
  expect(JSON.stringify(original)).toBe(before);
});
