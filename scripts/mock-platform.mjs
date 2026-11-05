import { normalizeSiteReferences } from '../src/domain/siteIdentity.mjs';
import { verifyRegistration, verifyAuthentication } from './webauthn.mjs';
import { accountGroups, memberAccounts, publicAccount } from './account-groups.mjs';
import { builderRelease } from './builder-release.mjs';
import { enrollmentQrDataUrl } from './authenticator-qr.mjs';
import { extractRateUpload } from './import-rate-table.mjs';
import { createServer } from 'node:http';
import { createApplicantSaves } from './applicant-saves.mjs';
import { createHash, randomBytes, pbkdf2Sync, timingSafeEqual, createHmac, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';

const b32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes) {
  let bits = 0, value = 0, result = '';
  for (const byte of bytes) { value = (value << 8) | byte; bits += 8; while (bits >= 5) { result += b32[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits) result += b32[(value << (5 - bits)) & 31];
  return result;
}
function decode32(secret) {
  let bits = 0, value = 0; const bytes = [];
  for (const letter of secret) { const n = b32.indexOf(letter); if (n < 0) throw new Error('Invalid TOTP secret'); value = (value << 5) | n; bits += 5; if (bits >= 8) { bytes.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(bytes);
}
export function totp(secret, time = Date.now(), digits = 6) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const hash = createHmac('sha1', decode32(secret)).update(counter).digest(), offset = hash.at(-1) & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits).padStart(digits, '0');
}
const sha = value => createHash('sha256').update(value).digest('hex');
const safeEqual = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const passwordHash = (password, salt) => pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const passwordLifetime = 30 * 24 * 60 * 60 * 1000;
const frequencies = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 };
const siteKeys = ['demo','abe','ama','asce','avma','csea','nso','isitrust','waepa','waepa-gi'];

/** Local simulation only. It never calls PRASE, a payment processor or email. */
export function createMockPlatform({ database, prototypeTables = Object.keys(database ?? {}), libraryTables = Object.keys(database ?? {}), statePath, clock = Date.now, checkReadiness, analyticsTags = [], validatePayload, operationsDatabase, accountSignInEnabled = true } = {}) {
  database = normalizeSiteReferences(database);
  const prototypeData = Object.fromEntries([...new Set(prototypeTables)].map(table => {
    if (!Array.isArray(database?.[table])) throw new Error(`Missing catalog table: ${table}`);
    return [table, database[table]];
  }));
  const libraryTableSet = new Set(libraryTables);
  analyticsTags = normalizeSiteReferences(analyticsTags);
  operationsDatabase = normalizeSiteReferences(operationsDatabase);
  let state = { version: 1, admin: null, payments: {}, drafts: {}, releases: {}, heads: {}, audit: [], analytics: [] };
  if (statePath) { try { state = normalizeSiteReferences(JSON.parse(readFileSync(statePath, 'utf8'))); if (state.version !== 1) throw new Error('Unsupported mock state'); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
  const sessions = new Map(), quotes = new Map(), attempts = new Map();
  const persist = () => {
    if (!statePath) return;
    mkdirSync(dirname(statePath), { recursive: true, mode: 0o700 });
    const temp = `${statePath}.tmp`; writeFileSync(temp, JSON.stringify(state), { mode: 0o600 }); renameSync(temp, statePath);
  };
  const commit = change => {
    const previous = structuredClone(state);
    try { change(); persist(); } catch (error) { state = previous; throw error; }
  };
  // Existing accounts receive their first 30-day window on upgrade.
  if (state.admin && !Number.isFinite(state.admin.passwordChangedAt)) commit(() => { state.admin.passwordChangedAt = clock(); });
  state.members ??= memberAccounts();
  if (state.admin) {
    state.admin.groupId ??= 'portal-team'; state.admin.displayName ??= 'Caroline'; state.admin.passkeys ??= [];
    state.admin.groupIds ??= ['portal-team', 'portal-master-admin'];
    state.admin.disabled ??= false;
  }
  for (const member of state.members) { member.groupIds ??= [member.groupId]; member.disabled ??= false; }
  persist();
  const lookupAccount = username => state.admin?.username === username ? state.admin : state.members.find(a => a.username === username);
  const passwordExpired = account => !!account && clock() >= account.passwordChangedAt + passwordLifetime;
  const hasFactor = account => !!account && !account.replacementRequired && (account.totpVerified || account.passkeys?.length > 0);
  const validatePassword = (password, account = state.admin) => {
    if (typeof password !== 'string' || password.length < 12 || password.length > 256) fail(400, 'Use a password of 12–256 characters');
    if (account?.passwordHash && safeEqual(passwordHash(password, account.salt), account.passwordHash)) fail(400, 'Choose a different password');
  };
  const acceptedTotpCounter = (code, admin) => {
    if (!admin?.totpVerified || admin.replacementRequired || typeof code !== 'string' || !/^\d{6}$/.test(code)) return -1;
    for (const offset of [-1, 0, 1]) {
      const time = clock() + offset * 30000, counter = Math.floor(time / 30000);
      if (counter > admin.lastCounter && safeEqual(totp(admin.totpSecret, time), code)) return counter;
    }
    return -1;
  };
  const ownerProfile = { username: 'caroline', email: 'caroline@example.invalid', displayName: 'Caroline', groupId: 'portal-team', groupIds: ['portal-team', 'portal-master-admin'], disabled: false, passkeys: [] };
  const token = () => randomBytes(32).toString('hex');
  const enroll = admin => {
    const secret = base32(randomBytes(20)), recoveryCodes = Array.from({ length: 8 }, () => base32(randomBytes(16)));
    const uri = `otpauth://totp/Portal%20Mock:${encodeURIComponent(admin.username)}?secret=${secret}&issuer=Portal%20Mock&algorithm=SHA1&digits=6&period=30`;
    // Generate locally: credentials never go to a remote QR-code service.
    const qrDataUrl = enrollmentQrDataUrl(uri);
    commit(() => {
      admin.totpSecret = secret; admin.recoveryHashes = recoveryCodes.map(sha);
      admin.totpVerified = false; admin.lastCounter = -1; admin.replacementRequired = false;
    });
    return { secret, uri, qrDataUrl, recoveryCodes };
  };
  const prototypeDraft = siteKey => Object.values(state.drafts).filter(d => d.siteKey === siteKey).at(-1);
  const seedPayloads = new Map(), payloadRevisions = new WeakMap();
  let seedBaseRevision;
  const availableSite = siteKey => siteKeys.includes(siteKey) || !!prototypeDraft(siteKey);
  const prototypePayload = (siteKey, environment) => {
    if (environment !== undefined) {
      if (!['uat','production'].includes(environment)) fail(400, 'Invalid prototype environment');
      const release = state.prototypeReleases?.[state.prototypeHeads?.[siteKey]?.[environment]];
      if (!release) fail(404, 'No release in this prototype environment');
      return release.payload;
    }
    const draft = prototypeDraft(siteKey);
    if (draft) return draft.payload;
    if (!seedPayloads.has(siteKey)) {
      seedBaseRevision ??= `local:v1:sha256:${sha(JSON.stringify(database))}`;
      seedPayloads.set(siteKey, { formatVersion: 1, siteKey, baseRevision: seedBaseRevision, editVersion: 0, data: prototypeData });
    }
    return seedPayloads.get(siteKey);
  };
  const prototypeRevision = (siteKey, environment) => {
    const payload = prototypePayload(siteKey, environment);
    // A save replaces the payload object; quotes share its revision without
    // repeatedly hashing the multi-megabyte catalog on every payment request.
    if (!payloadRevisions.has(payload)) payloadRevisions.set(payload, `prototype:${sha(JSON.stringify(payload))}`);
    return payloadRevisions.get(payload);
  };
  const requiredProducts = (site, environment) => { const data = prototypePayload(site, environment)?.data ?? database; return data?.siteProducts?.filter(p => p.enabled && p.siteId === data.sites.find(s => s.key === site)?.id).map(p => p.productKey) ?? []; };
  const applicantSaves = createApplicantSaves({ statePath: statePath ? `${statePath}.applicants.json` : undefined, clock, availableSite, revisionFor: prototypeRevision });
  const strictKeys = (body, keys) => { if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) fail(400, 'Unexpected request properties'); };
  const requestBody = async req => {
    let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 32 * 1024 * 1024) fail(413, 'Request too large'); }
    try { return body ? normalizeSiteReferences(JSON.parse(body)) : {}; } catch { fail(400, 'Invalid JSON'); }
  };
  const server = createServer(async (req, res) => {
    const respond = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname.replace(/^\/api\/mock/, '');
      if (req.headers.origin && !/^http:\/\/(localhost|127\.0\.0\.1):(5173|5174|5180|8787)$/.test(req.headers.origin)) fail(403, 'Origin denied');
      if (req.method === 'GET' && /^\/rate-assets\/[a-f0-9-]{36}$/.test(path)) {
        const asset = state.rateAssets?.[path.split('/').at(-1)];
        if (!asset) fail(404, 'Rate asset unavailable');
        res.writeHead(200, { 'Content-Type': asset.contentType, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'", 'Cache-Control': 'no-store' });
        return res.end(Buffer.from(asset.base64, 'base64'));
      }
      const sessionId = /(?:^|;\s*)portal_mock_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1];
      let session = sessions.get(sessionId);
      if (session && (session.expires <= clock() || lookupAccount(session.username)?.disabled)) { sessions.delete(sessionId); session = undefined; }
      let admin = accountSignInEnabled ? (session ? lookupAccount(session.username) : null) : { ...ownerProfile, portalEditor: true };
      const account = () => publicAccount(admin);
      const requireAdmin = () => { if (!accountSignInEnabled) return; if (!session?.aal2 || !hasFactor(admin) || session.recovery) fail(401, 'Verified admin session required'); if (passwordExpired(admin)) fail(403, 'Your password has expired. Change it to continue'); };
      const requireAccountManager = () => { requireAdmin(); if (!account().canManageAccounts) fail(403, 'Account management requires Portal Master Admin membership.'); };
      const requireEditor = () => { requireAdmin(); if (accountSignInEnabled && admin !== state.admin) fail(403, 'This account has read-only access. Only Caroline can edit.'); };
      // Temporary local development access; persisted credentials remain untouched.
      if (!accountSignInEnabled && path.startsWith('/auth/')) {
        if (req.method === 'GET' && path === '/auth/status') return respond(200, { ...account(), mode: 'mock', signInDisabled: true, authenticated: true, setupNeeded: false, mfaVerified: false, passwordExpired: false, passwordExpiresAt: null, sessionExpiresAt: null, passwordAccepted: false, recoveryRequired: false, enrollmentNeeded: false, totpEnrolled: false, passkeyCount: 0 });
        fail(403, 'Account sign-in is disabled during prototype development');
      }
      if (req.method === 'GET' && path === '/auth/status') return respond(200, { ...account(), mode: 'mock', setupNeeded: !state.admin, authenticated: !!session?.aal2 && hasFactor(admin) && !session?.recovery && !passwordExpired(admin), mfaVerified: !!session?.aal2 && hasFactor(admin) && !session?.recovery, passwordExpired: !!session && passwordExpired(admin), passwordExpiresAt: session && admin ? admin.passwordChangedAt + passwordLifetime : null, sessionExpiresAt: session?.expires ?? null, passwordAccepted: !!session, recoveryRequired: !!session?.recovery, enrollmentNeeded: !!session && !hasFactor(admin), totpEnrolled: !!admin?.totpVerified, passkeyCount: admin?.passkeys?.length ?? 0 });
      if (req.method !== 'POST' || req.headers['x-portal-mock'] !== '1') fail(405, 'Use the mock JSON API');
      const body = await requestBody(req);
      if (path === '/membership/ama-lookup') {
        if (body.siteKey !== 'ama' || !availableSite(body.siteKey)) fail(400, 'AMA mock lookup requires the AMA Site');
        const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : '', lastName = typeof body.lastName === 'string' ? body.lastName.trim() : '';
        const birthDate = typeof body.birthDate === 'string' ? body.birthDate : '', date = new Date(`${birthDate}T00:00:00Z`);
        if (!firstName || !lastName || firstName.length > 100 || lastName.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate || date.getTime() > clock()) fail(400, 'Enter a valid name and date of birth');
        const identity = { firstName, lastName, birthDate }, fixture = `${firstName} ${lastName}`.toLowerCase();
        if (fixture === 'service error') fail(503, 'Mock lookup is temporarily unavailable. Please retry.');
        const found = fixture !== 'no match';
        const number = String(parseInt(createHash('sha256').update(JSON.stringify([firstName.toLowerCase(), lastName.toLowerCase(), birthDate])).digest('hex').slice(0, 12), 16) % 10000000000).padStart(10, '0');
        return respond(200, { mode: 'mock', provider: 'ama-mock', identity, status: found ? 'matched' : 'not-found', medicalEducationNumber: found ? `MOCK-ME-${number}` : null, isMember: found ? firstName.toLowerCase() !== 'nonmember' : false });
      }
      if (applicantSaves.handles(path)) return respond(200, applicantSaves.request(path, body));
      if (path.startsWith('/auth/')) {
        const key = req.socket.remoteAddress, recent = (attempts.get(key) ?? []).filter(t => clock() - t < 60000);
        if (recent.length >= 10) fail(429, 'Too many attempts. Retry in one minute.'); recent.push(clock()); attempts.set(key, recent);
      }
      const startSession = admin => { sessions.delete(sessionId); const id = token(); const next = { username: admin.username, aal2: false, recovery: !!admin.replacementRequired, expires: clock() + 30 * 60000 }; sessions.set(id, next); res.setHeader('Set-Cookie', `portal_mock_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`); return next; };
      if (path === '/auth/setup') {
        strictKeys(body, ['username','password']);
        if (state.admin) fail(409, 'Admin already provisioned');
        if (body.username !== 'caroline' || typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 256) fail(400, 'Use caroline and a password of 12–256 characters');
        const salt = token(); state.admin = { ...ownerProfile, salt, passwordHash: passwordHash(body.password, salt), passwordChangedAt: clock() };
        const enrollment = enroll(state.admin); startSession(state.admin); persist(); return respond(200, { ...publicAccount(state.admin), ...enrollment, mode: 'mock' });
      }
      if (path === '/auth/login') {
        strictKeys(body, ['username','password']);
        admin = lookupAccount(body.username);
        const valid = admin?.passwordHash && !admin.disabled && typeof body.password === 'string' && body.password.length <= 256 && safeEqual(passwordHash(body.password, admin.salt), admin.passwordHash);
        if (!valid) fail(401, 'Invalid credentials');
        startSession(admin); return respond(200, { requiresTotp: true, mode: 'mock' });
      }
      if (path === '/auth/verify') {
        strictKeys(body, ['code']); if (!session || !admin) fail(401, 'Sign in first');
        if (!admin.totpSecret) fail(401, 'Set up an authenticator first');
        if (admin.replacementRequired || (session.recovery && !session.enrollmentReady)) fail(401, 'Enroll a replacement authenticator first');
        if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) fail(400, 'Enter a six-digit TOTP code');
        let acceptedCounter = -1;
        for (const offset of [-1,0,1]) { const time = clock() + offset * 30000, counter = Math.floor(time / 30000); if (counter > admin.lastCounter && safeEqual(totp(admin.totpSecret, time), body.code)) acceptedCounter = counter; }
        if (acceptedCounter < 0) fail(401, 'Invalid or already used TOTP code');
        commit(() => { admin.lastCounter = acceptedCounter; admin.totpVerified = true; });
        session.aal2 = true; session.recovery = false; return respond(200, { authenticated: true, mode: 'mock' });
      }
      if (path === '/auth/recover') {
        strictKeys(body, ['code']); if (!session || !admin || typeof body.code !== 'string') fail(401, 'Sign in with password first');
        const hash = sha(body.code), index = (admin.recoveryHashes ?? []).findIndex(h => safeEqual(h, hash));
        if (index < 0) fail(401, 'Invalid or used recovery code');
        commit(() => { admin.recoveryHashes.splice(index, 1); admin.replacementRequired = true; admin.totpVerified = false; admin.passkeys = []; });
        sessions.forEach((_, id) => { if (id !== sessionId && sessions.get(id).username === admin.username) sessions.delete(id); });
        session.recovery = true; session.aal2 = false; session.enrollmentReady = false; return respond(200, { reenrollmentRequired: true, mode: 'mock' });
      }
      if (path === '/auth/enroll') {
        strictKeys(body, []);
        if (!session || (hasFactor(admin) && !session.recovery)) fail(401, 'Recover your account first');
        const enrollment = enroll(admin);
        sessions.forEach((_, id) => { if (id !== sessionId && sessions.get(id).username === admin.username) sessions.delete(id); });
        session.aal2 = false; session.enrollmentReady = true; return respond(200, { ...enrollment, mode: 'mock' });
      }
      if (path === '/auth/password/change') {
        strictKeys(body, ['currentPassword', 'newPassword']);
        if (!session?.aal2 || session.recovery || !hasFactor(admin)) fail(401, 'Verify your authenticator first');
        if (typeof body.currentPassword !== 'string' || body.currentPassword.length > 256 || !safeEqual(passwordHash(body.currentPassword, admin.salt), admin.passwordHash)) fail(401, 'Current password is incorrect');
        validatePassword(body.newPassword, admin);
        const salt = token();
        commit(() => { admin.salt = salt; admin.passwordHash = passwordHash(body.newPassword, salt); admin.passwordChangedAt = clock(); });
        // Revoke every old session and require a fresh two-factor login.
        sessions.forEach((value, id) => { if (value.username === admin.username) sessions.delete(id); });
        res.setHeader('Set-Cookie', 'portal_mock_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return respond(200, { passwordChanged: true });
      }
      if (path === '/auth/password/reset') {
        strictKeys(body, ['username', 'newPassword', 'code', 'method']);
        admin = lookupAccount(body.username);
        if (!admin?.passwordHash || admin.disabled || !['totp', 'recovery'].includes(body.method) || typeof body.code !== 'string') fail(401, 'Invalid account or verification code');
        const counter = body.method === 'totp' ? acceptedTotpCounter(body.code, admin) : -1;
        const recoveryIndex = body.method === 'recovery' ? (admin.recoveryHashes ?? []).findIndex(h => safeEqual(h, sha(body.code.trim()))) : -1;
        if (counter < 0 && recoveryIndex < 0) fail(401, 'Invalid or already used verification code');
        validatePassword(body.newPassword, admin);
        const salt = token();
        commit(() => {
          admin.salt = salt; admin.passwordHash = passwordHash(body.newPassword, salt); admin.passwordChangedAt = clock();
          if (counter >= 0) admin.lastCounter = counter;
          else { admin.recoveryHashes.splice(recoveryIndex, 1); admin.replacementRequired = true; admin.totpVerified = false; admin.passkeys = []; }
        });
        sessions.forEach((value, id) => { if (value.username === admin.username) sessions.delete(id); });
        res.setHeader('Set-Cookie', 'portal_mock_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return respond(200, { passwordReset: true, reenrollmentRequired: recoveryIndex >= 0 });
      }
      if (path.startsWith('/auth/passkeys/')) {
        if (!session || !admin) fail(401, 'Enter your password first');
        const registering = path.includes('/register/');
        if (registering && hasFactor(admin) && (!session.aal2 || session.recovery)) fail(401, 'Verify an existing sign-in method before adding a passkey');
        if (registering && session.aal2 && passwordExpired(admin)) fail(403, 'Change your expired password first');
        if (!registering && (!admin.passkeys?.length || session.recovery || admin.replacementRequired)) fail(401, 'No usable passkey. Use another sign-in method.');
        const origin = req.headers.origin;
        if (!origin || !/^http:\/\/localhost:(5173|5174|5180|8787)$/.test(origin)) fail(403, 'Use the localhost preview address for passkeys, then sign in again.');
        const rpID = new URL(origin).hostname;
        if (path.endsWith('/options')) {
          strictKeys(body, []);
          const challenge = randomBytes(32).toString('base64url');
          session.ceremony = { challenge, origin, rpID, registering, expires: clock() + 5 * 60000 };
          const descriptors = (admin.passkeys ?? []).map(key => ({ type: 'public-key', id: key.id }));
          const userID = Buffer.from(admin.passkeyUserHandle ?? admin.username).toString('base64url');
          return respond(200, registering ? { challenge, rp: { id: rpID, name: 'GMAD Portal' }, user: { id: userID, name: admin.username, displayName: admin.displayName ?? admin.username }, pubKeyCredParams: [{ type: 'public-key', alg: -7 }], timeout: 60000, attestation: 'none', authenticatorSelection: { residentKey: 'preferred', userVerification: 'required', authenticatorAttachment: 'platform' }, excludeCredentials: descriptors } : { challenge, rpId: rpID, timeout: 60000, userVerification: 'required', allowCredentials: descriptors });
        }
        if (!path.endsWith('/verify')) fail(404, 'Unknown passkey operation');
        strictKeys(body, ['credential', 'label']);
        const ceremony = session.ceremony; delete session.ceremony;
        if (!ceremony || ceremony.expires <= clock() || ceremony.registering !== registering || ceremony.origin !== origin) fail(401, 'Passkey request expired. Try again.');
        if (registering) {
          if ((admin.passkeys?.length ?? 0) >= 10) fail(400, 'A maximum of ten passkeys is supported');
          const key = verifyRegistration(body.credential, ceremony);
          if ([state.admin, ...state.members].some(a => a?.passkeys?.some(k => k.id === key.id))) fail(409, 'Passkey already registered');
          const recoveryCodes = !hasFactor(admin) ? Array.from({ length: 8 }, () => base32(randomBytes(16))) : [];
          commit(() => {
            admin.passkeys ??= []; admin.passkeys.push({ ...key, label: typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : 'Device passkey', createdAt: clock() });
            admin.replacementRequired = false;
            if (recoveryCodes.length) admin.recoveryHashes = recoveryCodes.map(sha);
          });
          session.aal2 = true; session.recovery = false;
          return respond(200, { registered: true, recoveryCodes });
        }
        const key = admin.passkeys.find(k => k.id === body.credential?.id);
        if (!key) fail(401, 'Unknown passkey');
        const counter = verifyAuthentication(body.credential, ceremony, key, Buffer.from(admin.passkeyUserHandle ?? admin.username).toString('base64url'));
        commit(() => { key.counter = counter; });
        session.aal2 = true; return respond(200, { authenticated: true });
      }
      if (path === '/auth/account') {
        requireAdmin(); strictKeys(body, []);
        return respond(200, { ...account(), groups: accountGroups, passkeys: (admin.passkeys ?? []).map(({ id, label, createdAt }) => ({ id, label, createdAt })), totpEnrolled: !!admin.totpVerified });
      }
      if (path === '/auth/account/username') {
        requireAdmin(); strictKeys(body, ['username']);
        if (typeof body.username !== 'string' || !/^[a-z][a-z0-9.-]{2,63}$/.test(body.username)) fail(400, 'Enter a valid username');
        if (body.username === admin.username) return respond(200, account());
        if (body.username === 'caroline' || lookupAccount(body.username)) fail(409, 'Username is already in use');
        const previousUsername = admin.username;
        commit(() => { if (admin === state.admin) admin.portalEditor = true; admin.passkeyUserHandle ??= previousUsername; admin.username = body.username; state.audit.push({ action: 'account-username', actor: previousUsername, username: body.username, at: clock() }); });
        sessions.forEach((value, id) => { if (value.username === previousUsername) { if (id === sessionId) value.username = body.username; else sessions.delete(id); } });
        return respond(200, account());
      }
      if (path === '/auth/account/deactivate') {
        requireAdmin(); strictKeys(body, []);
        if (account().canManageAccounts && ![state.admin, ...state.members].some(value => value !== admin && value.passwordHash && !value.disabled && publicAccount(value).canManageAccounts)) fail(400, 'Keep at least one active Portal Master Admin.');
        commit(() => { admin.disabled = true; state.audit.push({ action: 'account-deactivate', actor: admin.username, username: admin.username, at: clock() }); });
        sessions.forEach((value, id) => { if (value.username === admin.username) sessions.delete(id); });
        res.setHeader('Set-Cookie', 'portal_mock_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        return respond(200, { deactivated: true });
      }
      if (path === '/auth/passkey/remove') {
        requireAdmin(); strictKeys(body, ['id']);
        if (!admin.passkeys?.some(k => k.id === body.id)) fail(404, 'Passkey unavailable');
        if (!admin.totpVerified && admin.passkeys.length <= 1) fail(400, 'Keep at least one sign-in method');
        commit(() => { admin.passkeys = admin.passkeys.filter(k => k.id !== body.id); });
        sessions.forEach((value, id) => { if (id !== sessionId && value.username === admin.username) sessions.delete(id); });
        return respond(200, { removed: true });
      }
      if (path === '/auth/accounts') {
        requireAdmin(); strictKeys(body, []);
        return respond(200, { groups: accountGroups, accounts: [state.admin, ...state.members].map(publicAccount) });
      }
      if (path === '/auth/accounts/provision') {
        requireAccountManager(); strictKeys(body, ['username', 'displayName', 'email', 'groupId', 'password', 'masterAdmin']);
        if (typeof body.username !== 'string' || !/^[a-z][a-z0-9.-]{2,63}$/.test(body.username) || body.username === 'caroline' || !accountGroups.some(g => g.id === body.groupId && !g.administrative) || typeof body.displayName !== 'string' || !body.displayName.trim() || typeof body.email !== 'string' || body.email.length > 254) fail(400, 'Enter a valid account and group');
        const existing = lookupAccount(body.username);
        if (existing?.passwordHash) fail(409, 'Account is already provisioned');
        if (body.masterAdmin !== undefined && typeof body.masterAdmin !== 'boolean') fail(400, 'Invalid administrator membership');
        validatePassword(body.password, null);
        const salt = token();
        commit(() => { const member = existing ?? { username: body.username, passkeys: [], recoveryHashes: [], totpVerified: false }; Object.assign(member, { displayName: body.displayName.trim().slice(0, 80), email: body.email.trim(), groupId: body.groupId, groupIds: [body.groupId, ...(body.masterAdmin ? ['portal-master-admin'] : [])], disabled: false, salt, passwordHash: passwordHash(body.password, salt), passwordChangedAt: clock() }); if (!existing) state.members.push(member); });
        return respond(200, publicAccount(lookupAccount(body.username)));
      }
      if (path === '/auth/logout') { sessions.delete(sessionId); res.setHeader('Set-Cookie', 'portal_mock_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return respond(200, { signedOut: true }); }
      if (path === '/auth/accounts/update' || path === '/auth/accounts/status') {
        requireAccountManager();
        const target = lookupAccount(body.username);
        if (!target) fail(404, 'Account unavailable');
        const isMaster = value => value.groupIds?.includes('portal-master-admin') && value.passwordHash && !value.disabled;
        const protectMaster = removing => {
          if (removing && isMaster(target) && ![state.admin, ...state.members].some(value => value !== target && isMaster(value))) fail(400, 'Keep at least one active Portal Master Admin.');
        };
        if (path === '/auth/accounts/status') {
          strictKeys(body, ['username', 'disabled']);
          if (typeof body.disabled !== 'boolean') fail(400, 'Choose an account status');
          if (body.disabled && target.username === admin.username) fail(400, 'You cannot suspend your own account.');
          protectMaster(body.disabled);
          commit(() => { target.disabled = body.disabled; state.audit.push({ action: body.disabled ? 'account-suspend' : 'account-enable', actor: admin.username, username: target.username, at: clock() }); });
        } else {
          strictKeys(body, ['username', 'displayName', 'email', 'groupId', 'masterAdmin']);
          if (typeof body.displayName !== 'string' || !body.displayName.trim() || typeof body.email !== 'string' || body.email.length > 254 || !accountGroups.some(group => group.id === body.groupId && !group.administrative) || typeof body.masterAdmin !== 'boolean') fail(400, 'Enter valid account details and group membership');
          protectMaster(!body.masterAdmin);
          const groupIds = [body.groupId, ...(body.masterAdmin ? ['portal-master-admin'] : [])];
          commit(() => { Object.assign(target, { displayName: body.displayName.trim().slice(0, 80), email: body.email.trim(), groupId: body.groupId, groupIds }); state.audit.push({ action: 'account-update', actor: admin.username, username: target.username, groupIds, at: clock() }); });
        }
        // Revoked access is effective immediately, including already-open browser sessions.
        if (target.disabled) sessions.forEach((value, id) => { if (value.username === target.username) sessions.delete(id); });
        return respond(200, publicAccount(target));
      }
      if (path === '/operations/import') {
        requireEditor(); strictKeys(body, ['data']);
        const tables = ['sites', 'applications', 'applicationParticipants', 'applicationEvents', 'changeRequests', 'changeItems', 'releases', 'releaseChanges', 'siteBuilderDrafts', 'auditEvents', 'migrationSchedules'];
        if (!body.data || Object.keys(body.data).length !== tables.length || tables.some(table => !Array.isArray(body.data[table]) || body.data[table].some(row => !row || typeof row.id !== 'string') || new Set(body.data[table].map(row => row.id)).size !== body.data[table].length)) fail(400, 'Invalid local operations import');
        if (state.operations) return respond(200, { imported: false });
        commit(() => { state.operations = structuredClone(body.data); });
        return respond(200, { imported: true });
      }
      if (path.startsWith('/operations/')) {
        requireAdmin();
        const tables = ['sites', 'applications', 'applicationParticipants', 'applicationEvents', 'changeRequests', 'changeItems', 'releases', 'releaseChanges', 'siteBuilderDrafts', 'auditEvents', 'migrationSchedules'];
        if (!tables.includes(body.table)) fail(400, 'Unavailable operational table');
        const seed = typeof operationsDatabase === 'function' ? await operationsDatabase() : operationsDatabase;
        if (!seed) fail(503, 'Operational data unavailable');
        // Recheck after loading the seed; sessions may have been revoked meanwhile.
        if (accountSignInEnabled && (sessions.get(sessionId) !== session || session.expires <= clock())) fail(401, 'Sign in again');
        const rows = state.operations?.[body.table] ?? seed[body.table] ?? [];
        if (path === '/operations/read') { strictKeys(body, ['table']); return respond(200, rows); }
        if (path !== '/operations/write') fail(404, 'Unknown operational request');
        requireEditor(); strictKeys(body, ['table', 'action', 'row', 'id', 'patch']);
        let next = structuredClone(rows), result;
        if (body.action === 'insert') {
          if (!body.row || typeof body.row !== 'object' || Array.isArray(body.row) || typeof body.row.id !== 'string' || !body.row.id || next.some(row => row.id === body.row.id)) fail(409, 'Invalid or duplicate record');
          result = body.row; next.push(result);
        } else {
          const index = next.findIndex(row => row.id === body.id);
          if (index < 0) fail(404, 'Record unavailable');
          if (body.action === 'remove') next.splice(index, 1);
          else if (body.action === 'update' && body.patch && typeof body.patch === 'object' && !Array.isArray(body.patch)) { result = { ...next[index], ...body.patch, id: body.id }; next[index] = result; }
          else fail(400, 'Invalid operation');
        }
        commit(() => { state.operations ??= {}; state.operations[body.table] = next; });
        return respond(200, result ?? { removed: true });
      }
      if (path === '/rates/quote') {
        strictKeys(body, ['siteKey','productKey','amount','frequency','dimensions','paymentMethod','revision','environment']);
        if (body.dimensions !== undefined && (!body.dimensions || typeof body.dimensions !== 'object' || Array.isArray(body.dimensions) || Object.keys(body.dimensions).some(key => !['rateClass','membership','age','gender','tobacco','jurisdiction','amount','applicant','waitingPeriod','benefitPeriod','association','riders'].includes(key)))) fail(400, 'Invalid mock rating inputs');
        if (!availableSite(body.siteKey) || !requiredProducts(body.siteKey, body.environment).includes(body.productKey) || !Number.isSafeInteger(body.amount) || body.amount <= 0 || body.amount > 10000000 || !Object.hasOwn(frequencies, body.frequency)) fail(400, 'Invalid mock quote dimensions');
        const revision = prototypeRevision(body.siteKey, body.environment);
        if (body.revision !== undefined && body.revision !== revision) fail(409, 'Prototype Library changed; reload before requesting a quote');
        if (body.dimensions?.applicant !== undefined && !['member','spouse','child'].includes(body.dimensions.applicant)) fail(400, 'Invalid applicant dimension');
        const monthlyCents = Math.max(100, Math.ceil(body.amount / 1000 * 25));
        let premiumCents = monthlyCents * frequencies[body.frequency];
        if (body.paymentMethod !== undefined) {
          const data = prototypePayload(body.siteKey, body.environment).data;
          const keys = data.configurationDefinitions?.filter(d => d.definition.target?.kind === 'product-journey-policy' && d.definition.target.productKey === body.productKey).map(d => d.key) ?? [];
          const policy = data.configurationValues?.find(v => v.scope === 'site' && v.siteKey === body.siteKey && keys.includes(v.configurationKey))?.value;
          if (!policy?.payment?.methods.some(m => m.method === body.paymentMethod && m.frequencies.includes(body.frequency))) fail(400, 'Unavailable Library billing choice');
          premiumCents = Math.round((Math.max(0, monthlyCents * 12 / 100 - policy.billing.annualCredit) * policy.billing.annualFactors[body.frequency] + policy.billing.feePerCollection[body.paymentMethod] + Number.EPSILON) * 100);
        }
        const quote = { mode: 'mock', quoteId: randomUUID(), siteKey: body.siteKey, ...(body.environment ? { environment: body.environment } : {}), revision, productKey: body.productKey, amount: body.amount, ...(body.dimensions ? { dimensions: body.dimensions } : {}), premiumCents, currency: 'USD', frequency: body.frequency, expiresAt: clock() + 15 * 60000, authority: 'Synthetic test rates; not an insurance quote' };
        quotes.set(quote.quoteId, quote); return respond(200, quote);
      }
      if (path === '/payments/authorize') {
        strictKeys(body, ['quoteId','paymentToken','idempotencyKey']);
        if (!['mock-approved','mock-declined'].includes(body.paymentToken) || typeof body.idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(body.idempotencyKey)) fail(400, 'Use fixture tokens only; never submit real payment details');
        const requestHash = sha(JSON.stringify([body.quoteId, body.paymentToken, body.idempotencyKey])), previous = Object.hasOwn(state.payments, body.idempotencyKey) ? state.payments[body.idempotencyKey] : null;
        if (previous) { if (previous.requestHash !== requestHash) fail(409, 'Idempotency key reused with different request'); return respond(200, previous.response); }
        const quote = quotes.get(body.quoteId); if (!quote || quote.expiresAt <= clock()) fail(400, 'Unknown or expired quote');
        if (quote.revision !== prototypeRevision(quote.siteKey, quote.environment)) fail(409, 'Prototype Library changed; request a new quote');
        const response = { mode: 'mock', paymentId: randomUUID(), quoteId: quote.quoteId, status: body.paymentToken === 'mock-approved' ? 'authorized' : 'declined', amountCents: quote.premiumCents, currency: 'USD', fundsMoved: false };
        state.payments[body.idempotencyKey] = { requestHash, response }; persist(); return respond(200, response);
      }
      if (path === '/applications/submit') {
        strictKeys(body, ['siteKey','revision','entries','paymentIds','idempotencyKey','environment','paymentDeferred']);
        const paymentDeferred = body.paymentDeferred === true;
        if (!availableSite(body.siteKey) || typeof body.revision !== 'string' || !body.revision.startsWith('prototype:') || typeof body.idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(body.idempotencyKey) || !Array.isArray(body.entries) || !body.entries.length || !Array.isArray(body.paymentIds) || body.paymentIds.length !== (paymentDeferred ? 0 : body.entries.length) || body.paymentDeferred !== undefined && typeof body.paymentDeferred !== 'boolean') fail(400, 'Incomplete mock submission');
        const requestHash = sha(JSON.stringify(body));
        state.submissions ??= {};
        const previous = state.submissions[body.idempotencyKey];
        if (previous) { if (previous.requestHash !== requestHash) fail(409, 'Submission idempotency conflict'); return respond(200, previous.response); }
        if (body.revision !== prototypeRevision(body.siteKey, body.environment)) fail(409, 'Prototype Library changed; reload and reauthorize');
        if (paymentDeferred && prototypePayload(body.siteKey, body.environment).data.sitePages?.find(page => page.siteKey === body.siteKey && page.pageKey === 'payment')?.requirement !== 'optional') fail(400, 'Payment collection is not optional for this Site');
        const payments = Object.values(state.payments).map(p => p.response);
        for (const [index, entry] of body.entries.entries()) {
          strictKeys(entry, ['productKey','applicant','amount']);
          if (!requiredProducts(body.siteKey, body.environment).includes(entry.productKey) || !['member','spouse','child'].includes(entry.applicant) || !Number.isSafeInteger(entry.amount) || entry.amount <= 0) fail(400, 'Invalid mock submission entry');
          if (paymentDeferred) continue;
          const payment = payments.find(p => p.paymentId === body.paymentIds[index]);
          const quote = payment && quotes.get(payment.quoteId);
          if (!payment || payment.status !== 'authorized' || !quote || quote.expiresAt <= clock() || quote.siteKey !== body.siteKey || quote.revision !== body.revision || quote.productKey !== entry.productKey || quote.amount !== entry.amount || (quote.dimensions?.applicant !== undefined && quote.dimensions.applicant !== entry.applicant)) fail(400, 'Valid fixture authorization required for every entry');
        }
        if (new Set(body.entries.map(e => `${e.productKey}:${e.applicant}`)).size !== body.entries.length || new Set(body.paymentIds).size !== body.paymentIds.length) fail(400, 'Duplicate mock entries or authorizations');
        if (Object.values(state.submissions).some(submission => submission.paymentIds?.some(id => body.paymentIds.includes(id)))) fail(409, 'Fixture authorization already used by another submission');
        const response = { mode: 'mock', contract: 'mock-applicant-v1', submissionId: `MOCK-${randomUUID()}`, status: 'submitted', insurerSubmitted: false, fundsMoved: false, entryCount: body.entries.length };
        commit(() => { state.submissions[body.idempotencyKey] = { requestHash, response, siteKey: body.siteKey, revision: body.revision, entries: body.entries, paymentIds: body.paymentIds, ...(paymentDeferred ? { paymentDeferred: true } : {}) }; });
        return respond(200, response);
      }
      if (path === '/prototype/library') {
        strictKeys(body, ['siteKey','environment']);
        if (!availableSite(body.siteKey) || !database) fail(404, 'Unavailable prototype Site');
        // Saved drafts affect only their Site's prototype. Production heads stay gated.
        const draft = prototypeDraft(body.siteKey);
        const payload = prototypePayload(body.siteKey, body.environment);
        return respond(200, { mode: 'mock', revision: prototypeRevision(body.siteKey, body.environment), payload, draft: draft && !body.environment ? { id: draft.id, version: draft.version, baseReleaseId: draft.baseReleaseId } : null });
      }
      if (path === '/library/read') { strictKeys(body, ['siteKey']); const id = state.heads[body.siteKey]; return respond(200, id ? state.releases[id] : null); }
      if (path === '/analytics/event') {
        strictKeys(body, ['schemaVersion','tagId','event','properties']);
        strictKeys(body.properties, ['siteKey','template','revision']);
        const tag = analyticsTags.find(t => t.id === body.tagId);
        if (body.schemaVersion !== 1 || !tag || !tag.events.includes(body.event) || !tag.sites.includes(body.properties.siteKey) && !(availableSite(body.properties.siteKey) && tag.sites.some(key => { const rows = prototypePayload(body.properties.siteKey).data.sites; const alias = rows.find(s => s.key === body.properties.siteKey)?.legacyClientId; return alias && rows.find(s => s.key === key)?.legacyClientId === alias; })) || !['single','multi'].includes(body.properties.template) || !/^(prototype(?::[a-f0-9]{64})?|draft:[a-z0-9-]+|(?:local|postgres):v1:sha256:[a-f0-9]{64})$/.test(body.properties.revision)) fail(400, 'Invalid analytics metadata');
        state.analytics ??= []; state.analytics.push(structuredClone(body)); if (state.analytics.length > 1000) state.analytics.shift(); persist(); return respond(200, { accepted: true });
      }
      requireAdmin();
      const readPaths = ['/builder/catalog', '/builder/drafts', '/builder/status', '/builder/queue', '/library/catalog', '/library/history', '/analytics/events'];
      if (!readPaths.includes(path)) requireEditor();
      if (path.startsWith('/builder/')) return respond(200, await builderRelease({ path, body, state, commit, clock, drafts: state.drafts, quotes, analyticsTags, validatePayload, actor: account().username }));
      if (path === '/library/catalog') {
        strictKeys(body, ['siteKey', 'tables']);
        if (!database || !Array.isArray(body.tables) || !body.tables.length || new Set(body.tables).size !== body.tables.length || body.tables.some(table => typeof table !== 'string' || !libraryTableSet.has(table) || !Array.isArray(database[table]))) fail(400, 'Invalid Library catalog tables');
        if (body.siteKey !== 'all' && !availableSite(body.siteKey)) fail(404, 'Unavailable Library Site');
        const payload = body.siteKey === 'all' ? null : prototypeDraft(body.siteKey)?.payload;
        const data = Object.fromEntries(body.tables.map(table => {
          if (['organizations', 'organizationProfiles', 'clients', 'sites'].includes(table)) {
            const records = new Map((database[table] ?? []).map(r => [r.id, r]));
            for (const draft of Object.values(state.drafts)) for (const row of draft.payload.data[table] ?? []) if (!records.has(row.id) && (row.id.startsWith('build-') || table === 'organizationProfiles' && (draft.payload.data.organizations ?? []).some(o => o.id.startsWith('build-org-') && o.key === row.organizationKey))) records.set(row.id, row);
            if (table === 'clients' && payload) {
              const clientId = payload.data.sites.find(s => s.key === body.siteKey)?.clientId;
              const savedClient = payload.data.clients.find(c => c.id === clientId);
              if (savedClient && records.has(clientId)) records.set(clientId, { ...records.get(clientId), status: savedClient.status });
            }
            return [table, [...records.values()]];
          }
          return [table, payload?.data[table] ?? database[table]];
        }));
        return respond(200, { revision: `library:${sha(JSON.stringify(data))}`, data, analyticsTags: database.analyticsTags ?? analyticsTags });
      }
      if (path === '/rates/import') {
        strictKeys(body, ['filename','base64','title']);
        const extension = typeof body.filename === 'string' ? body.filename.split('.').at(-1).toLowerCase() : '';
        if (!['pdf','png','jpg','jpeg','webp'].includes(extension) || typeof body.base64 !== 'string' || typeof body.title !== 'string' || !body.title.trim()) fail(400, 'Supported rate uploads: PDF, PNG, JPEG or WebP');
        const bytes = Buffer.from(body.base64, 'base64');
        if (!bytes.length || bytes.length > 5 * 1024 * 1024) fail(400, 'Rate upload must be at most 5 MiB');
        const signature = extension === 'pdf' ? bytes.subarray(0,5).toString() === '%PDF-' : extension === 'png' ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : ['jpg','jpeg'].includes(extension) ? bytes[0] === 255 && bytes[1] === 216 : bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP';
        if (!signature) fail(400, 'File content does not match its type');
        const table = await extractRateUpload(bytes, extension, body.title.slice(0,200));
        const id = randomUUID(), kind = extension === 'pdf' ? 'pdf' : 'image';
        const source = { kind, url: `/api/mock/rate-assets/${id}`, label: 'Uploaded source' };
        commit(() => { state.rateAssets ??= {}; state.rateAssets[id] = { base64: body.base64, contentType: kind === 'pdf' ? 'application/pdf' : `image/${extension === 'jpg' ? 'jpeg' : extension}` }; });
        return respond(200, { table: table ? { ...table, sources: [source] } : { version: 1, kind, title: body.title.slice(0,200), url: source.url }, converted: !!table, warning: table ? 'Verify extracted values and source footnotes in preview before saving.' : 'A complete table could not be extracted. Original file retained for reference; no rates were invented.' });
      }
      if (path === '/analytics/events') { strictKeys(body, ['siteKey']); return respond(200, (state.analytics ?? []).filter(e => !body.siteKey || body.siteKey === 'all' || e.properties.siteKey === body.siteKey)); }

      if (path === '/library/save') {
        strictKeys(body, ['id','expectedVersion','payload']);
        const owner = Object.values(state.builderDrafts ?? {}).find(r => r.siteKey === body.payload?.siteKey || r.libraryDraftId === body.id);
        if (owner && owner.ownerId !== account().username) fail(403, 'Only the user who started this Site can edit it');
        const payload = body.payload; if (payload?.formatVersion !== 1 || !/^[a-z][a-z0-9-]{2,79}$/.test(payload.siteKey) || !(siteKeys.includes(payload.siteKey) || payload.data?.sites?.some(s => s.key === payload.siteKey)) || !payload.data || !Array.isArray(payload.data.sites) || !Array.isArray(payload.data.configurationValues)) fail(400, 'Invalid draft');
        if (validatePayload) { try { await validatePayload(payload); } catch (e) { fail(400, `Invalid executable Library: ${e.message}`); } }
        const old = body.id ? state.drafts[body.id] : null;
        if (!body.id && body.expectedVersion !== 0) fail(409, 'New draft version must be zero');
        if (body.id && (!old || old.version !== body.expectedVersion || old.siteKey !== payload.siteKey)) fail(409, 'Draft version conflict');
        const id = old?.id ?? randomUUID(), draft = { id, version: (old?.version ?? 0) + 1, baseReleaseId: old?.baseReleaseId ?? state.heads[payload.siteKey] ?? null, siteKey: payload.siteKey, payloadHash: sha(JSON.stringify(payload)), payload };
        commit(() => { delete state.drafts[id]; state.drafts[id] = draft; state.audit.push({ action: 'save-draft', actor: 'caroline', draftId: id, at: clock() }); }); return respond(200, draft);
      }
      if (path === '/library/publish') {
        strictKeys(body, ['id','expectedVersion','expectedReleaseId']);
        const draft = state.drafts[body.id];
        if (!draft || draft.version !== body.expectedVersion || (state.heads[draft.siteKey] ?? null) !== body.expectedReleaseId || draft.baseReleaseId !== body.expectedReleaseId) fail(409, 'Publication revision conflict');
        const blockers = await checkReadiness?.(structuredClone(draft)) ?? ['Migration, full applicant parity and analytics acceptance are not complete'];
        if (blockers.length) fail(409, `Publication remains gated: ${blockers.join('; ')}`);
        // No await between pointer comparison and commit: all state changes form
        // one synchronous replacement, persisted with an atomic rename.
        if ((state.heads[draft.siteKey] ?? null) !== body.expectedReleaseId || state.drafts[body.id]?.version !== body.expectedVersion) fail(409, 'Publication revision conflict');
        const id = randomUUID(), version = 1 + Math.max(0, ...Object.values(state.releases).filter(r => r.siteKey === draft.siteKey).map(r => r.version));
        const release = { id, version, siteKey: draft.siteKey, payloadHash: draft.payloadHash, payload: structuredClone(draft.payload), mode: 'mock' };
        commit(() => { state.releases[id] = release; state.heads[draft.siteKey] = id; state.audit.push({ action: 'publish', actor: 'caroline', releaseId: id, previousReleaseId: body.expectedReleaseId, at: clock() }); }); return respond(200, release);
      }
      if (path === '/library/rollback') {
        strictKeys(body, ['siteKey','releaseId','expectedReleaseId']);
        const release = state.releases[body.releaseId];
        if (!release || release.siteKey !== body.siteKey || state.heads[body.siteKey] !== body.expectedReleaseId) fail(409, 'Rollback revision conflict');
        const blockers = await checkReadiness?.(structuredClone(release)) ?? ['Acceptance evidence missing'];
        if (blockers.length) fail(409, 'Rollback acceptance evidence missing');
        if (state.heads[body.siteKey] !== body.expectedReleaseId) fail(409, 'Rollback revision conflict');
        commit(() => { state.heads[body.siteKey] = release.id; state.audit.push({ action: 'rollback', actor: 'caroline', releaseId: release.id, previousReleaseId: body.expectedReleaseId, at: clock() }); }); return respond(200, release);
      }
      if (path === '/library/history') { strictKeys(body, ['siteKey']); return respond(200, { releases: Object.values(state.releases).filter(r => r.siteKey === body.siteKey).map(({ payload, ...r }) => r), audit: state.audit }); }
      fail(404, 'Unknown mock endpoint');
    } catch (error) { respond(error.status ?? 500, { error: error.status ? error.message : 'Mock service error', mode: 'mock' }); }
  });
  return server;
}
