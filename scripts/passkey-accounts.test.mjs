// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMockPlatform, totp } from './mock-platform.mjs';
import { verifyRegistration, verifyAuthentication } from './webauthn.mjs';
const hash = value => createHash('sha256').update(value).digest();
function cbor(value) {
  const head = (major, length) => length < 24 ? Buffer.from([major * 32 + length]) : length < 256 ? Buffer.from([major * 32 + 24, length]) : Buffer.from([major * 32 + 25, length >> 8, length & 255]);
  if (typeof value === 'number') return head(value < 0 ? 1 : 0, value < 0 ? -1 - value : value);
  if (Buffer.isBuffer(value)) return Buffer.concat([head(2, value.length), value]);
  if (typeof value === 'string') { const text = Buffer.from(value); return Buffer.concat([head(3, text.length), text]); }
  if (value instanceof Map) return Buffer.concat([head(5, value.size), ...[...value].flatMap(([key, item]) => [cbor(key), cbor(item)])]);
  throw new Error('Unsupported test CBOR');
}
function authenticator() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const key = publicKey.export({ format: 'jwk' }), id = randomBytes(32);
  const client = (challenge, type, origin) => Buffer.from(JSON.stringify({ challenge, type, origin, crossOrigin: false }));
  const data = (flags, counter, rpID = 'localhost') => { const raw = Buffer.alloc(37); hash(rpID).copy(raw); raw[32] = flags; raw.writeUInt32BE(counter, 33); return raw; };
  return {
    register(options, origin = 'http://localhost:5180', flags = 69) {
      const length = Buffer.from([0, id.length]);
      const cose = cbor(new Map([[1, 2], [3, -7], [-1, 1], [-2, Buffer.from(key.x, 'base64url')], [-3, Buffer.from(key.y, 'base64url')]]));
      const raw = Buffer.concat([data(flags, 0), Buffer.alloc(16), length, id, cose]);
      return { id: id.toString('base64url'), rawId: id.toString('base64url'), type: 'public-key', response: { clientDataJSON: client(options.challenge, 'webauthn.create', origin).toString('base64url'), attestationObject: cbor(new Map([['fmt', 'none'], ['attStmt', new Map()], ['authData', raw]])).toString('base64url') } };
    },
    authenticate(options, { counter = 1, flags = 5, origin = 'http://localhost:5180', user = 'caroline', rpID = 'localhost' } = {}) {
      const json = client(options.challenge, 'webauthn.get', origin), raw = data(flags, counter, rpID);
      return { id: id.toString('base64url'), rawId: id.toString('base64url'), type: 'public-key', response: { clientDataJSON: json.toString('base64url'), authenticatorData: raw.toString('base64url'), signature: sign('sha256', Buffer.concat([raw, hash(json)]), privateKey).toString('base64url'), userHandle: Buffer.from(user).toString('base64url') } };
    },
  };
}
const servers = [], directories = [];
afterEach(async () => { for (const server of servers.splice(0)) await new Promise(resolve => server.close(resolve)); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
async function platform(options = {}) {
  let now = Date.now();
  const server = createMockPlatform({ database: { sites: [], siteProducts: [] }, operationsDatabase: { releases: [{ id: 'release-1', name: 'Original' }] }, clock: () => now, ...options }); servers.push(server);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/mock`;
  const client = () => {
    let cookie = '';
    return async (path, body, origin = 'http://localhost:5180') => {
      const response = await fetch(url + path, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: origin, 'X-Portal-Mock': '1', 'Content-Type': 'application/json', Cookie: cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      return { status: response.status, data: await response.json() };
    };
  };
  return { client, advance: () => now += 6 * 60000, code: secret => totp(secret, now) };
}
it('registers a passkey without an authenticator app, persists it, and signs in only after password and device proof', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'portal-passkeys-')); directories.push(dir);
  const options = { statePath: join(dir, 'state.json') };
  let server = await platform(options), api = server.client();
  const device = authenticator();
  expect((await api('/auth/passkeys/register/options', {})).status).toBe(401);
  await api('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  const registration = (await api('/auth/passkeys/register/options', {})).data;
  const response = device.register(registration);
  const saved = await api('/auth/passkeys/register/verify', { credential: response });
  expect(saved.status).toBe(200); expect(saved.data.recoveryCodes).toHaveLength(8);
  expect((await api('/auth/status')).data).toMatchObject({ authenticated: true, passkeyCount: 1, totpEnrolled: false });
  expect((await api('/auth/passkeys/register/verify', { credential: response })).status).toBe(401);
  expect((await api('/auth/passkey/remove', { id: response.id })).status).toBe(400);
  await api('/auth/logout', {});
  server = await platform(options); api = server.client();
  await api('/auth/login', { username: 'caroline', password: 'my-long-password' });
  expect((await api('/auth/status')).data.authenticated).toBe(false);
  expect((await api('/auth/passkeys/register/options', {})).status).toBe(401);
  const challenge = (await api('/auth/passkeys/authenticate/options', {})).data;
  expect((await api('/auth/passkeys/authenticate/verify', { credential: device.authenticate(challenge) })).status).toBe(200);
  expect((await api('/auth/status')).data.authenticated).toBe(true);
});
it('rejects mismatched origin, challenge, RP, verification flags, user handles, signatures and counters', () => {
  const device = authenticator(), ceremony = { challenge: 'a-challenge', origin: 'http://localhost:5180', rpID: 'localhost' };
  const stored = verifyRegistration(device.register(ceremony), ceremony);
  expect(() => verifyRegistration(device.register(ceremony, 'https://attacker.invalid'), ceremony)).toThrow();
  expect(() => verifyRegistration(device.register(ceremony, ceremony.origin, 65), ceremony)).toThrow();
  for (const options of [{ origin: 'https://attacker.invalid' }, { flags: 1 }, { user: 'other-user' }, { rpID: 'attacker.invalid' }]) expect(() => verifyAuthentication(device.authenticate(ceremony, options), ceremony, stored, Buffer.from('caroline').toString('base64url'))).toThrow();
  expect(() => verifyAuthentication(device.authenticate({ challenge: 'wrong' }), ceremony, stored, Buffer.from('caroline').toString('base64url'))).toThrow();
  const credential = device.authenticate(ceremony); credential.response.signature = randomBytes(72).toString('base64url');
  expect(() => verifyAuthentication(credential, ceremony, stored, Buffer.from('caroline').toString('base64url'))).toThrow();
  expect(() => verifyAuthentication(device.authenticate(ceremony), ceremony, { ...stored, counter: 1 }, Buffer.from('caroline').toString('base64url'))).toThrow();
});
it('expires challenges and invalidates old passkeys when using a recovery code', async () => {
  const server = await platform(), api = server.client(), device = authenticator();
  await api('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  let options = (await api('/auth/passkeys/register/options', {})).data;
  server.advance();
  expect((await api('/auth/passkeys/register/verify', { credential: device.register(options) })).status).toBe(401);
  options = (await api('/auth/passkeys/register/options', {})).data;
  const registered = await api('/auth/passkeys/register/verify', { credential: device.register(options) });
  await api('/auth/logout', {}); await api('/auth/login', { username: 'caroline', password: 'my-long-password' });
  await api('/auth/recover', { code: registered.data.recoveryCodes[0] });
  expect((await api('/auth/status')).data).toMatchObject({ authenticated: false, recoveryRequired: true, passkeyCount: 0 });
  expect((await api('/auth/passkeys/authenticate/options', {})).status).toBe(401);
  const replacement = authenticator(), fresh = (await api('/auth/passkeys/register/options', {})).data;
  expect((await api('/auth/passkeys/register/verify', { credential: replacement.register(fresh) })).status).toBe(200);
  expect((await api('/auth/status')).data.authenticated).toBe(true);
});
it('sets up each group with individual MFA and enforces shared views with owner-only writes', async () => {
  const server = await platform(), owner = server.client();
  const enrollment = await owner('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  await owner('/auth/verify', { code: server.code(enrollment.data.secret) });
  const directory = (await owner('/auth/accounts', {})).data;
  expect(directory.groups.map(g => g.id)).toEqual(['portal-master-admin', 'portal-team', 'account-managers', 'majesco', 'tpa']);
  for (const member of directory.accounts.filter(a => a.username !== 'caroline')) {
    server.advance();
    expect((await owner('/auth/accounts/provision', { ...Object.fromEntries(['username', 'displayName', 'email', 'groupId'].map(key => [key, member[key]])), password: 'viewer-long-password' })).status).toBe(200);
    const viewer = server.client();
    await viewer('/auth/login', { username: member.username, password: 'viewer-long-password' });
    expect((await viewer('/operations/read', { table: 'releases' })).status).toBe(401);
    const setup = await viewer('/auth/enroll', {});
    expect(setup.status).toBe(200);
    expect((await viewer('/auth/verify', { code: server.code(setup.data.secret) })).status).toBe(200);
    expect((await viewer('/auth/status')).data).toMatchObject({ authenticated: true, canEdit: false, groupId: member.groupId });
    expect((await viewer('/operations/read', { table: 'releases' })).data[0].name).toBe('Original');
    for (const path of ['/library/save', '/library/publish', '/rates/import', '/builder/draft/create', '/builder/schedule', '/builder/launch', '/operations/write', '/auth/accounts/provision']) expect((await viewer(path, {})).status).toBe(path === '/operations/write' ? 400 : 403);
    expect((await viewer('/operations/write', { table: 'releases', action: 'update', id: 'release-1', patch: { name: 'Blocked' } })).status).toBe(403);
    expect((await viewer('/auth/accounts', {})).status).toBe(200);
  }
  expect((await owner('/operations/write', { table: 'releases', action: 'update', id: 'release-1', patch: { name: 'Caroline updated' } })).status).toBe(200);
  expect((await owner('/operations/read', { table: 'releases' })).data[0].name).toBe('Caroline updated');
});

it('imports existing operational edits once and preserves server edits across restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'portal-operations-')); directories.push(dir);
  const statePath = join(dir, 'state.json');
  let server = await platform({ statePath }), api = server.client();
  const enrollment = await api('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  await api('/auth/verify', { code: server.code(enrollment.data.secret) });
  const tables = ['sites', 'applications', 'applicationParticipants', 'applicationEvents', 'changeRequests', 'changeItems', 'releases', 'releaseChanges', 'siteBuilderDrafts', 'auditEvents', 'migrationSchedules'];
  const data = Object.fromEntries(tables.map(table => [table, table === 'releases' ? [{ id: 'release-1', name: 'Existing local edit' }] : []]));
  expect((await api('/operations/import', { data })).data.imported).toBe(true);
  await api('/operations/write', { table: 'releases', action: 'update', id: 'release-1', patch: { name: 'Shared server edit' } });
  expect((await api('/operations/import', { data })).data.imported).toBe(false);
  expect((await api('/operations/read', { table: 'releases' })).data[0].name).toBe('Shared server edit');
  server = await platform({ statePath }); api = server.client(); server.advance();
  await api('/auth/login', { username: 'caroline', password: 'my-long-password' });
  await api('/auth/verify', { code: server.code(enrollment.data.secret) });
  expect((await api('/operations/read', { table: 'releases' })).data[0].name).toBe('Shared server edit');
});

it('uses a domain for passkeys and rejects the IP preview origin before issuing a challenge', async () => {
  const server = await platform(), api = server.client();
  await api('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  expect((await api('/auth/passkeys/register/options', {}, 'http://127.0.0.1:5180')).status).toBe(403);
  const options = await api('/auth/passkeys/register/options', {});
  expect(options.data.rp.id).toBe('localhost');
});
it('grants account management through Master Admin membership without granting portal edit access', async () => {
  const server = await platform(), owner = server.client();
  const enrollment = await owner('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  await owner('/auth/verify', { code: server.code(enrollment.data.secret) });
  expect((await owner('/auth/status')).data).toMatchObject({ canEdit: true, canManageAccounts: true, groupIds: ['portal-team', 'portal-master-admin'] });
  expect((await owner('/auth/accounts/update', { username: 'caroline', displayName: 'Caroline', email: '', groupId: 'portal-team', masterAdmin: false })).status).toBe(400);
  expect((await owner('/auth/accounts/status', { username: 'caroline', disabled: true })).status).toBe(400);
  server.advance();
  await owner('/auth/accounts/provision', { username: 'account-admin', displayName: 'Account administrator', email: '', groupId: 'portal-team', masterAdmin: true, password: 'admin-long-password' });
  const manager = server.client();
  await manager('/auth/login', { username: 'account-admin', password: 'admin-long-password' });
  const setup = await manager('/auth/enroll', {}); await manager('/auth/verify', { code: server.code(setup.data.secret) });
  expect((await manager('/auth/status')).data).toMatchObject({ canManageAccounts: true, canEdit: false });
  expect((await manager('/operations/write', { table: 'releases', action: 'update', id: 'release-1', patch: { name: 'Blocked' } })).status).toBe(403);
  await manager('/auth/accounts/provision', { username: 'new-viewer', displayName: 'Viewer', email: '', groupId: 'tpa', password: 'viewer-long-password' });
  server.advance();
  expect((await manager('/auth/accounts/update', { username: 'new-viewer', displayName: 'Updated viewer', email: 'viewer@example.invalid', groupId: 'majesco', masterAdmin: false })).data).toMatchObject({ displayName: 'Updated viewer', groupIds: ['majesco'], canManageAccounts: false });
  const viewer = server.client(); await viewer('/auth/login', { username: 'new-viewer', password: 'viewer-long-password' });
  const viewerSetup = await viewer('/auth/enroll', {}); await viewer('/auth/verify', { code: server.code(viewerSetup.data.secret) });
  expect((await viewer('/auth/accounts/update', { username: 'new-viewer', masterAdmin: true })).status).toBe(403);
  expect((await manager('/auth/accounts/status', { username: 'new-viewer', disabled: true })).data.disabled).toBe(true);
  expect((await viewer('/auth/status')).data.passwordAccepted).toBe(false);
  expect((await viewer('/auth/login', { username: 'new-viewer', password: 'viewer-long-password' })).status).toBe(401);
  server.advance();
  await manager('/auth/accounts/status', { username: 'new-viewer', disabled: false });
  expect((await viewer('/auth/login', { username: 'new-viewer', password: 'viewer-long-password' })).status).toBe(200);
  expect((await owner('/auth/accounts/update', { username: 'account-admin', displayName: 'Account administrator', email: '', groupId: 'portal-team', masterAdmin: false })).status).toBe(200);
  expect((await manager('/auth/accounts/status', { username: 'new-viewer', disabled: true })).status).toBe(403);
});
it('preserves owner permissions and passkey identity across username changes and rejects duplicates', async () => {
  const server = await platform(), api = server.client(), device = authenticator();
  await api('/auth/setup', { username: 'caroline', password: 'my-long-password' });
  const options = (await api('/auth/passkeys/register/options', {})).data;
  await api('/auth/passkeys/register/verify', { credential: device.register(options) });
  expect((await api('/auth/account/username', { username: 'tpa-viewer' })).status).toBe(409);
  expect((await api('/auth/account/username', { username: 'caroline.new' })).data).toMatchObject({ username: 'caroline.new', canEdit: true, canManageAccounts: true });
  expect((await api('/auth/status')).data.username).toBe('caroline.new');
  await api('/auth/logout', {});
  expect((await api('/auth/login', { username: 'caroline', password: 'my-long-password' })).status).toBe(401);
  expect((await api('/auth/login', { username: 'caroline.new', password: 'my-long-password' })).status).toBe(200);
  server.advance();
  const challenge = (await api('/auth/passkeys/authenticate/options', {})).data;
  expect((await api('/auth/passkeys/authenticate/verify', { credential: device.authenticate(challenge) })).status).toBe(200);
  expect((await api('/auth/status')).data).toMatchObject({ authenticated: true, canEdit: true });
});
it('protects the final master admin and revokes a deactivated member’s sessions', async () => {
  const server = await platform(), owner = server.client(), viewer = server.client(), device = authenticator();
  const setup = (await owner('/auth/setup', { username: 'caroline', password: 'my-long-password' })).data;
  await owner('/auth/verify', { code: server.code(setup.secret) });
  expect((await owner('/auth/account/deactivate', {})).status).toBe(400);
  await owner('/auth/accounts/provision', { username: 'new-viewer', displayName: 'Viewer', email: '', groupId: 'tpa', password: 'viewer-long-password' });
  await viewer('/auth/login', { username: 'new-viewer', password: 'viewer-long-password' });
  const options = (await viewer('/auth/passkeys/register/options', {})).data;
  await viewer('/auth/passkeys/register/verify', { credential: device.register(options) });
  expect((await viewer('/auth/account/deactivate', {})).status).toBe(200);
  expect((await viewer('/auth/status')).data.authenticated).toBe(false);
  expect((await viewer('/auth/login', { username: 'new-viewer', password: 'viewer-long-password' })).status).toBe(401);
  expect((await owner('/auth/accounts/status', { username: 'new-viewer', disabled: false })).status).toBe(200);
});
