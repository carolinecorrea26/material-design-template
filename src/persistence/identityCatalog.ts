import type { DatabaseSchema } from './types';

type Check = (value: unknown, path: string) => void;
type Shape = Record<string, Check>;
function invalid(path: string, expected: string): never { throw new Error(`Invalid catalog ${path}: expected ${expected}.`); }
const text: Check = (v, p) => { if (typeof v !== 'string') invalid(p, 'string'); };
const identity: Check = (v, p) => { text(v, p); if (!(v as string).trim()) invalid(p, 'nonempty identity'); };
const boolean: Check = (v, p) => { if (typeof v !== 'boolean') invalid(p, 'boolean'); };
const integer: Check = (v, p) => { if (!Number.isSafeInteger(v) || (v as number) < 0) invalid(p, 'nonnegative safe integer'); };
const timestamp: Check = (v, p) => {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(v) || !Number.isFinite(Date.parse(v))) invalid(p, 'ISO timestamp');
};
const optional = (check: Check): Check => (v, p) => { if (v !== undefined) check(v, p); };
const nullable = (check: Check): Check => (v, p) => { if (v !== null) check(v, p); };
const oneOf = (...values: string[]): Check => (v, p) => { if (!values.includes(v as string)) invalid(p, values.join(' | ')); };
const array = (check: Check): Check => (v, p) => { if (!Array.isArray(v)) invalid(p, 'array'); v.forEach((item, i) => check(item, `${p}[${i}]`)); };
const object = (shape: Shape): Check => (v, p) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) invalid(p, 'object');
  const record = v as Record<string, unknown>;
  for (const key of Object.keys(record)) if (!Object.hasOwn(shape, key)) invalid(`${p}.${key}`, 'a declared schema property');
  for (const [key, check] of Object.entries(shape)) check(record[key], `${p}.${key}`);
};
const json: Check = (v, p) => {
  if (v === null || typeof v === 'string' || typeof v === 'boolean' || typeof v === 'number' && Number.isFinite(v)) return;
  if (Array.isArray(v)) return v.forEach((item, i) => json(item, `${p}[${i}]`));
  if (v && typeof v === 'object') { for (const [key, item] of Object.entries(v)) json(item, `${p}.${key}`); return; }
  invalid(p, 'JSON value');
};
const metadata = { displayId: optional(integer), providedBy: optional(nullable(text)), sourceReference: optional(nullable(text)) };
const keyed = { id: identity, key: identity };
const dated = { createdAt: timestamp, updatedAt: timestamp };
const library = { ...keyed, ...metadata, position: integer };
const status = oneOf('active', 'inactive', 'archived');
const contact = {
  contactName: optional(text), phone: optional(text), phoneDisplay: optional(text), phoneHours: optional(text), email: optional(text), website: optional(text),
  address: optional(object({ organization: optional(text), street: optional(text), city: optional(text), state: optional(text), zip: optional(text) })),
};
const support = object({ ...contact, helpPhone: optional(object({ phone: text, phoneDisplay: text })), salesContact: optional(object(contact)) });
const branding = object({
  name: optional(text), acronym: optional(text), logo: optional(text), logoAlt: optional(text),
  icons: optional(object({ quickDecision: optional(text), categories: optional(object({ LI: optional(text), AD: optional(text), DI: optional(text), OO: optional(text), SH: optional(text) })) })),
});

/** Contracts mirror the identity persistence types. No string/number/boolean coercion.
 * The mapped type makes a new or renamed row property require a contract update.
 * Other catalog domains retain their existing structural/domain validation.
 */
