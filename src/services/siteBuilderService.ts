import { mockRequest } from '../mock/client';
import { isLibraryDraft } from '../domain/libraryDraft';
import { persistence } from "../persistence/client";
import type { PersistenceAdapter } from "../persistence/adapter";
import { newId, now } from "../persistence/ids";
import type { Json, SiteBuilderDraft } from "../persistence/types";
import { active, audit, DEMO_ACTOR } from "./serviceUtils";

export type BuilderDraftView = SiteBuilderDraft & { canEdit?: boolean };
export type CreateDraftInput = Pick<SiteBuilderDraft, "clientId" | "siteKey" | "siteName" | "status" | "currentStep"> & Partial<Pick<SiteBuilderDraft, "draftDataJson" | "ownerId">>;
export class SiteBuilderService {
  private readonly adapter: PersistenceAdapter;
  constructor(adapter: PersistenceAdapter = persistence) { this.adapter = adapter; }
  async getDrafts(options?: { includeArchived?: boolean }) { return active(import.meta.env.VITE_MOCK_PLATFORM_ENABLED ? await mockRequest<BuilderDraftView[]>("/builder/drafts", {}) : await this.adapter.list("siteBuilderDrafts"), options?.includeArchived); }
  async getDraft(id: string) { if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return (await this.getDrafts({ includeArchived: true })).find(r => r.id === id) ?? null; return this.adapter.get("siteBuilderDrafts", id); }
  async createDraft(input: CreateDraftInput, performedBy = DEMO_ACTOR) {
    const library: unknown = input.draftDataJson;
    if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED && isLibraryDraft(library)) {
      const { mockTransport, ...payload } = library;
      const saved = mockTransport ?? await mockRequest<{ id: string }>('/library/save', { expectedVersion: 0, payload });
      return mockRequest<SiteBuilderDraft>('/builder/draft/create', { clientId: input.clientId, siteKey: input.siteKey, siteName: input.siteName, libraryDraftId: saved.id });
    }
    const timestamp = now(); const row = await this.adapter.insert("siteBuilderDrafts", { id: newId(), ...input, draftDataJson: input.draftDataJson ?? {} as Json, ownerId: performedBy, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }); await audit(this.adapter, { entityType: "site_builder_draft", entityId: row.id, action: "create", newValue: row as unknown as never, performedBy }); return row; }
  async updateDraft(id: string, patch: Partial<Pick<SiteBuilderDraft, "siteName" | "status" | "currentStep" | "draftDataJson" | "ownerId">>, performedBy = DEMO_ACTOR) {
    if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) {
      const { draftDataJson, ...metadata } = patch;
      delete metadata.ownerId;
      return mockRequest<SiteBuilderDraft>('/builder/draft/update', { id, patch: { ...metadata, ...(isLibraryDraft(draftDataJson) ? { libraryDraftId: draftDataJson.mockTransport?.id } : {}) } });
    }
    const old = await this.adapter.get("siteBuilderDrafts", id); if (old?.ownerId !== performedBy) throw new Error("Only the user who started this Site can edit it"); const row = await this.adapter.update("siteBuilderDrafts", id, { ...patch, updatedAt: now() }); await audit(this.adapter, { entityType: "site_builder_draft", entityId: id, action: "update", oldValue: old as unknown as never, newValue: row as unknown as never, performedBy }); return row; }
  async archiveDraft(id: string, performedBy = DEMO_ACTOR) { if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return mockRequest<SiteBuilderDraft>('/builder/draft/update', { id, patch: { deletedAt: now() } }); const old = await this.adapter.get("siteBuilderDrafts", id); if (old?.ownerId !== performedBy) throw new Error("Only the user who started this Site can edit it"); const row = await this.adapter.update("siteBuilderDrafts", id, { deletedAt: now(), updatedAt: now() }); await audit(this.adapter, { entityType: "site_builder_draft", entityId: id, action: "archive", performedBy }); return row; }
  async restoreDraft(id: string, performedBy = DEMO_ACTOR) { if (import.meta.env.VITE_MOCK_PLATFORM_ENABLED) return mockRequest<SiteBuilderDraft>('/builder/draft/update', { id, patch: { deletedAt: null } }); const old = await this.adapter.get("siteBuilderDrafts", id); if (old?.ownerId !== performedBy) throw new Error("Only the user who started this Site can edit it"); const row = await this.adapter.update("siteBuilderDrafts", id, { deletedAt: null, updatedAt: now() }); await audit(this.adapter, { entityType: "site_builder_draft", entityId: id, action: "restore", performedBy }); return row; }
}
export const siteBuilderService = new SiteBuilderService();
