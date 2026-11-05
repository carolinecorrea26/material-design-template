import { abeSiteReviewHash, abeFinalReviewNativeHash } from "./requirementCrosswalkSites";
import { abeSourceOwnerSnapshot } from "./requirementCrosswalkAbeSources";
import { abeDividendOwnerHash } from "./requirementCrosswalkAbeReview";
import { navigationReviewHash } from "./requirementCrosswalkNavigationReview";
import { namedOwnerReviewHash } from "./requirementCrosswalkOwnerReview";
import { profileOwnerEvidenceHash } from "./requirementCrosswalkProfileReview";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createReviewedMigrationDatabase } from "./fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { activeReviewBlocks, isReviewPolicy, resolveReviewConsent } from "../domain/reviewPolicy";
import { configuredHealthQuestionnaire, validateConfiguredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getCategoryQuestionFieldIds } from "../config/coverageQuestionRequirements";
import { isFinancialQuestionnairePolicy, requiresFinancialQuestionnaire } from "../domain/financialQuestionnaire";
import { applicationUnderwriting } from "../domain/coverageRuntime";
import { getActiveFormFlow } from "../config/formFlow";
import { applyAbeApprovedReviewAdoption } from "./abeApprovedReviewAdoption";
import { applyAbeFinancialQuestionnaireAdoption } from "./abeFinancialQuestionnaireAdoption";
import { applyAbeHealthQuestionnairesAdoption } from "./abeHealthQuestionnairesAdoption";
import source from "./sources/health-forms-questions.json";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema, library: PrototypeLibrary;
beforeAll(() => { db = createReviewedMigrationDatabase(); library = resolvePrototypeLibrary(db, "abe", "approved-review"); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const values = (amounts: Record<string, number>) => ({ membership: "yes", state: "PA", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", "has-other-life-insurance": "no", "spouse-has-other-life-insurance": "no", coverageSelections: [...new Set(Object.keys(amounts).map(key => key.split(":")[0]))], productApplicants: Object.fromEntries([...new Set(Object.keys(amounts).map(key => key.split(":")[0]))].map(key => [key, Object.keys(amounts).filter(id => id.startsWith(`${key}:`)).map(id => id.split(":")[1])])), coverageAmounts: amounts });
it("uses both supplied CI forms without repeating the Coverage smoker question", () => {
  expect(createHash("sha256").update(readFileSync(source.workbook)).digest("hex")).toBe(source.sha256);
  installPrototypeLibrary(library);
  for (const applicant of ["member", "spouse"]) for (const combined of [false, true]) {
    const input = values({ [`sh-critical-illness:${applicant}`]: 5000, ...(combined ? { [`li-term:${applicant}`]: 100000 } : {}) });
    const form = configuredHealthQuestionnaire(library.site, "health-ci", applicant, input);
    expect(form.status).toBe("resolved"); expect(form.items).toHaveLength(16);
    expect(form.fields.some(field => /tobacco|nicotine|smok/i.test(field.label))).toBe(false);
    expect(form.items[0].question!.label).toBe(source.questions.find(row => row.row === (combined ? 79 : 197))!.text);
    expect(validateConfiguredHealthQuestionnaire(form, input)).toContain("required");
    const answers = Object.fromEntries(form.fields.map(field => [field.id, "no"]));
    expect(validateConfiguredHealthQuestionnaire(form, answers)).toBeUndefined();
    expect(validateConfiguredHealthQuestionnaire(form, { ...answers, [form.fields[0].id]: "unknown" })).toContain("Answer");
  }
  expect(getCategoryQuestionFieldIds(["SH"], "self")).toContain("smoker");
});
it("routes CI to its separate page, alongside other participating health pages, for ABE only", () => {
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=abe");
  const input = values({ "sh-critical-illness:spouse": 5000, "li-term:member": 100000 });
  expect(applicationUnderwriting(library.products.find(row => row.id === "sh-critical-illness")!, "spouse", input)).toMatchObject({ healthPage: "health-ci" });
  expect(getActiveFormFlow(input)).toEqual(expect.arrayContaining(["health-ci", "health-qd"]));
  expect(getActiveFormFlow(values({ "sh-hospital-money:member": 100 }))).not.toContain("health-ci");
  expect(db.sitePages.filter(row => row.pageKey === "health-ci" && row.requirement !== "none").map(row => row.siteKey)).toEqual(["abe"]);
});
it("requires eight source supplemental DI answers and their conditional details for the adult requesting QD Life and DI", () => {
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=abe");
  const input = values({ "li-term:member": 100000, "di-ltd:member": 2000, "di-ltd:spouse": 1000 });
  const form = configuredHealthQuestionnaire(library.site, "health-di", "member", input);
  expect(form.status).toBe("resolved"); expect(form.items).toHaveLength(8);
  expect(configuredHealthQuestionnaire(library.site, "health-di", "spouse", input).status).toBe("unassigned");
  expect(configuredHealthQuestionnaire(library.site, "health-di", "member", values({ "di-ltd:member": 2000 })).status).toBe("unassigned");
  expect(applicationUnderwriting(library.products.find(row => row.id === "di-ltd")!, "member", input)).toMatchObject({ underwritingType: "QD", healthPage: "health-di" });
  expect(getActiveFormFlow(input)).toEqual(expect.arrayContaining(["health-qd", "health-di"]));
  const answers = Object.fromEntries(form.items.map(item => [item.question!.id, "no"]));
  expect(validateConfiguredHealthQuestionnaire(form, answers)).toBeUndefined();
  const yes = { ...input, ...answers, [form.items[0].question!.id]: "yes" }, details = configuredHealthQuestionnaire(library.site, "health-di", "member", yes), item = details.items[0];
  expect(validateConfiguredHealthQuestionnaire(details, yes)).toContain("Add details");
  expect(item.fields.map(field => field.label)).toEqual(["Date", "Treatment", "Condition", "Name and address of physician and hospital"]);
  expect(validateConfiguredHealthQuestionnaire(details, { ...yes, [item.collection]: [Object.fromEntries(item.fields.map(field => [field.id, field.inputType === "date" ? "2026-01-01" : "Details"]))] })).toBeUndefined();
});
it("uses MCR legal versions, conditional state warnings and the Hospital Money note while preserving dividend controls", () => {
  const policy = library.site.configuration.reviewPolicies[0].value; if (!isReviewPolicy(policy)) throw new Error("Invalid policy");
  expect(policy.authorization?.wording?.defaultText).toMatch(/^AUTHORIZATION:/);
  expect(policy.authorization?.pageIds).toContain("health-ci");
  const selection = [{ productKey: "sh-critical-illness", category: "SH", applicants: ["member"] }];
  expect(resolveReviewConsent(policy, selection, {}, true, { jurisdiction: "VA", underwritingTypes: ["QD"] }).text).toBe(policy.consent!.variants![0].text);
  expect(activeReviewBlocks(policy, selection, { jurisdiction: "VA", healthQuestionParticipation: true }).some(block => block.key === "virginia-ci-certification")).toBe(true);
  expect(activeReviewBlocks(policy, selection, { jurisdiction: "PA", healthQuestionParticipation: true }).some(block => block.key === "virginia-ci-certification")).toBe(false);
  for (const productKey of ["sh-critical-illness", "sh-hospital-money"]) expect(activeReviewBlocks(policy, [{ productKey, category: "SH", applicants: ["member"] }]).find(block => block.key === "supplemental-health-attestation")).toMatchObject({ placement: "read-and-sign-appendix", fontSizePt: 14, fields: [] });
  expect(policy.blocks.filter(block => block.key.startsWith("dividend")).flatMap(block => block.fields)).toEqual(["dividend-acknowledgement", "dividend-first-name", "dividend-last-name", "dividend-birth-date"]);
});
it("configures the inclusive member DI threshold, excludes OO, supports disabling it and collects optional Membership ID on Membership", () => {
  const policies = library.site.configuration.financialQuestionnairePolicies;
  const required = (amounts: Record<string, unknown>, selected = Object.keys(amounts)) => requiresFinancialQuestionnaire(library.site.configuration.products, new Set(selected), amounts, policies);
  expect(required({ "di-ltd": 6999 })).toBe(false); expect(required({ "di-ltd": 7000 })).toBe(true);
  expect(required({ "di-ltd": 4000, "di-mtd": 3000 })).toBe(true);
  expect(required({ "di-ltd": 6000, "oo-professional": 2000 })).toBe(false);
  expect(required({ "di-ltd": 8000 }, [])).toBe(false);
  const policy = structuredClone(policies[0]); if (!isFinancialQuestionnairePolicy(policy.value)) throw new Error("Invalid policy"); policy.value.enabled = false;
  expect(requiresFinancialQuestionnaire(library.site.configuration.products, new Set(["di-ltd"]), { "di-ltd": 8000 }, [policy])).toBe(false);
  expect(library.site.configuration.pages.find(page => page.key === "membership")!.fields.find(field => field.key === "abe-member-id")).toMatchObject({ included: true, definition: { label: "Membership ID", required: false } });
  expect(library.site.configuration.pages.filter(page => page.key !== "membership").some(page => page.fields.some(field => field.key === "abe-member-id" && field.included))).toBe(false);
  const copy = structuredClone(db); applyAbeApprovedReviewAdoption(copy); applyAbeFinancialQuestionnaireAdoption(copy); applyAbeHealthQuestionnairesAdoption(copy); expect(copy).toEqual(db);
});

it("captures verified native fingerprints only when explicitly requested", () => {
  if (process.env.ABE_APPROVED_REVIEW_CAPTURE !== "1") return;
  const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
  writeFileSync("/private/tmp/abe-approved-review-hashes.json", JSON.stringify({ site: abeSiteReviewHash(db), final: abeFinalReviewNativeHash(db), source: hash(abeSourceOwnerSnapshot(db)), dividend: abeDividendOwnerHash(db), reviewPolicy: hash(db.configurationValues.find(row => row.key === "abe.review-policy")!.value), navigation: navigationReviewHash(db), association: namedOwnerReviewHash(db, "association"), "ama-notice": namedOwnerReviewHash(db, "ama-notice"), profile: profileOwnerEvidenceHash(db) }, null, 2));
});
