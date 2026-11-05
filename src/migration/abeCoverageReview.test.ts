import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite, type EffectiveSite } from "../domain/effectiveSite";
import { validateNormalizedCoverageAmount, validateNormalizedLifeAggregate } from "../domain/normalizedCoverageAmounts";
import { resolveDependentCoverage } from "../domain/dependentPolicy";
import { resolveNormalizedBenefit, type BenefitFacts } from "../domain/benefitPolicy";
import { activeNumericSlices } from "./activeSiteNumericAdoption";
import { currentMcrSource } from "./currentMcr";
import { activeSiteMainRows } from "./activeSiteIdentity";
let site: EffectiveSite;
beforeAll(() => { site = resolveEffectiveSite(createReviewedMigrationDatabase(), "abe"); }, 120000);
const source = (cell: string) => String(currentMcrSource.cells.find(row => row.sheet === "Main" && row.cell === cell)?.value ?? "");
it("checks each reviewed ABE numeric choice at its lower, upper and increment boundaries independently of conditional caps", () => {
  for (const slice of activeNumericSlices.filter(row => row.siteKey === "abe")) for (const [index, applicant] of ["member", "spouse", "child"].entries()) {
    const selection = slice.amounts[index];
    const cell = `${["H", "I", "J"][index]}${activeSiteMainRows.abe[slice.productKey]}`;
    if (selection === null) {
      expect(source(cell).trim()).toMatch(/^(?:N\/A|NA)$/i);
      expect(validateNormalizedCoverageAmount(site, slice.productKey, applicant, 25000).allowed).toBe(false);
    } else if ("kind" in selection) {
      const { minimum, maximum, increment } = selection;
      const numbers = [...source(cell).replace(/,/g, "").matchAll(/\$?(\d+)/g)].map(match => Number(match[1]));
      for (const value of [minimum, maximum, increment]) expect(numbers, cell).toContain(value);
      for (const [amount, allowed] of [[minimum - 1, false], [minimum, true], [minimum + increment, true], [maximum, true], [maximum + increment, false], [minimum + 1, false]] as const) expect(validateNormalizedCoverageAmount(site, slice.productKey, applicant, amount).allowed, `${cell}/${amount}`).toBe(allowed);
    } else {
      for (const amount of selection) { expect(source(cell).replace(/,/g, ""), cell).toContain(String(amount)); expect(validateNormalizedCoverageAmount(site, slice.productKey, applicant, amount).allowed).toBe(true); }
      expect(validateNormalizedCoverageAmount(site, slice.productKey, applicant, 30000).allowed).toBe(false);
    }
  }
});
it("requires existing Life totals and applies the source $2M limit per person across Life products", () => {
  const selected = [{ productKey: "li-term", amount: 1000000 }, { productKey: "li-10yr", amount: 1000000 }];
  for (const applicant of ["member", "spouse"]) {
    expect(validateNormalizedLifeAggregate(site, applicant, selected).status).toBe("needs-information");
    expect(validateNormalizedLifeAggregate(site, applicant, selected, 0)).toMatchObject({ allowed: true, total: 2000000, maximum: 2000000 });
    expect(validateNormalizedLifeAggregate(site, applicant, selected, 1).allowed).toBe(false);
  }
  for (const row of [39, 40, 41, 42]) expect(source(`H${row}`).replace(/,/g, "")).toContain("2000000 across life coverages");
  expect(validateNormalizedLifeAggregate(site, "member", [{ productKey: "li-term", amount: 1000000 }, { productKey: "li-term", amount: 1000000 }], 0).allowed).toBe(false);
});
it("enforces each dependent amount cap, covered-member prerequisite and one-Life-plan guard", () => {
  for (const [product, applicant, amount] of [["li-term", "spouse", 100000], ["li-10yr", "spouse", 100000], ["li-20yr", "spouse", 100000], ["li-50plus", "spouse", 25000], ["li-add", "spouse", 100000], ["sh-critical-illness", "spouse", 5000], ["sh-hospital-money", "spouse", 200], ["sh-hospital-money", "child", 200], ["li-term", "child", 5000], ["li-10yr", "child", 5000], ["li-20yr", "child", 5000]] as const) {
    const facts = { amount, baseAmounts: { member: amount }, selectedApplicants: ["member", applicant], coveredApplicants: ["member", applicant], selectedProductKeys: [product] };
    expect(resolveDependentCoverage(site, product, applicant, facts).allowed, `${product}/${applicant}`).toBe(true);
    expect(resolveDependentCoverage(site, product, applicant, { ...facts, baseAmounts: { member: amount - 1 } }).allowed, `${product}/${applicant}/cap`).toBe(applicant === "child" && ["li-10yr", "li-20yr"].includes(product));
    if (product !== "sh-critical-illness" && (applicant === "child" || product !== "li-term")) expect(resolveDependentCoverage(site, product, applicant, { ...facts, coveredApplicants: [], selectedApplicants: [] }).allowed, `${product}/${applicant}/member`).toBe(false);
    if (applicant === "child" && product.startsWith("li-")) expect(resolveDependentCoverage(site, product, applicant, { ...facts, selectedProductKeys: ["li-term", "li-10yr"] }).allowed).toBe(false);
  }
  expect(resolveDependentCoverage(site, "li-add", "child", { amount: 25000, baseAmounts: { member: 100000 }, selectedApplicants: ["member", "child"], coveredApplicants: [] }).allowed).toBe(false);
});
const benefitFacts = (product: string): BenefitFacts => ({ ageYears: 35, retirement: false, amount: 100, monthlyIncome: 100000, existingMonthlyBenefit: 0, memberCoverage: true, memberRequestedBenefit: 1000, memberTotalMonthlyBenefit: 5000, selectedProducts: [product], otherMonthlyBenefits: Object.fromEntries(["di-ltd-plus", "di-ltd", "di-mtd"].filter(key => key !== product).map(key => [key, 0])) });
it("checks DI member/spouse ceilings, complete aggregate facts, exclusions and distinct waiting-period lists", () => {
  for (const [product, row, memberDays, spouseDays] of [["di-ltd-plus", 44, [60, 90, 180, 365], [90, 180, 365]], ["di-ltd", 45, [30, 60, 90, 180, 365], [90, 180, 365]], ["di-mtd", 46, [14, 30, 60, 90, 180], [90, 180]]] as const) {
    const facts = benefitFacts(product);
    for (const [applicant, days, maximum, column] of [["member", memberDays, 12000, "H"], ["spouse", spouseDays, 5000, "I"]] as const) {
      const decision = resolveNormalizedBenefit(site, product, applicant, facts);
      expect(decision, JSON.stringify(decision)).toMatchObject({ allowed: true, minimum: 100, maximum, increment: 100 });
      expect(decision.waitingPeriods?.map(period => period.accidentDays)).toEqual([...days]);
      expect(decision.waitingPeriods?.map(period => period.sicknessDays)).toEqual([...days]);
      for (const day of days) expect(source(`${column}${row}`)).toContain(`${day} Days`);
      expect(resolveNormalizedBenefit(site, product, applicant, { ...facts, amount: maximum + 100 }).allowed).toBe(false);
      expect(resolveNormalizedBenefit(site, product, applicant, { ...facts, otherMonthlyBenefits: undefined }).status).toBe("needs-information");
    }
    expect(resolveNormalizedBenefit(site, product, "spouse", { ...facts, memberCoverage: false }).allowed).toBe(false);
    expect(resolveNormalizedBenefit(site, product, "spouse", { ...facts, memberTotalMonthlyBenefit: 3000 }).maximum).toBe(3000);
    expect(resolveNormalizedBenefit(site, product, "member", { ...facts, otherMonthlyBenefits: Object.fromEntries(Object.keys(facts.otherMonthlyBenefits!).map(key => [key, 1000])) }).maximum).toBe(10000);
  }
  for (const [product, other] of [["di-ltd-plus", "di-ltd"], ["di-ltd", "di-ltd-plus"]]) expect(resolveNormalizedBenefit(site, product, "member", { ...benefitFacts(product), selectedProducts: [product, other] }).allowed).toBe(false);
});
it("retains the explicitly provisional D17 precision and distinct thresholds and tests the spouse nine-times cap", () => {
  for (const product of ["di-ltd-plus", "di-ltd", "di-mtd"]) {
    for (const [income, maximum] of [[7499, 4900], [7500, 4500], [7501, 4500]]) expect(resolveNormalizedBenefit(site, product, "member", { ...benefitFacts(product), monthlyIncome: income })).toMatchObject({ allowed: true, maximum, provisional: true });
    expect(resolveNormalizedBenefit(site, product, "spouse", { ...benefitFacts(product), memberRequestedBenefit: 100, amount: 200 })).toMatchObject({ allowed: true, maximum: 900 });
    expect(resolveNormalizedBenefit(site, product, "spouse", { ...benefitFacts(product), memberRequestedBenefit: 100, amount: 1000 }).allowed).toBe(false);
  }
});
it("caps Professional Overhead by eligible expenses with its 30-day/12-month options", () => {
  expect(source("H48")).toContain("Eligible Monthly Business Expenses * Percent Eligible");
  const facts = { ageYears: 35, eligibleMonthlyExpenses: 10000, eligibleExpenseFraction: 0.5, amount: 5000 };
  expect(resolveNormalizedBenefit(site, "oo-professional", "member", facts)).toMatchObject({ allowed: true, minimum: 500, maximum: 5000, increment: 100, waitingPeriods: [{ accidentDays: 30, sicknessDays: 30 }], benefitPeriods: ["12-months"] });
  expect(resolveNormalizedBenefit(site, "oo-professional", "member", { ...facts, amount: 5100 }).allowed).toBe(false);
  expect(resolveNormalizedBenefit(site, "oo-professional", "member", { ...facts, eligibleExpenseFraction: undefined }).status).toBe("needs-information");
});
