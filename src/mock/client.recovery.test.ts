import { afterEach, expect, it, vi } from 'vitest';
import { mockRequest } from './client';

afterEach(() => { vi.restoreAllMocks(); sessionStorage.clear(); });
it.each([401, 419, 440])('reports applicant session expiry for HTTP %s', async status => {
  const expired = vi.fn(); window.addEventListener('application:session-expired', expired);
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Session expired' }, { status }));
  await expect(mockRequest('/applicant/save', {})).rejects.toThrow('Session expired');
  expect(expired).toHaveBeenCalledTimes(1);
  window.removeEventListener('application:session-expired', expired);
});
it('reports server and network failures while retaining specific validation errors', async () => {
  const technical = vi.fn(); window.addEventListener('application:technical-error', technical);
  const fetcher = vi.spyOn(globalThis, 'fetch');
  fetcher.mockResolvedValueOnce(Response.json({ error: 'Unavailable' }, { status: 500 }));
  await expect(mockRequest('/rates/quote', {})).rejects.toThrow('Unavailable');
  fetcher.mockRejectedValueOnce(new TypeError('Network unavailable'));
  await expect(mockRequest('/applicant/save', {})).rejects.toThrow('Network unavailable');
  fetcher.mockResolvedValueOnce(Response.json({ error: 'Amount invalid' }, { status: 400 }));
  await expect(mockRequest('/rates/quote', {})).rejects.toThrow('Amount invalid');
  expect(technical).toHaveBeenCalledTimes(2);
  window.removeEventListener('application:technical-error', technical);
});

it.each([
  ['/payments/authorize', 'payment'], ['/applications/submit', 'submission'],
] as const)('keeps a lost %s response unconfirmed rather than offering a retry', async (path, operation) => {
  const incidents: unknown[] = [];
  const listener = (event: Event) => incidents.push((event as CustomEvent).detail);
  window.addEventListener('application:technical-error', listener);
  try {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    fetcher.mockRejectedValueOnce(new TypeError('Network unavailable'));
    await expect(mockRequest(path, { paymentToken: 'private-token' })).rejects.toThrow('Network unavailable');
    fetcher.mockResolvedValueOnce(Response.json({ error: 'Unavailable' }, { status: 500 }));
    await expect(mockRequest(path, {})).rejects.toThrow('Unavailable');
    expect(incidents).toEqual([
      { code: 'TECHNICAL_ERROR', operation, outcome: 'unknown' },
      { code: 'TECHNICAL_ERROR', operation, outcome: 'unknown' },
    ]);
    expect(JSON.stringify(incidents)).not.toContain('private-token');
    expect(fetcher).toHaveBeenCalledTimes(2);
  } finally { window.removeEventListener('application:technical-error', listener); }
});
