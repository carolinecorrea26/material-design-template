import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyNsoAccidentAgeAdoption, applyNsoAccidentChildAgeAdoption } from "./nsoAccidentAgeAdoption";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { inspectAsceBusinessDecisions } from "../domain/asceBusinessDecisions";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("uses the source inclusive adult boundaries in both eligibility paths, preserving captured edits and ASCE approvals", () => {
  const library = resolvePrototypeLibrary(db, "nso", "accident-ages"); installPrototypeLibrary(library);
  const product = library.products.find(row => row.id === "li-add")!;
  const selectedPlans = [{ productKey: "li-add", categoryKey: "AD", applicantKey: "member" }];
  for (const role of ["member", "spouse"] as const) for (const age of [16, 17, 18, 64, 65, 69, 70]) {
    const expected = age >= 17 && age <= 69;
    const native = resolveEffectiveEligibility(library.site, product.id, role, { ageYears: age, selectedPlans });
    expect(native.eligible, `${role}/${age}: ${native.reason}`).toBe(expected);
    const birth = dayjs().subtract(age, "year").format("YYYY-MM-DD");
    const values = { membership: "yes", "birth-date": birth, "spouse-birth-date": birth, dependents: ["spouse"], coverageSelections: ["li-add"], productApplicants: { "li-add": ["member", "spouse"] }, coverageAmounts: { "li-add:member": 100000, "li-add:spouse": 50000 } };
    expect(resolveApplicationCoverage(product, role, values, library.products).eligibility, `${role}/${age}`).toBe(expected ? "eligible" : "ineligible");
  }
  const repeated = structuredClone(db), child = structuredClone(db.eligibilityConstraints.filter(row => row.siteKey === "nso" && row.applicantTypeKey === "child"));
  applyNsoAccidentAgeAdoption(repeated); expect(repeated).toEqual(db);
  expect(repeated.eligibilityConstraints.filter(row => row.siteKey === "nso" && row.applicantTypeKey === "child")).toEqual(child);
  expect(inspectAsceBusinessDecisions(db).every(row => row.approved)).toBe(true);
  repeated.eligibilityConstraints.find(row => row.siteKey === "nso" && row.productKey === "li-add" && row.applicantTypeKey === "member")!.maximumAgeYears = 65;
  expect(resolveEffectiveEligibility(resolvePrototypeLibrary(repeated, "nso", "edited").site, product.id, "member", { ageYears: 69 }).eligible).toBe(false);
  expect(resolveEffectiveEligibility(library.site, product.id, "member", { ageYears: 69 }).eligible).toBe(true);
});

it("requires student status only for the child age extension and uses the shared native collection", () => {
  const library = resolvePrototypeLibrary(db, "nso", "child-ages");
  const selectedPlans = [{ productKey: "li-add", categoryKey: "AD", applicantKey: "member" }];
  for (const ageYears of [18, 19, 25, 26]) for (const fullTimeStudent of [undefined, false, true]) {
    const result = resolveEffectiveEligibility(library.site, "li-add", "child", { ageYears, fullTimeStudent, selectedPlans });
    if (ageYears > 18 && fullTimeStudent === undefined) expect(result.status).toBe("needs-information");
    else expect(result.eligible, `${ageYears}/${fullTimeStudent}`).toBe(ageYears <= 18 || ageYears <= 25 && fullTimeStudent === true);
  }
  const mapping = library.fieldCollections.children.mapping;
  expect(mapping.fieldToKey["child-full-time-student"]).toBe("fullTimeStudent");
  expect(mapping.fields.find(field => field.id === "child-full-time-student")?.required).toBe(true);
  const repeated = structuredClone(db); applyNsoAccidentChildAgeAdoption(repeated); expect(repeated).toEqual(db);
});