type RowShape<T> = { [K in keyof T]-?: Check };
const contracts = {
  organizations: { ...keyed, ...metadata, ...dated, name: text, type: text, status } satisfies RowShape<DatabaseSchema['organizations'][number]>,
  clients: { ...keyed, ...metadata, ...dated, name: text, acronym: text, organizationId: identity, status } satisfies RowShape<DatabaseSchema['clients'][number]>,
  sites: { ...keyed, ...metadata, ...dated, clientId: identity, name: text, displayName: text, hostingAssociationId: optional(identity), status, environment: text, templateType: oneOf('single', 'multi'), legacyClientId: text, deletedAt: nullable(timestamp) } satisfies RowShape<DatabaseSchema['sites'][number]>,
  organizationProfiles: { ...library, organizationKey: identity, definition: object({ name: text, acronym: optional(text), provisional: optional(boolean), branding: optional(branding), support: optional(support), administrationContacts: optional(array(object({ clientKey: identity, details: text, source: text }))) }) } satisfies RowShape<DatabaseSchema['organizationProfiles'][number]>,
  associations: { ...library, clientKey: identity, definition: object({ name: text, acronym: optional(text), logo: optional(text), logoAlt: optional(text) }) } satisfies RowShape<DatabaseSchema['associations'][number]>,
  siteAssociations: { ...library, siteKey: identity, associationKey: identity, enabled: boolean } satisfies RowShape<DatabaseSchema['siteAssociations'][number]>,
  associationEntities: { ...keyed, ...dated, organizationId: identity, name: text, kind: oneOf('hosting', 'member'), status, deletedAt: nullable(timestamp) } satisfies RowShape<DatabaseSchema['associationEntities'][number]>,
  associationAliases: { id: identity, sourceTable: oneOf('clients', 'associations'), sourceId: identity, sourceKey: identity, associationId: nullable(identity), state: oneOf('resolved', 'source-only'), originalRecord: json, createdAt: timestamp } satisfies RowShape<DatabaseSchema['associationAliases'][number]>,
  associationAffiliations: { id: identity, hostingAssociationId: identity, memberAssociationId: identity, organizationId: identity, createdAt: timestamp } satisfies RowShape<DatabaseSchema['associationAffiliations'][number]>,
  siteAssociationContexts: { id: identity, siteId: identity, associationId: identity, sourceLinkId: nullable(identity), contextMode: oneOf('automatic', 'membership', 'url'), enabled: boolean, createdAt: timestamp } satisfies RowShape<DatabaseSchema['siteAssociationContexts'][number]>,
  supportProfiles: { ...library, scope: oneOf('global', 'client', 'site'), clientKey: nullable(identity), siteKey: nullable(identity), definition: support } satisfies RowShape<DatabaseSchema['supportProfiles'][number]>,
  siteEnvironmentLinks: { ...library, siteKey: identity, environment: oneOf('prototype', 'test', 'pre-production', 'production', 'automation'), linkType: oneOf('launch', 'campaign', 'apply', 'returning', 'reference'), label: text, url: (v, p) => { text(v, p); try { const url = new URL(v as string); if (!['http:', 'https:'].includes(url.protocol)) invalid(p, 'HTTP(S) URL'); } catch { invalid(p, 'HTTP(S) URL'); } }, active: boolean } satisfies RowShape<DatabaseSchema['siteEnvironmentLinks'][number]>,
};
type IdentityTable = keyof typeof contracts;
type IdentityData = Pick<DatabaseSchema, IdentityTable>;

