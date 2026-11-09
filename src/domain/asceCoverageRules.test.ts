import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateSharedCatalog } from "../persistence/sharedCatalog";
import { resolvePrototypeLibrary, installPrototypeLibrary } from "./prototypeLibrary";
import { coverageLifeMaximumError } from "./coverageSubmitValidation";
import { resolveApplicationCoverage, validateApplicationCoverages } from "./coverageRuntime";
import { resolveNormalizedResidency } from "./residencyPolicy";
import { freshStartSource } from "./freshStartCatalog";
import { compileRequirementCatalog } from "./requirementCatalog.mjs";
import { buildGlobalTemplate } from "../dev/storybook/globalTemplate";

const catalog = { ...validateSharedCatalog(JSON.parse(readFileSync("public/catalog/portal.json", "utf8"))), revision: "test:asce-next-rules" };
const library = resolvePrototypeLibrary(catalog.data, "asce", catalog.revision);
const base = { membership: "yes", "birth-date": "1990-01-01", "spouse-birth-date": "1990-01-01", "state-province": "NY", dependents: ["spouse"], gender: "male", smoker: "no", "spouse-gender": "female", "spouse-smoker": "no" };
const life = (a: number, b: number) => ({ ...base, coverageSelections: ["li-10yr", "li-20yr"], productApplicants: { "li-10yr": ["member"], "li-20yr": ["member"] }, coverageAmounts: { "li-10yr:member": a, "li-20yr:member": b } });
beforeEach(() => { vi.setSystemTime(new Date("2026-11-08T17:00:00Z")); installPrototypeLibrary(library); });
afterEach(() => { vi.useRealTimers(); installPrototypeLibrary(null); });

describe("ASCE confirmed Coverage Next and residency rules", () => {
  it("rejects combined selections over the MCR ceiling on Coverage Next", () => {
    const values = life(1500000, 1500000);
    expect(validateApplicationCoverages(library.products, values, { deferProfileUnderwriting: true })).toBeUndefined();
    expect(coverageLifeMaximumError(library.site, library.products, values)).toContain("$2,000,000");
    expect(coverageLifeMaximumError(library.site, library.products, life(1000000, 1000000))).toBeUndefined();
    expect(coverageLifeMaximumError(library.site, library.products, life(1000000, 1010000))).toContain("$2,000,000");
  });

  it("checks each person separately and ignores unselected amounts and later Profile answers", () => {
    const values = { ...life(1000000, 1000000), productApplicants: { "li-10yr": ["member", "spouse"], "li-20yr": ["member", "spouse"] }, coverageAmounts: { ...life(1000000, 1000000).coverageAmounts, "li-10yr:spouse": 1000000, "li-20yr:spouse": 1000000, "li-term:member": 1000000 }, "has-other-life-insurance": "yes", "existing-life-insurance-amount": "9000000" };
    expect(coverageLifeMaximumError(library.site, library.products, values)).toBeUndefined();
    const error = coverageLifeMaximumError(library.site, library.products, { ...values, coverageAmounts: { ...values.coverageAmounts, "li-20yr:spouse": 1010000 } });
    expect(error).toContain("Your Spouse");
    expect(error).toContain("$2,000,000");
  });

  it("derives level-Life upper choices and the aggregate from one authored maximum", () => {
    const source = structuredClone(freshStartSource());
    (source.siteCoveragePolicies.asce as { lifeMaximum: { maximum: number } }).lifeMaximum.maximum = 2500000;
    const compiled = compileRequirementCatalog(catalog.data, source, "asce");
    const aggregate = compiled.configurationValues.filter(row => row.siteKey === "asce" && compiled.configurationDefinitions.find(definition => definition.key === row.configurationKey)?.definition.target?.kind === "site-life-aggregate");
    expect(aggregate).toHaveLength(1);
    expect(aggregate[0].value).toMatchObject({ groups: [{ maximum: 2500000 }] });
    for (const product of ["li-10yr", "li-20yr"]) for (const person of ["member", "spouse"]) {
      const rule = compiled.productAmountRules.find(row => row.siteKey === "asce" && row.productKey === product && row.applicantTypeKey === person)!;
      expect(compiled.amountBands.filter(row => row.amountPatternKey === rule.amountPatternKey).at(-1)?.maximum).toBe(2500000);
      expect(Math.max(...compiled.underwritingBands.filter(row => row.siteKey === "asce" && row.productKey === product && row.applicantTypeKey === person && row.pathway === "FUW").map(row => row.maximumAmount ?? 0))).toBe(2500000);
    }
    const tli = compiled.productAmountRules.find(row => row.siteKey === "asce" && row.productKey === "li-term" && row.applicantTypeKey === "member")!;
    expect(compiled.amountBands.find(row => row.amountPatternKey === tli.amountPatternKey)?.maximum).toBe(1000000);
  });

  it.each(["member", "spouse"] as const)("offers Disability in PR and Canada except Quebec for %s", person => {
    const product = library.products.find(product => product.id === "di-ltd")!;
    const values = { ...base, "hours-worked-per-week": "30", "spouse-hours-worked-per-week": "30", "average-monthly-income": "5000", "spouse-average-monthly-income": "1000", "self-employed-under-one-year": "no", coverageSelections: ["di-ltd"], productApplicants: { "di-ltd": ["member", "spouse"] }, coverageAmounts: { "di-ltd:member": 1500, "di-ltd:spouse": 500 } };
    for (const [state, jurisdiction, expected] of [["PR", "US-PR", true], ["ON", "CA-ON", true], ["CA-BC", "CA-BC", true], ["QC", "CA-QC", false], ["NC", "US-NC", false], ["VT", "US-VT", false], ["WA", "US-WA", false], ["GU", "US-GU", false], ["VI", "US-VI", false], ["NH", "US-NH", person === "member"]] as const) {
      expect(resolveNormalizedResidency(library.site, product.id, person, { jurisdiction }).allowed, `${person}/${jurisdiction}`).toBe(expected);
      expect(resolveApplicationCoverage(product, person, { ...values, "state-province": state }, library.products).selectable, `${person}/${state}`).toBe(expected);
    }
  });

  it("shows the same source policies in the Storybook template", () => {
    const story = buildGlobalTemplate(catalog, "multipleTerms");
    expect(story.site.configuration.lifeAggregates).toEqual(library.site.configuration.lifeAggregates);
    expect(story.site.configuration.products.find(product => product.productKey === "di-ltd")?.residencyPolicies).toEqual(library.site.configuration.products.find(product => product.productKey === "di-ltd")?.residencyPolicies);
  });
});
