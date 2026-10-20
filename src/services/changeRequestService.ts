import { persistence } from "../persistence/client";
import type { PersistenceAdapter } from "../persistence/adapter";
import { newId, now } from "../persistence/ids";
import type { ChangeItem, ChangeRequest } from "../persistence/types";
import { active, audit, DEMO_ACTOR } from "./serviceUtils";

export type CreateChangeRequestInput = Pick<ChangeRequest, "changeNumber" | "title" | "description" | "status" | "requestedBy"> & Partial<Pick<ChangeRequest, "ownerId" | "targetReleaseId">>;
export class ChangeRequestService {
  private readonly adapter: PersistenceAdapter;
  constructor(adapter: PersistenceAdapter = persistence) { this.adapter = adapter; }
  async getChangeRequests(options?: { includeArchived?: boolean }) { return active(await this.adapter.list("changeRequests"), options?.includeArchived); }
  async getChangeRequest(identifier: string) { return (await this.adapter.list("changeRequests")).find((item) => item.id === identifier || item.changeNumber === identifier) ?? null; }
  async createChangeRequest(input: CreateChangeRequestInput, performedBy = DEMO_ACTOR) { const timestamp = now(); const row = await this.adapter.insert("changeRequests", { id: newId(), ...input, ownerId: input.ownerId ?? null, targetReleaseId: input.targetReleaseId ?? null, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }); await audit(this.adapter, { entityType: "change_request", entityId: row.id, action: "create", newValue: row as unknown as never, performedBy }); return row; }
  async updateChangeRequest(id: string, patch: Partial<Pick<ChangeRequest, "title" | "description" | "status" | "ownerId" | "targetReleaseId">>, performedBy = DEMO_ACTOR) { const old = await this.adapter.get("changeRequests", id); const row = await this.adapter.update("changeRequests", id, { ...patch, updatedAt: now() }); await audit(this.adapter, { entityType: "change_request", entityId: id, action: patch.status && patch.status !== old?.status ? "status_change" : "update", oldValue: old as unknown as never, newValue: row as unknown as never, performedBy }); return row; }
  async archiveChangeRequest(id: string, performedBy = DEMO_ACTOR) { const row = await this.adapter.update("changeRequests", id, { deletedAt: now(), updatedAt: now() }); await audit(this.adapter, { entityType: "change_request", entityId: id, action: "archive", performedBy }); return row; }
  async restoreChangeRequest(id: string, performedBy = DEMO_ACTOR) { const row = await this.adapter.update("changeRequests", id, { deletedAt: null, updatedAt: now() }); await audit(this.adapter, { entityType: "change_request", entityId: id, action: "restore", performedBy }); return row; }
  async getItems(changeRequestId: string) { return (await this.adapter.list("changeItems")).filter((item) => item.changeRequestId === changeRequestId); }
  async addChangeItem(input: Omit<ChangeItem, "id" | "createdAt" | "updatedAt">, performedBy = DEMO_ACTOR) { const timestamp = now(); const row = await this.adapter.insert("changeItems", { id: newId(), ...input, createdAt: timestamp, updatedAt: timestamp }); await audit(this.adapter, { entityType: "change_item", entityId: row.id, action: "create", newValue: row as unknown as never, performedBy, changeRequestId: input.changeRequestId }); return row; }
  async updateChangeItem(id: string, patch: Partial<Omit<ChangeItem, "id" | "changeRequestId" | "createdAt">>, performedBy = DEMO_ACTOR) { const old = await this.adapter.get("changeItems", id); const row = await this.adapter.update("changeItems", id, { ...patch, updatedAt: now() }); await audit(this.adapter, { entityType: "change_item", entityId: id, action: "update", oldValue: old as unknown as never, newValue: row as unknown as never, performedBy, changeRequestId: row.changeRequestId }); return row; }
  async removeChangeItem(id: string, performedBy = DEMO_ACTOR) { const old = await this.adapter.get("changeItems", id); if (!old) return; await this.adapter.remove("changeItems", id); await audit(this.adapter, { entityType: "change_item", entityId: id, action: "archive", oldValue: old as unknown as never, performedBy, changeRequestId: old.changeRequestId }); }
  assignToRelease(id: string, releaseId: string | null, performedBy = DEMO_ACTOR) { return this.updateChangeRequest(id, { targetReleaseId: releaseId }, performedBy); }
  async getChangesForClient(clientId: string) { const siteIds = new Set((await this.adapter.list("sites")).filter((s) => s.clientId === clientId).map((s) => s.id)); const items = await this.adapter.list("changeItems"); const ids = new Set(items.filter((i) => i.siteId && siteIds.has(i.siteId)).map((i) => i.changeRequestId)); return (await this.getChangeRequests()).filter((change) => ids.has(change.id)); }
}
export const changeRequestService = new ChangeRequestService();
