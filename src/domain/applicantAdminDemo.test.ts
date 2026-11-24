import { afterEach, expect, it, vi } from 'vitest';
import { applicantAdminExamples, readApplicantAdminAnswers, saveApplicantAdminAnswers } from './applicantAdminDemo';
import { mockRequest } from '../mock/client';
import { resumeSessionStorageKey } from '../services/applicantSaveService';
afterEach(() => { vi.unstubAllGlobals(); window.history.replaceState({}, '', '/'); });
it('locks changes before approval and persists only the approved fictional record', () => {
  const storage = new Map<string, string>();
  vi.stubGlobal('sessionStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
  expect(() => saveApplicantAdminAnswers(applicantAdminExamples[1].id, {})).toThrow('only after approval');
  const id = applicantAdminExamples[2].id;
  saveApplicantAdminAnswers(id, { membership: 'yes' });
  expect(readApplicantAdminAnswers(id)).toEqual({ membership: 'yes' });
  expect([...storage.keys()]).toEqual([`applicant-admin-demo:${id}`]);
});
it('isolates preview MFA proofs and prevents application-service writes', async () => {
  const normal = resumeSessionStorageKey('asce');
  window.history.replaceState({}, '', '/admin-center/tutorial-preview/page');
  expect(resumeSessionStorageKey('asce')).not.toBe(normal);
  const network = vi.fn(); vi.stubGlobal('fetch', network);
  await expect(mockRequest('/applications/submit', {})).rejects.toThrow('preview');
  await expect(mockRequest('/applicant/save', {})).rejects.toThrow('preview');
  expect(network).not.toHaveBeenCalled();
});
