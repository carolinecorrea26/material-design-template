import { beforeAll, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { effectiveSiteSnapshotTables } from '../repositories/portalDataRepository';
import { isLibraryDraft, type LibraryDraft } from './libraryDraft';
import { legacyPagePositions, migratePageCatalogSnapshot } from './pageCatalogMigration';
import { resolvePrototypeLibrary } from './prototypeLibrary';

let baseline: LibraryDraft;
beforeAll(() => {
  const db = createReviewedMigrationDatabase();
  baseline = { formatVersion: 1, siteKey: 'asce', baseRevision: `local:v1:sha256:${'a'.repeat(64)}`, editVersion: 2,
    data: Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, db[table]])) as unknown as LibraryDraft['data'] };
}, 120000);
function legacy() {
  const draft = structuredClone(baseline);
  const old = new Map(legacyPagePositions.map(([key, position]) => [key as string, position]));
  // Later page additions are custom placements outside the frozen SQL mapping.
  const additions = new Map(draft.data.pages.filter(page => !old.has(page.key)).map((page, index) => [page.key, Math.max(...old.values()) + 1 + index]));
  draft.data.pages = draft.data.pages.map(page => {
    const definition = { ...page.definition } as Partial<typeof page.definition>; delete definition.flow;
    return { ...page, definition: definition as typeof page.definition, position: old.get(page.key) ?? additions.get(page.key)! };
  });
  for (const row of draft.data.sitePages) row.position = old.get(row.pageKey) ?? additions.get(row.pageKey)!;
  draft.mockTransport = { id: 'old-draft', version: 4, baseReleaseId: 'old-release' };
  return draft;
}
it('keeps the explicit converter aligned with the PostgreSQL legacy mapping', () => {
  const sql = readFileSync('supabase/migrations/202610090001_page_catalog_contract.sql', 'utf8');
  expect([...sql.matchAll(/\('([^']+)', (\d+), (\d+)\)/g)].map(([, key, old, next]) => [key, Number(old), Number(next)])).toEqual(legacyPagePositions);
});
it('converts a legacy snapshot into an executable detached draft without changing the original', () => {
  const source = legacy(), before = structuredClone(source);
  source.data.pages.find(page => page.key === 'review')!.definition.path = '/custom-review';
  source.data.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'contact')!.requirement = 'none';
  const frozen = structuredClone(source);
  expect(isLibraryDraft(source)).toBe(false);
  const { draft, changes } = migratePageCatalogSnapshot(source);
  expect(source).toEqual(frozen);
  expect(draft.mockTransport).toBeUndefined();
  expect(isLibraryDraft(JSON.parse(JSON.stringify(draft)))).toBe(true);
  const library = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
  expect(library.pages.find(page => page.key === 'review')).toMatchObject({ definition: { path: '/custom-review', flow: 'application' }, position: 7 });
  expect(library.pages.find(page => page.key === 'contact')?.enabled).toBe(false);
  expect(library.pages.find(page => page.key === 'profile')?.position).toBe(6);
  expect(changes.filter(change => change.property === 'flow')).toHaveLength(before.data.pages.length);
  expect(migratePageCatalogSnapshot(draft)).toEqual({ draft, changes: [] });
});
it('preserves customized global and Site orders while converting untouched Sites', () => {
  const source = legacy();
  source.data.pages.find(page => page.key === 'membership')!.position = 100;
  source.data.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'membership')!.position = 100;
  const { draft } = migratePageCatalogSnapshot(source);
  expect(draft.data.pages.find(page => page.key === 'profile')!.position).toBe(29);
  expect(draft.data.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'profile')!.position).toBe(29);
  expect(draft.data.sitePages.find(row => row.siteKey === 'ama' && row.pageKey === 'profile')!.position).toBe(6);
});
it('preserves existing flow labels and refuses malformed or ambiguous snapshots', () => {
  const authored = legacy();
  authored.data.pages.find(page => page.key === 'profile')!.definition.flow = 'application';
  expect(migratePageCatalogSnapshot(authored).draft.data.pages.find(page => page.key === 'profile')!.position).toBe(29);
  const invalid = legacy(); invalid.data.pages[1].definition.path = invalid.data.pages[0].definition.path;
  expect(() => migratePageCatalogSnapshot(invalid)).toThrow();
  const ambiguous = legacy(); ambiguous.data.sitePages.find(row => row.siteKey === 'ama' && row.pageKey === 'membership')!.position = 0;
  expect(() => migratePageCatalogSnapshot(ambiguous)).toThrow();
  const laterCollision = legacy();
  laterCollision.data.pages.find(page => page.key === 'health-ci')!.position = 12;
  expect(() => migratePageCatalogSnapshot(laterCollision)).toThrow('Ambiguous stored page order');
  expect(() => migratePageCatalogSnapshot({ formatVersion: 2 })).toThrow();
});
