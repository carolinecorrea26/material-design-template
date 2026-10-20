/** Source unknowns do not excuse engineering gaps. Unknown categories fail closed. */
export const reviewCategories = [
  'UNMAPPED_SEMANTIC', 'PARSER_GAP', 'MODEL_GAP', 'IDENTITY_CONFLICT',
  'SOURCE_TBD', 'SOURCE_CONFLICT', 'REQUIRES_CLIENT_CONFIRMATION',
  'REQUIRES_AM_CONFIRMATION', 'REQUIRES_UW_CONFIRMATION',
  'REQUIRES_CONTRACTS_CONFIRMATION', 'REQUIRES_COMPLIANCE_CONFIRMATION',
  'IMAGE_REVIEW_REQUIRED', 'NON_FUNCTIONAL_OR_REFERENCE', 'INTENTIONALLY_EXCLUDED', 'MAPPED',
] as const;
export type ReviewCategory = typeof reviewCategories[number];
export const blockingCategories = new Set<string>(['UNMAPPED_SEMANTIC', 'PARSER_GAP', 'MODEL_GAP', 'IDENTITY_CONFLICT']);
export function classifySourceUnknown(text: string): ReviewCategory | null {
  if (/\b(confirm|confirmation|check with|information needed|to be confirmed)\b/i.test(text)) {
    if (/\bAM\b/.test(text)) return 'REQUIRES_AM_CONFIRMATION';
    if (/\bUW\b|underwriter/i.test(text)) return 'REQUIRES_UW_CONFIRMATION';
    if (/contracts/i.test(text)) return 'REQUIRES_CONTRACTS_CONFIRMATION';
    if (/compliance/i.test(text)) return 'REQUIRES_COMPLIANCE_CONFIRMATION';
    return 'REQUIRES_CLIENT_CONFIRMATION';
  }
  if (/\b(TBD|TBC|to be determined|information needed)\b/i.test(text)) return 'SOURCE_TBD';
  return null;
}
