import { resolveRatePresentation } from "../domain/ratePresentation";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { applyRateModifiers, isRateModifierPolicy } from "../domain/rateModifiers";
import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { activeReviewBlocks, isReviewPolicy, resolveFraudNotice, validateCapturedReview } from "../domain/reviewPolicy";
import { collectRateInputs, isRateInputPolicy } from "../domain/rateInputPolicy";
import { quoteCandidateWithMock } from "../domain/mockRating";
import { getClientCoverages } from "../config/client/getActiveClientCoverages";
import { getEffectiveSiteConfig } from "../data/registry";
import { coverageRelationshipErrors } from "../domain/coverageRequirements";
import { getQuoteRequirements } from "../config/fields/homeQuoteFields";
import { composeReadAndSign, resolveReviewExperience } from "../config/reviewExperience";

const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
const site = (key: string) => resolveEffectiveSite(db, key);
const selections = [{ productKey: "li-term", category: "LI", applicants: ["member"] }];
const complete = { "dividend-acknowledgement": true, "dividend-first-name": "Caroline", "dividend-last-name": "Correa", "dividend-birth-date": "1990-08-26" };

describe("captured review and rate participation acceptance", () => {
  it("persists valid policies across all enabled products and sites", () => {
    for (const row of db.sites.filter((site: { status: string }) => site.status === "active")) {
      const s = site(row.key);
      expect(s.configuration.reviewPolicies).toHaveLength(1);
      expect(isReviewPolicy(s.configuration.reviewPolicies[0].value)).toBe(true);
      for (const p of s.configuration.products) {
        expect(p.rateInputPolicies).toHaveLength(1);
        expect(isRateInputPolicy(p.rateInputPolicies[0].value)).toBe(true);
      }
    }
  });
  it("executes the mock pricing contract for every enabled product, with CSEA suppressed", async () => {
    let tested = 0, priced = 0;
    const service = { quote: async () => ({ mode: "mock", premiumCents: 12000, expiresAt: 2000, authority: "Synthetic test rates; not an insurance quote" }) };
    for (const row of db.sites) {
      const s = site(row.key);
      for (const product of s.configuration.products) {
        const journey = product.journeyPolicies[0].value as unknown as import("../domain/coverageJourneyPolicy").CoverageJourneyPolicy;
        const method = journey.payment.methods[0];
        const result = await quoteCandidateWithMock(s, product.productKey, { amount: 100000, age: 40, gender: "female", tobacco: "no", jurisdiction: "US-IL", membership: true, applicant: "member", waitingPeriod: "90", benefitPeriod: "65", association: "mock-association", riders: [] }, { method: method?.method ?? "bank-account", frequency: method?.frequencies[0] ?? "monthly" }, service, 1000);
        const ratePolicy = product.rateInputPolicies[0].value;
        if (!isRateInputPolicy(ratePolicy)) throw new Error("Invalid rate policy");
        expect(result.status, `${s.siteKey}/${product.productKey}: ${result.reason}`).toBe(!resolveRatePresentation(s, product.productKey).quoteToolEnabled ? "unavailable" : ratePolicy.rateClass?.selection === "unresolved" ? "needs-information" : "mock");
        if (result.status === "mock") priced++;
        tested++;
      }
    }
    expect(tested).toBe(70);
    if (process.env.STEP3_ACCEPTANCE_DIR) {
      mkdirSync(process.env.STEP3_ACCEPTANCE_DIR, { recursive: true });
      writeFileSync(join(process.env.STEP3_ACCEPTANCE_DIR, "step3-review-rate-acceptance.json"), JSON.stringify({ tested, priced, synthetic: true, cseaCalculatedPrice: false, realPrase: "excluded-by-user", runtimeActivation: "pending", publicationReady: false }, null, 2) + "\n");
    }
  });
  it("uses state fraud wording, omits NY life-only, includes accident rider and CSEA override", () => {
    const policy = site("abe").configuration.reviewPolicies[0].value;
    if (!isReviewPolicy(policy)) throw new Error("Invalid fixture");
    expect(resolveFraudNotice(policy, "CA", selections)).toContain("California law");
    expect(resolveFraudNotice(policy, "US-NY", selections)).toBeNull();
    expect(resolveFraudNotice(policy, "NY", [{ ...selections[0], accidentRider: true }])).toContain("five thousand dollars");
    expect(resolveFraudNotice(policy, undefined, selections)).toBeNull();
    const csea = site("csea").configuration.reviewPolicies[0].value;
    if (!isReviewPolicy(csea)) throw new Error("Invalid fixture");
    expect(resolveFraudNotice(csea, "CA", [{ productKey: "di-ltd", category: "DI", applicants: ["member"] }])).toContain("five thousand dollars");
    const waepa = site("waepa").configuration.reviewPolicies[0].value;
    if (!isReviewPolicy(waepa)) throw new Error("Invalid fixture");
    expect(resolveFraudNotice(waepa, "NY", [{ productKey: "li-group-term", category: "LI", applicants: ["member"] }])).toContain("accident and health");
  });
  it("requires ABE acknowledgement with optional always-visible identity fields", () => {
    const s = site("abe");
    expect(validateCapturedReview(s, "IL", selections, complete, true)).toMatchObject({ allowed: true, cleanedAnswers: complete });
    expect(validateCapturedReview(s, "IL", selections, { "dividend-acknowledgement": true }, true)).toMatchObject({ allowed: true });
    expect(validateCapturedReview(s, "IL", selections, { ...complete, "dividend-opt-out": true }, true).cleanedAnswers).not.toHaveProperty("dividend-opt-out");
    for (const id of ["dividend-acknowledgement"]) expect(validateCapturedReview(s, "IL", selections, { ...complete, [id]: "" }, true).allowed).toBe(false);
    expect(validateCapturedReview(s, "IL", selections, { ...complete, "dividend-birth-date": "2026-02-30" }, true).allowed).toBe(false);
    expect(validateCapturedReview(s, undefined, selections, complete, true).allowed).toBe(false);
    expect(validateCapturedReview(s, "IL", [{ ...selections[0], applicants: ["spouse"] }], complete, true)).toMatchObject({ allowed: true, cleanedAnswers: {} });
    expect(validateCapturedReview(site("asce"), "IL", selections, complete, true).cleanedAnswers).toEqual({});
    const policy = s.configuration.reviewPolicies[0].value;
    if (!isReviewPolicy(policy)) throw new Error("Invalid fixture");
    expect(activeReviewBlocks(policy, selections).flatMap(block => block.fields)).toContain("dividend-birth-date");
  });
  it("supports scoped review fields and application-wide ABE exclusions in the live compatibility renderer", () => {
    const client = getEffectiveSiteConfig("abe"), products = getClientCoverages(client);
    const values = { coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 50000 }, "state-province": "CA" };
    const review = resolveReviewExperience(client, "abe", products, values);
    expect(review.blocks.flatMap(block => block.fields.map(field => field.id))).toContain("dividend-first-name");
    expect(review.fraudNotice).toContain("California law");
    expect(composeReadAndSign("Authorization\n\nCONSENT: Confirm", "FRAUD NOTICE")).toBe("Authorization\n\nFRAUD NOTICE\n\nCONSENT: Confirm");
    expect(composeReadAndSign("Custom read-and-sign copy", "FRAUD NOTICE")).toContain("FRAUD NOTICE");
    expect(composeReadAndSign("Custom read-and-sign copy", null)).toBe("Custom read-and-sign copy");
    expect(coverageRelationshipErrors(products, { "di-ltd": ["member"], "di-ltd-plus": ["spouse"] }).length).toBeGreaterThan(0);
    expect(coverageRelationshipErrors(products, { "di-ltd": ["member"] })).toEqual([]);
    expect(products.find(product => product.id === "di-ltd")!.requirements!.eligibility).toContainEqual({ applicantType: "member", minimumWorkHoursPerWeek: 40 });
    const hidden = { ...client, fields: { ...client.fields, review: { hidden: ["dividend-birth-date"] } } };
    expect(resolveReviewExperience(hidden, "abe", products, values).blocks.flatMap(block => block.fields.map(field => field.id))).not.toContain("dividend-birth-date");
  });
  it("separates quote visibility and rate dimensions, with explicit unisex/unismoker inputs", () => {
    const client = getEffectiveSiteConfig("asce");
    expect(getQuoteRequirements({ ...client, fields: { ...client.fields, home: { hidden: ["gender", "smoker"] } } }, ["LI"])).toMatchObject({ needsGender: false, needsSmoker: false });
    expect(getQuoteRequirements(getEffectiveSiteConfig("waepa"), ["LI"]).needsSmoker).toBe(false);
    const policy = site("isitrust").configuration.products.find(product => product.productKey === "oo-professional")!.rateInputPolicies[0].value;
    if (!isRateInputPolicy(policy)) throw new Error("Invalid fixture");
    expect(policy.dimensions).toMatchObject({ gender: "ignored", tobacco: "ignored" });
    expect(collectRateInputs(policy, { gender: "female", tobacco: "yes" }).inputs).toEqual({ rateClass: "Single class" });
    expect(collectRateInputs(policy, {}).missing).toContain("amount");
    const asce = site("asce").configuration.products.find(product => product.productKey === "li-10yr")!.rateInputPolicies[0].value;
    if (!isRateInputPolicy(asce)) throw new Error("Invalid fixture");
    expect(collectRateInputs(asce, { jurisdiction: "US-MT", gender: "female" }).inputs).not.toHaveProperty("gender");
    expect(collectRateInputs(asce, { jurisdiction: "US-NY", gender: "female" }).inputs).toHaveProperty("gender");
    expect(collectRateInputs(asce, { age: -1 }).errors).toContain("age");
  });
  it("resolves client-specific quote classes independently of hidden tobacco fields", () => {
    const policyFor = (key: string, product: string) => {
      const policy = site(key).configuration.products.find(p => p.productKey === product)!.rateInputPolicies[0].value;
      if (!isRateInputPolicy(policy)) throw new Error("Invalid policy");
      return policy;
    };
    const ama = policyFor("ama", "li-10yr");
    expect(ama.rateClass?.classes).toContain("Preferred Plus");
    expect(collectRateInputs(ama, {}).inputs.rateClass).toBe("Preferred Plus");
    const asce = policyFor("asce", "li-10yr");
    expect(collectRateInputs(asce, { tobacco: "yes" }).inputs.rateClass).toBe("Standard");
    expect(collectRateInputs(asce, { tobacco: "no" }).inputs.rateClass).toBe("Preferred");
    expect(collectRateInputs({ ...asce, dimensions: { ...asce.dimensions, tobacco: "ignored" }, rateClass: { classes: ["Standard", "Preferred"], selection: "fixed", fixedClass: "Preferred", sourceReferences: ["test:configured quote assumption"] } }, {}).inputs.rateClass).toBe("Preferred");
    expect(policyFor("waepa", "di-short-term").rateClass?.selection).toBe("single");
    const waepa = policyFor("waepa", "li-group-term");
    expect(waepa.dimensions.tobacco).toBe("ignored");
    expect(waepa.rateClass).toMatchObject({ classes: ["Standard"], selection: "single" });
    expect(collectRateInputs(waepa, {}).inputs.rateClass).toBe("Standard");
    expect(collectRateInputs(waepa, { tobacco: "yes" }).inputs).not.toHaveProperty("tobacco");
    expect(collectRateInputs(policyFor("waepa-gi", "li-group-term"), {}).inputs.rateClass).toBe("Standard");
  });
  it("applies sourced AMA fees, credits and state surcharges to the mock base", () => {
    const s = site("ama");
    const p = s.configuration.products.find(product => product.productKey === "di-level-rated")!.rateModifierPolicies[0].value;
    if (!isRateModifierPolicy(p)) throw new Error("Invalid fixture");
    expect(applyRateModifiers(p, 1000, { membership: true, jurisdiction: "US-CA", method: "bank-account", frequency: "monthly" }).annualPremium).toBeCloseTo(910);
    expect(applyRateModifiers(p, 1000, { membership: false, jurisdiction: "US-CA", method: "bank-account", frequency: "monthly" }).annualPremium).toBeCloseTo(1455);
    expect(applyRateModifiers(p, 1000, { jurisdiction: "US-CA", method: "bank-account", frequency: "monthly" }).allowed).toBe(false);
  });
  it("uses synthetic service premiums with captured billing, rejects errors and expired results", async () => {
    const s = site("abe"), facts = { amount: 50000, applicant: "member", age: 40, jurisdiction: "US-IL", gender: "female", tobacco: "no" };
    const payment = { method: "bank-account" as const, frequency: "monthly" as const };
    let sent: unknown;
    const service = { quote: async (request: unknown) => { sent = request; return { mode: "mock", premiumCents: 12000, expiresAt: 2000, authority: "Synthetic test rates; not an insurance quote" }; } };
    expect(await quoteCandidateWithMock(s, "li-term", facts, payment, service, 1000)).toMatchObject({ status: "mock", amount: 10, displayPrice: true });
    expect(sent).toMatchObject({ siteKey: "abe", frequency: "annual", dimensions: { amount: 50000 } });
    const disabled = structuredClone(s);
    disabled.configuration.ratePresentationPolicies[0].value = { version: 1, praseConfigured: false, quoteToolEnabled: true, coverageQuoteEnabled: true };
    let called = false;
    expect(await quoteCandidateWithMock(disabled, "li-term", facts, payment, { quote: async request => { called = true; return service.quote(request); } }, 1000)).toMatchObject({ status: "unavailable", displayPrice: false });
    expect(called).toBe(false);
    expect(await quoteCandidateWithMock(s, "li-term", { amount: 50000 }, payment, service, 1000)).toMatchObject({ status: "needs-information", amount: null });
    expect(await quoteCandidateWithMock(s, "li-term", facts, payment, service, 3000)).toMatchObject({ status: "error", amount: null });
    expect(await quoteCandidateWithMock(s, "li-term", facts, payment, { quote: async () => { throw new Error("offline"); } }, 1000)).toMatchObject({ status: "error", displayPrice: false });
    expect(await quoteCandidateWithMock(site("csea"), "di-ltd", facts, payment, service, 1000)).toMatchObject({ status: "unavailable", displayPrice: false });
  });
});
