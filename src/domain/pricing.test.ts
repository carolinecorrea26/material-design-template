import { expect, it } from "vitest";
import pricingDocument from "../../requirements/global/formulas/pricing.json";
import type { CoverageDefinition } from "./coverage";
import { baseMonthlyPremium, monthlyToFrequency, monthsPerPayment, productMonthlyPremium, quoteRiders, riderMonthlyPremium, selectedRiderCharges } from "./pricing";
import { pricingFormulas } from "./pricingFormulas.mjs";

const product = {
  id: "li-test", categoryId: "LI", applicants: ["member", "spouse"],
  riders: [
    { id: "amount", name: "Amount rider", description: "", hasAmount: true, premiumFactor: 0.05, applicants: ["member", "spouse"] },
    { id: "base", name: "Base rider", description: "", premiumFactor: 0.1 },
    { id: "spouse-only", name: "Spouse rider", description: "", premiumFactor: 0.1, applicants: ["spouse"] },
    { id: "attached", name: "Attached rider", description: "", premiumFactor: 0.1, dependentApplicant: "spouse" },
  ],
} as unknown as CoverageDefinition;

it("loads every pricing formula as a draft mock record", () => {
  expect(pricingDocument.formulas.map(formula => [formula.id, formula.status, formula.authority])).toEqual([
    ["base-premium", "draft", "mock"], ["rider-premium", "draft", "mock"], ["payment-frequency-factors", "draft", "mock"],
  ]);
  expect(() => pricingFormulas({ formulas: pricingDocument.formulas.slice(1) })).toThrow("Expected one category-rates formula");
  const negative = structuredClone(pricingDocument);
  negative.formulas[0].categories!.LI = { basis: "per-thousand", rate: -1 };
  expect(() => pricingFormulas(negative)).toThrow("Invalid category-rates formula");
});

it("prices the base by category with a monthly minimum", () => {
  expect(baseMonthlyPremium("LI", 100000)).toBe(12);
  expect(baseMonthlyPremium("AD", 100000)).toBe(5);
  expect(baseMonthlyPremium("DI", 1000)).toBe(20);
  expect(baseMonthlyPremium("mcr.category.ci", 100000)).toBe(25);
  expect(baseMonthlyPremium("LI", 5000)).toBe(1);
  expect(baseMonthlyPremium("LI", 0)).toBe(0);
});

it("offers only member riders that are not attached to a dependent in the quote", () => {
  expect(quoteRiders(product).map(rider => rider.id)).toEqual(["amount", "base"]);
});

it("prices each selected rider on its own amount or the base amount", () => {
  const riders = { "li-test:amount:member": true, "li-test:base:member": true, "li-test:base:spouse": true, "li-test:spouse-only:member": true };
  const charges = selectedRiderCharges(product, "member", 200000, riders, { "li-test:amount:member": 100000 });
  expect(charges.map(({ rider, amount, premiumFactor }) => [rider.id, amount, premiumFactor])).toEqual([["amount", 100000, 0.05], ["base", 200000, 0.1]]);
  expect(charges.map(charge => riderMonthlyPremium("LI", charge))).toEqual([0.6, 2.4]);
  expect(productMonthlyPremium(product, "member", 200000, riders, { "li-test:amount:member": 100000 })).toBe(27);
  expect(productMonthlyPremium(product, "member", 0, riders, {})).toBe(0);
  expect(productMonthlyPremium(product, "member", 200000, {}, {})).toBe(24);
});

it("converts monthly premiums with the payment frequency factors", () => {
  expect(monthlyToFrequency(12.34, "annual")).toBe(148.08);
  expect(["monthly", "quarterly", "semiannually", "annually", "annual"].map(monthsPerPayment)).toEqual([1, 3, 6, 12, 12]);
  expect(() => monthsPerPayment("weekly")).toThrow();
});
