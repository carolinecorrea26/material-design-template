import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "./prototypeLibrary";
import { canViewCoveragePortfolio, lookupPrototypeTpa, resolveTpaOutcome, tpaOutcomeValues } from "./tpaIntegration";
import { confirmedRequirementBehaviors } from "./requirementBehaviors";
import { libraryRequirementRows } from "../pages/admin/library/libraryRequirementRows";
import { buildGlobalTemplate } from "../dev/storybook/globalTemplate";
import asce from "../../requirements/parked/sites/asce/eligibility.json";
import { resolveApplicationCoverage, validateApplicationCoverages } from "./coverageRuntime";
import { coverageLifeMaximumError } from "./coverageSubmitValidation";
import { verifiedPortfolioAmount } from "./tpaPortfolioAmounts";
import { resolveNormalizedBenefit } from "./benefitPolicy";

const catalog = { ...validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8"))), revision: "test:asce-tpa-portfolio" };
const library = resolvePrototypeLibrary(catalog.data, "asce", catalog.revision);
const client = library.client;
const verified = tpaOutcomeValues({ existingMember: true, activeCoverage: true }, resolveTpaOutcome(client, { existingMember: true, activeCoverage: true }, true));
const base = { ...asce.tpa.prototypeRecords[0].facts, membership: "yes", gender: "male", smoker: "no", dependents: ["spouse"], "spouse-birth-date": "1990-01-01", "spouse-gender": "female", "spouse-smoker": "no", "hours-worked-per-week": 30, "spouse-hours-worked-per-week": 30, "average-monthly-income": 20000, "spouse-average-monthly-income": 1000, "self-employed-under-one-year": "no" };
beforeEach(() => { vi.setSystemTime(new Date("2026-11-08T17:00:00Z")); installPrototypeLibrary(library); });
afterEach(() => { installPrototypeLibrary(null); vi.useRealTimers(); });

describe("fresh-start ASCE TPA portfolio access", () => {
  it("uses the configured fictional existing insured member and requires all lookup facts", () => {
    const facts = asce.tpa.prototypeRecords[0].facts;
    expect(lookupPrototypeTpa(client, facts)).toEqual({ existingMember: true, activeCoverage: true });
    for (const field of asce.tpa.lookupFields) expect(lookupPrototypeTpa(client, { ...facts, [field]: "" }).existingMember, field).toBe(false);
  });

  it("requires an existing member, active coverage and successful verification", () => {
    for (const existingMember of [false, true]) for (const activeCoverage of [false, true]) for (const identityPassed of [undefined, false, true]) {
      const member = { existingMember, activeCoverage };
      const outcome = resolveTpaOutcome(client, member, identityPassed);
      expect(canViewCoveragePortfolio(client, tpaOutcomeValues(member, outcome))).toBe(existingMember && activeCoverage && identityPassed === true);
      if (identityPassed === false) expect(outcome.decision).toBe("manual-review");
    }
  });

  it("refuses incomplete, contradictory or loosely typed flags and disabled integration", () => {
    const values = tpaOutcomeValues({ existingMember: true, activeCoverage: true }, resolveTpaOutcome(client, { existingMember: true, activeCoverage: true }, true));
    expect(canViewCoveragePortfolio(client, values)).toBe(true);
    for (const flag of ["tpa-existing-member", "tpa-active-coverage", "tpa-verified", "tpa-portfolio-enabled"]) for (const invalid of [undefined, false, "true"]) {
      expect(canViewCoveragePortfolio(client, { ...values, [flag]: invalid }), flag).toBe(false);
    }
    expect(canViewCoveragePortfolio({ ...client, tpaIntegration: undefined }, values)).toBe(false);
    expect(canViewCoveragePortfolio({ ...client, tpaIntegration: { ...client.tpaIntegration!, mode: "membership-auto-approval" } }, values)).toBe(false);
  });

  it("documents one shared confirmed rule for Eligibility and Coverage in the Library", () => {
    const rule = confirmedRequirementBehaviors(["eligibility", "coverage"]).find(rule => rule.id === "coverage-tpa-portfolio-access")!;
    expect(rule.status).toBe("confirmed");
    expect(rule.pages.sort()).toEqual(["coverage", "eligibility"]);
    const rows = libraryRequirementRows(catalog, "asce").filter(row => row.key === rule.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].behavior).toBe(rule.statement);
  });

  it("uses the same access rule and lookup facts in the ASCE Storybook template", () => {
    const story = buildGlobalTemplate(catalog, "multipleTerms");
    const member = lookupPrototypeTpa(story.client, asce.tpa.prototypeRecords[0].facts);
    expect(member).toEqual({ existingMember: true, activeCoverage: true });
    expect(canViewCoveragePortfolio(story.client, tpaOutcomeValues(member, resolveTpaOutcome(story.client, member, true)))).toBe(true);
    expect(canViewCoveragePortfolio(story.client, tpaOutcomeValues(member, resolveTpaOutcome(story.client, member, false)))).toBe(false);
  });

  it.each(["prototype", "storybook"] as const)("deducts each person's in-force amounts from product and shared Life choices in %s", surface => {
    const current = surface === "prototype" ? library : buildGlobalTemplate(catalog, "multipleTerms");
    installPrototypeLibrary(current);
    const choices = (id: string, person: "member" | "spouse", values = { ...base, ...verified }) => resolveApplicationCoverage(current.products.find(product => product.id === id)!, person, values, current.products).amounts;
    expect(choices("li-term", "member").at(-1)).toBe(750000);
    expect(choices("li-term", "spouse").at(-1)).toBe(900000);
    expect(choices("li-10yr", "member").at(-1)).toBe(1750000);
    expect(choices("li-20yr", "spouse").at(-1)).toBe(1900000);
    const adMaximum = choices("li-add", "member", { ...base, ...verified, "tpa-verified": false }).at(-1)!;
    expect(choices("li-add", "member").at(-1)).toBe(adMaximum - 100000);
    expect(choices("di-ltd", "member").at(-1)).toBe(4950);
    // Existing short-term Disability is a different product from offered LTD.
    const spouseDi = { ...base, ...verified, coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member", "spouse"] }, coverageAmounts: { "di-ltd:member": 1500, "di-ltd:spouse": 500 } };
    expect(choices("di-ltd", "spouse", spouseDi)).toEqual([500]);
  });

  it("keeps full choices for manual review and unconfigured products", () => {
    const product = library.products.find(product => product.id === "li-term")!;
    for (const flag of ["tpa-existing-member", "tpa-active-coverage", "tpa-verified", "tpa-portfolio-enabled"]) {
      expect(resolveApplicationCoverage(product, "member", { ...base, ...verified, [flag]: false }, library.products).amounts.at(-1)).toBe(1000000);
    }
    const unconfigured = { ...product, requirementPolicy: product.requirementPolicy?.filter(row => row.configuration !== "coverage-deduct-inforce-amount") };
    // The product's amount assignment controls whether its balance is deducted.
    const current = { ...library, products: library.products.map(row => row.id === product.id ? unconfigured : row) };
    installPrototypeLibrary(current);
    expect(resolveApplicationCoverage(unconfigured, "member", { ...base, ...verified }, current.products).amounts.at(-1)).toBe(1000000);
  });

  it("sums multiple matching policies per person without counting riders or unrelated products", () => {
    const fixture = { portfolios: [
      { applicant: "self", coverages: [{ productKey: "li-term", amount: 250000 }, { productKey: "li-term", amount: 150000 }, { productKey: "li-10yr", amount: 100000 }, { productKey: "li-add", amount: 900000 }] },
      { applicant: "spouse", coverages: [{ productKey: "li-term", amount: 100000 }] },
    ] };
    expect(verifiedPortfolioAmount(client, verified, "member", ["li-term"], fixture)).toBe(400000);
    expect(verifiedPortfolioAmount(client, verified, "member", ["li-term", "li-10yr"], fixture)).toBe(500000);
    expect(verifiedPortfolioAmount(client, verified, "spouse", ["li-term"], fixture)).toBe(100000);
  });

  it("deducts applicable age caps and rejects stale over-limit selections", () => {
    const product = library.products.find(product => product.id === "li-term")!;
    const values = { ...base, ...verified, "birth-date": "1955-01-01", coverageSelections: ["li-term"], productApplicants: { "li-term": ["member"] }, coverageAmounts: { "li-term:member": 300000 } };
    expect(resolveApplicationCoverage(product, "member", values, library.products).amounts.at(-1)).toBe(250000);
    expect(validateApplicationCoverages(library.products, values, { deferProfileUnderwriting: true })).toContain("select an available benefit amount");
  });

  it("checks combined new selections plus verified in-force Life only on Coverage Next", () => {
    const values = { ...base, ...verified, coverageSelections: ["li-10yr", "li-20yr"], productApplicants: { "li-10yr": ["member"], "li-20yr": ["member"] }, coverageAmounts: { "li-10yr:member": 1000000, "li-20yr:member": 800000 } };
    expect(validateApplicationCoverages(library.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
    expect(coverageLifeMaximumError(library.site, library.products, values, client)).toContain("$2,000,000");
    expect(coverageLifeMaximumError(library.site, library.products, { ...values, coverageAmounts: { ...values.coverageAmounts, "li-20yr:member": 700000 } }, client)).toBeUndefined();
    expect(coverageLifeMaximumError(library.site, library.products, { ...values, "tpa-verified": false }, client)).toBeUndefined();
  });

  it("deducts Disability before rounding and offers no benefit when capacity is exhausted", () => {
    const facts = { ageYears: 36, monthlyIncome: 10000, selfEmployedUnderOneYear: false };
    expect(resolveNormalizedBenefit(library.site, "di-ltd", "member", { ...facts, verifiedInForceAmount: 3500 }).maximum).toBe(2400);
    const exhausted = resolveNormalizedBenefit(library.site, "di-ltd", "member", { ...facts, verifiedInForceAmount: 8550 });
    expect(exhausted.maximum).toBe(0);
    expect(exhausted.allowed).toBe(false);
    expect(resolveApplicationCoverage(library.products.find(product => product.id === "di-ltd")!, "member", { ...base, ...verified, "self-employed-under-one-year": "yes" }, library.products).amounts).toEqual([]);
  });

  it("records the configurable deduction rule in the Library", () => {
    const rows = libraryRequirementRows(catalog, "asce");
    expect(rows.find(row => row.key === "coverage-tpa-inforce-amounts")?.behavior).toContain("in-force");
    expect(rows.some(row => row.key === "coverage-deduct-inforce-amount" && row.product === "li-term")).toBe(true);
  });
});
