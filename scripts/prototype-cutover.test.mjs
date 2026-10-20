import { editDraftField, editDraftRates, editDraftBilling } from "../src/domain/libraryDraft.ts";
import { resolveCoverageJourneyPolicy, resolveBilling } from "../src/domain/coverageJourneyPolicy.ts";
import { resolveRatePresentation } from "../src/domain/ratePresentation.ts";
import { validatePrototypeEnvelope } from "../src/domain/prototypeLibrary.ts";
// @vitest-environment node
import { expect, it } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMockPlatform, totp } from './mock-platform.mjs';

it.each(['abe', 'asce'])('%s persists Library page, field, pricing and billing edits through save/reload/restart without catalog edits', async siteKey => {
  const database = JSON.parse(readFileSync('migration-artifacts/mock/database.json', 'utf8'));
  const prototypeDatabase = JSON.parse(readFileSync('migration-artifacts/mock/prototype-data.json', 'utf8'));
  const directory = mkdtempSync(join(tmpdir(), 'prototype-cutover-'));
  const statePath = join(directory, 'state.json');
  let server;
  const start = async () => {
    server = createMockPlatform({ database, prototypeDatabase, statePath });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  };
  let cookie = '';
  const request = async (path, body) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/mock${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Portal-Mock': '1', Cookie: cookie }, body: JSON.stringify(body) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    expect(response.ok).toBe(true);
    return response.json();
  };
  try {
    await start();
    const abe = await request('/prototype/library', { siteKey });
    const ama = await request('/prototype/library', { siteKey: 'ama' });
    const enrollment = await request('/auth/setup', { username: 'caroline', password: 'isolated-cutover-test-password' });
    await request('/auth/verify', { code: totp(enrollment.secret) });
    const installed = validatePrototypeEnvelope(abe, siteKey);
    const policy = resolveCoverageJourneyPolicy(installed.site, 'li-term');
    const frequency = policy.payment.methods.find(m => m.method === 'bill-me').frequencies.includes('monthly') ? 'monthly' : policy.payment.methods.find(m => m.method === 'bill-me').frequencies[0];
    const expectedAmount = resolveBilling({ ...policy, billing: { ...policy.billing, feePerCollection: { ...policy.billing.feePerCollection, 'bill-me': 2 } } }, 'bill-me', frequency, 30).amount;
    const payload = editDraftBilling(editDraftRates(editDraftField(abe.payload, 'eligibility', 'birth-date', { label: 'Persisted cutover DOB' }), { version: 1, praseConfigured: true, quoteToolEnabled: false, coverageQuoteEnabled: true }, 'li-term', null), 'li-term', { ...policy.billing, feePerCollection: { ...policy.billing.feePerCollection, 'bill-me': 2 } });
    payload.data.pages.find(page => page.key === 'eligibility').definition.path = '/saved-eligibility';
    const membership = payload.data.sitePages.find(page => page.siteKey === siteKey && page.pageKey === 'membership');
    const eligibility = payload.data.sitePages.find(page => page.siteKey === siteKey && page.pageKey === 'eligibility');
    [membership.position, eligibility.position] = [eligibility.position, membership.position];
    payload.data.sitePages.find(page => page.siteKey === siteKey && page.pageKey === 'contact').requirement = 'none';
    const assertPages = envelope => {
      const pages = validatePrototypeEnvelope(envelope, siteKey).pages;
      expect(pages.slice(0, 3).map(page => page.key)).toEqual(['home', 'eligibility', 'membership']);
      expect(pages.find(page => page.key === 'eligibility').definition.path).toBe('/saved-eligibility');
      expect(pages.find(page => page.key === 'contact').enabled).toBe(false);
    };
    const saved = await request('/library/save', { expectedVersion: 0, payload });
    const edited = await request('/prototype/library', { siteKey });
    assertPages(edited);
    const catalog = await request('/library/catalog', { siteKey, tables: ['pages', 'sitePages'] });
    expect(catalog.data.pages.find(page => page.key === 'eligibility').definition.path).toBe('/saved-eligibility');
    expect(resolveRatePresentation(validatePrototypeEnvelope(edited, siteKey).site, 'li-term').quoteToolEnabled).toBe(false);
    expect(resolveBilling(resolveCoverageJourneyPolicy(validatePrototypeEnvelope(edited, siteKey).site, 'li-term'), 'bill-me', frequency, 30).amount).toBe(expectedAmount);
    expect(validatePrototypeEnvelope(edited, siteKey).client.fields.eligibility.overrides['birth-date'].label).toBe('Persisted cutover DOB');
    expect((await request('/rates/quote', { siteKey, productKey: 'li-term', amount: 10000, frequency, paymentMethod: 'bill-me' })).premiumCents).toBe(Math.round(expectedAmount * 100));
    expect(edited.revision).not.toBe(abe.revision);
    expect((await request('/prototype/library', { siteKey: 'ama' })).revision).toBe(ama.revision);
    expect(await request('/library/read', { siteKey })).toBeNull();
    await new Promise(resolve => server.close(resolve));
    server = null;
    cookie = '';
    await start();
    const restarted = await request('/prototype/library', { siteKey });
    assertPages(restarted);
    expect(validatePrototypeEnvelope(restarted, siteKey).client.fields.eligibility.overrides['birth-date'].label).toBe('Persisted cutover DOB');
    expect((await request('/rates/quote', { siteKey, productKey: 'li-term', amount: 10000, frequency, paymentMethod: 'bill-me' })).premiumCents).toBe(Math.round(expectedAmount * 100));
    expect(restarted.revision).toBe(edited.revision);
    expect(restarted.draft.id).toBe(saved.id);
    expect(JSON.stringify(database)).not.toContain('Persisted cutover DOB');
    expect(JSON.stringify(prototypeDatabase)).not.toContain('Persisted cutover DOB');
    expect(resolveBilling(resolveCoverageJourneyPolicy(validatePrototypeEnvelope(restarted, siteKey).site, 'li-term'), 'bill-me', frequency, 30).amount).toBe(expectedAmount);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    rmSync(directory, { recursive: true, force: true });
  }
}, 30000);
