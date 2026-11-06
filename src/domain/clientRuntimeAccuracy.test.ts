import dayjs from "dayjs";
import { afterEach, describe, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "../migration/fixtures";
import { activeSiteMigrationScope } from "../migration/activeSiteScope";
import { createCoverageJourneyFixture } from "../migration/coverageJourneyExceptionAcceptance";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { resolveApplicationCoverage, applicationUnderwriting, validateApplicationCoverages } from "./coverageRuntime";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { resolveJourneyUnderwriting } from "./coverageJourney";
import { isBenefitPolicy } from "./benefitPolicy";
import { applicationUnderwritingContext } from "./quickDecisionPolicy";

const db = JSON.parse(JSON.stringify(createReviewedMigrationDatabase()));
afterEach(() => installPrototypeLibrary(null));

describe("client rules at the persisted applicant runtime boundary", () => {
  it.each(activeSiteMigrationScope.sites)("$key preserves member new-application rules and classes", ({ key }) => {
    const library = resolvePrototypeLibrary(db, key, "accuracy-check");
    installPrototypeLibrary(library);
    for (const product of library.products) {
      const policy = resolveCoverageJourneyPolicy(library.site, product.id)!;
      const classes = [...new Set(policy.mappings.filter(m => m.when.applicantKey === "member" && m.when.mode === "new").map(m => m.when.applicantClass))];
      for (const applicantClass of classes) {
        const mapping = policy.mappings.find(m => m.when.applicantKey === "member" && m.when.mode === "new" && m.when.applicantClass === applicantClass)!;
        const { input } = createCoverageJourneyFixture(library.site, product.id, mapping.when);
        const age = input.eligibility.ageYears!;
        const values: Record<string, unknown> = {
          association: input.associationKey, ...(key === "ama" ? { membership: "physician", "actively-at-work": "yes" } : {}),
          "birth-date": dayjs().subtract(age, "year").format("YYYY-MM-DD"),
          "state-province": input.jurisdiction!.replace(/^US-/, ""),
          "has-other-life-insurance": "no",
          "hours-worked-per-week": input.eligibility.workHoursPerWeek,
          "firm-member-count": input.eligibility.firmMemberCount,
          "average-monthly-income": input.benefit?.monthlyIncome,
          "is-self-employed": "no", "years-self-employed": 0,
          "monthly-business-expenses": input.benefit?.eligibleMonthlyExpenses,
          "business-expense-responsibility": 100,
          coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] }, coverageAmounts: { [`${product.id}:member`]: input.amount },
          coverageWaitingPeriods: { [`${product.id}:member`]: input.waitingPeriod }, coverageMaxBenefitPeriods: { [`${product.id}:member`]: input.benefitPeriod },
        };
        for (const p of library.products) for (const [name, value] of Object.entries({ existingMonthlyBenefit: 0, retirement: "no", monthlyLoanPayment: input.benefit?.monthlyLoanPayment, eligibleExpenseFraction: 1, applicantClass, activeMilitary: "no" })) values[`prototype-fact:${p.id}:member:${name}`] = value;
        for (const [name, mapping] of Object.entries(library.client.applicantExperience?.factMappings ?? {})) {
          const operand = values[`prototype-fact:${product.id}:member:${name}`];
          values[mapping.field] = Object.entries(mapping.values).find(([, value]) => value === operand)?.[0];
        }
        const context = `${key}/${product.id}/${applicantClass ?? "default"}`;
        const result = resolveApplicationCoverage(product, "member", values, library.products);
        expect(result.selectable, `${context}: ${result.messages.join("; ")}`).toBe(true);
        expect(result.amounts, context).toContain(input.amount);
        const expected = resolveJourneyUnderwriting(library.site, product.id, "member", age, input.amount, applicantClass, input.associationKey, applicationUnderwritingContext(library.site, product.id, "member", values));
        expect(applicationUnderwriting(product, "member", values).underwritingType, `${context}: underwriting`).toBe(expected.pathway);
        expect(validateApplicationCoverages(library.products, values), context).toBeUndefined();
        const underAge = { ...values, "birth-date": dayjs().subtract(1, "year").format("YYYY-MM-DD") };
        expect(resolveApplicationCoverage(product, "member", underAge, library.products).selectable, `${context}: age`).toBe(false);
        expect(resolveApplicationCoverage(product, "member", { ...values, "state-province": "ZZ" }, library.products).selectable, `${context}: jurisdiction`).toBe(false);
        const benefit = library.site.configuration.products.find(p => p.productKey === product.id)!.benefitPolicies[0]?.value;
        if (isBenefitPolicy(benefit) && benefit.applicants.some(a => a.applicantKey === "member" && a.applicantClass === applicantClass && a.income)) expect(resolveApplicationCoverage(product, "member", { ...values, "average-monthly-income": "" }, library.products).selectable, `${context}: missing income`).toBe(false);
      }
    }
  });
});

