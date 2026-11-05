import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applySharedLifeQuestionnaireAdoption } from "./sharedLifeQuestionnaireAdoption";
import { configuredHealthQuestionnaire, isHealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { resolveFlowGate } from "../config/flowGates";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { completeSourceHealthFixture } from "./sourceQuestionnaireFixture";
import { evaluateCoverageJourney, resolveJourneyUnderwriting } from "../domain/coverageJourney";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("uses the same captured source fields with explicit WAEPA/NSO Site-wide assignments", () => {
  for (const siteKey of ["waepa", "nso"]) {
    const library = resolvePrototypeLibrary(db, siteKey, "shared-Life");
    const policy = library.site.configuration.healthQuestionnairePolicies[0].value;
    expect(isHealthQuestionnairePolicy(policy)).toBe(true);
    expect(policy).toMatchObject({ applicability: "site", associationKeys: [] });
    for (const product of library.products.filter(product => product.categoryId === "LI")) for (const applicant of product.applicants.filter(role => role !== "child")) {
      const values = { membership: siteKey === "waepa" ? "current" : "yes", gender: "male", "spouse-gender": "female", state: "PA", coverageSelections: [product.id], productApplicants: { [product.id]: [applicant] } };
      const form = configuredHealthQuestionnaire(library.site, "health-li", applicant, values);
      expect(form.status).toBe("resolved"); expect(form.items[0].sourceReferences).toEqual(["Health Questions!B63"]);
      expect(form.items[0].question!.id).toBe(`health-source-tele-weight-change-${applicant}`);
      expect(form.items.some(item => item.key === "health-source-tele-pregnant")).toBe(applicant === "spouse");
    }
  }
  expect(resolvePrototypeLibrary(db, "waepa-gi", "GI-isolation").site.configuration.healthQuestionnairePolicies).toEqual([]);
  expect(isHealthQuestionnairePolicy({ version: 1, associationKeys: [], pageId: "health-li", variants: [{ key: "life", when: {}, items: [] }] })).toBe(false);
  const copy = structuredClone(db); applySharedLifeQuestionnaireAdoption(copy); expect(copy).toEqual(db); expect(validateMigrationDatabase(db)).toEqual([]);
});
it("requires full WAEPA adult Life questions independently of processing and keeps child/STD routing separate", () => {
  const library = resolvePrototypeLibrary(db, "waepa", "full-Life"); installPrototypeLibrary(library);
  const life = library.products.find(product => product.id === "li-group-term")!;
  for (const applicant of ["member", "spouse"] as const) {
    const values = { membership: "current", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", coverageSelections: [life.id], productApplicants: { [life.id]: [applicant] }, coverageAmounts: { [`${life.id}:${applicant}`]: 100000 } };
    expect(applicationUnderwriting(life, applicant, values).healthPage).toBe("health-li"); expect(resolveFlowGate("health-li", values, library.products)).toBe(true); expect(resolveFlowGate("health-qd", values, library.products)).toBe(false);
  }
  const child = { membership: "current", coverageSelections: [life.id], productApplicants: { [life.id]: ["child"] }, coverageAmounts: { [`${life.id}:child`]: 25000 } };
  expect(resolveFlowGate("health-li", child, library.products)).toBe(false);
  const std = { membership: "current", "birth-date": "1986-01-01", coverageSelections: ["di-short-term"], productApplicants: { "di-short-term": ["member"] }, coverageAmounts: { "di-short-term:member": 1000 } };
  expect(resolveFlowGate("health-li", std, library.products)).toBe(false); expect(resolveFlowGate("health-qd", std, library.products)).toBe(true);
});
it("validates source answers at the normalized boundary and strips unrelated/legacy answers", async () => {
  for (const [siteKey, productKey] of [["waepa", "li-group-term"], ["nso", "li-term"], ["isitrust", "li-20yr"]]) {
    const captured = structuredClone(db);
    // NSO's accepted shorter QD flow stays unchanged. Verify its shared full
    // questionnaire on an explicit captured FUW edit, rather than forcing it
    // onto the current QD route.
    if (siteKey === "nso") {
      const journey = captured.configurationValues.find(row => row.key === "nso.li-term.journey-policy")!;
      (journey.value as { defaultUnderwritingPathway: string }).defaultUnderwritingPathway = "FUW";
    }
    const library = resolvePrototypeLibrary(captured, siteKey, "native-source-form");
    const mapping = resolveCoverageJourneyPolicy(library.site, productKey)!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "new")!;
    const fixture = createCoverageJourneyFixture(library.site, productKey, mapping.when);
    const result = await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies });
    expect(result.allowed, `${siteKey}: ${JSON.stringify(result)}`).toBe(true);
    const first = "health-source-tele-weight-change-member";
    if (!("questions" in result)) throw new Error(JSON.stringify(result));
    expect(result.questions.activeFields).toContain(first); expect(result.questions.activeFields).not.toContain("health-li-q1");
    expect(result.submission?.questions).toHaveProperty(first, "no");
    const missing = { ...fixture.input, answers: { ...fixture.input.answers, [first]: undefined, "health-li-q1": "no", unrelated: "do not submit" } };
    expect((await evaluateCoverageJourney(library.site, missing, { policies: fixture.policies })).missingFacts).toContain(first);
    const invalid = { ...fixture.input, answers: { ...fixture.input.answers, [first]: "invalid" } };
    expect((await evaluateCoverageJourney(library.site, invalid, { policies: fixture.policies })).allowed).toBe(false);
    const yes = { ...fixture.input, answers: { ...fixture.input.answers, [first]: "yes" } };
    expect((await evaluateCoverageJourney(library.site, yes, { policies: fixture.policies })).allowed).toBe(false);
    const underwriting = resolveJourneyUnderwriting(library.site, productKey, fixture.input.applicantKey, fixture.input.eligibility.ageYears, fixture.input.amount, fixture.input.applicantClass, fixture.input.associationKey);
    expect(underwriting).toMatchObject({ status: "resolved" });
  }
});
it("requires extra CI questions for a combined ISITRUST Life/CI portfolio", async () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "combined-native");
  const mapping = resolveCoverageJourneyPolicy(library.site, "li-20yr")!.mappings.find(row => row.when.applicantKey === "member" && row.when.mode === "new")!;
  const fixture = createCoverageJourneyFixture(library.site, "li-20yr", mapping.when);
  fixture.input.eligibility.selectedPlans!.push({ productKey: "sh-critical-illness", categoryKey: "SH", applicantKey: "member" });
  expect((await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies })).allowed).toBe(false);
  fixture.input.answers = completeSourceHealthFixture(library.site, fixture.input);
  const result = await evaluateCoverageJourney(library.site, fixture.input, { policies: fixture.policies }); expect(result.allowed, JSON.stringify(result)).toBe(true);
  if (!("questions" in result)) throw new Error(JSON.stringify(result));
  expect(result.questions.activeFields).toContain("health-source-tele-ci-1-member");
});
