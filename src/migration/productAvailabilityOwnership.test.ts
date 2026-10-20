import { expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { consolidateProductAvailabilityOwnership } from "./productAvailabilityOwnership";
import { resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { activeSiteMigrationScope } from "./activeSiteScope";

const db = createReviewedMigrationDatabase();
it("uses Site products across all business portfolios and preserves superseded evidence", () => {
  for (const site of activeSiteMigrationScope.sites.filter(site => site.mcrRequired)) {
    const library = resolvePrototypeLibrary(db, site.key, "test:availability");
    const saved = db.sites.find(row => row.key === site.key)!;
    expect(library.client.coverages.enabled?.slice().sort()).toEqual(db.siteProducts.filter(row => row.siteId === saved.id && row.enabled).map(row => row.productKey).sort());
    expect(library.site.configuration.productAvailabilityOwnership).toBe("siteProducts");
  }
  expect(resolvePrototypeLibrary(db, "csea", "test").client.coverages.enabled).toContain("li-add");
  expect(resolvePrototypeLibrary(db, "waepa-gi", "test").client.coverages.enabled).not.toContain("di-short-term");
  expect(resolvePrototypeLibrary(db, "waepa", "test").client.coverages.enabled).toContain("di-short-term");
  expect(db.semanticRequirements.filter(row => row.predicate === "site-product-availability")).toHaveLength(9);
  const repeated = structuredClone(db);
  consolidateProductAvailabilityOwnership(repeated);
  expect(repeated).toEqual(db);
});

it("rejects revived copied lists and unreviewed source disagreements without mutating data", () => {
  const changed = structuredClone(db);
  const template = changed.configurationValues.find(row => row.scope === "site" && row.siteKey === "asce")!;
  changed.configurationValues.push({ ...template, id: "test.enabled", key: "test.enabled", configurationKey: "coverages.enabled", value: ["li-term"] });
  expect(() => resolvePrototypeLibrary(changed, "asce", "test:competing")).toThrow("compete with siteProducts");
  const before = JSON.stringify(changed);
  expect(() => consolidateProductAvailabilityOwnership(changed)).toThrow("Unreconciled product availability");
  expect(JSON.stringify(changed)).toBe(before);
});
