import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAbeBenefitQuestionCleanup } from "./abeBenefitQuestionCleanup";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveApplicationCoverage } from "../domain/coverageRuntime";
import { coverageFactFieldIds } from "../config/fields/coverageFactFields";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import type { DatabaseSchema } from "../persistence/types";

afterEach(() => installPrototypeLibrary(null));
const removed = /prototype-fact:.*:(existingMonthlyBenefit|retirement|eligibleExpenseFraction)$/;
it.each(["seed", "saved"])("removes generated ABE questions and keeps benefit selection working in the %s catalog", source => {
  const db: DatabaseSchema = source === "seed" ? createReviewedMigrationDatabase() : JSON.parse(readFileSync("public/catalog/portal.json", "utf8")).data;
  const library = resolvePrototypeLibrary(db, "abe", "question-cleanup");
  installPrototypeLibrary(library);
  window.history.replaceState(null, "", "/coverage?site=abe");
  const values = { membership: "yes", "birth-date": "1990-01-01", "state-province": "NY", "hours-worked-per-week": 40, "average-monthly-income": 10000, "monthly-business-expenses": 10000, "business-expense-responsibility": 75, "firm-member-count": 3, coverageSelections: ["di-ltd", "oo-professional"], productApplicants: { "di-ltd": ["member"], "oo-professional": ["member"] } };
  expect(db.siteFieldConfigurations.filter(row => row.siteKey === "abe" && removed.test(row.fieldKey))).toEqual([]);
  expect(getClientPageFields("coverage", values).filter(field => removed.test(field.id))).toEqual([]);
  expect(coverageFactFieldIds(library.products, values).filter(key => removed.test(key))).toEqual([]);
  const di = library.products.find(product => product.id === "di-ltd")!;
  expect(resolveApplicationCoverage(di, "member", values, library.products).selectable).toBe(true);
  const overhead = library.products.find(product => product.id === "oo-professional")!;
  expect(resolveApplicationCoverage(overhead, "member", values, library.products).amounts.at(-1)).toBe(7500);
  expect(resolveApplicationCoverage(overhead, "member", { ...values, "business-expense-responsibility": 50, "prototype-fact:oo-professional:member:eligibleExpenseFraction": 1 }, library.products).amounts.at(-1)).toBe(5000);
  expect(resolveApplicationCoverage(overhead, "member", { ...values, "business-expense-responsibility": "" }, library.products).selectable).toBe(false);
  const copy = structuredClone(db); applyAbeBenefitQuestionCleanup(copy); expect(copy).toEqual(db);
}, 120000);
