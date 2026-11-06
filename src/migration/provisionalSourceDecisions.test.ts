import { describe, expect, it } from "vitest";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { applyProvisionalSourceDecisions } from "./provisionalSourceDecisions";
import { mcrSource } from "./mcr";
import { reviewActiveSiteIdentities } from "./activeSiteIdentity";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveEligibility, resolveEffectiveSite } from "../domain/effectiveSite";
import { resolveNormalizedRate } from "../domain/normalizedRates";
import { validateNormalizedCoverageAmount } from "../domain/normalizedCoverageAmounts";

const db = createReviewedMigrationDatabase();
describe("user-authorized provisional source choices", () => {
  it("retains disputed evidence and distinguishes provisional CSEA from the baseline", () => {
    expect(mcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === "B246")?.value).toBe("CSEA GI");
    expect(reviewActiveSiteIdentities(db, mcrSource.cells).assignments.find(row => row.key === "csea.di-ltd")).toMatchObject({ status: "source-linked", row: 246, provisional: true });
    expect(reviewActiveSiteIdentities(createMigrationDatabase(), mcrSource.cells).assignments.find(row => row.key === "csea.di-ltd")?.status).toBe("blocked");
    expect(validateMigrationDatabase(db)).toEqual([]);
  });
  it("enforces provisional ages, work hours and child ages without a student extension", () => {
    for (const [siteKey, productKey, applicantKey] of [["nso", "di-ltd", "member"], ["avma", "li-20yr", "member"], ["avma", "li-20yr", "spouse"]]) {
      const site = resolveEffectiveSite(db, siteKey);
      const facts = { ageYears: 59, workHoursPerWeek: 20, selectedPlans: [{ applicantKey: "member", categoryKey: "life", productKey }] };
      expect(resolveEffectiveEligibility(site, productKey, applicantKey, facts)).toMatchObject({ status: "resolved", eligible: true });
      expect(resolveEffectiveEligibility(site, productKey, applicantKey, { ...facts, ageYears: 60 })).toMatchObject({ status: "resolved", eligible: false });
      if (siteKey === "nso") expect(resolveEffectiveEligibility(site, productKey, applicantKey, { ...facts, workHoursPerWeek: 19 })).toMatchObject({ eligible: false });
    }
    const ama = resolveEffectiveSite(db, "ama");
    const child = { membershipType: "physician", ageYears: 26, ageDays: 9500, selectedPlans: [{ applicantKey: "member", categoryKey: "life", productKey: "li-preferred" }] };
    expect(resolveEffectiveEligibility(ama, "li-preferred", "child", child)).toMatchObject({ status: "resolved", eligible: true });
    expect(resolveEffectiveEligibility(ama, "li-preferred", "child", { ...child, ageYears: 27, fullTimeStudent: true })).toMatchObject({ eligible: false });
    expect(resolveEffectiveEligibility(ama, "li-preferred", "child", { ...child, ageYears: 0, ageDays: 13 })).toMatchObject({ eligible: false });
    expect(resolveEffectiveEligibility(ama, "li-preferred", "child", { ...child, ageYears: 0, ageDays: 14 })).toMatchObject({ eligible: true });
  });
  it("uses ISI recorded ranges and excludes child coverage", () => {
    const site = resolveEffectiveSite(db, "isitrust");
    for (const applicant of ["member", "spouse"]) {
      for (const amount of [5000, 10000, 100000]) expect(validateNormalizedCoverageAmount(site, "sh-critical-illness", applicant, amount, undefined, "akron-bar-association").allowed).toBe(true);
      for (const amount of [4999, 5001, 105000]) expect(validateNormalizedCoverageAmount(site, "sh-critical-illness", applicant, amount, undefined, "akron-bar-association").allowed).toBe(false);
    }
    expect(validateNormalizedCoverageAmount(site, "sh-critical-illness", "child", 5000).allowed).toBe(false);
  });
  it("persists explicit unavailable rates and revisit records after serialization", () => {
    const copy = JSON.parse(JSON.stringify(db));
    copy.semanticRequirements.reverse();
    for (const siteRow of copy.sites) {
      const site = resolveEffectiveSite(copy, siteRow.key);
      expect(site).toEqual(resolveEffectiveSite(db, siteRow.key));
      if (siteRow.key === "demo") { expect(site.provisionalDecisions).toEqual([]); continue; }
      expect(site.provisionalDecisions.length).toBeGreaterThan(0);
      for (const decision of site.provisionalDecisions) {
        if (decision.key === "provisional-decision.isitrust.st-louis-affiliation") expect(decision.value).toMatchObject({ revisit: true, sourceReconciliation: "pending", selected: "Preserve existing assignment provisionally" });
        else if ((decision.value as { sourceReconciliation?: string }).sourceReconciliation === "superseded") expect(decision.value).toMatchObject({ sourceReconciliation: "superseded", runtimeActivation: "superseded", supersededBy: expect.any(String) });
        else expect(decision.value).toMatchObject({ revisit: true, sourceReconciliation: "deferred", runtimeActivation: "pending" });
      }
      for (const product of site.configuration.products) expect(resolveNormalizedRate(site, product.productKey)).toMatchObject({ status: "unavailable", amount: null, displayPrice: false, provisional: true, revisit: true });
    }
    expect(db.configurationValues.find(row => row.key === "nso.li-term.provisional-billing-fee")?.value).toMatchObject({ billMeFee: 0, revisit: true });
    expect(db.configurationValues.find(row => row.key === "ama.li-term.provisional-term-credit")?.value).toMatchObject({ premiumCredit: 0, revisit: true });
  });
  it("rejects changed evidence before mutation and repeats deterministically", () => {
    const copy = structuredClone(db);
    expect(() => applyProvisionalSourceDecisions(copy, mcrSource.cells.map(cell => cell.cell === "O321" && cell.sheet === "Main" ? { ...cell, value: "changed" } : cell))).toThrow("Provisional source changed");
    expect(copy).toEqual(db);
    applyProvisionalSourceDecisions(copy, mcrSource.cells);
    const sorted = (database: typeof db) => Object.fromEntries(Object.entries(database).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
    expect(sorted(copy)).toEqual(sorted(db));
  });
});
