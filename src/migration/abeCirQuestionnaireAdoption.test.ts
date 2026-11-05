import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAbeCirQuestionnaireAdoption } from "./abeCirQuestionnaireAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire, validateConfiguredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { applicantParticipatesInPage, resolvePageParticipation } from "../config/flowGates";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { validateHealthPage } from "../config/healthFollowUps";
import { getActiveFormFlow } from "../config/formFlow";
import { resolveQuestionParticipation } from "../domain/coverageJourney";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { reconcileCoverageSelection, isSelectionPolicy } from "../domain/coverageSelectionPolicy";
import { currentMcrSource } from "./currentMcr";
import source from "./sources/health-forms-questions.json";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema, library: PrototypeLibrary, configuredLibrary: PrototypeLibrary;
beforeAll(() => {
  db = createReviewedMigrationDatabase(); library = resolvePrototypeLibrary(db, "abe", "cir-review");
  const enabled = structuredClone(db);
  enabled.sitePages.find(page => page.siteKey === "abe" && page.pageKey === "health-cir")!.requirement = "required";
  configuredLibrary = resolvePrototypeLibrary(enabled, "abe", "cir-enabled-positive-control");
}, 120000);
afterEach(() => installPrototypeLibrary(null));
const input = (riders: Record<string, boolean> = { "li-term:cir:member": true }) => ({ membership: "yes", state: "PA", "birth-date": "1986-01-01", "spouse-birth-date": "1986-01-01", dependents: ["spouse"], "has-other-life-insurance": "no", "spouse-has-other-life-insurance": "no", coverageSelections: ["li-term"], productApplicants: { "li-term": ["member", "spouse"] }, coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 100000 }, coverageRiders: riders });
const enabledLibrary = () => configuredLibrary;
const answersFor = (applicant: string) => Object.fromEntries(configuredHealthQuestionnaire(enabledLibrary().site, "health-cir", applicant, input({ [`li-term:cir:${applicant}`]: true })).fields.map(field => [field.id, field.options?.find(option => option.value === "no")?.value ?? field.options?.[0]?.value]));

it("retains the one supplied CHR form for enabled Sites without treating ABE underwriting flags as a separate questionnaire assignment", () => {
  expect(configuredHealthQuestionnaire(library.site, "health-cir", "member", input()).status).toBe("unassigned");
  const form = configuredHealthQuestionnaire(enabledLibrary().site, "health-cir", "member", input());
  expect(form.status).toBe("resolved"); expect(form.items).toHaveLength(12);
  const rows = source.questions.filter(row => row.form === "CHR");
  for (const [index, item] of form.items.entries()) {
    expect(item.sourceReferences).toContain(`health_forms_questions.xlsx#Health questions!D${rows[index].row}`);
    if (rows[index].id !== "11") expect(item.question!.label).toBe(rows[index].text);
  }
  for (const coordinate of ["M32", "N32"]) expect(currentMcrSource.cells.find(row => row.sheet === "Riders" && row.cell === coordinate)?.value).toBe("Yes");
  const policy = library.site.configuration.products.find(product => product.productKey === "li-term")!.selectionPolicies[0].value;
  if (!isSelectionPolicy(policy)) throw new Error("Invalid selection policy");
  expect(policy.modes).not.toContain("rider-only");
  expect(reconcileCoverageSelection(policy, { mode: "new", applicantKey: "member", ageYears: 40, baseAmount: 0, jurisdiction: "US-PA" }, { riders: ["rider.abe.r28"], riderAmounts: {} }).election.riders).toEqual([]);
  const copy = structuredClone(db); applyAbeCirQuestionnaireAdoption(copy); expect(copy).toEqual(db);
  expect(resolvePrototypeLibrary(db, "waepa", "other-site").site.configuration.healthQuestionnairePolicies.some(row => (row.value as { pageId?: string }).pageId === "health-cir")).toBe(false);
});

