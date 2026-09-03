import type { CoverageCategoryId } from "./coverages/types";
import type { ClientId } from "../types";

export const RATE_CALCULATION_DELAY_MS = 900;

/**
 * Determines which additional fields are required based on selected coverage categories.
 * Used by quote tools, cost estimators, and coverage pages to show/hide category-level questions.
 */
export function getCategoryRequirements(
  selectedCategories: CoverageCategoryId[],
  options?: { hideSmokerQuestion?: boolean },
) {
  const needsGender = selectedCategories.some((c) => c === "LI" || c === "DI");
  const needsSmoker =
    !options?.hideSmokerQuestion &&
    selectedCategories.some((c) => c === "LI" || c === "SH");
  const needsDi = selectedCategories.includes("DI");
  const needsOo = selectedCategories.includes("OO");
  const needsHours = needsDi || needsOo;
  const needsAdditionalFields =
    needsGender || needsSmoker || needsDi || needsOo || needsHours;

  return {
    needsGender,
    needsSmoker,
    needsDi,
    needsOo,
    needsHours,
    needsAdditionalFields,
  };
}

export type CategoryRequirements = ReturnType<typeof getCategoryRequirements>;

/**
 * Returns the appropriate benefit amount label for a coverage category.
 */
export function getBenefitAmountLabel(categoryId: CoverageCategoryId): string {
  return categoryId === "DI" || categoryId === "OO"
    ? "Monthly benefit amount"
    : "Benefit amount";
}

export const categoryMaxAggregate: Record<CoverageCategoryId, string | null> = {
  LI: "$2,000,000",
  AD: null,
  DI: null,
  OO: null,
  SH: null,
};

/**
 * Max aggregate note messages displayed in a warning alert at the end of a category section.
 * Only categories with non-null entries will display the alert. Currently only LI applies.
 */
export type MaxAggregateNote = {
  member: string;
  spouse: string;
  child?: string;
};

const defaultLifeMaxAggregateNote: MaxAggregateNote = {
  member:
    "The maximum Life Insurance amount available for a member through this Insurance Program underwritten by New York Life is $2,000,000 whether coverage is in one or divided among several group policies.",
  spouse:
    "The maximum Life Insurance amount available for a spouse through this Insurance Program underwritten by New York Life is $2,000,000 whether coverage is in one or divided among several group policies.",
};

export const categoryMaxAggregateNotes: Partial<
  Record<CoverageCategoryId, MaxAggregateNote>
> = {
  LI: defaultLifeMaxAggregateNote,
};

/**
 * Client-specific overrides for max aggregate notes.
 * Only clients that differ from default need entries here.
 */
export const clientMaxAggregateNoteOverrides: Partial<
  Record<ClientId, Partial<Record<CoverageCategoryId, MaxAggregateNote | null>>>
> = {
  avma: {
    LI: {
      member:
        "The maximum Life Insurance amount available for a member through this Insurance Program underwritten by New York Life is $2,000,000 whether coverage is in one or divided among several group policies. The Basic Protection Package is not included in this aggregate maximum.",
      spouse:
        "The maximum Life Insurance amount available for a spouse through this Insurance Program underwritten by New York Life is $1,000,000 whether coverage is in one or divided among several group policies.",
      child:
        "Child(ren) can only be covered by one parent and under one group policy.",
    },
  },
  waepa: {
    LI: {
      member: "The maximum available for a member is $2,000,000.",
      spouse: "The maximum available for a spouse is $2,000,000.",
    },
  },
};

/**
 * Returns the max aggregate notes for a given category and client.
 * Returns null if the category has no max aggregate note.
 */
export function getMaxAggregateNotes(
  categoryId: CoverageCategoryId,
  clientId: ClientId,
): MaxAggregateNote | null {
  const clientOverrides = clientMaxAggregateNoteOverrides[clientId];
  if (clientOverrides && categoryId in clientOverrides) {
    return clientOverrides[categoryId] ?? null;
  }
  return categoryMaxAggregateNotes[categoryId] ?? null;
}
