import type { ApplicationPageScenario } from './applicationPageExample';

/** Fictional selections that exercise each real Health route's participation rules. */
export function healthPageScenario(page: 'si' | 'qd' | 'li' | 'di' | 'ci' | 'cir', spouse = false): ApplicationPageScenario {
  const product = page === 'si' ? 'li-group-term' : page === 'di' ? 'di-ltd' : page === 'ci' ? 'sh-critical-illness' : 'li-term';
  const applicants = spouse ? ['member', 'spouse'] : ['member'];
  const amount = page === 'di' ? 8000 : page === 'ci' ? 5000 : page === 'li' ? 700000 : 100000;
  return {
    capability: page === 'si' ? 'associationSelection' : page === 'qd' || page === 'di' ? 'multipleTerms' : page === 'li' ? 'standard' : 'optionalBeneficiaries',
    description: page === 'qd'
      ? 'Loading the external QuickDecision health questions. This preview stays on the loader because the external questions were not supplied.'
      : `${spouse ? 'Member and spouse answer independently under each question.' : 'Member-only questionnaire.'} Answer Yes to inspect applicable follow-ups; Next runs the page’s required-answer and detail validation. Answers stay local to this example.${page === 'cir' ? ' Preview configuration explicitly enables the existing rider page; saved Site settings are unchanged.' : ''}`,
    values: {
      membership: page === 'si' ? 'association-of-texas-professional-educators' : 'yes',
      'birth-date': '1986-01-01', 'spouse-birth-date': '1986-01-01',
      'first-name': 'Jordan', 'last-name': 'Morgan', 'spouse-first-name': 'Taylor', 'spouse-last-name': 'Morgan',
      state: 'PA', 'state-province': 'PA', 'zip-postal-code': '19103',
      'has-other-life-insurance': 'no', 'spouse-has-other-life-insurance': 'no',
      dependents: spouse ? ['spouse'] : [], coverageSelections: [product],
      productApplicants: { [product]: applicants },
      coverageAmounts: Object.fromEntries(applicants.map(applicant => [`${product}:${applicant}`, page === 'di' && applicant === 'spouse' ? 1000 : amount])),
      ...(page === 'cir' ? { coverageRiders: Object.fromEntries(applicants.map(applicant => [`${product}:cir:${applicant}`, true])) } : {}),
    },
    ...(page === 'cir' ? { configureFixture: fixture => {
      // Positive control for a supported questionnaire that is disabled in this source.
      fixture.site.configuration.pages.find(row => row.key === 'health-cir')!.requirement = 'required';
      fixture.pageData.sitePages.filter(row => row.pageKey === 'health-cir').forEach(row => { row.requirement = 'required'; });
    } } : {}),
  };
}
