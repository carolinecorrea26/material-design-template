/** Adoption status is independent of extraction/parser review findings. */
export const promotionStates = ['SOURCE_ONLY', 'PATTERN_CANDIDATE', 'CANONICAL_LIBRARY', 'SITE_CONFIGURATION', 'UNRESOLVED'] as const;
export type PromotionState = typeof promotionStates[number];
