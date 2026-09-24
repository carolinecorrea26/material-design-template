import type { CoverageCategoryId } from "./coverages/types";
import type { SiteId } from "../data";
export {
  getCategoryRequirements,
  type CategoryRequirements,
} from "./coverageQuestionRequirements";

export const RATE_CALCULATION_DELAY_MS = 900;

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
 * Site-specific overrides for max aggregate notes.
 * Only Sites that differ from the default need entries here.
 */
export const siteMaxAggregateNoteOverrides: Partial<
  Record<SiteId, Partial<Record<CoverageCategoryId, MaxAggregateNote | null>>>
> = {
  "avma-default": {
    LI: {
      member:
        "The maximum Life Insurance amount available for a member through this Insurance Program underwritten by New York Life is $2,000,000 whether coverage is in one or divided among several group policies. The Basic Protection Package is not included in this aggregate maximum.",
      spouse:
        "The maximum Life Insurance amount available for a spouse through this Insurance Program underwritten by New York Life is $1,000,000 whether coverage is in one or divided among several group policies.",
      child:
        "Child(ren) can only be covered by one parent and under one group policy.",
    },
  },
  "waepa-standard": {
    LI: {
      member: "The maximum available for a member is $2,000,000.",
      spouse: "The maximum available for a spouse is $2,000,000.",
    },
  },
};

/**
 * Returns the max aggregate notes for a given category and Site.
 * Returns null if the category has no max aggregate note.
 */
export function getMaxAggregateNotes(
  categoryId: CoverageCategoryId,
  siteId: SiteId,
): MaxAggregateNote | null {
  const siteOverrides = siteMaxAggregateNoteOverrides[siteId];
  if (siteOverrides && categoryId in siteOverrides) {
    return siteOverrides[categoryId] ?? null;
  }
  return categoryMaxAggregateNotes[categoryId] ?? null;
}
