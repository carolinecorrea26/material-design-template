import { afterEach, beforeAll, expect, it } from "vitest";
import { activeCoverageProductRestriction, capturedCoverageEntryScope, restoreCoverageEntryScope, restrictCoverageProducts, withCapturedCoverageEntryScope } from "./coverageProductScope";
import { activeCoverageCategoryRestriction } from "./coverageCategoryScope";
import { getActiveClientCoverages } from "./getActiveClientCoverages";
import { createReviewedMigrationDatabase } from "../../migration/fixtures";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../../domain/prototypeLibrary";
import type { DatabaseSchema } from "../../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });
function entry(site: string, query: string) { window.history.replaceState(null, "", `/?site=${site}&${query}`); installPrototypeLibrary(resolvePrototypeLibrary(db, site, "campaign-filter")); return getActiveClientCoverages(); }
it("intersects categories and current native G-numbers, including Association mappings", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "all-identifiers");
  expect(restrictCoverageProducts(library.products, "G-31139-0", library.site).map(product => product.id)).toEqual(["li-group-term"]);
  for (const [site, category] of [["ama", "di"], ["abe", "li"], ["isitrust", "li"]]) {
    const products = entry(site, `category=${category}`), product = products[0], identifier = product.gNumber!.primary!;
    expect(products.length).toBeGreaterThan(1);
    const filtered = entry(site, `category=${category}&prods=${encodeURIComponent(identifier.toLowerCase())}`);
    expect(filtered.map(product => product.id)).toContain(product.id);
    expect(filtered.every(product => product.categoryId === category.toUpperCase())).toBe(true);
    expect(filtered.length).toBeLessThan(products.length);
    expect(entry(site, `category=sh&prods=${identifier}`)).toEqual([]);
    expect(entry(site, `category=${category}&prods=G-999999-0`)).toEqual([]);
    expect(entry(site, `category=${category}&prods=${product.id}`)).toEqual([]);
  }
});
it("supports comma-separated category/G-number lists without expanding the Site portfolio", () => {
  const library = resolvePrototypeLibrary(db, "ama", "multiple-products");
  const products = [library.products.find(product => product.categoryId === "LI")!, library.products.find(product => product.categoryId === "DI")!];
  const prods = [...products.map(product => product.gNumber!.primary!), "G-31139-0"];
  const result = entry("ama", `category=li,di&prods=${encodeURIComponent(prods.join(", "))}`);
  expect(result.every(product => ["LI", "DI"].includes(product.categoryId))).toBe(true);
  for (const product of products) expect(result.map(row => row.id)).toContain(product.id);
  expect(result.some(product => product.id === "li-group-term")).toBe(false);
});
it("preserves a campaign across routes, resets on a new category entry and isolates Sites", () => {
  const products = entry("ama", "category=di"), identifier = products[0].gNumber!.primary!;
  const expected = entry("ama", `category=di&prods=${identifier}`).map(product => product.id);
  window.history.replaceState(null, "", "/coverage?site=ama");
  expect(getActiveClientCoverages().map(product => product.id)).toEqual(expected);
  expect(activeCoverageProductRestriction("abe")).toBeNull();
  expect(entry("ama", "category=di").length).toBeGreaterThan(expected.length);
  expect(entry("ama", `prods=${identifier}`)).toEqual([]);
  expect(entry("ama", "category=all")).toHaveLength(resolvePrototypeLibrary(db, "ama", "original").products.length);
});
it("captures and restores each application's scope without altering its saved answers", () => {
  window.history.replaceState(null, "", "/?category=li&prods=G-31139-0");
  activeCoverageCategoryRestriction("isitrust"); activeCoverageProductRestriction("isitrust");
  const original = { membership: "association-of-texas-professional-educators", coverageAmounts: { "li-group-term:member": 100000 } }, saved = withCapturedCoverageEntryScope("isitrust", original);
  expect(saved).toMatchObject({ ...original, coverageEntryScope: { category: "li", prods: "G-31139-0" } });
  window.history.replaceState(null, "", "/?category=di"); activeCoverageCategoryRestriction("isitrust"); activeCoverageProductRestriction("isitrust");
  restoreCoverageEntryScope("isitrust", (saved as unknown as { coverageEntryScope: unknown }).coverageEntryScope);
  expect(capturedCoverageEntryScope("isitrust")).toEqual({ category: "li", prods: "G-31139-0" });
  expect(original).not.toHaveProperty("coverageEntryScope");
  restoreCoverageEntryScope("isitrust", undefined); expect(capturedCoverageEntryScope("isitrust")).toEqual({});
  restoreCoverageEntryScope("isitrust", { category: ["li"], prods: 42 }); expect(capturedCoverageEntryScope("isitrust")).toEqual({ category: "", prods: "" });
});
