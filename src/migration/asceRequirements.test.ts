import { LocalStorageAdapter, LOCAL_DATABASE_KEY } from "../persistence/localAdapter";
import { describe, expect, it } from "vitest";
import { resolveSiteCoverage } from "../data";
import { createMigrationDatabase } from "./fixtures";
import { resolveDatabaseSite } from "./resolve";
import { validateMigrationDatabase } from "./integrity";
import { evaluateEligibility, resolveBenefitLimit, coverageRelationshipErrors, resolveUnderwritingBand } from "../domain/coverageRequirements";
import { getCoverageAmountChoices } from "../utils/coverageAmounts";
import { launchLinks, siteEnvironmentLinks } from "../data/siteEnvironmentLinks";

const db = createMigrationDatabase();
const sources = {
  source: resolveSiteCoverage("asce").filter((p) => p.status !== "disabled").map((p) => p.effective),
  database: resolveDatabaseSite(db, "asce").coverage.filter((p) => p.enabled).map((p) => p.effective),
};
for (const [source, products] of Object.entries(sources)) describe(`ASCE requirements: ${source}`, () => {
  const life = products.find((p) => p.id === "li-10yr")!;
  const di = products.find((p) => p.id === "di-ltd")!;
  it.each([
    [13, 0, true, false, "ineligible"], [14, 0, true, false, "eligible"],
    [8000, 22, true, false, "eligible"], [8400, 23, true, false, "ineligible"],
    [8400, 23, true, true, "eligible"], [9000, 24, true, true, "eligible"],
    [9400, 25, true, true, "ineligible"], [8000, 22, false, true, "ineligible"],
  ] as const)("child days=%s age=%s unmarried=%s student=%s", (ageDays, ageYears, unmarried, fullTimeStudent, expected) => {
    for (const product of products.filter((p) => p.categoryId === "LI")) expect(evaluateEligibility(product.requirements, "child", { ageDays, ageYears, unmarried, fullTimeStudent })).toBe(expected);
  });
  it("requires missing child facts rather than claiming eligibility", () => expect(evaluateEligibility(life.requirements, "child", {})).toBe("needs-information"));
  it("requires member Life, permits a different Life product, rejects non-Life member coverage", () => {
    expect(coverageRelationshipErrors(products, { "li-10yr": ["child"] })).toHaveLength(1);
    expect(coverageRelationshipErrors(products, { "li-10yr": ["child"], "li-term": ["member"] })).toEqual([]);
    expect(coverageRelationshipErrors(products, { "li-10yr": ["child"], "di-ltd": ["member"] })).toHaveLength(1);
  });
  it("limits child Life to one plan and keeps spouse independent", () => {
    expect(coverageRelationshipErrors(products, { "li-10yr": ["child", "member"], "li-20yr": ["child"] })).toHaveLength(1);
    expect(coverageRelationshipErrors(products, { "li-10yr": ["spouse"] })).toEqual([]);
    expect(coverageRelationshipErrors(products, { "li-10yr": ["spouse"], "li-term": ["member"] })).toEqual([]);
  });
  it.each([[16, 30, "ineligible"], [17, 30, "eligible"], [69, 30, "eligible"], [70, 30, "ineligible"], [30, 29, "ineligible"]] as const)("member DI age=%s hours=%s", (ageYears, workHoursPerWeek, expected) => expect(evaluateEligibility(di.requirements, "member", { ageYears, workHoursPerWeek })).toBe(expected));
  it.each([[16, "ineligible"], [17, "eligible"], [59, "eligible"], [60, "ineligible"]] as const)("spouse DI age=%s", (ageYears, expected) => expect(evaluateEligibility(di.requirements, "spouse", { ageYears })).toBe(expected));
  it.each([
    [64, false, 0, 20000, 8550], [65, false, 0, 20000, 4200], [69, false, 0, 20000, 4200],
    [30, true, 0.99, 20000, 1050], [65, true, 0.5, 20000, 1050], [30, true, 1, 20000, 8550],
    [30, false, 0, 1000, 600], [65, false, 0, 1000, 600], [30, true, 0, 1000, 600], [30, false, 0, 0, 0],
  ])("DI lesser-of cap age=%s self=%s years=%s income=%s", (ageYears, selfEmployed, yearsSelfEmployed, averageMonthlyIncome, expected) => {
    expect(resolveBenefitLimit(di.requirements, "member", { ageYears: Number(ageYears), selfEmployed: Boolean(selfEmployed), yearsSelfEmployed: Number(yearsSelfEmployed), averageMonthlyIncome: Number(averageMonthlyIncome) })?.maximum).toBe(expected);
  });
  it("does not infer a benefit maximum from missing employment, age, or income", () => {
    expect(resolveBenefitLimit(di.requirements, "member", { averageMonthlyIncome: 20000 })?.maximum).toBeUndefined();
    expect(resolveBenefitLimit(di.requirements, "member", { ageYears: 65, selfEmployed: true, averageMonthlyIncome: 20000 })?.maximum).toBeUndefined();
    expect(resolveBenefitLimit(di.requirements, "member", { ageYears: 30, selfEmployed: false })?.maximum).toBeUndefined();
  });
  it("mandates Five-Year and 90 days only below one year self-employed", () => {
    expect(resolveBenefitLimit(di.requirements, "member", { selfEmployed: true, yearsSelfEmployed: 0.5, averageMonthlyIncome: 5000 })).toMatchObject({ maximum: 1050, requiredWaitingPeriod: "90", requiredBenefitPeriod: "five-year" });
    expect(resolveBenefitLimit(di.requirements, "member", { selfEmployed: true, yearsSelfEmployed: 1 })?.requiredWaitingPeriod).toBeUndefined();
    expect(resolveBenefitLimit(di.requirements, "spouse", { selfEmployed: true, yearsSelfEmployed: 0 })).toBeUndefined();
  });
  it("offers $150 increments and the fixed spouse package", () => {
    const choices = getCoverageAmountChoices(di, "member");
    expect(choices).toHaveLength(57); expect(choices[0]).toBe(150); expect(choices.at(-1)).toBe(8550);
    expect(choices.every((value, i) => i === 0 || value - choices[i - 1] === 150)).toBe(true);
    expect(getCoverageAmountChoices(di, "spouse")).toEqual([500]);
    expect(di.waitingPeriodOptionsByApplicant?.spouse).toEqual([{ label: "30 days", value: "30", days: 30 }]);
    expect(di.maxBenefitPeriodOptionsByApplicant?.spouse).toEqual([{ label: "2 years", value: "spouse-two-years" }]);
  });
  it("preserves exact 10-year underwriting thresholds and unresolved older-age treatment", () => {
    for (const applicant of ["member", "spouse"] as const) {
      expect(resolveUnderwritingBand(life, applicant, 18, 500000)?.label).toBe("Core QD");
      expect(resolveUnderwritingBand(life, applicant, 60, 510000)?.label).toBe("Expanded QD Fluidless");
      expect(resolveUnderwritingBand(life, applicant, 61, 510000)?.underwritingType).toBe("FUW");
      expect(resolveUnderwritingBand(life, applicant, 64, 2000000)?.underwritingType).toBe("FUW");
      expect(resolveUnderwritingBand(life, applicant, 65, 2000000)?.status).toBe("underwriting-unspecified");
      expect(resolveUnderwritingBand(life, applicant, 69, 2000000)?.underwritingType).toBeUndefined();
      expect(resolveUnderwritingBand(life, applicant, 70, 2000000)).toBeUndefined();
      expect(resolveUnderwritingBand(life, applicant, 17, 100000)).toBeUndefined();
    }
  });
  it("preserves 20-year bands and current plan 121 without guessing base eligibility", () => {
    const twenty = products.find((p) => p.id === "li-20yr")!;
    expect(twenty.planCode.primary).toBe("121");
    for (const applicant of ["member", "spouse"] as const) {
      expect(resolveUnderwritingBand(twenty, applicant, 18, 500000)?.label).toBe("Core QD");
      expect(resolveUnderwritingBand(twenty, applicant, 54, 510000)?.label).toBe("Expanded QD Fluidless");
      expect(resolveUnderwritingBand(twenty, applicant, 55, 2000000)?.status).toBe("underwriting-unspecified");
      expect(resolveUnderwritingBand(twenty, applicant, 59, 2000000)?.underwritingType).toBeUndefined();
      expect(resolveUnderwritingBand(twenty, applicant, 60, 100000)).toBeUndefined();
    }
  });
});

