import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createMigrationDatabase, migrationSiteKeys } from "./fixtures";
import { mcrSource } from "./mcr";
import { implementedSiteKeys } from "./promotion";
import { activeSiteMigrationScope, coverageAcceptanceDomains } from "./activeSiteScope";
import { createActiveSiteAudit } from "./activeSiteAudit";

describe("active Site migration contract", () => {
  const db = createMigrationDatabase();
  const report = createActiveSiteAudit(db, mcrSource);
  it("pins the approved ten Sites and keeps the WAEPA variants distinct", () => {
    expect(migrationSiteKeys).toEqual(["demo", "abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"]);
    expect(implementedSiteKeys).toEqual(migrationSiteKeys);
    expect(report.sites.map(site => site.siteKey)).toEqual(migrationSiteKeys);
    expect(report.sites.filter(site => site.clientKey === "waepa").map(site => site.siteKey)).toEqual(["waepa", "waepa-gi"]);
    expect(report.sites.filter(site => !site.mcrRequired).map(site => site.siteKey)).toEqual(["demo"]);
    expect(new Set(report.clientCatalogs.map(catalog => catalog.clientKey)).size).toBe(8);
  });
  it("gives every enabled assignment a complete review register without declaring parity", () => {
    const assignments = db.siteProducts.filter(row => row.enabled);
    expect(report.summary.enabledSiteProducts).toBe(assignments.length);
    expect(report.summary.openDomainReviews).toBe(assignments.length * coverageAcceptanceDomains.length);
    for (const site of report.sites) {
      const siteId = db.sites.find(row => row.key === site.siteKey)!.id;
      expect(site.products.map(product => product.productKey).sort()).toEqual(assignments.filter(row => row.siteId === siteId).map(row => row.productKey).sort());
      for (const product of site.products) {
        expect(product.domains.map(domain => domain.domain)).toEqual(coverageAcceptanceDomains.map(domain => domain.key));
        expect(product.domains.every(domain => domain.adoptionValidation === "pending" && domain.executionValidation === "pending" && domain.publicationValidation === "pending" && domain.disposition === "open")).toBe(true);
        expect(product.domains.every(domain => domain.sourceValidation === (site.mcrRequired ? "pending" : "not-applicable-synthetic-demo"))).toBe(true);
      }
    }
    expect(report.summary).toMatchObject({ migrationComplete: false, runtimeActivationReady: false });
  });
  it("rejects source drift including changes to the actual snapshot bytes", () => {
    const source = activeSiteMigrationScope.sources.mcr;
    expect(createHash("sha256").update(readFileSync(source.snapshotPath)).digest("hex")).toBe(source.snapshotSha256);
    expect(() => createActiveSiteAudit(db, { ...mcrSource, sha256: "different" })).toThrow("Source snapshot changed");
    expect(() => createActiveSiteAudit(db, { ...mcrSource, checklistSha256: "different" })).toThrow("Source snapshot changed");
    expect(() => createActiveSiteAudit(db, { ...mcrSource, workbook: "new.xlsx" })).toThrow("Source snapshot changed");
  });
  it("rejects missing Sites, incorrect ownership, duplicate products and unapproved scope expansion", () => {
    expect(() => createActiveSiteAudit({ ...db, sites: db.sites.filter(site => site.key !== "waepa-gi") }, mcrSource)).toThrow("Missing, duplicate or inactive");
    expect(() => createActiveSiteAudit({ ...db, sites: db.sites.map(site => site.key === "abe" ? { ...site, clientId: "ama" } : site) }, mcrSource)).toThrow("Client ownership mismatch");
    expect(() => createActiveSiteAudit({ ...db, siteProducts: [...db.siteProducts, db.siteProducts.find(row => row.enabled)!] }, mcrSource)).toThrow("Duplicate enabled products");
    expect(() => createActiveSiteAudit({ ...db, sites: [...db.sites, { ...db.sites[0], id: "new", key: "new" }] }, mcrSource)).toThrow("outside the approved scope");
  });
  it("keeps alias and product identity suggestions separate from adopted ownership", () => {
    for (const clientKey of ["avma", "isitrust"]) {
      const catalog = report.clientCatalogs.find(row => row.clientKey === clientKey)!;
      expect(catalog.products.length).toBeGreaterThan(0);
      expect(catalog.products.every(product => product.ownership === "review-hint-only")).toBe(true);
      expect(catalog.identityReviewHints.every(hint => hint.status === "review-required")).toBe(true);
    }
    expect(report.clientCatalogs.find(row => row.clientKey === "csea")?.products).toEqual([]);
    expect(report.sites.find(row => row.siteKey === "csea")?.products[0].identity.candidates).toEqual([]);
    expect(report.sites.flatMap(site => site.products).every(product => product.identity.adoptedSources.length === 0)).toBe(true);
    const mainCount = db.products.filter(product => /^Main!D\d+$/.test(product.sourceReference ?? "")).length;
    expect(report.summary.scopedMcrReviewProducts + report.summary.otherOwnedMcrCatalogProducts + report.summary.unassignedMcrCatalogProducts).toBe(mainCount);
    expect(db.siteProducts.some(row => row.enabled && row.productKey.startsWith("mcr."))).toBe(false);
  });
  it("does not mutate compiler inputs or activate candidate configuration", () => {
    const before = JSON.stringify({ sites: db.sites, siteProducts: db.siteProducts, sourceRequirements: db.sourceRequirements });
    expect(createActiveSiteAudit(db, mcrSource)).toEqual(report);
    expect(JSON.stringify({ sites: db.sites, siteProducts: db.siteProducts, sourceRequirements: db.sourceRequirements })).toBe(before);
  });
});
