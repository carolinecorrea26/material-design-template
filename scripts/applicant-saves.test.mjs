// @vitest-environment node
import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplicantSaves } from './applicant-saves.mjs';

const directories = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
function setup() {
  const directory = mkdtempSync(join(tmpdir(), 'applicant-saves-')); directories.push(directory);
  const statePath = join(directory, 'applicants.json');
  let now = 1800000000000, revision = 'prototype:first';
  const options = { statePath, clock: () => now, availableSite: site => ['asce', 'ama'].includes(site), revisionFor: () => revision };
  let store = createApplicantSaves(options);
  return {
    directory, statePath, advance: milliseconds => { now += milliseconds; }, revise: () => { revision = 'prototype:second'; }, restart: () => { store = createApplicantSaves(options); },
    request: (path, body) => store.request(path, body),
    save: (extra = {}) => store.request('/applicant/save', { siteKey: 'asce', recipient: 'member@example.invalid', revision, values: { email: 'member@example.invalid', 'first-name': 'Avery', children: [{ id: 'child-1', birthDate: '2016-01-01' }], coverageAmounts: { 'li-term:member': 10000 }, 'payment-method:li-term': 'bill-me' }, ...extra }),
  };
}
const scope = saved => ({ applicationId: saved.applicationId, siteKey: saved.siteKey, recipient: saved.recipient });
function recovery(client, saved) {
  client.request('/applicant/resume/request', scope(saved));
  const outbox = client.request('/applicant/outbox', scope(saved));
  const url = new URL(outbox.messages.filter(message => message.kind === 'link').at(-1).url, 'http://localhost');
  return { ...scope(saved), recoveryId: url.searchParams.get('recoveryId'), token: url.searchParams.get('token') };
}
function code(client, details) {
  client.request('/applicant/resume/challenge', { ...details, method: 'email' });
  return client.request('/applicant/outbox', detailsForOutbox(details)).messages.filter(message => message.kind === 'code').at(-1).code;
}
const detailsForOutbox = details => ({ applicationId: details.applicationId, siteKey: details.siteKey, recipient: details.recipient });

it('restores a household saved under the earlier main Site name without replacing its values', () => {
  const client = setup(), saved = client.save();
  const previous = JSON.parse(readFileSync(client.statePath, 'utf8'));
  previous.applications[saved.applicationId].siteKey = 'asce-default';
  writeFileSync(client.statePath, JSON.stringify(previous));
  client.restart();
  const details = recovery(client, saved);
  const restored = client.request('/applicant/resume/verify', { ...details, code: code(client, details) });
  expect(restored.applicationId).toBe(saved.applicationId);
  expect(restored.siteKey).toBe('asce');
  expect(restored.values['first-name']).toBe('Avery');
  expect(restored.values.children[0].id).toBe('child-1');
});

it('restores the correct household after restart, rotates writes and consumes recovery once', () => {
  const client = setup(), saved = client.save(), details = recovery(client, saved), challenge = code(client, details);
  client.restart();
  const restored = client.request('/applicant/resume/verify', { ...details, code: challenge });
  expect(restored.values).toMatchObject({ 'first-name': 'Avery', children: [{ id: 'child-1' }], coverageAmounts: { 'li-term:member': 10000 }, 'payment-method:li-term': 'bill-me' });
  expect(restored.writeCapability).not.toBe(saved.writeCapability);
  expect(() => client.request('/applicant/resume/verify', { ...details, code: challenge })).toThrow('already used');
  expect(() => client.save({ ...scope(saved), writeCapability: saved.writeCapability })).toThrow('capability');
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability }).applicationId).toBe(saved.applicationId);
});
it('never matches by recipient alone and isolates Sites, recipients and households', () => {
  const client = setup(), a = client.save(), b = client.save({ values: { email: a.recipient, 'first-name': 'Blair' } });
  expect(a.applicationId).not.toBe(b.applicationId);
  for (const change of [{ siteKey: 'ama' }, { recipient: 'wrong@example.invalid' }, { applicationId: b.applicationId }]) {
    const details = recovery(client, a), challenge = code(client, details);
    expect(() => client.request('/applicant/resume/verify', { ...details, ...change, code: challenge })).toThrow();
  }
  const details = recovery(client, b);
  expect(client.request('/applicant/resume/verify', { ...details, code: code(client, details) }).values['first-name']).toBe('Blair');
  expect(() => client.request('/applicant/save', { ...scope(a), writeCapability: a.writeCapability, revision: 'prototype:first', values: { email: 'wrong@example.invalid' } })).toThrow('recipient');
});
it('revokes previous links and challenges, rejects wrong codes and enforces attempt limits', () => {
  const client = setup(), saved = client.save(), old = recovery(client, saved);
  const oldCode = code(client, old), current = recovery(client, saved);
  expect(() => client.request('/applicant/resume/verify', { ...old, code: oldCode })).toThrow();
  const firstCode = code(client, current), secondCode = code(client, current);
  if (firstCode !== secondCode) expect(() => client.request('/applicant/resume/verify', { ...current, code: firstCode })).toThrow('Incorrect');
  const wrong = secondCode === '000000' ? '000001' : '000000';
  for (let attempt = firstCode !== secondCode ? 1 : 0; attempt < 5; attempt++) expect(() => client.request('/applicant/resume/verify', { ...current, code: wrong })).toThrow('Incorrect');
  expect(() => client.request('/applicant/resume/verify', { ...current, code: secondCode })).toThrow('Too many');
  expect(() => client.request('/applicant/resume/challenge', { ...current, method: 'email' })).toThrow('new resume link');
});
it('enforces independent code, link and application expiry', () => {
  const client = setup(), saved = client.save(), details = recovery(client, saved), challenge = code(client, details);
  client.advance(5 * 60000);
  expect(() => client.request('/applicant/resume/verify', { ...details, code: challenge })).toThrow('code expired');
  const renewed = code(client, details); client.advance(5 * 60000);
  expect(() => client.request('/applicant/resume/verify', { ...details, code: renewed })).toThrow('link is invalid');
  client.advance(10 * 24 * 60 * 60000);
  expect(() => client.request('/applicant/resume/request', scope(saved))).toThrow('unavailable');
});
it('requires explicit Coverage/Review revalidation when the Library revision changes', () => {
  const client = setup(), saved = client.save(); client.revise();
  const details = recovery(client, saved);
  const restored = client.request('/applicant/resume/verify', { ...details, code: code(client, details) });
  expect(restored.requiresRevalidation).toBe(true);
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability }).requiresRevalidation).toBe(true);
  expect(client.save({ ...scope(restored), writeCapability: restored.writeCapability, validatedPage: 'coverage' }).requiresRevalidation).toBe(false);
});

