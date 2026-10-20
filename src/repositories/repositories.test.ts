import { describe, expect, it } from "vitest";
import { createSiteRepository } from "./siteRepository";
import { staticSiteAdapter } from "./staticSiteAdapter";
import { createFoundationRepositories } from "./persistedRepositories";
import { createLibraryRepository, curatedLibrarySnapshot } from "./libraryRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createSeedDatabase } from "../persistence/seed";
import { clients } from "../config/clients";
import { resolveClientCoverage, resolveClientFields, resolveClientPages, resolveClientFlows } from "../config/resolvers";
import { resolveUnderwritingBand } from "../domain/coverageRequirements";

const repository = createSiteRepository(staticSiteAdapter);
describe("Phase 5 compatibility repository", () => {
  for (const [alias, siteId] of staticSiteAdapter.read().aliases) {
    it(`${siteId} preserves legacy configuration and resolved behavior`, () => {
      const actual = repository.getEffectiveSiteConfig(siteId);
      const expected = clients[alias];
      expect(actual).toEqual(expected);
      expect(resolveClientCoverage(actual)).toEqual(resolveClientCoverage(expected));
      expect(resolveClientFields(actual)).toEqual(resolveClientFields(expected));
      expect(resolveClientPages(actual)).toEqual(resolveClientPages(expected));
      expect(resolveClientFlows(actual)).toEqual(resolveClientFlows(expected));
      expect(repository.getSiteIdForClientAlias(alias)).toBe(siteId);
    });
  }
  it("uses the injected snapshot for identities, relationships and compatibility settings", () => {
    const source = structuredClone(staticSiteAdapter.read());
    source.siteEntities.find(s => s.id === "asce")!.supportOverride = { phone: "repository-phone" };
    source.associationEntities.find(a => a.clientId === "asce")!.name = "Repository association";
    const injected = createSiteRepository({ read: () => source });
    expect(injected.getEffectiveSiteConfig("asce").support.phone).toBe("repository-phone");
    expect(injected.getAssociationsForSite("asce")[0].name).toBe("Repository association");
    expect(repository.getEffectiveSiteConfig("asce").support.phone).not.toBe("repository-phone");
    expect(() => injected.getEffectiveSiteConfig("missing")).toThrow("Unknown site");
    expect(injected.validateAssociationIntegrity()).toEqual([]);
    expect(injected.validateTpaIntegrity()).toEqual([]);
  });
  it("preserves all four unspecified older-age underwriting bands", () => {
    const products = resolveClientCoverage(repository.getEffectiveSiteConfig("asce"));
    for (const [key, age] of [["li-10yr", 65], ["li-20yr", 55]] as const) {
      const product = products.find(p => p.id === key)!.effective;
      expect(product.requirements?.unresolved).toHaveLength(1);
      for (const applicant of ["member", "spouse"] as const) {
        const band = resolveUnderwritingBand(product, applicant, age, 100000);
        expect(band?.status).toBe("underwriting-unspecified");
        expect(band?.underwritingType).toBeUndefined();
      }
    }
  });
});

describe("Phase 5 persistence and Library boundaries", () => {
  it("reads current adapter data without stale caching and distinguishes missing IDs", async () => {
    const adapter = new LocalStorageAdapter(createSeedDatabase());
    const repositories = createFoundationRepositories(adapter);
    const site = (await repositories.sites.list())[0];
    await adapter.update("sites", site.id, { name: "Updated through adapter" });
    expect((await repositories.sites.get(site.id))?.name).toBe("Updated through adapter");
    expect(await repositories.sites.get("missing")).toBeNull();
    expect(await repositories.clients.list()).toEqual(await adapter.list("clients"));
  });
  it("propagates persistence failures rather than returning static data", async () => {
    const adapter = new LocalStorageAdapter(createSeedDatabase());
    adapter.list = async () => { throw new Error("transport failure"); };
    await expect(createFoundationRepositories(adapter).sites.list()).rejects.toThrow("transport failure");
  });
  it("reads only the injected curated Library catalogs", () => {
    const injected = createLibraryRepository({ read: () => ({ ...curatedLibrarySnapshot, pages: [] }) });
    expect(injected.read("pages")).toEqual([]);
    expect(injected.read("patternCatalog")).toHaveLength(5);
    expect(Object.keys(curatedLibrarySnapshot)).not.toContain("sourceRequirements");
  });
});