it("skips CIR on ABE and requires both Site enablement and that adult's CIR selection when configured", () => {
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=abe");
  const values = input();
  for (const applicant of ["member", "spouse"] as const) expect(applicantParticipatesInPage("health-cir", applicant, input({ "li-term:cir:member": true, "li-term:cir:spouse": true }))).toBe(false);
  expect(resolvePageParticipation("health-cir", values)).toBe(false);
  expect(getActiveFormFlow(values)).not.toContain("health-cir");
  expect(getClientPageFields("health-cir", values)).toEqual([]);
  expect(validateHealthPage("health-cir", values)).toBeUndefined();
  const enabled = enabledLibrary(); installPrototypeLibrary(enabled);
  expect(resolvePageParticipation("health-cir", values)).toBe(true);
  expect(applicantParticipatesInPage("health-cir", "member", values)).toBe(true);
  expect(applicantParticipatesInPage("health-cir", "spouse", values)).toBe(false);
  expect(configuredHealthQuestionnaire(enabled.site, "health-cir", "spouse", values).status).toBe("unassigned");
  expect(resolvePageParticipation("health-cir", input({}))).toBe(false);
  expect(getClientPageFields("health-cir", values)).toHaveLength(12);
  expect(getClientPageFields("health-cir", values).every(field => field.id.endsWith("-member"))).toBe(true);
  expect(getActiveFormFlow(values)).toEqual(expect.arrayContaining(["health-qd", "health-cir"]));
  expect(getActiveFormFlow(values)).not.toContain("health-li");
  const removed = { ...values, coverageSelections: [] };
  expect(resolvePageParticipation("health-cir", removed)).toBe(false);
  expect(configuredHealthQuestionnaire(enabled.site, "health-cir", "member", removed).status).toBe("unassigned");
  expect(validateHealthPage("health-cir", removed)).toBeUndefined();
  const both = input({ "li-term:cir:member": true, "li-term:cir:spouse": true });
  expect(validateHealthPage("health-cir", { ...both, ...answersFor("member") })).toContain("required");
  expect(validateHealthPage("health-cir", { ...both, ...answersFor("member"), ...answersFor("spouse") })).toBeUndefined();
});

it("requires the source assistance activities after Yes and an explanation only for Other dwelling", () => {
  const values: Record<string, unknown> = { ...input(), ...answersFor("member") };
  const form = () => configuredHealthQuestionnaire(enabledLibrary().site, "health-cir", "member", values);
  expect(validateConfiguredHealthQuestionnaire(form(), values)).toBeUndefined();
  const assistance = form().items[0]; values[assistance.question!.id] = "yes";
  const activityId = form().items[0].fields[0].id;
  expect(validateConfiguredHealthQuestionnaire(form(), values)).toContain("required");
  Object.assign(values, { [activityId]: ["Bathing"] });
  expect(validateConfiguredHealthQuestionnaire(form(), values)).toBeUndefined();
  Object.assign(values, { [activityId]: ["Unknown activity"] });
  expect(validateConfiguredHealthQuestionnaire(form(), values)).toContain("Answer");
  Object.assign(values, { [assistance.question!.id]: "no", [form().items[10].question!.id]: "other" });
  expect(validateConfiguredHealthQuestionnaire(form(), values)).toContain("Please specify");
  Object.assign(values, { [form().items[10].fields[0].id]: "Another dwelling" });
  expect(validateConfiguredHealthQuestionnaire(form(), values)).toBeUndefined();
});

it("skips separate CIR answers on ABE while preserving native Life routing and the configured CIR form for enabled Sites", () => {
  const policy = resolveCoverageJourneyPolicy(library.site, "li-term")!;
  const attestation = policy.questions.find(row => row.applicantKey === "member" && row.modes.includes("new"))!.attestationKey;
  const values = { smoker: "no", ...answersFor("member") };
  const skipped = resolveQuestionParticipation(library.site, "li-term", "member", "new", values, [attestation], ["rider.abe.r28"], "QD", "health-qd");
  expect(skipped).toMatchObject({ allowed: true, healthPage: "health-qd", cirQuestionnaireRequired: false });
  expect(skipped.activeFields.some(key => key.startsWith("health-chr-"))).toBe(false);
  expect(skipped.cleanedAnswers).not.toHaveProperty("health-chr-form-108-member");
  const resolve = (answers: Record<string, unknown>, riders = ["rider.abe.r28"]) => resolveQuestionParticipation(enabledLibrary().site, "li-term", "member", "new", answers, [attestation], riders, "QD", "health-qd");
  const missing = resolve({ smoker: "no" });
  expect(missing.healthPage).toBe("health-qd"); expect(missing.allowed).toBe(false);
  expect(missing.missingFacts).toContain("health-chr-form-98-member");
  expect(resolve(values)).toMatchObject({ allowed: true, healthPage: "health-qd" });
  expect(resolve(values).cleanedAnswers).toHaveProperty("health-chr-form-108-member", "Private Home");
  expect(resolve(values, []).cleanedAnswers).not.toHaveProperty("health-chr-form-108-member");
});
