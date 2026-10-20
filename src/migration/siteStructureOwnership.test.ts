import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { consolidateSiteStructureOwnership } from "./siteStructureOwnership";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import type { DatabaseSchema } from "../persistence/types";

const db = createReviewedMigrationDatabase();
function historical() {
  const old = structuredClone(db);
  const keys = new Set(old.configurationDefinitions.filter(row => row.definition.target?.kind === "site-structure-ownership").map(row => row.key));
  old.configurationValues = old.configurationValues.filter(row => !keys.has(row.configurationKey));
  for (const evidence of old.semanticRequirements.filter(row => row.predicate === "stored-site-structure")) {
    const value = evidence.value;
    if (value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.previousConfigurations)) {
      for (const copy of value.previousConfigurations as unknown as DatabaseSchema["configurationValues"]) if (!old.configurationValues.some(row => row.key === copy.key)) old.configurationValues.push(copy);
    }
  }
  return old;
}

it("retires ten field configuration copies and two template mode copies with identical resolved fields", () => {
  const old = historical();
  expect(old.configurationValues.length - db.configurationValues.length + 9).toBe(12);
  for (const site of ["abe", "ama", "asce", "avma", "csea", "nso", "isitrust", "waepa", "waepa-gi"]) {
    const before = resolvePrototypeLibrary(old, site, "test:before");
    const after = resolvePrototypeLibrary(db, site, "test:after");
    expect(after.client.features?.defaultTemplate).toEqual(before.client.features?.defaultTemplate);
    expect(after.site.configuration.pages).toEqual(before.site.configuration.pages);
    expect(after.site.configuration.siteStructureOwnership).toBe("stored-structure");
  }
  const repeated = structuredClone(db);
  consolidateSiteStructureOwnership(repeated);
  expect(repeated).toEqual(db);
});

it("gives scoped labels and options their stored owner and preserves Site isolation", () => {
  const changed = structuredClone(db);
  changed.siteFieldConfigurations.find(row => row.siteKey === "abe" && row.fieldKey === "spouse-membership")!.values.label = "Saved spouse label";
  expect(resolvePrototypeLibrary(changed, "abe", "test").client.fields.eligibility?.overrides?.["spouse-membership"]?.label).toBe("Saved spouse label");
  expect(resolvePrototypeLibrary(changed, "ama", "test").client.fields.eligibility?.overrides?.["spouse-membership"]?.label).not.toBe("Saved spouse label");
  const ama = changed.siteFieldConfigurations.find(row => row.siteKey === "ama" && row.fieldKey === "membership")!;
  ama.values.options = [{ value: "saved", label: "Saved choice" }];
  expect(resolvePrototypeLibrary(changed, "ama", "test").client.fields.membership?.overrides?.membership?.options).toEqual(ama.values.options);
});

it.each(["features.defaultTemplate", "fields.eligibility.overrides.spouse-membership.label"])("rejects a revived %s copy and prevents partial reconciliation", configurationKey => {
  const changed = historical();
  const row = changed.configurationValues.find(row => row.configurationKey === configurationKey)!;
  row.value = "conflicting";
  const before = JSON.stringify(changed);
  expect(() => consolidateSiteStructureOwnership(changed)).toThrow("Unreconciled");
  expect(JSON.stringify(changed)).toBe(before);
  const competing = structuredClone(db);
  competing.configurationValues.push(row);
  expect(() => resolvePrototypeLibrary(competing, row.siteKey ?? row.clientKey!, "test")).toThrow("compete with stored placements");
});
