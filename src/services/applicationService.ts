import { persistence } from "../persistence/client";
import type { PersistenceAdapter } from "../persistence/adapter";
import { newId, now } from "../persistence/ids";
import type { ActionOwnerType, Application, ApplicationStatus } from "../persistence/types";
import { active, audit, DEMO_ACTOR } from "./serviceUtils";

export type CreateApplicationInput = Pick<Application, "applicationNumber" | "siteId" | "productKey" | "status" | "currentActionOwnerType"> & Partial<Pick<Application, "currentActionOwnerId" | "submittedAt">>;
export class ApplicationService {
  private readonly adapter: PersistenceAdapter;
  constructor(adapter: PersistenceAdapter = persistence) { this.adapter = adapter; }
  async getApplications(options?: { includeArchived?: boolean }) { return active(await this.adapter.list("applications"), options?.includeArchived); }
  async getApplication(identifier: string) { return (await this.adapter.list("applications")).find((item) => item.id === identifier || item.applicationNumber === identifier) ?? null; }
  async getApplicationsForSite(siteId: string) { return (await this.getApplications()).filter((item) => item.siteId === siteId); }
  async getApplicationsForTPA(organizationId: string) { const clients = await this.adapter.list("clients"); const clientIds = new Set(clients.filter((c) => c.organizationId === organizationId).map((c) => c.id)); const sites = await this.adapter.list("sites"); const siteIds = new Set(sites.filter((s) => clientIds.has(s.clientId)).map((s) => s.id)); return (await this.getApplications()).filter((a) => siteIds.has(a.siteId)); }
  async getApplicationsForAdvisor(advisorId: string) { const participants = await this.adapter.list("applicationParticipants"); const ids = new Set(participants.filter((p) => p.participantType === "advisor" && p.userId === advisorId).map((p) => p.applicationId)); return (await this.getApplications()).filter((a) => ids.has(a.id)); }
  async createApplication(input: CreateApplicationInput, performedBy = DEMO_ACTOR) { const timestamp = now(); const row = await this.adapter.insert("applications", { id: newId(), ...input, currentActionOwnerId: input.currentActionOwnerId ?? null, submittedAt: input.submittedAt ?? null, createdAt: timestamp, updatedAt: timestamp, deletedAt: null }); await audit(this.adapter, { entityType: "application", entityId: row.id, action: "create", newValue: row as unknown as never, performedBy }); return row; }
  async updateApplication(id: string, patch: Partial<Pick<Application, "productKey" | "submittedAt">>, performedBy = DEMO_ACTOR) { const old = await this.adapter.get("applications", id); const row = await this.adapter.update("applications", id, { ...patch, updatedAt: now() }); await audit(this.adapter, { entityType: "application", entityId: id, action: "update", oldValue: old as unknown as never, newValue: row as unknown as never, performedBy }); return row; }
  async transitionApplication(id: string, status: ApplicationStatus, owner: ActionOwnerType, options?: { ownerId?: string | null; notes?: string; performedBy?: string }) {
    const previous = await this.adapter.get("applications", id); if (!previous) throw new Error("Application not found.");
    const performedBy = options?.performedBy ?? DEMO_ACTOR; const timestamp = now();
    const row = await this.adapter.update("applications", id, { status, currentActionOwnerType: owner, currentActionOwnerId: options?.ownerId ?? null, updatedAt: timestamp });
    await this.adapter.insert("applicationEvents", { id: newId(), applicationId: id, eventType: "workflow_transition", fromStatus: previous.status, toStatus: status, fromOwnerType: previous.currentActionOwnerType, toOwnerType: owner, fromOwnerActorId: previous.currentActionOwnerId, toOwnerActorId: row.currentActionOwnerId, performedBy, notes: options?.notes ?? null, createdAt: timestamp });
    await audit(this.adapter, { entityType: "application", entityId: id, action: "status_change", fieldKey: "status_and_owner", oldValue: { status: previous.status, owner: previous.currentActionOwnerType }, newValue: { status, owner }, performedBy }); return row;
  }
  approveApplication(id: string, performedBy = DEMO_ACTOR) { return this.transitionApplication(id, "Underwriting", "NYL", { notes: "Approved by TPA", performedBy }); }
  rejectApplication(id: string, performedBy = DEMO_ACTOR) { return this.transitionApplication(id, "Rejected", "None", { notes: "Rejected by TPA", performedBy }); }
  async getEvents(applicationId: string) { return (await this.adapter.list("applicationEvents")).filter((event) => event.applicationId === applicationId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
}
export const applicationService = new ApplicationService();
