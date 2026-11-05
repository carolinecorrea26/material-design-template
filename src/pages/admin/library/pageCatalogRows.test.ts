import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { orderFieldsByPages, pageCatalogRows } from "./pageCatalogRows";
import { fieldCatalogRows } from "./fieldCatalogRows";
import { fieldSurfaceRows } from "./fieldSurfaceRows";

const catalog: LibraryCatalog = { ...JSON.parse(readFileSync("public/catalog/portal.json", "utf8")), revision: "test" };

describe("page table requirements and field references", () => {
  it("includes each page's available modal and drawer fields with explicit container labels", () => {
    const pages = pageCatalogRows(catalog, "abe");
    const groups = (page: string) => pages.find(row => row.key === page)!.fieldGroups;
    const keys = (page: string, label: string) => groups(page).find(group => group.label === label)!.fields.map(field => field.key);
    expect(keys("home", "On page")).toEqual(["zip-postal-code", "state-province", "birth-date"]);
    expect(keys("home", "Quote calculator drawer")).toEqual(expect.arrayContaining(["gender", "quote-monthly-amount"]));
    expect(keys("home", "Quote calculator drawer")).not.toContain("birth-date");
    expect(keys("home", "Needs calculator drawer")).toContain("needs-annual-income");
    expect(keys("membership", "Quote calculator drawer")).toContain("gender");
    expect(keys("membership", "Quote calculator drawer")).toContain("birth-date");
    expect(groups("profile").some(group => group.label === "Quote calculator drawer")).toBe(false);
    expect(keys("profile", "Needs calculator drawer")).toContain("needs-years-to-replace");
    expect(keys("eligibility", "Member verification modal")).toEqual(expect.arrayContaining(["verification-method", "sq-1", "sq-2", "sq-3"]));
    expect(keys("eligibility", "Add/edit child modal")).toContain("child-first-name");
    expect(keys("eligibility", "On page")).not.toEqual(expect.arrayContaining(["verification-method"]));
    expect(keys("eligibility", "On page")).not.toEqual(expect.arrayContaining(["child-first-name"]));
    expect(keys("beneficiary", "Add/edit beneficiary modal")).toEqual(expect.arrayContaining(["beneficiary-firstName", "beneficiary-trustName", "beneficiaryType"]));
    expect(keys("beneficiary", "On page")).toContain("beneficiary-information-opt-in");
    expect(keys("profile", "Member disability insurance details modal")).toContain("di-company-name");
    expect(keys("profile", "Spouse disability insurance details modal")).toContain("di-company-name");
    for (const page of pages) for (const group of page.fieldGroups) {
      expect(new Set(group.fields.map(field => field.key)).size).toBe(group.fields.length);
      for (const field of group.fields.filter(field => field.definitionKey)) expect(catalog.data.fields.some(saved => saved.key === field.definitionKey)).toBe(true);
    }
  });

  it("lists Profile inputs in section order with follow-ups and nested controls beside their questions", () => {
    const pages = pageCatalogRows(catalog, "abe");
    const profile = pages.find(page => page.key === "profile")!.fields.map(field => field.key);
    expect(profile.slice(0, 6)).toEqual(["height-feet", "height-inches", "weight-lbs", "weight-12-months-ago-lbs", "social-security-number", "marital-status"]);
    expect(profile.slice(profile.indexOf("has-drivers-license"), profile.indexOf("has-drivers-license") + 4))
      .toEqual(["has-drivers-license", "drivers-license-number", "drivers-license-state", "intend-live-outside-us"]);
    expect(profile.indexOf("physician-first-name")).toBeGreaterThan(profile.indexOf("travel-outside-us-country"));
    expect(profile.indexOf("has-other-life-insurance")).toBeGreaterThan(profile.indexOf("physician-first-name"));
    expect(profile.indexOf("spouse-height-feet")).toBeGreaterThan(profile.indexOf("has-other-life-insurance"));
    expect(profile.slice(profile.indexOf("has-disability-insurance") + 1, profile.indexOf("has-disability-insurance") + 5))
      .toEqual(["di-company-name", "di-company-monthly-benefit", "di-company-benefit-period", "di-company-waiting-period"]);
    const membership = pages.find(page => page.key === "membership")!.fields.map(field => field.key);
    expect(membership.slice(membership.indexOf("phone"), membership.indexOf("phone") + 2)).toEqual(["phone", "phone-type"]);
  });

  it("orders fields by their first appearance in Pages, retaining every definition once", () => {
    const usages = fieldSurfaceRows(catalog, "abe");
    const fields = fieldCatalogRows(catalog, "abe", usages);
    const pages = pageCatalogRows(catalog, "abe", usages);
    const ordered = orderFieldsByPages(fields, pages).map(field => field.key);
    const pageOrder = [...new Set(pages.flatMap(page => page.fields.map(field => field.key)))];
    expect(ordered.slice(0, pageOrder.length)).toEqual(pageOrder);
    expect(ordered.slice(0, 9)).toEqual(["zip-postal-code", "state-province", "birth-date", "membership", "first-name", "last-name", "email", "phone", "phone-type"]);
    expect(new Set(ordered).size).toBe(fields.length);
    expect(ordered).toHaveLength(fields.length);
    expect(ordered.indexOf("membership")).toBeLessThan(ordered.indexOf("social-security-number"));
    const reversed = orderFieldsByPages(fields, [...pages].reverse()).map(field => field.key);
    expect(reversed.indexOf("social-security-number")).toBeLessThan(reversed.indexOf("membership"));
  });
  it("shows disabled pages without changing ABE's reviewed requirements", () => {
    const rows = pageCatalogRows(catalog, "abe");
    expect(rows).toHaveLength(30);
    expect(rows.filter(page => page.flow === "utility").map(page => page.key)).toEqual(["error-404", "error-500", "session-expired", "technical-error", "maintenance", "application-unavailable", "outcome-unknown"]);
    expect(rows.find(page => page.key === "health-si")).toMatchObject({ enabled: false, requirement: "none", fields: [], fieldGroups: [] });
    expect(rows.find(page => page.key === "health-cir")).toMatchObject({ enabled: false, requirement: "none", fields: [], fieldGroups: [] });
    expect(rows.find(page => page.key === "payment")).toMatchObject({ requirement: "optional" });
    expect(rows.filter(page => ["resume", "advisor"].includes(page.flow)).every(page => page.requirement === "required")).toBe(true);
    expect(rows.some(page => page.definition.type === "internal")).toBe(false);
  });

  it("lists page-owned fields and links only to saved definitions in the selected catalog", () => {
    const rows = pageCatalogRows(catalog, "abe");
    expect(rows.find(page => page.key === "home")!.fields.map(field => field.name)).toEqual(["Zip code", "State", "Birthdate"]);
    const membership = rows.find(page => page.key === "membership")!.fields;
    expect(membership.map(field => field.name).slice(0, 6)).toEqual(["Membership attestation", "First name", "Last name", "Email", "Phone number", "Phone type"]);
    expect(membership.some(field => field.key === "active-military")).toBe(false);
    const definitions = new Set(fieldCatalogRows(catalog, "abe").map(field => field.key));
    for (const page of rows) for (const field of page.fields) expect(definitions.has(field.key), `${page.key}/${field.key}`).toBe(true);
    expect(rows.find(page => page.key === "health-ci")!.fields.some(field => field.key === "health-abe-form-197")).toBe(true);
  });

  it("follows changed Site requirements instead of hardcoding ABE's settings", () => {
    const changed = structuredClone(catalog);
    changed.data.sitePages.find(page => page.siteKey === "abe" && page.pageKey === "health-cir")!.requirement = "required";
    const cir = pageCatalogRows(changed, "abe").find(page => page.key === "health-cir")!;
    expect(cir).toMatchObject({ enabled: true, requirement: "required" });
    expect(cir.fields.some(field => field.key === "health-chr-form-98")).toBe(true);
    expect(pageCatalogRows(catalog, "missing-site")).toEqual([]);
  });
});


it('includes shared recovery entries and their Storybook examples for every Site in the saved JSON', () => {
  for (const siteKey of ['all', ...catalog.data.sites.map(site => site.key)]) {
    const rows = pageCatalogRows(catalog, siteKey);
    for (const key of ['application-unavailable', 'outcome-unknown']) {
      const row = rows.find(row => row.key === key)!;
      expect(row).toMatchObject({ enabled: true, flow: 'utility', fields: [], definition: { path: `/${key}`, type: 'error' } });
      expect(catalog.data.components.some(component => component.definition.examples?.some(example => example.pageKey === key && example.storyId.startsWith('pages-error-pages--')))).toBe(true);
    }
  }
});
