import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { evaluateCoverageHousehold } from "../domain/coverageHousehold";
import { createMockPolicyVerificationService, type VerifiedPolicy } from "../domain/policyVerification";
const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
const policies = createMockPolicyVerificationService([]);
const site = (key: string) => resolveEffectiveSite(db, key);

describe("captured household reconciliation", () => {
  it("recalculates primary/dependent relationships and prevents spoofed member amounts", async () => {
    const s = site("waepa");
    const member = createCoverageJourneyFixture(s, "li-group-term", { applicantKey: "member", mode: "new" }).input;
    const child = createCoverageJourneyFixture(s, "li-group-term", { applicantKey: "child", mode: "new" }).input;
    const household = [{ personKey: "member", applicantKey: "member" as const, inputs: [member], existingLifeAmount: 0 }, { personKey: "child-1", applicantKey: "child" as const, inputs: [child], existingLifeAmount: 0 }];
    const accepted = await evaluateCoverageHousehold(s, household, { policies });
    expect(accepted, JSON.stringify({ errors: accepted.errors, missing: accepted.missingFacts })).toMatchObject({ allowed: true });
    expect(accepted.submissions).toHaveLength(2);
    const orphan = await evaluateCoverageHousehold(s, household.slice(1), { policies });
    expect(orphan.allowed).toBe(false);
    expect(orphan.submissions).toBeNull();
    const twoChildren = await evaluateCoverageHousehold(s, [...household, { ...household[1], personKey: "child-2" }], { policies });
    expect(twoChildren.allowed).toBe(true);
    expect(twoChildren.submissions).toHaveLength(3);
  });
  it("accepts child-only requests only with service-verified existing primary coverage", async () => {
    const s = site("waepa"), input = createCoverageJourneyFixture(s, "li-group-term", { applicantKey: "child", mode: "new" }).input;
    const record: VerifiedPolicy = { policyId: "mock-primary", ownerReference: "mock-owner", siteKey: s.siteKey, productKey: "li-group-term", applicantKey: "member", status: "active", amount: 100000, permittedChanges: ["increase"], billing: { method: "bank-account", frequency: "monthly" }, effectiveDate: "2026-01-01", expiresAt: Date.UTC(2030, 0, 1), riders: [] };
    const people = [{ personKey: "child-1", applicantKey: "child" as const, inputs: [input], existingLifeAmount: 0 }];
    const accepted = await evaluateCoverageHousehold(s, people, { policies: createMockPolicyVerificationService([record]) }, [record]);
    expect(accepted, JSON.stringify({ errors: accepted.errors, missing: accepted.missingFacts })).toMatchObject({ allowed: true });
    expect(await evaluateCoverageHousehold(s, people, { policies }, [record])).toMatchObject({ allowed: false, submissions: null });
  });
  it("enforces synchronized billing across different people", async () => {
    const s = site("nso");
    const member = createCoverageJourneyFixture(s, "li-term", { applicantKey: "member", mode: "new" }).input;
    const spouse = createCoverageJourneyFixture(s, "li-term", { applicantKey: "spouse", mode: "new" }).input;
    const people = [{ personKey: "member", applicantKey: "member" as const, inputs: [member], existingLifeAmount: 0 }, { personKey: "spouse", applicantKey: "spouse" as const, inputs: [spouse], existingLifeAmount: 0 }];
    expect((await evaluateCoverageHousehold(s, people, { policies })).allowed).toBe(true);
    const changed = [{ ...people[0] }, { ...people[1], inputs: [{ ...spouse, payment: { method: "bank-account" as const, frequency: "quarterly" as const } }] }];
    expect(await evaluateCoverageHousehold(s, changed, { policies })).toMatchObject({ allowed: false, submissions: null, errors: ["Household payment method and frequency must match"] });
  });
  it("blocks cross-person exclusions and invalid household identities", async () => {
    const s = site("abe");
    const a = createCoverageJourneyFixture(s, "di-ltd", { applicantKey: "member", mode: "new", waitingPeriod: "30", benefitPeriod: "60" }).input;
    const b = createCoverageJourneyFixture(s, "di-ltd-plus", { applicantKey: "spouse", mode: "new", waitingPeriod: "90", benefitPeriod: "65" }).input;
    const people = [{ personKey: "member", applicantKey: "member" as const, inputs: [a] }, { personKey: "spouse", applicantKey: "spouse" as const, inputs: [b] }];
    const rejected = await evaluateCoverageHousehold(s, people, { policies });
    expect(rejected).toMatchObject({ allowed: false, submissions: null });
    expect(rejected.errors).toContain("Mutually exclusive household products selected");
    expect((await evaluateCoverageHousehold(s, [people[0], people[0]], { policies })).allowed).toBe(false);
    expect((await evaluateCoverageHousehold(s, [{ ...people[0], applicantKey: "unknown" as "member", inputs: [{ ...a, applicantKey: "unknown" }] }], { policies })).allowed).toBe(false);
  });
});
