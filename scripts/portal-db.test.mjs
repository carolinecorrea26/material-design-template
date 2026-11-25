import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';
import { PGlite } from '@electric-sql/pglite';
import { createServer } from 'vite';
import { createPortalHandler } from '../netlify/functions/portal.mjs';
import { checkPortalCatalog, preparePortalDatabase } from './seed-portal-db.mjs';

test('the published catalog, admin scope, draft preview and submitted application round-trip through PostgreSQL', async () => {
  const db = new PGlite();
  const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  try {
    const query = async (sql, params) => params === undefined ? (await db.exec(sql))[0] : db.query(sql, params);
    const pool = { query, connect: async () => ({ query, release() {} }) };
    const catalogText = await readFile(new URL('../public/catalog/portal.json', import.meta.url), 'utf8');
    const password = 'fictional-test-password';
    const { revision, siteCount } = await preparePortalDatabase(pool, { catalogText, adminPassword: password, managerPassword: password });
    assert.equal(siteCount, 10);
    assert.equal(await checkPortalCatalog(pool, catalogText), revision);
    await assert.rejects(checkPortalCatalog(pool, catalogText + '\n'), /differs from public\/catalog\/portal.json/);
    await assert.rejects(preparePortalDatabase(pool, {
      catalogText: catalogText + '\n', expectedRevision: 'unexpected-revision',
    }), /differs from both the live Portal and this release/);
    assert.equal(await checkPortalCatalog(pool, catalogText), revision);
    const handler = createPortalHandler(pool);
    const origin = 'https://portal.example.test';
    const request = (path, body, cookie) => handler(new Request(`${origin}${path}`, {
      method: body ? 'POST' : 'GET', headers: { Origin: origin, ...(body && { 'Content-Type': 'application/json' }), ...(cookie && { Cookie: cookie }) },
      body: body && JSON.stringify(body),
    }));
    async function call(path, body, cookie, expected = 200) {
      const response = await request(`/api/portal${path}`, body, cookie);
      const result = await response.json();
      assert.equal(response.status, expected, JSON.stringify([path, result]));
      return result;
    }
    async function login(email) {
      const response = await request('/api/portal/session', { action: 'login', email, password });
      assert.equal(response.status, 200);
      const cookie = response.headers.get('Set-Cookie');
      assert.ok(['HttpOnly', 'SameSite=Strict', 'Secure'].every(attribute => cookie.split('; ').includes(attribute)));
      return cookie.split(';')[0];
    }

    const { createSharedCatalogReader, prototypeCatalogData, PublishedCatalogMismatchError } = await vite.ssrLoadModule('/src/persistence/sharedCatalog.ts');
    const hash = revision.split(':').at(-1);
    const catalog = await createSharedCatalogReader(path => request(path), '/', hash)();
    const catalogResponse = await request('/api/portal/catalog');
    const etag = catalogResponse.headers.get('ETag');
    assert.equal(etag, `W/"${revision}"`);
    const cached = await handler(new Request(`${origin}/api/portal/catalog`, { headers: { 'If-None-Match': etag } }));
    assert.equal(cached.status, 304);
    assert.equal(cached.body, null);
    assert.equal(cached.headers.get('X-Portal-Catalog-Revision'), revision);
    await catalogResponse.body.cancel();
    await assert.rejects(createSharedCatalogReader(path => request(path), '/', 'f'.repeat(64))(), PublishedCatalogMismatchError);
    const incorrectPayload = () => new Response(gzipSync('{}'), { headers: { 'X-Portal-Catalog-Revision': revision } });
    await assert.rejects(createSharedCatalogReader(incorrectPayload, '/', hash)(), PublishedCatalogMismatchError);
    const staticCatalog = await createSharedCatalogReader(async () => new Response(catalogText), '/')();
    assert.equal(catalog.revision, revision);
    assert.deepEqual(catalog.data, staticCatalog.data);
    assert.deepEqual(catalog.analyticsTags, staticCatalog.analyticsTags);
    assert.equal(Object.hasOwn(catalog.data, 'clients'), false);

    await call('/sites', undefined, undefined, 401);
    const admin = await login('portal.admin@example.test');
    const manager = await login('account.manager@example.test');
    const sites = await call('/sites', undefined, admin);
    assert.deepEqual(sites.map(site => site.key).sort(), ['abe', 'ama', 'ama-gi', 'asce', 'avma', 'csea', 'isitrust', 'nso', 'waepa', 'waepa-gi']);
    assert.equal(sites.find(site => site.key === 'asce').migrationStage, 'Requirements');
    assert.equal(sites.find(site => site.key === 'ama').hostingAssociationId, sites.find(site => site.key === 'ama-gi').hostingAssociationId);
    assert.equal(sites.find(site => site.key === 'asce').organizationName, 'Pearl Insurance');
    assert.ok(sites.filter(site => site.key !== 'asce').every(site => site.migrationStatus === 'Not started'));
    assert.deepEqual((await call('/sites', undefined, manager)).map(site => site.key), ['asce']);
    assert.equal((await call('/users', undefined, admin)).length, 2);
    await call('/users', undefined, manager, 403);

    const { withFreshStartCatalog } = await vite.ssrLoadModule('/src/domain/freshStartCatalog.ts');
    const { resolveCompiledPrototypeLibrary } = await vite.ssrLoadModule('/src/domain/prototypeLibrary.ts');
    const { projectLibraryCatalog } = await vite.ssrLoadModule('/src/services/libraryCatalogService.ts');
    const { templateSourceLibraries } = await vite.ssrLoadModule('/src/dev/storybook/globalTemplate.ts');
    const publishedData = withFreshStartCatalog(prototypeCatalogData(catalog));
    const published = projectLibraryCatalog(catalog);
    const stories = new Map(templateSourceLibraries(staticCatalog).map(library => [library.site.siteKey, library]));
    for (const { key, templateType } of sites) {
      const prototype = resolveCompiledPrototypeLibrary(publishedData, key, revision);
      assert.equal(prototype.site.siteKey, key);
      assert.equal(prototype.client.features.defaultTemplate, templateType);
      assert.equal(prototype.revision, published.revision);
      assert.ok(published.data.pages.every(page => prototype.pages.some(candidate => candidate.definition.id === page.key)));
      assert.deepEqual(prototype.pages, stories.get(key).pages);
      assert.deepEqual(prototype.fields, stories.get(key).fields);
      assert.deepEqual(prototype.products, stories.get(key).products);
    }

    const draft = await call('/drafts', { action: 'create', siteKey: 'asce', baseRevision: revision }, admin);
    const saveDraft = { action: 'save', id: draft.id, expectedVersion: draft.version, formTemplate: 'single' };
    await call('/drafts', saveDraft, manager, 403);
    await call('/drafts', saveDraft, admin);
    await call('/drafts', saveDraft, admin, 409);
    const reopened = await call('/drafts', { action: 'get', id: draft.id }, manager);
    assert.equal(reopened.formTemplate, 'single');
    const { resolvePortalDraft } = await vite.ssrLoadModule('/src/services/portalDrafts.ts');
    const preview = resolvePortalDraft(catalog, 'asce', reopened);
    assert.equal(preview.client.features.defaultTemplate, 'single');
    assert.equal(resolveCompiledPrototypeLibrary(publishedData, 'asce', revision).client.features.defaultTemplate, 'multi');
    const { syntheticRatingService } = await vite.ssrLoadModule('/src/domain/pricing.ts');
    const quote = await syntheticRatingService(preview.products).quote({ siteKey: 'asce', productKey: 'li-term', amount: 100000, frequency: 'annual', dimensions: {} });
    assert.ok(quote.premiumCents > 0);
    assert.match(quote.authority, /Synthetic/);
    assert.equal(Math.round(quote.components.reduce((total, item) => total + item.amount, 0) * 100), quote.premiumCents);
    assert.throws(() => resolvePortalDraft(catalog, 'abe', reopened), /Site or Library revision/);
    const other = await call('/drafts', { action: 'create', siteKey: 'abe', baseRevision: revision }, admin);
    await call('/drafts', { action: 'get', id: other.id }, manager, 404);

    const siteKey = 'asce';
    const email = 'test-applicant@example.test';
    const values = {
      email, coverageSelections: ['li-term', 'li-10yr'], productApplicants: { 'li-term': ['member', 'spouse'], 'li-10yr': ['member'] },
      coverageAmounts: { 'li-term:member': 250000, 'li-term:spouse': 100000, 'li-10yr:member': 50000 },
      ignoredAnswer: 'excluded from database snapshot',
    };
    const save = await call('/applicant/save', { siteKey, recipient: email, revision, values });
    const workflow = { siteKey, recipient: email, applicationId: save.applicationId, writeCapability: save.writeCapability };
    const { rows: [stored] } = await query('SELECT state FROM portal_applicant_workflow WHERE site_key = $1', [siteKey]);
    assert.equal(stored.state.applications[save.applicationId].values.ignoredAnswer, undefined);
    await call('/applicant/workflow', { ...workflow, event: 'complete-signing' }, undefined, 409);
    await call('/applicant/workflow', { ...workflow, event: 'start-signing' });
    const result = await call('/applicant/workflow', { ...workflow, event: 'complete-signing' });
    const retry = await call('/applicant/workflow', { ...workflow, event: 'complete-signing' });
    assert.equal(result.applicationNumber, retry.applicationNumber);
    const list = await call('/applications', { action: 'list' }, admin);
    assert.equal(list.applications.length, 1);
    assert.equal(list.applications[0].applicationNumber, result.applicationNumber);
    assert.equal(list.applications[0].coverages.length, 3);
    assert.equal(list.events.length, 1);
    await call('/applications', { action: 'approve', id: save.applicationId }, manager, 403);
    await call('/applications', { action: 'approve', id: save.applicationId }, admin);
    await call('/applications', { action: 'reject', id: save.applicationId }, admin, 409);
    assert.equal((await call('/applications', { action: 'list' }, admin)).events.length, 2);

    await preparePortalDatabase(pool, { catalogText });
    assert.equal((await call('/applications', { action: 'list' }, admin)).applications.length, 1);
    assert.equal((await call('/drafts', { action: 'get', id: draft.id }, admin)).formTemplate, 'single');
    const equivalentCatalog = catalogText + '\n';
    const republished = await preparePortalDatabase(pool, { catalogText: equivalentCatalog });
    assert.notEqual(republished.revision, revision);
    assert.equal(await checkPortalCatalog(pool, equivalentCatalog), republished.revision);
    const republishedDraft = await call('/drafts', { action: 'get', id: draft.id }, admin);
    assert.equal(republishedDraft.baseRevision, republished.revision);
    assert.equal(republishedDraft.formTemplate, 'single');
    await call('/session', { action: 'logout' }, admin);
    await call('/sites', undefined, admin, 401);
  } finally {
    await Promise.all([vite.close(), db.close()]);
  }
});