it("does not let stale selections or unrelated life amounts inflate ABE spouse disability limits", () => {
  const library = resolvePrototypeLibrary(db, "abe", "accuracy-check"); installPrototypeLibrary(library);
  const product = library.products.find(p => p.id === "di-ltd")!;
  const values = {
    "birth-date": "1990-01-01", "spouse-birth-date": "1990-01-01", "state-province": "NY", "spouse-average-monthly-income": 10000, "spouse-hours-worked-per-week": 30,
    coverageSelections: ["di-ltd", "li-term"], productApplicants: { "di-ltd": ["member", "spouse"], "li-term": ["member"] },
    coverageAmounts: { "di-ltd:member": 1000, "di-ltd:spouse": 1000, "li-term:member": 1000000, "di-mtd:member": 5000, "di-mtd:spouse": 4000 },
    "prototype-fact:di-ltd:spouse:existingMonthlyBenefit": 0,
  };
  const result = resolveApplicationCoverage(product, "spouse", values, library.products);
  expect(result.selectable, result.messages.join("; ")).toBe(true);
  expect(result.amounts.at(-1)).toBe(1000);
});

it("recomputes AVMA overhead benefit periods from the chosen waiting period", () => {
  const library = resolvePrototypeLibrary(db, "avma", "accuracy-check"); installPrototypeLibrary(library);
  const product = library.products.find(p => p.id === "oo-professional")!;
  const values = { "birth-date": "1990-01-01", "state-province": "NY", "hours-worked-per-week": 40, "monthly-business-expenses": 10000, "prototype-fact:oo-professional:member:eligibleExpenseFraction": 1, coverageSelections: [product.id], productApplicants: { [product.id]: ["member"] }, coverageAmounts: { [`${product.id}:member`]: 500 }, coverageWaitingPeriods: { [`${product.id}:member`]: "30-days" } };
  const result = resolveApplicationCoverage(product, "member", values, library.products);
  expect(result.selectable, JSON.stringify({ messages: result.messages, requirements: product.requirements })).toBe(true);
  expect(result.benefitPeriod.options?.map(option => option.value)).toEqual(["24-months"]);
  expect(validateApplicationCoverages(library.products, { ...values, coverageMaxBenefitPeriods: { [`${product.id}:member`]: "12-months" } })).toContain("update the required coverage options");
});

it("resolves class-specific underwriting from the captured rules and requires the class", () => {
  const changed = structuredClone(db);
  const original = changed.underwritingBands.find((row: { siteKey: string; productKey: string; applicantTypeKey: string }) => row.siteKey === "asce" && row.productKey === "li-10yr" && row.applicantTypeKey === "member")!;
  changed.underwritingBands = changed.underwritingBands.filter((row: { siteKey: string; productKey: string; applicantTypeKey: string }) => !(row.siteKey === "ama" && row.productKey === "li-10yr" && row.applicantTypeKey === "member"));
  for (const [applicantClass, pathway] of [["class-a", "QD"], ["class-b", "FUW"]]) changed.underwritingBands.push({ ...original, id: `accuracy-underwriting-${applicantClass}`, key: `accuracy-underwriting-${applicantClass}`, siteKey: "ama", applicantClass, pathway });
  const library = resolvePrototypeLibrary(changed, "ama", "accuracy-check"); installPrototypeLibrary(library);
  const product = library.products.find(p => p.id === "li-10yr")!;
  const values = { "birth-date": dayjs().subtract(original.minimumAge, "year").format("YYYY-MM-DD"), coverageAmounts: { "li-10yr:member": original.minimumAmountExclusive ? original.minimumAmount + 1000 : original.minimumAmount } };
  expect(applicationUnderwriting(product, "member", values).status).toBe("needs-information");
  expect(applicationUnderwriting(product, "member", { ...values, "prototype-fact:li-10yr:member:applicantClass": "class-a" }).underwritingType).toBe("QD");
  expect(applicationUnderwriting(product, "member", { ...values, "prototype-fact:li-10yr:member:applicantClass": "class-b" }).underwritingType).toBe("FUW");
  expect(applicationUnderwriting(product, "member", { ...values, "prototype-fact:li-10yr:member:applicantClass": "unknown" }).status).toBe("unresolved");
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
  const library = resolvePrototypeLibrary(db, "ama", "accuracy-check"); installPrototypeLibrary(library);
  const request = prototypeRateRequest("li-term", "member", 100000, { membership: "no", "membership-confirmed": true, "birth-date": "1990-01-01" }, "monthly")!;
  expect(request.facts.membership).toBe(false);
});

