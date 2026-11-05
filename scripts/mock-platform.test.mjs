// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const temporaryStores = [];
afterEach(() => { for (const path of temporaryStores.splice(0)) rmSync(path, { recursive: true, force: true }); });
import { createMockPlatform, totp, base32 } from './mock-platform.mjs';

const sites = ['demo','abe','ama','asce','avma','csea','nso','isitrust','waepa','waepa-gi'];
const database = { sites: sites.map(key => ({ id: key, key })), siteProducts: sites.map(siteId => ({ siteId, productKey: 'test-life', enabled: true })) };
let server;
afterEach(async () => { if (server) await new Promise(resolve => server.close(resolve)); server = null; });
async function api(options = {}) {
  let currentTime = 1760000000000;
  server = createMockPlatform({ database, clock: () => currentTime, ...options });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const url = `http://127.0.0.1:${server.address().port}/api/mock`; let cookie = '';
  return {
    advance: (milliseconds = 60000) => { currentTime += milliseconds; },
    get cookie() { return cookie; },
    code: secret => totp(secret, currentTime),
    async request(path, body, requestCookie = cookie) {
      const response = await fetch(url + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Portal-Mock': '1', Cookie: requestCookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      return { status: response.status, data: await response.json() };
    },
  };
}
it('matches the RFC6238 SHA1 test vector', () => {
  const secret = base32(Buffer.from('12345678901234567890'));
  expect(totp(secret, 59000, 8)).toBe('94287082');
  expect(totp(secret, 1111111109000, 8)).toBe('07081804');
});
it('opens local development administration while disabling account sign-in without changing credentials', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mock-signin-disabled-')); temporaryStores.push(dir);
  const statePath = join(dir, 'state.json');
  const client = await api({ statePath, accountSignInEnabled: false, operationsDatabase: { sites: [{ id: 'asce' }] } });
  const before = readFileSync(statePath, 'utf8');
  expect((await client.request('/auth/status')).data).toMatchObject({ signInDisabled: true, authenticated: true, canEdit: true });
  expect((await client.request('/auth/login', { username: 'caroline', password: 'unused' })).status).toBe(403);
  expect((await client.request('/builder/drafts', {})).status).toBe(200);
  expect((await client.request('/operations/read', { table: 'sites' })).data).toEqual([{ id: 'asce' }]);
  expect(readFileSync(statePath, 'utf8')).toBe(before);
});
it('provisions only caroline without email and protects TOTP sessions and one-use recovery', async () => {
  const client = await api();
  expect((await client.request('/auth/status')).data).toMatchObject({ email: 'caroline@example.invalid', setupNeeded: true, authenticated: false });
  const enrollment = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  expect(enrollment.status).toBe(200); expect(enrollment.data.recoveryCodes).toHaveLength(8);
  const uri = new URL(enrollment.data.uri);
  expect(uri.protocol).toBe('otpauth:');
  expect(uri.searchParams.get('secret')).toBe(enrollment.data.secret);
  expect(uri.searchParams.get('issuer')).toBe('Portal Mock');
  expect(uri.searchParams.get('digits')).toBe('6');
  expect(uri.searchParams.get('period')).toBe('30');
  expect(enrollment.data.qrDataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  expect(Buffer.from(enrollment.data.qrDataUrl.split(',')[1], 'base64').toString('utf8')).toContain('<svg');
  expect((await client.request('/library/save', { payload: {} })).status).toBe(401);
  expect((await client.request('/auth/verify', { code: client.code(enrollment.data.secret) })).status).toBe(200);
  expect((await client.request('/auth/status')).data.authenticated).toBe(true);
  expect((await client.request('/auth/verify', { code: client.code(enrollment.data.secret) })).status).toBe(401);
  await client.request('/auth/logout', {});
  await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' });
  expect((await client.request('/auth/recover', { code: enrollment.data.recoveryCodes[0] })).data.reenrollmentRequired).toBe(true);
  expect((await client.request('/auth/status')).data.authenticated).toBe(false);
  expect((await client.request('/auth/recover', { code: enrollment.data.recoveryCodes[0] })).status).toBe(401);
  client.advance();
  expect((await client.request('/auth/verify', { code: client.code(enrollment.data.secret) })).status).toBe(401);
  client.advance();
  const replacement = await client.request('/auth/enroll', {});
  expect(replacement.data.secret).not.toBe(enrollment.data.secret);
  expect(replacement.data.qrDataUrl).toMatch(/^data:image\/svg\+xml;base64,/);
  expect((await client.request('/auth/verify', { code: client.code(replacement.data.secret) })).status).toBe(200);
  expect((await client.request('/auth/status')).data.authenticated).toBe(true);
});
it('exercises synthetic rate and payment contracts across ten Sites with idempotency and no real payment data', async () => {
  const client = await api();
  for (const siteKey of sites) {
    const quote = await client.request('/rates/quote', { siteKey, productKey: 'test-life', amount: 100000, frequency: 'monthly' });
    expect(quote.data).toMatchObject({ mode: 'mock', premiumCents: 2500, currency: 'USD' });
    const body = { quoteId: quote.data.quoteId, paymentToken: 'mock-approved', idempotencyKey: `test-${siteKey}` };
    const payment = await client.request('/payments/authorize', body);
    expect(payment.data).toMatchObject({ mode: 'mock', status: 'authorized', amountCents: 2500, fundsMoved: false });
    expect((await client.request('/payments/authorize', body)).data).toEqual(payment.data);
    expect((await client.request('/payments/authorize', { ...body, paymentToken: 'mock-declined' })).status).toBe(409);
    const declined = await client.request('/payments/authorize', { ...body, paymentToken: 'mock-declined', idempotencyKey: `declined-${siteKey}` });
    expect(declined.data.status).toBe('declined');
  }
  expect((await client.request('/payments/authorize', { quoteId: 'bad', cardNumber: 'private' })).status).toBe(400);
  expect((await client.request('/rates/quote', { siteKey: sites[0], productKey: 'test-life', amount: 0, frequency: 'monthly' })).status).toBe(400);
});
it('keeps mock drafts isolated and refuses publication before migration acceptance', async () => {
  const client = await api();
  const enrollment = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(enrollment.data.secret) });
  const payload = { formatVersion: 1, siteKey: 'demo', data: { sites: database.sites, configurationValues: [] } };
  const saved = await client.request('/library/save', { expectedVersion: 0, payload });
  expect(saved.status).toBe(200);
  expect((await client.request('/library/read', { siteKey: 'demo' })).data).toBeNull();
  const snapshot = (await client.request('/prototype/library', { siteKey: 'demo' })).data;
  expect(snapshot.payload).toEqual(payload);
  expect(snapshot.mode).toBe('mock');
  expect(snapshot.draft).toMatchObject({ id: saved.data.id, version: 1 });
  const other = (await client.request('/prototype/library', { siteKey: 'ama' })).data;
  expect(other.payload.siteKey).toBe('ama');
  expect(other.draft).toBeNull();
  const changed = { ...payload, editVersion: 1 };
  expect((await client.request('/library/save', { id: saved.data.id, expectedVersion: 1, payload: changed })).status).toBe(200);
  expect((await client.request('/prototype/library', { siteKey: 'demo' })).data.revision).not.toBe(snapshot.revision);
  expect((await client.request('/prototype/library', { siteKey: 'ama' })).data.revision).toBe(other.revision);

  expect((await client.request('/library/save', { id: saved.data.id, expectedVersion: 0, payload })).status).toBe(409);
  expect((await client.request('/library/publish', { id: saved.data.id, expectedVersion: 1, expectedReleaseId: null })).status).toBe(409);
});

