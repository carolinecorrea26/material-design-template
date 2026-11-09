import type { CoverageDefinition } from "./coverage";
import type { ClientCoverages } from "./configuration";
import type { CoverageCategoryId } from "../config/coverageCategories";
import presentationConfiguration from "../../requirements/global/configurations/product-presentation.json";
import amountConfiguration from "../../requirements/global/configurations/coverage-amount-controls.json";
import type { CoverageApplicantId } from "./coverage";

export const defaultCategoryOrder = presentationConfiguration.configurations.find(row => row.id === "category-order")!.default as CoverageCategoryId[];
const defaultProductOrder = presentationConfiguration.configurations.find(row => row.id === "product-order")!.default;

/** Presentation controls operate only on already policy-filtered amounts. */
export function getCoverageAmountControl(product: CoverageDefinition, applicant: CoverageApplicantId, available: number[], config: ClientCoverages, entry: unknown) {
  const setting = (id: string, property: keyof NonNullable<ClientCoverages["amountSelection"]>) =>
    product.requirementPolicy?.find(row => row.configuration === id && row.applicants.includes(applicant))?.value
      ?? config.amountSelection?.[property] ?? amountConfiguration.configurations.find(row => row.id === id)!.default;
  const descending = setting("coverage-amount-order", "order") === "maximum-to-minimum";
  const choices = [...new Set(available)].sort((a, b) => descending ? b - a : a - b);
  const positive = choices.filter(amount => amount > 0);
  const scope = entry !== null && typeof entry === "object" && !Array.isArray(entry) ? entry as Record<string, unknown> : {};
  const identifiers = new Set([product.gNumber?.primary, ...(product.gNumber?.scoped ?? []).map(row => row.value.primary)].filter((value): value is string => !!value).map(value => value.toUpperCase()));
  const pairs = typeof scope.amt === "string" ? scope.amt.split(",").map(pair => pair.trim().split("_")).filter(([id]) => identifiers.has(id.toUpperCase())) : [];
  const raw = pairs.length === 1 && pairs[0].length === 2 && /^\d+$/.test(pairs[0][1]) ? Number(pairs[0][1]) : undefined;
  const validUrl = raw !== undefined && Number.isSafeInteger(raw) && positive.includes(raw);
  const specified = setting("coverage-amount-default-mode", "defaultMode") === "specified";
  const configured = setting("coverage-amount-default-value", "defaultValue");
  const validConfigured = specified && typeof configured === "number" && positive.includes(configured);
  const defaultAmount = validUrl ? raw : validConfigured ? configured as number : positive.length ? Math.min(...positive) : undefined;
  const urlLock = typeof scope.dprods === "string" && scope.dprods.split(",").some(id => identifiers.has(id.trim().toUpperCase())) && (!pairs.length || validUrl);
  const configuredLock = setting("coverage-amount-locked", "locked") === true && (!specified || validConfigured);
  return { choices, defaultAmount, locked: defaultAmount !== undefined && (urlLock || configuredLock) };
}

export function isCoverageProductOrder(value: unknown, knownProducts?: readonly string[]): value is string[] {
  return Array.isArray(value) && value.every(key => typeof key === "string" && key.trim() === key && key.length > 0 && (!knownProducts || knownProducts.includes(key))) && new Set(value).size === value.length;
}

/** URL feature selection explicitly overrides category and product presentation order. */
export function orderCoveragePresentation<T extends CoverageDefinition>(products: readonly T[], config: ClientCoverages, featuredParam: string | null = null) {
  if (config.productOrder !== undefined && !isCoverageProductOrder(config.productOrder)) throw new Error("Invalid configured product order");
  const configuredProducts = new Map((config.productOrder ?? []).map((key, index) => [key, index]));
  const defaultProducts = new Map(defaultProductOrder.map((key, index) => [key, index]));
  const configuredRank = (product: CoverageDefinition) => configuredProducts.get(product.id) ?? Number.MAX_SAFE_INTEGER;
  const defaultRank = (product: CoverageDefinition) => defaultProducts.get(product.id) ?? Number.MAX_SAFE_INTEGER;
  const identifiers = new Set((featuredParam ?? "").split(",").map(value => value.trim()).filter(Boolean));
  const featured = (product: CoverageDefinition) => identifiers.has(product.id) || !!product.gNumber && [product.gNumber.primary, ...(product.gNumber.scoped ?? []).map(row => row.value.primary)].some(id => !!id && identifiers.has(id));
  const configured = config.categoryOrder ?? config.categories ?? [];
  const categories = [...new Set([...configured, ...defaultCategoryOrder])];
  const featuredCategories = new Set(products.filter(featured).map(product => product.categoryId));
  categories.sort((a, b) => Number(featuredCategories.has(b)) - Number(featuredCategories.has(a)));
  const ordered = products.map(product => ({ ...product, featured: featured(product) })).sort((a, b) => categories.indexOf(a.categoryId) - categories.indexOf(b.categoryId) || Number(b.featured) - Number(a.featured) || configuredRank(a) - configuredRank(b) || defaultRank(a) - defaultRank(b));
  return { categories, products: ordered };
}
