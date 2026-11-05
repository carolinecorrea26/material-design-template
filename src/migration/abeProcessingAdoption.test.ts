import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { abeProcessingDecisionKey, applyAbeProcessingAdoption } from "./abeProcessingAdoption";
import { resolveJourneyUnderwriting } from "../domain/coverageJourneyUnderwriting";
import { isCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { activeReviewBlocks, isReviewPolicy } from "../domain/reviewPolicy";
import { applicationUnderwriting, validateApplicationCoverages } from "../domain/coverageRuntime";
import { applicationUnderwritingContext, isQuickDecisionPolicy } from "../domain/quickDecisionPolicy";
import { resolveEffectiveEligibility, type EffectiveSite } from "../domain/effectiveSite";
import { currentMcrSource } from "./currentMcr";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolveQuestionParticipation } from "../domain/coverageJourney";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { abeDividendOwnerHash } from "./requirementCrosswalkAbeReview";
import { navigationReviewHash } from "./requirementCrosswalkNavigationReview";
import { getActiveFormFlow } from "../config/formFlow";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
let db: DatabaseSchema, site: EffectiveSite;
beforeAll(() => { db = createReviewedMigrationDatabase(); site = resolvePrototypeLibrary(db, "abe", "processing-review").site; }, 120000);
afterEach(() => installPrototypeLibrary(null));
const route = (productKey: string, applicant: string, age: number | undefined, amount: number | undefined, overrides: Parameters<typeof resolveJourneyUnderwriting>[7] = {}) => resolveJourneyUnderwriting(site, productKey, applicant, age, amount, undefined, undefined, { jurisdiction: "US-PA", existingLifeAmount: 0, memberAmount: 500000, portfolio: [{ productKey, applicantKey: applicant, amount }], ...overrides });
it("uses each v78 QD age and amount boundary, with FUW outside and independent approved entry eligibility", () => {
  for (const [product, sheet, row, maxAge, minimum, maximum] of [["li-term", "QD LI", 6, 64, 100000, 500000], ["li-10yr", "QD LI", 7, 64, 100000, 500000], ["li-20yr", "QD LI", 8, 54, 100000, 500000], ["di-ltd-plus", "QD DI", 2, 49, 100, 7500], ["di-ltd", "QD DI", 3, 54, 100, 7500], ["di-mtd", "QD DI", 4, 54, 100, 7500]] as const) {
    const sourceAge = currentMcrSource.cells.find(cell => cell.sheet === sheet && cell.cell === `O${row}`)!.value;
    expect(String(sourceAge).match(/\d+/g)?.map(Number)).toEqual([17, maxAge]);
    for (const applicant of sheet === "QD LI" ? ["member", "spouse"] : ["member"]) {
      for (const age of [17, maxAge]) for (const amount of [minimum, maximum]) expect(route(product, applicant, age, amount)).toMatchObject({ status: "resolved", pathway: "QD", healthPage: "health-qd" });
      for (const [age, amount] of [[16, minimum], [maxAge + 1, minimum], [35, minimum - 1], [35, maximum + 1]]) expect(route(product, applicant, age, amount)).toMatchObject({ pathway: "FUW", healthPage: null });
    }
    if (sheet === "QD DI") expect(route(product, "spouse", 35, 1000)).toMatchObject({ pathway: "FUW", healthPage: null });
  }
  for (const [product, age] of [["li-10yr", 69], ["li-20yr", 59]] as const) {
    expect(resolveEffectiveEligibility(site, product, "member", { ageYears: age })).toMatchObject({ eligible: true });
    expect(route(product, "member", age, 100000)).toMatchObject({ pathway: "FUW" });
  }
  for (const product of ["li-term", "li-10yr", "li-20yr"]) expect(route(product, "child", 10, 5000)).toMatchObject({ pathway: "NA", healthPage: null });
});
it("applies literal QD state exclusions as FUW routing, retaining base residency independently", () => {
  const exclusions: Record<string, string[]> = { "li-term": ["CA", "MT", "MA", "MN", "VA"], "li-10yr": ["CA", "MT", "MA", "MN", "VA"], "li-20yr": [], "di-ltd-plus": ["CA", "UT", "ME", "MN", "VA", "ID", "NH", "NM", "NV"], "di-ltd": ["CA", "UT", "ME", "MN", "VA", "ID", "NH", "NM", "NV", "VT"], "di-mtd": ["CA", "UT", "ME", "MN", "VA", "ID", "NH", "NM", "NV", "VT"] };
  for (const [product, states] of Object.entries(exclusions)) for (const state of ["PA", "CA", "MN", "VT", ...states]) expect(route(product, "member", 35, product.startsWith("li") ? 100000 : 1000, { jurisdiction: `US-${state}` }).pathway).toBe(states.includes(state) ? "FUW" : "QD");
});
it("enforces fixed-term QD aggregates per person and spouse dependencies without lowering the general $2M coverage limit", () => {
  for (const productKey of ["li-10yr", "li-20yr"]) {
    const portfolio = [{ productKey, applicantKey: "member", amount: 300000 }, { productKey: "li-term", applicantKey: "member", amount: 200000 }, { productKey: "li-term", applicantKey: "spouse", amount: 500000 }];
    expect(route(productKey, "member", 35, 300000, { portfolio })).toMatchObject({ pathway: "QD" });
    expect(route(productKey, "member", 35, 300000, { portfolio, existingLifeAmount: 1 })).toMatchObject({ pathway: "FUW" });
    for (const memberAmount of [0, 299999]) expect(route(productKey, "spouse", 35, 300000, { memberAmount })).toMatchObject({ pathway: "FUW" });
    expect(route(productKey, "spouse", 35, 300000, { memberAmount: 300000 })).toMatchObject({ pathway: "QD" });
    for (const overrides of [{ jurisdiction: undefined }, { existingLifeAmount: undefined }, { portfolio: undefined }, { memberAmount: undefined }]) expect(route(productKey, "spouse", 35, 300000, overrides)).toMatchObject({ status: "needs-information" });
    expect(route(productKey, "member", undefined, 300000).status).toBe("needs-information");
    expect(route(productKey, "member", 35, undefined).status).toBe("needs-information");
  }
});
it("uses captured editable policies and the same routing in the form adapter and portfolio, without mutating a captured revision", () => {
  window.history.replaceState(null, "", "/?site=abe");
  const library = resolvePrototypeLibrary(db, "abe", "before-edit"); installPrototypeLibrary(library);
  const product = library.products.find(row => row.id === "li-10yr")!;
  const values = { "birth-date": "1986-01-01", state: "PA", "has-other-life-insurance": "no", coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] }, coverageAmounts: { [`${product.id}:member`]: 500000 } };
  expect(applicationUnderwriting(product, "member", values)).toMatchObject({ underwritingType: "QD", healthPage: "health-qd" });
  const beforeProfile = { ...values, membership: "yes", "has-other-life-insurance": undefined };
  expect(applicationUnderwriting(product, "member", beforeProfile)).toMatchObject({ status: "needs-information", missingFacts: ["existingLifeAmount"] });
  expect(validateApplicationCoverages(library.products, beforeProfile, { deferProfileUnderwriting: true })).toBeUndefined();
  expect(validateApplicationCoverages(library.products, beforeProfile)).toContain("existing Life coverage information on Profile");
  expect(applicationUnderwriting(product, "member", { ...values, state: "CA" })).toMatchObject({ underwritingType: "FUW", healthPage: null });
  expect(getActiveFormFlow(values as ApplicationFormValues)).toContain("health-qd");
  expect(getActiveFormFlow(values as ApplicationFormValues)).not.toContain("health-li");
  expect(getActiveFormFlow({ ...values, state: "CA" } as ApplicationFormValues)).not.toContain("health-li");
  expect(getActiveFormFlow({ ...values, state: "CA" } as ApplicationFormValues)).not.toContain("health-qd");
  expect(applicationUnderwritingContext(site, product.id, "member", { ...values, "has-other-life-insurance": "yes", "existing-life-insurance-amount": "$25,000" }).existingLifeAmount).toBe(25000);
  const copy = structuredClone(db), row = copy.configurationValues.find(row => row.key === "abe.li-10yr.journey-policy")!;
  if (!isCoverageJourneyPolicy(row.value)) throw new Error("Missing policy");
  row.value.quickDecision!.maximumAmount = 400000;
  installPrototypeLibrary(resolvePrototypeLibrary(copy, "abe", "after-edit"));
  expect(applicationUnderwriting(product, "member", values)).toMatchObject({ underwritingType: "FUW" });
  installPrototypeLibrary(library);
  expect(applicationUnderwriting(product, "member", values)).toMatchObject({ underwritingType: "QD" });
  const malformed = { ...row.value.quickDecision!, maximumAmount: -1 };
  expect(isQuickDecisionPolicy(malformed)).toBe(false);
  expect(isCoverageJourneyPolicy({ ...row.value, quickDecision: malformed })).toBe(false);
});
it("appends the conditional CI note within Read and Sign, preserves other ABE blocks and other Sites, and is idempotent", () => {
  const policy = site.configuration.reviewPolicies[0].value;
  if (!isReviewPolicy(policy)) throw new Error("Invalid Review");
  const block = policy.blocks.find(row => row.key === "supplemental-health-attestation")!;
  expect(block).toMatchObject({ placement: "read-and-sign-appendix", fields: [], fontSizePt: 14 });
  expect(policy.blocks.filter(row => row.key.startsWith("dividend")).flatMap(row => row.fields)).toEqual(["dividend-acknowledgement", "dividend-first-name", "dividend-last-name", "dividend-birth-date"]);
  expect(activeReviewBlocks(policy, [{ productKey: "sh-critical-illness", category: "SH", applicants: ["member"] }])).toContain(block);
  expect(activeReviewBlocks(policy, [{ productKey: "sh-hospital-money", category: "SH", applicants: ["member"] }])).toContain(block);
  expect(activeReviewBlocks(policy, [{ productKey: "li-term", category: "LI", applicants: ["member"] }])).not.toContain(block);
  expect(db.semanticRequirements.some(row => row.key === abeProcessingDecisionKey)).toBe(true);
  const copy = structuredClone(db); applyAbeProcessingAdoption(copy); expect(copy).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
  if (process.env.ABE_PROCESSING_REVIEW_CAPTURE === "1") writeFileSync("/private/tmp/abe-processing-review-hashes.json", JSON.stringify({ dividend: abeDividendOwnerHash(db), reviewPolicy: createHash("sha256").update(JSON.stringify(policy)).digest("hex"), navigation: navigationReviewHash(db) }, null, 2));
});

