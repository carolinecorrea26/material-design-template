import { describe, expect, it, vi } from "vitest";
import { webcrypto } from "node:crypto";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { applyDisabilityBenefitAdoption, disabilityBenefitSlices } from "./disabilityBenefitAdoption";
import { consolidateAmountOwnership } from "./amountOwnership";
import { mcrSource } from "./mcr";
import { validateMigrationDatabase } from "./integrity";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { isBenefitPolicy, reconcileBenefitSelection, resolveNormalizedBenefit, type BenefitFacts } from "../domain/benefitPolicy";
import { LocalStorageAdapter } from "../persistence/localAdapter";
import { createPortalDataRepository, effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";

const db = createReviewedMigrationDatabase();
const sites = new Map(disabilityBenefitSlices.map(slice => [slice.siteKey, resolveEffectiveSite(db, slice.siteKey)]));
const resolve = (siteKey: string, productKey: string, facts: BenefitFacts, applicant = "member") => resolveNormalizedBenefit(sites.get(siteKey)!, productKey, applicant, facts);
const abeFacts = { ageYears: 40, monthlyIncome: 10000, existingMonthlyBenefit: 0, otherMonthlyBenefits: { "di-ltd-plus": 0, "di-mtd": 0 }, selectedProducts: ["di-ltd"], retirement: false };

describe("persisted disability and overhead benefit dimensions", () => {
  it("has valid policies, canonical relationships, source targets and deterministic compilation", () => {
    expect(disabilityBenefitSlices).toHaveLength(17);
    expect(validateMigrationDatabase(db)).toEqual([]);
    for (const slice of disabilityBenefitSlices) expect(isBenefitPolicy(slice.policy)).toBe(true);
    const copy = structuredClone(db);
    applyDisabilityBenefitAdoption(copy, mcrSource.cells);
    consolidateAmountOwnership(copy);
    const sorted = (value: typeof db) => Object.fromEntries(Object.entries(value).map(([table, rows]) => [table, [...rows].sort((a, b) => a.id.localeCompare(b.id))]));
    expect(sorted(copy)).toEqual(sorted(db));
  });
  it.each([[1000, 600], [8000, 4800], [100000, 5000]])("NSO income %s limits new benefit to %s", (monthlyIncome, maximum) => {
    expect(resolve("nso", "di-ltd", { ageYears: 40, monthlyIncome, amount: maximum, waitingPeriod: "60-days", benefitPeriod: "5-years" })).toMatchObject({ status: "resolved", allowed: true, maximum });
    expect(resolve("nso", "di-ltd", { ageYears: 40, monthlyIncome, amount: maximum + 100 }).allowed).toBe(false);
  });
  it("requires income, rejects nonfinite inputs, and clears stale NSO elections", () => {
    for (const monthlyIncome of [undefined, NaN, Infinity, -1]) expect(resolve("nso", "di-ltd", { ageYears: 40, monthlyIncome })).toMatchObject({ status: "needs-information", allowed: false, missingFacts: ["monthlyIncome"] });
    expect(reconcileBenefitSelection(sites.get("nso")!, "di-ltd", "member", { ageYears: 40, monthlyIncome: 1000, amount: 2000, waitingPeriod: "14-days", benefitPeriod: "career" })).toMatchObject({ amount: null, waitingPeriod: null, benefitPeriod: null });
    expect(resolve("nso", "di-ltd", { ageYears: 60, monthlyIncome: 10000 }).allowed).toBe(false);
    expect(resolve("nso", "di-ltd", { ageYears: 40, monthlyIncome: 10000 }, "spouse")).toMatchObject({ status: "resolved", allowed: false });
  });
  it("executes both ABE threshold conventions, existing coverage, exclusions and retirement exemption", () => {
    expect(resolve("abe", "di-ltd", { ...abeFacts, monthlyIncome: 7499 }).maximum).toBe(4900);
    expect(resolve("abe", "di-ltd", { ...abeFacts, monthlyIncome: 7500 }).maximum).toBe(4500);
    expect(resolve("abe", "di-ltd", { ...abeFacts, monthlyIncome: 7501 }).maximum).toBe(4500);
    expect(resolve("abe", "di-ltd", { ...abeFacts, existingMonthlyBenefit: 1000, otherMonthlyBenefits: { "di-ltd-plus": 0, "di-mtd": 2000 } })).toMatchObject({ allowed: true, maximum: 3000 });
    expect(resolve("abe", "di-ltd", { ...abeFacts, selectedProducts: ["di-ltd", "di-ltd-plus"] }).allowed).toBe(false);
    expect(resolve("abe", "di-ltd", { ageYears: 40, retirement: true, selectedProducts: ["di-ltd"], amount: 3500 })).toMatchObject({ allowed: true, minimum: 1000, maximum: 3500 });
    expect(resolve("abe", "di-ltd", { ...abeFacts, otherMonthlyBenefits: undefined })).toMatchObject({ status: "needs-information", missingFacts: ["otherMonthlyBenefits"] });
  });
  it("caps ABE spouse by nine times requested member benefit and total member DI", () => {
    const facts = { ...abeFacts, monthlyIncome: 20000, memberCoverage: true, memberRequestedBenefit: 100, memberTotalMonthlyBenefit: 2000 };
    expect(resolve("abe", "di-ltd", facts, "spouse")).toMatchObject({ allowed: true, maximum: 900 });
    expect(resolve("abe", "di-ltd", { ...facts, memberRequestedBenefit: 1000, memberTotalMonthlyBenefit: 800 }, "spouse").maximum).toBe(800);
    expect(resolve("abe", "di-ltd", { ...facts, memberCoverage: false }, "spouse").allowed).toBe(false);
  });
  it("requires AMA class and exempts residents from financial underwriting while retaining aggregate limits", () => {
    expect(resolve("ama", "di-level-rated", { ageYears: 30 })).toMatchObject({ status: "needs-information", missingFacts: ["applicantClass"] });
    expect(resolve("ama", "di-level-rated", { ageYears: 39, applicantClass: "resident", existingMonthlyBenefit: 0, otherMonthlyBenefits: { "di-step-rated": 0 }, amount: 5000 })).toMatchObject({ allowed: true, maximum: 5000 });
    expect(resolve("ama", "di-level-rated", { ageYears: 40, applicantClass: "resident", existingMonthlyBenefit: 0, otherMonthlyBenefits: { "di-step-rated": 0 } }).allowed).toBe(false);
    expect(resolve("ama", "di-level-rated", { ageYears: 54, applicantClass: "practicing", monthlyIncome: 60000, existingMonthlyBenefit: 10000, otherMonthlyBenefits: { "di-step-rated": 0 } })).toMatchObject({ allowed: true, maximum: 5000 });
    expect(resolve("ama", "di-level-rated", { ageYears: 55, applicantClass: "practicing", monthlyIncome: 60000, existingMonthlyBenefit: 0, otherMonthlyBenefits: { "di-step-rated": 0 } }).maximum).toBe(5000);
    expect(resolve("ama", "di-level-rated", { ageYears: 40, applicantClass: "retired" })).toMatchObject({ allowed: false, errors: ["Applicant or class is unavailable"] });
  });
  it("locks ASCE first-year self-employed waiting and benefit periods, and releases them at one year", () => {
    const site = sites.get("asce")!;
    const facts = { ageYears: 40, monthlyIncome: 10000, selfEmployed: true, selfEmployedYears: .99, amount: 2100, waitingPeriod: "30-days", benefitPeriod: "career" };
    expect(resolveNormalizedBenefit(site, "di-ltd", "member", facts)).toMatchObject({ maximum: 1050, allowed: false, benefitPeriods: ["5-years"] });
    expect(reconcileBenefitSelection(site, "di-ltd", "member", facts)).toMatchObject({ amount: null, waitingPeriod: "90-days", benefitPeriod: "5-years" });
    expect(resolveNormalizedBenefit(site, "di-ltd", "member", { ...facts, selfEmployedYears: 1 })).toMatchObject({ maximum: 6000, allowed: true, benefitPeriods: ["5-years", "career"] });
    expect(resolveNormalizedBenefit(site, "di-ltd", "member", { ...facts, selfEmployed: false, selfEmployedYears: undefined })).toMatchObject({ maximum: 6000, allowed: true });
    expect(resolveNormalizedBenefit(site, "di-ltd", "member", { ageYears: 65, monthlyIncome: 20000, selfEmployed: false })).toMatchObject({ maximum: 4200, allowed: true });
    expect(reconcileBenefitSelection(site, "di-ltd", "spouse", { ageYears: 40, memberCoverage: true })).toMatchObject({ amount: 500, waitingPeriod: "30-days", benefitPeriod: "2-years" });
  });
  it.each([[49, 12500], [50, 9000], [54, 9000], [55, 6000], [59, 6000], [60, 3000], [69, 3000]])("AVMA LTD age %s has cap %s", (ageYears, maximum) => {
    expect(resolve("avma", "di-ltd", { ageYears, monthlyIncome: 100000, amount: maximum })).toMatchObject({ allowed: true, maximum });
    expect(resolve("avma", "di-ltd", { ageYears, monthlyIncome: 100000, amount: maximum + 100 }).allowed).toBe(false);
  });
  it("rounds AVMA loan payments up to the next $100, never above $2,000, without income", () => {
    expect(resolve("avma", "di-ltd-plus", { ageYears: 40, monthlyLoanPayment: 250.01, amount: 300 })).toMatchObject({ allowed: true, maximum: 300 });
    expect(resolve("avma", "di-ltd-plus", { ageYears: 40, monthlyLoanPayment: 300, amount: 400 }).allowed).toBe(false);
    expect(resolve("avma", "di-ltd-plus", { ageYears: 40, monthlyLoanPayment: 10000 }).maximum).toBe(2000);
    expect(reconcileBenefitSelection(sites.get("avma")!, "di-ltd-plus", "member", { ageYears: 40, monthlyLoanPayment: 199, amount: 500, waitingPeriod: "30-days" })).toMatchObject({ amount: 200, waitingPeriod: "90-days" });
  });
  it("couples AVMA overhead periods and floors expense caps without retaining stale choices", () => {
    const site = sites.get("avma")!;
    const facts = { ageYears: 60, eligibleMonthlyExpenses: 15123, eligibleExpenseFraction: .5, amount: 7500, waitingPeriod: "15-days", benefitPeriod: "12-months" };
    expect(resolveNormalizedBenefit(site, "oo-professional", "member", facts)).toMatchObject({ allowed: true, maximum: 7500, benefitPeriods: ["12-months"] });
    expect(reconcileBenefitSelection(site, "oo-professional", "member", { ...facts, waitingPeriod: "30-days" })).toMatchObject({ amount: 7500, waitingPeriod: "30-days", benefitPeriod: "24-months" });
    expect(reconcileBenefitSelection(site, "oo-professional", "member", { ...facts, eligibleExpenseFraction: undefined })).toMatchObject({ amount: null, waitingPeriod: null, benefitPeriod: null });
  });
  it("uses age-only ISI STD, explicit waiting labels, and provisional monthly ISI LTD income", () => {
    expect(resolve("isitrust", "di-short-term", { ageYears: 59 })).toMatchObject({ allowed: true, maximum: 3700, benefitPeriods: ["26-weeks"] });
    expect(resolve("isitrust", "di-short-term", { ageYears: 60 })).toMatchObject({ allowed: true, maximum: 1300 });
    expect(resolve("isitrust", "di-ltd", { ageYears: 54, monthlyIncome: 10000 })).toMatchObject({ maximum: 7000, provisional: true });
    expect(resolve("waepa", "di-short-term", { ageYears: 64, monthlyIncome: 1000 })).toMatchObject({ maximum: 600, allowed: true });
    expect(resolve("waepa", "di-short-term", { ageYears: 65, monthlyIncome: 1000 }).allowed).toBe(false);
  });
  it("fails closed on missing/duplicate/malformed stored policies and source drift", () => {
    for (const mutate of [
      (copy: typeof db) => { copy.configurationValues = copy.configurationValues.filter(row => row.key !== "nso.di-ltd.reviewed-benefit-policy"); },
      (copy: typeof db) => { copy.configurationValues.find(row => row.key === "nso.di-ltd.reviewed-benefit-policy")!.value = { version: 9 }; },
      (copy: typeof db) => { const row = copy.configurationValues.find(row => row.key === "nso.di-ltd.reviewed-benefit-policy")!; row.value = { ...disabilityBenefitSlices.find(slice => slice.siteKey === "nso")!.policy, applicants: [{ ...disabilityBenefitSlices.find(slice => slice.siteKey === "nso")!.policy.applicants[0], increment: 0 }] } as never; },
    ]) {
      const copy = structuredClone(db); mutate(copy);
      expect(resolveNormalizedBenefit(resolveEffectiveSite(copy, "nso"), "di-ltd", "member", { ageYears: 40, monthlyIncome: 10000 })).toMatchObject({ status: "unresolved", allowed: false });
    }
    const copy = structuredClone(db);
    expect(() => applyDisabilityBenefitAdoption(copy, mcrSource.cells.map(cell => cell.sheet === "Disability" && cell.cell === "D35" ? { ...cell, value: "changed" } : cell))).toThrow("Benefit source changed");
    expect(copy).toEqual(db);
    expect(resolveNormalizedBenefit(resolveEffectiveSite(createMigrationDatabase(), "nso"), "di-ltd", "member", { ageYears: 40, monthlyIncome: 10000 }).status).toBe("unresolved");
  });
  it("reads policies and elections from one captured persisted revision", async () => {
    vi.stubGlobal("crypto", webcrypto);
    try {
      const revision = await createPortalDataRepository(new LocalStorageAdapter(JSON.parse(JSON.stringify(db)))).open(effectiveSiteSnapshotTables);
      const resolved = revision.resolveSite("asce");
      const rows = revision.query("configurationValues", { filters: { siteKey: "asce" } });
      expect(rows.revision).toBe(resolved.revision);
      expect(resolveNormalizedBenefit(resolved.site, "di-ltd", "member", { ageYears: 40, monthlyIncome: 10000, selfEmployed: true, selfEmployedYears: .5 })).toMatchObject({ maximum: 1050, benefitPeriods: ["5-years"] });
    } finally { vi.unstubAllGlobals(); }
  });
});
