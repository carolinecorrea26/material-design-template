// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { createMockPlatform, totp } from './mock-platform.mjs';
import { editDraftPageCopy, isLibraryDraft } from '../src/domain/libraryDraft';
import { createSiteBuild } from '../src/domain/siteBuild';
import { resolvePrototypeLibrary } from '../src/domain/prototypeLibrary';
import { effectiveSiteSnapshotTables, normalizedSnapshotTables } from '../src/persistence/catalogTables';
let dir;
afterEach(() => { if (dir) rmSync(dir, { recursive: true, force: true }); });
it('requires a new Association and serves the saved Builder draft through applicant preview', async () => {
  const { data: database, analyticsTags } = JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));
  const prototypeData = Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => [table, database[table]]));
  dir = mkdtempSync(join(tmpdir(), 'builder-acceptance-'));
  const otherDraft = { formatVersion: 1, siteKey: 'ama', baseRevision: 'local:v1:sha256:' + '0'.repeat(64), editVersion: 0, data: prototypeData };
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ version: 1, admin: null, drafts: { other: { id: 'other', version: 1, siteKey: 'ama', payload: otherDraft } }, builderDrafts: { otherBuild: { id: 'otherBuild', ownerId: 'another-user', siteKey: 'ama', libraryDraftId: 'other' } }, payments: {}, releases: {}, heads: {}, audit: [], analytics: [] }));
  const server = createMockPlatform({ database, prototypeTables: effectiveSiteSnapshotTables, libraryTables: normalizedSnapshotTables, analyticsTags, statePath: join(dir, 'state.json'), validatePayload: async payload => {
    if (!isLibraryDraft(payload)) throw new Error('Invalid Library snapshot');
    resolvePrototypeLibrary(payload.data, payload.siteKey, payload.baseRevision);
  } });
  const [handle] = server.listeners('request');
  let cookie = '';
  const api = async (path, body) => {
    const request = Object.assign(Readable.from([JSON.stringify(body)]), {
      url: `/api/mock${path}`, method: 'POST', headers: { 'x-portal-mock': '1', cookie }, socket: { remoteAddress: '127.0.0.1' },
    });
    let status, data;
    await handle(request, {
      setHeader(name, value) { if (name === 'Set-Cookie') cookie = value.split(';')[0]; },
      writeHead(code) { status = code; },
      end(value) { data = JSON.parse(value); },
    });
    return { status, data };
  };
  const enrollment = await api('/auth/setup', { username: 'caroline', password: 'builder-test-acceptance-password' });
  await api('/auth/verify', { code: totp(enrollment.data.secret) });
  expect((await api('/library/save', { id: 'other', expectedVersion: 1, payload: otherDraft })).status).toBe(403);
  expect((await api('/library/save', { expectedVersion: 0, payload: otherDraft })).status).toBe(403);
  const source = (await api('/prototype/library', { siteKey: 'asce' })).data.payload;
  source.data.organizations = database.organizations;
  const identity = {
    siteKey: 'new-acceptance-site', siteName: 'New Acceptance Site', template: 'multi',
    newOrganization: true, organizationKey: 'new-acceptance-tpa', organizationName: 'New Acceptance TPA',
    organizationAcronym: 'TEST', organizationEmail: 'admin@example.invalid', organizationPhone: '(212) 555-0100',
    organizationAddress: { street: '100 Example St', city: 'New York', state: 'NY', zip: '10001' },
    hostingAssociationKey: 'new-acceptance-association', associationName: 'New Acceptance Association', associationAcronym: 'TESTASSN',
    associationWebsite: 'association.example.invalid', associationEmail: 'association@example.invalid', associationPhone: '(212) 555-0101',
    associationAddress: { street: '200 Example St', unit: '5', city: 'New York', state: 'NY', zip: '10001' },
    associationLogo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jTioAAAAASUVORK5CYII=',
  };
  expect(() => createSiteBuild(source, { ...identity, newAssociation: false })).toThrow('A new TPA requires its first Association.');
  const catalog = (await api('/builder/catalog', {})).data;
  expect(catalog.organizations.some(row => row.key === 'new-acceptance-tpa')).toBe(false);
  expect(catalog.associationEntities.some(row => row.key === 'new-acceptance-association')).toBe(false);
  const persisted = JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'));
  expect(Object.keys(persisted.builderDrafts)).toEqual(['otherBuild']);
  expect(persisted.heads).toEqual({});
  const draft = createSiteBuild(source, { ...identity, newAssociation: true });
  const created = await api('/library/save', { expectedVersion: 0, payload: draft });
  expect(created.status).toBe(200);
  const site = draft.data.sites.find(row => row.key === draft.siteKey);
  const build = await api('/builder/draft/create', { siteKey: site.key, siteName: site.name, hostingAssociationId: site.hostingAssociationId, libraryDraftId: created.data.id });
  expect(build.status).toBe(200);
  const edited = editDraftPageCopy(draft, 'home', 'home.hero.title', 'Edited in Site Builder');
  const saved = await api('/library/save', { id: created.data.id, expectedVersion: created.data.version, payload: edited });
  expect(saved.status).toBe(200);
  const current = await api('/prototype/library', { siteKey: edited.siteKey });
  expect(current.data.draft).toMatchObject({ id: created.data.id, version: 2 });
  const preview = resolvePrototypeLibrary(current.data.payload.data, edited.siteKey, draft.baseRevision);
  expect(preview.content.home.hero.title).toBe('Edited in Site Builder');
  expect(preview.client.support).toMatchObject({ website: 'https://association.example.invalid/', address: identity.associationAddress });
});
