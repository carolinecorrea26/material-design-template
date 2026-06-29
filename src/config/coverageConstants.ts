import type { CoverageCategoryId } from "./coverages/types";

export const RATE_CALCULATION_DELAY_MS = 900;

export const categoryMaxAggregate: Record<CoverageCategoryId, string | null> = {
  LI: "$2,000,000",
  AD: "$2,000,000",
  DI: "$12,000",
  OO: null,
  SH: null,
};

export const categoryFootnotes: Partial<Record<CoverageCategoryId, string>> = {
  LI: "The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  AD: "The maximum available through New York Life Insurance Company for any individual is $2,000,000, whether coverage is in one or divided among several group policies.",
  DI: "The maximum available through all ABE group insurance underwritten by New York Life Insurance Company is $12,000 for a member whether coverage is in one or divided among several group policies.",
};