it('publishes immutable versions and rolls back atomically only with server acceptance', async () => {
  const client = await api({ checkReadiness: () => [] });
  const enrollment = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(enrollment.data.secret) });
  const payload = { formatVersion: 1, siteKey: 'demo', data: { sites: database.sites, configurationValues: [] } };
  const draft = (await client.request('/library/save', { expectedVersion: 0, payload })).data;
  const first = (await client.request('/library/publish', { id: draft.id, expectedVersion: 1, expectedReleaseId: null })).data;
  expect(first.version).toBe(1);
  expect((await client.request('/library/publish', { id: draft.id, expectedVersion: 1, expectedReleaseId: null })).status).toBe(409);
  const secondDraft = (await client.request('/library/save', { expectedVersion: 0, payload: { ...payload, editVersion: 2 } })).data;
  const second = (await client.request('/library/publish', { id: secondDraft.id, expectedVersion: 1, expectedReleaseId: first.id })).data;
  expect(second.version).toBe(2);
  expect((await client.request('/library/read', { siteKey: 'demo' })).data.id).toBe(second.id);
  expect((await client.request('/library/rollback', { siteKey: 'demo', releaseId: first.id, expectedReleaseId: first.id })).status).toBe(409);
  expect((await client.request('/library/rollback', { siteKey: 'demo', releaseId: first.id, expectedReleaseId: second.id })).data.payload).toEqual(payload);
  expect((await client.request('/library/read', { siteKey: 'demo' })).data.id).toBe(first.id);
});
it('rejects sensitive analytics payloads and accepts only known tag metadata', async () => {
  const tag = { id: 'portal.v1/eligibility/field/birth-date', events: ['change'], sites: ['demo'] };
  const client = await api({ analyticsTags: [tag] });
  const payload = { schemaVersion: 1, tagId: tag.id, event: 'change', properties: { siteKey: 'demo', template: 'multi', revision: 'prototype' } };
  expect((await client.request('/analytics/event', { ...payload, value: 'private' })).status).toBe(400);
  expect((await client.request('/analytics/event', { ...payload, properties: { ...payload.properties, birthDate: 'private' } })).status).toBe(400);
  expect((await client.request('/analytics/event', { ...payload, tagId: 'unknown' })).status).toBe(400);
  expect((await client.request('/analytics/event', payload)).data).toEqual({ accepted: true });
  expect((await client.request('/analytics/events', { siteKey: 'all' })).status).toBe(401);
});

