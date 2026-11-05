import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyCombinedDisabilityQuestionnaireAdoption } from "./combinedDisabilityQuestionnaireAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { configuredHealthQuestionnaire, isHealthQuestionnairePolicy, validateConfiguredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { validateHealthPage } from "../config/healthFollowUps";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import { ApplicationFormContext, type ApplicationFormValues } from "../app/ApplicationFormContext";
import HealthDi from "../pages/HealthDi";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { evaluateCoveragePortfolio } from "../domain/coveragePortfolio";
import { resolveCoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { createCoverageJourneyFixture } from "./coverageJourneyExceptionAcceptance";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });
function setup(siteKey = "waepa", data = db) { const library = resolvePrototypeLibrary(data, siteKey, "combined-DI"); installPrototypeLibrary(library); window.history.replaceState(null, "", `/health-di?site=${siteKey}`); return library; }
function values(age = 50, lifeAmount = 200000): ApplicationFormValues { return { membership: "current", gender: "male", "spouse-gender": "male", state: "PA", "birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"), "spouse-birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"), coverageSelections: ["li-group-term", "di-short-term"], productApplicants: { "li-group-term": ["member"], "di-short-term": ["member"] }, coverageAmounts: { "li-group-term:member": lifeAmount, "di-short-term:member": 1000 } }; }
const complete = (site: ReturnType<typeof setup>["site"], answers: ApplicationFormValues, applicant = "member") => { for (const item of configuredHealthQuestionnaire(site, "health-di", applicant, answers).items) if (item.question) answers[item.question.id] = "no"; return answers; };
it("uses source supplemental DI only for each adult's QD Life plus FUW DI combination", () => {
  const library = setup();
  const combined = values(); const form = configuredHealthQuestionnaire(library.site, "health-di", "member", combined);
  expect(form.status).toBe("resolved"); expect(form.items).toHaveLength(8); expect(form.items[0].question?.label).toBe("Do you contemplate any medical or surgical treatment?");
  for (const input of [values(49), values(60), values(50, 1000000), { ...combined, coverageSelections: ["di-short-term"] }]) expect(configuredHealthQuestionnaire(library.site, "health-di", "member", input).status).toBe("unassigned");
  expect(configuredHealthQuestionnaire(library.site, "health-di", "member", { ...combined, coverageAmounts: {} }).status).toBe("unresolved");
  expect(configuredHealthQuestionnaire(library.site, "health-di", "spouse", combined).status).toBe("unassigned");
  expect(configuredHealthQuestionnaire(library.site, "health-di", "member", { ...combined, productApplicants: { "li-group-term": ["spouse"], "di-short-term": ["member"] } }).status).toBe("unassigned");
  expect(getClientPageFields("health-di", combined).some(field => field.id === "health-di-q1")).toBe(false);
  expect(getClientPageFields("health-di", values(60)).some(field => field.id.startsWith("health-di-q"))).toBe(true);
});
it("requires complete repeated source details and keeps inactive answers out of the form", () => {
  const library = setup(), input = complete(library.site, values());
  expect(validateHealthPage("health-di", input)).toBeUndefined();
  const first = configuredHealthQuestionnaire(library.site, "health-di", "member", input).items[0]; input[first.question!.id] = "yes";
  let form = configuredHealthQuestionnaire(library.site, "health-di", "member", input);
  expect(validateConfiguredHealthQuestionnaire(form, input)).toContain("Add details");
  const item = form.items[0]; (input as Record<string, unknown>)[item.collection] = [{ ...Object.fromEntries(item.fields.map(field => [field.id, field.format === "month-year" ? "01/2026" : "Mock detail"])) }];
  form = configuredHealthQuestionnaire(library.site, "health-di", "member", input); expect(validateConfiguredHealthQuestionnaire(form, input)).toBeUndefined();
  (input as Record<string, unknown>)[item.collection] = [{ [item.fields[0].id]: "01/2026" }]; expect(validateConfiguredHealthQuestionnaire(form, input)).toContain("required");
});
it("assigns the same shared source fields to NSO without changing DI-only or other Sites", () => {
  const library = setup("nso");
  const input = { ...values(), membership: "yes", coverageSelections: ["li-term", "di-ltd"], productApplicants: { "li-term": ["member"], "di-ltd": ["member"] }, coverageAmounts: { "li-term:member": 100000, "di-ltd:member": 1000 } };
  expect(configuredHealthQuestionnaire(library.site, "health-di", "member", input).items.map(item => item.questionFieldKey)).toEqual(configuredHealthQuestionnaire(resolvePrototypeLibrary(db, "waepa", "same-fields").site, "health-di", "member", values()).items.map(item => item.questionFieldKey));
  expect(configuredHealthQuestionnaire(library.site, "health-di", "member", { ...input, coverageSelections: ["di-ltd"] }).status).toBe("unassigned");
  expect(configuredHealthQuestionnaire(resolvePrototypeLibrary(db, "asce", "isolated").site, "health-di", "member", input).status).toBe("unassigned");
  const copy = structuredClone(db); applyCombinedDisabilityQuestionnaireAdoption(copy); expect(copy).toEqual(db); expect(validateMigrationDatabase(db)).toEqual([]);
  expect(isHealthQuestionnairePolicy({ version: 1, applicability: "site", associationKeys: [], pageId: "health-di", whenProcessing: "unknown", variants: [] })).toBe(false);
});
it("requires source answers in native portfolios, rejects missing combination facts and strips legacy answers", async () => {
  const library = setup(), input = complete(library.site, values());
  const fixture = (productKey: string) => createCoverageJourneyFixture(library.site, productKey, resolveCoverageJourneyPolicy(library.site, productKey)!.mappings.find(row => row.when.mode === "new" && row.when.applicantKey === "member")!.when);
  const life = fixture("li-group-term"), di = fixture("di-short-term");
  for (const entry of [life, di]) entry.input.eligibility.ageYears = 50;
  life.input.amount = 200000; di.input.amount = 1000;
  const missing = await evaluateCoveragePortfolio(library.site, [life.input, di.input], { policies: di.policies }, 0);
  expect(missing.allowed).toBe(false); expect(missing.missingFacts.some(key => key.includes("health-source-supp-di"))).toBe(true);
  di.input.answers = { ...di.input.answers, ...input };
  const result = await evaluateCoveragePortfolio(library.site, [life.input, di.input], { policies: di.policies }, 0);
  expect(result.allowed, JSON.stringify(result)).toBe(true);
  expect(result.submissions![1].questions).toHaveProperty("health-source-supp-di-contemplated-treatment-member", "no"); expect(result.submissions![1].questions).not.toHaveProperty("health-di-q1");
  di.input.eligibility.selectedPlans!.push({ productKey: "li-group-term", categoryKey: "LI", applicantKey: "member" });
  expect((await evaluateCoverageJourney(library.site, di.input, { policies: di.policies })).allowed).toBe(false);
});
it("renders the source form and conditional details through Health DI", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); const library = setup(), input = complete(library.site, values());
  input["health-source-supp-di-benefits-member"] = "yes";
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try { await act(async () => root.render(<MemoryRouter><ApplicationSessionProvider><ApplicationFormContext.Provider value={{ values: input, setPageValues: () => {}, resetValues: () => {} }}><HealthDi /></ApplicationFormContext.Provider></ApplicationSessionProvider></MemoryRouter>)); expect(container.textContent).toContain("Do you contemplate any medical or surgical treatment?"); expect(container.textContent).toContain("Have you ever received or claimed benefits"); expect(container.querySelector('[name="health-source-supp-di-benefits-health-source-detail-details-member"]')).not.toBeNull(); }
  finally { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); }
});
