import type { CoverageDefinition } from "../../domain/coverage";
import type { CoverageCategoryId } from "../coverageCategories";

/** Both entry names share one restriction. Explicit category wins, including empty input. */
export function coverageCategoryParameter(params: URLSearchParams): string | null {
  return params.get('category') ?? params.get('categories');
}

/** A URL restriction reduces the available portfolio, not just the selected chip. */
export function restrictCoverageCategories(products: CoverageDefinition[], category: string | null) {
  if (category === null || category.trim().toLowerCase() === "all") return products;
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
  const category = coverageCategoryParameter(params);
  if (category !== null) {
    // Product-scoped all-category campaigns need their explicit category marker
    // on resume; a product-only restored scope is deliberately rejected.
    if (category.trim().toLowerCase() === "all" && !params.has('prods')) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, category);
    return category;
  }
  return window.sessionStorage.getItem(key);
}