it('permits deferring collection only for a Site with saved optional payment', async () => {
  const stored = { ...database, sitePages: sites.map(siteKey => ({ siteKey, pageKey: 'payment', requirement: siteKey === 'abe' ? 'optional' : 'required' })) };
  const client = await api({ database: stored });
  const revision = (await client.request('/prototype/library', { siteKey: 'abe' })).data.revision;
  const body = { siteKey: 'abe', revision, entries: [{ productKey: 'test-life', applicant: 'member', amount: 10000 }], paymentIds: [], paymentDeferred: true, idempotencyKey: 'optional-payment-001' };
  const result = await client.request('/applications/submit', body);
  expect(result.status).toBe(200);
  expect(result.data).toMatchObject({ status: 'submitted', insurerSubmitted: false, fundsMoved: false, entryCount: 1 });
  expect((await client.request('/applications/submit', body)).data).toEqual(result.data);
  expect((await client.request('/applications/submit', { ...body, revision: 'prototype:old', idempotencyKey: 'optional-payment-002' })).status).toBe(409);
  expect((await client.request('/applications/submit', { ...body, paymentDeferred: false, idempotencyKey: 'optional-payment-003' })).status).toBe(400);
  expect((await client.request('/applications/submit', { ...body, entries: [{ ...body.entries[0], amount: -1 }], idempotencyKey: 'optional-payment-004' })).status).toBe(400);
  const requiredRevision = (await client.request('/prototype/library', { siteKey: 'asce' })).data.revision;
  expect((await client.request('/applications/submit', { ...body, siteKey: 'asce', revision: requiredRevision, idempotencyKey: 'optional-payment-005' })).status).toBe(400);
});

it('requires approved fixture payments and persists idempotent mock submissions without insurer side effects', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'asce-submission-')); temporaryStores.push(directory);
  const statePath = join(directory, 'state.json');
  const client = await api({ statePath });
  const quote = (await client.request('/rates/quote', { siteKey: 'asce', productKey: 'test-life', amount: 10000, frequency: 'monthly' })).data;
  const declined = (await client.request('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-declined', idempotencyKey: 'declined-fixture-001' })).data;
  const revision = (await client.request('/prototype/library', { siteKey: 'asce' })).data.revision;
  const body = { siteKey: 'asce', revision, entries: [{ productKey: 'test-life', applicant: 'member', amount: 10000 }], paymentIds: [declined.paymentId], idempotencyKey: 'submission-fixture-001' };
  expect((await client.request('/applications/submit', body)).status).toBe(400);
  const approved = (await client.request('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-approved', idempotencyKey: 'approved-fixture-001' })).data;
  body.paymentIds = [approved.paymentId];
  const submitted = await client.request('/applications/submit', body);
  expect(submitted.data).toMatchObject({ mode: 'mock', status: 'submitted', insurerSubmitted: false, fundsMoved: false, entryCount: 1 });
  expect((await client.request('/applications/submit', body)).data).toEqual(submitted.data);
  expect((await client.request('/applications/submit', { ...body, idempotencyKey: 'duplicate-payment-001' })).status).toBe(409);
  expect((await client.request('/applications/submit', { ...body, revision: 'prototype:changed' })).status).toBe(409);
  expect((await client.request('/applications/submit', { ...body, idempotencyKey: 'submission-other-001', entries: [{ productKey: 'test-life', applicant: 'member', amount: 20000 }] })).status).toBe(400);
  expect((await client.request('/applications/submit', { ...body, ssn: 'not-accepted' })).status).toBe(400);
  await new Promise(resolve => server.close(resolve)); server = null;
  const restarted = await api({ statePath });
  expect((await restarted.request('/applications/submit', body)).data).toEqual(submitted.data);
});

