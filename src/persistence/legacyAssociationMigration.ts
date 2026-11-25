/** Upgrade saved records written before the Association catalog became canonical.
 * Original evidence payloads and legacy inbound URL aliases remain verbatim.
 */
export function upgradeLegacyAssociationData<T>(data: T): T {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const old = data as Record<string, unknown>;
  if (!Array.isArray(old.clients)) return data;
  const { clients, ...upgraded } = old;
  const rename = (row: Record<string, unknown>) => {
    const { clientId, clientKey, ...result } = row;
    if (clientId !== undefined) {
      if (result.hostingAssociationId !== undefined && clientId !== result.hostingAssociationId) throw new Error('Conflicting hosting Association IDs.');
      result.hostingAssociationId = clientId;
    }
    if (clientKey !== undefined) {
      if (result.hostingAssociationKey !== undefined && clientKey !== result.hostingAssociationKey) throw new Error('Conflicting hosting Association keys.');
      result.hostingAssociationKey = clientKey;
    }
    if (result.scope === 'client') result.scope = 'association';
    if (result.scopeType === 'client') result.scopeType = 'association';
    return result;
  };
  for (const [table, rows] of Object.entries(upgraded)) {
    if (Array.isArray(rows)) upgraded[table] = rows.map(row => row && typeof row === 'object' && !Array.isArray(row) ? rename(row) : row);
  }
  const entities = new Map((Array.isArray(upgraded.associationEntities) ? upgraded.associationEntities : []).map(row => [row.id, row]));
  const aliases = new Map((Array.isArray(upgraded.associationAliases) ? upgraded.associationAliases : []).map(row => [row.id, row]));
  for (const row of clients) {
    const existing = entities.get(row.id);
    if (existing && (existing.key !== row.key || existing.organizationId !== row.organizationId)) throw new Error('Conflicting legacy Association ownership.');
    entities.set(row.id, { ...row, kind: 'hosting', deletedAt: null, ...existing, acronym: row.acronym });
    const id = `association-alias.clients.${row.id}`;
    if (!aliases.has(id)) aliases.set(id, { id, sourceTable: 'clients', sourceId: row.id, sourceKey: row.key, associationId: row.id, state: 'resolved', originalRecord: row, createdAt: row.createdAt });
  }
  const profiles = new Map((Array.isArray(upgraded.associations) ? upgraded.associations : []).map(row => [row.key, row]));
  upgraded.associationEntities = [...entities.values()].map(row => ({
    ...row,
    acronym: row.acronym ?? profiles.get(row.key.replace(/^member\./, ''))?.definition.acronym ?? '',
  }));
  upgraded.associationAliases = [...aliases.values()];
  if (Array.isArray(upgraded.organizationProfiles)) {
    upgraded.organizationProfiles = upgraded.organizationProfiles.map(row => {
      const contacts = row.definition.administrationContacts;
      return Array.isArray(contacts) ? { ...row, definition: { ...row.definition, administrationContacts: contacts.map(rename) } } : row;
    });
  }
  return upgraded as T;
}
