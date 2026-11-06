import fs from 'node:fs';
import { libraryOwners } from '../src/domain/libraryOwnership.ts';
import { normalizedSnapshotTables } from '../src/persistence/catalogTables.ts';
import { validateIdentityCatalog } from '../src/persistence/identityCatalog.ts';

const directory = 'public/catalog';
export const bundlePath = `${directory}/portal.json`;
const owners = Object.entries(libraryOwners);
const ownerFor = table => table === 'analyticsTags' ? 'analytics' : owners.find(([, tables]) => tables.includes(table))?.[0];
// File boundaries follow entity identity; Library navigation can still group them.
const identityParts = {
  organizations: 'tpas', organizationProfiles: 'tpas',
  clients: 'clients', supportProfiles: 'clients',
  sites: 'sites', siteEnvironmentLinks: 'sites', siteAssociations: 'sites', siteAssociationContexts: 'sites',
  associations: 'associations', associationEntities: 'associations', associationAliases: 'associations', associationAffiliations: 'associations',
};
export const catalogPartPath = table => {
  if (identityParts[table]) return `overview/${identityParts[table]}.json`;
  const owner = ownerFor(table);
  if (!owner) throw new Error(`No Library owner for catalog table: ${table}`);
  if (['products', 'features', 'themes', 'url-parameters'].includes(owner)) return `configurations/${owner}.json`;
  if (owner === 'communications') return 'content/emails.json';
  if (owner === 'validation') return 'validations/validation.json';
  return `${owner}/${owner}.json`;
};

/** Authoring files follow the Library owners. portal.json is an atomic deployment bundle. */
export function writeCatalogParts(catalog) {
  const parts = new Map();
  for (const [table, rows] of Object.entries({ ...catalog.data, analyticsTags: catalog.analyticsTags })) {
    const file = catalogPartPath(table);
    if (!parts.has(file)) parts.set(file, {});
    parts.get(file)[table] = rows;
  }
  for (const [file, data] of parts) {
    fs.mkdirSync(`${directory}/${file.slice(0, file.lastIndexOf('/'))}`, { recursive: true });
    fs.writeFileSync(`${directory}/${file}`, JSON.stringify(data, null, 2) + '\n');
  }
  fs.writeFileSync(`${directory}/manifest.json`, JSON.stringify({ formatVersion: 1, parts: [...parts.keys()].sort() }, null, 2) + '\n');
}

export function readCatalogParts() {
  const manifest = JSON.parse(fs.readFileSync(`${directory}/manifest.json`, 'utf8'));
  if (manifest.formatVersion !== 1 || !Array.isArray(manifest.parts)) throw new Error('Invalid catalog manifest');
  if (new Set(manifest.parts).size !== manifest.parts.length) throw new Error('Duplicate catalog part');
  const data = {};
  for (const file of manifest.parts) {
    if (!/^[a-z-]+\/[a-z-]+\.json$/.test(file)) throw new Error(`Invalid catalog part: ${file}`);
    const part = JSON.parse(fs.readFileSync(`${directory}/${file}`, 'utf8'));
    for (const [table, rows] of Object.entries(part)) {
      if (Object.hasOwn(data, table) || catalogPartPath(table) !== file) throw new Error(`Duplicate or misplaced catalog table: ${table}`);
      data[table] = rows;
    }
  }
  const { analyticsTags, ...tables } = data;
  if (!Array.isArray(analyticsTags)) throw new Error('Missing analytics catalog');
  for (const table of new Set(normalizedSnapshotTables)) if (!Array.isArray(tables[table])) throw new Error(`Missing catalog table: ${table}`);
  const unexpected = Object.keys(tables).find(table => !normalizedSnapshotTables.includes(table));
  if (unexpected) throw new Error(`Unexpected catalog table: ${unexpected}`);
  validateIdentityCatalog(tables);
  return { formatVersion: 1, data: tables, analyticsTags };
}

// Sites the deployment bundle carries. Only ASCE is active while it is being finalized; the
// part files keep every site, so adding a key back here and rebuilding restores it.
export const activeSites = ['asce'];

/** The part files filtered to the active sites: the bundle the prototype, Library and Storybook load. */
export function activeCatalog(catalog = readCatalogParts()) {
  const inactive = catalog.data.sites.filter(site => !activeSites.includes(site.key));
  const keys = new Set(inactive.map(site => site.key)), ids = new Set(inactive.map(site => site.id));
  const data = Object.fromEntries(Object.entries(catalog.data).map(([table, rows]) => [table, table === 'sites'
    ? rows.filter(site => activeSites.includes(site.key))
    : rows.filter(row => !(keys.has(row?.siteKey) || ids.has(row?.siteId)))]));
  validateIdentityCatalog(data);
  return { ...catalog, data, analyticsTags: catalog.analyticsTags.filter(tag => !keys.has(tag?.siteKey)) };
}

export function writeCatalogBundle() {
  const catalog = activeCatalog();
  fs.writeFileSync(bundlePath, JSON.stringify(catalog) + '\n');
  return catalog;
}
