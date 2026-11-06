import { expect, it } from "vitest";
import { estimateMonthlyPremium } from "../utils/estimateMonthlyPremium";
import type { CoverageDefinition } from "./coverage";
import { quoteRiders, selectedRidersMonthlyPremium } from "./coverageRiderPricing";

const product = {
  id: "li-test", categoryId: "LI", applicants: ["member", "spouse"],
  riders: [
    { id: "amount", name: "Amount rider", description: "", hasAmount: true, premiumFactor: 0.05, applicants: ["member", "spouse"] },
    { id: "base", name: "Base rider", description: "", premiumFactor: 0.1 },
    { id: "spouse-only", name: "Spouse rider", description: "", premiumFactor: 0.1, applicants: ["spouse"] },
    { id: "attached", name: "Attached rider", description: "", premiumFactor: 0.1, dependentApplicant: "spouse" },
  ],
} as unknown as CoverageDefinition;

it("offers only member riders that are not attached to a dependent in the quote", () => {
  expect(quoteRiders(product).map(rider => rider.id)).toEqual(["amount", "base"]);
});

it("prices selected riders with the Coverage formula", () => {
  const riders = { "li-test:amount:member": true, "li-test:base:member": true, "li-test:base:spouse": true };
  expect(selectedRidersMonthlyPremium(product, "member", 200000, riders, { "li-test:amount:member": 100000 })).toBeCloseTo(
    estimateMonthlyPremium("LI", 100000) * 0.05 + estimateMonthlyPremium("LI", 200000) * 0.1,
  );
  expect(selectedRidersMonthlyPremium(product, "member", 0, riders, {})).toBe(0);
  expect(selectedRidersMonthlyPremium(product, "member", 200000, {}, {})).toBe(0);
});
