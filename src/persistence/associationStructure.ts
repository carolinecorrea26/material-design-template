import type { DatabaseSchema, AssociationEntity, AssociationAlias, AssociationAffiliation, SiteAssociationContext, Json } from './types';

/** Deterministic compatibility projection. It never merges by a display name. */
export function synchronizeAssociationStructure(db: DatabaseSchema): DatabaseSchema {
  const entities: AssociationEntity[] = db.clients.map(row => ({
    id: row.id, key: row.key, organizationId: row.organizationId, name: row.name,
    kind: 'hosting', status: row.status, createdAt: row.createdAt, updatedAt: row.updatedAt, deletedAt: null,
  }));
  const aliases: AssociationAlias[] = db.clients.map(row => ({
    id: `association-alias.clients.${row.id}`, sourceTable: 'clients', sourceId: row.id, sourceKey: row.key,
    associationId: row.id, state: 'resolved', originalRecord: JSON.parse(JSON.stringify(row)) as Json, createdAt: row.createdAt,
  }));
  const affiliations: AssociationAffiliation[] = [];
  const contexts: SiteAssociationContext[] = [];
  for (const row of db.associations) {
    const owner = db.clients.find(client => client.key === row.clientKey);
    if (!owner) throw new Error(`Association ${row.key} has an unknown hosting identity.`);
    const ownedSites = db.sites.filter(site => site.clientId === owner.id);
    const policies = ownedSites.map(site => db.sitePolicies.find(policy => policy.siteKey === site.key)?.definition.associationSelection);
    const fixed = new Set(policies.filter(policy => policy?.mode === 'fixed').map(policy => policy?.fixedAssociationId));
    const multi = policies.some(policy => policy?.mode === 'select' || policy?.mode === 'url-parameter');
    let associationId: string | null = null;
    if (!multi && fixed.size === 1 && fixed.has(row.key)) associationId = owner.id;
    else if (db.siteAssociations.some(link => link.associationKey === row.key && db.sitePolicies.find(policy => policy.siteKey === link.siteKey)?.definition.associationSelection)) {
      associationId = `association-member.${row.key}`;
      entities.push({ id: associationId, key: `member.${row.key}`, organizationId: owner.organizationId, name: row.definition.name,
        kind: 'member', status: 'active', createdAt: owner.createdAt, updatedAt: owner.updatedAt, deletedAt: null });
      affiliations.push({ id: `association-affiliation.${owner.id}.${row.key}`, hostingAssociationId: owner.id, memberAssociationId: associationId, organizationId: owner.organizationId, createdAt: owner.createdAt });
    }
    aliases.push({ id: `association-alias.associations.${row.id}`, sourceTable: 'associations', sourceId: row.id, sourceKey: row.key,
      associationId, state: associationId === null ? 'source-only' : 'resolved', originalRecord: JSON.parse(JSON.stringify(row)) as Json, createdAt: owner.createdAt });
  }
  for (const row of db.siteAssociations) {
    const site = db.sites.find(site => site.key === row.siteKey);
    const policy = db.sitePolicies.find(policy => policy.siteKey === row.siteKey)?.definition.associationSelection;
    const alias = aliases.find(alias => alias.sourceTable === 'associations' && alias.sourceKey === row.associationKey);
    if (!site || !policy || !alias?.associationId) continue;
    contexts.push({ id: `association-context.${row.id}`, siteId: site.id, associationId: alias.associationId,
      sourceLinkId: row.id, contextMode: policy.mode === 'fixed' ? 'automatic' : policy.mode === 'select' ? 'membership' : 'url', enabled: row.enabled, createdAt: site.createdAt });
  }
  for (const site of db.sites) if (!db.sitePolicies.find(policy => policy.siteKey === site.key)?.definition.associationSelection) {
    contexts.push({ id: `association-context.${site.id}.automatic`, siteId: site.id, associationId: site.clientId,
      sourceLinkId: null, contextMode: 'automatic', enabled: true, createdAt: site.createdAt });
  }
  db.associationEntities = entities; db.associationAliases = aliases;
  db.associationAffiliations = affiliations; db.siteAssociationContexts = contexts;
  for (const site of db.sites) site.hostingAssociationId = site.clientId;
  return db;
}