it('rejects stale Library quotes, wrong applicants and expired submission authorizations', async () => {
  const client = await api();
  const siteKey = 'asce';
  const original = (await client.request('/prototype/library', { siteKey })).data;
  const quoteRequest = { siteKey, revision: original.revision, productKey: 'test-life', amount: 10000, frequency: 'monthly', dimensions: { applicant: 'member' } };
  expect((await client.request('/rates/quote', { ...quoteRequest, revision: 'prototype:invented' })).status).toBe(409);
  const quote = (await client.request('/rates/quote', quoteRequest)).data;
  const approved = (await client.request('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-approved', idempotencyKey: 'revision-payment-001' })).data;
  const submission = { siteKey, revision: original.revision, entries: [{ productKey: 'test-life', applicant: 'member', amount: 10000 }], paymentIds: [approved.paymentId], idempotencyKey: 'revision-submit-001' };
  expect((await client.request('/applications/submit', { ...submission, entries: [{ ...submission.entries[0], applicant: 'spouse' }] })).status).toBe(400);
  for (let minute = 0; minute < 16; minute++) client.advance();
  expect((await client.request('/applications/submit', submission)).status).toBe(400);
  const freshQuote = (await client.request('/rates/quote', quoteRequest)).data;
  const freshPayment = (await client.request('/payments/authorize', { quoteId: freshQuote.quoteId, paymentToken: 'mock-approved', idempotencyKey: 'revision-payment-002' })).data;
  const setup = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(setup.data.secret) });
  expect((await client.request('/library/save', { expectedVersion: 0, payload: { ...original.payload, editVersion: 1, data: { ...original.payload.data, configurationValues: [] } } })).status).toBe(200);
  const current = (await client.request('/prototype/library', { siteKey })).data;
  expect(current.revision).not.toBe(original.revision);
  expect((await client.request('/applications/submit', { ...submission, paymentIds: [freshPayment.paymentId] })).status).toBe(409);
  expect((await client.request('/applications/submit', { ...submission, revision: current.revision, paymentIds: [freshPayment.paymentId] })).status).toBe(400);
  expect((await client.request('/payments/authorize', { quoteId: freshQuote.quoteId, paymentToken: 'mock-approved', idempotencyKey: 'revision-payment-003' })).status).toBe(409);
  const currentQuote = (await client.request('/rates/quote', { ...quoteRequest, revision: current.revision })).data;
  const currentPayment = (await client.request('/payments/authorize', { quoteId: currentQuote.quoteId, paymentToken: 'mock-approved', idempotencyKey: 'revision-payment-004' })).data;
  expect((await client.request('/applications/submit', { ...submission, revision: current.revision, paymentIds: [currentPayment.paymentId] })).data).toMatchObject({ status: 'submitted', insurerSubmitted: false, fundsMoved: false });
});

it('protects reference uploads, converts a legible image and retains ambiguous originals', async () => {
  const client = await api();
  const body = { filename: 'ADD.png', title: 'AD&D source', base64: readFileSync('public/client/csea/rates/ADD-Clerical.png').toString('base64') };
  expect((await client.request('/rates/import', body)).status).toBe(401);
  const setup = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(setup.data.secret) });
  const result = await client.request('/rates/import', body);
  expect(result.status).toBe(200);
  // OCR tools are optional; unavailable tooling safely retains the source.
  if (result.data.converted) expect(result.data.table.rows).toEqual([['$10,000','$0.27'],['$30,000','$0.81'],['$50,000','$1.35'],['$100,000','$2.70']]);
  else expect(result.data.table.kind).toBe('image');
  expect((await client.request('/rates/import', { ...body, base64: Buffer.from('invalid').toString('base64') })).status).toBe(400);
}, 40000);

