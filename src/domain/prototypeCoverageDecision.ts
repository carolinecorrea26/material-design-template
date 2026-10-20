import dayjs from "dayjs";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { resolveScheduledChildren } from "./coverageJourney";
import { isSelectionPolicy } from "./coverageSelectionPolicy";
import { prototypeApplicantOperand } from './prototypeApplicantOperands';
import { getPrototypeLibrary } from './prototypeLibrary';
import type { CoverageApplicantId } from './coverage';
import { resolveNormalizedResidency } from './residencyPolicy';
import { resolveNormalizedBenefit, isBenefitPolicy } from './benefitPolicy';
import { resolveDependentCoverage } from './dependentPolicy';
import { applicationApplicantFacts, numericFact } from '../utils/applicantFacts';
import { resolveNormalizedAmountCap } from './amountCapPolicy';

export function prototypeCoverageDecision(productKey: string, applicant: CoverageApplicantId, values: Record<string, unknown>, choices: number[]) {
  const library = getPrototypeLibrary();
  if (!library) return null;
  const product = library.site.configuration.products.find(p => p.productKey === productKey);
  if (!product) return { amounts: [], messages: ['Product is unavailable in this Library revision.'], waitingPeriods: undefined, benefitPeriods: undefined };
  const journey = resolveCoverageJourneyPolicy(library.site, productKey);
  if (journey?.associationChoices.length) {
    const association = values.association ?? values.membership;
    if (!journey.associationChoices.some(choice => choice.key === association)) return {
      amounts: [], messages: [association ? "This product is not available for the selected Association." : "Select an Association on Membership before continuing."], waitingPeriods: undefined, benefitPeriods: undefined,
    };
  }
  const facts = applicationApplicantFacts(values, applicant);
  const amounts = values.coverageAmounts as Record<string, number> ?? {};
  const selections = values.productApplicants as Record<string, CoverageApplicantId[]> ?? {};
  const selectedProducts = Array.isArray(values.coverageSelections) ? values.coverageSelections.map(String) : [];
  const selectedAmount = (key: string, role: CoverageApplicantId) => selectedProducts.includes(key) && selections[key]?.includes(role) ? numericFact(amounts[`${key}:${role}`]) ?? 0 : 0;
  const scopedPeriod = (name: string) => (values[name] as Record<string, string> | undefined)?.[`${productKey}:${applicant}`] ?? (values[name] as Record<string, string> | undefined)?.[productKey];
  const selectedApplicants = (selections[productKey] ?? []).filter(a => selectedProducts.includes(productKey) && amounts[`${productKey}:${a}`] > 0);
  const prefix = applicant === 'member' ? '' : `${applicant}-`;
  const operand = (name: string) => prototypeApplicantOperand(library, productKey, applicant, values, name);
  const messages: string[] = [];
  const jurisdiction = String(values['state-province'] ?? values.state ?? '');
  const residency = resolveNormalizedResidency(library.site, productKey, applicant, { jurisdiction: jurisdiction ? jurisdiction.includes('-') ? jurisdiction : `US-${jurisdiction}` : undefined, activeMilitary: (values['active-military'] ?? values[`prototype-fact:${productKey}:member:activeMilitary`]) === 'yes' ? true : (values['active-military'] ?? values[`prototype-fact:${productKey}:member:activeMilitary`]) === 'no' ? false : undefined });
  if (!residency.allowed) messages.push(residency.reason);
  const amountCap = resolveNormalizedAmountCap(library.site, productKey, applicant, facts.ageYears);
  if (amountCap.status !== 'resolved') return { amounts: [], messages: [...messages, amountCap.reason ?? 'Coverage amount cap is unresolved.'], waitingPeriods: undefined, benefitPeriods: undefined };
  const capped = (values: number[]) => values.filter(amount => amountCap.maximum === undefined || amount <= amountCap.maximum);
  choices = capped(choices);
  const selectionPolicy = product.selectionPolicies[0]?.value;
  if (applicant === 'child' && isSelectionPolicy(selectionPolicy) && selectionPolicy.childSchedule) {
    const children = Array.isArray(values.children) && values.children.length ? values.children as Array<Record<string, unknown>> : [{ birthDate: values['child-birth-date'] }];
    const scheduled = resolveScheduledChildren(library.site, productKey, children.map((child, index) => ({ key: String(child.id ?? index), birthDate: typeof child.birthDate === 'string' ? child.birthDate : '' })), dayjs().format('YYYY-MM-DD'), { member: selectedAmount(productKey, 'member'), spouse: selectedAmount(productKey, 'spouse') });
    const amounts = [...new Set(scheduled.children.flatMap(child => child.allowed && child.amount !== null ? [child.amount] : []))];
    if (!scheduled.allowed) messages.push(...scheduled.children.filter(child => !child.allowed).map(child => child.reason || 'Child benefit is unavailable.'));
    if (amounts.length > 1) messages.push('Each child needs a separate scheduled benefit amount; this shared child election cannot represent these different benefits.');
    return { amounts: scheduled.allowed && amounts.length === 1 ? capped(amounts) : [], messages, waitingPeriods: undefined, benefitPeriods: undefined };
  }
  const policy = product.benefitPolicies[0]?.value;
  if (product.benefitPolicies.length) {
    const benefit = resolveNormalizedBenefit(library.site, productKey, applicant, {
      waitingPeriod: scopedPeriod('coverageWaitingPeriods'), ageYears: facts.ageYears, monthlyIncome: facts.averageMonthlyIncome, selfEmployed: facts.selfEmployed, selfEmployedYears: facts.yearsSelfEmployed,
      applicantClass: typeof operand('applicantClass') === 'string' ? String(operand('applicantClass')) : undefined,
      existingMonthlyBenefit: numericFact(operand('existingMonthlyBenefit')), retirement: operand('retirement') === 'yes' ? true : operand('retirement') === 'no' ? false : undefined,
      monthlyLoanPayment: numericFact(operand('monthlyLoanPayment')), eligibleMonthlyExpenses: numericFact(values[`${prefix}monthly-business-expenses`]), eligibleExpenseFraction: numericFact(operand('eligibleExpenseFraction')),
      selectedProducts, memberCoverage: selectedApplicants.includes('member'), memberRequestedBenefit: selectedAmount(productKey, 'member'), memberTotalMonthlyBenefit: (isBenefitPolicy(policy) ? policy.aggregate?.productKeys ?? [productKey] : [productKey]).reduce((sum, key) => sum + selectedAmount(key, 'member'), 0),
      otherMonthlyBenefits: isBenefitPolicy(policy) ? Object.fromEntries((policy.aggregate?.productKeys ?? []).filter(key => key !== productKey).map(key => [key, selectedAmount(key, applicant) + (numericFact(values[`prototype-fact:${key}:${applicant}:existingMonthlyBenefit`]) ?? 0)])) : undefined,
    });
    if (!benefit.allowed) messages.push(...benefit.errors, ...benefit.missingFacts.map(key => `Complete ${key} to determine available benefits.`));
    const benefitChoices: number[] = [];
    if (benefit.allowed && benefit.minimum !== undefined && benefit.maximum !== undefined && benefit.increment) for (let amount = benefit.minimum; amount <= benefit.maximum; amount += benefit.increment) benefitChoices.push(amount);
    return { amounts: capped(benefitChoices.filter(amount => !benefit.amountChoices || benefit.amountChoices.includes(amount))), messages, waitingPeriods: benefit.waitingPeriods, benefitPeriods: benefit.benefitPeriods };
  }
  if (applicant !== 'member' && product.dependentPolicies.length) {
    const dependent = resolveDependentCoverage(library.site, productKey, applicant, { amount: choices[0], selectedApplicants, coveredApplicants: selectedApplicants, baseAmounts: Object.fromEntries(['member', 'spouse'].map(a => [a, selectedAmount(productKey, a as CoverageApplicantId)])), selectedProductKeys: selectedProducts.filter(key => selections[key]?.includes(applicant)) });
    messages.push(...dependent.errors.filter(error => error !== 'Derived amount must recalculate from primary coverage'), ...dependent.missingFacts.filter(key => key !== 'amount').map(key => `Complete ${key} to determine dependent benefits.`));
    choices = dependent.derivedAmount !== null ? [dependent.derivedAmount] : choices.filter(amount => dependent.maximum === null || amount <= dependent.maximum);
  }
  return { amounts: capped(choices), messages, waitingPeriods: undefined, benefitPeriods: undefined };
}
