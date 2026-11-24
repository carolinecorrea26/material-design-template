// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplicantSaves } from './applicant-saves.mjs';
import { resumePolicy } from '../src/domain/resumePolicy.mjs';

const defaults = resumePolicy(JSON.parse(readFileSync('requirements/global/configurations/resume.json', 'utf8')));
const directories = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
function setup(policy = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'applicant-saves-')); directories.push(directory);
  const statePath = join(directory, 'applicants.json');
  let now = 1800000000000, revision = 'prototype:first';
  const options = { statePath, clock: () => now, availableSite: site => ['asce', 'ama'].includes(site), revisionFor: () => revision, policyFor: () => ({ ...defaults, ...policy }) };
  let store = createApplicantSaves(options);
  const request = (path, body) => store.request(path, body);
  const messages = saved => request('/applicant/outbox', scope(saved)).messages;
  const link = (saved, extra = {}) => {
    request('/applicant/resume/request', { ...scope(saved), ...extra });
    const url = new URL(messages(saved).filter(message => message.kind === 'link').at(-1).url, 'http://localhost');
    return { ...scope(saved), recoveryId: url.searchParams.get('recoveryId'), token: url.searchParams.get('token') };
  };
  const issue = (details, method = 'text') => {
    const result = request('/applicant/resume/challenge', { ...details, method });
    const proof = { ...scope(details), sessionId: result.sessionId, mfaToken: result.mfaToken };
    return { ...result, proof, code: messages(details).filter(message => message.kind === 'code').at(-1).code };
  };
  return {
    directory, statePath, request, messages, link, issue, now: () => now,
    verify: issued => request('/applicant/resume/verify', { ...issued.proof, code: issued.code }),
    advance: milliseconds => { now += milliseconds; }, revise: () => { revision = 'prototype:second'; }, restart: () => { store = createApplicantSaves(options); },
    save: (extra = {}) => request('/applicant/save', { siteKey: 'asce', recipient: 'member@example.invalid', revision, values: { email: 'member@example.invalid', phone: '2125550123', 'first-name': 'Avery', children: [{ id: 'child-1' }], coverageAmounts: { 'li-term:member': 10000 } }, ...extra }),
  };
}
const scope = saved => ({ applicationId: saved.applicationId, siteKey: saved.siteKey, recipient: saved.recipient });
const wrongCode = (...codes) => Array.from({ length: 100 }, (_, index) => String(index).padStart(6, '0')).find(code => !codes.includes(code));
function failure(action) { try { action(); throw new Error('Expected failure'); } catch (error) { return error; } }

