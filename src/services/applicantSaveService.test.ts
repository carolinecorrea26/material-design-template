import { afterEach, expect, it, vi } from 'vitest';
import { createApplicantSaveClient, readSavedApplication, recoveryFromSearch } from './applicantSaveService';
import { mockRequest } from '../mock/client';

vi.mock('../mock/client', () => ({ mockRequest: vi.fn() }));
vi.mock('../domain/prototypeLibrary', () => ({ getPrototypeLibrary: () => ({ revision: 'revision-2' }) }));
afterEach(() => { sessionStorage.clear(); vi.unstubAllEnvs(); vi.mocked(mockRequest).mockReset(); });
const saved = { mode: 'mock' as const, applicationId: 'household-1', siteKey: 'asce', recipient: 'member@example.invalid', revision: 'revision-2', expiresAt: Date.now() + 10000, writeCapability: 'write-1', requiresRevalidation: false };

it('serializes initial saves and binds the second write to the first household', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  vi.mocked(mockRequest).mockResolvedValue(saved);
  const client = createApplicantSaveClient(saved.siteKey);
  await Promise.all([client.save({ email: saved.recipient, plan: 'first' }), client.save({ email: saved.recipient, plan: 'second' })]);
  expect(vi.mocked(mockRequest).mock.calls[0][1]).not.toHaveProperty('applicationId');
  expect(vi.mocked(mockRequest).mock.calls[1][1]).toMatchObject({ applicationId: saved.applicationId, writeCapability: saved.writeCapability, values: { plan: 'second' } });
  expect(readSavedApplication('other-site')).toBeNull();
});

it('does not revive a cleared household when an in-flight save completes', async () => {
  vi.stubEnv('VITE_MOCK_PLATFORM_ENABLED', 'true');
  let finish!: (value: typeof saved) => void;
  vi.mocked(mockRequest).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const client = createApplicantSaveClient(saved.siteKey);
  const pending = client.save({ email: saved.recipient });
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  client.cancelPending(); finish(saved);
  expect(await pending).toBeNull();
  expect(readSavedApplication(saved.siteKey)).toBeNull();
});

it('requires an explicit matching Site and every recovery parameter', () => {
  const search = new URLSearchParams({ site: saved.siteKey, applicationId: saved.applicationId, recipient: saved.recipient, recoveryId: 'recovery', token: 'token' });
  expect(recoveryFromSearch(search, saved.siteKey)).not.toBeNull();
  expect(recoveryFromSearch(search, 'other-site')).toBeNull();
  search.delete('token'); expect(recoveryFromSearch(search, saved.siteKey)).toBeNull();
});
