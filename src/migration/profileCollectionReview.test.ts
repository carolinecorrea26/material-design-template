import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { reviewSsnCollectionRequirements } from "./requirementCrosswalkFieldReview";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import { fieldValidationChecks } from "../utils/fieldValidation";
import { getPageCollectionDefaults } from "../app/RoutePage";
import type { DatabaseSchema } from "../persistence/types";
import type { CrosswalkRow } from "./requirementCrosswalk";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => installPrototypeLibrary(null));

it.each(["abe", "waepa"])("collects and validates required member SSN on %s Profile across product selections", siteKey => {
  window.history.replaceState(null, "", `/?site=${siteKey}`);
  const library = resolvePrototypeLibrary(db, siteKey, "SSN-review"); installPrototypeLibrary(library);
  for (const product of library.products) {
    const fields = getClientPageFields("profile", { coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] } });
    const field = fields.find(field => field.id === "social-security-number")!;
    expect(field).toMatchObject({ required: true, format: "ssn" });
    const accepts = (value: unknown) => fieldValidationChecks(field).every(check => check.validate(value));
    expect(accepts(undefined)).toBe(false); expect(accepts("")).toBe(false);
    expect(accepts("123-45-678")).toBe(false); expect(accepts("123-45-6789")).toBe(true);
  }
});

it("reopens reviewed SSN collection when a scoped native edit makes it optional", () => {
  const row = { id: "atomic.waepa.li-group-term.ssn-required", kind: "source-requirement", scope: { siteKeys: ["waepa"] } } as CrosswalkRow;
  reviewSsnCollectionRequirements(db, [row]); expect(row.verificationStatus).toBe("recorded-evidence");
  const edited = structuredClone(db), field = edited.siteFieldConfigurations.find(row => row.siteKey === "waepa" && row.fieldKey === "social-security-number" && row.pageKey === "profile");
  if (field) field.values.required = false;
  else edited.fields.find(row => row.key === "social-security-number")!.definition.required = false;
  reviewSsnCollectionRequirements(edited, [row]); expect(row.verificationStatus).toBe("not-verified");
});

it("keeps required ABE email on shared Membership rather than duplicating legacy placements", () => {
  window.history.replaceState(null, "", "/?site=abe");
  installPrototypeLibrary(resolvePrototypeLibrary(db, "abe", "email-placement"));
  const email = getClientPageFields("membership", {}).find(field => field.id === "email")!;
  expect(email).toMatchObject({ required: true, format: "email" });
  expect(fieldValidationChecks(email).every(check => check.validate("applicant@example.invalid"))).toBe(true);
  expect(fieldValidationChecks(email).every(check => check.validate(""))).toBe(false);
  for (const page of ["eligibility", "contact"] as const) expect(getClientPageFields(page, {}).some(field => field.id === "email")).toBe(false);
});

it("restores both captured insurance collections with their authored names and keeps other pages isolated", () => {
  const captured = resolvePrototypeLibrary(db, "asce", "before-collection-edit");
  const edited = structuredClone(db);
  const key = edited.configurationDefinitions.find(row => row.definition.path?.join(".") === "fieldCollections")!.key;
  const config = edited.configurationValues.find(row => row.configurationKey === key)!.value as unknown as { selfDisabilityCompanies: { storageName: string } };
  config.selfDisabilityCompanies.storageName = "memberInsuranceRows";
  const current = resolvePrototypeLibrary(edited, "asce", "after-collection-edit");
  const member = [{ company: "Member carrier" }], spouse = [{ company: "Spouse carrier" }];
  installPrototypeLibrary(captured);
  expect(getPageCollectionDefaults("profile", { selfDisabilityCompanies: member, spouseDisabilityCompanies: spouse })).toEqual({ selfDisabilityCompanies: member, spouseDisabilityCompanies: spouse });
  installPrototypeLibrary(current);
  expect(getPageCollectionDefaults("profile", { selfDisabilityCompanies: member, memberInsuranceRows: member, spouseDisabilityCompanies: spouse })).toEqual({ memberInsuranceRows: member, spouseDisabilityCompanies: spouse });
  expect(getPageCollectionDefaults("profile", { memberInsuranceRows: "invalid", spouseDisabilityCompanies: null })).toEqual({});
  expect(getPageCollectionDefaults("contact", { memberInsuranceRows: member, spouseDisabilityCompanies: spouse })).toEqual({});
});
