import type { CoverageDefinition } from "./coverage";
import type { ClientCoverages } from "./configuration";
import type { CoverageCategoryId } from "../config/coverageCategories";

export const defaultCategoryOrder: CoverageCategoryId[] = ["LI", "AD", "DI", "OO", "SH"];

function productRank(product: CoverageDefinition): number {
  const name = product.name.toLowerCase();
  if (product.categoryId === "LI") {
    const years = name.match(/(\d+)[ -]year/);
    if (years && /term/.test(name)) return Number(years[1]);
    if (name === "term life") return 0;
    if (/term.*life|life.*term/.test(name)) return 1;
  }
  if (product.categoryId === "DI") {
    if (/long[ -]term/.test(name)) return /plus|\+/.test(name) ? 1 : 0;
    if (/mid[ -]term|medium[ -]term/.test(name)) return 2;
    if (/short[ -]term/.test(name)) return 3;
  }
  if (product.categoryId === "SH") {
    if (/critical/.test(name)) return 0;
    if (/hospital.*indemnity/.test(name)) return 1;
    if (/hospital/.test(name)) return 2;
  }
  return 1000;
}

export function isCoverageProductOrder(value: unknown, knownProducts?: readonly string[]): value is string[] {
  return Array.isArray(value) && value.every(key => typeof key === "string" && key.trim() === key && key.length > 0 && (!knownProducts || knownProducts.includes(key))) && new Set(value).size === value.length;
}

/** URL feature selection explicitly overrides category and product presentation order. */
export function orderCoveragePresentation<T extends CoverageDefinition>(products: readonly T[], config: ClientCoverages, featuredParam: string | null = null) {
  if (config.productOrder !== undefined && !isCoverageProductOrder(config.productOrder)) throw new Error("Invalid configured product order");
  const configuredProducts = new Map((config.productOrder ?? []).map((key, index) => [key, index]));
  const configuredRank = (product: CoverageDefinition) => configuredProducts.get(product.id) ?? Number.MAX_SAFE_INTEGER;
  const identifiers = new Set((featuredParam ?? "").split(",").map(value => value.trim()).filter(Boolean));
  const featured = (product: CoverageDefinition) => identifiers.has(product.id) || !!product.gNumber && [product.gNumber.primary, ...(product.gNumber.scoped ?? []).map(row => row.value.primary)].some(id => !!id && identifiers.has(id));
  const configured = config.categoryOrder ?? config.categories ?? [];
  const categories = [...new Set([...configured, ...defaultCategoryOrder])];
  const featuredCategories = new Set(products.filter(featured).map(product => product.categoryId));
  categories.sort((a, b) => Number(featuredCategories.has(b)) - Number(featuredCategories.has(a)));
  const ordered = products.map(product => ({ ...product, featured: featured(product) })).sort((a, b) => categories.indexOf(a.categoryId) - categories.indexOf(b.categoryId) || Number(b.featured) - Number(a.featured) || configuredRank(a) - configuredRank(b) || productRank(a) - productRank(b));
  return { categories, products: ordered };
}
