import type { DatabaseSchema } from '../persistence/types';
import type { RuleDefinition } from './rules';

// Reviewed catalog organization. Sequence describes dependencies; it is not a new rule engine.
const areas: Record<string, { category: string; phase: number; documentedIn?: RuleDefinition['documentedIn'] }> = {
  'Form Template': { category: 'Application layout', phase: 1, documentedIn: 'configurations' },
  Membership: { category: 'Applicant eligibility', phase: 2, documentedIn: 'fields' },
  Eligibility: { category: 'Applicant eligibility', phase: 2 },
  Coverage: { category: 'Coverage selection', phase: 3 },
  'Home / Quote tool': { category: 'Coverage selection', phase: 3 },
  'Applicant display': { category: 'Applicant eligibility', phase: 4 },
  Health: { category: 'Underwriting', phase: 4 },
  Beneficiary: { category: 'Beneficiaries', phase: 4 },
  Profile: { category: 'Applicant eligibility', phase: 4 },
  Payment: { category: 'Payment', phase: 4 },
  Contact: { category: 'Data carry-forward', phase: 4 },
  Rates: { category: 'Rates', phase: 4 },
  'Read & Sign': { category: 'Disclosures', phase: 4 },
  Validation: { category: 'Validation', phase: 5, documentedIn: 'validation' },
  Review: { category: 'Review', phase: 6 },
  'Application flow': { category: 'Navigation', phase: 6 },
  'Progress/navigation': { category: 'Navigation', phase: 6 },
  'Advisor flow': { category: 'Advisor handoff', phase: 6 },
  Persistence: { category: 'Save and resume', phase: 7 },
  Fields: { category: 'Field behavior', phase: 4, documentedIn: 'fields' },
  DynamicList: { category: 'Component behavior', phase: 4, documentedIn: 'components' },
  Drawers: { category: 'Component behavior', phase: 8, documentedIn: 'components' },
  'Coverage cart': { category: 'Coverage selection', phase: 8 },
  Feedback: { category: 'Feedback', phase: 8 },
  'Landing Page': { category: 'Navigation', phase: 8 },
  Header: { category: 'Navigation', phase: 8 },
  'Application menu': { category: 'Navigation', phase: 8 },
};
const planned = new Set([
  'rule-application-flow-health-waepawl-routing',
  'rule-application-flow-health-ci-routing',
  'rule-application-flow-health-qd-cir-routing',
  'rule-application-flow-health-di-supp-routing',
]);
const documentedInOverrides: Record<string, RuleDefinition['documentedIn']> = {
  'rule-eligibility-child-records-via-dynamiclist': 'fields',
  'rule-eligibility-spouse-dependent-requires-spouse-details': 'validation',
  'rule-eligibility-child-section-displays-unmarried-children-notice': 'configurations',
  'rule-eligibility-zip-can-derive-state-province': 'fields',
  'rule-eligibility-membership-conditional-dependent-options': 'fields',
  'rule-eligibility-spouse-selection-displays-spouse-information': 'fields',
  'rule-profile-repeatable-insurance-company-records': 'fields',
  'rule-profile-conditional-follow-up-fields': 'fields',
  'rule-profile-outside-u-s-follow-up': 'fields',
  'rule-health-yes-no-with-inline-dynamiclist': 'fields',
  'rule-beneficiary-add-edit-remove-modal': 'components',
};
const sequenceOverrides: Record<string, number> = {
  'rule-application-flow-client-page-mode-none': 1002,
  'rule-application-flow-beneficiary-routing': 4003,
  'rule-application-flow-health-si-routing': 4004,
  'rule-application-flow-health-tele-supp-routing': 4006,
  'rule-application-flow-health-qd-routing': 4009,
};
const dependencies: Record<string, RuleDefinition['id'][]> = {
  'rule-application-flow-resolved-next-back-navigation': ['rule-application-flow-client-page-mode-none', 'rule-validation-page-advance'],
  'rule-progress-navigation-skipped-stages-removed': ['rule-application-flow-client-page-mode-none'],
  'rule-applicant-display-dependent-section-shown-only-when-applying': ['rule-coverage-per-applicant-product-selection'],
  'rule-applicant-display-eligibility-selection-alone-is-not-enough-after-coverage': ['rule-coverage-per-applicant-product-selection'],
};
export function reviewedRule(rule: RuleDefinition, ordinal: number): RuleDefinition {
  const review = areas[rule.area];
  return { ...rule, documentationStatus: planned.has(rule.id) ? "planned" : "current", categories: rule.categories ?? [review?.category ?? 'Needs classification'], sequence: rule.sequence ?? sequenceOverrides[rule.id] ?? (review?.phase ?? 9) * 1000 + ordinal, dependsOn: rule.dependsOn ?? dependencies[rule.id] ?? [], documentedIn: rule.documentedIn ?? documentedInOverrides[rule.id] ?? review?.documentedIn ?? 'rules' };
}
export function reviewStoredRules(data: DatabaseSchema) {
  data.rules = data.rules.map((row, ordinal) => ({ ...row, definition: reviewedRule(row.definition, ordinal) }));
}
