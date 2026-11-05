import { expect, it } from "vitest";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { consolidateFieldDefinitionOwnership } from "./fieldDefinitionOwnership";
import { consolidateRequiredFieldOwnership } from "./requiredFieldOwnership";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { resolveSharedFieldDefinition } from "../domain/fieldDefinitionOwnership";

const db = createReviewedMigrationDatabase();
it("reconciles all 161 copied required values without changing global definitions or scoped placements", () => {
  const original = createMigrationDatabase();
  expect(db.semanticRequirements.find(row => row.predicate === "shared-field-required")?.value).toMatchObject({ previousValidationRules: expect.arrayContaining([expect.objectContaining({ definition: { required: true } })]) });
  expect(original.validationRules.filter(row => Object.hasOwn(row.definition, "required"))).toHaveLength(161);
  expect(db.validationRules.every(row => !Object.hasOwn(row.definition, "required"))).toBe(true);
  for (const field of db.fields) expect(resolveSharedFieldDefinition(field, db.validationRules, "fields-required").definition.required)
    .toEqual(resolveSharedFieldDefinition(field, original.validationRules, "legacy").definition.required);
  const repeated = structuredClone(db);
  consolidateRequiredFieldOwnership(repeated);
  expect(repeated).toEqual(db);
});

it("uses the saved global requirement on pages and quote surfaces, then applies Site differences", () => {
  const changed = structuredClone(db);
  changed.fields.find(row => row.key === "birth-date")!.definition.required = false;
  const before = JSON.stringify(changed);
  const library = resolvePrototypeLibrary(changed, "asce", "test:required");
  expect(library.fieldSurfaces.quoteInputs.mapping.fields.find(row => row.id === "birth-date")!.required).toBe(false);
  expect(library.site.configuration.pages.find(page => page.key === "eligibility")!.fields.find(row => row.key === "birth-date")!.definition.required).toBe(false);
  expect(JSON.stringify(changed)).toBe(before);
  const placement = changed.siteFieldConfigurations.find(row => row.siteKey === "asce")!;
  changed.siteFieldConfigurations.push({ ...placement, id: "test.scoped.required", key: "test.scoped.required", pageKey: "eligibility", fieldKey: "birth-date", values: { required: true }, include: true, hidden: null });
  expect(resolvePrototypeLibrary(changed, "asce", "test:scoped").site.configuration.pages.find(page => page.key === "eligibility")!.fields.find(row => row.key === "birth-date")!.definition.required).toBe(true);
  expect(resolvePrototypeLibrary(changed, "ama", "test:isolation").site.configuration.pages.find(page => page.key === "eligibility")!.fields.find(row => row.key === "birth-date")!.definition.required).toBe(false);
});

it("retains version 2 required precedence and rejects new competing required owners", () => {
  const historical = structuredClone(db);
  historical.configurationValues.find(row => row.configurationKey === "ownership.shared-field-definitions")!.value = { version: 2, source: "fields" };
  historical.validationRules.find(row => row.fieldKey === "birth-date")!.definition.required = true;
  historical.fields.find(row => row.key === "birth-date")!.definition.required = false;
  expect(resolvePrototypeLibrary(historical, "asce", "test:history").fieldSurfaces.quoteInputs.mapping.fields.find(row => row.id === "birth-date")!.required).toBe(true);
  const competing = structuredClone(db);
  competing.validationRules.find(row => row.fieldKey === "birth-date")!.definition.required = true;
  expect(() => resolvePrototypeLibrary(competing, "asce", "test:competing")).toThrow("belongs to fields");
});

it.each(["disagreement", "duplicate"])("rejects %s before modifying the candidate", problem => {
  const original = createMigrationDatabase();
  consolidateFieldDefinitionOwnership(original);
  const rule = original.validationRules.find(row => row.fieldKey === "birth-date")!;
  if (problem === "disagreement") rule.definition.required = !rule.definition.required;
  else original.validationRules.push({ ...rule, id: "test.duplicate", key: "test.duplicate" });
  const before = JSON.stringify(original);
  expect(() => consolidateRequiredFieldOwnership(original)).toThrow();
  expect(JSON.stringify(original)).toBe(before);
});