it.each(activeSiteMigrationScope.sites)("$key preserves spouse and single-child choices from the stored rules", ({ key }) => {
  const library = resolvePrototypeLibrary(db, key, "accuracy-check"); installPrototypeLibrary(library);
  for (const product of library.products) for (const applicant of product.applicants.filter(applicant => applicant !== "member")) {
    const mapping = resolveCoverageJourneyPolicy(library.site, product.id)!.mappings.find(mapping => mapping.when.applicantKey === applicant && mapping.when.mode === "new")!;
    const { input } = createCoverageJourneyFixture(library.site, product.id, mapping.when);
    const values: Record<string, unknown> = {
      association: input.associationKey, ...(key === "waepa" && applicant === "spouse" ? { "spouse-membership": "no" } : {}), ...(key === "ama" ? { membership: "physician", "actively-at-work": "yes" } : {}),
      "birth-date": "1990-01-01", [`${applicant}-birth-date`]: dayjs().subtract(input.eligibility.ageYears!, "year").format("YYYY-MM-DD"),
      "state-province": input.jurisdiction!.replace(/^US-/, ""), [`${applicant}-full-time-student`]: "yes",
      [`${applicant}-hours-worked-per-week`]: 40, [`${applicant}-average-monthly-income`]: 1000000,
      coverageSelections: [product.id], productApplicants: { [product.id]: ["member", applicant] },
      coverageAmounts: { [`${product.id}:member`]: input.memberAmount, [`${product.id}:${applicant}`]: input.amount },
      coverageWaitingPeriods: { [`${product.id}:${applicant}`]: input.waitingPeriod }, coverageMaxBenefitPeriods: { [`${product.id}:${applicant}`]: input.benefitPeriod },
    };
    for (const p of library.products) for (const name of ["existingMonthlyBenefit", "monthlyLoanPayment"]) values[`prototype-fact:${p.id}:${applicant}:${name}`] = 0;
    for (const p of library.products) values[`prototype-fact:${p.id}:member:activeMilitary`] = "no";
    const result = resolveApplicationCoverage(product, applicant, values, library.products);
    expect(result.selectable, `${key}/${product.id}/${applicant}: ${result.messages.join("; ")}`).toBe(true);
    expect(result.amounts, `${key}/${product.id}/${applicant}`).toContain(input.amount);
  }
});

it("uses the stored WAEPA infant benefit schedule for an actual child collection", () => {
  const library = resolvePrototypeLibrary(db, "waepa", "accuracy-check"); installPrototypeLibrary(library);
  const product = library.products.find(p => p.id === "li-group-term")!;
  const values = { "birth-date": "1990-01-01", "state-province": "VA", "prototype-fact:li-group-term:member:activeMilitary": "no", coverageSelections: [product.id], productApplicants: { [product.id]: ["member", "child"] }, coverageAmounts: { [`${product.id}:member`]: 100000, [`${product.id}:child`]: 1000 }, children: [{ "child-birth-date": dayjs().subtract(90, "day").format("YYYY-MM-DD"), "child-full-time-student": "no", "child-gender": "male" }] };
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
