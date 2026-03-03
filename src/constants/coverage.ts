/**
 * Coverage Category Constants
 * Centralized definitions for coverage categories to avoid duplication
 */

import type { CoverageCategory } from "../types/app";

/**
 * Human-readable labels for coverage categories
 */
export const COVERAGE_CATEGORY_LABELS: Record<CoverageCategory, string> = {
  LI: "Life Insurance",
  AD: "Accidental Death & Dismemberment Insurance",
  DI: "Disability Insurance",
  OO: "Professional Overhead Expense Insurance",
  SH: "Supplemental Health Benefits Insurance",
};

/**
 * Short labels for coverage categories (used in compact displays)
 */
export const COVERAGE_CATEGORY_SHORT_LABELS: Record<CoverageCategory, string> =
  {
    LI: "Life",
    AD: "AD&D",
    DI: "Disability",
    OO: "Overhead",
    SH: "Health",
  };

/**
 * Get the label for a coverage category
 */
export function getCoverageLabel(
  category: CoverageCategory,
  short: boolean = false,
): string {
  return short
    ? COVERAGE_CATEGORY_SHORT_LABELS[category]
    : COVERAGE_CATEGORY_LABELS[category];
}
