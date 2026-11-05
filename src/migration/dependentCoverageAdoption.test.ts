import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { applyDependentCoverageAdoption } from "./dependentCoverageAdoption";
import { mcrSource } from "./mcr";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { reconcileDependentAmount, resolveDependentCoverage } from "../domain/dependentPolicy";
import { validateNormalizedLifeAggregate } from "../domain/normalizedCoverageAmounts";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository, effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";

const db = createReviewedMigrationDatabase();
const site = (key: string) => resolveEffectiveSite(db, key);
describe("dependent and explicit aggregate migration", () => {
  it("retains source targets and repeats without changing any approved ASCE targets", () => {
    expect(validateMigrationDatabase(db)).toEqual([]);
    const copy = structuredClone(db);
    applyDependentCoverageAdoption(copy, mcrSource.cells);
    const sorted = (value: typeof db) => Object.fromEntries(Object.entries(value).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
    expect(sorted(copy)).toEqual(sorted(db));
    const baseline = createMigrationDatabase();
    expect(db.underwritingBands.filter(row => row.siteKey === "asce")).toEqual(baseline.underwritingBands.filter(row => row.siteKey === "asce"));
  });
  it("enforces ABE spouse caps and child one-plan/dependency rules", () => {
    const abe = site("abe");
    expect(resolveDependentCoverage(abe, "li-term", "spouse", { amount: 20000, baseAmounts: { member: 20000 } })).toMatchObject({ allowed: true, maximum: 20000 });
    expect(resolveDependentCoverage(abe, "li-term", "spouse", { amount: 30000, baseAmounts: { member: 20000 } }).allowed).toBe(false);
    expect(resolveDependentCoverage(abe, "li-10yr", "spouse", { amount: 100000, baseAmounts: { member: 100000 }, coveredApplicants: [] }).allowed).toBe(false);
    expect(resolveDependentCoverage(abe, "li-10yr", "spouse", { amount: 100000, baseAmounts: { member: 100000 }, coveredApplicants: ["member"] }).allowed).toBe(true);
    expect(resolveDependentCoverage(abe, "li-term", "child", { amount: 25000, baseAmounts: { member: 20000 }, coveredApplicants: ["member"], selectedProductKeys: ["li-term"] }).allowed).toBe(false);
    expect(resolveDependentCoverage(abe, "li-10yr", "child", { amount: 5000, coveredApplicants: ["member"], selectedProductKeys: ["li-10yr", "li-20yr"] }).errors).toContain("Dependent exceeds the maximum number of life plans");
  });
  it("accepts AVMA child-only requests when either adult has the requested plan, and clears orphaned amounts", () => {
    const avma = site("avma");
    const facts = { amount: 10000, coveredApplicants: ["spouse"], selectedProductKeys: ["li-10yr"] };
    expect(resolveDependentCoverage(avma, "li-10yr", "child", facts)).toMatchObject({ allowed: true });
    expect(reconcileDependentAmount(avma, "li-10yr", "child", { ...facts, coveredApplicants: [] })).toMatchObject({ amount: null });
    expect(resolveDependentCoverage(avma, "li-10yr", "child", { ...facts, coveredApplicants: undefined })).toMatchObject({ status: "needs-information", missingFacts: ["coveredApplicants"] });
  });
  it("preserves ASCE spouse independence and source-dependent child restrictions", () => {
    const asce = site("asce");
    expect(resolveDependentCoverage(asce, "li-10yr", "spouse", { amount: 2000000, baseAmounts: { member: 100000 } })).toMatchObject({ status: "resolved", allowed: true });
    expect(resolveDependentCoverage(asce, "li-10yr", "child", { amount: 10000, coveredApplicants: ["member"], selectedProductKeys: ["li-10yr"] }).allowed).toBe(true);
    expect(resolveDependentCoverage(asce, "li-10yr", "child", { amount: 10000, coveredApplicants: [], selectedProductKeys: ["li-10yr"] }).allowed).toBe(false);
  });
  it.each(["spouse", "child"])("mirrors AMA hospital %s from the sole physician election and recalculates", applicant => {
    const ama = site("ama");
    expect(resolveDependentCoverage(ama, "sh-hospital-income", applicant, { selectedApplicants: ["member", applicant], baseAmounts: { member: 300 } })).toMatchObject({ allowed: true, derivedAmount: 300, locked: true, applicationRole: "included-benefit" });
    expect(reconcileDependentAmount(ama, "sh-hospital-income", applicant, { selectedApplicants: ["member", applicant], baseAmounts: { member: 500 }, amount: 300 })).toMatchObject({ amount: 500, locked: true });
    expect(reconcileDependentAmount(ama, "sh-hospital-income", applicant, { selectedApplicants: [applicant], baseAmounts: { member: 500 }, amount: 300 }).amount).toBeNull();
  });
  it.each([
    ["ama", "li-premier-accident", 500000, false],
    ["isitrust", "li-add", 50000, true],
    ["nso", "li-add", 100000, true],
  ])("derives %s %s family amounts and cleans stale dependent amounts", (siteKey, productKey, memberAmount, provisional) => {
    const candidate = site(String(siteKey)), baseAmounts = { member: Number(memberAmount) };
    // These cases exercise the retained general Association, separately from
    // the newly assigned ATPE amount patterns.
    const association = siteKey === "isitrust" ? { associationKey: "akron-bar-association" } : {};
    expect(resolveDependentCoverage(candidate, String(productKey), "spouse", { ...association, baseAmounts, selectedApplicants: ["member", "spouse"] })).toMatchObject({ allowed: true, derivedAmount: Number(memberAmount) * .5, provisional });
    expect(resolveDependentCoverage(candidate, String(productKey), "spouse", { ...association, baseAmounts, selectedApplicants: ["member", "spouse", "child"] })).toMatchObject({ allowed: true, derivedAmount: Number(memberAmount) * .4 });
    expect(resolveDependentCoverage(candidate, String(productKey), "child", { ...association, baseAmounts, selectedApplicants: ["member", "child"] })).toMatchObject({ allowed: true, derivedAmount: Number(memberAmount) * .15 });
    expect(reconcileDependentAmount(candidate, String(productKey), "child", { ...association, baseAmounts, selectedApplicants: ["member", "spouse", "child"], amount: Number(memberAmount) * .15 })).toMatchObject({ amount: Number(memberAmount) * .1, locked: true });
    expect(reconcileDependentAmount(candidate, String(productKey), "child", { baseAmounts: { member: 0 }, selectedApplicants: ["member", "child"], amount: 10000 }).amount).toBeNull();
    expect(reconcileDependentAmount(candidate, String(productKey), "child", { baseAmounts: { member: 12345 }, selectedApplicants: ["member", "child"], amount: 10000 }).amount).toBeNull();
  });
  it("keeps ISI message-only caps as notices and blocks WAEPA dependent spouse over 50%", () => {
    expect(resolveDependentCoverage(site("isitrust"), "sh-critical-illness", "spouse", { associationKey: "akron-bar-association", amount: 10000, baseAmounts: { member: 5000 } })).toMatchObject({ allowed: true, notices: ["Dependent amount exceeds primary coverage cap"] });
    expect(resolveDependentCoverage(site("waepa"), "li-group-term", "spouse", { amount: 200000, baseAmounts: { member: 200000 }, coveredApplicants: ["member"] }).errors).toContain("Dependent amount exceeds primary coverage cap");
  });
  it.each([
    ["abe", "li-10yr", 2000000, "li-add", 500000],
    ["ama", "li-10yr", 4000000, "li-premier-accident", 1000000],
    ["asce", "li-10yr", 2000000, "li-add", 500000],
    ["avma", "li-10yr", 2000000, "li-50plus", 100000],
    ["nso", "li-term", 500000, "li-add", 250000],
  ])("%s aggregate includes %s and excludes accident/special products", (siteKey, productKey, amount, excluded, excludedAmount) => {
    const existing = siteKey === "nso" ? 300000 : 0;
    expect(validateNormalizedLifeAggregate(site(String(siteKey)), "member", [{ productKey: String(productKey), amount: Number(amount) }, { productKey: String(excluded), amount: Number(excludedAmount) }], existing)).toMatchObject({ allowed: true, total: Number(amount) + existing });
    expect(validateNormalizedLifeAggregate(site(String(siteKey)), "member", [{ productKey: String(productKey), amount: Number(amount) }], existing + 1).allowed).toBe(false);
  });
  it("rejects bad policy revisions, invalid primary facts and source drift before mutation", () => {
    const copy = structuredClone(db);
    copy.configurationValues.find(row => row.key === "ama.li-premier-accident.reviewed-dependent-policy")!.value = { version: 2 };
    expect(resolveDependentCoverage(resolveEffectiveSite(copy, "ama"), "li-premier-accident", "child", {}).status).toBe("unresolved");
    expect(resolveDependentCoverage(site("ama"), "li-premier-accident", "child", { baseAmounts: { member: NaN }, selectedApplicants: ["member", "child"] })).toMatchObject({ status: "needs-information", allowed: false });
    const before = structuredClone(db);
    expect(() => applyDependentCoverageAdoption(before, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "H190" ? { ...cell, value: "changed" } : cell))).toThrow("Dependent source changed");
    expect(before).toEqual(db);
  });
  it("persists dependent recalculation and aggregate behavior in one revision", async () => {
    vi.stubGlobal("crypto", webcrypto);
    try {
      const revision = await createPortalDataRepository(new LocalStorageAdapter(JSON.parse(JSON.stringify(db)))).open(effectiveSiteSnapshotTables);
      const resolved = revision.resolveSite("ama");
      expect(revision.query("configurationValues", { filters: { siteKey: "ama" } }).revision).toBe(resolved.revision);
      expect(reconcileDependentAmount(resolved.site, "li-premier-accident", "spouse", { baseAmounts: { member: 750000 }, selectedApplicants: ["member", "spouse", "child"], amount: 375000 })).toMatchObject({ amount: 300000, locked: true });
      expect(validateNormalizedLifeAggregate(resolved.site, "member", [{ productKey: "li-10yr", amount: 4000000 }, { productKey: "li-premier-accident", amount: 1000000 }], 0)).toMatchObject({ allowed: true, total: 4000000 });
    } finally { vi.unstubAllGlobals(); }
  });
});
