import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyWaepaReferralAdoption } from "./waepaReferralAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { fieldValidationChecks } from "../utils/fieldValidation";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));
it("requires multiselect referral choices and new-member visibility independently for both WAEPA Sites", () => {
  for (const site of ["waepa", "waepa-gi"]) {
    window.history.replaceState(null, "", `/?site=${site}`); installPrototypeLibrary(resolvePrototypeLibrary(db, site, "referral"));
    for (const status of ["new", "current", ""]) {
      const fields = getClientPageFields("membership", site === "waepa" ? { membership: status } : { membership: "yes", "membership-status": status });
      const referral = fields.find(field => field.id === "membership-referral-source");
      expect(!!referral, `${site}/${status}`).toBe(status === "new");
      if (referral) {
        expect(referral).toMatchObject({ inputType: "multi-select", required: true, options: [{ value: "tv", label: "TV" }, { value: "radio", label: "Radio" }, { value: "newspaper", label: "Newspaper" }] });
        for (const value of [["tv"], ["tv", "radio", "newspaper"]]) expect(fieldValidationChecks(referral).every(check => check.validate(value))).toBe(true);
        for (const value of [undefined, null, [], "tv", ["unknown"], ["tv", "tv"]]) expect(fieldValidationChecks(referral).every(check => check.validate(value))).toBe(false);
      }
      expect(fields.some(field => field.id === "membership-status")).toBe(site === "waepa-gi");
    }
    expect(getClientPageFields("membership", { membership: "no", "membership-status": "new" }).some(field => field.id === "membership-referral-source" || field.id === "membership-status")).toBe(false);
  }
});
it("preserves captured revisions and other Sites through editable global definitions and explicit assignments", () => {
  const captured = resolvePrototypeLibrary(db, "waepa", "before-edit"), edited = structuredClone(db);
  edited.fields.find(row => row.key === "membership-referral-source")!.definition.options!.push({ value: "web", label: "Web" });
  const after = resolvePrototypeLibrary(edited, "waepa", "after-edit");
  for (const [library, expected] of [[captured, false], [after, true]] as const) {
    installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=waepa");
    expect(getClientPageFields("membership", { membership: "new" }).find(field => field.id === "membership-referral-source")?.options?.some(option => option.value === "web")).toBe(expected);
  }
  for (const site of ["abe", "nso", "isitrust"]) {
    installPrototypeLibrary(resolvePrototypeLibrary(db, site, "isolation")); window.history.replaceState(null, "", `/?site=${site}`);
    expect(getClientPageFields("membership", { membership: "new", "membership-status": "new" }).some(field => field.id === "membership-referral-source" || field.id === "membership-status")).toBe(false);
  }
  const repeated = structuredClone(db); applyWaepaReferralAdoption(repeated); expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
});
