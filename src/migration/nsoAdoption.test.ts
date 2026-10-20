import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { applyNsoLifeAndPaymentAdoption } from "./nsoAdoption";
import { mcrSource } from "./mcr";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { validateNormalizedCoverageAmount, validateNormalizedLifeAggregate } from "../domain/normalizedCoverageAmounts";
import { paymentSelectionAllowed, reconcilePaymentSelection } from "../domain/paymentPolicy";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository, effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";

const baseline = createMigrationDatabase();
const reviewed = createReviewedMigrationDatabase();
const site = resolveEffectiveSite(reviewed, "nso");

describe("NSO reviewed life amounts and payment", () => {
  it.each([
    ["li-term", 25000, 500000, 25000], ["li-50plus", 10000, 100000, 10000],
    ["li-10yr", 50000, 200000, 50000], ["li-20yr", 50000, 200000, 50000],
  ] as const)("validates %s member and spouse boundaries/increments from normalized rows", (product, minimum, maximum, increment) => {
    for (const applicant of ["member", "spouse"]) {
      for (const amount of [minimum, minimum + increment, maximum]) expect(validateNormalizedCoverageAmount(site, product, applicant, amount)).toMatchObject({ status: "resolved", allowed: true });
      for (const amount of [minimum - 1, minimum + 1, maximum + increment, NaN, Infinity, 0]) expect(validateNormalizedCoverageAmount(site, product, applicant, amount).allowed).toBe(false);
    }
  });
  it("fixes child benefits at $5,000 for both term lengths and removes unsupported child assignments", () => {
    for (const product of ["li-10yr", "li-20yr"]) {
      expect(validateNormalizedCoverageAmount(site, product, "child", 5000)).toMatchObject({ status: "resolved", allowed: true });
      for (const amount of [4999, 5001, 10000]) expect(validateNormalizedCoverageAmount(site, product, "child", amount).allowed).toBe(false);
      const rule = reviewed.eligibilityConstraints.find(rule => rule.siteKey === "nso" && rule.productKey === product && rule.applicantTypeKey === "child")!;
      expect(rule).toMatchObject({ minimumAgeDays: 15, maximumAgeYears: 18, studentMaximumAgeYears: 25 });
    }
    for (const product of ["li-term", "li-50plus"]) expect(validateNormalizedCoverageAmount(site, product, "child", 5000)).toMatchObject({ allowed: false, reason: "Product or applicant is unavailable" });
  });
  it("enforces the $800,000 life aggregate including explicitly supplied existing coverage", () => {
    const selected = [{ productKey: "li-term", amount: 500000 }, { productKey: "li-10yr", amount: 200000 }];
    for (const applicant of ["member", "spouse"]) {
      expect(validateNormalizedLifeAggregate(site, applicant, selected, 100000)).toMatchObject({ status: "resolved", allowed: true, total: 800000, maximum: 800000 });
      expect(validateNormalizedLifeAggregate(site, applicant, selected, 100001)).toMatchObject({ status: "resolved", allowed: false, total: 800001 });
      expect(validateNormalizedLifeAggregate(site, applicant, selected)).toMatchObject({ status: "needs-information", allowed: false });
      expect(validateNormalizedLifeAggregate(site, applicant, [...selected, selected[0]], 0)).toMatchObject({ status: "unresolved", allowed: false });
    }
    expect(validateNormalizedLifeAggregate(site, "member", [{ productKey: "li-10yr", amount: 50001 }], 0).allowed).toBe(false);
    expect(validateNormalizedLifeAggregate(site, "member", selected, NaN).allowed).toBe(false);
    expect(validateNormalizedLifeAggregate(site, "child", [{ productKey: "li-10yr", amount: 5000 }, { productKey: "li-20yr", amount: 5000 }], 0)).toMatchObject({ allowed: true, total: 10000 });
  });
  it("refuses conditional amounts and aggregate policies that have not been executed", () => {
    const changed = structuredClone(reviewed);
    changed.productAmountRules.find(rule => rule.siteKey === "nso" && rule.productKey === "li-10yr" && rule.applicantTypeKey === "child")!.conditionKey = "unsupported-condition";
    const candidate = resolveEffectiveSite(changed, "nso");
    expect(validateNormalizedCoverageAmount(candidate, "li-10yr", "child", 5000)).toMatchObject({ status: "unresolved", allowed: false });
    changed.configurationValues.find(rule => rule.key === "nso.reviewed-life-aggregate")!.value = { version: 2, formula: "unreviewed formula" };
    expect(validateNormalizedLifeAggregate(resolveEffectiveSite(changed, "nso"), "member", [{ productKey: "li-term", amount: 25000 }], 0)).toMatchObject({ status: "unresolved", allowed: false });
  });
  it("requires a valid Bill Me frequency and clears Monthly when switching from Bank", () => {
    const payment = reviewed.sitePolicies.find(row => row.siteKey === "nso")!.definition.payment!;
    expect(payment).toMatchObject({ collection: "required", defaultMethod: "bill-me", defaultFrequency: null, synchronizeAcrossProducts: true });
    expect(paymentSelectionAllowed(payment, "bill-me", "monthly")).toBe(false);
    expect(paymentSelectionAllowed(payment, "bank-account", "monthly")).toBe(true);
    expect(paymentSelectionAllowed(payment, "credit-card", "monthly")).toBe(false);
    expect(reconcilePaymentSelection(payment, "bill-me", "monthly")).toEqual({ method: "bill-me", frequency: null });
    expect(reconcilePaymentSelection(payment, "bill-me", "annual")).toEqual({ method: "bill-me", frequency: "annual" });
    expect(reconcilePaymentSelection(payment, null, null)).toEqual({ method: "bill-me", frequency: null });
  });
  it("keeps unrelated Sites and the pending DI/family AD&D policy unchanged", () => {
    const isolated = structuredClone(baseline);
    applyNsoLifeAndPaymentAdoption(isolated, mcrSource.cells);
    const isolatedSite = resolveEffectiveSite(isolated, "nso");
    expect(resolveEffectiveSite(isolated, "csea")).toEqual(resolveEffectiveSite(baseline, "csea"));
    for (const product of ["di-ltd", "li-add"]) {
      expect(isolatedSite.configuration.products.find(row => row.productKey === product)).toEqual(resolveEffectiveSite(baseline, "nso").configuration.products.find(row => row.productKey === product));
    }
    expect(reviewed.siteProducts.filter(row => row.siteId === "nso")).toEqual(baseline.siteProducts.filter(row => row.siteId === "nso"));
    expect(validateNormalizedCoverageAmount(site, "not-a-product", "member", 5000).allowed).toBe(false);
  });
  it("retains source targets, passes integrity, and repeats deterministically", () => {
    expect(validateMigrationDatabase(reviewed)).toEqual([]);
    expect(reviewed.sourceRequirements.find(row => row.key === "mcr.main.J322")).toMatchObject({ promotionState: "SITE_CONFIGURATION", activeSiteKeys: ["nso"] });
    const copy = structuredClone(reviewed);
    applyNsoLifeAndPaymentAdoption(copy, mcrSource.cells);
    const sorted = (db: typeof reviewed) => Object.fromEntries(Object.entries(db).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
    expect(sorted(copy)).toEqual(sorted(reviewed));
  });
  it("rejects changed fixed amounts before writing and reads adopted rows from one persisted revision", async () => {
    const copy = structuredClone(baseline);
    const before = JSON.stringify(copy);
    expect(() => applyNsoLifeAndPaymentAdoption(copy, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "J322" ? { ...cell, value: 10000 } : cell))).toThrow("child source changed");
    expect(JSON.stringify(copy)).toBe(before);
    vi.stubGlobal("crypto", webcrypto);
    try {
      const tables = [...new Set([...effectiveSiteSnapshotTables, "sitePolicies"] as const)];
      const revision = await createPortalDataRepository(new LocalStorageAdapter(JSON.parse(JSON.stringify(reviewed)))).open(tables);
      const resolved = revision.resolveSite("nso");
      const payment = revision.query("sitePolicies", { filters: { siteKey: "nso" } });
      expect(payment.revision).toBe(resolved.revision);
      expect(validateNormalizedCoverageAmount(resolved.site, "li-20yr", "child", 5000).allowed).toBe(true);
      expect(paymentSelectionAllowed(payment.rows[0].definition.payment!, "bill-me", "monthly")).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });
});
