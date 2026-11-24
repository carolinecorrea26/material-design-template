import type { ApplicationPageScenario } from './applicationPageExample';

/** Fictional selections that exercise each real Health route's participation rules. */
export function healthPageScenario(page: 'si' | 'qd' | 'li' | 'di' | 'ci' | 'cir', spouse = false): ApplicationPageScenario {
  const product: 'di-ltd' | 'li-term' = page === 'di' ? 'di-ltd' : 'li-term';
  const applicants = spouse ? ['member', 'spouse'] : ['member'];
  const amount = page === 'di' ? 8000 : page === 'li' ? 700000 : 100000;
  return {
    capability: page === 'si' ? 'associationSelection' : page === 'qd' || page === 'di' ? 'multipleTerms' : page === 'li' ? 'standard' : 'optionalBeneficiaries',
    description: page === 'qd'
      ? 'Click through the supplied external QuickDecision question images, then continue through the configured application flow.'
      : `${spouse ? 'Member and spouse answer independently under each question.' : 'Member-only questionnaire.'} Answer Yes to inspect applicable follow-ups; Next runs the page’s required-answer and detail validation. This detached configuration enables the global capability with fictional answers; saved Site settings are unchanged.`,
    values: {
      membership: 'yes',
      'birth-date': '1986-01-01', 'spouse-birth-date': '1986-01-01',
      'first-name': 'Jordan', 'last-name': 'Morgan', 'spouse-first-name': 'Taylor', 'spouse-last-name': 'Morgan',
      state: 'PA', 'state-province': 'PA', 'zip-postal-code': '19103',
      'has-other-life-insurance': 'no', 'spouse-has-other-life-insurance': 'no',
      dependents: spouse ? ['spouse'] : [], coverageSelections: [product],
      productApplicants: { [product]: applicants },
      coverageAmounts: Object.fromEntries(applicants.map(applicant => [`${product}:${applicant}`, page === 'di' && applicant === 'spouse' ? 1000 : amount])),
      ...(page === 'cir' ? { coverageRiders: Object.fromEntries(applicants.map(applicant => [`${product}:cir:${applicant}`, true])) } : {}),
    },
    ...(page === 'qd' ? { siteKey: 'asce' } : { health: {
      page: page === 'li' || page === 'ci' ? 'health-tele' : page === 'di' ? 'health-di-supp' : page === 'si' ? 'health-si' : 'health-cir', product,
      ...(page === 'ci' || page === 'cir' ? { questionnaire: page } : {}),
    } }),
  };
}
