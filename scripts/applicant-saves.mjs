import { normalizeSiteReferences } from '../src/domain/siteIdentity.mjs';
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const digest = value => createHash('sha256').update(value).digest('hex');
const secret = () => randomBytes(32).toString('hex');
const sameSecret = (raw, hash) => typeof raw === 'string' && /^[a-f0-9]{64}$/.test(hash ?? '') && timingSafeEqual(Buffer.from(digest(raw), 'hex'), Buffer.from(hash, 'hex'));
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const strict = (body, keys) => { if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !keys.includes(key))) fail(400, 'Unexpected applicant-save properties'); };
const email = value => {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) fail(400, 'Enter a valid recipient email');
  return value.trim().toLowerCase();
};
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const lifetime = 10 * 24 * 60 * 60 * 1000;

/** Separate local applicant store. No Library drafts, administrator credentials,
 * real delivery or production authentication. Outbox credentials are simulation only. */
export function createApplicantSaves({ statePath, clock = Date.now, availableSite, revisionFor }) {
  let state = { version: 1, applications: {}, recoveries: {}, outbox: [] };
  if (statePath) {
    try { state = normalizeSiteReferences(JSON.parse(readFileSync(statePath, 'utf8'))); if (state.version !== 1) throw new Error('Unsupported applicant store'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const commit = change => {
    const previous = structuredClone(state);
    try {
      const result = change();
      if (statePath) {
        mkdirSync(dirname(statePath), { recursive: true, mode: 0o700 });
        const temporary = `${statePath}.tmp`;
        writeFileSync(temporary, JSON.stringify(state), { mode: 0o600 });
        renameSync(temporary, statePath);
      }
      return result;
    } catch (error) { state = previous; throw error; }
  };
  const scoped = body => {
    if (!availableSite(body.siteKey)) fail(404, 'Unavailable Site');
    const recipient = email(body.recipient);
    const application = state.applications[body.applicationId];
    if (!application || application.siteKey !== body.siteKey || application.recipient !== recipient || application.expiresAt <= clock()) fail(404, 'Saved application unavailable for this Site and recipient');
    return application;
  };
  const revoke = applicationId => {
    for (const recovery of Object.values(state.recoveries)) if (recovery.applicationId === applicationId) recovery.revoked = true;
  };
  const envelope = application => ({ mode: 'mock', applicationId: application.id, siteKey: application.siteKey, recipient: application.recipient, revision: application.revision, expiresAt: application.expiresAt, requiresRevalidation: application.revision !== revisionFor(application.siteKey, application.environment) });
  const activeRecovery = body => {
    const application = scoped(body), recovery = state.recoveries[body.recoveryId];
    if (!recovery || recovery.applicationId !== application.id || recovery.revoked || recovery.consumed || recovery.expiresAt <= clock() || !sameSecret(body.token, recovery.tokenHash)) fail(400, 'Resume link is invalid, expired or already used');
    return { application, recovery };
  };
  const challenge = (application, recovery, method) => {
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    recovery.codeHash = digest(code); recovery.codeExpiresAt = clock() + 5 * 60000; recovery.attempts = 0;
    state.outbox.push({ id: randomUUID(), kind: 'code', mode: 'mock', simulation: true, siteKey: application.siteKey, applicationId: application.id, recoveryId: recovery.id, recipient: application.recipient, method, code, expiresAt: recovery.codeExpiresAt });
    if (state.outbox.length > 100) state.outbox.shift();
    const phone = String(application.values.phone ?? application.values['phone-number'] ?? '').replace(/\D/g, '');
    const deliveryTarget = method === 'email' ? application.recipient : phone.length >= 4 ? `(•••)•••${phone.slice(-4)}` : undefined;
    return { mode: 'mock', recoveryId: recovery.id, expiresAt: recovery.codeExpiresAt, recipient: application.recipient, method, deliveryTarget };
  };
  const paths = new Set(['/applicant/save', '/applicant/resume/request', '/applicant/resume/challenge', '/applicant/resume/verify', '/applicant/outbox']);
  const purge = () => {
    const expired = Object.values(state.applications).filter(application => application.expiresAt <= clock());
    if (!expired.length && !state.outbox.some(message => message.expiresAt <= clock())) return;
    commit(() => {
      for (const application of expired) delete state.applications[application.id];
      for (const recovery of Object.values(state.recoveries)) if (!state.applications[recovery.applicationId] || recovery.expiresAt <= clock()) delete state.recoveries[recovery.id];
      state.outbox = state.outbox.filter(message => state.applications[message.applicationId] && message.expiresAt > clock());
    });
  };
  return {
    handles: path => paths.has(path),
    request(path, body) {
      purge();
      if (path === '/applicant/save') {
        strict(body, ['applicationId', 'writeCapability', 'siteKey', 'recipient', 'revision', 'values', 'validatedPage', 'environment']);
        const recipient = email(body.recipient);
        if (!availableSite(body.siteKey) || body.revision !== revisionFor(body.siteKey, body.environment)) fail(409, 'Library changed; reload before saving');
        if (!record(body.values) || JSON.stringify(body.values).length > 1024 * 1024 || email(body.values.email) !== recipient) fail(400, 'Application recipient must match the saved values');
        if (body.validatedPage !== undefined && !['coverage', 'review'].includes(body.validatedPage)) fail(400, 'Unsupported revalidation page');
        const previous = body.applicationId ? scoped(body) : null;
        if (previous && (previous.environment !== body.environment || !sameSecret(body.writeCapability, previous.writeHash))) fail(403, 'Application write capability required');
        if (!previous && body.writeCapability !== undefined) fail(400, 'Unexpected application capability');
        const capability = previous ? body.writeCapability : secret();
        return commit(() => {
          const application = previous ?? { id: randomUUID(), siteKey: body.siteKey, recipient, revision: body.revision, environment: body.environment, expiresAt: clock() + lifetime, writeHash: digest(capability) };
          application.values = structuredClone(body.values);
          if (body.validatedPage) application.revision = body.revision;
          application.updatedAt = clock();
          state.applications[application.id] = application;
          return { ...envelope(application), writeCapability: capability };
        });
      }
      if (path === '/applicant/resume/request') {
        strict(body, ['applicationId', 'siteKey', 'recipient']);
        const recipient = email(body.recipient);
        const matching = Object.values(state.applications).filter(application => application.siteKey === body.siteKey && application.recipient === recipient && application.expiresAt > clock()).sort((a, b) => b.updatedAt - a.updatedAt);
        const application = scoped({ ...body, applicationId: body.applicationId || matching[0]?.id });
        const recent = (application.resumeRequests ?? []).filter(time => clock() - time < 60000);
        if (recent.length >= 5) fail(429, 'Too many resume requests. Retry in one minute.');
        return commit(() => {
          application.resumeRequests = [...recent, clock()];
          revoke(application.id);
          const token = secret(), recovery = { id: randomUUID(), applicationId: application.id, tokenHash: digest(token), expiresAt: clock() + 10 * 60000, consumed: false, revoked: false };
          state.recoveries[recovery.id] = recovery;
          const query = new URLSearchParams({ site: application.siteKey, applicationId: application.id, recipient: application.recipient, recoveryId: recovery.id, token, ...(application.environment ? { environment: application.environment } : {}) });
          state.outbox.push({ id: randomUUID(), kind: 'link', mode: 'mock', simulation: true, siteKey: application.siteKey, applicationId: application.id, recoveryId: recovery.id, recipient: application.recipient, url: `/resume-method?${query}`, expiresAt: recovery.expiresAt });
          if (state.outbox.length > 100) state.outbox.shift();
          return { mode: 'mock', sent: true, applicationId: application.id, expiresAt: recovery.expiresAt };
        });
      }
      if (path === '/applicant/resume/challenge') {
        strict(body, ['applicationId', 'siteKey', 'recipient', 'recoveryId', 'token', 'method']);
        const { application, recovery } = activeRecovery(body);
        if (!['email', 'text', 'phone'].includes(body.method)) fail(400, 'Unavailable simulated delivery method');
        if (recovery.attempts >= 5 || recovery.challengeCount >= 5) fail(429, 'Request a new resume link');
        return commit(() => { recovery.challengeCount = (recovery.challengeCount ?? 0) + 1; return challenge(application, recovery, body.method); });
      }
      if (path === '/applicant/resume/verify') {
        strict(body, ['applicationId', 'siteKey', 'recipient', 'recoveryId', 'token', 'code']);
        const { application, recovery } = activeRecovery(body);
        if (!recovery.codeHash || recovery.codeExpiresAt <= clock()) fail(400, 'Verification code expired; request another code');
        if (recovery.attempts >= 5) fail(429, 'Too many code attempts; request a new link');
        if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code) || !sameSecret(body.code, recovery.codeHash)) {
          commit(() => { recovery.attempts += 1; });
          fail(400, 'Incorrect verification code');
        }
        return commit(() => {
          const capability = secret(); application.writeHash = digest(capability); revoke(application.id); recovery.consumed = true;
          return { ...envelope(application), writeCapability: capability, values: structuredClone(application.values) };
        });
      }
      if (path === '/applicant/outbox') {
        strict(body, ['applicationId', 'siteKey', 'recipient']);
        scoped(body);
        // Deliberately visible ONLY in the local simulation. Never a real delivery adapter.
        return { mode: 'mock', simulation: true, messages: state.outbox.filter(message => {
          const recovery = state.recoveries[message.recoveryId];
          return message.applicationId === body.applicationId && message.siteKey === body.siteKey && message.recipient === email(body.recipient) && message.expiresAt > clock() && recovery && !recovery.revoked && !recovery.consumed && (message.kind !== 'code' || sameSecret(message.code, recovery.codeHash));
        }) };
      }
      fail(404, 'Unknown applicant-save request');
    },
  };
}
