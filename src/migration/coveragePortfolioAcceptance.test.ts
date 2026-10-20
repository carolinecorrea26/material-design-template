import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { evaluateCoveragePortfolio } from "../domain/coveragePortfolio";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { createMockPolicyVerificationService } from "../domain/policyVerification";

const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
const policies = createMockPolicyVerificationService([]);
const site = (key: string) => resolveEffectiveSite(db, key);
const journey = (siteKey: string, productKey: string) => createCoverageJourneyFixture(site(siteKey), productKey, { applicantKey: "member", mode: "new" }).input;

describe("same-person persisted portfolio acceptance", () => {
  it("synchronizes collected billing choices and withholds all submissions on disagreement", async () => {
    const s = site("nso");
    const first = journey(s.siteKey, "li-term"), second = journey(s.siteKey, "li-10yr");
    expect((await evaluateCoveragePortfolio(s, [first, second], { policies }, 0)).allowed).toBe(true);
    const result = await evaluateCoveragePortfolio(s, [first, { ...second, payment: { method: "bill-me", frequency: "quarterly" } }], { policies }, 0);
    expect(result.results.every(r => r.allowed)).toBe(true);
    expect(result).toMatchObject({ allowed: false, submissions: null, errors: ["Payment method and frequency must match across synchronized products"] });
    const edited = structuredClone(s);
    const secondPolicy = edited.configuration.products.find(p => p.productKey === second.productKey)!.journeyPolicies[0].value as unknown as { payment: { synchronizeAcrossProducts: boolean } };
    secondPolicy.payment.synchronizeAcrossProducts = false;
    expect((await evaluateCoveragePortfolio(edited, [first, { ...second, payment: { method: "bank-account", frequency: "quarterly" } }], { policies }, 0)).allowed).toBe(false);
  });
  it("checks combined life amounts at the limit, existing coverage and resulting totals", async () => {
    const s = site("nso");
    const inputs = [journey(s.siteKey, "li-term"), journey(s.siteKey, "li-10yr"), journey(s.siteKey, "li-20yr")].map((input, index) => ({ ...input, amount: [500000, 200000, 100000][index] }));
    expect((await evaluateCoveragePortfolio(s, inputs, { policies }, 0))).toMatchObject({ allowed: true, submissions: [{ amount: 500000 }, { amount: 200000 }, { amount: 100000 }] });
    expect((await evaluateCoveragePortfolio(s, inputs, { policies }, 1))).toMatchObject({ allowed: false, submissions: null, errors: ["Life aggregate exceeds the normalized limit"] });
    expect((await evaluateCoveragePortfolio(s, inputs, { policies }))).toMatchObject({ allowed: false, submissions: null, missingFacts: ["Existing life amount is required"] });
    const increase = createCoverageJourneyFixture(s, "li-term", { applicantKey: "member", mode: "increase" });
    expect(await evaluateCoveragePortfolio(s, [{ ...increase.input, amount: 500000 }, ...inputs.slice(1)], { policies: increase.policies }, 0)).toMatchObject({ allowed: true, submissions: [{ amount: 500000, existingAmount: 12500 }, { amount: 200000 }, { amount: 100000 }] });
  });
  it("does not trust caller-selected product summaries to bypass disability exclusions", async () => {
    const s = site("abe");
    const result = await evaluateCoveragePortfolio(s, [journey(s.siteKey, "di-ltd"), journey(s.siteKey, "di-ltd-plus")], { policies });
    expect(result.allowed).toBe(false);
    expect(result.submissions).toBeNull();
    expect(result.errors.some(e => e.includes("Mutually exclusive disability products selected"))).toBe(true);
  });
  it("adds other selected disability amounts before checking the shared cap", async () => {
    const s = site("abe");
    const inputs = [journey(s.siteKey, "di-ltd"), journey(s.siteKey, "di-mtd")].map(input => ({ ...input, amount: 10000 }));
    for (const input of inputs) expect((await evaluateCoverageJourney(s, input, { policies })).allowed).toBe(true);
    const result = await evaluateCoveragePortfolio(s, inputs, { policies });
    expect(result.allowed).toBe(false);
    expect(result.submissions).toBeNull();
    expect(result.errors.some(e => e.includes("recalculated benefit choices"))).toBe(true);
  });
  it("rejects duplicate products and mixed applicants rather than combining different people's limits", async () => {
    const s = site("nso"), input = journey(s.siteKey, "li-term");
    for (const inputs of [[], [input, input], [input, { ...journey(s.siteKey, "li-10yr"), applicantKey: "spouse" }]]) {
      expect(await evaluateCoveragePortfolio(s, inputs, { policies }, 0)).toMatchObject({ allowed: false, submissions: null });
    }
  });
});
