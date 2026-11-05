import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAmaConsentAdoption } from "./amaConsentAdoption";
import { applyReviewAndRateAdoption } from "./reviewAndRateAdoption";
import { resolveEffectiveSite } from "../domain/effectiveSite";
import { isReviewPolicy, resolveReviewConsent, validateCapturedReview, type ReviewPolicy, type ReviewSelection } from "../domain/reviewPolicy";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { composeReadAndSign, resolveReviewExperience } from "../config/reviewExperience";
import { getEffectiveSiteConfig } from "../data/registry";
import { reviewDefaults } from "../content/defaults/review";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const selection = (productKey: string, category: string, applicant = "member"): ReviewSelection => ({ productKey, category, applicants: [applicant] });
function policy(data = db) {
  const value = resolveEffectiveSite(data, "ama").configuration.reviewPolicies[0].value;
  if (!isReviewPolicy(value)) throw new Error("Invalid test policy");
  return value;
}

it("uses AMA's source consent and retains the physician claim only for the selected Physician role", () => {
  const p = policy(), other = [selection("sh-hospital-income", "SH")];
  for (const answer of ["physician", "resident", "student", "retired", "spouse"]) {
    const result = resolveReviewConsent(p, other, { membership: answer });
    expect(result.status).toBe("resolved");
    expect(result.text!.includes("I am a physician and")).toBe(answer === "physician");
    expect(result.text).toContain("AMA Insurance Agency receives this request");
    expect(result.text).not.toContain("date my request is approved");
    expect(validateCapturedReview(resolveEffectiveSite(db, "ama"), "PA", other, { membership: answer }).allowed).toBe(true);
  }
  expect(resolveReviewConsent(p, other, {})).toMatchObject({ status: "needs-information", text: null, missing: ["membership"] });
  expect(validateCapturedReview(resolveEffectiveSite(db, "ama"), "PA", other, {}).allowed).toBe(false);
  for (const membership of [false, "unknown", {}, []]) expect(resolveReviewConsent(p, other, { membership }).status).toBe("unresolved");
  const invalid = structuredClone(p) as unknown as { consent: { otherOpening: unknown } };
  invalid.consent.otherOpening = null;
  expect(isReviewPolicy(invalid)).toBe(false);
});

it("selects the underwritten text for any member/spouse Life, DI or Overhead request, including mixed selections", () => {
  const p = policy();
  for (const rule of p.consent!.underwrittenWhen) for (const applicant of rule.applicants) {
    const result = resolveReviewConsent(p, [selection("sh-hospital-income", "SH"), selection(rule.productKey, "LI", applicant)], { membership: "student" });
    expect(result.text, `${rule.productKey}/${applicant}`).toBe(p.consent!.underwrittenText);
    expect(result.text).not.toContain("I am a physician");
  }
  for (const selections of [[selection("li-term", "LI", "child")], [selection("li-premier-accident", "AD")], [selection("sh-hospital-income", "SH")]]) {
    expect(resolveReviewConsent(p, selections, { membership: "student" }).text).toBe(p.consent!.otherText);
  }
});

it("replaces one consent section in the live Review projection and keeps the applicable fraud notice", () => {
  const library = resolvePrototypeLibrary(db, "ama", "consent-reviewed"); installPrototypeLibrary(library);
  const values = { membership: "physician", state: "PA", coverageSelections: ["sh-hospital-income"], productApplicants: { "sh-hospital-income": ["member"] } };
  const experience = resolveReviewExperience(getEffectiveSiteConfig("ama"), "ama", library.products, values);
  expect(experience.consent.text).toContain("I am a physician");
  const content = composeReadAndSign(reviewDefaults.readAndSignContent, experience.fraudNotice, experience.consent.text);
  expect(content.match(/CONSENT:/g)).toHaveLength(1);
  expect(content).toContain("AUTHORIZATION:");
  expect(content).toContain(experience.fraudNotice);
  expect(content).not.toContain("I request the insurance applied for (for myself");
});

it("persists edited scoped copy, isolates captures and other Sites, and preserves adoption on compiler reapplication", () => {
  const captured = resolveEffectiveSite(db, "ama"), other = resolveEffectiveSite(db, "abe");
  const edited = JSON.parse(JSON.stringify(db)) as DatabaseSchema;
  const row = edited.configurationValues.find(row => row.key === "ama.review-policy")!;
  const value = row.value as unknown as ReviewPolicy;
  value.consent!.otherText = "CONSENT:\nBy signing I accept the edited test consent.";
  expect(resolveReviewConsent(policy(edited), [selection("sh-hospital-income", "SH")], { membership: "student" }).text).toContain("edited test consent");
  expect(captured.configuration.reviewPolicies).toEqual(resolveEffectiveSite(db, "ama").configuration.reviewPolicies);
  expect(resolveEffectiveSite(edited, "abe")).toEqual(other);
  const original = structuredClone(db);
  applyAmaConsentAdoption(original); expect(original).toEqual(db);
  const consent = structuredClone(original.configurationValues.find(row => row.key === "ama.review-policy"));
  applyReviewAndRateAdoption(original);
  expect(original.configurationValues.find(row => row.key === "ama.review-policy")).toEqual(consent);
  expect(validateMigrationDatabase(db)).toEqual([]);
  value.consent!.underwrittenWhen[0].productKey = "unknown";
  expect(validateMigrationDatabase(edited)).toContain("Orphan Review consent scope ama.review-policy");
});
