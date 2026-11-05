import { expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMockPlatform } from './mock-platform.mjs';
import { createReviewedMigrationDatabase } from '../src/migration/fixtures';
import { effectiveSiteSnapshotTables } from '../src/repositories/portalDataRepository';
import { isLibraryDraft } from '../src/domain/libraryDraft';
import { legacyPagePositions, migratePageCatalogSnapshot } from '../src/domain/pageCatalogMigration';
import { resolvePrototypeLibrary } from '../src/domain/prototypeLibrary';

it('saves, reloads, restarts and explicitly publishes a converted release without changing its original', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'page-snapshot-migration-'));
  const statePath = join(directory, 'state.json');
  const db = createReviewedMigrationDatabase();
  const payload = { formatVersion: 1, siteKey: 'asce', baseRevision: `local:v1:sha256:${'a'.repeat(64)}`, editVersion: 0,
    data: Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, structuredClone(db[table])])) };
  const old = new Map(legacyPagePositions.map(([key, position]) => [key, position]));
  // Later page additions are custom placements outside the frozen SQL mapping.
  const additions = new Map(payload.data.pages.filter(page => !old.has(page.key)).map((page, index) => [page.key, Math.max(...old.values()) + 1 + index]));
  for (const page of payload.data.pages) { delete page.definition.flow; page.position = old.get(page.key) ?? additions.get(page.key); }
  for (const row of payload.data.sitePages) row.position = old.get(row.pageKey) ?? additions.get(row.pageKey);
  payload.data.pages.find(page => page.key === 'review').definition.path = '/saved-review';
  const original = { id: 'original-release', version: 1, siteKey: payload.siteKey, payloadHash: 'old-hash', payload, mode: 'mock' };
  const initial = { version: 1, admin: null, payments: {}, drafts: {}, releases: { [original.id]: original }, heads: { [payload.siteKey]: original.id }, audit: [], analytics: [] };
  writeFileSync(statePath, JSON.stringify(initial));
  let server;
  const stop = async () => { if (server) await new Promise(resolve => server.close(resolve)); server = null; };
  const start = async (readinessApproved = false) => {
    server = createMockPlatform({ database: db, prototypeTables: effectiveSiteSnapshotTables, statePath, accountSignInEnabled: false,
      validatePayload: draft => { if (!isLibraryDraft(draft)) throw new Error('Invalid draft'); resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision); },
      // Test-only readiness approval; real publication retains its existing gates.
      checkReadiness: () => readinessApproved ? [] : ['Fresh acceptance evidence required'] });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const url = `http://127.0.0.1:${server.address().port}/api/mock`;
    return async (path, body, expectedStatus = 200) => {
      const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Portal-Mock': '1' }, body: JSON.stringify(body) });
      const result = await response.json(); expect(response.status, JSON.stringify(result)).toBe(expectedStatus); return result;
    };
  };
  try {
    const { draft } = migratePageCatalogSnapshot(original.payload);
    let request = await start();
    const saved = await request('/library/save', { expectedVersion: 0, payload: draft });
    expect(saved.id).not.toBe(original.id);
    await request('/library/publish', { id: saved.id, expectedVersion: saved.version, expectedReleaseId: original.id }, 409);
    const persisted = JSON.parse(readFileSync(statePath, 'utf8'));
    expect(persisted.releases[original.id]).toEqual(original);
    expect(persisted.heads).toEqual(initial.heads);
    await stop(); request = await start(true);
    const reloaded = await request('/prototype/library', { siteKey: draft.siteKey });
    expect(reloaded.payload).toEqual(draft);
    expect(resolvePrototypeLibrary(reloaded.payload.data, draft.siteKey, reloaded.revision).pages.find(page => page.key === 'review').definition.path).toBe('/saved-review');
    const published = await request('/library/publish', { id: saved.id, expectedVersion: saved.version, expectedReleaseId: original.id });
    expect(published.payload).toEqual(draft);
    await stop(); await start();
    const final = JSON.parse(readFileSync(statePath, 'utf8'));
    expect(final.releases[original.id]).toEqual(original);
    expect(final.heads[draft.siteKey]).toBe(published.id);
    expect(isLibraryDraft(final.releases[published.id].payload)).toBe(true);
  } finally { await stop(); rmSync(directory, { recursive: true, force: true }); }
}, 120000);