it.each(['coverage', 'review'])('only an explicit current %s completion clears revalidation and persists it across restart', validatedPage => {
  const client = setup(), saved = client.save(); client.revise();
  const update = { ...scope(saved), writeCapability: saved.writeCapability };
  expect(client.save(update).requiresRevalidation).toBe(true);
  expect(() => client.save({ ...update, validatedPage: 'payment' })).toThrow('Unsupported revalidation page');
  expect(client.save({ ...update, validatedPage }).requiresRevalidation).toBe(false);
  client.restart();
  expect(client.save(update).requiresRevalidation).toBe(false);
});
it('stores hashed capabilities/challenges and rolls back failed storage writes', () => {
  const client = setup(), saved = client.save(), details = recovery(client, saved), challenge = code(client, details);
  const stored = JSON.parse(readFileSync(client.statePath, 'utf8'));
  expect(stored.applications[saved.applicationId].writeHash).not.toBe(saved.writeCapability);
  expect(stored.recoveries[details.recoveryId].tokenHash).not.toBe(details.token);
  expect(stored.recoveries[details.recoveryId].codeHash).not.toBe(challenge);
  // Simulation outbox intentionally retains delivery content, separate from verification hashes.
  const broken = createApplicantSaves({ statePath: join(client.directory, 'blocked', 'save.json'), availableSite: () => true, revisionFor: () => 'prototype:first' });
  writeFileSync(join(client.directory, 'blocked'), 'file');
  expect(() => broken.request('/applicant/save', { siteKey: 'asce', revision: 'prototype:first', recipient: saved.recipient, values: { email: saved.recipient } })).toThrow();
});

it('requests recovery by email without exposing an application-reference input', () => {
  const client = setup();
  const saved = client.save();
  const requested = client.request('/applicant/resume/request', { applicationId: '', siteKey: saved.siteKey, recipient: saved.recipient });
  expect(requested.applicationId).toBe(saved.applicationId);
  expect(client.request('/applicant/outbox', scope(saved)).messages.at(-1).kind).toBe('link');
  expect(() => client.request('/applicant/resume/request', { applicationId: '', siteKey: 'ama', recipient: saved.recipient })).toThrow('unavailable');
});

it('enforces the five-challenge limit across restart without invalidating the fifth issued code', () => {
  const client = setup(), saved = client.save(), details = recovery(client, saved);
  let last;
  for (let issued = 0; issued < 5; issued++) last = code(client, details);
  client.restart();
  expect(() => code(client, details)).toThrow('new resume link');
  expect(client.request('/applicant/resume/verify', { ...details, code: last }).applicationId).toBe(saved.applicationId);
});

it('enforces five resume requests per rolling minute independently for each saved application', () => {
  const client = setup(), saved = client.save(), other = client.save();
  for (let requested = 0; requested < 5; requested++) recovery(client, saved);
  client.restart(); client.advance(59999);
  expect(() => recovery(client, saved)).toThrow('Too many resume requests');
  expect(() => recovery(client, other)).not.toThrow();
  client.advance(1);
  expect(() => recovery(client, saved)).not.toThrow();
});

it('keeps the original ten-day retention deadline through updates and rejects writes at expiry', () => {
  const client = setup(), saved = client.save();
  client.advance(10 * 24 * 60 * 60000 - 1);
  const updated = client.save({ ...scope(saved), writeCapability: saved.writeCapability });
  expect(updated.expiresAt).toBe(saved.expiresAt);
  client.advance(1); client.restart();
  expect(() => client.save({ ...scope(saved), writeCapability: saved.writeCapability })).toThrow('unavailable');
  expect(() => recovery(client, saved)).toThrow('unavailable');
});

it('normalizes recipients, isolates write environments and expires codes at the exact deadline', () => {
  const client = setup(), saved = client.save({ recipient: ' MEMBER@EXAMPLE.INVALID ', environment: 'preview' });
  expect(saved.recipient).toBe('member@example.invalid');
  expect(() => client.save({ ...scope(saved), writeCapability: saved.writeCapability, environment: 'production' })).toThrow('capability');
  const details = recovery(client, saved), challenge = code(client, details);
  client.advance(5 * 60000 - 1); client.restart();
  expect(client.request('/applicant/resume/verify', { ...details, code: challenge }).applicationId).toBe(saved.applicationId);
  const next = recovery(client, saved), expired = code(client, next);
  client.advance(5 * 60000);
  expect(() => client.request('/applicant/resume/verify', { ...next, code: expired })).toThrow('code expired');
});
