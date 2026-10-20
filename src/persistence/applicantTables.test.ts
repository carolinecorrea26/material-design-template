import { describe, expect, it } from 'vitest';
import { LOCAL_DATABASE_KEY, LocalStorageAdapter, type StorageLike } from './localAdapter';
import { createSeedDatabase } from './seed';
import type { DatabaseSchema } from './types';

describe('applicant table storage compatibility', () => {
  it('opens an older saved database without replacing its application records', async () => {
    const seed = createSeedDatabase();
    const previous: Partial<DatabaseSchema> = structuredClone(seed);
    delete previous.applicants;
    delete previous.applicationApplicants;
    delete previous.applicationAssociations;
    let saved = JSON.stringify(previous);
    const storage: StorageLike = {
      getItem: key => key === LOCAL_DATABASE_KEY ? saved : null,
      setItem: (_, value) => { saved = value; },
      removeItem: () => { saved = ''; },
    };
    const adapter = new LocalStorageAdapter(seed, storage);
    expect(await adapter.list('applications')).toEqual(seed.applications);
    expect(await adapter.list('applicants')).toEqual([]);
    expect(await adapter.list('applicationApplicants')).toEqual([]);
    expect(await adapter.list('applicationAssociations')).toEqual([]);
    await adapter.insert('applicants', {
      id: 'person-1', clientId: seed.clients[0].id, displayName: 'Person', email: null,
      status: 'active', createdAt: '2026-10-12T12:00:00Z', updatedAt: '2026-10-12T12:00:00Z', deletedAt: null,
    });
    const reopened = new LocalStorageAdapter(seed, storage);
    expect(await reopened.get('applicants', 'person-1')).toMatchObject({ displayName: 'Person', email: null });
    expect(await reopened.list('applications')).toEqual(seed.applications);
  });
});
