import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAtpeQuestionnaireAdoption } from "./atpeQuestionnaireAdoption";
import { applyRatePresentationAdoption } from "./ratePresentationAdoption";
import { atpeAssociationKey } from "./atpeAssociationAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire, validateConfiguredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import type { HealthQuestionnairePolicy } from "../domain/configuredHealthQuestionnaire";
import { validateMigrationDatabase } from "./integrity";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { validateHealthPage } from "../config/healthFollowUps";
import { resolveFlowGate, applicantParticipatesInPage } from "../config/flowGates";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import { ApplicationFormContext, type ApplicationFormValues } from "../app/ApplicationFormContext";
import EstimatedRate from "../app/sections/ConfiguredEstimatedRate";
import TotalCostSummary from "../app/sections/ConfiguredTotalCostSummary";
import HealthLi from "../pages/HealthLi";
import { quoteCandidateWithMock } from "../domain/mockRating";
import { resolveRatePresentation } from "../domain/ratePresentation";
import { activeReviewBlocks, isReviewPolicy } from "../domain/reviewPolicy";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });
function setup(data = db) { const library = resolvePrototypeLibrary(data, "isitrust", "source-questionnaire"); installPrototypeLibrary(library); window.history.replaceState(null, "", "/health-li?site=isitrust"); return library; }
function answers(products = ["sh-critical-illness"], association = atpeAssociationKey) {
  return { membership: association, gender: "male", state: "GA", "birth-date": dayjs().subtract(40, "year").format("YYYY-MM-DD"), coverageSelections: products, productApplicants: Object.fromEntries(products.map(key => [key, ["member"]])), coverageAmounts: Object.fromEntries(products.map(key => [`${key}:member`, key === "sh-critical-illness" ? 5000 : 50000])) } as ApplicationFormValues;
}
function completeNo(site: ReturnType<typeof setup>["site"], values: ApplicationFormValues, applicant = "member") {
  for (let pass = 0; pass < 2; pass++) {
    const result = configuredHealthQuestionnaire(site, "health-li", applicant, values);
    for (const item of result.items) {
      if (item.question) values[item.question.id] = "no";
      if (!item.question) for (const field of item.fields) values[field.id] = field.format === "phone" ? "2125551234" : field.format === "month-year" ? "01/2026" : "Test";
    }
  }
  return values;
}

it("selects CI-only, full Life and mixed CI forms per applicant without changing other Associations", () => {
  const { site } = setup();
  const ci = configuredHealthQuestionnaire(site, "health-li", "member", answers());
  expect(ci.items.some(item => item.question?.label.includes("now ill"))).toBe(true);
  expect(ci.items.some(item => item.question?.label.includes("weight change"))).toBe(false);
  const life = configuredHealthQuestionnaire(site, "health-li", "member", answers(["li-10yr"]));
  expect(life.items.some(item => item.question?.label.includes("weight change"))).toBe(true);
  expect(life.items.some(item => item.key.includes("tele-ci-"))).toBe(false);
  const mixed = answers(["li-group-term", "sh-critical-illness"]);
  const result = configuredHealthQuestionnaire(site, "health-li", "member", mixed);
  expect(result.items.filter(item => item.key.includes("tele-ci-"))).toHaveLength(3);
  expect(resolveFlowGate("health-li", mixed)).toBe(true);
  expect(resolveFlowGate("health-si", mixed)).toBe(false);
  expect(applicantParticipatesInPage("health-si", "member", mixed)).toBe(false);
  expect(configuredHealthQuestionnaire(site, "health-li", "member", answers(["li-10yr"], "unassigned-association")).status).toBe("unassigned");
  const values = { ...mixed, productApplicants: { "li-group-term": ["spouse"], "sh-critical-illness": ["member"] } };
  expect(configuredHealthQuestionnaire(site, "health-li", "member", values).items.some(item => item.question?.label.includes("now ill"))).toBe(true);
  expect(configuredHealthQuestionnaire(site, "health-li", "spouse", values).items.some(item => item.key.includes("tele-ci-"))).toBe(false);
});

it("enforces source answers, repeatable details, field lengths and hidden-question retention", () => {
  const { site } = setup(), values = completeNo(site, answers());
  expect(validateHealthPage("health-li", values)).toBeUndefined();
  const result = configuredHealthQuestionnaire(site, "health-li", "member", values), question = result.items[0].question!;
  values[question.id] = "yes";
  let selected = configuredHealthQuestionnaire(site, "health-li", "member", values);
  expect(validateConfiguredHealthQuestionnaire(selected, values)).toContain("Add details");
  const item = selected.items[0], record = Object.fromEntries(item.fields.map(field => [field.id, field.format === "month-year" ? "01/2026" : "Details"]));
  (values as Record<string, unknown>)[item.collection] = [record];
  expect(validateHealthPage("health-li", values)).toBeUndefined();
  record[item.fields.find(field => field.maxLength === 300)!.id] = "x".repeat(301);
  expect(validateHealthPage("health-li", values)).toContain("300");
  values[question.id] = "no";
  selected = configuredHealthQuestionnaire(site, "health-li", "member", values);
  expect(validateConfiguredHealthQuestionnaire(selected, values)).toBeUndefined();
  expect(values[item.collection]).toEqual([record]);
  values[question.id] = "unknown";
  expect(validateHealthPage("health-li", values)).toBeDefined();
  const fields = getClientPageFields("health-li", values);
  expect(fields.every(field => field.id.startsWith("health-source-"))).toBe(true);
  expect(fields.some(field => field.id.startsWith("health-li-q"))).toBe(false);
});

