import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../../../migration/fixtures";
import { getAnalyticsInventory } from "../../../analytics/inventory";
import type { LibraryCatalog } from "../../../services/libraryCatalogService";
import { fieldSurfaceRows } from "./fieldSurfaceRows";
import { analyticsLibraryRows } from "./analyticsLibraryRows";
import { componentCatalog } from "../../../content/docs/components";

const catalog: LibraryCatalog = {
  data: JSON.parse(JSON.stringify(createReviewedMigrationDatabase())), revision: "stored-test",
  analyticsTags: getAnalyticsInventory().filter(tag =>
    tag.elementKey === "ama-physician-email" || tag.elementKey === "needs-annual-income" ||
    tag.elementKey === "confirm-remove-coverage" || tag.elementKey === "new-application" ||
    tag.kind === "page" && ["advisor-login", "advisor-send-confirmation"].includes(tag.pageId) ||
    tag.pageId === "membership" && tag.kind === "navigation"),
};

it("uses saved field labels, rendered control variants and the same surfaces as Fields", () => {
  const changed = structuredClone(catalog);
  const field = changed.data.fields.find(field => field.key === "ama-physician-email")!;
  field.definition.label = "Saved analytics field label";
  field.definition.multiline = true;
  const expected = fieldSurfaceRows(changed, "all").find(row => row.field.id === field.key)!;
  const row = analyticsLibraryRows(changed, "all").find(row => row.elementKey === field.key)!;
  expect(row.label).toBe("Saved analytics field label");
  expect(row.appearances).toEqual([expected.surface]);
  expect(row.components).toEqual([{ label: "Textarea", storyId: "forms-fieldrenderer--textarea" }]);
  expect(row.placements[0].id).toBe(catalog.analyticsTags.find(tag => tag.elementKey === field.key)!.id);
  expect(catalog.analyticsTags.find(tag => tag.elementKey === field.key)!.label).not.toBe(row.label);
});

it("uses readable Pages-library names for page events without changing stored tag identity", () => {
  const rows = analyticsLibraryRows(catalog, "all");
  expect(rows.find(row => row.kind === "page" && row.pageId === "advisor-login")?.label).toBe("Advisor Login");
  expect(rows.find(row => row.kind === "page" && row.pageId === "advisor-send-confirmation")?.label).toBe("Advisor Send Confirmation");
  for (const row of rows.filter(row => row.kind === "page")) {
    expect(row.id).toBe(catalog.analyticsTags.find(tag => tag.pageId === row.pageId && tag.kind === "page")!.id);
  }
});

it("uses drawer ownership from Fields while retaining all entry-point tracking contexts", () => {
  const row = analyticsLibraryRows(catalog, "all").find(row => row.elementKey === "needs-annual-income")!;
  expect(row.appearances).toEqual(["Needs calculator drawer"]);
  expect(row.placements.length).toBeGreaterThan(1);
  expect(row.placementMissing).toBe(false);
});

it("links stored components and flags unmatched saved field specifications", () => {
  const rows = analyticsLibraryRows(catalog, "all");
  const cart = componentCatalog.find(component => component.name === "CoverageCart")!;
  expect(rows.find(row => row.elementKey === "confirm-remove-coverage")?.components).toEqual([{ label: cart.name, storyId: cart.storyId }]);
  expect(rows.find(row => row.elementKey === "new-application")?.components).toEqual([]);
  const missing = structuredClone(catalog);
  const tag = missing.analyticsTags.find(tag => tag.elementKey === "ama-physician-email")!;
  tag.elementKey = "not-a-stored-field";
  expect(analyticsLibraryRows(missing, "all").find(row => row.id === tag.id)?.placementMissing).toBe(true);
});

it("keeps selected Site scope and all stored event specifications intact", () => {
  const rows = analyticsLibraryRows(catalog, "ama", true);
  expect(rows.every(row => row.placements.every(tag => tag.sites.includes("ama")))).toBe(true);
  for (const row of rows) {
    const saved = catalog.analyticsTags.find(tag => tag.id === row.id);
    if (saved) expect(row.events).toEqual(saved.events);
    else expect(row.status).toBe("proposed");
  }
});

it("resolves actual navigation components for current and older stored specifications", () => {
  for (const legacy of [false, true]) {
    const stored = structuredClone(catalog);
    if (legacy) for (const tag of stored.analyticsTags.filter(tag => tag.kind === "navigation")) tag.sourceFile = "src/config/pages.ts";
    const rows = analyticsLibraryRows(stored, "all");
    expect(rows.find(row => row.elementKey === "next")?.components).toEqual([{ label: "PageNav", storyId: "navigation-pagenav--default" }]);
    expect(rows.find(row => row.elementKey === "back")?.components).toEqual([{ label: "PageTitle", storyId: "layout-pagetitle--with-back-button" }]);
    const unknown = stored.analyticsTags.find(tag => tag.elementKey === "back")!;
    unknown.elementKey = "unknown-navigation";
    unknown.sourceFile = "src/config/pages.ts";
    expect(analyticsLibraryRows(stored, "all").find(row => row.elementKey === "unknown-navigation")).toBeUndefined();
  }
});


it("lists actual menu buttons and individual help chips rather than synthetic open actions", () => {
  const rows = analyticsLibraryRows(catalog, "ama");
  const needs = rows.find(row => row.elementKey === "open-coverage-needs")!;
  expect(needs.label).toBe("Needs Calculator");
  expect(needs.appearances).toEqual(["Application menu · Application Tools"]);
  expect(rows.some(row => row.label === "Open page help" || row.label === "Open Coverage needs calculator")).toBe(false);
  expect(rows.some(row => row.appearances.includes("Shared site layout"))).toBe(false);
  const membership = rows.filter(row => row.pageId === "membership" && row.kind === "button" && row.elementKey.startsWith("help-"));
  expect(membership.map(row => row.label)).toEqual(["What are my coverage options?", "How does applying work?"]);
  expect(membership.every(row => row.components.some(component => component.label === "HelpChips"))).toBe(true);
  expect(rows.some(row => row.pageId === "coverage" && row.elementKey.startsWith("help-"))).toBe(false);
});

it("uses saved contact values and omits controls whose configured feature is absent", () => {
  const rows = analyticsLibraryRows(catalog, "csea");
  expect(rows.some(row => row.elementKey.startsWith("quote-"))).toBe(false);
  expect(rows.filter(row => row.elementKey.startsWith("menu-support-")).every(row => row.appearances[0] === "Application menu · Contact Us")).toBe(true);
  expect(rows.filter(row => row.elementKey.startsWith("footer-support-")).every(row => row.appearances[0] === "Footer · contact information")).toBe(true);
});
