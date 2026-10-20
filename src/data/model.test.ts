import { beforeEach, describe, expect, it } from "vitest";
import { clients as legacyClients } from "../config/clients";
import { resolveClientCoverage } from "../config/resolvers";
import { buildContent } from "../content";
import {
  clientEntities,
  siteEntities,
  getClientForSite,
  getSite,
  getClientAliasForSite,
  getSiteIdForClientAlias,
  getSitesForClient,
  getClientsForTpa,
  getSitesForTpa,
  getTpa,
  getTpaForClient,
  tpaEntities,
  validateTpaIntegrity,
  resolveSite,
  resolveSiteCoverage,
  resolveEffectiveBranding,
  resolveSiteSupport,
  resolveSiteFeatures,
  resolveSitePageSettings,
  resolveSiteCoverageSettings,
  resolveSiteFieldSettings,
  resolveSiteEmailConfiguration,
  resolveSiteId,
} from ".";

describe("normalized Client → Site model", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
    window.sessionStorage.clear();
  });

  it("allows one client to own multiple sites with mixed template modes", () => {
    const sites = getSitesForClient("waepa");
    expect(sites.map((site) => site.id)).toEqual(["waepa", "waepa-gi"]);
    expect(sites.map((site) => site.templateType)).toEqual(["multi", "single"]);
  });

  it("resolves Site → Client", () => {
    expect(getClientForSite("waepa-gi")?.id).toBe("waepa");
    expect(getSite("waepa-gi")?.clientId).toBe("waepa");
  });

  it("configures CSEA as a single-page Site", () => {
    expect(getSite("csea")?.templateType).toBe("single");
    expect(resolveSiteFeatures("csea")?.defaultTemplate).toBe("single");
  });

  it("inherits client defaults and lets site overrides win", () => {
    const standard = resolveSite("waepa");
    const gi = resolveSite("waepa-gi");

    expect(standard.effective.support).toEqual(gi.effective.support);
    expect(standard.effective.branding.name).toBe(gi.effective.branding.name);
    expect(standard.effective.features?.defaultTemplate).toBeUndefined();
    expect(gi.effective.features?.defaultTemplate).toBe("single");
    expect(standard.effective.coverages.overrides?.["li-group-term"]?.name).toBe(
      "Group Term Life Insurance",
    );
    expect(gi.effective.coverages.overrides?.["li-group-term"]?.name).toBeUndefined();
  });

  it("keeps every existing single-site client resolvable", () => {
    for (const client of clientEntities.filter((entry) => entry.id !== "waepa")) {
      const sites = getSitesForClient(client.id);
      expect(sites).toHaveLength(1);
      expect(resolveSite(sites[0].id).effective.id).toBe(getClientAliasForSite(sites[0].id));
    }
  });

  it("preserves every effective legacy configuration value for every Site", () => {
    for (const site of siteEntities) {
      expect(resolveSite(site.id).effective).toEqual(legacyClients[getClientAliasForSite(site.id)]);
    }
  });

  it("preserves each domain-specific effective value and content resolution", () => {
    for (const site of siteEntities) {
      const legacy = legacyClients[getClientAliasForSite(site.id)];
      expect(getClientForSite(site.id)?.id).toBe(site.clientId);
      expect(resolveEffectiveBranding({ siteId: site.id })).toEqual(legacy.branding);
      expect(resolveSiteSupport(site.id)).toEqual(legacy.support);
      expect(resolveSiteFeatures(site.id)).toEqual(legacy.features);
      expect(resolveSitePageSettings(site.id)).toEqual(legacy.pages);
      expect(resolveSiteCoverageSettings(site.id)).toEqual(legacy.coverages);
      expect(resolveSiteFieldSettings(site.id)).toEqual(legacy.fields);
      expect(resolveSiteEmailConfiguration(site.id)).toEqual(legacy.emailSupport);
      expect(resolveSiteCoverage(site.id)).toEqual(resolveClientCoverage(legacy));
      expect(buildContent(site.id)).toBeDefined();
    }
  });

  it("keeps both WAEPA runtime experiences equivalent through the site resolver", () => {
    expect(resolveSite("waepa").effective).toEqual(legacyClients.waepa);
    expect(resolveSite("waepa-gi").effective).toEqual(legacyClients.waepagi);
    expect(resolveSiteCoverage("waepa")).toEqual(
      resolveClientCoverage(legacyClients.waepa),
    );
    expect(resolveSiteCoverage("waepa-gi")).toEqual(
      resolveClientCoverage(legacyClients.waepagi),
    );
  });

  it("maps legacy ?client= URLs and explicit ?site= URLs to an active site", () => {
    window.history.replaceState(null, "", "/?client=waepagi");
    expect(resolveSiteId()).toBe("waepa-gi");

    window.history.replaceState(null, "", "/?site=waepa&client=waepa");
    expect(resolveSiteId()).toBe("waepa");
    expect(getSiteIdForClientAlias("waepa")).toBe("waepa");
  });
});

describe("normalized TPA → Client → Site model", () => {
  it("resolves every Client to exactly one distinct TPA identity", () => {
    expect(validateTpaIntegrity()).toEqual([]);
    expect(new Set(tpaEntities.map((tpa) => tpa.id)).size).toBe(tpaEntities.length);
    for (const client of clientEntities) {
      expect(getTpaForClient(client.id)?.id).toBe(client.tpaId);
      expect(getTpa(client.tpaId)?.id).not.toBe(client.id);
    }
  });

  it("supports TPA traversal through Clients to Sites", () => {
    const tpa = getTpaForClient("waepa")!;
    expect(getClientsForTpa(tpa.id).map((client) => client.id)).toEqual(["waepa"]);
    expect(getSitesForTpa(tpa.id).map((site) => site.id)).toEqual([
      "waepa",
      "waepa-gi",
    ]);
  });

  it("keeps the cardinality API valid for one or many Clients per TPA", () => {
    const sharedTpaId = tpaEntities[0].id;
    const fixtureClients = [
      { ...clientEntities[0], id: "fixture-a", tpaId: sharedTpaId },
      { ...clientEntities[1], id: "fixture-b", tpaId: sharedTpaId },
    ];
    expect(getClientsForTpa(sharedTpaId, fixtureClients)).toHaveLength(2);
  });
});
