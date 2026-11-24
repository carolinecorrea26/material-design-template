import dayjs from 'dayjs';
import { afterEach, expect, it } from 'vitest';
import { journeyLibrary, journeySiteKeys, journeyFormValues } from '../migration/freshStartJourneyFixtures';
import { createCoverageJourneyFixture } from '../migration/coverageJourneyExceptionAcceptance';
import { installPrototypeLibrary } from './prototypeLibrary';
import { resolveApplicationCoverage, applicationUnderwriting } from './coverageRuntime';
import { resolveCoverageJourneyPolicy } from './coverageJourneyPolicy';
import { resolveJourneyUnderwriting, resolveQuestionParticipation } from './coverageJourney';
import { applicationUnderwritingContext } from './quickDecisionPolicy';
import { getClientPageFields } from '../config/clientFields/getClientPageFields';
import { resolveCoverageQuestionSections } from '../config/resolvers/resolveCoverageQuestionSections';
import { getPageSections } from '../config/pageSections/getPageSections';

afterEach(() => { installPrototypeLibrary(null); sessionStorage.clear(); });

// These are configuration/adapter parity checks, not repeated global validation
// scenarios. Each enrolled product/applicant/class must project the same contract.
it.each(journeySiteKeys)('%s preserves effective applicant, amount and underwriting choices in the browser adapter', key => {
  const library = journeyLibrary(key); installPrototypeLibrary(library);
  for (const product of library.products) {
    const policy = resolveCoverageJourneyPolicy(library.site, product.id)!;
    const cases = new Map(policy.mappings.filter(m => m.when.mode === 'new').map(m => [`${m.when.applicantKey}/${m.when.applicantClass ?? ''}`, m.when]));
    for (const dimensions of cases.values()) {
      const { input } = createCoverageJourneyFixture(library.site, product.id, dimensions);
      const primary = dimensions.applicantKey !== 'member' ? createCoverageJourneyFixture(library.site, product.id, policy.mappings.find(m => m.when.mode === 'new' && m.when.applicantKey === 'member')!.when).input : undefined;
      const values = journeyFormValues(library, [...(primary ? [primary] : []), input]);
      const applicant = dimensions.applicantKey as 'member' | 'spouse' | 'child';
      const context = `${key}/${product.id}/${applicant}/${dimensions.applicantClass ?? ''}`;
      const result = resolveApplicationCoverage(product, applicant, values, library.products);
      expect(result.selectable, `${context}: ${result.messages.join('; ')}`).toBe(true);
      expect(result.amounts, context).toContain(input.amount);
      const expected = resolveJourneyUnderwriting(library.site, product.id, applicant, input.eligibility.ageYears, input.amount, dimensions.applicantClass, dimensions.associationKey, applicationUnderwritingContext(library.site, product.id, applicant, values));
      expect(applicationUnderwriting(product, applicant, values).underwritingType, context).toBe(expected.pathway);
    }
  }
});

it('collects OO financial participation through the global Coverage question section', () => {
  const library = journeyLibrary('ama'); installPrototypeLibrary(library);
  const product = library.products.find(p => p.categoryId === 'OO')!;
  const mapping = resolveCoverageJourneyPolicy(library.site, product.id)!.mappings.find(m => m.when.mode === 'new')!;
  const { input } = createCoverageJourneyFixture(library.site, product.id, mapping.when);
  const values = journeyFormValues(library, [input]);
  for (const key of Object.keys(values).filter(key => key.startsWith('prototype-fact:'))) delete values[key];
  const sections = resolveCoverageQuestionSections({ sections: getPageSections('coverage'), selectedCategories: ['OO'], coverageQuestions: library.client.coverageQuestions });
  const visible = sections.flatMap(section => section.fieldIds);
  for (const field of ['monthly-business-expenses', 'business-expense-responsibility']) {
    expect(visible).toContain(field);
    expect(getClientPageFields('coverage', values).some(row => row.id === field)).toBe(true);
  }
  const result = resolveApplicationCoverage(product, 'member', values, library.products);
  expect(result.selectable, result.messages.join('; ')).toBe(true);
  expect(resolveQuestionParticipation(library.site, product.id, 'member', 'new', { ...input.answers, 'monthly-business-expenses': '' }, input.attestations).allowed).toBe(false);
});
it("rejects impossible dates and uses the recorded calendar-age convention", async () => {
  const { applicationApplicantFacts } = await import("../utils/applicantFacts");
  const today = dayjs("2026-02-28");
  expect(applicationApplicantFacts({ "birth-date": "2000-02-30" }, "member", today).ageYears).toBeUndefined();
  expect(applicationApplicantFacts({ "birth-date": "2000-02-29" }, "member", today).ageYears).toBe(25);
  expect(applicationApplicantFacts({ "birth-date": "2000-02-29" }, "member", dayjs("2026-03-01")).ageYears).toBe(26);
});

it("retains explicit nonmember billing facts even when a stale confirmation exists", async () => {
  const { prototypeRateRequest } = await import("../app/usePrototypeRates");
  const library = journeyLibrary("ama"); installPrototypeLibrary(library);
  const request = prototypeRateRequest("li-term", "member", 100000, { membership: "no", "membership-confirmed": true, "birth-date": "1990-01-01" }, "monthly")!;
  expect(request.facts.membership).toBe(false);
});

it("uses the stored WAEPA infant benefit schedule for an actual child collection", () => {
  const library = journeyLibrary("waepa"); installPrototypeLibrary(library);
  const product = library.products.find(p => p.id === "li-group-term")!;
  const values = { dependents: ["spouse", "child"], "birth-date": "1990-01-01", "state-province": "VA", "prototype-fact:li-group-term:member:activeMilitary": "no", coverageSelections: [product.id], productApplicants: { [product.id]: ["member", "child"] }, coverageAmounts: { [`${product.id}:member`]: 100000, [`${product.id}:child`]: 1000 }, children: [{ "child-birth-date": dayjs().subtract(90, "day").format("YYYY-MM-DD"), "child-full-time-student": "no", "child-gender": "male" }] };
  const result = resolveApplicationCoverage(product, "child", values, library.products);
  expect(result.selectable, result.messages.join("; ")).toBe(true);
  expect(result.amounts).toEqual([1000]);
  const spousePrimary = { ...values, productApplicants: { [product.id]: ["spouse", "child"] }, coverageAmounts: { [`${product.id}:spouse`]: 100000, [`${product.id}:child`]: 1000 } };
  const spouseResult = resolveApplicationCoverage(product, "child", spousePrimary, library.products);
  expect(spouseResult.selectable, spouseResult.messages.join("; ")).toBe(true);
  expect(spouseResult.amounts).toEqual([1000]);
  const mixedChildren = { ...values, children: [...values.children, { ...values.children[0], "child-birth-date": dayjs().subtract(5, "year").format("YYYY-MM-DD") }] };
  expect(resolveApplicationCoverage(product, "child", mixedChildren, library.products).selectable).toBe(false);
});