it("treats ABE FUW as post-submission processing without generic online health questions", () => {
  const library = resolvePrototypeLibrary(db, "abe", "fuw-health-review");
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=abe");
  for (const [productKey, age, amount] of [["li-term", 65, 100000], ["li-10yr", 65, 100000], ["li-20yr", 55, 100000], ["di-ltd-plus", 50, 1000], ["di-ltd", 55, 1000], ["di-mtd", 55, 1000], ["oo-professional", 55, 1000]] as const) {
    const product = library.products.find(product => product.id === productKey);
    expect(product, productKey).toBeDefined();
    for (const applicant of site.products.find(product => product.productKey === productKey)!.applicants.filter(row => row.applicantKey !== "child").map(row => row.applicantKey)) {
      const underwriting = route(productKey, applicant, age, amount);
      expect(underwriting, `${productKey}/${applicant}`).toMatchObject({ status: "resolved", pathway: "FUW", healthPage: null });
      if (underwriting.status !== "resolved" || !("healthPage" in underwriting)) throw new Error("Expected resolved processing");
      const answers = { "health-li-q1": "yes", "health-li-q1.details": "Old answer", "health-di-q1": "yes" };
      const participation = resolveQuestionParticipation(site, productKey, applicant, "new", answers, [], [], underwriting.pathway, underwriting.healthPage);
      expect(participation.healthPage).toBeNull();
      expect(participation.activeFields.filter(key => key.startsWith("health-"))).toEqual([]);
      expect(Object.keys(participation.cleanedAnswers).filter(key => key.startsWith("health-"))).toEqual([]);
    }
  }
  expect(route("li-50plus", "member", 60, 100000)).toMatchObject({ pathway: "TELE", healthPage: null });
  const values = { "birth-date": "1960-01-01", state: "PA", membership: "yes", "has-other-life-insurance": "no", coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 100000 }, coverageRiders: { "li-term:cir:member": true } } as ApplicationFormValues;
  expect(getActiveFormFlow(values).filter(page => page.startsWith("health-"))).toEqual([]);
  const diOnly = { ...values, coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member"] }, coverageAmounts: { "di-ltd:member": 1000 }, coverageRiders: {} };
  expect(getActiveFormFlow(diOnly).filter(page => page.startsWith("health-"))).toEqual([]);
}, 120000);

it("preserves every other Site's captured health forms and effective configuration", () => {
  const previous = JSON.parse(readFileSync("public/catalog/portal.json", "utf8")) as { data: DatabaseSchema };
  const oldAbe = resolveEffectiveSite(previous.data, "abe");
  const oldTele = oldAbe.configuration.products.find(product => product.productKey === "li-50plus")!.journeyPolicies[0].value;
  const newTele = site.configuration.products.find(product => product.productKey === "li-50plus")!.journeyPolicies[0].value;
  if (!isCoverageJourneyPolicy(oldTele) || !isCoverageJourneyPolicy(newTele)) throw new Error("Invalid TELE policy");
  expect(newTele.questions).toEqual(oldTele.questions.map(question => ({ ...question, healthPage: null })));
  expect(site.configuration.pages.find(page => page.key === "health-li")).toEqual(oldAbe.configuration.pages.find(page => page.key === "health-li"));
  for (const other of db.sites.filter(row => row.key !== "abe")) {
    expect(resolveEffectiveSite(db, other.key), other.key).toEqual(resolveEffectiveSite(previous.data, other.key));
  }
}, 120000);
