import { isLibraryDraft, type LibraryDraft } from './libraryDraft';
import { resolvePageCatalog } from './pageCatalog';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { migrateFieldCollectionData } from '../migration/fieldCollectionDefaults';

// Historical seed positions, frozen to the SQL upgrade contract.
export const legacyPagePositions = [
  ['home', 0, 0], ['membership', 1, 1], ['eligibility', 2, 2], ['coverage', 3, 3],
  ['beneficiary', 4, 4], ['contact', 5, 5], ['profile', 29, 6], ['review', 6, 7],
  ['health-si', 8, 8], ['health-li', 9, 9], ['health-qd', 10, 10], ['health-di', 11, 11],
  ['health-cir', 12, 12], ['payment', 13, 13], ['docusign', 7, 14], ['receipt', 14, 15],
  ['resume', 15, 16], ['resume-method', 16, 17], ['resume-code', 17, 18],
  ['advisor-login', 18, 19], ['advisor-send-confirmation', 19, 20],
  ['application-edit-confirmation', 20, 21], ['mock-email-preview', 21, 22],
  ['site-features', 22, 23], ['site-details', 23, 24], ['design-system', 24, 25],
  ['portal-admin', 25, 26], ['cms', 26, 27], ['portal-template-project', 27, 28],
  ['portal-requirements-project', 28, 29],
] as const;

/** Explicit conversion into a detached draft. Never mutates a source or carries
 * release hashes, transport IDs or acceptance evidence into the new draft. */
export function migratePageCatalogSnapshot(value: unknown) {
  const draft = structuredClone(value) as LibraryDraft;
  if (!draft || draft.formatVersion !== 1 || !draft.data || !Array.isArray(draft.data.pages) || !Array.isArray(draft.data.sitePages)) throw new Error('Expected a version 1 Library snapshot');
  const changes: { table: 'pages' | 'sitePages' | 'fields' | 'configurationDefinitions' | 'configurationValues'; key: string; property: string; before: unknown; after: unknown }[] = [];
  const positions = new Map<string, readonly [number, number]>(legacyPagePositions.map(([key, old, next]) => [key, [old, next]]));
  const pages = new Map(draft.data.pages.map(page => [page.key, page]));
  const missingFlow = (key: string) => {
    const page = pages.get(key);
    return !!page && !Object.hasOwn(page.definition, 'flow');
  };
  const globalCustomized = draft.data.pages.some(page => positions.has(page.key) && page.position !== positions.get(page.key)![0]);
  const customizedSites = new Set(draft.data.sitePages.filter(row => positions.has(row.pageKey) && row.position !== positions.get(row.pageKey)![0]).map(row => row.siteKey));
  // Match the SQL statement ordering: detect customization before changing rows.
  for (const row of draft.data.sitePages) {
    const pair = positions.get(row.pageKey);
    if (pair && row.position === pair[0] && missingFlow(row.pageKey) && !customizedSites.has(row.siteKey) && pair[0] !== pair[1]) {
      changes.push({ table: 'sitePages', key: row.key, property: 'position', before: row.position, after: pair[1] }); row.position = pair[1];
    }
  }
  for (const page of draft.data.pages) {
    const pair = positions.get(page.key);
    if (pair && page.position === pair[0] && missingFlow(page.key) && !globalCustomized && pair[0] !== pair[1]) {
      changes.push({ table: 'pages', key: page.key, property: 'position', before: page.position, after: pair[1] }); page.position = pair[1];
    }
    if (missingFlow(page.key)) {
      const flow = page.definition.type === 'internal' ? 'internal' : page.definition.type === 'resume' ? 'resume'
        : ['advisor-login', 'advisor-send-confirmation', 'application-edit-confirmation'].includes(page.key) ? 'advisor' : 'application';
      changes.push({ table: 'pages', key: page.key, property: 'flow', before: null, after: flow }); page.definition.flow = flow;
    }
  }
  delete draft.mockTransport;
  for (const inserted of migrateFieldCollectionData(draft.data)) {
    const [table, key] = inserted.split(':') as ['fields' | 'configurationDefinitions' | 'configurationValues', string];
    changes.push({ table, key, property: 'insert', before: null, after: draft.data[table].find(row => row.key === key) });
  }
  if (!isLibraryDraft(draft)) throw new Error('Converted snapshot is invalid; inspect routes, flow labels and page order before saving');
  resolvePageCatalog(draft.data);
  for (const siteKey of new Set(draft.data.sitePages.map(row => row.siteKey))) resolvePageCatalog(draft.data, siteKey);
  resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
  return { draft, changes };
}
