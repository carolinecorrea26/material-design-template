import dayjs from "dayjs";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyWorkEligibilityAdoption, reviewedWorkEligibility } from "./workEligibilityAdoption";
import { mcrSource } from "./mcr";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { resolveEffectiveEligibility } from "../domain/effectiveSite";
import { coverageFactFieldIds } from "../config/fields/coverageFactFields";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it.each(reviewedWorkEligibility)("$siteKey/$productKey uses the sourced $hours hour requirement in both runtime paths", ({ siteKey, productKey, hours }) => {
  const library = resolvePrototypeLibrary(JSON.parse(JSON.stringify(db)), siteKey, "test:work-eligibility");
  installPrototypeLibrary(library);
  const product = library.products.find(product => product.id === productKey)!;
  const values = { "birth-date": dayjs().subtract(35, "year").format("YYYY-MM-DD"), "active-military": "no", "firm-member-count": 3 };
  for (const [worked, expected] of hours === null ? [[undefined, "eligible"], [0, "eligible"]] as const : [[undefined, "needs-information"], [hours - 1, "ineligible"], [hours, "eligible"], [hours + 1, "eligible"]] as const) {
    expect(resolveApplicationCoverage(product, "member", { ...values, ...(worked !== undefined ? { "hours-worked-per-week": worked } : {}) }, library.products).eligibility).toBe(expected);
    expect(resolveEffectiveEligibility(library.site, productKey, "member", { ageYears: 35, workHoursPerWeek: worked, activeMilitary: false, firmMemberCount: 3 })).toMatchObject(expected === "needs-information" ? { status: "needs-information" } : { status: "resolved", eligible: expected === "eligible" });
  }
});

it("collects AVMA Term Life hours contextually without repeating the standard DI work question", () => {
  const library = resolvePrototypeLibrary(db, "avma", "test:collection"); installPrototypeLibrary(library);
  const life = library.products.find(product => product.id === "li-term")!;
  const di = library.products.find(product => product.id === "di-ltd")!;
  expect(coverageFactFieldIds([life])).toContain("hours-worked-per-week");
  expect(coverageFactFieldIds([life, di]).filter(id => id === "hours-worked-per-week")).toHaveLength(0);
});

it("reads WAEPA GI's existing scoped military answer rather than requiring an uncollected global field", () => {
  const library = resolvePrototypeLibrary(db, "waepa-gi", "test:gi-military"); installPrototypeLibrary(library);
  const product = library.products[0];
  const base = { "birth-date": dayjs().subtract(30, "year").format("YYYY-MM-DD") };
  const field = `prototype-fact:${product.id}:member:activeMilitary`;
  expect(resolveApplicationCoverage(product, "member", base).eligibility).toBe("needs-information");
  expect(resolveApplicationCoverage(product, "member", { ...base, [field]: "yes" }).eligibility).toBe("ineligible");
  expect(resolveApplicationCoverage(product, "member", { ...base, [field]: "no" }).eligibility).toBe("eligible");
});

it("is idempotent and rejects source or target drift before modifying any row", () => {
  const repeated = structuredClone(db); applyWorkEligibilityAdoption(repeated, mcrSource.cells); expect(repeated).toEqual(db);
  const changed = structuredClone(db), before = structuredClone(changed);
  expect(() => applyWorkEligibilityAdoption(changed, mcrSource.cells.map(cell => cell.sheet === "Main" && cell.cell === "R380" ? { ...cell, value: "Changed requirement" } : cell))).toThrow("Work eligibility source changed");
  expect(changed).toEqual(before);
  changed.eligibilityConstraints = changed.eligibilityConstraints.filter(row => row.siteKey !== "waepa" || row.productKey !== "di-short-term");
  const missing = structuredClone(changed);
  expect(() => applyWorkEligibilityAdoption(changed, mcrSource.cells)).toThrow("Missing unique work eligibility target"); expect(changed).toEqual(missing);
});
