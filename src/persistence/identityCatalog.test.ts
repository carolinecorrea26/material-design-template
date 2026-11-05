import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateSharedCatalog } from './sharedCatalog';
import type { SharedCatalog } from './sharedCatalog';

const saved = (): SharedCatalog => JSON.parse(readFileSync('public/catalog/portal.json', 'utf8'));

describe('identity authoring files and contracts', () => {

  it.each([
    ['string boolean', (d: SharedCatalog['data']) => { d.siteAssociations[0].enabled = 'true' as never; }, 'enabled'],
    ['string number', (d: SharedCatalog['data']) => { d.associations[0].position = '0' as never; }, 'position'],
    ['fractional order', (d: SharedCatalog['data']) => { d.associations[0].position = 1.5; }, 'position'],
    ['unsafe display ID', (d: SharedCatalog['data']) => { d.clients[0].displayId = Number.MAX_SAFE_INTEGER + 1; }, 'displayId'],
    ['null identity', (d: SharedCatalog['data']) => { d.clients[0].organizationId = null as never; }, 'organizationId'],
    ['date type', (d: SharedCatalog['data']) => { d.clients[0].createdAt = 123 as never; }, 'createdAt'],
    ['invalid enum', (d: SharedCatalog['data']) => { d.associationEntities[0].kind = 'client' as never; }, 'kind'],
    ['nested boolean', (d: SharedCatalog['data']) => { d.organizationProfiles[0].definition.provisional = 'true' as never; }, 'provisional'],
    ['nested address', (d: SharedCatalog['data']) => { d.supportProfiles[0].definition.address = 'address' as never; }, 'address'],
    ['unknown property', (d: SharedCatalog['data']) => { Object.assign(d.clients[0], { tpaId: 'wrong-column' }); }, 'tpaId'],
    ['duplicate key', (d: SharedCatalog['data']) => { d.clients[1].key = d.clients[0].key; }, 'unique identities'],
    ['missing reference', (d: SharedCatalog['data']) => { d.clients[0].organizationId = 'missing'; }, 'existing organizations.id'],
    ['cross-client association', (d: SharedCatalog['data']) => { d.associations.find(a => a.key === d.siteAssociations[0].associationKey)!.clientKey = 'demo'; }, 'owned by the Site client'],
    ['inconsistent scope', (d: SharedCatalog['data']) => { d.supportProfiles[0].scope = 'global'; }, 'consistent global/client/site scope'],
    ['unresolved alias', (d: SharedCatalog['data']) => { d.associationAliases[0].associationId = null; }, 'resolved association'],
  ])('rejects %s at the browser catalog boundary', (_label, mutate, message) => {
    const catalog = saved();
    mutate(catalog.data);
    expect(() => validateSharedCatalog(catalog)).toThrow(message);
  });

  it('keeps source-only identities and nullable metadata without inventing relationships', () => {
    const catalog = saved();
    expect(catalog.data.associationAliases.some(a => a.state === 'source-only' && a.associationId === null)).toBe(true);
    expect(catalog.data.clients[0].providedBy).toBeNull();
    expect(() => validateSharedCatalog(catalog)).not.toThrow();
  });
});
