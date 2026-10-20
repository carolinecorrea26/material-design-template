import { beforeEach, describe, expect, it } from "vitest";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createSeedDatabase } from "../persistence/seed";
import { SiteService } from "./siteService";
import { ChangeRequestService } from "./changeRequestService";
import { ReleaseService } from "./releaseService";
import { SiteBuilderService } from "./siteBuilderService";
import { ApplicationService } from "./applicationService";

describe("persistent domain services", () => {
  let adapter: LocalStorageAdapter;
  beforeEach(() => { adapter = new LocalStorageAdapter(createSeedDatabase()); });

  it("supports site create, update, archive, restore, and scoped queries", async () => {
    const service = new SiteService(adapter);
    const created = await service.createSite({ key: "waepa-test", clientId: "waepa", name: "Test", displayName: "Test", environment: "demo", templateType: "multi", legacyClientId: "waepa" });
    expect((await service.getSiteByKey("waepa-test"))?.id).toBe(created.id);
    expect((await service.updateSite(created.id, { name: "Updated" })).name).toBe("Updated");
    await service.archiveSite(created.id); expect(await service.getSiteById(created.id)).toMatchObject({ deletedAt: expect.any(String) });
    await service.restoreSite(created.id); expect(await service.getSiteById(created.id)).toMatchObject({ deletedAt: null });
    expect((await service.getSitesForScope({ id: "scope", userId: "u", scopeType: "client", scopeId: "waepa", createdAt: "now" })).every((site) => site.clientId === "waepa")).toBe(true);
  });

  it("supports structured change CRUD and release assignment", async () => {
    const changes = new ChangeRequestService(adapter); const releases = new ReleaseService(adapter);
    const change = await changes.createChangeRequest({ changeNumber: "CHG-TEST", title: "Test", description: "", status: "Draft", requestedBy: "QA" });
    const item = await changes.addChangeItem({ changeRequestId: change.id, siteId: "waepa", entityType: "configuration", entityId: null, fieldKey: "amount", currentValueJson: 1, proposedValueJson: 2, changeType: "update" });
    expect(await changes.getItems(change.id)).toHaveLength(1); await changes.removeChangeItem(item.id); expect(await changes.getItems(change.id)).toHaveLength(0);
    const release = await releases.createRelease({ releaseKey: "REL-TEST", name: "Test", releaseDate: "2027-01-01", status: "Planning", notes: "" });
    await releases.assignChange(release.id, change.id); expect((await releases.getChangesForRelease(release.id)).map((row) => row.id)).toContain(change.id);
    await releases.removeChange(release.id, change.id); expect(await releases.getChangesForRelease(release.id)).toHaveLength(0);
    await changes.archiveChangeRequest(change.id); expect((await changes.getChangeRequest(change.id))?.deletedAt).not.toBeNull();
  });

  it("persists builder draft progress and archive state", async () => {
    const service = new SiteBuilderService(adapter); const draft = await service.createDraft({ clientId: "waepa", siteKey: "draft-test", siteName: "Draft", status: "Draft", currentStep: "Organization" });
    expect((await service.updateDraft(draft.id, { currentStep: "Coverage" })).currentStep).toBe("Coverage");
    await service.archiveDraft(draft.id); expect((await service.getDraft(draft.id))?.deletedAt).not.toBeNull();
    await service.restoreDraft(draft.id); expect((await service.getDraft(draft.id))?.deletedAt).toBeNull();
  });

  it("writes an application event and audit event for transitions", async () => {
    const service = new ApplicationService(adapter); const application = (await service.getApplication("APP-78214"))!;
    await service.approveApplication(application.id, "tpa-reviewer");
    expect(await service.getApplication(application.id)).toMatchObject({ status: "Underwriting", currentActionOwnerType: "NYL" });
    expect(await service.getEvents(application.id)).toHaveLength(1);
    expect((await adapter.list("auditEvents")).some((event) => event.entityId === application.id && event.action === "status_change")).toBe(true);
  });

  it("supports TPA and advisor scoped application queries", async () => {
    const service = new ApplicationService(adapter); const application = (await service.getApplication("APP-78214"))!;
    await adapter.insert("applicationParticipants", { id: "participant-advisor", applicationId: application.id, participantType: "advisor", userId: "advisor-1", name: "Demo Advisor", email: "advisor@example.test", relationship: null, createdAt: "now", updatedAt: "now" });
    expect((await service.getApplicationsForTPA("tpa-waepa")).map((row) => row.id)).toContain(application.id);
    expect((await service.getApplicationsForAdvisor("advisor-1")).map((row) => row.id)).toEqual([application.id]);
  });

  it("groups all linked Sites and existing applications under the Association's new TPA without rewriting application history", async () => {
    const applications = new ApplicationService(adapter);
    const sites = new SiteService(adapter);
    const association = (await adapter.get("clients", "waepa"))!;
    const otherTPA = (await adapter.list("organizations")).find(row => row.id !== association.organizationId)!;
    const otherApplications = (await applications.getApplicationsForTPA(otherTPA.id)).map(row => row.id);
    const linkedSites = (await sites.getSitesForScope({ id: "scope", userId: "u", scopeType: "client", scopeId: association.id, createdAt: "now" }));
    expect(linkedSites.length).toBeGreaterThan(1);
    await applications.createApplication({ applicationNumber: "APP-TRANSFER-DRAFT", siteId: linkedSites[1].id, productKey: "li-group-term", status: "In Progress", currentActionOwnerType: "Applicant" });
    const submitted = await applications.createApplication({ applicationNumber: "APP-TRANSFER-SUBMITTED", siteId: linkedSites[0].id, productKey: "li-group-term", status: "Pending TPA Review", currentActionOwnerType: "TPA", submittedAt: "2026-10-19T12:00:00.000Z" });
    await applications.approveApplication(submitted.id, "original-tpa-reviewer");
    const existing = (await applications.getApplications()).filter(row => linkedSites.some(site => site.id === row.siteId));
    expect(existing.some(row => row.submittedAt !== null)).toBe(true);
    const events = await adapter.list("applicationEvents");

    await adapter.update("clients", association.id, { organizationId: otherTPA.id });

    const movedIds = new Set(existing.map(row => row.id));
    expect((await applications.getApplicationsForTPA(association.organizationId)).some(row => movedIds.has(row.id))).toBe(false);
    const newTPAApplications = await applications.getApplicationsForTPA(otherTPA.id);
    for (const application of existing) expect(newTPAApplications).toContainEqual(application);
    expect(newTPAApplications.filter(row => !movedIds.has(row.id)).map(row => row.id)).toEqual(otherApplications);
    const newTPASites = await sites.getSitesForScope({ id: "scope", userId: "u", scopeType: "organization", scopeId: otherTPA.id, createdAt: "now" });
    for (const site of linkedSites) expect(newTPASites).toContainEqual(site);
    expect(await adapter.list("applicationEvents")).toEqual(events);
  });

  it("uses an isolated in-memory fallback when browser storage is unavailable", async () => {
    expect(adapter.kind).toBe("local"); expect((await adapter.list("sites")).length).toBeGreaterThan(0);
  });

  it("persists fallback mutations across adapter instances", async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const first = new LocalStorageAdapter(createSeedDatabase(), storage); const firstService = new SiteService(first);
    await firstService.createSite({ key: "persisted", clientId: "demo", name: "Persisted", displayName: "Persisted", environment: "demo", templateType: "multi", legacyClientId: "demo" });
    const secondService = new SiteService(new LocalStorageAdapter(createSeedDatabase(), storage));
    expect((await secondService.getSiteByKey("persisted"))?.name).toBe("Persisted");
  });
});
