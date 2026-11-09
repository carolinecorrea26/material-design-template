import type { CoverageDefinition } from "../../domain/coverage";
import type { EffectiveSite } from "../../domain/effectiveSite";
import { resolveCoverageJourneyPolicy } from "../../domain/coverageJourneyPolicy";

const entryParameters = [["category", "coverage-category-scope"], ["prods", "coverage-product-scope"], ["featured_prod", "coverage-featured-product"], ["amt", "coverage-amount-defaults"], ["dprods", "coverage-amount-locks"]] as const;

/** Preserve amount campaign controls across routes and saved-application resume. */
export function captureCoverageAmountParameters(siteKey: string) {
  const params = new URLSearchParams(window.location.search);
  if (!["category", "prods", "amt", "dprods"].some(key => params.has(key))) return;
  for (const [parameter, prefix] of entryParameters.filter(([parameter]) => parameter === "amt" || parameter === "dprods")) {
    if (params.has(parameter)) window.sessionStorage.setItem(`${prefix}:${siteKey}`, params.get(parameter)!);
    else window.sessionStorage.removeItem(`${prefix}:${siteKey}`);
  }
}

/** Campaign product IDs are G-numbers, including captured Association variants. */
export function restrictCoverageProducts(products: CoverageDefinition[], prods: string | null, site?: EffectiveSite) {
  if (prods === null) return products;
  const requested = new Set(prods.split(",").map(value => value.trim().toUpperCase()).filter(value => /^G-\d+(?:-\d+)+$/.test(value)));
  return products.filter(product => {
    const identifiers: Array<string | null | undefined> = product.gNumber ? [product.gNumber.primary, ...(product.gNumber.scoped ?? []).map(row => row.value.primary)] : [];
    if (site) for (const mapping of resolveCoverageJourneyPolicy(site, product.id)?.mappings ?? []) identifiers.push(...Object.values(mapping.identifiers.gNumber));
    return identifiers.some(value => typeof value === "string" && requested.has(value.trim().toUpperCase()));
  });
}

export function activeCoverageProductRestriction(siteKey: string) {
  const key = `coverage-product-scope:${siteKey}`, params = new URLSearchParams(window.location.search);
  if (params.has("prods")) {
    // A product-only entry must not reuse another campaign's stored category.
    const value = params.has("category") && params.get("category")!.trim() ? params.get("prods")! : "";
    window.sessionStorage.setItem(key, value); return value;
  }
  // An explicit category starts a new campaign; omitted products means all
  // currently available products in that category. Plain routes retain scope.
  if (params.has("category")) { window.sessionStorage.removeItem(key); return null; }
  return window.sessionStorage.getItem(key);
}

/** Presentation-only entry context; never enables products or changes elections. */
export function activeFeaturedProduct(siteKey: string) {
  const key = `coverage-featured-product:${siteKey}`, params = new URLSearchParams(window.location.search);
  if (params.has("featured_prod")) {
    const value = params.get("featured_prod") ?? ""; window.sessionStorage.setItem(key, value); return value;
  }
  if (params.has("category") || params.has("prods")) { window.sessionStorage.removeItem(key); return null; }
  return window.sessionStorage.getItem(key);
}

export function capturedCoverageEntryScope(siteKey: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [parameter, prefix] of entryParameters) {
    const value = window.sessionStorage.getItem(`${prefix}:${siteKey}`);
    if (value !== null) result[parameter] = value;
  }
  return result;
}

export function withCapturedCoverageEntryScope<T extends Record<string, unknown>>(siteKey: string, values: T): T {
  const result: Record<string, unknown> = { ...values }, scope = capturedCoverageEntryScope(siteKey);
  if (Object.keys(scope).length) result.coverageEntryScope = scope;
  else delete result.coverageEntryScope;
  return result as T;
}

/** Restored applications retain their own campaign context, not the last link
 * opened for the same Site. Legacy saves have an unrestricted context. */
export function restoreCoverageEntryScope(siteKey: string, value: unknown) {
  const validObject = value !== null && typeof value === "object" && !Array.isArray(value);
  const scope = validObject ? value as Record<string, unknown> : value === undefined || value === null ? {} : { category: "", prods: "" };
  for (const [parameter, prefix] of entryParameters) {
    const key = `${prefix}:${siteKey}`;
    if (typeof scope[parameter] === "string") window.sessionStorage.setItem(key, scope[parameter]);
    else if (Object.hasOwn(scope, parameter)) window.sessionStorage.setItem(key, "");
    else window.sessionStorage.removeItem(key);
  }
  if (Object.hasOwn(scope, "prods") && !Object.hasOwn(scope, "category")) window.sessionStorage.setItem(`coverage-category-scope:${siteKey}`, "");
}