/** Used by both the part-file build and the browser's shared Library/prototype load. */
export function validateIdentityCatalog(value: unknown): asserts value is IdentityData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('data', 'catalog tables');
  const tables = value as Record<string, unknown>;
  for (const [table, shape] of Object.entries(contracts)) {
    array(object(shape))(tables[table], table);
    const rows = tables[table] as Record<string, unknown>[];
    for (const key of ['id', ...(Object.hasOwn(shape, 'key') ? ['key'] : [])]) {
      if (new Set(rows.map(row => row[key])).size !== rows.length) invalid(`${table}.${key}`, 'unique identities');
    }
  }
  const data = value as IdentityData;
  const ref = (table: IdentityTable, column: 'id' | 'key', target: string, path: string) => {
    if (!(data[table] as unknown as Record<string, unknown>[]).some(row => row[column] === target)) invalid(path, `existing ${table}.${column} (${target})`);
  };
  for (const row of data.clients) ref('organizations', 'id', row.organizationId, `clients.${row.key}.organizationId`);
  for (const row of data.organizationProfiles) {
    ref('organizations', 'key', row.organizationKey, `organizationProfiles.${row.key}.organizationKey`);
    for (const contact of row.definition.administrationContacts ?? []) ref('clients', 'key', contact.clientKey, `organizationProfiles.${row.key}.administrationContacts.clientKey`);
  }
  for (const row of data.sites) {
    ref('clients', 'id', row.clientId, `sites.${row.key}.clientId`);
    if (row.hostingAssociationId !== undefined) ref('associationEntities', 'id', row.hostingAssociationId, `sites.${row.key}.hostingAssociationId`);
  }
  for (const row of data.associations) ref('clients', 'key', row.clientKey, `associations.${row.key}.clientKey`);
  for (const row of data.siteAssociations) {
    ref('sites', 'key', row.siteKey, `siteAssociations.${row.key}.siteKey`);
    ref('associations', 'key', row.associationKey, `siteAssociations.${row.key}.associationKey`);
    const site = data.sites.find(site => site.key === row.siteKey)!;
    const client = data.clients.find(client => client.id === site.clientId)!;
    if (data.associations.find(a => a.key === row.associationKey)!.clientKey !== client.key) invalid(`siteAssociations.${row.key}`, 'association owned by the Site client');
  }
  for (const row of data.associationEntities) ref('organizations', 'id', row.organizationId, `associationEntities.${row.key}.organizationId`);
  for (const row of data.associationAliases) {
    ref(row.sourceTable, 'id', row.sourceId, `associationAliases.${row.id}.sourceId`);
    if ((row.state === 'resolved') !== (row.associationId !== null)) invalid(`associationAliases.${row.id}`, 'resolved association or null source-only association');
    if (row.associationId !== null) ref('associationEntities', 'id', row.associationId, `associationAliases.${row.id}.associationId`);
  }
  for (const row of data.associationAffiliations) {
    ref('organizations', 'id', row.organizationId, `associationAffiliations.${row.id}.organizationId`);
    for (const key of ['hostingAssociationId', 'memberAssociationId'] as const) ref('associationEntities', 'id', row[key], `associationAffiliations.${row.id}.${key}`);
  }
  for (const row of data.siteAssociationContexts) {
    ref('sites', 'id', row.siteId, `siteAssociationContexts.${row.id}.siteId`);
    ref('associationEntities', 'id', row.associationId, `siteAssociationContexts.${row.id}.associationId`);
    if (row.sourceLinkId !== null) ref('siteAssociations', 'id', row.sourceLinkId, `siteAssociationContexts.${row.id}.sourceLinkId`);
  }
  for (const row of data.siteEnvironmentLinks) ref('sites', 'key', row.siteKey, `siteEnvironmentLinks.${row.key}.siteKey`);
  for (const row of data.supportProfiles) {
    const validScope = row.scope === 'global' ? row.clientKey === null && row.siteKey === null : row.scope === 'client' ? row.clientKey !== null && row.siteKey === null : row.siteKey !== null;
    if (!validScope) invalid(`supportProfiles.${row.key}`, 'consistent global/client/site scope');
    if (row.clientKey !== null) ref('clients', 'key', row.clientKey, `supportProfiles.${row.key}.clientKey`);
    if (row.siteKey !== null) {
      ref('sites', 'key', row.siteKey, `supportProfiles.${row.key}.siteKey`);
      if (row.clientKey !== null && data.sites.find(site => site.key === row.siteKey)!.clientId !== data.clients.find(client => client.key === row.clientKey)!.id) invalid(`supportProfiles.${row.key}`, 'Site owned by the scoped client');
    }
  }
}
