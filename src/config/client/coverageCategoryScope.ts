import type { CoverageDefinition } from "../../domain/coverage";
import type { CoverageCategoryId } from "../coverageCategories";

/** A URL restriction reduces the available portfolio, not just the selected chip. */
export function restrictCoverageCategories(products: CoverageDefinition[], category: string | null) {
  if (category === null || category.toLowerCase() === "all") return products;
  const ids = category.split(",").map(id => id.trim().toUpperCase());
  return products.filter(product => ids.includes(product.categoryId));
}

export function initialCoverageCategories(available: readonly CoverageCategoryId[], stored: readonly CoverageCategoryId[] = [], existing: readonly CoverageCategoryId[] = []): CoverageCategoryId[] {
  if (available.length === 1) return [available[0]];
  const retained = stored.filter(id => available.includes(id));
  return [...new Set(retained.length ? retained : existing.filter(id => available.includes(id)))];
}

/** Preserve the restriction across application routes, scoped to the active Site. */
export function activeCoverageCategoryRestriction(siteKey: string) {
  const key = `coverage-category-scope:${siteKey}`;
  const params = new URLSearchParams(window.location.search);
  if (params.has("category")) {
    const category = params.get("category")!;
    if (category.toLowerCase() === "all") window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, category);
    return category;
  }
  return window.sessionStorage.getItem(key);
}
