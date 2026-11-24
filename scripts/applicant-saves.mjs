import { resumePolicy } from '../src/domain/resumePolicy.mjs';
import { applicationLifecycle } from '../src/domain/applicationLifecycle.mjs';
import { normalizeSiteReferences } from '../src/domain/siteIdentity.mjs';
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
const policyDefinitions = JSON.parse(readFileSync(new URL('../requirements/global/configurations/resume.json', import.meta.url), 'utf8'));

const digest = value => createHash('sha256').update(value).digest('hex');
const secret = () => randomBytes(32).toString('hex');
const sameSecret = (raw, hash) => typeof raw === 'string' && /^[a-f0-9]{64}$/.test(hash ?? '') && timingSafeEqual(Buffer.from(digest(raw), 'hex'), Buffer.from(hash, 'hex'));
const fail = (status, message, code, retryAt) => { throw Object.assign(new Error(message), { status, ...(code ? { code } : {}), ...(retryAt ? { retryAt } : {}) }); };
const strict = (body, keys) => { if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !keys.includes(key))) fail(400, 'Unexpected applicant-save properties'); };
const email = value => {
  if (typeof value !== 'string' || value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) fail(400, 'Enter a valid recipient email');
  return value.trim().toLowerCase();
};
const record = value => value && typeof value === 'object' && !Array.isArray(value);


/** Separate local applicant store. No Library drafts, administrator credentials,
 * real delivery or production authentication. Outbox credentials are simulation only. */
