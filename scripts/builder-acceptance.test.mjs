// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createMockPlatform, totp } from './mock-platform.mjs';
import { isLibraryDraft } from '../src/domain/libraryDraft';
import { createSiteBuild } from '../src/domain/siteBuild';
import { resolvePrototypeLibrary } from '../src/domain/prototypeLibrary';
import { effectiveSiteSnapshotTables, normalizedSnapshotTables } from '../src/persistence/catalogTables';
let server, dir;
afterEach(async () => { if (server) await new Promise(resolve => server.close(resolve)); if (dir) rmSync(dir, { recursive: true, force: true }); });
it('rejects unsupported Site copies without persisting partial builder or catalog state', async () => {
  const read = file => JSON.parse(readFileSync(`migration-artifacts/mock/${file}.json`, 'utf8'));
  const database = read('database'), analyticsTags = read('analytics-tags');
  const prototypeData = Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, database[table]]));
  dir = mkdtempSync(join(tmpdir(), 'builder-acceptance-'));
  const otherDraft = { formatVersion: 1, siteKey: 'ama', baseRevision: 'local:v1:sha256:' + '0'.repeat(64), editVersion: 0, data: prototypeData };
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ version: 1, admin: null, drafts: { other: { id: 'other', version: 1, siteKey: 'ama', payload: otherDraft } }, builderDrafts: { otherBuild: { id: 'otherBuild', ownerId: 'another-user', siteKey: 'ama', libraryDraftId: 'other' } }, payments: {}, releases: {}, heads: {}, audit: [], analytics: [] }));
  server = createMockPlatform({ database, prototypeTables: effectiveSiteSnapshotTables, libraryTables: normalizedSnapshotTables, analyticsTags, statePath: join(dir, 'state.json'), validatePayload: async payload => {
    if (!isLibraryDraft(payload)) throw new Error('Invalid Library snapshot');
    resolvePrototypeLibrary(payload.data, payload.siteKey, payload.baseRevision);
  } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/mock`; let cookie = '';
  const api = async (path, body) => {
    const response = await fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Portal-Mock': '1', Cookie: cookie }, body: JSON.stringify(body) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return { status: response.status, data: await response.json() };
  };
  const enrollment = await api('/auth/setup', { username: 'caroline', password: 'builder-test-acceptance-password' });
  await api('/auth/verify', { code: totp(enrollment.data.secret) });
  expect((await api('/library/save', { id: 'other', expectedVersion: 1, payload: otherDraft })).status).toBe(403);
  expect((await api('/library/save', { expectedVersion: 0, payload: otherDraft })).status).toBe(403);
  const source = (await api('/prototype/library', { siteKey: 'asce' })).data.payload;
  source.data.organizations = database.organizations;
  expect(() => createSiteBuild(source, { siteKey: 'new-acceptance-site', siteName: 'New Acceptance Site', template: 'multi', newOrganization: true, organizationAcronym: 'TEST', organizationContact: 'Test Administrator', organizationEmail: 'admin@example.invalid', organizationPhone: '555-0100', clientAcronym: 'TESTCLIENT', clientContact: 'Client Contact', clientEmail: 'client@example.invalid', clientPhone: '555-0101', organizationKey: 'new-acceptance-tpa', organizationName: 'New Acceptance TPA', newClient: true, clientKey: 'new-acceptance-client', clientName: 'New Acceptance Client' })).toThrow("The selected Library cannot be copied into a valid Site.");
  const catalog = (await api('/builder/catalog', {})).data;
  expect(catalog.organizations.some(row => row.key === 'new-acceptance-tpa')).toBe(false);
  expect(catalog.clients.some(row => row.key === 'new-acceptance-client')).toBe(false);
  const persisted = JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'));
  expect(Object.keys(persisted.builderDrafts)).toEqual(['otherBuild']);
  expect(persisted.heads).toEqual({});
});
