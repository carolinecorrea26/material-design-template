import { describe, expect, it } from "vitest";
import { restrictCoverageCategories, initialCoverageCategories, activeCoverageCategoryRestriction } from "./coverageCategoryScope";
import { getClientCoverages } from "./getActiveClientCoverages";
import { getEffectiveSiteConfig } from "../../data/registry";
import { getCategoryRequirements } from "../coverageQuestionRequirements";

describe("single category entry", () => {
  it("selects CSEA disability before displaying its additional questions", () => {
    const products = getClientCoverages(getEffectiveSiteConfig("csea"));
    const categories = [...new Set(products.map(p => p.categoryId))];
    expect(initialCoverageCategories(categories, ["LI"])).toEqual(["DI"]);
    expect(getCategoryRequirements(initialCoverageCategories(categories)).needsAdditionalFields).toBe(true);
  });
  it("restricts both portfolios by URL category and removes stale category choices", () => {
    const products = getClientCoverages(getEffectiveSiteConfig("abe"));
    const limited = restrictCoverageCategories(products, "AD");
    expect(limited.length).toBeGreaterThan(0);
    expect(limited.every(p => p.categoryId === "AD")).toBe(true);
    expect(initialCoverageCategories(["AD"], ["LI"])).toEqual(["AD"]);
    expect(getCategoryRequirements(["AD"]).needsAdditionalFields).toBe(false);
    expect(restrictCoverageCategories(products, "invalid")).toEqual([]);
    expect(initialCoverageCategories(["LI", "DI"], ["OO"], ["LI"])).toEqual(["LI"]);
  });
  it("preserves URL restrictions across routes for only the specified Site", () => {
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/?category=DI");
    expect(activeCoverageCategoryRestriction("abe")).toBe("DI");
    window.history.replaceState(null, "", "/coverage");
    expect(activeCoverageCategoryRestriction("abe")).toBe("DI");
    expect(activeCoverageCategoryRestriction("csea")).toBeNull();
    window.history.replaceState(null, "", "/?category=all");
    activeCoverageCategoryRestriction("abe");
    window.history.replaceState(null, "", "/coverage");
    expect(activeCoverageCategoryRestriction("abe")).toBeNull();
  });
});