it('reads the stored Library catalog, isolates saved Site drafts, and excludes operational tables', async () => {
  const stored = { ...database, fields: [{ id: 'child-first-name', key: 'child-first-name', definition: { label: 'Stored child name' } }], analyticsTags: [] };
  const client = await api({ database: stored, prototypeTables: ['sites', 'fields'], libraryTables: ['sites', 'fields'] });
  expect((await client.request('/library/catalog', { siteKey: 'all', tables: ['fields'] })).status).toBe(401);
  const enrollment = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(enrollment.data.secret) });
  const first = await client.request('/library/catalog', { siteKey: 'all', tables: ['fields'] });
  expect(first.data.data.fields).toEqual(stored.fields);
  expect((await client.request('/prototype/library', { siteKey: 'csea' })).data.payload.data.fields).toEqual(first.data.data.fields);
  expect((await client.request('/library/catalog', { siteKey: 'all', tables: ['users'] })).status).toBe(400);
  const payload = { formatVersion: 1, siteKey: 'csea', baseRevision: 'test', editVersion: 1, data: { ...stored, configurationValues: [], fields: [{ ...stored.fields[0], definition: { label: 'Saved child name' } }] } };
  await client.request('/library/save', { expectedVersion: 0, payload });
  const saved = await client.request('/library/catalog', { siteKey: 'csea', tables: ['fields'] });
  expect(saved.data.data.fields[0].definition.label).toBe('Saved child name');
  expect((await client.request('/prototype/library', { siteKey: 'csea' })).data.payload.data.fields).toEqual(saved.data.data.fields);
  expect(saved.data.revision).not.toBe(first.data.revision);
  expect((await client.request('/library/catalog', { siteKey: 'asce', tables: ['fields'] })).data.data.fields).toEqual(stored.fields);
});

