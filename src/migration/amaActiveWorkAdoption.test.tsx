import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAmaActiveWorkAdoption } from "./amaActiveWorkAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveApplicationCoverage, validateApplicationCoverages } from "../domain/coverageRuntime";
import { getCategoryQuestionFieldIds } from "../config/coverageQuestionRequirements";
import { getQuoteRequirements } from "../config/fields/homeQuoteFields";
import { getSurfaceFields } from "../config/fields/storedSurfaces";
import { ApplicationFormContext, type ApplicationFormValues } from "../app/ApplicationFormContext";
import { ApplicationSessionProvider } from "../app/ApplicationSessionContext";
import Coverage from "../pages/Coverage";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.useRealTimers(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
const values = (answer?: string): ApplicationFormValues => ({ membership: "physician", "birth-date": dayjs().subtract(35, "year").format("YYYY-MM-DD"), "state-province": "NY", gender: "female", "average-monthly-income": "20000", ...(answer ? { "actively-at-work": answer } : {}) });

it("executes the stored AMA answer with no hours threshold in both eligibility APIs", () => {
  const library = resolvePrototypeLibrary(db, "ama", "test:active-work");
  installPrototypeLibrary(library);
  for (const product of library.products.filter(product => product.categoryId === "DI")) {
    expect(resolveEffectiveEligibility(library.site, product.id, "member", { membershipType: "physician", ageYears: 35, activelyAtWork: true, workHoursPerWeek: 0 })).toMatchObject({ status: "resolved", eligible: true });
    expect(resolveEffectiveEligibility(library.site, product.id, "member", { membershipType: "physician", ageYears: 35, activelyAtWork: false, workHoursPerWeek: 100 })).toMatchObject({ status: "resolved", eligible: false });
    expect(resolveEffectiveEligibility(library.site, product.id, "member", { membershipType: "physician", ageYears: 35 })).toMatchObject({ status: "needs-information" });
    expect(resolveApplicationCoverage(product, "member", values("yes"), library.products).eligibility).toBe("eligible");
    expect(resolveApplicationCoverage(product, "member", { ...values("no"), "hours-worked-per-week": "100" }, library.products).eligibility).toBe("ineligible");
    expect(resolveApplicationCoverage(product, "member", values(), library.products).eligibility).toBe("needs-information");
    expect(validateApplicationCoverages(library.products, { ...values("no"), coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] }, coverageAmounts: { [`${product.id}:member`]: 100 } })).toContain("eligibility");
  }
});

it("scopes the replacement to AMA DI and uses the same quote field", () => {
  const library = resolvePrototypeLibrary(db, "ama", "test:questions");
  installPrototypeLibrary(library);
  expect(getCategoryQuestionFieldIds(["DI"])).toEqual(["gender", "actively-at-work", "average-monthly-income"]);
  expect(getCategoryQuestionFieldIds(["DI", "LI"])).not.toContain("hours-worked-per-week");
  expect(getCategoryQuestionFieldIds(["LI"])).not.toContain("actively-at-work");
  expect(getCategoryQuestionFieldIds(["DI", "OO"])).toContain("hours-worked-per-week");
  expect(getQuoteRequirements(library.client, ["DI"])).toMatchObject({ needsActiveWork: true, needsHours: false });
  expect(getSurfaceFields("quoteInputs").find(field => field.id === "actively-at-work")?.label).toBe("Are you actively at work performing the normal duties of your occupation?");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "test:other-site"));
  expect(getCategoryQuestionFieldIds(["DI"])).toContain("hours-worked-per-week");
  expect(getCategoryQuestionFieldIds(["DI"])).not.toContain("actively-at-work");
});

it("preserves the decision on serialization and follows edited Library policy values", () => {
  const changed = JSON.parse(JSON.stringify(db)) as DatabaseSchema;
  const policy = changed.configurationValues.find(row => row.key === "ama.di-step-rated.active-work")!;
  policy.value = [{ fact: "activelyAtWork", equals: false }];
  const library = resolvePrototypeLibrary(changed, "ama", "test:edited-policy");
  installPrototypeLibrary(library);
  expect(resolveEffectiveEligibility(library.site, "di-step-rated", "member", { membershipType: "physician", ageYears: 35, activelyAtWork: false })).toMatchObject({ eligible: true });
  expect(resolveApplicationCoverage(library.products.find(product => product.id === "di-step-rated")!, "member", values("no"), library.products).eligibility).toBe("eligible");
  const repeated = structuredClone(db);
  applyAmaActiveWorkAdoption(repeated);
  expect(repeated).toEqual(db);
});

it.each([{ categories: ["DI"] }, { categories: ["DI", "LI"] }])("renders the standard DI alert for selected categories $categories", async ({ categories }) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("requestAnimationFrame", () => 0);
  vi.useFakeTimers();
  window.history.replaceState(null, "", "/coverage?site=ama");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "ama", "test:rendered-coverage"));
  function Application() {
    const [formValues, setValues] = useState<ApplicationFormValues>({ ...values("no"), selectedCategoryChips: categories, coverageSelections: ["di-step-rated"], productApplicants: { "di-step-rated": ["member"] }, coverageAmounts: { "di-step-rated:member": 100 } });
    return <ApplicationFormContext.Provider value={{ values: formValues, setPageValues: patch => setValues(previous => ({ ...previous, ...patch })), resetValues: () => {} }}><ApplicationSessionProvider><MemoryRouter initialEntries={["/coverage"]}><Coverage /></MemoryRouter></ApplicationSessionProvider></ApplicationFormContext.Provider>;
  }
  const container = document.createElement("div"); document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Application />));
    await act(async () => { await vi.advanceTimersByTimeAsync(1100); });
    expect(container.textContent).toContain("Are you actively at work performing the normal duties of your occupation?");
    expect(container.querySelector('[name="hours-worked-per-week"]')).toBeNull();
    expect([...container.querySelectorAll('[role="alert"]')].some(alert => /Based on your answers, you are not eligible for .*coverage at this time/.test(alert.textContent ?? ""))).toBe(true);
    expect(container.textContent).not.toContain("Disability Insurance with Step Rated Premiums");
    if (categories.includes("LI")) expect(container.textContent).toContain("20-Year Level Term Life Insurance");
  } finally {
    await act(async () => root.unmount()); container.remove();
  }
});
