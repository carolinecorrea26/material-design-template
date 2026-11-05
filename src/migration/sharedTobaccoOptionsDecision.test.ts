import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { recordSharedTobaccoOptionsDecision } from "./sharedTobaccoOptionsDecision";
import { resolvePrototypeLibrary, installPrototypeLibrary } from "../domain/prototypeLibrary";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { fieldValidationChecks } from "../utils/fieldValidation";
import { fieldCatalog } from "../config/fields";
import { isSectionVisible } from "../app/RoutePage";
import { getPageSections } from "../config/pageSections";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
const labels = ["Cigarettes", "Nicotine patch", "Nicotine inhaler", "Nasal spray", "Nicotine gum", "Nicotine lozenge", "E-Cigarettes", "Cigar", "Pipe", "Chewing tobacco", "Snuff", "Betel nut"];
it("uses twelve shared source choices for both adults across every current Site without ABE overrides", () => {
  for (const { key } of activeSiteMigrationScope.sites) {
    const library = resolvePrototypeLibrary(db, key, "shared-tobacco");
    for (const fieldKey of ["tobacco-products", "spouse-tobacco-products"] as const) {
      const field = library.site.configuration.pages.find(page => page.key === "coverage")!.fields.find(field => field.key === fieldKey)!;
      expect(field.definition.options?.map(option => option.label), `${key}/${fieldKey}`).toEqual(labels);
      expect(fieldCatalog[fieldKey].options?.map(option => option.label)).toEqual(labels);
      const checks = fieldValidationChecks(field.definition);
      expect(checks.every(check => check.validate(["Nicotine Inhaler", "E-Cigarettes", "Betel Nut"]))).toBe(true);
      expect(checks.every(check => check.validate(["Other"]))).toBe(false);
      expect(checks.every(check => check.validate(["Cigars", "Nicotine Gum", "Chewing Tobacco"]))).toBe(true);
    }
  }
  expect(db.siteFieldConfigurations.some(row => row.fieldKey.includes("tobacco-products") && Object.hasOwn(row.values, "options"))).toBe(false);
});
it("retains shared Yes-only followups, saved answers and independently editable captured field definitions", () => {
  const library = resolvePrototypeLibrary(db, "abe", "before-edit"); installPrototypeLibrary(library); window.history.replaceState(null, "", "/coverage?site=abe");
  for (const answer of ["yes", "no"]) {
    const values = { smoker: answer, "spouse-smoker": answer, dependents: ["spouse"], coverageSelections: ["li-term"], selectedCategoryChips: ["LI"], productApplicants: { "li-term": ["member", "spouse"] }, coverageAmounts: { "li-term:member": 100000, "li-term:spouse": 100000 } };
    const fields = getClientPageFields("coverage", values);
    for (const key of ["tobacco-products", "spouse-tobacco-products"]) {
      expect(fields.some(field => field.id === key)).toBe(true);
      const section = getPageSections("coverage").find(section => section.fieldIds.includes(key as "tobacco-products"))!;
      expect(isSectionVisible(section, values), key).toBe(answer === "yes");
    }
  }
  const saved = { "tobacco-products": ["Other"], "spouse-tobacco-products": ["Cigars"] }, before = structuredClone(saved);
  const copy = structuredClone(db); recordSharedTobaccoOptionsDecision(copy); expect(copy).toEqual(db); expect(saved).toEqual(before);
  copy.fields.find(row => row.key === "tobacco-products")!.definition.options = [{ label: "Edited", value: "edited" }];
  const edited = resolvePrototypeLibrary(copy, "abe", "after-edit");
  expect(edited.site.configuration.pages.find(page => page.key === "coverage")!.fields.find(field => field.key === "tobacco-products")!.definition.options).toEqual([{ label: "Edited", value: "edited" }]);
  expect(library.site.configuration.pages.find(page => page.key === "coverage")!.fields.find(field => field.key === "tobacco-products")!.definition.options).toHaveLength(12);
});