it('resumes unfinished setup after restart without exposing secrets in status or bypassing the password', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'admin-enrollment-')); temporaryStores.push(directory);
  const statePath = join(directory, 'state.json');
  const first = await api({ statePath });
  const initial = (await first.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' })).data;
  await new Promise(resolve => server.close(resolve)); server = null;
  const client = await api({ statePath });
  expect((await client.request('/auth/enroll', {})).status).toBe(401);
  expect((await client.request('/auth/login', { username: 'caroline', password: 'incorrect-password' })).status).toBe(401);
  expect((await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' })).status).toBe(200);
  const status = (await client.request('/auth/status')).data;
  expect(status).toMatchObject({ setupNeeded: false, enrollmentNeeded: true, authenticated: false });
  expect(status).not.toHaveProperty('secret');
  expect(status).not.toHaveProperty('qrDataUrl');
  expect((await client.request('/library/catalog', { siteKey: 'all', tables: ['sites'] })).status).toBe(401);
  const replacement = (await client.request('/auth/enroll', {})).data;
  expect(replacement.secret).not.toBe(initial.secret);
  expect((await client.request('/auth/verify', { code: client.code(replacement.secret) })).status).toBe(200);
  expect((await client.request('/auth/enroll', {})).status).toBe(401);
  await client.request('/auth/logout', {}); client.advance();
  await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' });
  expect((await client.request('/auth/status')).data).toMatchObject({ authenticated: false, passwordAccepted: true, enrollmentNeeded: false });
  expect((await client.request('/library/catalog', { siteKey: 'all', tables: ['sites'] })).status).toBe(401);
  expect((await client.request('/auth/verify', { code: client.code(replacement.secret) })).status).toBe(200);
  const stored = JSON.parse(readFileSync(statePath, 'utf8'));
  expect(stored.admin).not.toHaveProperty('password');
  expect(stored.admin.recoveryHashes).not.toContain(replacement.recoveryCodes[0]);
  for (let minute = 0; minute < 31; minute++) client.advance();
  expect((await client.request('/auth/status')).data).toMatchObject({ authenticated: false, passwordAccepted: false });
  expect((await client.request('/library/catalog', { siteKey: 'all', tables: ['sites'] })).status).toBe(401);
});

it('enforces the exact 30-day expiry boundary and requires MFA before changing an expired password', async () => {
  const client = await api();
  const setup = (await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' })).data;
  await client.request('/auth/verify', { code: client.code(setup.secret) });
  const expiresAt = (await client.request('/auth/status')).data.passwordExpiresAt;
  client.advance(30 * 24 * 60 * 60 * 1000 - 1);
  await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' });
  expect((await client.request('/auth/password/change', { currentPassword: 'a-long-mock-password', newPassword: 'a-new-long-password' })).status).toBe(401);
  await client.request('/auth/verify', { code: client.code(setup.secret) });
  expect((await client.request('/auth/status')).data.authenticated).toBe(true);
  client.advance(1);
  expect((await client.request('/auth/status')).data).toMatchObject({ authenticated: false, mfaVerified: true, passwordExpired: true, passwordExpiresAt: expiresAt });
  expect((await client.request('/library/catalog', { siteKey: 'all', tables: ['sites'] })).status).toBe(403);
  expect((await client.request('/auth/password/change', { currentPassword: 'wrong-password', newPassword: 'a-new-long-password' })).status).toBe(401);
  expect((await client.request('/auth/password/change', { currentPassword: 'a-long-mock-password', newPassword: 'a-long-mock-password' })).status).toBe(400);
  const oldCookie = client.cookie;
  expect((await client.request('/auth/password/change', { currentPassword: 'a-long-mock-password', newPassword: 'a-new-long-password' })).status).toBe(200);
  expect((await client.request('/auth/status', undefined, oldCookie)).data.passwordAccepted).toBe(false);
  client.advance();
  expect((await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' })).status).toBe(401);
  await client.request('/auth/login', { username: 'caroline', password: 'a-new-long-password' });
  await client.request('/auth/verify', { code: client.code(setup.secret) });
  const next = (await client.request('/auth/status')).data;
  expect(next).toMatchObject({ authenticated: true, passwordExpired: false });
  expect(next.passwordExpiresAt).toBeGreaterThan(expiresAt);
});

it('resets a forgotten password with fresh TOTP, revokes sessions, and rejects replay and invalid proof', async () => {
  const client = await api();
  const setup = (await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' })).data;
  await client.request('/auth/verify', { code: client.code(setup.secret) });
  const oldCookie = client.cookie;
  const body = { username: 'caroline', newPassword: 'a-new-long-password', method: 'totp', code: client.code(setup.secret) };
  expect((await client.request('/auth/password/reset', body)).status).toBe(401);
  expect((await client.request('/auth/password/reset', { ...body, code: 'invalid' })).status).toBe(401);
  client.advance(); body.code = client.code(setup.secret);
  expect((await client.request('/auth/password/reset', { ...body, newPassword: 'short' })).status).toBe(400);
  expect((await client.request('/auth/password/reset', body)).data).toMatchObject({ passwordReset: true, reenrollmentRequired: false });
  expect((await client.request('/auth/status', undefined, oldCookie)).data.passwordAccepted).toBe(false);
  expect((await client.request('/auth/password/reset', { ...body, newPassword: 'another-long-password' })).status).toBe(401);
  expect((await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' })).status).toBe(401);
  await client.request('/auth/login', { username: 'caroline', password: 'a-new-long-password' });
  expect((await client.request('/auth/verify', { code: body.code })).status).toBe(401);
  client.advance();
  expect((await client.request('/auth/verify', { code: client.code(setup.secret) })).status).toBe(200);
});

it('persists recovery-password reset across restart and requires a replacement authenticator', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'password-reset-')); temporaryStores.push(directory);
  const statePath = join(directory, 'state.json');
  const first = await api({ statePath });
  const setup = (await first.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' })).data;
  await first.request('/auth/verify', { code: first.code(setup.secret) });
  const body = { username: 'caroline', newPassword: 'a-new-long-password', code: setup.recoveryCodes[0], method: 'recovery' };
  expect((await first.request('/auth/password/reset', body)).data).toMatchObject({ passwordReset: true, reenrollmentRequired: true });
  await new Promise(resolve => server.close(resolve)); server = null;
  const client = await api({ statePath });
  expect((await client.request('/auth/password/reset', { ...body, newPassword: 'another-long-password' })).status).toBe(401);
  await client.request('/auth/login', { username: 'caroline', password: 'a-new-long-password' });
  expect((await client.request('/auth/status')).data).toMatchObject({ authenticated: false, enrollmentNeeded: true, recoveryRequired: true });
  client.advance();
  expect((await client.request('/auth/verify', { code: client.code(setup.secret) })).status).toBe(401);
  const replacement = (await client.request('/auth/enroll', {})).data;
  expect((await client.request('/auth/verify', { code: client.code(replacement.secret) })).status).toBe(200);
  expect((await client.request('/auth/status')).data.authenticated).toBe(true);
});

it('upgrades existing accounts without replacing credentials or saved data and persists the expiry clock', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'password-window-')); temporaryStores.push(directory);
  const statePath = join(directory, 'state.json');
  const first = await api({ statePath });
  const setup = (await first.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' })).data;
  await first.request('/auth/verify', { code: first.code(setup.secret) });
  await new Promise(resolve => server.close(resolve)); server = null;
  const original = JSON.parse(readFileSync(statePath, 'utf8'));
  delete original.admin.passwordChangedAt;
  original.drafts = { preserved: { id: 'saved-draft' } };
  writeFileSync(statePath, JSON.stringify(original));
  await api({ statePath });
  const persisted = JSON.parse(readFileSync(statePath, 'utf8'));
  expect(persisted.admin.passwordHash).toBe(original.admin.passwordHash);
  expect(persisted.admin.totpSecret).toBe(original.admin.totpSecret);
  expect(persisted.drafts).toEqual(original.drafts);
  expect(persisted.admin.passwordChangedAt).toBe(1760000000000);
  await new Promise(resolve => server.close(resolve)); server = null;
  const restarted = await api({ statePath });
  restarted.advance();
  await restarted.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' });
  expect((await restarted.request('/auth/status')).data.passwordExpiresAt).toBe(persisted.admin.passwordChangedAt + 30 * 24 * 60 * 60 * 1000);
  expect((await restarted.request('/auth/verify', { code: restarted.code(setup.secret) })).status).toBe(200);
});

it('reviews matching revisions, stages UAT, schedules production and rolls back without activating published data', async () => {
  const tag = { id: 'portal.v1/eligibility/page/page', kind: 'page', pageId: 'eligibility', events: ['view'], sites: ['demo'] };
  const client = await api({ validatePayload: async () => {}, analyticsTags: [tag] });
  const enrollment = await client.request('/auth/setup', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(enrollment.data.secret) });
  const payload = { formatVersion: 1, siteKey: 'demo', data: { ...database, sitePages: [{ id: 'page', siteKey: 'demo', pageKey: 'eligibility', requirement: 'required' }], configurationValues: [], configurationDefinitions: [] } };
  const first = (await client.request('/library/save', { expectedVersion: 0, payload })).data;
  const identity = d => ({ id: d.id, expectedVersion: d.version, payloadHash: d.payloadHash });
  const reviewBody = d => ({ ...identity(d), visualChecks: [{ page: 'eligibility', desktop: true, mobile: true, notes: 'Labels, required errors and responsive layout verified' }], serviceChecks: [] });
  expect((await client.request('/builder/stage', { ...identity(first), expectedHead: null })).status).toBe(409);
  expect((await client.request('/builder/review', reviewBody(first))).data.blockers.length).toBeGreaterThan(0);
  const verify = async draft => {
    const revision = `prototype:${draft.payloadHash}`;
    const quote = (await client.request('/rates/quote', { siteKey: draft.siteKey, productKey: 'test-life', amount: 10000, frequency: 'monthly', revision })).data;
    const approved = (await client.request('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-approved', idempotencyKey: `approved-${draft.version}` })).data;
    const declined = (await client.request('/payments/authorize', { quoteId: quote.quoteId, paymentToken: 'mock-declined', idempotencyKey: `declined-${draft.version}` })).data;
    expect((await client.request('/analytics/event', { schemaVersion: 1, tagId: tag.id, event: 'view', properties: { siteKey: draft.siteKey, template: 'multi', revision } })).status).toBe(200);
    const review = await client.request('/builder/review', { ...reviewBody(draft), serviceChecks: [{ productKey: 'test-life', approvedPaymentId: approved.paymentId, declinedPaymentId: declined.paymentId }] });
    expect(review.data.blockers).toEqual([]);
  };
  await verify(first);
  const uat = (await client.request('/builder/stage', { ...identity(first), expectedHead: null })).data;
  expect((await client.request('/prototype/library', { siteKey: first.siteKey, environment: 'uat' })).data.revision).toBe(`prototype:${first.payloadHash}`);
  const schedule = await client.request('/builder/schedule', { ...identity(first), releaseKey: 'release-test', releaseName: 'Next test release', releaseDate: '2025-10-10' });
  expect(schedule.status).toBe(200);
  expect((await client.request('/builder/launch', { queueId: schedule.data.id })).status).toBe(409);
  client.advance(24 * 60 * 60000);
  await client.request('/auth/login', { username: 'caroline', password: 'a-long-mock-password' });
  await client.request('/auth/verify', { code: client.code(enrollment.data.secret) });
  expect((await client.request('/builder/launch', { queueId: schedule.data.id })).data.status).toBe('Released');
  expect((await client.request('/library/read', { siteKey: first.siteKey })).data).toBeNull();
  const second = (await client.request('/library/save', { id: first.id, expectedVersion: first.version, payload: { ...payload, editVersion: 2 } })).data;
  expect((await client.request('/builder/schedule', { ...identity(second), releaseKey: 'second', releaseName: 'Second', releaseDate: '2025-10-10' })).status).toBe(409);
  expect((await client.request('/builder/review', { ...reviewBody(first) })).status).toBe(409);
  await verify(second);
  const uat2 = (await client.request('/builder/stage', { ...identity(second), expectedHead: uat.id })).data;
  const schedule2 = (await client.request('/builder/schedule', { ...identity(second), releaseKey: 'second', releaseName: 'Second', releaseDate: '2025-10-10' })).data;
  expect((await client.request('/builder/launch', { queueId: schedule2.id })).status).toBe(200);
  expect((await client.request('/builder/rollback', { siteKey: first.siteKey, releaseId: uat.id, expectedHead: uat.id })).status).toBe(409);
  expect((await client.request('/builder/rollback', { siteKey: first.siteKey, releaseId: uat.id, expectedHead: uat2.id })).status).toBe(200);
  expect((await client.request('/prototype/library', { siteKey: first.siteKey, environment: 'production' })).data.revision).toBe(`prototype:${first.payloadHash}`);
  expect((await client.request('/prototype/library', { siteKey: first.siteKey })).data.revision).toBe(`prototype:${second.payloadHash}`);
  expect((await client.request('/library/read', { siteKey: first.siteKey })).data).toBeNull();
});

it('looks up synthetic AMA records without changing application eligibility or storing applicant names', async () => {
  const client = await api();
  const identity = { siteKey: 'ama', firstName: 'Taylor', lastName: 'Morgan', birthDate: '1980-05-04' };
  const result = await client.request('/membership/ama-lookup', identity);
  expect(result.status).toBe(200);
  expect(result.data).toMatchObject({ mode: 'mock', provider: 'ama-mock', status: 'matched', isMember: true, identity: { firstName: 'Taylor', lastName: 'Morgan', birthDate: '1980-05-04' } });
  expect(result.data.medicalEducationNumber).toMatch(/^MOCK-ME-\d{10}$/);
  expect((await client.request('/membership/ama-lookup', identity)).data).toEqual(result.data);
  expect((await client.request('/membership/ama-lookup', { ...identity, firstName: 'Nonmember' })).data).toMatchObject({ status: 'matched', isMember: false });
  expect((await client.request('/membership/ama-lookup', { ...identity, firstName: 'No', lastName: 'Match' })).data).toMatchObject({ status: 'not-found', medicalEducationNumber: null, isMember: false });
  expect((await client.request('/membership/ama-lookup', { ...identity, firstName: 'Service', lastName: 'Error' })).status).toBe(503);
  for (const patch of [{ siteKey: 'abe' }, { birthDate: '2026-02-31' }, { birthDate: '2999-01-01' }, { firstName: '' }, { birthDate: '05/04/1980' }]) expect((await client.request('/membership/ama-lookup', { ...identity, ...patch })).status).toBe(400);
});
