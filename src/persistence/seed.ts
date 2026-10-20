import { siteEnvironmentLinks } from "../data/siteEnvironmentLinks";
import { emptyLibrary } from "./emptyLibrary";
import { synchronizeAssociationStructure } from './associationStructure';
import { associationEntities as associationDefinitions, siteAssociationEntities as associationLinks } from '../data/associations';
import { portalChanges, portalReleases, applicationRecords, siteBuilderDrafts } from "../admin/domain";
import { clientEntities, getClientAliasForSite, siteCoverageEntities, siteEntities, tpaEntities } from "../data";
import type { AnalyticsMeasurement, ApplicationStatus, DatabaseSchema, Json } from "./types";

const createdAt = "2026-09-01T12:00:00.000Z";
const updatedAt = (date?: string) => `${date ?? "2026-09-01"}T12:00:00.000Z`;

export function createSeedDatabase(): DatabaseSchema {
  const organizations = tpaEntities.map((tpa) => ({
    id: tpa.id, key: tpa.id, name: tpa.name, type: "tpa", status: "active" as const, createdAt, updatedAt: createdAt,
  }));
  const clients = clientEntities.map((client) => ({
    id: client.id, organizationId: client.tpaId, key: client.id, name: client.name, acronym: client.acronym,
    status: "active" as const, createdAt, updatedAt: createdAt,
  }));
  const sites = siteEntities.map((site) => ({
    id: site.id, clientId: site.clientId, key: site.id, name: site.name,
    displayName: site.name, status: site.status, environment: "demo", templateType: site.templateType,
    // Database compatibility column for records created before SiteId became canonical.
    legacyClientId: getClientAliasForSite(site.id), createdAt, updatedAt: createdAt, deletedAt: null,
  }));
  const releases = portalReleases.map((release) => ({
    id: release.id, releaseKey: release.id, name: release.name, releaseDate: release.date,
    status: release.status, notes: release.notes, createdAt, updatedAt: createdAt, deletedAt: null,
  }));
  const changeRequests = portalChanges.map((change) => ({
    id: change.id, changeNumber: change.id, title: change.title,
    description: `${change.type} change for ${change.siteId}.`, status: change.status,
    requestedBy: change.owner, ownerId: change.owner, targetReleaseId: change.targetRelease,
    createdAt, updatedAt: updatedAt(change.updated), deletedAt: null,
  }));
  const changeItems = portalChanges.map((change) => ({
    id: `${change.id}-item-1`, changeRequestId: change.id, siteId: change.siteId,
    entityType: change.type.toLowerCase().replaceAll(" ", "_"), entityId: change.sourceChangeLogId ?? null,
    fieldKey: "value", currentValueJson: null, proposedValueJson: { summary: change.title } as Json,
    changeType: "update" as const, createdAt, updatedAt: updatedAt(change.updated),
  }));
  const releaseChanges = portalReleases.flatMap((release) => release.changeIds.map((changeRequestId) => ({
    id: `${release.id}--${changeRequestId}`, releaseId: release.id, changeRequestId, createdAt,
  })));
  const applications = applicationRecords.map((application) => ({
    id: application.id, applicationNumber: application.id, siteId: application.siteId,
    productKey: application.product, status: application.status as ApplicationStatus,
    currentActionOwnerType: application.actionOwner === "TPA Admin" ? "TPA" as const : application.actionOwner,
    currentActionOwnerId: null, submittedAt: application.submitted === "—" ? null : `${application.submitted}T12:00:00.000Z`,
    recordOrigin: 'legacy-import' as const, importReference: `prototype-operational-seed:${application.id}`, productCatalogKey: null,
    createdAt, updatedAt: updatedAt(application.updated), deletedAt: null,
  }));
  const drafts = siteBuilderDrafts.map((draft) => ({
    id: draft.id, clientId: clientEntities.find((client) => draft.client.includes(client.acronym))?.id ?? null,
    siteKey: draft.id.toLowerCase(), siteName: draft.proposedSite, status: draft.status,
    currentStep: draft.progress, draftDataJson: { clientLabel: draft.client } as Json,
    ownerId: draft.owner, createdAt, updatedAt: createdAt, deletedAt: null,
  }));

  const report = "Portal_Executive_Report_August_2026.html";
  const sourceNote = "All sites except GI/SI; excludes bots and outdated browsers.";
  const monthEnd = ["31", "28", "31", "30", "31", "30", "31", "31"];
  const series = {
    unique_visitors: {
      2025: [23830, 20755, 25217, 17634, 16998, 16098, 16112, 15833],
      2026: [19939, 14873, 17338, 16398, 16423, 14044, 14313, 17471],
    },
    submitted_applications: {
      2025: [1882, 1572, 1581, 1509, 1490, 1363, 1706, 1567],
      2026: [1986, 1691, 1785, 1444, 1619, 1572, 1569, 1357],
    },
  } as const;
  const analyticsMeasurements: AnalyticsMeasurement[] = Object.entries(series).flatMap(([metricKey, years]) =>
    Object.entries(years).flatMap(([year, values]) => (values as readonly number[]).map((value: number, index: number) => ({
      id: `${metricKey}-${year}-${String(index + 1).padStart(2, "0")}`,
      metricKey, periodStart: `${year}-${String(index + 1).padStart(2, "0")}-01`,
      periodEnd: `${year}-${String(index + 1).padStart(2, "0")}-${monthEnd[index]}`,
      periodType: "month" as const, siteId: null, clientId: null, device: null, value,
      sourceReport: report, sourceSystem: "Adobe Analytics", definitionVersion: "2026-08-31",
      notes: sourceNote, createdAt, updatedAt: createdAt,
    }))),
  );
  analyticsMeasurements.push(
    ...[
      ["coverage_page_users", "2025", 30315], ["coverage_page_users", "2026", 31256],
      ["application_rate", "2025", 41.8], ["application_rate", "2026", 41.7],
    ].map(([metricKey, year, value]) => ({
      id: `${metricKey}-${year}-ytd-08`, metricKey: String(metricKey), periodStart: `${year}-01-01`, periodEnd: `${year}-08-31`,
      periodType: "ytd" as const, siteId: null, clientId: null, device: null, value: Number(value), sourceReport: report,
      sourceSystem: "Adobe Analytics", definitionVersion: "2026-08-31", notes: sourceNote, createdAt, updatedAt: createdAt,
    })),
    ...[
      ["desktop", "2025", 47.3], ["desktop", "2026", 47.2], ["mobile", "2025", 34.0], ["mobile", "2026", 35.0],
    ].map(([device, year, value]) => ({
      id: `application_rate-${device}-${year}-ytd-08`, metricKey: "application_rate", periodStart: `${year}-01-01`, periodEnd: `${year}-08-31`,
      periodType: "ytd" as const, siteId: null, clientId: null, device: device as "desktop" | "mobile", value: Number(value),
      sourceReport: report, sourceSystem: "Adobe Analytics", definitionVersion: "2026-08-31", notes: sourceNote, createdAt, updatedAt: createdAt,
    })),
  );

  return synchronizeAssociationStructure({
    ...emptyLibrary(),
    associations: associationDefinitions.map(({ id, clientId, ...definition }, position) => ({ id, key: id, clientKey: clientId, definition, position })),
    siteAssociations: associationLinks.map(({ id, siteId, associationId, enabled }, position) => ({ id, key: id, siteKey: siteId, associationKey: associationId, enabled, position })),
    sitePolicies: siteEntities.map(({ id, associationSelection, associationBranding }, position) => ({ id, key: id, siteKey: id, definition: { associationSelection, associationBranding }, position })),
    migrationSchedules: [],
    organizations, clients, sites,
    siteEnvironmentLinks,
    siteCoverages: siteCoverageEntities.map((item) => ({ id: item.id, siteId: item.siteId, coverageKey: item.coverageId, enabled: item.enabled, createdAt, updatedAt: createdAt })),
    siteProducts: siteCoverageEntities.map((item) => ({ id: `${item.id}--product`, siteId: item.siteId, productKey: item.coverageId, enabled: item.enabled, createdAt, updatedAt: createdAt })),
    siteRiders: ["cir", "abi"].map((riderKey) => ({ id: `waepa--${riderKey}`, siteId: "waepa", riderKey, enabled: true, createdAt, updatedAt: createdAt })),
    siteConfigurations: siteEntities.filter((site) => site.configurationOverrides).map((site) => ({ id: `${site.id}--overrides`, siteId: site.id, configurationKey: "legacyConfigurationOverrides", valueJson: JSON.parse(JSON.stringify(site.configurationOverrides)) as Json, source: "legacy_seed", effectiveDate: null, createdAt, updatedAt: createdAt, deletedAt: null })),
    applications, applicationParticipants: [], applicationEvents: [],
    applicants: [], applicationApplicants: [], applicationAssociations: [],
    changeRequests, changeItems, releases, releaseChanges,
    siteBuilderDrafts: drafts,
    users: [{ id: "user-demo-admin", email: "portal.admin@example.test", displayName: "Portal Admin", status: "active", createdAt, updatedAt: createdAt }],
    roles: [{ id: "role-admin", key: "portal-admin", name: "Portal Administrator", createdAt, updatedAt: createdAt }],
    userRoles: [{ id: "user-role-demo", userId: "user-demo-admin", roleId: "role-admin", createdAt }],
    userScopes: [{ id: "scope-demo-global", userId: "user-demo-admin", scopeType: "global", scopeId: null, createdAt }],
    auditEvents: [],
    analyticsMetrics: [
      { id: "metric-unique-visitors", metricKey: "unique_visitors", name: "Unique Visitors", description: "Unique individuals who visited the portal during the reporting period.", unit: "count", source: "Adobe Analytics", createdAt, updatedAt: createdAt },
      { id: "metric-coverage-page-users", metricKey: "coverage_page_users", name: "Coverage Page Users", description: "Qualified visitors who completed Eligibility and reached Coverage.", unit: "count", source: "Adobe Analytics", createdAt, updatedAt: createdAt },
      { id: "metric-submitted-applications", metricKey: "submitted_applications", name: "Submitted Applications", description: "Visitors who successfully signed and submitted an application.", unit: "count", source: "Adobe Analytics", createdAt, updatedAt: createdAt },
      { id: "metric-application-rate", metricKey: "application_rate", name: "Application Rate", description: "Submitted applications divided by Coverage Page Users.", unit: "percent", source: "Adobe Analytics", createdAt, updatedAt: createdAt },
    ],
    analyticsMeasurements,
  });
}
