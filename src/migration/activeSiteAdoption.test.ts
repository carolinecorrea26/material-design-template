import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { paymentSelectionAllowed } from "../domain/paymentPolicy";
import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { LocalStorageAdapter, LOCAL_DATABASE_KEY } from "../persistence/localAdapter";
import { createPortalDataRepository, effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { mcrSource } from "./mcr";
import { reviewActiveSiteIdentities } from "./activeSiteIdentity";
import { applyWaepaGiAmountAdoption, applyWaepaGiPortfolioAndPayment } from "./waepaGiAdoption";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { validateMigrationDatabase } from "./integrity";

const baseline = createMigrationDatabase();
const reviewed = createReviewedMigrationDatabase();
const giOnly = createMigrationDatabase();
applyWaepaGiAmountAdoption(giOnly, mcrSource.cells);
applyWaepaGiPortfolioAndPayment(giOnly);

describe("Step 3 explicit identity and initial adoption", () => {
  it("accounts for all enabled assignments and separates blocked and synthetic identities", () => {
    const report = reviewActiveSiteIdentities(baseline, mcrSource.cells);
    expect(report.summary).toEqual({ assignments: 70, sourceLinked: 57, blocked: 2, synthetic: 11, runtimeActivationReady: false });
    expect(report.assignments.filter(row => row.status === "blocked").map(row => row.key)).toEqual(["csea.di-ltd", "waepa-gi.di-short-term"]);
    expect(report.assignments.find(row => row.key === "avma.di-ltd-plus")?.row).toBe(193);
    expect(report.assignments.find(row => row.key === "isitrust.li-50plus")?.row).toBe(287);
    expect(report.assignments.find(row => row.key === "ama.di-level-rated")?.row).toBe(119);
    expect(report.assignments.filter(row => row.siteKey === "waepa-gi").every(row => row.row === null || row.row === 386)).toBe(true);
    expect(report.portfolioReview).toContainEqual(expect.objectContaining({ siteKey: "ama", row: 118 }));
  });
  it("finds standard CSEA evidence without adopting the ambiguous Main label or another variant", () => {
    const discovery = reviewActiveSiteIdentities(baseline, mcrSource.cells).sourceDiscoveries[0];
    expect(discovery.mainCandidateRow).toBe(246);
    expect(discovery.evidence).toContainEqual(expect.objectContaining({ reference: "URLs!A64", value: "CSEA" }));
    expect(discovery.evidence).toContainEqual(expect.objectContaining({ reference: "URLs!A63", value: "CSEAGI" }));
    expect(discovery.evidence.some(row => row.reference === "Attestation Online and PDF!C69" && String(row.value).includes("$500 and $1,000"))).toBe(true);
    expect(baseline.siteProducts.filter(row => row.siteId === "csea" && row.enabled).map(row => row.productKey)).toEqual(["di-ltd"]);
    expect(reviewed.siteProducts.filter(row => row.siteId === "csea" && row.enabled).map(row => row.productKey).sort()).toEqual(["di-ltd", "li-add"]);
    const identities = reviewActiveSiteIdentities(reviewed, mcrSource.cells);
    expect(identities.assignments.find(row => row.key === "csea.di-ltd")).toMatchObject({ status: "source-linked", row: 246, provisional: true });
    expect(identities.assignments.find(row => row.key === "csea.li-add")).toMatchObject({ status: "blocked", row: null, evidence: null });
    expect(identities.assignments.find(row => row.key === "csea.li-add")?.reason).toContain("User-confirmed October 5");
  });
  it("keeps CSEA standalone AD identifiers mock-only and separate from DI source provenance", () => {
    const csea = resolveEffectiveSite(JSON.parse(JSON.stringify(reviewed)), "csea");
    const policy = resolveCoverageJourneyPolicy(csea, "li-add")!;
    expect(policy.mappings.length).toBeGreaterThan(0);
    for (const mapping of policy.mappings) {
      expect(mapping.when.applicantKey).toBe("member");
      for (const kind of ["gNumber", "planCode"] as const) {
        const roles = mapping.identifiers[kind];
        for (const role of ["display", "rating", "issue", "xml", "pdf"] as const) expect(roles[role]).toBe(`mock:csea:li-add:${kind}`);
      }
    }
    const decision = reviewed.semanticRequirements.find(r => r.key === "provisional-decision.csea.li-add.journey-policy")!;
    expect(decision.value).toMatchObject({ sourceReferences: [], revisit: true, serviceDestination: "mock-coverage-v1" });
    expect(reviewed.semanticRequirements.find(r => r.key === "provisional-decision.csea.li-add.mock-identity")?.value).toMatchObject({ revisit: true, sourceReconciliation: "deferred" });
    expect(resolveCoverageJourneyPolicy(csea, "di-ltd")!.mappings.every(m => !m.identifiers.gNumber.display.startsWith("mock:"))).toBe(true);
  });
  it("permits approved CC and bank payments only with locked Monthly billing", () => {
    const payment = reviewed.sitePolicies.find(row => row.siteKey === "waepa-gi")!.definition.payment!;
    expect(payment.collection).toBe("required");
    expect(paymentSelectionAllowed(payment, "credit-card", "monthly")).toBe(true);
    expect(paymentSelectionAllowed(payment, "bank-account", "monthly")).toBe(true);
    expect(paymentSelectionAllowed(payment, "bill-me", "monthly")).toBe(false);
    expect(paymentSelectionAllowed(payment, "credit-card", "annual")).toBe(false);
    expect(payment.frequencyLocked).toBe(true);
    expect(reviewed.sitePolicies.find(row => row.siteKey === "waepa")).toEqual(baseline.sitePolicies.find(row => row.siteKey === "waepa"));
  });
  it("rejects unreviewed products, wrong source variants and crosswalk drift", () => {
    const changed = structuredClone(baseline);
    changed.siteProducts.push({ ...changed.siteProducts.find(row => row.enabled && row.siteId === "ama")!, id: "additional", productKey: "unexpected" });
    expect(() => reviewActiveSiteIdentities(changed, mcrSource.cells)).toThrow("Unreviewed identity assignment");
    expect(() => reviewActiveSiteIdentities(baseline, [...mcrSource.cells, mcrSource.cells.find(cell => cell.sheet === "Main")!])).toThrow("Duplicate Main source cells");
    expect(() => reviewActiveSiteIdentities(baseline, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "B386" ? { ...cell, value: "WAEPA" } : cell))).toThrow("Source Site variant mismatch");
  });
  it("does not mutate the identity inputs or adopt policies from linked rows", () => {
    const before = JSON.stringify(baseline);
    reviewActiveSiteIdentities(baseline, mcrSource.cells);
    expect(JSON.stringify(baseline)).toBe(before);
    expect(baseline.sourceRequirements.find(row => row.key === "mcr.main.H386")?.promotionState).toBe("SOURCE_ONLY");
  });
  it("resolves the GI member offer from persisted normalized rows while preserving standard WAEPA", () => {
    const roundtrip = JSON.parse(JSON.stringify(reviewed));
    const gi = resolveEffectiveSite(roundtrip, "waepa-gi").configuration.products.find(product => product.productKey === "li-group-term")!;
    const member = gi.amounts.filter(row => row.value.applicantTypeKey === "member");
    expect(member).toHaveLength(1);
    expect(member[0].amount?.status).toBe("resolved");
    expect(member[0].amount?.pattern.value).toMatchObject({ amountType: "fixed", minimum: 100000, maximum: 100000, formula: null });
    expect(gi.identifiers.find(row => row.value.scope === "site" && row.value.kind === "gNumber")?.value.definition).toEqual({ primary: "G-30280-0" });
    expect(resolveEffectiveSite(giOnly, "waepa")).toEqual(resolveEffectiveSite(baseline, "waepa"));
    expect(reviewed.siteProducts.filter(row => row.siteId === "waepa-gi" && row.enabled).map(row => row.productKey)).toEqual(["li-group-term"]);
    expect(reviewed.siteProductApplicants.filter(row => row.siteKey === "waepa-gi").map(row => row.applicantKey)).toEqual(["member"]);
    expect(gi.riders).toEqual([]);
    expect(gi.amounts.map(row => row.value.applicantTypeKey)).toEqual(["member"]);
    expect(reviewed.underwritingBands.filter(row => row.siteKey === "waepa-gi")).toEqual([expect.objectContaining({ pathway: "GI", minimumAge: 18, maximumAge: 39, minimumAmount: 100000, maximumAmount: 100000 })]);
  });
  it("records scoped provenance, exports through the existing schema and is idempotent", () => {
    expect(validateMigrationDatabase(reviewed)).toEqual([]);
    const source = reviewed.sourceRequirements.find(row => row.key === "mcr.main.H386")!;
    expect(source).toMatchObject({ promotionState: "SITE_CONFIGURATION", activeSiteKeys: ["waepa-gi"] });
    expect(reviewed.coverageAmountPatterns.some(row => row.key.includes("mcr-fixed-member-offer"))).toBe(true);
    expect(createReviewedMigrationDatabase()).toEqual(reviewed);
  });
  it("shares the adopted rows through a persisted revision without mixing fresh reads", async () => {
    vi.stubGlobal("crypto", webcrypto);
    try {
      const tables = [...new Set([...effectiveSiteSnapshotTables, "sitePolicies"] as const)];
      const stored = new Map([[LOCAL_DATABASE_KEY, JSON.stringify(Object.fromEntries(tables.map(table => [table, reviewed[table]])))]]);
      const storage = { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => { stored.set(key, value); }, removeItem: (key: string) => { stored.delete(key); } };
      const adapter = new LocalStorageAdapter(baseline, storage);
      const repository = createPortalDataRepository(adapter);
      const revision = await repository.open(tables);
      const gi = revision.resolveSite("waepa-gi");
      const pattern = revision.query("coverageAmountPatterns", { filters: { key: "waepa-gi.li-group-term.mcr-fixed-member-offer.pattern" } });
      const policy = revision.query("sitePolicies", { filters: { siteKey: "waepa-gi" } });
      expect(policy.revision).toBe(gi.revision);
      expect(paymentSelectionAllowed(policy.rows[0].definition.payment!, "credit-card", "monthly")).toBe(true);
      expect(pattern.revision).toBe(gi.revision);
      expect(pattern.rows[0]).toMatchObject({ minimum: 100000, maximum: 100000 });
      await adapter.update("sites", reviewed.sites.find(site => site.key === "waepa-gi")!.id, { name: "Edited candidate" });
      expect(revision.resolveSite("waepa-gi").site.name).toEqual(gi.site.name);
      const refreshed = await repository.open(tables);
      expect(refreshed.revision).not.toBe(revision.revision);
      expect(refreshed.resolveSite("waepa-gi").site.name.value).toBe("Edited candidate");
    } finally { vi.unstubAllGlobals(); }
  });
  it("fails before adoption if source values change or come from another campaign", () => {
    const db = structuredClone(baseline);
    const before = JSON.stringify(db);
    expect(() => applyWaepaGiAmountAdoption(db, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "H386" ? { ...cell, value: "Guaranteed Issue $250,000" } : cell))).toThrow("source mismatch");
    expect(JSON.stringify(db)).toBe(before);
  });
});
