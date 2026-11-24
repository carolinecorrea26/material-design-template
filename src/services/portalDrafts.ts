import type { FormTemplate } from '../config/template/resolveTemplate';
import { freshStartSource } from '../domain/freshStartCatalog';
import { resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { prototypeCatalogData, type SharedCatalog } from '../persistence/sharedCatalog';
import { portalRequest } from './portalClient';

export type PortalDraft = { id: string; siteKey: string; baseRevision: string; version: number; formTemplate: FormTemplate | null; updatedAt: string };

export const listPortalDrafts = () => portalRequest<PortalDraft[]>('/drafts', { action: 'list' });
export const openPortalDraft = (id: string) => portalRequest<PortalDraft>('/drafts', { action: 'get', id });
export const createPortalDraft = (siteKey: string, baseRevision: string) => portalRequest<PortalDraft>('/drafts', { action: 'create', siteKey, baseRevision });
export const savePortalDraft = (draft: PortalDraft, formTemplate: PortalDraft['formTemplate']) => portalRequest<PortalDraft>('/drafts', { action: 'save', id: draft.id, expectedVersion: draft.version, formTemplate });

export function resolvePortalDraft(catalog: SharedCatalog & { revision: string }, siteKey: string, draft: PortalDraft) {
  if (draft.siteKey !== siteKey || draft.baseRevision !== catalog.revision) throw new Error('Draft Site or Library revision does not match this preview.');
  const source = freshStartSource();
  if (draft.formTemplate) {
    const pages = source.fields.sitePages?.[siteKey] ?? {};
    const home = pages.home as { configurations?: Record<string, unknown> } | undefined;
    source.fields.sitePages = { ...source.fields.sitePages, [siteKey]: {
      ...pages, home: { ...home, page: 'home', configurations: { ...home?.configurations, 'form-template': draft.formTemplate } },
    } };
  }
  return resolvePrototypeLibrary(prototypeCatalogData(catalog), siteKey, `draft:${draft.id}:${draft.version}`, source);
}
