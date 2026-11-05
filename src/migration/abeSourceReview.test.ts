import { navigationReviewHash } from "./requirementCrosswalkNavigationReview";
import { writeFileSync } from "node:fs";
import capturedReport from "../../docs/project-review/step1-requirement-crosswalk.json";
import { abeSourceReviewMatches, captureAbeSourceEvidence, reviewAbeSourceFollowThrough } from "./requirementCrosswalkAbeSources";
import type { buildRequirementCrosswalk } from "./requirementCrosswalk";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveNormalizedResidency } from "../domain/residencyPolicy";
import { resolveNormalizedSelection } from "../domain/coverageSelectionPolicy";
import { resolveJourneyUnderwriting } from "../domain/coverageJourneyUnderwriting";
import { eligibilityIneligibilityMessage } from "../domain/applicantExperience";
import { fieldValidationChecks } from "../utils/fieldValidation";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { currentMcrSource } from "./currentMcr";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
function selection(...args: Parameters<typeof resolveNormalizedSelection>) {
  const result = resolveNormalizedSelection(...args);
  if (!("election" in result)) throw new Error("Missing native selection contract");
  return result;
}
const source = (sheet: string, cell: string) => String(currentMcrSource.cells.find(row => row.sheet === sheet && row.cell === cell)?.value ?? "").trim();
it("retains required member/spouse SSNs and Membership email, without inventing membership IDs or duplicate email inputs", () => {
  const library = resolvePrototypeLibrary(db, "abe", "collection-review"); installPrototypeLibrary(library);
  const pages = library.site.configuration.pages;
  for (const answer of ["yes", "no"]) expect(eligibilityIneligibilityMessage(library.client.applicantExperience, { membership: "yes", dependents: ["spouse"], "spouse-membership": answer })).toBeUndefined();
  for (const key of ["social-security-number", "spouse-social-security-number"]) {
    const field = pages.find(page => page.key === "profile")!.fields.find(field => field.key === key)!;
    expect(field).toMatchObject({ included: true, definition: { required: true, format: "ssn" } });
    const checks = fieldValidationChecks(field.definition);
    for (const value of ["", "123", "123-45-678"]) expect(checks.every(check => check.validate(value))).toBe(false);
    expect(checks.every(check => check.validate("123-45-6789"))).toBe(true);
  }
  const email = pages.find(page => page.key === "membership")!.fields.find(field => field.key === "email")!;
  expect(email).toMatchObject({ included: true, definition: { required: true, format: "email" } });
  expect(fieldValidationChecks(email.definition).every(check => check.validate("bad"))).toBe(false);
  expect(fieldValidationChecks(email.definition).every(check => check.validate("applicant@example.invalid"))).toBe(true);
  for (const page of pages.filter(page => ["membership", "eligibility", "profile", "contact"].includes(page.key))) expect(page.fields.some(field => field.included && field.definition.required && /member(?:ship)?\s*(?:id|number)/i.test(field.definition.label))).toBe(false);
  for (const page of pages.filter(page => ["eligibility", "contact"].includes(page.key))) expect(page.fields.some(field => field.key === "email" && field.included)).toBe(false);
  expect(pages.find(page => page.key === "eligibility")!.fields.find(field => field.key === "spouse-membership")).toMatchObject({ included: true, definition: { required: true, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] } });
});
it("checks every ABE state-exclusion list against all mainland jurisdictions for each available applicant", () => {
  const site = resolvePrototypeLibrary(db, "abe", "residency-review").site;
  const excluded: Record<string, string[]> = { "li-term": [], "li-10yr": [], "li-20yr": [], "li-50plus": ["CT", "MA", "UT"], "li-add": ["VT", "WA"], "di-ltd-plus": ["NV", "NH", "OH", "VT"], "di-ltd": ["NV", "NH", "OH", "VT"], "di-mtd": ["NV", "NH", "OH", "VT"], "sh-critical-illness": ["CA", "CT", "FL", "IN", "KY", "MD", "MN", "MT", "NV", "OH", "OR", "TN", "TX", "UT", "WA", "NH", "VT"], "oo-professional": ["VT"], "sh-hospital-money": ["VT", "WA"] };
  const mainland = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
  for (const product of site.products) for (const applicant of product.applicants) {
    for (const state of mainland) expect(resolveNormalizedResidency(site, product.productKey, applicant.applicantKey, { jurisdiction: `US-${state}` }).allowed, `${product.productKey}/${applicant.applicantKey}/${state}`).toBe(!excluded[product.productKey].includes(state));
    for (const jurisdiction of ["US-PR", "US-GU", "CA-ON", "US-AP"]) expect(resolveNormalizedResidency(site, product.productKey, applicant.applicantKey, { jurisdiction }).allowed).toBe(false);
    expect(resolveNormalizedResidency(site, product.productKey, applicant.applicantKey, {}).status).toBe("needs-information");
  }
  expect(source("Main", "M39")).toContain("PR is an allowed state, however, the applicant cannot apply online");
  for (const product of site.configuration.products) expect(product.residencyPolicies[0].value).toMatchObject({ provisional: true });
});
it("verifies native R28 ages, applicant roles, exclusions and base coverage without enabling source-only riders", () => {
  const site = resolvePrototypeLibrary(db, "abe", "rider-review").site;
  const rider = "rider.abe.r28", election = { riders: [rider], riderAmounts: {} };
  for (const applicantKey of ["member", "spouse", "child"]) for (const ageYears of [16, 17, 64, 65]) {
    const result = selection(site, "li-term", { mode: "new", applicantKey, ageYears, baseAmount: 20000, jurisdiction: "US-PA" }, election);
    expect(new Set<string>(result.election.riders).has(rider), `${applicantKey}/${ageYears}`).toBe(applicantKey !== "child" && ageYears >= 17 && ageYears <= 64);
  }
  const states = source("Riders", "F32").split(/,\s*/).map(state => `US-${state}`);
  for (const jurisdiction of states) expect(selection(site, "li-term", { mode: "new", applicantKey: "member", ageYears: 35, baseAmount: 20000, jurisdiction }, election).election.riders).toEqual([]);
  expect(selection(site, "li-term", { mode: "new", applicantKey: "member", ageYears: 35, baseAmount: 0, jurisdiction: "US-PA" }, election).election.riders).toEqual([]);
  expect(selection(site, "li-term", { mode: "new", applicantKey: "member", ageYears: 35, baseAmount: 20000 }, election).missingFacts).toContain("jurisdiction");
  for (const product of site.configuration.products.filter(product => product.productKey !== "li-term")) expect(product.riders).toEqual([]);
  expect(site.configuration.products.find(product => product.productKey === "li-term")!.riders.map(rider => rider.key)).toEqual([rider]);
});
it("keeps unavailable applicants unavailable, enforces work/firm facts separately, and does not add a CI work rule", () => {
  const site = resolvePrototypeLibrary(db, "abe", "availability-review").site;
  for (const product of ["li-add", "sh-critical-illness", "sh-hospital-money", "oo-professional"]) {
    expect(site.configuration.lifeAggregates.some(policy => JSON.stringify(policy.value).includes(`"${product}"`))).toBe(false);
    expect(site.configuration.products.find(row => row.productKey === product)!.benefitPolicies.some(policy => "aggregate" in (policy.value as object))).toBe(false);
  }
  for (const [productKey, row] of Object.entries(activeSiteMainRows.abe)) for (const [index, applicant] of ["member", "spouse", "child"].entries()) {
    if (!/^(?:NA|N\/A)$/i.test(source("Main", `${["H", "I", "J"][index]}${row}`))) continue;
    expect(site.products.find(product => product.productKey === productKey)!.applicants.some(row => row.applicantKey === applicant)).toBe(false);
    expect(resolveEffectiveEligibility(site, productKey, applicant, { ageYears: 35 }).eligible === true).toBe(false);
  }
  for (const product of ["di-ltd-plus", "di-ltd", "di-mtd", "oo-professional"]) for (const hours of [29, 30]) expect(resolveEffectiveEligibility(site, product, "member", { ageYears: 35, workHoursPerWeek: hours, firmMemberCount: 3 }).eligible).toBe(hours === 30);
  for (const applicant of ["member", "spouse"]) expect(resolveEffectiveEligibility(site, "sh-critical-illness", applicant, { ageYears: 35 }).eligible).toBe(true);
});
it("separates medical participation and source QD identifiers from approved processing boundaries", () => {
  const library = resolvePrototypeLibrary(db, "abe", "health-flags");
  for (const [productKey, row] of Object.entries(activeSiteMainRows.abe)) {
    const product = library.site.products.find(product => product.productKey === productKey)!;
    for (const [index, applicant] of ["member", "spouse", "child"].entries()) {
      if (!product.applicants.some(row => row.applicantKey === applicant)) continue;
      const expected = /^yes$/i.test(source("Main", `${["U", "V", "W"][index]}${row}`));
      const actual = resolveJourneyUnderwriting(library.site, productKey, applicant, 40, 100000, undefined, undefined, { jurisdiction: "US-PA", existingLifeAmount: 0, memberAmount: 100000, portfolio: [{ productKey, applicantKey: applicant, amount: 100000 }] });
      expect(actual.status, JSON.stringify(actual)).toBe("resolved");
      expect(actual.pathway !== "NA", `${productKey}/${applicant}`).toBe(expected);
    }
  }
  for (const [sheet, supportingRow, mainRow, gNumber] of [["QD LI", 6, 39, "G-2766-3"], ["QD LI", 7, 40, "G-29104-0"], ["QD LI", 8, 41, "G-29168-0"], ["QD DI", 2, 44, "G-29900-0"], ["QD DI", 3, 45, "G-29901-0"], ["QD DI", 4, 46, "G-29902-0"]] as const) {
    expect(source(sheet, `D${supportingRow}`)).toBe(gNumber);
    expect(source("Main", `E${mainRow}`).match(/G-\d+-\d+/)?.[0]).toBe(gNumber);
  }
  expect(resolveJourneyUnderwriting(library.site, "li-10yr", "member", 69, 2000000)).toMatchObject({ status: "resolved", pathway: "FUW" });
  expect(source("QD LI", "J7")).toContain("$100,000-$500,000");
  expect(source("QD LI", "Q7")).not.toBe("");
});

