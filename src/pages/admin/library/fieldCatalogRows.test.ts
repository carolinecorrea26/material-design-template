import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { fieldSurfaceRows } from "./fieldSurfaceRows";
import { fieldCatalogRows, fieldCatalogMarkdown, fieldUsageMarkdown, fieldKeyboard, fieldDefaultOption } from "./fieldCatalogRows";

const catalog: LibraryCatalog = { ...JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')), revision: "test" };

describe("global field catalog and separate effective usage", () => {
  it("retains authored helper text and keyboard metadata and documents only explicit defaults", () => {
    const usages = fieldSurfaceRows(catalog, "asce");
    const fields = fieldCatalogRows(catalog, "asce", usages);
    const email = fields.find(row => row.key === "email")!.field;
    expect(email.helperText).toBe("Provide a valid email address where you can receive important updates about your application.");
    expect(fieldKeyboard(email)).toBe("Email");
    expect(fieldKeyboard(fields.find(row => row.key === "first-name")!.field)).toBe("Alphanumeric");
    expect(fieldKeyboard(fields.find(row => row.key === "phone")!.field)).toBe("Number");
    expect(fieldKeyboard(fields.find(row => row.key === "phone-type")!.field)).toBe("—");
    expect(fieldDefaultOption("phone-type", usages)).toBe("Mobile");
    expect(fieldDefaultOption("membership", usages)).toBe("—");
    expect(fields.find(row => row.key === "membership")!.field.options?.[0]).toMatchObject({ label: "Yes", value: "yes" });
  });
  it("lists each saved definition once and keeps generated instance IDs out of the catalog", () => {
    const usages = fieldSurfaceRows(catalog, "asce");
    const fields = fieldCatalogRows(catalog, "asce", usages);
    expect(new Set(fields.map(field => field.key)).size).toBe(fields.length);
    for (const field of fields) {
      expect(catalog.data.fields.some(saved => saved.id === field.id && saved.key === field.key)).toBe(true);
      expect(field.field).not.toHaveProperty("required");
      expect(field.field).not.toHaveProperty("visibilityConditionId");
    }
    expect(usages.filter(usage => usage.field.id.startsWith("payment-method:")).length).toBeGreaterThan(1);
    expect(fields.filter(field => field.key === "payment-method")).toHaveLength(1);
    expect(usages.find(usage => usage.field.id === "quote-amount:di-ltd")?.definitionKey).toBe("quote-monthly-amount");
    expect(usages.find(usage => usage.field.id === "needs-annual-income" && usage.surface === "Needs calculator drawer")?.pages).toContain("health-di-supp");
    expect(fields.some(field => /^(?:quote-(?:selection|amount)|payment-(?:method|frequency)|coverage-(?:applicant|amount|waiting|benefit)):/.test(field.key))).toBe(false);
    expect(fields.some(field => field.key.startsWith("health-si"))).toBe(true);
    expect(fields.find(field => field.key === "membership")?.field.label).toBe(usages.find(usage => usage.definitionKey === "membership")!.field.label);

  });

  it("does not borrow one page's override for another occurrence of a shared definition", () => {
    const usages = fieldSurfaceRows(catalog, "asce");
    const genderUsages = usages.filter(usage => usage.definitionKey === "gender");
    expect(genderUsages.length).toBeGreaterThan(1);
    genderUsages[0].field = { ...genderUsages[0].field, label: "Placement-specific label" };
    const field = fieldCatalogRows(catalog, "asce", usages).find(field => field.key === "gender")!;
    expect(field.field.label).toBe(catalog.data.fields.find(field => field.key === "gender")!.definition.label);
    expect(genderUsages[0].field.label).toBe("Placement-specific label");
  });

  it("exports the same global definitions and effective usages shown by the Library", () => {
    const usages = fieldSurfaceRows(catalog, "asce");
    const fields = fieldCatalogRows(catalog, "asce", usages);
    const definitions = fieldCatalogMarkdown(fields), placements = fieldUsageMarkdown(usages);
    expect(definitions).toContain("email");
    expect(placements).toContain("Membership");
    for (const field of fields) expect(definitions).toContain(`| \`${field.key}\` |`);
    for (const usage of usages.filter(usage => usage.definitionKey)) expect(placements).toContain(`\`${usage.definitionKey}\``);
  });
});