export function createApplicantSaves({ statePath, clock = Date.now, availableSite, revisionFor, policyFor = () => resumePolicy(policyDefinitions) }) {
  let state = { version: 1, applications: {}, recoveries: {}, mfaSessions: {}, requestBudgets: {}, outbox: [] };
  if (statePath) {
    try { state = normalizeSiteReferences(JSON.parse(readFileSync(statePath, 'utf8'))); if (state.version !== 1) throw new Error('Unsupported applicant store'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  state.mfaSessions ??= {};
  state.requestBudgets ??= {};
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
  const applicationFor = body => {
    if (!availableSite(body.siteKey)) fail(404, 'Unavailable Site');
    const application = state.applications[body.applicationId];
    if (!application || application.siteKey !== body.siteKey || application.expiresAt <= clock()) fail(404, 'Saved application unavailable');
    return application;
  };
  const advisorApplication = application => ['new', 'saved'].includes(application.values['advisor-flow-type']) || !!application.values['advisor-email'] || !!application.values['advisor-phone'];
  const advisorMatches = (application, recipient, phone) => String(application.values['advisor-email'] ?? '').trim().toLowerCase() === recipient && String(application.values['advisor-phone'] ?? '').replace(/\D/g, '') === phone;
  const accessible = (application, actor) => application.workflowStage !== 'submitted' && (actor === 'advisor'
    ? advisorApplication(application) && application.workflowStage !== 'signing'
    : actor === 'applicant' && (!advisorApplication(application) || ['applicant', 'signing'].includes(application.workflowStage)));
  const proofMatches = (application, proof, recipient) => proof.recipient === recipient && accessible(application, proof.actor) &&
    (proof.actor !== 'advisor' || advisorMatches(application, proof.recipient, proof.phone));
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
  const lifecycle = application => applicationLifecycle(application.workflowStage, application.writeActor === 'applicant' && advisorApplication(application));
  const envelope = application => ({ mode: 'mock', applicationId: application.id, siteKey: application.siteKey, recipient: application.recipient, revision: application.revision, expiresAt: application.expiresAt, requiresRevalidation: application.revision !== revisionFor(application.siteKey, application.environment), workflowStage: application.workflowStage, advisorFlow: lifecycle(application).advisorApplicantFlow });
  const activeRecovery = body => {
    let application;
    try { application = applicationFor(body); } catch (error) { if (error.status >= 400 && error.status < 500) fail(400, 'Resume link is invalid, expired or already used', 'RESUME_LINK_INVALID'); throw error; }
    const recovery = state.recoveries[body.recoveryId];
    if (!recovery || recovery.applicationId !== application.id || !proofMatches(application, recovery, email(body.recipient)) || recovery.revoked || recovery.consumed || recovery.expiresAt <= clock() || !sameSecret(body.token, recovery.tokenHash)) fail(400, 'Resume link is invalid, expired or already used', 'RESUME_LINK_INVALID');
    return { application, recovery };
  };
  const revokeMfa = applicationId => {
    for (const session of Object.values(state.mfaSessions)) if (session.applicationId === applicationId) session.revoked = true;
  };
  const locked = application => {
    if (application.recoveryLockedUntil > clock()) fail(429, 'Phone-code attempt limit reached', 'RESUME_ATTEMPTS_LOCKED', application.recoveryLockedUntil);
  };
  const activeMfa = body => {
    let application;
    try { application = applicationFor(body); } catch (error) {
      if (error.status >= 400 && error.status < 500) fail(400, 'MFA session expired', 'RESUME_MFA_EXPIRED');
      throw error;
    }
    const session = state.mfaSessions[body.sessionId];
    if (!session || session.applicationId !== application.id || !proofMatches(application, session, email(body.recipient)) || !sameSecret(body.mfaToken, session.tokenHash)) fail(400, 'MFA session expired', 'RESUME_MFA_EXPIRED');
    locked(application);
    if (session.revoked || session.consumed || session.expiresAt <= clock()) fail(400, 'MFA session expired or already used', 'RESUME_MFA_EXPIRED');
    return { application, session };
  };
  // Count allowed requests. The first excess request starts a fixed cooldown;
  // blocked retries cannot extend it. Expiry resets this budget independently.
  const takeBudget = (budget, limit, windowSeconds, cooldownSeconds) => {
    if (budget.blockedUntil > clock()) return budget.blockedUntil;
    if (budget.blockedUntil) { budget.timestamps = []; budget.blockedUntil = 0; }
    budget.timestamps = (budget.timestamps ?? []).filter(time => clock() - time < windowSeconds * 1000);
    if (budget.timestamps.length >= limit) return (budget.blockedUntil = clock() + cooldownSeconds * 1000);
    budget.timestamps.push(clock());
    return null;
  };
  const issueCode = (application, session, method, mfaToken) => {
    const phone = String(session.actor === 'advisor' ? session.phone : application.values.phone ?? '').replace(/\D/g, '');
    if (phone.length !== 10) fail(400, 'Saved phone is unavailable');
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    if (session.codeHash) (session.previousCodes ??= []).push(session.codeHash);
    session.codeHash = digest(code);
    session.codeExpiresAt = Math.min(clock() + policyFor(application.siteKey, application.environment).codeValiditySeconds * 1000, session.expiresAt, application.expiresAt);
    session.method = method;
    state.outbox.push({ id: randomUUID(), kind: 'code', mode: 'mock', simulation: true, siteKey: application.siteKey, applicationId: application.id, sessionId: session.id, recipient: session.recipient, method, code, expiresAt: session.codeExpiresAt });
    if (state.outbox.length > 100) state.outbox.shift();
    return { mode: 'mock', sessionId: session.id, mfaToken, sessionExpiresAt: session.expiresAt, expiresAt: session.codeExpiresAt, method, ...(session.actor === 'advisor' ? { advisorLookupEmail: application.recipient } : {}), deliveryTarget: `(•••)•••${phone.slice(-4)}` };
  };
  const paths = new Set(['/applicant/save', '/applicant/workflow', '/applicant/resume/request', '/applicant/resume/challenge', '/applicant/resume/verify', '/applicant/outbox']);
  const purge = () => {
    const expired = Object.values(state.applications).filter(application => application.expiresAt <= clock());
    if (!expired.length && !state.outbox.some(message => message.expiresAt <= clock())) return;
    commit(() => {
      for (const application of expired) delete state.applications[application.id];
      for (const recovery of Object.values(state.recoveries)) if (!state.applications[recovery.applicationId] || recovery.expiresAt <= clock()) delete state.recoveries[recovery.id];
      for (const session of Object.values(state.mfaSessions)) if (!state.applications[session.applicationId] || session.expiresAt <= clock()) delete state.mfaSessions[session.id];
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
        if (previous?.workflowStage === 'submitted') fail(409, 'Application already submitted');
        if (previous && (previous.environment !== body.environment || !sameSecret(body.writeCapability, previous.writeHash))) fail(403, 'Application write capability required');
        if (!previous && body.writeCapability !== undefined) fail(400, 'Unexpected application capability');
        const capability = previous ? body.writeCapability : secret();
        return commit(() => {
          const application = previous ?? { id: randomUUID(), siteKey: body.siteKey, recipient, revision: body.revision, environment: body.environment, expiresAt: clock() + policyFor(body.siteKey, body.environment).retentionDays * 86400000, writeHash: digest(capability) };
          application.values = structuredClone(body.values);
          application.workflowStage ??= advisorApplication(application) ? 'preparing' : 'applicant';
          application.writeActor ??= advisorApplication(application) ? 'advisor' : 'applicant';
          if (body.validatedPage) application.revision = body.revision;
          application.updatedAt = clock();
          state.applications[application.id] = application;
          return { ...envelope(application), writeCapability: capability };
        });
      }
      if (path === '/applicant/workflow') {
        strict(body, ['applicationId', 'siteKey', 'recipient', 'writeCapability', 'event']);
        const application = scoped(body);
        if (!sameSecret(body.writeCapability, application.writeHash)) fail(403, 'Application write capability required');
        const transitions = {
          'send-to-applicant': { stage: 'applicant', actor: 'advisor', from: ['preparing', 'revising'], advisorOnly: true },
          'request-edit': { stage: 'revising', actor: 'applicant', from: ['applicant'], advisorOnly: true },
          'start-signing': { stage: 'signing', actor: 'applicant', from: ['applicant', 'signing'] },
          'complete-signing': { stage: 'submitted', actor: 'applicant', from: ['signing'] },
        };
        const transition = typeof body.event === 'string' && Object.hasOwn(transitions, body.event) ? transitions[body.event] : null;
        if (!transition || application.writeActor !== transition.actor || !transition.from.includes(application.workflowStage) || transition.advisorOnly && !advisorApplication(application)) fail(409, 'Unavailable workflow transition');
        return commit(() => {
          application.workflowStage = transition.stage;
          if (['send-to-applicant', 'request-edit'].includes(body.event)) application.writeHash = digest(secret());
          revoke(application.id); revokeMfa(application.id);
          return { mode: 'mock', stage: transition.stage };
        });
      }
      if (path === '/applicant/resume/request') {
        strict(body, ['applicationId', 'siteKey', 'recipient', 'flow', 'advisor']);
        if (body.flow !== undefined && body.flow !== 'advisor') fail(400, 'Invalid recovery context');
        const recipient = email(body.recipient), policy = policyFor(body.siteKey);
        const advisor = body.advisor;
        if (advisor !== undefined) { strict(advisor, ['applicantEmail', 'phone']); if (typeof advisor.phone !== 'string' || !/^\d{10}$/.test(advisor.phone.replace(/\D/g, ''))) fail(400, 'Enter a ten-digit advisor phone'); }
        const lookupRecipient = advisor ? email(advisor.applicantEmail) : recipient;
        const actor = advisor ? 'advisor' : 'applicant';
        const confirmation = { mode: 'mock', expiresAt: clock() + policy.linkValiditySeconds * 1000 };
        const retryAt = commit(() => {
          const budgetKey = digest(JSON.stringify([body.siteKey, recipient]));
          const budget = state.requestBudgets[budgetKey] ??= { timestamps: [], blockedUntil: 0 };
          const blockedUntil = takeBudget(budget, policy.requestLimit, policy.requestWindowSeconds, policy.requestCooldownSeconds);
          if (blockedUntil) return blockedUntil;
          const application = Object.values(state.applications).filter(application => application.siteKey === body.siteKey && application.recipient === lookupRecipient && (!advisor || advisorMatches(application, recipient, advisor.phone.replace(/\D/g, ''))) && application.expiresAt > clock()).sort((a, b) => b.updatedAt - a.updatedAt).find(application => !body.applicationId || application.id === body.applicationId);
          // Nothing in the public response distinguishes a match or recovery lock.
          if (!availableSite(body.siteKey) || !application || !accessible(application, actor) || advisor && !advisorMatches(application, recipient, advisor.phone.replace(/\D/g, '')) || application.recoveryLockedUntil > clock()) return null;
          revoke(application.id);
          const token = secret(), recovery = { id: randomUUID(), applicationId: application.id, tokenHash: digest(token), actor, recipient, ...(advisor ? { phone: advisor.phone.replace(/\D/g, '') } : {}), expiresAt: clock() + policy.linkValiditySeconds * 1000, consumed: false, revoked: false };
          state.recoveries[recovery.id] = recovery;
          const query = new URLSearchParams({ site: application.siteKey, applicationId: application.id, recipient, recoveryId: recovery.id, token, ...(actor === 'applicant' && advisorApplication(application) ? { flow: 'advisor' } : {}), ...(application.environment ? { environment: application.environment } : {}) });
          state.outbox.push({ id: randomUUID(), kind: 'link', mode: 'mock', simulation: true, siteKey: application.siteKey, applicationId: application.id, recoveryId: recovery.id, recipient, url: `/resume-method?${query}`, expiresAt: recovery.expiresAt });
          if (state.outbox.length > 100) state.outbox.shift();
          return null;
        });
        if (retryAt) fail(429, 'Link request limit reached', 'RESUME_LINK_REQUEST_LIMIT', retryAt);
        return confirmation;
      }
      if (path === '/applicant/resume/challenge') {
        const mfa = Object.hasOwn(body ?? {}, 'sessionId');
        strict(body, mfa ? ['applicationId', 'siteKey', 'recipient', 'sessionId', 'mfaToken', 'method'] : ['applicationId', 'siteKey', 'recipient', 'recoveryId', 'token', 'method']);
        if (!['text', 'phone'].includes(body.method)) fail(400, 'Unavailable phone delivery method');
        const context = mfa ? activeMfa(body) : activeRecovery(body);
        const { application } = context;
        locked(application);
        const policy = policyFor(application.siteKey, application.environment);
        const result = commit(() => {
          const budget = application.codeRequestBudget ??= { timestamps: [], blockedUntil: 0 };
          const retryAt = takeBudget(budget, policy.codeIssueLimit, policy.codeIssueWindowSeconds, policy.codeIssueCooldownSeconds);
          if (retryAt) return { retryAt };
          let session = context.session, mfaToken = body.mfaToken;
          if (!mfa) {
            context.recovery.consumed = true;
            revokeMfa(application.id);
            mfaToken = secret();
            session = { id: randomUUID(), applicationId: application.id, tokenHash: digest(mfaToken), actor: context.recovery.actor, recipient: context.recovery.recipient, phone: context.recovery.phone, expiresAt: Math.min(clock() + policy.mfaValiditySeconds * 1000, application.expiresAt), attempts: 0, revoked: false, consumed: false };
            state.mfaSessions[session.id] = session;
          }
          return issueCode(application, session, body.method, mfaToken);
        });
        if (result.retryAt) fail(429, 'Phone-code request limit reached', 'RESUME_CODE_REQUEST_LIMIT', result.retryAt);
        return result;
      }
      if (path === '/applicant/resume/verify') {
        strict(body, ['applicationId', 'siteKey', 'recipient', 'sessionId', 'mfaToken', 'code']);
        const { application, session } = activeMfa(body);
        if (!session.codeHash || session.codeExpiresAt <= clock()) fail(400, 'Verification code expired; request another code', 'RESUME_CODE_EXPIRED');
        if (typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) fail(400, 'Enter a six-digit code', 'RESUME_CODE_INVALID');
        if ((session.previousCodes ?? []).some(hash => sameSecret(body.code, hash)) && !sameSecret(body.code, session.codeHash)) fail(400, 'Verification code replaced', 'RESUME_CODE_REPLACED');
        if (!sameSecret(body.code, session.codeHash)) {
          const retryAt = commit(() => {
            session.attempts += 1;
            if (session.attempts < policyFor(application.siteKey, application.environment).codeAttemptLimit) return null;
            application.recoveryLockedUntil = clock() + policyFor(application.siteKey, application.environment).codeAttemptLockSeconds * 1000;
            revoke(application.id); revokeMfa(application.id);
            return application.recoveryLockedUntil;
          });
          if (retryAt) fail(429, 'Phone-code attempt limit reached', 'RESUME_ATTEMPTS_LOCKED', retryAt);
          fail(400, 'Incorrect verification code', 'RESUME_CODE_INVALID');
        }
        return commit(() => {
          const capability = secret(); application.writeHash = digest(capability); application.writeActor = session.actor;
          if (session.actor === 'advisor') application.workflowStage = 'revising';
          revoke(application.id); revokeMfa(application.id); session.consumed = true;
          return { ...envelope(application), writeCapability: capability, recoveryActor: session.actor, advisorFlow: session.actor === 'applicant' && advisorApplication(application), resumePage: lifecycle(application).resumePage, values: structuredClone(application.values) };
        });
      }
      if (path === '/applicant/outbox') {
        strict(body, ['applicationId', 'siteKey', 'recipient']);
        applicationFor(body);
        // Deliberately visible ONLY in the local simulation. Never a real delivery adapter.
        return { mode: 'mock', simulation: true, messages: state.outbox.filter(message => {
          const proof = message.kind === 'code' ? state.mfaSessions[message.sessionId] : state.recoveries[message.recoveryId];
          return message.applicationId === body.applicationId && message.siteKey === body.siteKey && message.recipient === email(body.recipient) && message.expiresAt > clock() && proof && !proof.revoked && !proof.consumed && (message.kind !== 'code' || sameSecret(message.code, proof.codeHash));
        }) };
      }
      fail(404, 'Unknown applicant-save request');
    },
  };
}
