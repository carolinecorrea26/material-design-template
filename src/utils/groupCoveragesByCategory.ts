import {
  coverageCategories,
  type CoverageCategory,
  type CoverageCategoryId,
} from "../config/coverageCategories";

interface HasCategoryId {
  categoryId: CoverageCategoryId;
}

export interface CoverageCategoryGroup<T extends HasCategoryId> {
  category: CoverageCategory;
  products: T[];
}

/**
 * Group products/coverages by category, filtering out empty groups.
 * Optionally restrict to specific category IDs.
 */
export function groupCoveragesByCategory<T extends HasCategoryId>(
  products: T[],
  allowedCategoryIds?: Set<CoverageCategoryId>,
): CoverageCategoryGroup<T>[] {
  return coverageCategories
    .filter((cat) => !allowedCategoryIds || allowedCategoryIds.has(cat.id))
    .map((category) => ({
      category,
      products: products.filter((p) => p.categoryId === category.id),
    }))
    .filter((group) => group.products.length > 0);
}
