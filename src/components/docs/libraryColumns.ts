import type { BrowseColumn } from './BrowseTable';
import { libraryDisplayId, type LibraryMetadata } from '../../domain/provenance';
export function libraryColumns<T>(table: string, columns: BrowseColumn<T>[], rowKey: (row: T) => string, identityPosition: 'first' | 'last' = 'last'): BrowseColumn<T>[] {
  const metadata = (row: T) => row as Partial<LibraryMetadata>;
  const visible = columns.filter(c => !['providedBy', 'path'].includes(c.id) && (c.id === 'displayId' || !/^(?:.*\s)?ID(?:\s*#)?$/i.test(c.label)) && !(c.id === 'source' && ['patterns', 'flagDefinitions', 'productAmountRules', 'productRiders'].includes(table)));
  const identity = visible.find(c => c.id === 'displayId') ?? { id: 'displayId', label: 'ID #', value: (row: T) => String(metadata(row).displayId ?? libraryDisplayId(table, rowKey(row))), width: 160 };
  const attributes = visible.filter(c => c.id !== 'displayId');
  return identityPosition === 'first' ? [identity, ...attributes] : [...attributes, identity];
}
export const libraryTableNames: Record<string, string> = {
  Components: 'components', Pages: 'pages', Fields: 'fields', Features: 'features', Patterns: 'patterns', Flags: 'flagDefinitions',
  'Coverage amounts': 'productAmountRules', 'Product riders': 'productRiders',
  'Page validation': 'validationRules', 'Field validation': 'validationRules',
};
