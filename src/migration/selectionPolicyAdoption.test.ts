import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { isSelectionPolicy, reconcileCoverageSelection, resolveNormalizedSelection, type SelectionPolicy } from "../domain/coverageSelectionPolicy";
import { resolveNormalizedBenefit } from "../domain/benefitPolicy";
import { validateMigrationDatabase } from "./integrity";

const db = createReviewedMigrationDatabase();
const waepa = resolveEffectiveSite(db, "waepa");
const p = waepa.configuration.products.find(p => p.productKey === "li-group-term")!.selectionPolicies[0].value as SelectionPolicy;
it("captures executable selection contracts across all ten active Sites after JSON persistence", () => {
  const stored = JSON.parse(JSON.stringify(db));
  for (const scope of activeSiteMigrationScope.sites) {
    const site = resolveEffectiveSite(stored, scope.key);
    for (const product of site.configuration.products) {
      expect(product.selectionPolicies).toHaveLength(1);
      expect(isSelectionPolicy(product.selectionPolicies[0].value)).toBe(true);
    }
  }
  expect(validateMigrationDatabase(stored)).toEqual([]);
});
it("requires verified existing policy and zero new base coverage for WAEPA rider-only", () => {
  const rider = p.riders.find(r => r.key === "rider.waepa.r34")!.key;
  const facts = { mode: "rider-only" as const, applicantKey: "member", baseAmount: 0, existingAmount: 100000, jurisdiction: "US-VA", ageYears: 40 };
  const election = { riders: [rider], riderAmounts: { orphan: 123 } };
  expect(resolveNormalizedSelection(waepa, "li-group-term", facts, election)).toMatchObject({ status: "needs-information", allowed: false });
  expect(resolveNormalizedSelection(waepa, "li-group-term", { ...facts, existingPolicyVerified: true }, election)).toMatchObject({ allowed: true, skipBeneficiary: true, skipPayment: true, healthRequired: true, election: { riders: [rider], riderAmounts: {} } });
  expect(reconcileCoverageSelection(p, { ...facts, baseAmount: 100000, existingPolicyVerified: true }, election).allowed).toBe(false);
  expect(reconcileCoverageSelection(p, { ...facts, jurisdiction: "US-NY", existingPolicyVerified: true }, election).allowed).toBe(false);
});
it("derives the provisional child schedule on boundaries and rejects unsupported ages", () => {
  const facts = { mode: "new" as const, applicantKey: "child", baseAmount: 10000, memberAmount: 100000, spouseAmount: 0, ageYears: 25, onlyChild: true };
  for (const [childAgeDays, childAmount] of [[182, 1000], [183, 10000], [9496, 10000]]) expect(reconcileCoverageSelection(p, { ...facts, childAgeDays }, { riders: [], riderAmounts: {} })).toMatchObject({ allowed: true, childAmount, skipPayment: true });
  expect(reconcileCoverageSelection(p, { ...facts, childAgeDays: 9497 }, { riders: [], riderAmounts: {} }).allowed).toBe(false);
  expect(reconcileCoverageSelection(p, facts, { riders: [], riderAmounts: {} }).status).toBe("needs-information");
});
it("uses resulting totals for increases and does not silently accept decreases", () => {
  const facts = { mode: "increase" as const, applicantKey: "member", existingPolicyVerified: true, existingAmount: 100000, baseAmount: 100000, jurisdiction: "US-VA", ageYears: 40 };
  expect(reconcileCoverageSelection(p, facts, { riders: [], riderAmounts: {} }).allowed).toBe(false);
  expect(reconcileCoverageSelection(p, { ...facts, baseAmount: 125000 }, { riders: [], riderAmounts: {} }).allowed).toBe(true);
});
it("clears invalid dependency chains and recalculates locked caps idempotently", () => {
  const policy: SelectionPolicy = { ...p, childSchedule: null, riders: [
    { key: "base", applicants: ["member"], included: false, minimumBase: 50000, maximumAge: 60, requires: [], incompatible: [], amount: { kind: "base-multiplier", multiplier: .5, maximum: 25000 }, excludedJurisdictions: [] },
    { key: "dependent", applicants: ["member"], included: false, minimumBase: 0, maximumAge: null, requires: ["base"], incompatible: [], amount: { kind: "fixed", value: 1000 }, excludedJurisdictions: [] },
  ] };
  const facts = { mode: "new" as const, applicantKey: "member", baseAmount: 100000, ageYears: 60 };
  const a = reconcileCoverageSelection(policy, facts, { riders: ["base", "dependent", "unknown"], riderAmounts: { base: 90000, unknown: 100 } });
  expect(a.election).toEqual({ riders: ["base", "dependent"], riderAmounts: { base: 25000, dependent: 1000 } });
  expect(reconcileCoverageSelection(policy, facts, a.election)).toEqual(a);
  expect(reconcileCoverageSelection(policy, { ...facts, ageYears: 61 }, a.election).election).toEqual({ riders: [], riderAmounts: {} });
  policy.riders[0].requires = ["dependent"];
  expect(isSelectionPolicy(policy)).toBe(false);
});
it("makes CSEA occupation benefit differences explicit working choices and recalculates income caps", () => {
  const site = resolveEffectiveSite(db, "csea");
  expect(resolveNormalizedBenefit(site, "di-ltd", "member", { applicantClass: "clerical", monthlyIncome: 4000, amount: 2000 })).toMatchObject({ allowed: true, maximum: 2000, provisional: true });
  expect(resolveNormalizedBenefit(site, "di-ltd", "member", { applicantClass: "non-clerical", monthlyIncome: 4000, amount: 2300 })).toMatchObject({ allowed: true, maximum: 2400, provisional: true });
  expect(resolveNormalizedBenefit(site, "di-ltd", "member", { monthlyIncome: 4000, existingMonthlyBenefit: 0 }).allowed).toBe(false);
});
it("rejects mutated persisted selection versions", () => {
  const copy = structuredClone(db);
  copy.configurationValues.find(v => v.key === "waepa.li-group-term.selection-policy")!.value = { version: 9 };
  expect(validateMigrationDatabase(copy).some(e => e.includes("Invalid executable selection"))).toBe(true);
  expect(resolveNormalizedSelection(resolveEffectiveSite(copy, "waepa"), "li-group-term", { mode: "new", applicantKey: "member", baseAmount: 100000 }, { riders: [], riderAmounts: {} })).toMatchObject({ allowed: false, status: "unresolved" });
});

it("keeps CSEA AD&D independent of DI dependent benefits", () => {
  const site = resolveEffectiveSite(db, "csea"), facts = { mode: "new" as const, applicantKey: "member", baseAmount: 2000 };
  expect(resolveNormalizedSelection(site, "di-ltd", facts, { riders: [], riderAmounts: {} })).toMatchObject({ allowed: true, election: { riders: [], riderAmounts: {} } });
  expect(site.products.find(p => p.productKey === "li-add")?.applicants.map(a => a.applicantKey)).toEqual(["member"]);
});
