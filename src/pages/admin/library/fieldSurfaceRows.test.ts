import { withFreshStartCatalog } from "../../../domain/freshStartCatalog";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { fieldSurfaceLabel } from "./fieldSurfaceLabel";
import { fieldSurfaceRows } from "./fieldSurfaceRows";
import { storedApplicationPageRows } from "./storedLibraryModel";
import { resolvePrototypeLibrary } from "../../../domain/prototypeLibrary";
import { resolveMappedFields } from "../../../domain/requirementFields";

const quoteInputFieldIds = ["zip-postal-code", "state-province", "birth-date", "gender", "smoker", "tobacco-last-used", "tobacco-products", "average-monthly-income", "hours-worked-per-week", "actively-at-work", "monthly-business-expenses", "business-expense-responsibility"];
import { getSiteFieldInventory } from "../../../config/fields/inspectionInventory";
import { getQuoteQuestionFieldIds } from "../../../config/fields/homeQuoteFields";
import { requirementsFieldValidationRows } from "./ValidationLibrary";

const catalog: LibraryCatalog = { ...JSON.parse(readFileSync("public/catalog/portal.json", "utf8")), revision: "test" };

describe("field component placements", () => {
  it.each(["all", "asce"])("uses fresh reviewed page order in %s despite stale saved positions", (siteKey) => {
    const changed = structuredClone(catalog);
    const pages = siteKey === "all" ? changed.data.pages : changed.data.sitePages.filter(page => page.siteKey === siteKey);
    const membership = pages.find(page => ("pageKey" in page ? page.pageKey : page.key) === "membership")!;
    const eligibility = pages.find(page => ("pageKey" in page ? page.pageKey : page.key) === "eligibility")!;
    [membership.position, eligibility.position] = [eligibility.position, membership.position];
    const listedPages = [...new Set(fieldSurfaceRows(changed, siteKey).flatMap(row => row.pages))].slice(0, 3);
    expect(listedPages).toEqual(["home", "membership", "eligibility"]);
    expect(listedPages).toEqual(storedApplicationPageRows(changed, siteKey).slice(0, 3).map(page => page.key));
    const otherScope = siteKey === "all" ? "asce" : "all";
    expect([...new Set(fieldSurfaceRows(changed, otherScope).flatMap(row => row.pages))].slice(0, 3)).toEqual(["home", "membership", "eligibility"]);
  });
  it.skipIf(!catalog.data.sites.some(site => site.key === "ama"))("numbers fields within their rendered area and retains effective requirements", () => {
    const rows = fieldSurfaceRows(catalog, "ama");
    const physician = rows.filter(row => row.pages.includes("membership") && row.field.id.startsWith("ama-physician-"));
    expect(new Set(physician.map(row => row.surface)).size).toBe(1);
    expect(physician).toHaveLength(6);
    const surface = rows.filter(row => row.surface === physician[0].surface);
    expect(physician.map(row => row.order)).toEqual(physician.map(row => surface.indexOf(row) + 1));
    expect(!!physician.find(row => row.field.id === "ama-physician-title")?.field.required).toBe(false);
    expect(physician.find(row => row.field.id === "ama-physician-email")?.field.required).toBe(true);
  });
  it("separates shared drawers from Home's eligibility card", () => {
    const asce = fieldSurfaceRows(catalog, "asce");
    expect(asce.some(row => row.surface === "Quote calculator drawer" && row.field.id === "gender")).toBe(true);
    expect(asce.some(row => row.surface === "Home eligibility card" && row.field.id === "gender")).toBe(false);
    expect(asce.filter(row => row.surface === "Needs calculator drawer").map(row => row.order)).toEqual([1, 2, 3, 4]);
  });
  it("uses fresh quote definitions for the Home card and drawer despite stale saved labels", () => {
    const changed = structuredClone(catalog);
    for (const id of quoteInputFieldIds) {
      changed.data.fields.find(field => field.key === id)!.definition.label = `Legacy ${id}`;
    }
    const asce = fieldSurfaceRows(changed, "asce").filter(row => row.surface === "Quote calculator drawer");
    const resolved = resolveMappedFields({ component: "quote-calculator" }, { siteId: "asce" });
    const shown = resolved.filter(field => quoteInputFieldIds.includes(field.id) && asce.some(row => row.field.id === field.id));
    // ASCE has no product that asks the active-work or business-expense questions;
    // the drawer follows the Home card, which already collected ZIP, state and DOB.
    expect(shown.map(field => field.id)).toEqual(["gender", "smoker", "tobacco-last-used", "tobacco-products", "average-monthly-income", "hours-worked-per-week"]);
    const homeCard = fieldSurfaceRows(changed, "asce").filter(row => row.surface === "Home eligibility card" && quoteInputFieldIds.includes(row.field.id as never));
    expect(homeCard.map(row => row.field.id)).toEqual(["zip-postal-code", "state-province", "birth-date"]);
    for (const row of homeCard) {
      expect(row.field).toEqual(resolved.find(field => field.id === row.field.id));
      expect(row.source).toBe("requirements-json");
    }
    for (const field of shown) {
      expect(asce.find(row => row.field.id === field.id)?.field).toEqual(field);
      expect(asce.find(row => row.field.id === field.id)?.source).toBe("requirements-json");
      const validation = requirementsFieldValidationRows(asce).filter(row => row.field === field.id);
      expect(validation.some(row => row.required && row.when.includes("Quote calculator"))).toBe(true);
    }
  });
  it("uses the inspected site's category policy and retains Home hides", () => {
    const library = resolvePrototypeLibrary(structuredClone(catalog.data), "asce", "test");
    const fields = getQuoteQuestionFieldIds(library.client, ["LI", "SH"], library);
    expect(fields.filter(id => id === "tobacco-last-used")).toHaveLength(1);
    expect(fields.filter(id => id === "tobacco-products")).toHaveLength(1);
    expect(getQuoteQuestionFieldIds(library.client, ["DI"], library)).not.toContain("tobacco-last-used");
    library.client.fields.home = { ...library.client.fields.home, hidden: ["tobacco-products"] };
    const inventory = getSiteFieldInventory("asce", library).filter(row => row.group?.id === "quote-calculator");
    expect(inventory.some(row => row.field.id === "tobacco-last-used")).toBe(true);
    expect(inventory.some(row => row.field.id === "tobacco-products")).toBe(false);
  });
  it("includes every configured section field and companion contact inputs in All", () => {
    const rows = fieldSurfaceRows(catalog, "all");
    const current = withFreshStartCatalog(catalog.data);
    const enabledPages = new Set(current.sitePages.filter(page => page.requirement !== "none").map(page => page.pageKey));
    for (const placement of current.pageSectionFields) {
      const section = current.pageSections.find(section => section.key === placement.sectionKey)!;
      if (!enabledPages.has(section.pageKey)) continue;
      expect(rows.some(row => row.field.id === placement.fieldKey && row.pages.includes(section.pageKey)), `${section.key}/${placement.fieldKey}`).toBe(true);
    }
    const spouseContact = rows.filter(row => row.surface === "Contact page · Spouse");
    expect(spouseContact.map(row => row.field.id)).toEqual(["spouse-phone", "spouse-phone-type", "spouse-email"]);
    expect(spouseContact.map(row => row.order)).toEqual([1, 2, 3]);
    expect(rows.some(row => row.field.id.startsWith("beneficiary-") && row.pages.includes("beneficiary"))).toBe(true);
    if (enabledPages.has("health-tele")) expect(rows.some(row => row.pages.includes("health-tele"))).toBe(true);
  });
  it("keeps fresh Coverage inputs under their applicant and named subsection", () => {
    const rows = fieldSurfaceRows(catalog, "asce");
    for (const applicant of ["self", "spouse"] as const) {
      const label = applicant === "self" ? "Member" : "Spouse";
      const prefix = applicant === "self" ? "" : "spouse-";
      const personal = rows.filter(row => row.surface === `Coverage page · ${label} · Personal Details`);
      expect(personal.map(row => row.field.id)).toEqual([`${prefix}gender`, `${prefix}smoker`, `${prefix}tobacco-last-used`, `${prefix}tobacco-products`]);
      expect(personal.map(row => row.order)).toEqual([1, 2, 3, 4]);
      const work = rows.filter(row => row.surface === `Coverage page · ${label} · Work & Income`);
      expect(work.map(row => row.field.id)).toEqual([`${prefix}hours-worked-per-week`, `${prefix}average-monthly-income`, ...(applicant === "self" ? ["self-employed-under-one-year", "actively-at-work"] : [])]);
    }
  });
  it("ignores obsolete saved subsection headings and order on reviewed Coverage", () => {
    const changed = structuredClone(catalog);
    const section = changed.data.pageSections.find(section => section.definition.id === "selfCoverageWorkIncome")!;
    section.definition.description = "Stale heading";
    const placements = changed.data.pageSectionFields.filter(row => row.sectionKey === section.key);
    placements.forEach((placement, index) => { placement.position = placements.length - index; });
    const rows = fieldSurfaceRows(changed, "asce").filter(row => row.surface === "Coverage page · Member · Work & Income");
    expect(rows.map(row => row.field.id)).toEqual(["hours-worked-per-week", "average-monthly-income", "self-employed-under-one-year", "actively-at-work"]);
    const parent = changed.data.pageSections.find(section => section.definition.id === "selfCoverageQuestions")!;
    parent.definition.description = "Stale personal heading";
    const current = { ...changed, data: withFreshStartCatalog(changed.data, "asce") };
    expect(fieldSurfaceLabel(current, "coverage", "selfCoverageTobacco", "tobacco-products")).toBe("Coverage page · Member · Personal Details");
  });
  it("uses internal applicant names while preserving applicant-facing setup titles", () => {
    const rows = fieldSurfaceRows(catalog, "all");
    expect(rows.find(row => row.field.id === "spouse-email" && row.pages.includes("contact"))?.surface).toBe("Contact page · Spouse");
    expect(rows.find(row => row.field.id === "birth-date" && row.pages.includes("eligibility"))?.surface).toBe("Eligibility page · Member");
    expect(rows.find(row => row.field.id === "child-first-name")?.surface).toBe("Eligibility page · Child");
    expect(rows.some(row => /\b(?:self|you|your spouse|your child(?:ren)?)\b/i.test(row.surface.replace(/[a-z0-9]+(?:-[a-z0-9]+)+/gi, "")))).toBe(false);
    expect(catalog.data.pageSections.find(row => row.definition.id === "contactSpouse")?.definition.description).toBe("Your Spouse");
  });
});