it('restores a household across restart, rotates writes and consumes MFA once', () => {
  const client = setup(), saved = client.save(), link = client.link(saved), issued = client.issue(link);
  client.restart();
  const restored = client.verify(issued);
  expect(restored.values).toMatchObject({ 'first-name': 'Avery', children: [{ id: 'child-1' }] });
  expect(restored.writeCapability).not.toBe(saved.writeCapability);
  expect(failure(() => client.verify(issued)).code).toBe('RESUME_MFA_EXPIRED');
  expect(() => client.save({ ...scope(saved), writeCapability: saved.writeCapability })).toThrow('capability');
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability }).applicationId).toBe(saved.applicationId);
});
it('normalizes historical Site identity without changing applicant answers', () => {
  const client = setup(), saved = client.save();
  const stored = JSON.parse(readFileSync(client.statePath, 'utf8'));
  stored.applications[saved.applicationId].siteKey = 'asce-default';
  writeFileSync(client.statePath, JSON.stringify(stored)); client.restart();
  expect(client.verify(client.issue(client.link(saved))).values['first-name']).toBe('Avery');
});
it('binds link and MFA proof to Site, recipient and application', () => {
  const client = setup(), saved = client.save(), other = client.save();
  for (const patch of [{ siteKey: 'ama' }, { recipient: 'wrong@example.invalid' }, { applicationId: other.applicationId }, { token: 'wrong' }]) {
    expect(failure(() => client.issue({ ...client.link(saved), ...patch })).code).toBe('RESUME_LINK_INVALID');
  }
  const issued = client.issue(client.link(saved));
  for (const patch of [{ siteKey: 'ama' }, { recipient: 'wrong@example.invalid' }, { applicationId: other.applicationId }, { mfaToken: 'wrong' }]) {
    expect(failure(() => client.request('/applicant/resume/verify', { ...issued.proof, ...patch, code: issued.code })).code).toBe('RESUME_MFA_EXPIRED');
  }
});
it('consumes a link only on explicit first code issuance, once', () => {
  const client = setup(), saved = client.save(), link = client.link(saved);
  expect(JSON.parse(readFileSync(client.statePath, 'utf8')).recoveries[link.recoveryId].consumed).toBe(false);
  const issued = client.issue(link);
  expect(failure(() => client.issue(link)).code).toBe('RESUME_LINK_INVALID');
  expect(client.verify(issued).applicationId).toBe(saved.applicationId);
});
it('keeps the 30-minute MFA deadline independent of the consumed 10-minute email link', () => {
  const client = setup(), saved = client.save(), link = client.link(saved);
  client.advance(9 * 60000); const issued = client.issue(link);
  expect(issued.sessionExpiresAt - client.now()).toBe(30 * 60000);
  client.advance(2 * 60000);
  expect(client.verify(issued).applicationId).toBe(saved.applicationId);
});
it('rejects an untouched link exactly at its ten-minute deadline', () => {
  const client = setup(), saved = client.save(), link = client.link(saved);
  client.advance(10 * 60000);
  expect(failure(() => client.issue(link)).code).toBe('RESUME_LINK_INVALID');
});
it('keeps a fixed MFA deadline through resends, Text/Call switches and restart', () => {
  const client = setup(), issued = client.issue(client.link(client.save()));
  client.advance(9 * 60000); client.restart();
  const resent = client.issue(issued.proof, 'phone');
  expect(resent.sessionExpiresAt).toBe(issued.sessionExpiresAt);
  expect(resent.deliveryTarget).toBe('(•••)•••0123');
  client.advance(21 * 60000);
  expect(failure(() => client.verify(resent)).code).toBe('RESUME_MFA_EXPIRED');
});
it('expires codes at ten minutes and caps late code expiry to the MFA deadline', () => {
  const client = setup(), issued = client.issue(client.link(client.save()));
  client.advance(10 * 60000);
  expect(failure(() => client.verify(issued)).code).toBe('RESUME_CODE_EXPIRED');
  client.advance(15 * 60000); const resent = client.issue(issued.proof);
  expect(resent.expiresAt).toBe(issued.sessionExpiresAt);
});
it('accepts only phone delivery methods and rejects a missing saved phone without consuming the link', () => {
  const client = setup(), saved = client.save(), link = client.link(saved);
  expect(() => client.issue(link, 'email')).toThrow('phone delivery');
  expect(client.issue(link, 'phone').method).toBe('phone');
  const missing = client.save({ recipient: 'other@example.invalid', values: { email: 'other@example.invalid' } }), missingLink = client.link(missing);
  expect(() => client.issue(missingLink)).toThrow('Saved phone');
  expect(JSON.parse(readFileSync(client.statePath, 'utf8')).recoveries[missingLink.recoveryId].consumed).toBe(false);
});
it('replaces prior codes without spending attempts for malformed, replaced or expired codes', () => {
  const client = setup(), saved = client.save(), first = client.issue(client.link(saved)), second = client.issue(first.proof);
  expect(failure(() => client.request('/applicant/resume/verify', { ...second.proof, code: '12' })).code).toBe('RESUME_CODE_INVALID');
  if (first.code !== second.code) expect(failure(() => client.verify(first)).code).toBe('RESUME_CODE_REPLACED');
  client.advance(10 * 60000);
  expect(failure(() => client.verify(second)).code).toBe('RESUME_CODE_EXPIRED');
  expect(JSON.parse(readFileSync(client.statePath, 'utf8')).mfaSessions[second.sessionId].attempts).toBe(0);
});
it('preserves attempts across resends and locks immediately on the third incorrect code', () => {
  const client = setup(), issued = client.issue(client.link(client.save()));
  const wrong = wrongCode(issued.code);
  expect(failure(() => client.request('/applicant/resume/verify', { ...issued.proof, code: wrong })).code).toBe('RESUME_CODE_INVALID');
  const resent = client.issue(issued.proof, 'phone');
  const wrongNew = wrongCode(issued.code, resent.code);
  expect(failure(() => client.request('/applicant/resume/verify', { ...resent.proof, code: wrongNew })).code).toBe('RESUME_CODE_INVALID');
  const lock = failure(() => client.request('/applicant/resume/verify', { ...resent.proof, code: wrongNew }));
  expect(lock).toMatchObject({ code: 'RESUME_ATTEMPTS_LOCKED', retryAt: client.now() + 30 * 60000 });
  client.advance(60000); client.restart();
  expect(failure(() => client.verify(resent))).toMatchObject({ code: 'RESUME_ATTEMPTS_LOCKED', retryAt: lock.retryAt });
});
it('does not disclose an application lock publicly or bypass it with a new request', () => {
  const client = setup(), saved = client.save(), issued = client.issue(client.link(saved)), wrong = wrongCode(issued.code);
  for (let i = 0; i < 3; i++) failure(() => client.request('/applicant/resume/verify', { ...issued.proof, code: wrong }));
  const response = client.request('/applicant/resume/request', scope(saved));
  expect(response).toEqual(client.request('/applicant/resume/request', { siteKey: 'asce', applicationId: '', recipient: 'absent@example.invalid' }));
  expect(client.messages(saved)).toHaveLength(0);
  client.advance(30 * 60000);
  expect(failure(() => client.verify(issued)).code).toBe('RESUME_MFA_EXPIRED');
  expect(client.verify(client.issue(client.link(saved))).applicationId).toBe(saved.applicationId);
});
it.each([true, false])('uses the same email budget for matching=%s records and a fixed cooldown', matching => {
  const client = setup(), saved = client.save(), body = matching ? scope(saved) : { siteKey: 'asce', recipient: 'absent@example.invalid', applicationId: '' };
  for (let i = 0; i < 5; i++) expect(client.request('/applicant/resume/request', body)).toEqual({ mode: 'mock', expiresAt: expect.any(Number) });
  const blocked = failure(() => client.request('/applicant/resume/request', body));
  expect(blocked).toMatchObject({ code: 'RESUME_LINK_REQUEST_LIMIT', retryAt: client.now() + 10 * 60000 });
  client.advance(9 * 60000); client.restart();
  expect(failure(() => client.request('/applicant/resume/request', body)).retryAt).toBe(blocked.retryAt);
  client.advance(60000);
  // The old five requests are still within 15 minutes, but cooldown expiry resets this counter.
  expect(() => client.request('/applicant/resume/request', body)).not.toThrow();
});
it('does not reset email budgets on use, replacement, expiry, casing, or a different application ID', () => {
  const client = setup(), saved = client.save(), other = client.save();
  for (let i = 0; i < 5; i++) {
    const details = client.link(i % 2 ? other : saved);
    if (i === 0) client.verify(client.issue(details));
  }
  client.advance(10 * 60000);
  expect(failure(() => client.request('/applicant/resume/request', { ...scope(saved), recipient: ' MEMBER@EXAMPLE.INVALID ' })).code).toBe('RESUME_LINK_REQUEST_LIMIT');
});
it('shares five total code requests across methods, links, sessions, and restart, with fixed cooldown', () => {
  const client = setup(), saved = client.save();
  let issued = client.issue(client.link(saved));
  for (let i = 1; i < 5; i++) issued = i === 2 ? client.issue(client.link(saved), 'phone') : client.issue(issued.proof, i % 2 ? 'phone' : 'text');
  const blocked = failure(() => client.issue(issued.proof));
  expect(blocked).toMatchObject({ code: 'RESUME_CODE_REQUEST_LIMIT', retryAt: client.now() + 30 * 60000 });
  const freshLink = client.link(saved); client.advance(60000); client.restart();
  expect(failure(() => client.issue(freshLink)).retryAt).toBe(blocked.retryAt);
  // Already-issued valid code is not an additional delivery request.
  expect(client.verify(issued).applicationId).toBe(saved.applicationId);
  client.advance(29 * 60000);
  expect(() => client.issue(client.link(saved))).not.toThrow();
});
it('lets a rolling request window elapse normally when no cooldown has been triggered', () => {
  const client = setup(), saved = client.save();
  for (let i = 0; i < 5; i++) client.link(saved);
  client.advance(15 * 60000);
  expect(() => client.link(saved)).not.toThrow();
});
it('keeps original retention through updates, MFA and verification; expires at its deadline', () => {
  const client = setup(), saved = client.save();
  client.advance(86400000);
  const restored = client.verify(client.issue(client.link(saved)));
  expect(restored.expiresAt).toBe(saved.expiresAt);
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability }).expiresAt).toBe(saved.expiresAt);
  client.advance(9 * 86400000);
  expect(() => client.save({ ...scope(restored), writeCapability: restored.writeCapability })).toThrow('unavailable');
  expect(client.request('/applicant/resume/request', scope(saved))).toEqual({ mode: 'mock', expiresAt: expect.any(Number) });
});
it.each(['coverage', 'review'])('clears Library revalidation only at explicit %s completion', validatedPage => {
  const client = setup(), saved = client.save(); client.revise();
  const restored = client.verify(client.issue(client.link(saved)));
  expect(restored.requiresRevalidation).toBe(true);
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability }).requiresRevalidation).toBe(true);
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability, validatedPage }).requiresRevalidation).toBe(false);
  expect(() => client.save({ ...scope(restored), writeCapability: restored.writeCapability, validatedPage: 'payment' })).toThrow('Unsupported revalidation page');
});
it('stores hashed proofs separately from answers and rolls back a failed save', () => {
  const client = setup(), saved = client.save(), link = client.link(saved), issued = client.issue(link);
  const stored = JSON.parse(readFileSync(client.statePath, 'utf8'));
  expect(stored.recoveries[link.recoveryId].tokenHash).not.toBe(link.token);
  expect(stored.mfaSessions[issued.sessionId].tokenHash).not.toBe(issued.mfaToken);
  expect(stored.mfaSessions[issued.sessionId].codeHash).not.toBe(issued.code);
  expect(stored.applications[saved.applicationId].values).not.toHaveProperty('mfaToken');
  const broken = createApplicantSaves({ statePath: join(client.directory, 'blocked', 'save.json'), availableSite: () => true, revisionFor: () => 'prototype:first' });
  writeFileSync(join(client.directory, 'blocked'), 'file');
  expect(() => broken.request('/applicant/save', { siteKey: 'asce', revision: 'prototype:first', recipient: saved.recipient, values: { email: saved.recipient } })).toThrow();
});
it('uses injected global-policy test values and masked targets without authorizing URL flow hints', () => {
  const client = setup({ retentionDays: 2, linkValiditySeconds: 90, mfaValiditySeconds: 180, codeValiditySeconds: 30, codeAttemptLimit: 2, codeIssueLimit: 2, requestLimit: 2 }), saved = client.save();
  const link = client.link(saved, { flow: 'advisor' });
  expect(client.messages(saved)[0].url).not.toContain('flow=advisor');
  const issued = client.issue(link);
  expect(issued.sessionExpiresAt - client.now()).toBe(180000);
  expect(issued.expiresAt - client.now()).toBe(30000);
  expect(saved.expiresAt - client.now()).toBe(2 * 86400000);
  expect(issued.deliveryTarget).toBe('(•••)•••0123');
});

