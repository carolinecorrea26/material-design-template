import { describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../../../migration/fixtures";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { fieldSurfaceLabel } from "./fieldSurfaceLabel";
import { fieldSurfaceRows } from "./fieldSurfaceRows";
import { storedApplicationPageRows } from "./storedLibraryModel";

const catalog: LibraryCatalog = { data: JSON.parse(JSON.stringify(createReviewedMigrationDatabase())), revision: "test", analyticsTags: [] };

describe("field component placements", () => {
  it.each(["all", "asce"])("follows saved page order in %s without changing other scopes", (siteKey) => {
    const changed = structuredClone(catalog);
    const pages = siteKey === "all" ? changed.data.pages : changed.data.sitePages.filter(page => page.siteKey === siteKey);
    const membership = pages.find(page => ("pageKey" in page ? page.pageKey : page.key) === "membership")!;
    const eligibility = pages.find(page => ("pageKey" in page ? page.pageKey : page.key) === "eligibility")!;
    [membership.position, eligibility.position] = [eligibility.position, membership.position];
    const listedPages = [...new Set(fieldSurfaceRows(changed, siteKey).flatMap(row => row.pages))].slice(0, 3);
    expect(listedPages).toEqual(["home", "eligibility", "membership"]);
    expect(listedPages).toEqual(storedApplicationPageRows(changed, siteKey).slice(0, 3).map(page => page.key));
    const otherScope = siteKey === "all" ? "asce" : "all";
    expect([...new Set(fieldSurfaceRows(changed, otherScope).flatMap(row => row.pages))].slice(0, 3)).toEqual(["home", "membership", "eligibility"]);
  });
  it("numbers fields within their rendered area and retains effective requirements", () => {
    const rows = fieldSurfaceRows(catalog, "ama");
    const physician = rows.filter(row => row.surface === "Membership page · Physician Information");
    expect(physician.map(row => row.order)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(!!physician.find(row => row.field.id === "ama-physician-title")?.field.required).toBe(false);
    expect(physician.find(row => row.field.id === "ama-physician-email")?.field.required).toBe(true);
  });
  it("separates shared drawers from Home's eligibility card and respects disabled quoting", () => {
    const asce = fieldSurfaceRows(catalog, "asce");
    expect(asce.some(row => row.surface === "Quote calculator drawer" && row.field.id === "gender")).toBe(true);
    expect(asce.some(row => row.surface === "Home eligibility card" && row.field.id === "gender")).toBe(false);
    expect(asce.filter(row => row.surface === "Needs calculator drawer").map(row => row.order)).toEqual([1, 2, 3, 4]);
    expect(fieldSurfaceRows(catalog, "csea").some(row => row.surface.startsWith("Quote calculator"))).toBe(false);
  });
  it("includes every configured section field and companion contact inputs in All", () => {
    const rows = fieldSurfaceRows(catalog, "all");
    for (const placement of catalog.data.pageSectionFields) {
      const section = catalog.data.pageSections.find(section => section.key === placement.sectionKey)!;
      expect(rows.some(row => row.field.id === placement.fieldKey && row.pages.includes(section.pageKey)), `${section.key}/${placement.fieldKey}`).toBe(true);
    }
    const spouseContact = rows.filter(row => row.surface === "Contact page · Spouse");
    expect(spouseContact.map(row => row.field.id)).toEqual(["spouse-phone", "spouse-phone-type", "spouse-email"]);
    expect(spouseContact.map(row => row.order)).toEqual([1, 2, 3]);
    expect(rows.some(row => row.field.id.startsWith("beneficiary-") && row.pages.includes("beneficiary"))).toBe(true);
    expect(rows.some(row => row.field.id.startsWith("health-li-detail-") && row.pages.includes("health-li"))).toBe(true);
  });
  it("keeps conditional Coverage inputs under their configured applicant and named subsection", () => {
    const rows = fieldSurfaceRows(catalog, "all");
    for (const applicant of ["self", "spouse"] as const) {
      const label = applicant === "self" ? "Member" : "Spouse";
      const prefix = applicant === "self" ? "" : "spouse-";
      const personal = rows.filter(row => row.surface === `Coverage page · ${label} · Personal Details`);
      expect(personal.map(row => row.field.id)).toEqual([`${prefix}gender`, `${prefix}smoker`, `${prefix}tobacco-last-used`, `${prefix}tobacco-products`]);
      expect(personal.map(row => row.order)).toEqual([1, 2, 3, 4]);
      const work = rows.filter(row => row.surface === `Coverage page · ${label} · Work & Income`);
      expect(work.map(row => row.field.id)).toEqual([`${prefix}hours-worked-per-week`, `${prefix}average-monthly-income`]);
    }
    expect(rows.find(row => row.field.id === "monthly-business-expenses" && row.pages.includes("coverage"))?.surface).toBe("Coverage page · Member · Business Details");
  });
  it("derives subsection headings and order from changed project configuration", () => {
    const changed = structuredClone(catalog);
    const section = changed.data.pageSections.find(section => section.definition.id === "selfCoverageWorkIncome")!;
    section.definition.description = "Updated project heading";
    const placements = changed.data.pageSectionFields.filter(row => row.sectionKey === section.key);
    placements.forEach((placement, index) => { placement.position = placements.length - index; });
    const rows = fieldSurfaceRows(changed, "asce").filter(row => row.surface === "Coverage page · Member · Updated project heading");
    expect(rows.map(row => row.field.id)).toEqual(["average-monthly-income", "hours-worked-per-week"]);
    const parent = changed.data.pageSections.find(section => section.definition.id === "selfCoverageQuestions")!;
    parent.definition.description = "Updated personal heading";
    expect(fieldSurfaceLabel(changed, "coverage", "selfCoverageTobacco", "tobacco-products")).toBe("Coverage page · Member · Updated personal heading");
  });
  it("uses internal applicant names while preserving applicant-facing setup titles", () => {
    const rows = fieldSurfaceRows(catalog, "all");
    expect(rows.find(row => row.field.id === "spouse-email" && row.pages.includes("contact"))?.surface).toBe("Contact page · Spouse");
    expect(rows.find(row => row.field.id === "birth-date" && row.pages.includes("eligibility"))?.surface).toBe("Eligibility page · Member");
    expect(rows.find(row => row.field.id === "child-first-name")?.surface).toBe("Eligibility page · Child");
    expect(rows.some(row => /\b(?:self|you|your spouse|your child(?:ren)?)\b/i.test(row.surface.replace(/[a-z0-9]+(?:-[a-z0-9]+)+/gi, "")))).toBe(false);
    expect(catalog.data.pageSections.find(row => row.definition.id === "contactSpouse")?.definition.title).toBe("Your Spouse");
  });
  it("preserves saved labels and options rather than replacing them from inspection metadata", () => {
    const changed = structuredClone(catalog);
    const field = changed.data.fields.find(row => row.key === "gender")!;
    field.definition.label = "Saved gender label";
    field.definition.options = [{ value: "saved", label: "Saved option" }];
    expect(fieldSurfaceRows(changed, "asce").find(row => row.field.id === "gender" && row.surface === "Quote calculator drawer")?.field).toMatchObject({ label: "Saved gender label", options: [{ value: "saved", label: "Saved option" }] });
  });
});
