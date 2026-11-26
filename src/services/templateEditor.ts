import { portalRequest } from './portalClient';
import type { TemplateEdit, TemplateImpact, TemplatePropertyId } from '../domain/templateEdits.mjs';

export type TemplateDraft = {
  id: string;
  baseRevision: string;
  version: number;
  status: 'draft' | 'discarded' | 'queued' | 'publishing' | 'failed' | 'published';
  changes: (TemplateEdit & { previous: string | null })[];
  impact: TemplateImpact[];
  reason: string;
  conflict: boolean;
  releaseError: string | null;
  targetRevision: string | null;
  revertsId: string | null;
};

export type TemplateEditorData = {
  revision: string;
  sites: { key: string; name: string }[];
  values: Record<TemplatePropertyId, Record<string, { assigned: string | null; effective: string }>>;
  drafts: TemplateDraft[];
};

export const templateEditorRequest = <T>(body: object) => portalRequest<T>('/template-editor', body);
export const openTemplateEditor = () => templateEditorRequest<TemplateEditorData>({ action: 'list' });