it("uses California wording, gender and crime guards, and the ATPE Virginia CI certification", () => {
  const { site } = setup();
  const ca = configuredHealthQuestionnaire(site, "health-li", "member", { ...answers(), state: "CA" });
  expect(ca.items.some(item => item.question?.label.includes("Substance Abuse"))).toBe(true);
  expect(ca.items.some(item => item.key === "health-source-ci-4i")).toBe(false);
  const female = configuredHealthQuestionnaire(site, "health-li", "spouse", { ...answers(["li-10yr"]), "spouse-gender": "female", state: "MN", productApplicants: { "li-10yr": ["spouse"] } });
  expect(female.items.some(item => item.key === "health-source-tele-pregnant")).toBe(true);
  expect(female.items.some(item => item.key === "health-source-tele-crime-mn-ct")).toBe(true);
  expect(female.items.every(item => !item.question || item.question.id.endsWith("-spouse"))).toBe(true);
  const policy = site.configuration.reviewPolicies[0].value;
  if (!isReviewPolicy(policy)) throw new Error("Invalid Review fixture");
  const selection = [{ productKey: "sh-critical-illness", category: "SH", applicants: ["member"] }];
  expect(activeReviewBlocks(policy, selection, { jurisdiction: "VA", associationKey: atpeAssociationKey }).find(block => block.key === "ci-virginia-certification")?.placement).toBe("before-signature");
  expect(activeReviewBlocks(policy, selection, { jurisdiction: "PA", associationKey: atpeAssociationKey }).some(block => block.key === "ci-virginia-certification")).toBe(false);
  expect(activeReviewBlocks(policy, selection, { jurisdiction: "VA", associationKey: "akron-bar-association" }).some(block => block.key === "ci-virginia-certification")).toBe(false);
});

it("persists native questionnaire edits, isolates captures, and rejects missing field references", () => {
  const before = setup(), edited = structuredClone(db), field = edited.fields.find(row => row.key === "health-source-ci-1")!;
  field.definition.label = "Edited scoped CI question";
  const after = resolvePrototypeLibrary(edited, "isitrust", "edited-questionnaire");
  expect(configuredHealthQuestionnaire(after.site, "health-li", "member", answers()).items[0].question?.label).toBe("Edited scoped CI question");
  expect(configuredHealthQuestionnaire(before.site, "health-li", "member", answers()).items[0].question?.label).not.toBe("Edited scoped CI question");
  edited.fields = edited.fields.filter(row => row.key !== field.key);
  expect(validateMigrationDatabase(edited)).toContain("Orphan health questionnaire field isitrust.atpe.health-questionnaires");
  const invalid = structuredClone(db);
  const row = invalid.configurationValues.find(row => row.key === "isitrust.atpe.health-questionnaires")!;
  (row.value as unknown as HealthQuestionnairePolicy).variants[0].when.none = ["unknown-product"];
  expect(validateMigrationDatabase(invalid)).toContain("Orphan health questionnaire product isitrust.atpe.health-questionnaires");
  row.value = { version: 999 };
  const malformed = resolvePrototypeLibrary(invalid, "isitrust", "malformed-questionnaire");
  expect(configuredHealthQuestionnaire(malformed.site, "health-li", "member", answers()).status).toBe("unresolved");
  const reapplied = structuredClone(db); applyAtpeQuestionnaireAdoption(reapplied); expect(reapplied).toEqual(db);
  const rate = structuredClone(reapplied.configurationValues.find(row => row.key === "isitrust.reviewed-rate-presentation"));
  applyRatePresentationAdoption(reapplied);
  expect(reapplied.configurationValues.find(row => row.key === rate!.key)).toEqual(rate);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("suppresses ATPE quotes before transport and hides shared price/summary surfaces", async () => {
  const { site } = setup(), quote = vi.fn();
  expect(resolveRatePresentation(site, "li-group-term", atpeAssociationKey)).toMatchObject({ quoteToolEnabled: false, coverageQuoteEnabled: false, hideCalculatedRates: true });
  expect(resolveRatePresentation(site, "li-group-term", "akron-bar-association").coverageQuoteEnabled).toBe(true);
  expect(await quoteCandidateWithMock(site, "li-group-term", { association: atpeAssociationKey, amount: 50000 }, { method: "bill-me", frequency: "monthly" }, { quote })).toMatchObject({ status: "unavailable", displayPrice: false });
  expect(quote).not.toHaveBeenCalled();
  const view = (membership: string) => renderToStaticMarkup(<ApplicationFormContext.Provider value={{ values: { membership }, setPageValues: () => {}, resetValues: () => {} }}><EstimatedRate amount={12} /><TotalCostSummary items={[{ id: "li-group-term", name: "Life", amount: 12 }]} total={12} /></ApplicationFormContext.Provider>);
  expect(view(atpeAssociationKey)).toBe("");
  expect(view("akron-bar-association")).toContain("$12.00");
});

it("renders the source form and conditional follow-up fields through the real page", async () => {
  const { site } = setup(), values = completeNo(site, answers());
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const question = configuredHealthQuestionnaire(site, "health-li", "member", values).items[0].question!;
  values[question.id] = "yes";
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(<MemoryRouter><ApplicationSessionProvider><ApplicationFormContext.Provider value={{ values, setPageValues: () => {}, resetValues: () => {} }}><HealthLi /></ApplicationFormContext.Provider></ApplicationSessionProvider></MemoryRouter>));
    expect(container.textContent).toContain("Are you  now ill");
    expect(container.textContent).toContain("Add condition details");
    expect(container.textContent).not.toContain("Are you currently confined to a hospital");
  } finally { await act(async () => root.unmount()); container.remove(); }
});
