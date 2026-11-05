import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAbeFirmSizeAdoption } from "./abeFirmSizeAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { resolveApplicationCoverage, validateApplicationCoverages } from "../domain/coverageRuntime";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { coverageFactFieldIds } from "../config/fields/coverageFactFields";
import { isEligibilityFactRequirements } from "../domain/eligibilityFacts";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const base = { membership: "yes", "birth-date": "1990-01-01", "state-province": "PA", "hours-worked-per-week": 30, "monthly-business-expenses": 10000, coverageSelections: ["oo-professional"], productApplicants: { "oo-professional": ["member"] }, coverageAmounts: { "oo-professional:member": 1000 } };
it("enforces firm members independently of hours and rejects missing, fractional and out-of-range facts in both runtimes", () => {
  const library = resolvePrototypeLibrary(db, "abe", "firm-count"); installPrototypeLibrary(library);
  const product = library.products.find(row => row.id === "oo-professional")!;
  for (const count of [undefined, NaN, Infinity, -1, 0, 1, 5, 6, 1.5]) {
    const eligible = count === 1 || count === 5;
    const native = resolveEffectiveEligibility(library.site, product.id, "member", { ageYears: 35, workHoursPerWeek: 30, firmMemberCount: count });
    expect(native.eligible === true, String(count)).toBe(eligible);
    expect(resolveApplicationCoverage(product, "member", { ...base, "firm-member-count": count }, library.products).eligibility === "eligible", String(count)).toBe(eligible);
  }
  expect(resolveEffectiveEligibility(library.site, product.id, "member", { ageYears: 35, workHoursPerWeek: 29, firmMemberCount: 3 })).toMatchObject({ eligible: false });
  expect(resolveEffectiveEligibility(library.site, product.id, "member", { ageYears: 35, firmMemberCount: 3 }).status).toBe("needs-information");
  expect(validateApplicationCoverages(library.products, { ...base, "firm-member-count": 6 })).toContain("eligibility");
});
it("collects a required whole-number count only for selected ABE Overhead, with separate employee facts and captured edits", () => {
  window.history.replaceState(null, "", "/coverage?site=abe");
  const library = resolvePrototypeLibrary(db, "abe", "field"); installPrototypeLibrary(library);
  expect(getClientPageFields("coverage", base).find(field => field.id === "firm-member-count")).toMatchObject({ required: true, inputType: "number", label: "How many members are in your firm?" });
  expect(coverageFactFieldIds(library.products, base)).toContain("firm-member-count");
  for (const selections of [[], ["li-term"], ["di-ltd"]]) {
    const values = { ...base, coverageSelections: selections, "firm-member-count": 6 };
    expect(getClientPageFields("coverage", values).some(field => field.id === "firm-member-count")).toBe(false);
    expect(coverageFactFieldIds(library.products, values)).not.toContain("firm-member-count");
  }
  const copy = structuredClone(db); applyAbeFirmSizeAdoption(copy); expect(copy).toEqual(db);
  copy.configurationValues.find(row => row.key === "abe.oo-professional.firm-member-eligibility")!.value = [{ fact: "firmMemberCount", minimum: 1, maximum: 10, integer: true }];
  const edited = resolvePrototypeLibrary(copy, "abe", "edited");
  expect(resolveEffectiveEligibility(edited.site, "oo-professional", "member", { ageYears: 35, workHoursPerWeek: 30, firmMemberCount: 6 })).toMatchObject({ eligible: true });
  expect(resolveEffectiveEligibility(library.site, "oo-professional", "member", { ageYears: 35, workHoursPerWeek: 30, firmMemberCount: 6 })).toMatchObject({ eligible: false });
  for (const site of ["avma", "isitrust"]) { installPrototypeLibrary(resolvePrototypeLibrary(db, site, "other")); window.history.replaceState(null, "", `/coverage?site=${site}`); expect(getClientPageFields("coverage", base).some(field => field.id === "firm-member-count")).toBe(false); }
  for (const rule of [{ fact: "firmMemberCount", minimum: 5, maximum: 1, integer: true }, { fact: "firmMemberCount", minimum: 1, maximum: 5, integer: false }, { fact: "firmMemberCount", minimum: 1, maximum: Infinity, integer: true }, { fact: "firmMemberCount", equals: true }]) expect(isEligibilityFactRequirements([rule])).toBe(false);
});
