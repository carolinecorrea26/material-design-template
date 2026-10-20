import { expect, it } from "vitest";
import { createMigrationDatabase, createReviewedMigrationDatabase } from "./fixtures";
import { consolidateFieldDefinitionOwnership } from "./fieldDefinitionOwnership";
import { resolveSharedFieldDefinition } from "../domain/fieldDefinitionOwnership";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { validateMigrationDatabase } from "./integrity";

const db = createReviewedMigrationDatabase();
const preview = (data = db) => resolvePrototypeLibrary(data, "asce", "test:field-ownership");
it("gives 186 controls and 37 formats one shared owner while preserving constraints and effective values", () => {
  const evidence = db.semanticRequirements.find(row => row.predicate === "shared-field-control-format")!.value;
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence) || !Array.isArray(evidence.previousValidationRules)) throw new Error("Missing original validation rows");
  expect(evidence.previousValidationRules).toHaveLength(186);
  expect(db.validationRules.every(row => !Object.hasOwn(row.definition, "inputType") && !Object.hasOwn(row.definition, "format"))).toBe(true);
  expect(db.validationRules.filter(row => Object.hasOwn(row.definition, "required"))).toHaveLength(0);
  expect(JSON.stringify(evidence.previousValidationRules).match(/"format":/g)).toHaveLength(37);
  const original = createMigrationDatabase();
  for (const row of db.fields) {
    const legacy = original.validationRules.filter(rule => rule.fieldKey === row.key);
    expect(resolveSharedFieldDefinition(row, db.validationRules, "fields-required").definition).toEqual(resolveSharedFieldDefinition(row, legacy, "legacy").definition);
  }
  const repeated = structuredClone(db);
  consolidateFieldDefinitionOwnership(repeated);
  expect(repeated).toEqual(db);
  expect(validateMigrationDatabase(db)).toEqual([]);
}, 120000);

it("makes the saved control type govern the quote, page and collection render definitions", () => {
  const changed = structuredClone(db);
  changed.fields.find(row => row.key === "birth-date")!.definition.inputType = "text";
  changed.fields.find(row => row.key === "child-birth-date")!.definition.inputType = "text";
  const library = preview(changed);
  expect(library.fieldSurfaces.quoteInputs.mapping.fields.find(field => field.id === "birth-date")!.inputType).toBe("text");
  expect(library.site.configuration.pages.find(page => page.key === "eligibility")!.fields.find(field => field.key === "birth-date")!.definition.inputType).toBe("text");
  expect(library.fieldCollections.children.mapping.fields.find(field => field.id === "child-birth-date")!.inputType).toBe("text");
});

it.each(["inputType", "format"] as const)("rejects a second authored %s owner and conflicting source copies", property => {
  const changed = structuredClone(db);
  changed.validationRules.find(row => row.fieldKey === "birth-date")!.definition = property === "inputType" ? { inputType: "date" } : { format: "phone" };
  expect(() => preview(changed)).toThrow("belongs to fields");
  expect(validateMigrationDatabase(changed)).toContain("Invalid shared field definition ownership ownership.shared-field-definitions");
  const original = createMigrationDatabase();
  original.validationRules.find(row => row.fieldKey === "birth-date")!.definition = property === "inputType" ? { inputType: "text" } : { format: "phone" };
  const before = JSON.stringify(original);
  expect(() => consolidateFieldDefinitionOwnership(original)).toThrow("Unreconciled field property");
  expect(JSON.stringify(original)).toBe(before);
});

it("keeps historical control precedence and detects duplicate validation properties on every collection point", () => {
  const legacy = structuredClone(db);
  const original = createMigrationDatabase();
  legacy.configurationValues = legacy.configurationValues.filter(row => row.configurationKey !== "ownership.shared-field-definitions");
  legacy.validationRules = original.validationRules;
  legacy.fields.find(row => row.key === "birth-date")!.definition.inputType = "text";
  const before = JSON.stringify(legacy);
  expect(preview(legacy).fieldSurfaces.quoteInputs.mapping.fields.find(field => field.id === "birth-date")!.inputType).toBe("date");
  expect(JSON.stringify(legacy)).toBe(before);
  const lastRule = legacy.validationRules.find(row => row.fieldKey === "birth-date")!;
  legacy.validationRules.push({ ...lastRule, id: "legacy.last", key: "legacy.last", position: lastRule.position + 1, definition: { inputType: "text" } });
  expect(preview(legacy).fieldSurfaces.quoteInputs.mapping.fields.find(field => field.id === "birth-date")!.inputType).toBe("text");
  legacy.fields.find(row => row.key === "birth-date")!.definition.inputType = "date";
  const ambiguousBefore = JSON.stringify(legacy);
  expect(() => consolidateFieldDefinitionOwnership(legacy)).toThrow("Ambiguous field validation");
  expect(JSON.stringify(legacy)).toBe(ambiguousBefore);
  const duplicated = structuredClone(db);
  duplicated.configurationValues.find(row => row.configurationKey === "ownership.shared-field-definitions")!.value = { version: 2, source: "fields" };
  const row = duplicated.validationRules.find(row => row.fieldKey === "birth-date")!;
  row.definition = { required: true };
  duplicated.validationRules.push({ ...row, id: "duplicate.required", key: "duplicate.required" });
  expect(() => preview(duplicated)).toThrow("Ambiguous field validation");
});

it("rejects competing presentation properties even on fields without a current placement", () => {
  const changed = structuredClone(db);
  const source = changed.fields.find(row => row.key === "birth-date")!;
  changed.fields.push({ ...source, id: "unplaced-field", key: "unplaced-field" });
  const rule = changed.validationRules.find(row => row.fieldKey === source.key)!;
  changed.validationRules.push({ ...rule, id: "unplaced-rule", key: "unplaced-rule", fieldKey: "unplaced-field", definition: { inputType: "date" } });
  expect(() => preview(changed)).toThrow("Field presentation property belongs to fields: unplaced-field/inputType");
});