const advisorValues = { email: 'member@example.invalid', phone: '2125550123', 'advisor-email': 'advisor@example.invalid', 'advisor-phone': '3125550987', 'advisor-flow-type': 'new' };
const workflow = (client, saved, event) => client.request('/applicant/workflow', { ...scope(saved), writeCapability: saved.writeCapability, event });
function advisorLink(client, saved, patch = {}) {
  const recipient = advisorValues['advisor-email'];
  const response = client.request('/applicant/resume/request', { applicationId: '', siteKey: saved.siteKey, recipient, advisor: { applicantEmail: saved.recipient, phone: advisorValues['advisor-phone'] }, ...patch });
  const message = client.messages({ ...saved, recipient }).filter(message => message.kind === 'link').at(-1);
  if (!message) return { response };
  const query = new URL(message.url, 'http://localhost').searchParams;
  return { response, details: { ...scope(saved), recipient, recoveryId: query.get('recoveryId'), token: query.get('token') } };
}
it('uses applicant lookup plus matching advisor email AND phone, without exposing mismatches', () => {
  const client = setup(), saved = client.save({ values: advisorValues });
  const missing = advisorLink(client, saved, { recipient: 'unknown@example.invalid' });
  const wrongPhone = advisorLink(client, saved, { advisor: { applicantEmail: saved.recipient, phone: '3125550000' } });
  const wrongLookup = advisorLink(client, saved, { advisor: { applicantEmail: 'missing@example.invalid', phone: advisorValues['advisor-phone'] } });
  expect(client.messages(saved)).toEqual([]);
  const valid = advisorLink(client, saved);
  expect(missing.response).toEqual(valid.response); expect(wrongPhone.response).toEqual(valid.response); expect(wrongLookup.response).toEqual(valid.response);
  const issued = client.issue(valid.details);
  expect(issued.deliveryTarget).toBe('(•••)•••0987');
  expect(client.messages(valid.details).find(message => message.kind === 'code').recipient).toBe(advisorValues['advisor-email']);
  expect(failure(() => client.verify({ ...issued, proof: { ...issued.proof, recipient: saved.recipient } })).code).toBe('RESUME_MFA_EXPIRED');
  expect(client.verify(issued)).toMatchObject({ recoveryActor: 'advisor', advisorFlow: false, resumePage: 'eligibility', recipient: saved.recipient });
});
it('requires advisor handoff, permits verified takeover before signing, and requires resend afterwards', () => {
  const client = setup(), saved = client.save({ values: advisorValues });
  client.request('/applicant/resume/request', scope(saved)); expect(client.messages(saved)).toEqual([]);
  workflow(client, saved, 'send-to-applicant');
  const applicant = client.verify(client.issue(client.link(saved)));
  expect(applicant).toMatchObject({ recoveryActor: 'applicant', advisorFlow: true, resumePage: 'review' });
  const priorApplicant = client.issue(client.link(saved));
  const advisor = client.verify(client.issue(advisorLink(client, saved).details));
  expect(failure(() => client.verify(priorApplicant)).code).toBe('RESUME_MFA_EXPIRED');
  expect(() => client.save({ ...scope(applicant), writeCapability: applicant.writeCapability, values: advisorValues })).toThrow('capability');
  client.request('/applicant/resume/request', scope(saved)); expect(client.messages(saved)).toEqual([]);
  workflow(client, advisor, 'send-to-applicant');
  expect(client.verify(client.issue(client.link(saved))).resumePage).toBe('review');
});
it('returns applicants to unfinished signing, locks out advisors, then stops recovery on submission', () => {
  const client = setup(), saved = client.save({ values: advisorValues });
  workflow(client, saved, 'send-to-applicant');
  const advisorProof = advisorLink(client, saved).details;
  const applicant = client.verify(client.issue(client.link(saved)));
  workflow(client, applicant, 'start-signing');
  expect(advisorLink(client, saved).details).toBeUndefined();
  expect(failure(() => client.issue(advisorProof)).code).toBe('RESUME_LINK_INVALID');
  const resumed = client.verify(client.issue(client.link(saved)));
  expect(resumed).toMatchObject({ resumePage: 'docusign', advisorFlow: true, workflowStage: 'signing' });
  const beforeSubmit = client.issue(client.link(saved));
  workflow(client, resumed, 'complete-signing');
  expect(failure(() => client.verify(beforeSubmit)).code).toBe('RESUME_MFA_EXPIRED');
  const confirmation = client.request('/applicant/resume/request', scope(saved));
  const absent = client.request('/applicant/resume/request', { ...scope(saved), recipient: 'missing@example.invalid' });
  expect(confirmation).toEqual(absent); expect(client.messages(saved)).toEqual([]);
  expect(() => client.save({ ...scope(resumed), writeCapability: resumed.writeCapability, values: advisorValues })).toThrow('submitted');
});
it('applies edit-request handback and revalidates saved advisor identity after link issuance', () => {
  const client = setup(), saved = client.save({ values: advisorValues });
  const proof = advisorLink(client, saved).details;
  client.save({ ...scope(saved), writeCapability: saved.writeCapability, values: { ...advisorValues, 'advisor-phone': '3125550888' } });
  expect(failure(() => client.issue(proof)).code).toBe('RESUME_LINK_INVALID');
  workflow(client, saved, 'send-to-applicant');
  const applicant = client.verify(client.issue(client.link(saved)));
  workflow(client, applicant, 'request-edit');
  client.request('/applicant/resume/request', scope(saved)); expect(client.messages(saved)).toEqual([]);
  const updatedAdvisor = advisorLink(client, saved, { advisor: { applicantEmail: saved.recipient, phone: '3125550888' } });
  expect(client.verify(client.issue(updatedAdvisor.details)).recoveryActor).toBe('advisor');
});
it('shares recovery budgets across advisor/applicant actors and rejects unsupported workflow transitions', () => {
  const client = setup({ codeIssueLimit: 1 }), saved = client.save({ values: advisorValues });
  expect(() => workflow(client, saved, 'complete-signing')).toThrow('transition');
  client.issue(advisorLink(client, saved).details);
  workflow(client, saved, 'send-to-applicant');
  expect(failure(() => client.issue(client.link(saved))).code).toBe('RESUME_CODE_REQUEST_LIMIT');
});

it('keeps an incomplete advisor identity out of consumer recovery and does not authorize inherited event names', () => {
  const client = setup(), saved = client.save({ values: { email: 'member@example.invalid', phone: '2125550123', 'advisor-email': 'advisor@example.invalid', 'advisor-flow-type': 'new' } });
  client.request('/applicant/resume/request', scope(saved));
  expect(client.messages(saved)).toEqual([]);
  expect(advisorLink(client, saved).details).toBeUndefined();
  expect(() => workflow(client, saved, '__proto__')).toThrow('transition');
});
