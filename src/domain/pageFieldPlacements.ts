import type { DatabaseSchema } from '../persistence/types';

type Data = Pick<DatabaseSchema, 'pageFields' | 'pageSections' | 'pageSectionFields'>;
/** Inline section fields participate in the page; repeated collection rows have
 * their own validation scope. Direct page placements retain their first position. */
export function pageFieldPlacements(data: Data, pageKey: string) {
  const order = <T extends { position: number; key: string }>(rows: T[]) => [...rows].sort((a, b) => a.position - b.position || a.key.localeCompare(b.key));
  const sections = new Set(data.pageSections.filter(row => row.pageKey === pageKey && !row.definition.collectionName).map(row => row.key));
  return [
    ...order(data.pageFields.filter(row => row.pageKey === pageKey)).map(row => ({ table: 'pageFields' as const, row })),
    ...order(data.pageSectionFields.filter(row => sections.has(row.sectionKey))).map(row => ({ table: 'pageSectionFields' as const, row })),
  ];
}
