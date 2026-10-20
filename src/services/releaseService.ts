import { persistence } from "../persistence/client";
import type { PersistenceAdapter } from "../persistence/adapter";
import { newId, now } from "../persistence/ids";
import type { Release } from "../persistence/types";
import { active, audit, DEMO_ACTOR } from "./serviceUtils";

export type CreateReleaseInput = Pick<Release, "releaseKey" | "name" | "releaseDate" | "status" | "notes">;
export class ReleaseService {
  private readonly adapter: PersistenceAdapter;
  constructor(adapter: PersistenceAdapter = persistence) { this.adapter = adapter; }
  async getReleases(options?: { includeArchived?: boolean }) { return active(await this.adapter.list("releases"), options?.includeArchived); }
  async getUpcomingReleases() { const today = new Date().toISOString().slice(0, 10); return (await this.getReleases()).filter((release) => release.releaseDate >= today && release.status !== "Released").sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)); }
  async getRelease(identifier: string) { return (await this.adapter.list("releases")).find((item) => item.id === identifier || item.releaseKey === identifier) ?? null; }
  async createRelease(input: CreateReleaseInput, performedBy = DEMO_ACTOR) { const timestamp = now(); const row = await this.adapter.insert("releases", { id: newId(), ...input, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }); await audit(this.adapter, { entityType: "release", entityId: row.id, action: "create", newValue: row as unknown as never, performedBy }); return row; }
  async updateRelease(id: string, patch: Partial<Omit<CreateReleaseInput, "releaseKey">>, performedBy = DEMO_ACTOR) { const old = await this.adapter.get("releases", id); const row = await this.adapter.update("releases", id, { ...patch, updatedAt: now() }); await audit(this.adapter, { entityType: "release", entityId: id, action: "update", oldValue: old as unknown as never, newValue: row as unknown as never, performedBy }); return row; }
  async archiveRelease(id: string, performedBy = DEMO_ACTOR) { const row = await this.adapter.update("releases", id, { deletedAt: now(), updatedAt: now() }); await audit(this.adapter, { entityType: "release", entityId: id, action: "archive", performedBy }); return row; }
  async restoreRelease(id: string, performedBy = DEMO_ACTOR) { const row = await this.adapter.update("releases", id, { deletedAt: null, updatedAt: now() }); await audit(this.adapter, { entityType: "release", entityId: id, action: "restore", performedBy }); return row; }
  async getChangesForRelease(releaseId: string) { const links = await this.adapter.list("releaseChanges"); const ids = new Set(links.filter((link) => link.releaseId === releaseId).map((link) => link.changeRequestId)); const changes = await this.adapter.list("changeRequests"); return changes.filter((change) => ids.has(change.id) || change.targetReleaseId === releaseId); }
  async assignChange(releaseId: string, changeRequestId: string, performedBy = DEMO_ACTOR) { const existing = (await this.adapter.list("releaseChanges")).find((link) => link.releaseId === releaseId && link.changeRequestId === changeRequestId); if (!existing) await this.adapter.insert("releaseChanges", { id: newId(), releaseId, changeRequestId, createdAt: now() }); await this.adapter.update("changeRequests", changeRequestId, { targetReleaseId: releaseId, updatedAt: now() }); await audit(this.adapter, { entityType: "release", entityId: releaseId, action: "update", fieldKey: "changeRequests", newValue: { changeRequestId }, changeRequestId, performedBy }); }
  async removeChange(releaseId: string, changeRequestId: string, performedBy = DEMO_ACTOR) { const links = await this.adapter.list("releaseChanges"); const link = links.find((item) => item.releaseId === releaseId && item.changeRequestId === changeRequestId); if (link) await this.adapter.remove("releaseChanges", link.id); const change = await this.adapter.get("changeRequests", changeRequestId); if (change?.targetReleaseId === releaseId) await this.adapter.update("changeRequests", changeRequestId, { targetReleaseId: null, updatedAt: now() }); await audit(this.adapter, { entityType: "release", entityId: releaseId, action: "update", fieldKey: "changeRequests", oldValue: { changeRequestId }, changeRequestId, performedBy }); }
}
export const releaseService = new ReleaseService();
