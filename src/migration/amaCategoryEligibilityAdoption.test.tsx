import { act, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import dayjs from "dayjs";
import { createReviewedMigrationDatabase } from "./fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { categoryEligibility, readCategoryEligibilityPolicy, reconcileCategoryElections } from "../domain/categoryEligibilityPolicy";
import { ApplicationFormContext, type ApplicationFormValues } from "../app/ApplicationFormContext";
import { useCoverageState } from "../app/useCoverageState";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); window.sessionStorage.clear(); });
const facts = { "birth-date": dayjs().subtract(35, "year").format("YYYY-MM-DD"), "hours-worked-per-week": 100, "actively-at-work": "yes" };

it.each([
  { answer: "physician", allowed: ["LI", "AD", "DI", "OO", "SH"] },
  { answer: "resident", allowed: ["LI", "DI", "SH"] },
  { answer: "student", allowed: ["LI", "SH"] },
  { answer: "retired", allowed: ["LI", "SH"] },
  { answer: "spouse", allowed: ["LI"] },
])("enforces $answer category eligibility in both captured runtime paths", ({ answer, allowed }) => {
  const library = resolvePrototypeLibrary(db, "ama", "test:category-policy"); installPrototypeLibrary(library);
  for (const product of library.products) {
    const eligible = allowed.includes(product.categoryId);
    expect(resolveApplicationCoverage(product, "member", { ...facts, membership: answer }, library.products).eligibility, product.id).toBe(eligible ? "eligible" : "ineligible");
    expect(resolveEffectiveEligibility(library.site, product.id, "member", { ageYears: 35, workHoursPerWeek: 100, activelyAtWork: true, membershipType: answer }), product.id).toMatchObject({ status: "resolved", eligible });
  }
});

it("defers an unanswered pre-membership quote but never the application eligibility gate", () => {
  const library = resolvePrototypeLibrary(db, "ama", "test:unanswered"); installPrototypeLibrary(library);
  const product = library.products.find(product => product.id === "li-term")!;
  expect(resolveApplicationCoverage(product, "member", facts).eligibility).toBe("needs-information");
  expect(resolveApplicationCoverage(product, "member", facts, library.products, { deferUnansweredMembership: true }).eligibility).toBe("eligible");
  expect(resolveApplicationCoverage(product, "member", { ...facts, membership: "invalid" }, library.products, { deferUnansweredMembership: true }).eligibility).toBe("ineligible");
});

it("removes incompatible saved elections and their amounts/options while preserving allowed coverage", () => {
  const library = resolvePrototypeLibrary(db, "ama", "test:restore");
  const policy = readCategoryEligibilityPolicy(library.site.configuration.categoryEligibilityPolicies);
  const values = { membership: "student", coverageSelections: ["li-term", "di-step-rated"], selectedCategoryChips: ["LI", "DI"],
    productApplicants: { "li-term": ["member"], "di-step-rated": ["member"] }, coverageAmounts: { "li-term:member": 25000, "di-step-rated:member": 100 },
    coverageRiders: { "di-step-rated:cola:member": true }, coverageRiderOnly: { "di-step-rated:member": "cola" }, coverageWaitingPeriods: { "di-step-rated:member": "60" } };
  const before = structuredClone(values), patch = reconcileCategoryElections(policy, values, library.products)!;
  expect(patch).toMatchObject({ coverageSelections: ["li-term"], selectedCategoryChips: ["LI"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 25000 }, coverageRiders: {}, coverageRiderOnly: {}, coverageWaitingPeriods: {} });
  expect(values).toEqual(before);
  expect(reconcileCategoryElections(policy, { ...values, ...patch }, library.products)).toBeNull();
});

it("uses edited stored category values and leaves other Sites and historical snapshots alone", () => {
  const changed = JSON.parse(JSON.stringify(db)) as DatabaseSchema;
  changed.configurationValues.find(row => row.key === "ama.applicant-category-eligibility")!.value = { version: 1, fieldId: "membership", allowedByAnswer: { student: ["LI", "DI"] } };
  const library = resolvePrototypeLibrary(changed, "ama", "test:edited"); installPrototypeLibrary(library);
  expect(resolveApplicationCoverage(library.products.find(product => product.categoryId === "DI")!, "member", { ...facts, membership: "student" }).eligibility).toBe("eligible");
  const other = resolvePrototypeLibrary(db, "asce", "test:isolation");
  expect(other.site.configuration.categoryEligibilityPolicies).toHaveLength(0);
  expect(categoryEligibility(null, undefined, "DI")).toBe("eligible");
  const invalid = structuredClone(db);
  invalid.configurationValues.find(row => row.key === "ama.applicant-category-eligibility")!.value = { version: 1, fieldId: "membership", allowedByAnswer: { student: ["unsupported"] } };
  expect(() => resolvePrototypeLibrary(invalid, "ama", "test:invalid")).toThrow("No unique valid category eligibility policy");
});

it("updates the actual Coverage hook and cleans restored selections when applicant type changes", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/coverage?site=ama");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "ama", "test:hook"));
  let state!: ReturnType<typeof useCoverageState>, update!: (membership: string) => void;
  function Consumer() { const current = useCoverageState(); useEffect(() => { state = current; }); return null; }
  function Application() {
    const [values, setValues] = useState<ApplicationFormValues>({ ...facts, membership: "physician", coverageSelections: ["li-term", "di-step-rated", "oo-office-overhead"], selectedCategoryChips: ["LI", "DI", "OO"], productApplicants: { "li-term": ["member"], "di-step-rated": ["member"], "oo-office-overhead": ["member"] } });
    useEffect(() => { update = membership => setValues(previous => ({ ...previous, membership })); });
    return <ApplicationFormContext.Provider value={{ values, setPageValues: patch => setValues(previous => ({ ...previous, ...patch })), resetValues: () => {} }}><Consumer /></ApplicationFormContext.Provider>;
  }
  const root = createRoot(document.createElement("div"));
  try {
    await act(async () => root.render(<Application />));
    expect(state.availableCategories.map(category => category.id)).toContain("OO");
    await act(async () => update("resident"));
    expect(state.availableCategories.map(category => category.id)).toEqual(["LI", "DI", "SH"]);
    expect(state.selectedCoverageIds).not.toContain("oo-office-overhead");
    await act(async () => update("student"));
    expect(state.availableCategories.map(category => category.id)).toEqual(["LI", "SH"]);
    expect(state.selectedCoverageIds).toEqual(["li-term"]);
    await act(async () => update("spouse"));
    expect(state.availableCategories.map(category => category.id)).toEqual(["LI"]);
  } finally { await act(async () => root.unmount()); }
});
