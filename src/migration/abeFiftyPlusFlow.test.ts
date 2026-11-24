// Historical adoption: resolve the captured input, never today's application source.
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { installPrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveSnapshotTestLibrary as resolvePrototypeLibrary } from "./snapshotTestLibrary";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { resolveQuestionParticipation } from "../domain/coverageJourney";
import { isReviewPolicy } from "../domain/reviewPolicy";
import { getActiveFormFlow, getNextFormPageId, getPreviousFormPageId } from "../config/formFlow";
import { getActiveProgressSteps } from "../config/progressSteps";
import { applicantParticipatesInPage } from "../config/flowGates";
import { composeReadAndSign, resolveReviewExperience } from "../config/reviewExperience";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const input = {
  membership: "yes", state: "AL", "birth-date": "1960-01-01", "has-other-life-insurance": "no",
  coverageSelections: ["li-50plus"], productApplicants: { "li-50plus": ["member"] }, coverageAmounts: { "li-50plus:member": 25000 },
};
function verify(library: PrototypeLibrary) {
  window.history.replaceState(null, "", "/?site=abe"); installPrototypeLibrary(library);
  expect(applicationUnderwriting(library.products.find(product => product.id === "li-50plus")!, "member", input)).toMatchObject({ status: "resolved", underwritingType: "TELE", healthPage: null });
  expect(getActiveFormFlow(input).filter(page => page.startsWith("health-"))).toEqual([]);
  expect(getNextFormPageId("profile", input)).toBe("review");
  expect(getPreviousFormPageId("review", input)).toBe("profile");
  expect(getActiveProgressSteps(input).flatMap(step => step.pageIds).filter(page => page.startsWith("health-"))).toEqual([]);
  expect(applicantParticipatesInPage("health-tele", "member", input)).toBe(false);
  const participation = resolveQuestionParticipation(library.site, "li-50plus", "member", "new", { "health-li-q1": "yes", "health-li-q1.details": "Stale answer" }, [], [], "TELE", null);
  expect(participation.healthPage).toBeNull();
  expect(participation.activeFields.filter(key => key.startsWith("health-"))).toEqual([]);
  expect(participation.cleanedAnswers).not.toHaveProperty("health-li-q1");
  const result = resolveReviewExperience(library.client, "abe", library.products, input);
  expect(result.authorizationVisible).toBe(true);
  const policy = library.client.reviewPolicy!;
  expect(result.consent.text).toBe(policy.consent!.underwrittenText);
  const text = composeReadAndSign(library.content.review.readAndSignContent, result.fraudNotice, result.consent.text, result.authorizationVisible, result.medicalAuthorization, result.premiumContributionStatement);
  expect(text.match(/AUTHORIZATION:/g)).toHaveLength(1);
  expect(text).toContain(policy.authorization!.introductoryStatement);
  expect(text).toContain(policy.authorization!.wording!.defaultText);
  expect(text.match(/CONSENT:/g)).toHaveLength(1);
}
it("skips online health questions but keeps medical authorization for the tested 50+ Life path", () => verify(resolvePrototypeLibrary(db, "abe", "50plus-correction")));
it("preserves corrected behavior after serializing the captured migration", () => {
  const saved = JSON.parse(JSON.stringify(db)) as DatabaseSchema;
  verify(resolvePrototypeLibrary(saved, "abe", "50plus-saved"));
});
it("keeps required FUW authorization without questions and excludes accident-only, child-only and deselected coverage", () => {
  const library = resolvePrototypeLibrary(db, "abe", "authorization-independent"); installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=abe");
  for (const [productKey, applicant, expected] of [["li-term", "member", true], ["li-add", "member", false], ["li-term", "child", false]] as const) {
    const values = { ...input, coverageSelections: [productKey], productApplicants: { [productKey]: [applicant] }, coverageAmounts: { [`${productKey}:${applicant}`]: 25000 } };
    expect(getActiveFormFlow(values).filter(page => page.startsWith("health-"))).toEqual([]);
    const result = resolveReviewExperience(library.client, "abe", library.products, values);
    expect(result.authorizationVisible).toBe(expected);
    expect(result.consent.text).toBe(expected ? library.client.reviewPolicy!.consent!.underwrittenText : library.client.reviewPolicy!.consent!.otherText);
  }
  expect(resolveReviewExperience(library.client, "abe", library.products, { ...input, coverageSelections: [] }).authorizationVisible).toBe(false);
});
it("preserves separately assigned CI and supplemental DI forms in a mixed selection", () => {
  const library = resolvePrototypeLibrary(db, "abe", "50plus-mixed"); installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/?site=abe");
  const values = { ...input, dependents: ["spouse"], "spouse-birth-date": "1986-01-01", coverageSelections: ["li-50plus", "li-term", "di-ltd", "sh-critical-illness"], productApplicants: { "li-50plus": ["member"], "li-term": ["spouse"], "di-ltd": ["spouse"], "sh-critical-illness": ["member"] }, coverageAmounts: { "li-50plus:member": 25000, "li-term:spouse": 100000, "di-ltd:spouse": 1000, "sh-critical-illness:member": 5000 } };
  expect(getActiveFormFlow(values).filter(page => page.startsWith("health-"))).toEqual(expect.arrayContaining(["health-qd", "health-di-supp", "health-tele"]));
  expect(applicantParticipatesInPage("health-tele", "spouse", values)).toBe(false);
  expect(applicantParticipatesInPage("health-di-supp", "member", values)).toBe(false);
  expect(applicantParticipatesInPage("health-di-supp", "spouse", values)).toBe(true);
});
it("uses captured editable authorization rules and rejects incomplete underwriting guards", () => {
  const edited = structuredClone(db), row = edited.configurationValues.find(row => row.key === "abe.review-policy")!;
  if (!isReviewPolicy(row.value)) throw new Error("Invalid policy");
  const policy = row.value;
  for (const underwritingTypes of [undefined, [], ["GI"], ["FUW", "FUW"]]) expect(isReviewPolicy({ ...policy, authorization: { ...policy.authorization, underwritingTypes } })).toBe(false);
  policy.authorization = { ...policy.authorization!, when: "participating-health-questions" }; delete policy.authorization.underwritingTypes;
  const library = resolvePrototypeLibrary(edited, "abe", "edited-guard"); installPrototypeLibrary(library);
  expect(resolveReviewExperience(library.client, "abe", library.products, input).authorizationVisible).toBe(false);
});