describe("Site environment persistence", () => {
  it("has stable ownership and exact inventory URLs without invented Sites", () => {
    expect(db.siteEnvironmentLinks).toEqual(siteEnvironmentLinks);
    expect(launchLinks(db.siteEnvironmentLinks, "asce", ["production", "test", "pre-production", "automation"]).map((link) => link.url)).toEqual(["https://asce.nylinsure.com", "https://ascepreview.nylinsure2.com", "https://asce.nylinsure2.com", "https://ascepreview2.nylinsure2.com"]);
    expect(db.sites.some((s) => /ascegi|ascencgi/.test(s.key))).toBe(false);
    expect(validateMigrationDatabase(db)).toEqual([]);
  });
  it("only launches active configured launch links for the owning Site", () => {
    const records = [...siteEnvironmentLinks, { ...siteEnvironmentLinks[0], id: "inactive", active: false }, { ...siteEnvironmentLinks[0], id: "empty", url: "" }];
    expect(launchLinks(records, "asce", ["production"])).toHaveLength(1);
    expect(launchLinks(records, "ama", ["production"])).toEqual([]);
  });
  it("persists link edits across adapter reloads and upgrades old storage without overwriting operational data", async () => {
    const saved = new Map<string, string>();
    const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => { saved.set(key, value); }, removeItem: (key: string) => { saved.delete(key); } };
    const old = { ...db, sites: db.sites.map((site) => ({ ...site, name: "Retained operational name" })) } as Partial<typeof db>;
    delete old.siteEnvironmentLinks;
    saved.set(LOCAL_DATABASE_KEY, JSON.stringify(old));
    const adapter = new LocalStorageAdapter(db, storage);
    expect(await adapter.list("siteEnvironmentLinks")).toEqual(siteEnvironmentLinks);
    expect((await adapter.list("sites"))[0].name).toBe("Retained operational name");
    await adapter.update("siteEnvironmentLinks", "asce-production", { active: false });
    const reloaded = new LocalStorageAdapter(db, storage);
    expect((await reloaded.get("siteEnvironmentLinks", "asce-production"))?.active).toBe(false);
    expect(launchLinks(await reloaded.list("siteEnvironmentLinks"), "asce", ["production"])).toEqual([]);
  });
  it("rejects orphaned ownership", () => {
    const changed = structuredClone(db); changed.siteEnvironmentLinks[0].siteKey = "missing";
    expect(validateMigrationDatabase(changed).some((e) => e.includes("orphan site_key"))).toBe(true);
  });
});
