import { describe, expect, it, vi } from 'vitest';
import { MockOperationsAdapter } from './mockOperationsAdapter';
import { LocalStorageAdapter } from './localAdapter';
import { createSeedDatabase } from './seed';

describe('mock persistence routing', () => {
  it('reads current Association and TPA records from the stored catalog rather than the browser seed', async () => {
    const seed = createSeedDatabase();
    const base = new LocalStorageAdapter(seed);
    const oldRead = vi.spyOn(base, 'list');
    const current = seed.clients.map(row => ({ ...row, name: 'Stored Association', organizationId: 'stored-tpa' }));
    const network = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ data: { clients: current } }));
    try {
      expect(await new MockOperationsAdapter(base).list('clients')).toEqual(current);
      expect(oldRead).not.toHaveBeenCalled();
      expect(network).toHaveBeenCalledWith('/api/mock/library/catalog', expect.objectContaining({ body: JSON.stringify({ siteKey: 'all', tables: ['clients'] }) }));
    } finally { vi.restoreAllMocks(); }
  });

  it('captures TPA and Association snapshots in one catalog request without reading browser copies', async () => {
    const seed = createSeedDatabase();
    const base = new LocalStorageAdapter(seed);
    const oldRead = vi.spyOn(base, 'readSnapshot');
    const rows = { clients: seed.clients.map(row => ({ ...row, name: 'Captured Association' })), organizations: seed.organizations };
    const network = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ data: rows }));
    try {
      const snapshot = await new MockOperationsAdapter(base).readSnapshot!(['clients', 'organizations']);
      expect(snapshot.data).toEqual(rows);
      expect(snapshot.consistency).toBe('single-read');
      expect(snapshot.revision).toMatch(/^local:v1:sha256:/);
      expect(network).toHaveBeenCalledTimes(1);
      expect(oldRead).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); }
  });

  it('propagates unavailable or malformed identity reads and refuses browser-only identity writes', async () => {
    const seed = createSeedDatabase();
    const base = new LocalStorageAdapter(seed);
    const oldRead = vi.spyOn(base, 'list');
    const adapter = new MockOperationsAdapter(base);
    const network = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Catalog unavailable' }, { status: 503 }));
    try {
      await expect(adapter.list('organizations')).rejects.toThrow('Catalog unavailable');
      network.mockResolvedValue(Response.json({ data: {} }));
      await expect(adapter.list('clients')).rejects.toThrow('Missing stored identity table');
      await expect(adapter.readSnapshot!(['clients'])).rejects.toThrow();
      await expect(adapter.update('clients', seed.clients[0].id, { name: 'Browser edit' })).rejects.toThrow('stored Library');
      await expect(adapter.insert('organizations', seed.organizations[0])).rejects.toThrow('stored Library');
      await expect(adapter.remove('associations', seed.associations[0].id)).rejects.toThrow('stored Library');
      expect(oldRead).not.toHaveBeenCalled();
    } finally { vi.restoreAllMocks(); }
  });

  it('keeps applicant table reads and writes in the same durable fallback store', async () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    };
    const seed = createSeedDatabase();
    const adapter = new MockOperationsAdapter(new LocalStorageAdapter(seed, storage));
    const network = vi.spyOn(globalThis, 'fetch');
    try {
      const row = { id: 'asce-person', clientId: seed.clients.find(client => client.key === 'asce')!.id,
        displayName: 'Synthetic member', email: null, status: 'active' as const,
        createdAt: '2026-10-13T12:00:00Z', updatedAt: '2026-10-13T12:00:00Z', deletedAt: null };
      await adapter.insert('applicants', row);
      await adapter.update('applicants', row.id, { displayName: 'Updated member' });
      const reopened = new MockOperationsAdapter(new LocalStorageAdapter(seed, storage));
      expect(await reopened.get('applicants', row.id)).toMatchObject({ displayName: 'Updated member' });
      await reopened.remove('applicants', row.id);
      expect(await adapter.get('applicants', row.id)).toBeNull();
      expect(network).not.toHaveBeenCalled();
    } finally { network.mockRestore(); }
  });
});
