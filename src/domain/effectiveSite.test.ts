import { webcrypto } from "node:crypto";
import { effectiveConfigurationTables } from "./effectiveConfiguration";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createMigrationDatabase } from "../migration/fixtures";
import type { DatabaseSchema } from "../persistence/types";
import { resolveEffectiveSite, resolveEffectiveEligibility, resolveEffectiveUnderwriting } from "./effectiveSite";
import { createEffectiveSiteRepository } from "../repositories/effectiveSiteRepository";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { staticSiteAdapter } from "../repositories/staticSiteAdapter";
import { createSiteRepository } from "../repositories/siteRepository";
import { resolveClientCoverage } from "../config/resolvers";
import { resolveUnderwritingBand } from "./coverageRequirements";

let db: DatabaseSchema;
beforeAll(() => { vi.stubGlobal("crypto", webcrypto); db = createMigrationDatabase(); });
const candidate = () => resolveEffectiveSite(db, "asce");
describe("Phase 6A candidate resolution", () => {
  for (const [product, maximum, older] of [["li-10yr", 69, 65], ["li-20yr", 59, 55]] as const) {
    for (const applicant of ["member", "spouse"] as const) {
      it(`${product}/${applicant} enforces inclusive approved ages and older FUW amounts`, () => {
        const site = candidate();
        for (const age of [17, 18, older - 1, older, maximum, maximum + 1]) {
          expect(resolveEffectiveEligibility(site, product, applicant, age)).toMatchObject({ status: "resolved", eligible: age >= 18 && age <= maximum });
        }
        for (let age = older; age <= maximum; age++) for (const amount of [100000, 500000, 500001, 2000000]) {
          const result = resolveEffectiveUnderwriting(site, product, applicant, age, amount);
          expect(result).toMatchObject({ status: "resolved", pathway: "FUW" });
          expect(result.provenance.some(p => p.approvalKey?.includes("underwriting"))).toBe(true);
        }
        for (const amount of [99999, 2000001]) expect(resolveEffectiveUnderwriting(site, product, applicant, older, amount).status).toBe("unresolved");
        expect(resolveEffectiveUnderwriting(site, product, applicant, maximum + 1, 100000).status).toBe("ineligible");
      });
      it(`${product}/${applicant} preserves all documented prototype bands`, () => {
        const config = createSiteRepository(staticSiteAdapter).getEffectiveSiteConfig("asce");
        const legacy = resolveClientCoverage(config).find(p => p.id === product)!.effective;
        const site = candidate();
        for (let age = 18; age < older; age++) for (const amount of [100000, 499999, 500000, 500001, 2000000]) {
          const expected = resolveUnderwritingBand(legacy, applicant, age, amount);
          expect(expected?.status).toBe("documented");
          expect(resolveEffectiveUnderwriting(site, product, applicant, age, amount)).toMatchObject({ status: "resolved", pathway: expected!.underwritingType });
        }
      });
    }
  }
  it("preserves enabled product and applicant assignments for all ten Sites", () => {
    const repository = createSiteRepository(staticSiteAdapter);
    for (const [, key] of staticSiteAdapter.read().aliases) {
      const site = resolveEffectiveSite(db, key);
      const legacy = resolveClientCoverage(repository.getEffectiveSiteConfig(key)).filter(p => p.status !== "disabled");
      expect(site.products.map(p => p.productKey).sort()).toEqual(legacy.map(p => p.id).sort());
      for (const product of site.products) expect(product.applicants.map(a => a.applicantKey)).toEqual(legacy.find(p => p.id === product.productKey)!.effective.applicants);
      expect(site.runtimeActivation).toBe("pending-phase-6");
    }
  });
  it("is deterministic across row order and does not retain input references", () => {
    const expected = candidate();
    const reordered = { ...db, sites: [...db.sites].reverse(), siteProducts: [...db.siteProducts].reverse(), siteProductApplicants: [...db.siteProductApplicants].reverse(), underwritingBands: [...db.underwritingBands].reverse() };
    expect(resolveEffectiveSite(reordered, "asce")).toEqual(expected);
    expected.products[0].productKey = "changed";
    expect(candidate().products[0].productKey).not.toBe("changed");
  });
  it("never defaults missing, invalid or unsupported facts to a pathway", () => {
    const site = candidate();
    for (const age of [undefined, NaN, Infinity, -1, 18.5]) expect(resolveEffectiveUnderwriting(site, "li-10yr", "member", age, 100000).status).toBe("needs-information");
    for (const amount of [undefined, NaN, Infinity, -1, 0]) expect(resolveEffectiveUnderwriting(site, "li-10yr", "member", 65, amount).status).toBe("needs-information");
    for (const [product, applicant] of [["li-10yr", "child"], ["li-15yr", "member"], ["missing", "member"]]) expect(resolveEffectiveUnderwriting(site, product, applicant, 65, 100000).status).toBe("unresolved");
  });
  it("rejects missing or changed approval evidence and canonical targets", () => {
    for (const decision of db.semanticRequirements.filter(r => r.domain === "approved-business-decision")) {
      expect(() => resolveEffectiveSite({ ...db, semanticRequirements: db.semanticRequirements.filter(r => r.key !== decision.key) }, "asce")).toThrow("Unapproved");
      expect(() => resolveEffectiveSite({ ...db, semanticRequirements: [...db.semanticRequirements, decision] }, "asce")).toThrow("Unapproved");
    }
    const changed = db.eligibilityConstraints.map(r => r.key.includes("approved-eligibility") ? { ...r, maximumAgeYears: 70 } : r);
    expect(() => resolveEffectiveSite({ ...db, eligibilityConstraints: changed }, "asce")).toThrow("Unapproved");
    const bands = db.underwritingBands.map(r => r.key === "asce.li-10yr.3" ? { ...r, pathway: "QD" } : r);
    expect(() => resolveEffectiveSite({ ...db, underwritingBands: bands }, "asce")).toThrow("Unapproved");
  });
  it("rejects ambiguous rules and unsupported conditions", () => {
    const band = db.underwritingBands.find(r => r.key === "asce.li-10yr.0")!;
    expect(() => resolveEffectiveSite({ ...db, underwritingBands: [...db.underwritingBands, { ...band, id: "extra", key: "extra" }] }, "asce")).toThrow("Overlapping");
    expect(() => resolveEffectiveSite({ ...db, underwritingBands: db.underwritingBands.map(r => r === band ? { ...r, conditionKey: "unknown" } : r) }, "asce")).toThrow("Unsupported");
    const rule = db.eligibilityConstraints.find(r => r.key.includes("approved-eligibility"))!;
    expect(() => resolveEffectiveSite({ ...db, eligibilityConstraints: [...db.eligibilityConstraints, { ...rule, key: "extra", id: "extra" }] }, "asce")).toThrow("Ambiguous");
  });
  it("rejects unavailable Sites, missing Clients and duplicate assignments", () => {
    expect(() => resolveEffectiveSite(db, "missing")).toThrow("Unavailable Site");
    expect(() => resolveEffectiveSite({ ...db, clients: [] }, "asce")).toThrow("Unavailable Client");
    expect(() => resolveEffectiveSite({ ...db, sites: db.sites.map(s => ({ ...s, status: "inactive" })) }, "asce")).toThrow("Unavailable Site");
    expect(() => resolveEffectiveSite({ ...db, siteProducts: [...db.siteProducts, db.siteProducts.find(p => p.siteId === "asce")!] }, "asce")).toThrow("Duplicate");
  });
  it("reads only persisted normalized inputs, refreshes reads, propagates failures", async () => {
    const adapter = new LocalStorageAdapter(db);
    const allowed = new Set([...effectiveConfigurationTables, "sites", "clients", "siteProducts", "siteProductApplicants", "eligibilityConstraints", "underwritingBands", "semanticRequirements", "associations", "siteAssociations", "sitePolicies"]);
    const snapshot = adapter.readSnapshot.bind(adapter);
    adapter.readSnapshot = async tables => { for (const table of tables) if (!allowed.has(table)) throw new Error(`Forbidden: ${table}`); return snapshot(tables); };
    const repository = createEffectiveSiteRepository(adapter);
    expect(await repository.resolve("asce")).toEqual(candidate());
    const site = db.sites.find(s => s.key === "asce")!;
    await adapter.update("sites", site.id, { name: "Persisted name" });
    expect((await repository.resolve("asce")).name.value).toBe("Persisted name");
    const approval = db.semanticRequirements.find(r => r.domain === "approved-business-decision")!;
    await adapter.remove("semanticRequirements", approval.id);
    await expect(repository.resolve("asce")).rejects.toThrow("Unapproved");
    adapter.readSnapshot = async () => { throw new Error("transport failure"); };
    await expect(repository.resolve("asce")).rejects.toThrow("transport failure");
  });
});
