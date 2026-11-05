import { beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAmaPremiumStyleAdoption } from "./amaPremiumStyleAdoption";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { coverageRelationshipErrors } from "../domain/coverageRequirements";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
it("enforces one premium style across applicants through the shared UI validator and normalized journey", async () => {
  const library = resolvePrototypeLibrary(db, "ama", "premium-style");
  const selections = { "di-step-rated": ["member" as const], "di-level-rated": ["spouse" as const] };
  expect(coverageRelationshipErrors(library.products, selections)).toEqual(expect.arrayContaining([expect.stringContaining("cannot be selected together")]));
  expect(coverageRelationshipErrors(library.products, { "di-step-rated": ["member", "spouse"] })).toEqual([]);
  for (const product of ["di-step-rated", "di-level-rated"]) {
    const mapping = resolveCoverageJourneyPolicy(library.site, product)!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "new")!;
    const fixture = createCoverageJourneyFixture(library.site, product, mapping.when);
    const alone = await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies });
    expect(alone.allowed, JSON.stringify(alone)).toBe(true);
    const result = await evaluateCoverageJourney(library.site, { ...fixture.input, benefit: { ...fixture.input.benefit, selectedProducts: Object.keys(selections) } }, { policies: fixture.policies });
    expect(result.allowed).toBe(false);
    expect(JSON.stringify(result.errors)).toContain("Mutually exclusive disability products selected");
  }
});
it("respects captured owner edits, preserves unrelated policies and adopts idempotently", () => {
  const copy = structuredClone(db);
  const before = copy.configurationValues.filter(row => !row.key.startsWith("ama.di-")).map(row => structuredClone(row));
  for (const product of ["di-step-rated", "di-level-rated"]) {
    const row = copy.configurationValues.find(row => row.key === `ama.${product}.reviewed-benefit-policy`)!;
    (row.value as { exclusiveProducts: string[] }).exclusiveProducts = [];
  }
  expect(coverageRelationshipErrors(resolvePrototypeLibrary(copy, "ama", "edited").products, { "di-step-rated": ["member"], "di-level-rated": ["member"] })).toEqual([]);
  applyAmaPremiumStyleAdoption(copy); expect(copy).toEqual(db);
  expect(copy.configurationValues.filter(row => !row.key.startsWith("ama.di-"))).toEqual(before);
  expect(validateMigrationDatabase(copy)).toEqual([]);
});
