import { coverageRequirementValue } from '../../domain/requirementCoveragePolicy';
import { getDefaultValueForField } from './generateFormData';
import dayjs from 'dayjs';
import type { PrototypeLibrary } from '../../domain/prototypeLibrary';
import type { CoverageJourneyInput } from '../../domain/coverageJourney';
import type { ApplicationFormValues } from '../../app/ApplicationFormContext';

export function journeyFormValues(library: PrototypeLibrary, inputs: CoverageJourneyInput[]): ApplicationFormValues {
  const values: ApplicationFormValues = { 'birth-date': '1990-01-01', 'has-other-life-insurance': 'no', dependents: [...new Set(inputs.map(i => i.applicantKey).filter(a => a !== 'member'))],
    coverageSelections: [...new Set(inputs.map(i => i.productKey))], productApplicants: {}, coverageAmounts: {}, coverageWaitingPeriods: {}, coverageMaxBenefitPeriods: {} };
  const applicants: Record<string, string[]> = {}, amounts: Record<string, number> = {}, waiting: Record<string, string | undefined> = {}, periods: Record<string, string | undefined> = {};
  Object.assign(values, ...inputs.map(input => Object.fromEntries(Object.entries(input.answers ?? {}).filter(([key]) => key.startsWith('health-')))));
  for (const input of inputs) {
    const prefix = input.applicantKey === 'member' ? '' : `${input.applicantKey}-`;
    Object.assign(values, { [`${prefix}birth-date`]: dayjs().subtract(input.eligibility.ageYears!, 'year').format('YYYY-MM-DD'),
      'state-province': input.jurisdiction?.replace(/^US-/, ''), [`${prefix}has-other-life-insurance`]: 'no', [`${prefix}gender`]: 'male', [`${prefix}smoker`]: 'no',
      [`${prefix}hours-worked-per-week`]: input.eligibility.workHoursPerWeek, [`${prefix}average-monthly-income`]: input.eligibility.averageMonthlyIncome,
      [`${prefix}actively-at-work`]: 'yes', [`${prefix}active-military`]: 'no', [`${prefix}full-time-student`]: 'yes',
      [`${prefix}membership`]: input.applicantKey === 'member' ? input.eligibility.associationKey ?? input.eligibility.membershipType ?? 'yes' : input.eligibility.associationMember ? 'yes' : 'no', [`${prefix}self-employed-under-one-year`]: 'no',
      [`${prefix}is-self-employed`]: 'no', [`${prefix}years-self-employed`]: 10, [`${prefix}firm-member-count`]: input.eligibility.firmMemberCount,
      [`${prefix}monthly-business-expenses`]: input.benefit?.eligibleMonthlyExpenses, [`${prefix}business-expense-responsibility`]: 100,
    });
    const operands = { existingMonthlyBenefit: 0, monthlyLoanPayment: input.benefit?.monthlyLoanPayment, retirement: 'no', applicantClass: input.applicantClass, eligibleExpenseFraction: 1, activeMilitary: false };
    for (const [name, operand] of Object.entries(operands)) {
      const mapping = library.client.applicantExperience?.factMappings?.[name];
      if (mapping && operand !== undefined) values[mapping.field] = Object.entries(mapping.values).find(([, value]) => (value === operand || typeof operand === 'boolean' && value === (operand ? 'yes' : 'no')))?.[0] ?? '';
      else if (operand !== undefined) values[`prototype-fact:${input.productKey}:${input.applicantKey}:${name}`] = operand;
    }
    if (input.eligibility.associationKey) values.association = input.eligibility.associationKey;
    (applicants[input.productKey] ??= []).push(input.applicantKey);
    const scope = `${input.productKey}:${input.applicantKey}`;
    amounts[scope] = input.amount; waiting[scope] = input.waitingPeriod; periods[scope] = input.benefitPeriod;
  }
  for (const [name, source] of Object.entries(library.client.applicantExperience?.factSources ?? {})) if (name.endsWith(':existingMonthlyBenefit') && 'field' in source) values[source.field] = 0;
  for (const product of library.products) {
    const people = applicants[product.id] ?? [];
    const minimum = coverageRequirementValue(product, 'spouse', 'coverage-member-benefit-submit-minimum');
    if (people.includes('member') && people.includes('spouse') && typeof minimum === 'number') amounts[`${product.id}:member`] = Math.max(amounts[`${product.id}:member`], minimum);
  }
  values['coverage-categories'] = [...new Set(inputs.map(input => library.products.find(product => product.id === input.productKey)!.categoryId))];
  Object.assign(values, { productApplicants: applicants, coverageAmounts: amounts, coverageWaitingPeriods: waiting, coverageMaxBenefitPeriods: periods });
  if (inputs.some(i => i.applicantKey === 'child')) values.children = [{ ...Object.fromEntries((library.fieldCollections.children?.mapping.fields ?? []).map(field => [library.fieldCollections.children.mapping.fieldToKey[field.id], getDefaultValueForField(field)])), id: 'child-1', 'child-birth-date': values['child-birth-date'], 'child-full-time-student': 'yes', 'child-gender': 'male' }];
  return values;
}

