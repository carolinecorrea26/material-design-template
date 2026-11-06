import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import Eligibility from "../pages/Eligibility";
import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAbeEligibilityAdoption } from "./abeEligibilityAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { applicationApplicantFactSet } from "../utils/applicantFacts";
import { isEligibilityFactRequirements } from "../domain/eligibilityFacts";
import type { DatabaseSchema } from "../persistence/types";
const form = vi.hoisted(() => ({ values: { membership: "yes", dependents: ["child"], children: [{ "child-first-name": "Taylor", "child-last-name": "Example", "child-birth-date": "2010-01-01" }] }, setPageValues: vi.fn(), saveApplication: vi.fn() }));
vi.mock("../app/ApplicationFormContext", () => ({ useApplicationForm: () => form }));
vi.mock("../app/ApplicationSessionContext", () => ({ useApplicationSession: () => ({ reviewSubmitted: false, markReviewSubmitted: vi.fn() }) }));
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); vi.unstubAllGlobals(); });
const plans = [{ productKey: "li-term", categoryKey: "LI", applicantKey: "member" }, { productKey: "li-add", categoryKey: "AD", applicantKey: "member" }, { productKey: "sh-hospital-money", categoryKey: "SH", applicantKey: "member" }];
it("adopts later effective adult ages for both applicants without applying old QD ages as entry limits", () => {
  const library = resolvePrototypeLibrary(db, "abe", "adult-ages"); installPrototypeLibrary(library);
  for (const [productKey, maximum] of [["li-10yr", 69], ["li-20yr", 59]] as const) for (const applicant of ["member", "spouse"] as const) for (const ageYears of [16, 17, 18, 54, 59, 60, 64, 65, 69, 70]) {
    const expected = ageYears >= 17 && ageYears <= maximum;
    expect(resolveEffectiveEligibility(library.site, productKey, applicant, { ageYears, selectedPlans: plans }).eligible, `${productKey}/${applicant}/${ageYears}`).toBe(expected);
    const birth = dayjs().subtract(ageYears, "year").format("YYYY-MM-DD");
    expect(resolveApplicationCoverage(library.products.find(p => p.id === productKey)!, applicant, { "birth-date": birth, "spouse-birth-date": birth, membership: "yes", productApplicants: { [productKey]: ["member", "spouse"] } }, library.products).eligibility).toBe(expected ? "eligible" : "ineligible");
  }
});
it("checks day and year boundaries using age facts alone", () => {
  const library = resolvePrototypeLibrary(db, "abe", "child-ages"); installPrototypeLibrary(library);
  for (const product of ["li-term", "li-10yr", "li-20yr", "li-add"]) for (const ageYears of [0, 25, 26, 27]) for (const ageDays of [0, 13, 14, 365]) {
    const native = resolveEffectiveEligibility(library.site, product, "child", { ageYears, ageDays, selectedPlans: plans });
    expect(native.eligible === true, `${product}/${ageYears}/${ageDays}`).toBe(ageYears <= 26 && (product === "li-add" || ageDays >= 14));
  }
  for (const days of [13, 14]) {
    const values = { "child-birth-date": dayjs().subtract(days, "day").format("YYYY-MM-DD"), productApplicants: { "li-term": ["member", "child"] } };
    expect(resolveApplicationCoverage(library.products.find(p => p.id === "li-term")!, "child", values, library.products).eligibility).toBe(days === 14 ? "eligible" : "ineligible");
  }
});
it("requires honorable discharge only for Hospital Money ages 26–29 and preserves per-child answers", () => {
  const library = resolvePrototypeLibrary(db, "abe", "service-extension"); installPrototypeLibrary(library);
  for (const ageYears of [0, 25, 26, 29, 30]) for (const honorablyDischargedServiceMember of [undefined, false, true]) {
    const facts = { ageYears, ageDays: ageYears * 366, honorablyDischargedServiceMember, selectedPlans: plans };
    const native = resolveEffectiveEligibility(library.site, "sh-hospital-money", "child", facts);
    const expected = ageYears <= 25 ? "eligible" : ageYears >= 30 || honorablyDischargedServiceMember === false ? "ineligible" : honorablyDischargedServiceMember === undefined ? "needs-information" : "eligible";
    expect(native.status === "needs-information" ? "needs-information" : native.eligible ? "eligible" : "ineligible", `${ageYears}/${honorablyDischargedServiceMember}`).toBe(expected);
    const values = { children: [{ "child-birth-date": dayjs().subtract(ageYears, "year").format("YYYY-MM-DD"), "child-honorably-discharged-service-member": honorablyDischargedServiceMember }], productApplicants: { "sh-hospital-money": ["member", "child"] } };
    expect(resolveApplicationCoverage(library.products.find(p => p.id === "sh-hospital-money")!, "child", values, library.products).eligibility).toBe(expected);
  }
  const mapping = library.fieldCollections.children.mapping;
  expect(mapping.fieldToKey["child-honorably-discharged-service-member"]).toBe("child-honorably-discharged-service-member");
  expect(mapping.fields.find(field => field.id === "child-honorably-discharged-service-member")?.required).toBe(true);
  const facts = applicationApplicantFactSet({ children: [{ "child-honorably-discharged-service-member": "yes" }, { "child-honorably-discharged-service-member": "no" }] }, "child");
  expect(facts.map(fact => fact.honorablyDischargedServiceMember)).toEqual([true, false]);
  expect(resolvePrototypeLibrary(db, "nso", "other").fieldCollections.children.mapping.fieldToKey["child-honorably-discharged-service-member"]).toBeUndefined();
});
it("retains DI spouse minimum hours, supports editable native bounds", () => {
  const library = resolvePrototypeLibrary(db, "abe", "work-hours"); installPrototypeLibrary(library);
  for (const product of ["di-ltd-plus", "di-ltd", "di-mtd"]) for (const workHoursPerWeek of [undefined, 29, 30, 40]) {
    const result = resolveEffectiveEligibility(library.site, product, "spouse", { ageYears: 35, workHoursPerWeek });
    expect(result.eligible === true, `${product}/${workHoursPerWeek}`).toBe(workHoursPerWeek !== undefined && workHoursPerWeek >= 30);
    const values = { "spouse-birth-date": dayjs().subtract(35, "year").format("YYYY-MM-DD"), "spouse-hours-worked-per-week": workHoursPerWeek };
    expect(resolveApplicationCoverage(library.products.find(row => row.id === product)!, "spouse", values, library.products).eligibility).toBe(workHoursPerWeek === undefined ? "needs-information" : workHoursPerWeek < 30 ? "ineligible" : "eligible");
  }
  expect(library.fieldCollections.children.mapping.fields.map(field => field.id)).toEqual(["child-first-name", "child-last-name", "child-birth-date", "child-gender", "child-honorably-discharged-service-member"]);
  const copy = structuredClone(db); applyAbeEligibilityAdoption(copy); expect(copy).toEqual(db);
  copy.eligibilityConstraints.find(row => row.siteKey === "abe" && row.productKey === "li-10yr" && row.applicantTypeKey === "member")!.maximumAgeYears = 68;
  expect(resolveEffectiveEligibility(resolvePrototypeLibrary(copy, "abe", "edited").site, "li-10yr", "member", 69).eligible).toBe(false);
  expect(resolveEffectiveEligibility(library.site, "li-10yr", "member", 69).eligible).toBe(true);
  for (const value of [-1, 29.5, Infinity, "29"]) expect(isEligibilityFactRequirements([{ fact: "honorablyDischargedServiceMember", extendsMaximumAgeTo: value }])).toBe(false);
});

it("renders the child eligibility informational note", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/eligibility?site=abe");
  const library = resolvePrototypeLibrary(db, "abe", "child-note"); installPrototypeLibrary(library);
  const container = document.createElement("div"), root = createRoot(container); document.body.append(container);
  try {
    await act(async () => root.render(createElement(MemoryRouter, null, createElement(Eligibility))));
    expect(container.textContent).toContain("Only unmarried children are eligible for coverage.");
  } finally { await act(async () => root.unmount()); container.remove(); }
});
