import type { BrowseColumn } from '../../../components/docs/BrowseTable';
import type { StoredRow } from './storedLibraryModel';

export const humanize = (key: string) => key.replace(/Html$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[._-]/g, ' ').replace(/^./, letter => letter.toUpperCase());
export const libraryEvidenceKeys = new Set(['source', 'sourceReference', 'sourceReferences', 'sourcePath', 'provenance', 'ref', 'authority']);
/** Library owners are functional records or code paths; evidence citations stay internal. */
export function libraryImplementation(reference: string | undefined, fallback: string): string {
  const paths = reference?.match(/(?:src|requirements)\/[A-Za-z0-9_./-]+/g);
  return paths?.length ? [...new Set(paths)].join('; ') : fallback;
}
export function readableValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(readableValue).join('\n') || '—';
  if (typeof value === 'object') return Object.entries(value).filter(([key, item]) => key !== 'id' && !libraryEvidenceKeys.has(key) && item !== null && item !== undefined).map(([key, item]) => `${humanize(key)}: ${readableValue(item)}`).join('\n') || '—';
  return String(value).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim();
}
const hidden = new Set(['id', 'key', 'position', 'displayId', 'providedBy', 'sourceReference', 'definition', 'createdAt', 'updatedAt', 'deletedAt', 'siteKey', 'clientKey', 'scope', 'enabled', 'include', 'status', 'kind', 'categoryKey', 'templateType', 'value', 'rule', 'name', 'label', 'type', 'area']);
const excludedDefinition = new Set(['id', 'name', 'label', 'rule', 'type', 'area', 'metadata', 'ref', 'source', 'sourceReferences']);
/** Promote each business attribute to a searchable column; technical row metadata is omitted. */
export function libraryRecordColumns(rows: StoredRow[], relatedKeys: string[]): BrowseColumn<StoredRow>[] {
  const keys = new Map<string, { label: string; get: (row: StoredRow) => unknown }>();
  for (const row of rows) {
    for (const key of Object.keys(row)) if (!hidden.has(key) && !libraryEvidenceKeys.has(key) && !relatedKeys.includes(key)) keys.set(key, { label: humanize(key), get: row => row[key] });
    const definition = row.definition as Record<string, unknown> | undefined;
    for (const key of Object.keys(definition ?? {})) if (!excludedDefinition.has(key)) keys.set(`definition.${key}`, { label: key === 'ref' ? 'Source' : humanize(key), get: row => (row.definition as Record<string, unknown>)?.[key] });
  }
  return [...keys].map(([id, { label, get }]) => ({ id, label, width: ['Behavior', 'Description', 'Intro', 'Impacted areas'].includes(label) ? 420 : 240, value: row => readableValue(get(row)) }));
}
