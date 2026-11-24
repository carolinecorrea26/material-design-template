import type { BeneficiaryPageScenario } from './beneficiaryPageExample';
const baseValues = {
  membership: 'yes', 'birth-date': '1990-01-01', 'zip-postal-code': '22101', 'state-province': 'VA',
  dependents: [], coverageSelections: ['li-10yr', 'li-20yr'],
  productApplicants: { 'li-10yr': ['member'], 'li-20yr': ['member'] },
  coverageAmounts: { 'li-10yr:member': 100000, 'li-20yr:member': 100000 },
};
const person = (id: string, firstName: string, share: number) => ({ id, designation: 'primary', beneficiaryType: 'individual', firstName, lastName: 'Example', relationship: 'Sibling', share });
export const beneficiaryScenarios = {
  empty: { capability: 'standard', beneficiary: { requirement: 'required' }, description: 'A synthetic required-page override. Add a beneficiary to either coverage. Review required fields, Primary/Contingent, Individual/Trust and remaining share. Saving a new entry offers the real apply-to-other-coverages dialog. Next requires at least one Primary beneficiary per applicable product and 100% for each designation containing individuals; partial allocations can be saved while adding records.', values: baseValues },
  completed: { capability: 'standard', description: 'Fictional saved individuals and a contingent trust. Review Edit/Cancel, allocation changes and Remove. Each coverage keeps its own records.', values: { ...baseValues, 'beneficiary-information-opt-in': 'yes', beneficiaries: {
    'li-10yr:member': [person('alex', 'Alex', 50), person('jordan', 'Jordan', 50), { id: 'trust', designation: 'contingent', beneficiaryType: 'trust', trustName: 'Example Family Trust', trustDate: '2020-01-01', share: 0 }],
    'li-20yr:member': [person('casey', 'Casey', 100)],
  } } },
  spouse: { capability: 'standard', description: 'Member and spouse have separate Term Life beneficiary cards. Adding or editing one applicant’s records leaves the other applicant’s records independent.', values: { ...baseValues, 'beneficiary-information-opt-in': 'yes', membership: 'yes', dependents: ['spouse'], 'spouse-birth-date': '1991-01-01', coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member', 'spouse'] }, coverageAmounts: { 'li-term:member': 100000, 'li-term:spouse': 100000 } } },
  optional: { capability: 'standard', description: 'The global default page requirement is optional. Choose Yes to reveal beneficiary cards or No to continue without adding them. Answers stay local to this example.', values: { ...baseValues, coverageSelections: ['li-term'], productApplicants: { 'li-term': ['member'] }, coverageAmounts: { 'li-term:member': 100000 } } },
  noProducts: { capability: 'standard', description: 'No coverage is selected. Review the actual no-applicable-products notice.', values: { ...baseValues, 'beneficiary-information-opt-in': 'yes', coverageSelections: [], productApplicants: {}, coverageAmounts: {} } },
} satisfies Record<string, BeneficiaryPageScenario>;