test('backfills existing Site identities and preserves submissions, status, and equivalent drafts', async () => {
  const db = new PGlite();
  try {
    const query = async (sql, params) => params === undefined ? (await db.exec(sql))[0] : db.query(sql, params);
    const pool = { query, connect: async () => ({ query, release() {} }) };
    const catalogText = await readFile(new URL('../public/catalog/portal.json', import.meta.url), 'utf8');
    const legacy = JSON.parse(catalogText);
    legacy.data.clients = legacy.data.associationAliases.filter(alias => alias.sourceTable === 'clients').map(alias => alias.originalRecord);
    for (const row of legacy.data.sites) row.clientId = row.hostingAssociationId;
    const site = legacy.data.sites.find(row => row.key === 'asce');
    await query(await readFile(new URL('../netlify/database/migrations/0001_portal.sql', import.meta.url), 'utf8'));
    await query('INSERT INTO portal_catalog (id, revision, payload) VALUES (1, $1, $2)', ['legacy', JSON.stringify(legacy)]);
    await query("INSERT INTO portal_sites (site_key, identity, migration_stage, migration_status) VALUES ('asce', $1, 'QA', 'In progress')", [JSON.stringify(site)]);
    await query("INSERT INTO portal_site_drafts (id, site_key, base_revision, form_template) VALUES ('asce-draft', 'asce', 'legacy', 'single')");
    await query("INSERT INTO portal_applications (id, site_key, catalog_revision, submitted_at, record) VALUES ('existing', 'asce', 'legacy', now(), '{}')");
    const { revision } = await preparePortalDatabase(pool, { catalogText });
    const { rows: [backfilled] } = await query(`SELECT s.identity, s.migration_stage, a.id AS association_id, t.name AS tpa_name
      FROM portal_sites s JOIN portal_associations a ON a.id = s.hosting_association_id JOIN portal_tpas t ON t.id = a.tpa_id
      WHERE s.site_key = 'asce'`);
    assert.equal(backfilled.migration_stage, 'QA');
    assert.equal(backfilled.association_id, site.hostingAssociationId);
    assert.equal(backfilled.tpa_name, 'Pearl Insurance');
    assert.equal(Object.hasOwn(backfilled.identity, 'clientId'), false);
    const { rows: [draft] } = await query("SELECT base_revision, form_template FROM portal_site_drafts WHERE id = 'asce-draft'");
    assert.deepEqual(draft, { base_revision: revision, form_template: 'single' });
    const { rows: [application] } = await query("SELECT site_key, catalog_revision FROM portal_applications WHERE id = 'existing'");
    assert.deepEqual(application, { site_key: 'asce', catalog_revision: 'legacy' });
    await assert.rejects(query("INSERT INTO portal_associations VALUES ('invalid', 'invalid', 'unknown', 'Invalid')"), /foreign key constraint/);
    await assert.rejects(query("UPDATE portal_sites SET hosting_association_id = NULL WHERE site_key = 'asce'"), /not-null constraint/);
  } finally {
    await db.close();
  }
});
