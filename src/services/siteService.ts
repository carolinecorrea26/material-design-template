import { createFoundationRepositories } from "../repositories/persistedRepositories";
import { persistence } from "../persistence/client";
import { newId, now } from "../persistence/ids";
import type { PersistenceAdapter } from "../persistence/adapter";
import type { Site, UserScope } from "../persistence/types";
import { active, audit, DEMO_ACTOR } from "./serviceUtils";

export type CreateSiteInput = Pick<Site, "key" | "clientId" | "name" | "displayName" | "environment" | "templateType" | "legacyClientId">;
export class SiteService {
  private readonly adapter: PersistenceAdapter;
  private readonly repositories: ReturnType<typeof createFoundationRepositories>;
  constructor(adapter: PersistenceAdapter = persistence) { this.adapter = adapter; this.repositories = createFoundationRepositories(adapter); }
  async getSites(options?: { includeArchived?: boolean }) { return active(await this.repositories.sites.list(), options?.includeArchived); }
  async getSiteById(id: string) { return this.repositories.sites.get(id); }
  async getSiteByKey(key: string) { return (await this.repositories.sites.list()).find((site) => site.key === key) ?? null; }
  async createSite(input: CreateSiteInput, performedBy = DEMO_ACTOR) {
    const timestamp = now();
    const site = await this.adapter.insert("sites", { id: newId(), ...input, status: "active", createdAt: timestamp, updatedAt: timestamp, deletedAt: null });
    await audit(this.adapter, { entityType: "site", entityId: site.id, action: "create", newValue: site as unknown as never, performedBy });
    return site;
  }
  async updateSite(id: string, patch: Partial<Pick<Site, "name" | "displayName" | "environment" | "status" | "templateType">>, performedBy = DEMO_ACTOR) {
    const previous = await this.getSiteById(id); if (!previous) throw new Error("Site not found.");
    const site = await this.adapter.update("sites", id, { ...patch, updatedAt: now() });
    await audit(this.adapter, { entityType: "site", entityId: id, action: "update", oldValue: previous as unknown as never, newValue: site as unknown as never, performedBy }); return site;
  }
  async archiveSite(id: string, performedBy = DEMO_ACTOR) { const site = await this.adapter.update("sites", id, { status: "archived", deletedAt: now(), updatedAt: now() }); await audit(this.adapter, { entityType: "site", entityId: id, action: "archive", performedBy }); return site; }
  async restoreSite(id: string, performedBy = DEMO_ACTOR) { const site = await this.adapter.update("sites", id, { status: "active", deletedAt: null, updatedAt: now() }); await audit(this.adapter, { entityType: "site", entityId: id, action: "restore", performedBy }); return site; }
  async getSitesForScope(scope: UserScope) {
    const sites = await this.getSites(); if (scope.scopeType === "global") return sites;
    if (scope.scopeType === "site") return sites.filter((site) => site.id === scope.scopeId);
    if (scope.scopeType === "client") return sites.filter((site) => site.clientId === scope.scopeId);
    if (scope.scopeType === "organization") { const clients = await this.repositories.clients.list(); const ids = new Set(clients.filter((client) => client.organizationId === scope.scopeId).map((client) => client.id)); return sites.filter((site) => ids.has(site.clientId)); }
    return [];
  }
  async getSitesForUser(userId: string) { const scopes = (await this.adapter.list("userScopes")).filter((scope) => scope.userId === userId); const lists = await Promise.all(scopes.map((scope) => this.getSitesForScope(scope))); return [...new Map(lists.flat().map((site) => [site.id, site])).values()]; }
}
export const siteService = new SiteService();
