import { describe, expect, it } from "vitest";
import { journeySite as site, journeyLibrary, journeyAssignment } from "./freshStartJourneyFixtures";
import { freshStartSource } from "../domain/freshStartCatalog";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { evaluateCoveragePortfolio } from "../domain/coveragePortfolio";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { createMockPolicyVerificationService } from "../domain/policyVerification";

const policies = createMockPolicyVerificationService([]);
const journey = (siteKey: string, productKey: string) => { const s = site(siteKey); return createCoverageJourneyFixture(s, productKey, resolveCoverageJourneyPolicy(s, productKey)!.mappings.find(m => m.when.applicantKey === "member" && m.when.mode === "new")!.when).input; };

describe("same-person persisted portfolio acceptance", () => {
  it('uses AMA-GI individual limits without imposing an aggregate cap or requiring an existing-Life total', async () => {
    const s = site('ama-gi');
    const inputs = s.configuration.products.map(product => journey(s.siteKey, product.productKey));
    for (const existing of [undefined, 10000000]) expect(await evaluateCoveragePortfolio(s, inputs, { policies }, existing)).toMatchObject({ allowed: true });
    const life = inputs.find(input => s.configuration.products.find(product => product.productKey === input.productKey)!.catalog!.value.categoryKey === 'LI')!;
    expect(await evaluateCoveragePortfolio(s, [{ ...life, amount: 150000 }], { policies })).toMatchObject({ allowed: false, submissions: null });
  });
  it("synchronizes collected billing choices and withholds all submissions on disagreement", async () => {
    const s = site("ama");
    const first = journey(s.siteKey, "li-term"), second = journey(s.siteKey, "li-10yr");
    expect((await evaluateCoveragePortfolio(s, [first, second], { policies }, 0)).allowed).toBe(true);
    const result = await evaluateCoveragePortfolio(s, [first, { ...second, payment: { method: "bill-me", frequency: "quarterly" } }], { policies }, 0);
    expect(result.results.every(r => r.allowed)).toBe(true);
    expect(result).toMatchObject({ allowed: false, submissions: null, errors: ["Payment method and frequency must match across synchronized products"] });
    const source = structuredClone(freshStartSource());
    for (const key of [first.productKey, second.productKey]) journeyAssignment(source, 'ama', key).payment.synchronizeAcrossProducts = false;
    const edited = journeyLibrary('ama', source).site;
    expect((await evaluateCoveragePortfolio(edited, [first, { ...second, payment: { method: "bill-me", frequency: "quarterly" } }], { policies }, 0)).allowed).toBe(true);
  });
  it("checks combined life amounts at the limit, existing coverage and resulting totals", async () => {
    const s = site("asce");
    const inputs = [journey(s.siteKey, "li-term"), journey(s.siteKey, "li-10yr"), journey(s.siteKey, "li-20yr")].map((input, index) => ({ ...input, amount: [1000000, 500000, 500000][index] }));
    expect(await evaluateCoveragePortfolio(s, inputs, { policies }, 0)).toMatchObject({ allowed: true, submissions: [{ amount: 1000000 }, { amount: 500000 }, { amount: 500000 }] });
    expect(await evaluateCoveragePortfolio(s, inputs, { policies }, 1)).toMatchObject({ allowed: false, submissions: null, errors: ["Life aggregate exceeds the normalized limit"] });
    expect(await evaluateCoveragePortfolio(s, inputs, { policies })).toMatchObject({ allowed: false, submissions: null, missingFacts: ["Existing life amount is required"] });
    const increase = createCoverageJourneyFixture(s, "li-term", { applicantKey: "member", mode: "increase" });
    const accepted = await evaluateCoveragePortfolio(s, [{ ...increase.input, amount: inputs[0].amount }, ...inputs.slice(1)], { policies: increase.policies }, 0);
    expect(accepted).toMatchObject({ allowed: true, submissions: [{ amount: 1000000 }, { amount: 500000 }, { amount: 500000 }] });
    expect(accepted.submissions![0].existingAmount).toBe(increase.input.amount / 2);
  });
  it("does not trust caller-selected product summaries to bypass disability exclusions", async () => {
    const s = site("ama");
    const result = await evaluateCoveragePortfolio(s, [journey(s.siteKey, "di-step-rated"), journey(s.siteKey, "di-level-rated")], { policies });
    expect(result.allowed).toBe(false);
    expect(result.submissions).toBeNull();
    expect(result.errors.some(e => e.includes("Mutually exclusive disability products selected"))).toBe(true);
  });
  it("adds other selected disability amounts before checking the shared cap", async () => {
    const source = structuredClone(freshStartSource());
    const keys = ['di-step-rated', 'di-level-rated'];
    for (const key of keys) journeyAssignment<{ exclusiveProducts: string[] }>(source, 'ama', key, 'product-benefit-policy').exclusiveProducts = [];
    const s = journeyLibrary('ama', source).site;
    const inputs = keys.map(productKey => ({ ...createCoverageJourneyFixture(s, productKey, resolveCoverageJourneyPolicy(s, productKey)!.mappings.find(m => m.when.mode === 'new' && m.when.applicantClass === 'practicing')!.when).input, amount: 10000 }));
    for (const input of inputs) expect((await evaluateCoverageJourney(s, input, { policies })).allowed).toBe(true);
    const result = await evaluateCoveragePortfolio(s, inputs, { policies });
    expect(result.allowed).toBe(false);
    expect(result.submissions).toBeNull();
    expect(result.errors.some(e => e.includes("recalculated benefit choices"))).toBe(true);
  });
  it("rejects duplicate products and mixed applicants rather than combining different people's limits", async () => {
    const s = site("ama"), input = journey(s.siteKey, "li-term");
    for (const inputs of [[], [input, input], [input, { ...journey(s.siteKey, "li-10yr"), applicantKey: "spouse" }]]) {
      expect(await evaluateCoveragePortfolio(s, inputs, { policies }, 0)).toMatchObject({ allowed: false, submissions: null });
    }
  });
});
