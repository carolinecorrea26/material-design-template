import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { isSelectionPolicy, reconcileCoverageSelection } from "../domain/coverageSelectionPolicy";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { evaluateCoverageJourney } from "../domain/coverageJourney";

const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
describe("retained rider exception contracts after persistence", () => {
  it("accepts each applicable retained rider, cleans stale choices, and emits captured codes", async () => {
    let checked = 0;
    for (const row of db.sites) {
      const site = resolveEffectiveSite(db, row.key);
      for (const product of site.configuration.products) {
        const policy = resolveCoverageJourneyPolicy(site, product.productKey)!;
        const selection = product.selectionPolicies[0].value;
        if (!isSelectionPolicy(selection)) throw new Error("Invalid selection fixture");
        for (const rider of selection.riders) for (const applicantKey of rider.applicants) {
          const mapping = policy.mappings.find(mapping => mapping.when.applicantKey === applicantKey && mapping.when.mode === "new");
          if (!mapping) continue;
          const fixture = createCoverageJourneyFixture(site, product.productKey, mapping.when);
          const facts = { mode: "new" as const, applicantKey, baseAmount: fixture.input.amount, ageYears: fixture.input.eligibility.ageYears, jurisdiction: fixture.input.jurisdiction, memberAmount: fixture.input.memberAmount, spouseAmount: fixture.input.spouseAmount, childAgeDays: fixture.input.eligibility.ageDays };
          const selected = reconcileCoverageSelection(selection, facts, { riders: [rider.key], riderAmounts: {} });
          expect(reconcileCoverageSelection(selection, facts, selected.election).election).toEqual(selected.election);
          const result = await evaluateCoverageJourney(site, { ...fixture.input, election: selected.election }, { policies: fixture.policies });
          expect(result.allowed, `${site.siteKey}/${product.productKey}/${applicantKey}/${rider.key}: ${JSON.stringify(result)}`).toBe(true);
          expect(result.submission!.riders.every(rider => rider.code === mapping.riderCodes[rider.key] && typeof rider.code === "string")).toBe(true);
          const stale = reconcileCoverageSelection(selection, facts, { riders: ["unknown-rider"], riderAmounts: { "unknown-rider": 100 } });
          expect(stale.election.riders).not.toContain("unknown-rider");
          expect(stale.election.riderAmounts).not.toHaveProperty("unknown-rider");
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  }, 120000);
});