it("captures or verifies exact source/native evidence and retains incomplete supporting clauses", () => {
  if (process.env.ABE_SOURCE_REVIEW_CAPTURE === "1") {
    writeFileSync("/private/tmp/abe-navigation-review-hash.txt", navigationReviewHash(db));
    writeFileSync("docs/project-review/step1-abe-source-review-evidence.json", JSON.stringify(captureAbeSourceEvidence(db), null, 2) + "\n"); return;
  }
  expect(abeSourceReviewMatches(db)).toBe(true);
  const report = capturedReport as unknown as ReturnType<typeof buildRequirementCrosswalk>;
  const review = reviewAbeSourceFollowThrough(db, report);
  expect(review.records.length).toBeGreaterThan(180);
  expect(review.records.every(row => row.status === "recorded-evidence" && row.fullCellContext.includes(row.sourceText))).toBe(true);
  expect(review.records.find(row => row.requirementId === "requirement.mcr.attestation-online-and-pdf.E7.1")?.disposition).toBe("deferred-existing-scope");
  expect(review.records.find(row => row.requirementId === "requirement.mcr.main.R39.3")?.disposition).toBe("superseded-by-existing-decision");
  expect(review.records.find(row => row.requirementId === "requirement.mcr.main.L40.1")?.disposition).toBe("accepted-provisional");
  expect(review.records.find(row => row.requirementId === "requirement.mcr.main.R47.6")?.kind).toBe("approved-inline-ci-attestation");
  expect(review.supportingScopes).toHaveLength(6);
  expect(review.supportingScopes.every(scope => scope.status === "applicability-reviewed")).toBe(true);
  expect(review.supportingSources.find(source => source.reference === "QD LI!J7")!.clauses[0].status).toBe("processing-reviewed");
  expect(review.supportingSources.flatMap(source => source.clauses).some(clause => clause.status === "review-pending")).toBe(true);
  const edited = structuredClone(db); edited.fields.find(field => field.key === "spouse-social-security-number")!.definition.required = false;
  expect(abeSourceReviewMatches(edited)).toBe(false);
  expect(reviewAbeSourceFollowThrough(edited, report).records.every(row => row.status === "reverification-required")).toBe(true);
});
