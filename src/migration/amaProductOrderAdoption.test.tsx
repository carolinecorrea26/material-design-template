import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAmaProductOrderAdoption, amaSourceProductOrder } from "./amaProductOrderAdoption";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getActiveClientCoverages } from "../config/client/getActiveClientCoverages";
import { capturedCoverageEntryScope, restoreCoverageEntryScope } from "../config/client/coverageProductScope";
import CoverageOptionsPanel from "../app/sections/ConfiguredCoverageOptionsPanel";
import { validateMigrationDatabase } from "./integrity";
import type { DatabaseSchema } from "../persistence/types";
let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });
function open(query = "", data = db) { window.history.replaceState(null, "", `/?site=ama${query ? `&${query}` : ""}`); const library = resolvePrototypeLibrary(data, "ama", "source-order"); installPrototypeLibrary(library); return library; }
it("uses captured AMA source order and optional native client configuration, preserving edits and the default on other Sites", () => {
  open(); expect(getActiveClientCoverages().map(row => row.id)).toEqual(amaSourceProductOrder);
  const copy = structuredClone(db); applyAmaProductOrderAdoption(copy); expect(copy).toEqual(db); expect(validateMigrationDatabase(db)).toEqual([]);
  copy.configurationValues.find(row => row.key === "site:ama.coverages.productOrder")!.value = ["li-term", "li-20yr"];
  open("", copy); expect(getActiveClientCoverages()[0].id).toBe("li-term");
  open(); expect(getActiveClientCoverages()[0].id).toBe("li-20yr");
  window.history.replaceState(null, "", "/?site=asce"); installPrototypeLibrary(resolvePrototypeLibrary(db, "asce", "default")); expect(getActiveClientCoverages()[0].id).toBe("li-term");
  copy.configurationValues.find(row => row.key === "site:ama.coverages.productOrder")!.value = ["unknown-product"];
  expect(() => resolvePrototypeLibrary(copy, "ama", "invalid")).toThrow("Invalid configured product order");
});
it("prioritizes the URL featured product/category, persists across routes, and never broadens a filtered portfolio", () => {
  const library = open(), level = library.products.find(row => row.id === "di-level-rated")!, identifier = level.gNumber!.primary!;
  open(`featured_prod=${identifier}`); expect(getActiveClientCoverages().slice(0, 2).map(row => row.id)).toEqual(["di-level-rated", "di-step-rated"]); expect(getActiveClientCoverages()[0].featured).toBe(true);
  window.history.replaceState(null, "", "/coverage?site=ama"); expect(getActiveClientCoverages()[0].id).toBe("di-level-rated");
  expect(capturedCoverageEntryScope("ama")).toEqual({ featured_prod: identifier });
  open("category=li"); expect(getActiveClientCoverages()[0].id).toBe("li-20yr");
  open(`category=li&featured_prod=${identifier}`); expect(getActiveClientCoverages().every(row => row.categoryId === "LI" && !row.featured)).toBe(true);
  open(`featured_prod=${identifier}`); expect(getActiveClientCoverages().every(row => row.categoryId === "LI")).toBe(true);
  restoreCoverageEntryScope("ama", undefined);
  window.history.replaceState(null, "", "/coverage?site=ama"); restoreCoverageEntryScope("ama", { featured_prod: "unknown" }); expect(getActiveClientCoverages().map(row => row.id)).toEqual(amaSourceProductOrder);
});
it("renders the configured Life order and opens a featured Disability category first in coverage options", () => {
  const library = open();
  let html = renderToStaticMarkup(<CoverageOptionsPanel variant="page" />);
  const names = amaSourceProductOrder.slice(0, 5).map(key => library.products.find(row => row.id === key)!.name);
  const container = document.createElement("div"); container.innerHTML = html;
  const titles = [...container.querySelectorAll("span")].map(element => element.firstChild?.textContent?.trim()).filter(name => names.includes(name ?? ""));
  expect(titles).toEqual(names);
  open(`featured_prod=${library.products.find(row => row.id === "di-level-rated")!.gNumber!.primary}`);
  html = renderToStaticMarkup(<CoverageOptionsPanel variant="page" />);
  expect(html.indexOf("Disability Insurance with Level Rated Premiums")).toBeGreaterThan(-1);
  expect(html.indexOf("Disability Insurance with Level Rated Premiums")).toBeLessThan(html.indexOf("Disability Insurance with Step Rated Premiums"));
});
