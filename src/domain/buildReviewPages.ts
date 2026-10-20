import type { LibraryDraft } from './libraryDraft';
import { getAnalyticsInventory } from '../analytics/inventory';
import { resolvePrototypeLibrary } from './prototypeLibrary';
/** Internal documentation is not part of Site launch review; health pages follow the source catalog's product applicability. */
export function buildReviewPages(draft: LibraryDraft) {
  const source = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision).sourceSiteKey;
  const applicable = new Set(getAnalyticsInventory(source).filter(t => t.kind === 'page').map(t => t.pageId));
  return draft.data.sitePages.filter(p => {
    const page = draft.data.pages.find(d => d.key === p.pageKey)?.definition;
    return p.siteKey === draft.siteKey && p.requirement !== 'none' && page?.type !== 'internal' && (!page?.healthGate || applicable.has(p.pageKey));
  }).sort((a,b) => a.position - b.position);
}
