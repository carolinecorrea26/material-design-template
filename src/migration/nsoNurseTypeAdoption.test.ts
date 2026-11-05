import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyNsoNurseTypeAdoption } from "./nsoNurseTypeAdoption";
import { applyAvmaCollegeDecision } from "./avmaCollegeDecision";
import { resolvePrototypeLibrary, installPrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { getFieldValidationRules } from "../utils/fieldValidation";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it("collects only NSO's three source choices after the Yes gate and rejects unsupported saved answers", () => {
  window.history.replaceState(null, "", "/?site=nso");
  const library = resolvePrototypeLibrary(db, "nso", "nurse-type"); installPrototypeLibrary(library);
  const field = getClientPageFields("membership", { membership: "yes" }).find(field => field.id === "nurse-type")!;
  expect(field).toMatchObject({ label: "Nurse Type", inputType: "dropdown", required: true });
  expect(field.options?.map(option => option.label)).toEqual(["RN", "LPN", "Other Nurse Professional Type"]);
  for (const answer of field.options!) expect(getFieldValidationRules(field).validate!(answer.value)).toBe(true);
  expect(getFieldValidationRules(field).validate!("unknown")).toContain("Select an available");
  for (const membership of ["", "no"]) expect(getClientPageFields("membership", { membership }).some(field => field.id === "nurse-type")).toBe(false);
  for (const site of ["asce", "ama", "avma", "waepa"]) {
    window.history.replaceState(null, "", `/?site=${site}`);
    installPrototypeLibrary(resolvePrototypeLibrary(db, site, "isolation"));
    expect(getClientPageFields("membership", { membership: "yes" }).some(field => field.id === "nurse-type")).toBe(false);
  }
  const copy = structuredClone(db); applyNsoNurseTypeAdoption(copy); applyAvmaCollegeDecision(copy);
  expect(copy).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("preserves AVMA's required text collection and records the dropdown list as nonblocking", () => {
  const field = db.fields.find(row => row.key === "avma-vet-college")!;
  expect(field.definition).toMatchObject({ inputType: "text", required: true });
  expect(db.semanticRequirements.find(row => row.key === "business-decision.rules-review.avma-college-list")?.value).toMatchObject({ selected: { dropdownList: "deferred-by-user", completionBlocking: false }, revisitTrigger: "User supplies the approved college list" });
});
