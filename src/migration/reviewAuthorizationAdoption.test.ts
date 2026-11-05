import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyReviewAuthorizationAdoption } from "./reviewAuthorizationAdoption";
import { applyReviewAndRateAdoption } from "./reviewAndRateAdoption";
import { resolvePrototypeLibrary, installPrototypeLibrary } from "../domain/prototypeLibrary";
import { composeReadAndSign, resolveReviewExperience } from "../config/reviewExperience";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { reviewDefaults } from "../content/defaults/review";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it.each([
  ["ama", "sh-hospital-income", "member", undefined, false],
  ["ama", "li-term", "child", undefined, false],
  ["isitrust", "sh-critical-illness", "member", atpeAssociationKey, true],
  ["isitrust", "li-10yr", "spouse", atpeAssociationKey, true],
  ["isitrust", "li-20yr", "member", atpeAssociationKey, true],
  ["isitrust", "li-add", "member", atpeAssociationKey, false],
  ["isitrust", "li-50plus", "member", atpeAssociationKey, false],
  ["waepa-gi", "li-group-term", "member", undefined, false],
  ["abe", "li-add", "member", undefined, false],
] as const)("uses actual question participation for %s/%s/%s", (siteKey, productKey, applicant, association, expected) => {
  window.history.replaceState(null, "", `/?site=${siteKey}`);
  const library = resolvePrototypeLibrary(db, siteKey, "authorization"); installPrototypeLibrary(library);
  const values = { membership: siteKey === "ama" ? "physician" : association ?? "yes", association, state: "PA", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", coverageSelections: [productKey], productApplicants: { [productKey]: [applicant] }, coverageAmounts: { [`${productKey}:${applicant}`]: 100000 } };
  const result = resolveReviewExperience(library.client, siteKey, library.products, values);
  expect(result.authorizationVisible).toBe(expected);
  const content = composeReadAndSign(reviewDefaults.readAndSignContent, result.fraudNotice, result.consent.text, result.authorizationVisible, result.medicalAuthorization);
  expect(content.includes("AUTHORIZATION:")).toBe(expected);
  expect(content.includes("MIB, other insurance companies")).toBe(false);
  expect(content.includes("right to require additional information")).toBe(expected);
  expect(content).toContain("CONSENT:");
  expect(content).toContain("payment of a premium contribution");
  if (result.fraudNotice) expect(content).toContain(result.fraudNotice);
});

it.each([
  ["MN", "li-20yr", "remains continually insured", true],
  ["VA", "li-20yr", "electronic health record company", false],
  ["VA", "li-group-term", "AUTHORIZATION:", false],
  ["PA", "li-20yr", "24 months", false],
] as const)("renders the source authorization for %s/%s with one consent and the correct Minnesota placement", (state, product, phrase, minnesota) => {
  const library = resolvePrototypeLibrary(db, "isitrust", "source-authorization"); installPrototypeLibrary(library);
  // Group Term at this amount follows SI; 20-Year follows QD with full health questions.
  const values = { membership: atpeAssociationKey, state, "birth-date": "1986-01-01", coverageSelections: [product], productApplicants: { [product]: ["member"] }, coverageAmounts: { [`${product}:member`]: 100000 } };
  const result = resolveReviewExperience(library.client, "isitrust", library.products, values);
  const content = composeReadAndSign(reviewDefaults.readAndSignContent, result.fraudNotice, result.consent.text, result.authorizationVisible, result.medicalAuthorization);
  expect(content).toContain(phrase);
  expect(content.match(/CONSENT:/g)).toHaveLength(1);
  expect(content).not.toContain("site specific or standard consent");
  expect(content.includes("This  AUTHORIZATION  excludes")).toBe(minnesota);
  if (minnesota) expect(content.indexOf("This  AUTHORIZATION  excludes")).toBeGreaterThan(content.indexOf("CONSENT:"));
  if (state === "VA") expect(content.includes("electronic health record company")).toBe(product === "li-20yr");
  if (result.fraudNotice) expect(content.indexOf(result.fraudNotice)).toBeLessThan(content.indexOf("CONSENT:"));
});

it("assigns eight native policies, preserves ABE and compiler reapplication, and rejects malformed guards", () => {
  const assignments = db.configurationValues.filter(row => isReviewPolicy(row.value) && row.value.authorization);
  expect(assignments.map(row => row.siteKey).sort()).toEqual(["abe", "ama", "asce", "avma", "csea", "isitrust", "nso", "waepa", "waepa-gi"].sort());
  expect(assignments.filter(row => row.siteKey !== "abe").every(row => row.configurationKey === "shared.review-policy")).toBe(true);
  for (const authorization of [null, {}, { when: "participating-health-questions", pageIds: ["health-cir"], sourceReferences: ["test"] }]) {
    expect(isReviewPolicy({ ...assignments[0].value as object, authorization })).toBe(false);
  }
  const copy = structuredClone(db), abe = structuredClone(db.configurationValues.find(row => row.key === "abe.review-policy"));
  applyReviewAuthorizationAdoption(copy); expect(copy).toEqual(db);
  applyReviewAndRateAdoption(copy);
  for (const row of assignments) expect(copy.configurationValues.find(other => other.key === row.key)).toEqual(row);
  expect(copy.configurationValues.find(row => row.key === "abe.review-policy")).toEqual(abe);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("uses the captured editable authorization guard and honors excluded question pages", () => {
  const captured = resolvePrototypeLibrary(db, "isitrust", "before-guard-edit");
  const edited = structuredClone(db), row = edited.configurationValues.find(row => row.key === "isitrust.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid fixture policy");
  row.value.authorization!.pageIds = ["health-si"];
  const after = resolvePrototypeLibrary(edited, "isitrust", "after-guard-edit");
  const values = { membership: atpeAssociationKey, state: "PA", "birth-date": "1986-01-01", coverageSelections: ["sh-critical-illness"], productApplicants: { "sh-critical-illness": ["member"] }, coverageAmounts: { "sh-critical-illness:member": 10000 } };
  for (const [library, expected] of [[captured, true], [after, false]] as const) {
    installPrototypeLibrary(library);
    expect(resolveReviewExperience(library.client, "isitrust", library.products, values).authorizationVisible).toBe(expected);
  }
  const withoutQuestions = structuredClone(captured.client);
  withoutQuestions.pages = { participationSource: "sitePages", requirements: { "health-li": "none", "health-si": "none", "health-di": "none" } };
  installPrototypeLibrary(captured);
  expect(resolveReviewExperience(withoutQuestions, "isitrust", captured.products, values).authorizationVisible).toBe(false);
});
