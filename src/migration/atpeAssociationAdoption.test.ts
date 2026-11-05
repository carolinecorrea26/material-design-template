import { afterEach, beforeAll, expect, it } from "vitest";
import { createReviewedMigrationDatabase } from "./fixtures";
import { applyAtpeAssociationAdoption, atpeAssociationKey, atpeProducts } from "./atpeAssociationAdoption";
import { currentMcrSource } from "./currentMcr";
import { isResidencyPolicy, resolveNormalizedResidency, usJurisdictions } from "../domain/residencyPolicy";
import { resolveCoverageJourneyPolicy, resolveSubmissionMapping } from "../domain/coverageJourneyPolicy";
import { resolveEffectiveEligibility, resolveEffectiveSite } from "../domain/effectiveSite";
import { validateMigrationDatabase } from "./integrity";
import { installPrototypeLibrary, resolvePrototypeLibrary } from "../domain/prototypeLibrary";
import { getClientPageFields } from "../config/clientFields/getClientPageFields";
import type { DatabaseSchema } from "../persistence/types";
import { applicationCoverageName, resolveApplicationCoverage } from "../domain/coverageRuntime";
import dayjs from "dayjs";
import { validateNormalizedCoverageAmount } from "../domain/normalizedCoverageAmounts";
import { resolveDependentCoverage } from "../domain/dependentPolicy";
import { evaluateCoverageJourney } from "../domain/coverageJourney";
import { createMockPolicyVerificationService } from "../domain/policyVerification";
import { resolveAssociationAmounts } from "../domain/associationAmountPolicy";
import { resolveEffectiveAmount } from "../domain/effectiveConfiguration";

let db: DatabaseSchema;
beforeAll(() => { db = createReviewedMigrationDatabase(); }, 120000);
afterEach(() => { installPrototypeLibrary(null); window.sessionStorage.clear(); });

it("checks ATPE numeric boundaries, discrete choices and 50% advice against captured amount owners", () => {
  const site = resolveEffectiveSite(db, "isitrust");
  for (const [productKey, applicant, allowed, rejected] of [
    ["li-group-term", "member", [50000, 1500000], [49999, 75000, 1550000]],
    ["li-group-term", "spouse", [50000, 500000], [25000, 550000]],
    ["li-group-term", "child", [5000, 10000], [7500, 15000]],
    ["li-10yr", "member", [10000, 1000000], [5000, 15000, 1010000]],
    ["li-20yr", "spouse", [10000, 15000, 500000], [5000, 12500, 505000]],
    ["li-add", "member", [25000, 750000], [20000, 30000, 775000]],
    ["sh-hospital-income", "child", [100, 200, 300, 400], [50, 150, 500]],
    ["sh-critical-illness", "spouse", [5000, 100000], [1000, 7500, 105000]],
    ["li-50plus", "member", [5000, 50000], [1000, 7500, 55000]],
  ] as const) {
    for (const amount of allowed) expect(validateNormalizedCoverageAmount(site, productKey, applicant, amount, undefined, atpeAssociationKey).allowed, `${productKey}/${applicant}/${amount}`).toBe(true);
    for (const amount of rejected) expect(validateNormalizedCoverageAmount(site, productKey, applicant, amount, undefined, atpeAssociationKey).allowed, `${productKey}/${applicant}/${amount}`).toBe(false);
  }
  expect(resolveAssociationAmounts(site, "li-group-term").status).toBe("needs-information");
  expect(resolveAssociationAmounts(site, "li-group-term", "unknown").status).toBe("unresolved");
  expect(resolveEffectiveAmount(site.configuration, "li-10yr", { applicantKey: "spouse", associationKey: atpeAssociationKey, amount: 500000 })).toMatchObject({ status: "resolved", allowed: true });
  expect(resolveEffectiveAmount(site.configuration, "li-10yr", { applicantKey: "spouse", associationKey: "akron-bar-association", amount: 500000 })).toMatchObject({ status: "resolved", allowed: false });
  expect(resolveEffectiveAmount(site.configuration, "li-10yr", { applicantKey: "spouse", amount: 500000 }).status).toBe("needs-information");
  for (const [amount, notice] of [[50000, false], [100000, true], [500000, true]] as const) {
    const result = resolveDependentCoverage(site, "li-group-term", "spouse", { associationKey: atpeAssociationKey, amount, baseAmounts: { member: 100000 } });
    expect(result.allowed).toBe(true);
    expect(result.notices.some(text => text.includes("50%"))).toBe(notice);
  }
  expect(resolveDependentCoverage(site, "li-group-term", "spouse", { associationKey: "akron-bar-association", amount: 100000, baseAmounts: { member: 100000 } }).notices).toEqual([]);
  const edited = JSON.parse(JSON.stringify(db)) as DatabaseSchema;
  edited.amountBands.find(row => row.key === "shared.range.50000-1500000-by-50000.band")!.maximum = 1000000;
  expect(validateNormalizedCoverageAmount(resolveEffectiveSite(edited, "isitrust"), "li-group-term", "member", 1500000, undefined, atpeAssociationKey).allowed).toBe(false);
  expect(validateNormalizedCoverageAmount(site, "li-group-term", "member", 1500000, undefined, atpeAssociationKey).allowed).toBe(true);
  expect(resolveEffectiveSite(edited, "asce")).toEqual(resolveEffectiveSite(db, "asce"));
});

it("offers ATPE as the 26th association on seven products while retaining the archived source identity", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "atpe-reviewed");
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=isitrust");
  expect(library.associationContext.associations).toHaveLength(26);
  expect(library.associationContext.associations.find(row => row.id === atpeAssociationKey)?.name).toBe("Association of Texas Professional Educators");
  const membership = getClientPageFields("membership", {}).find(field => field.id === "membership")!;
  expect(membership.options).toContainEqual({ value: atpeAssociationKey, label: "Association of Texas Professional Educators" });
  expect(db.associations.some(row => row.key === "mcr.association.atpe.388" && row.clientKey === "mcr.client.atpe")).toBe(true);
  for (const product of library.site.configuration.products) {
    const offered = resolveCoverageJourneyPolicy(library.site, product.productKey)!.associationChoices.some(choice => choice.key === atpeAssociationKey);
    expect(offered, product.productKey).toBe(atpeProducts.some(slice => slice.productKey === product.productKey));
  }
  expect(validateMigrationDatabase(db)).toEqual([]);
});

it("uses every dedicated ATPE exclusion list, including the four-state Group Term replacement", () => {
  const site = resolveEffectiveSite(db, "isitrust");
  const options = db.fields.find(row => row.key === "state-province")!.definition.options!;
  for (const slice of atpeProducts) {
    let source = String(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === `N${slice.row}`)!.value);
    for (const option of [...options].sort((a, b) => b.label.length - a.label.length)) source = source.replaceAll(new RegExp(`\\b${option.label}\\b`, "g"), option.value);
    const excluded = new Set(source.match(/\b[A-Z]{2}\b/g));
    for (const jurisdiction of usJurisdictions) expect(resolveNormalizedResidency(site, slice.productKey, "member", { jurisdiction, associationKey: atpeAssociationKey }).allowed, `${slice.row}/${jurisdiction}`).toBe(!excluded.has(jurisdiction.slice(3)) && !["AS", "GU", "MP", "PR", "VI", "AA", "AE", "AP"].includes(jurisdiction.slice(3)));
    expect(resolveNormalizedResidency(site, slice.productKey, "member", { jurisdiction: "CA-YT", associationKey: atpeAssociationKey }).allowed).toBe(false);
    expect(resolveNormalizedResidency(site, slice.productKey, "member", { jurisdiction: "US-PA" }).status).toBe("needs-information");
  }
  for (const code of ["KS", "MS", "MO", "NH", "TN", "UT"]) expect(resolveNormalizedResidency(site, "li-group-term", "member", { jurisdiction: `US-${code}`, associationKey: atpeAssociationKey }).allowed).toBe(true);
  expect(resolveNormalizedResidency(site, "li-group-term", "member", { jurisdiction: "US-AK", associationKey: atpeAssociationKey }).allowed).toBe(true);
  expect(resolveNormalizedResidency(site, "li-group-term", "member", { jurisdiction: "US-AK", associationKey: "akron-bar-association" }).allowed).toBe(false);
  expect(resolveNormalizedResidency(site, "li-10yr", "member", { jurisdiction: "US-LA", associationKey: atpeAssociationKey }).allowed).toBe(false);
  expect(resolveNormalizedResidency(site, "li-10yr", "member", { jurisdiction: "US-LA", associationKey: "akron-bar-association" }).allowed).toBe(true);
});

it("maps ATPE policy and plan identifiers for every offered applicant and mode", () => {
  const site = resolveEffectiveSite(db, "isitrust");
  for (const slice of atpeProducts) {
    const journey = resolveCoverageJourneyPolicy(site, slice.productKey)!;
    const mappings = journey.mappings.filter(mapping => mapping.when.associationKey === atpeAssociationKey);
    expect(mappings.length).toBeGreaterThan(0);
    for (const mapping of mappings) {
      const result = resolveSubmissionMapping(journey, mapping.when);
      expect(result.status).toBe("resolved");
      for (const kind of ["gNumber", "planCode"] as const) {
        const primary = String(currentMcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === `${kind === "gNumber" ? "E" : "G"}${slice.row}`)!.value);
        expect(Object.values(result.mapping!.identifiers[kind]).filter(value => value !== null).every(value => value === primary)).toBe(true);
      }
    }
  }
  const group = resolveCoverageJourneyPolicy(site, "li-group-term")!;
  expect(resolveSubmissionMapping(group, { applicantKey: "member", mode: "new", associationKey: atpeAssociationKey }).mapping?.identifiers.gNumber.issue).toBe("G-31139-0");
  expect(resolveSubmissionMapping(group, { applicantKey: "member", mode: "new", associationKey: "akron-bar-association" }).mapping?.identifiers.gNumber.issue).toBe("G-31136-0");
});

it("keeps scoped edits isolated and preserves a previously captured ATPE revision", () => {
  const captured = resolvePrototypeLibrary(db, "isitrust", "captured-atpe");
  const copy = structuredClone(db);
  applyAtpeAssociationAdoption(copy);
  expect(copy).toEqual(db);
  const row = copy.configurationValues.find(row => row.key === "isitrust.li-group-term.journey-residency")!;
  if (!isResidencyPolicy(row.value)) throw new Error("Missing residency policy");
  row.value.associationAllowedJurisdictions![atpeAssociationKey] = row.value.associationAllowedJurisdictions![atpeAssociationKey].filter(code => code !== "US-PA");
  const edited = resolveEffectiveSite(copy, "isitrust");
  expect(resolveNormalizedResidency(edited, "li-group-term", "member", { jurisdiction: "US-PA", associationKey: atpeAssociationKey }).allowed).toBe(false);
  expect(resolveNormalizedResidency(edited, "li-group-term", "member", { jurisdiction: "US-PA", associationKey: "akron-bar-association" }).allowed).toBe(true);
  expect(resolveNormalizedResidency(captured.site, "li-group-term", "member", { jurisdiction: "US-PA", associationKey: atpeAssociationKey }).allowed).toBe(true);
  expect(resolveEffectiveSite(copy, "asce")).toEqual(resolveEffectiveSite(db, "asce"));
});

it("enforces the approved ATPE 10-Year age bounds in both runtime paths and retains the spouse amount owner", async () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "atpe-age-review");
  installPrototypeLibrary(library); window.history.replaceState(null, "", "/?site=isitrust");
  const product = library.products.find(product => product.id === "li-10yr")!;
  for (const applicant of ["member", "spouse"] as const) {
    for (const [ageYears, expected] of [[19, false], [20, true], [54, true], [55, false], [64, false]] as const) {
      expect(resolveEffectiveEligibility(library.site, product.id, applicant, { ageYears, associationKey: atpeAssociationKey, selectedPlans: [{ productKey: product.id, categoryKey: "LI", applicantKey: "member" }] })).toMatchObject({ status: "resolved", eligible: expected });
    }
    expect(resolveEffectiveEligibility(library.site, product.id, applicant, { associationKey: atpeAssociationKey }).status).toBe("needs-information");
    expect(resolveEffectiveEligibility(library.site, product.id, applicant, { ageYears: 55, associationKey: "akron-bar-association", selectedPlans: [{ productKey: product.id, categoryKey: "LI", applicantKey: "member" }] })).toMatchObject({ status: "resolved", eligible: true });
  }
  expect(resolveApplicationCoverage(product, "member", { membership: atpeAssociationKey, "birth-date": "1971-01-01", state: "PA" }).eligibility).toBe("ineligible");
  expect(resolveApplicationCoverage(product, "member", { membership: "akron-bar-association", "birth-date": "1971-01-01", state: "PA" }).eligibility).toBe("eligible");
  expect(validateNormalizedCoverageAmount(library.site, product.id, "spouse", 500000, undefined, atpeAssociationKey).allowed).toBe(true);
  expect(validateNormalizedCoverageAmount(library.site, product.id, "spouse", 505000, undefined, atpeAssociationKey).allowed).toBe(false);
  expect(validateNormalizedCoverageAmount(library.site, product.id, "spouse", 15000, undefined, atpeAssociationKey).allowed).toBe(true);
  expect(validateNormalizedCoverageAmount(library.site, product.id, "spouse", 500000, undefined, "akron-bar-association").allowed).toBe(false);
  expect(resolveDependentCoverage(library.site, product.id, "spouse", { associationKey: atpeAssociationKey, amount: 500000, baseAmounts: { member: 100000 } })).toMatchObject({ allowed: true, notices: ["Dependent amount exceeds primary coverage cap"] });
  const spouse = resolveApplicationCoverage(product, "spouse", { membership: atpeAssociationKey, "spouse-birth-date": "1990-01-01", state: "PA" });
  expect(spouse.amounts).toContain(500000);
  expect(spouse.amounts).toContain(15000);
  expect(spouse.amounts).not.toContain(505000);
  const result = await evaluateCoverageJourney(library.site, { productKey: product.id, applicantKey: "member", mode: "new", amount: 100000, associationKey: atpeAssociationKey, membershipConfirmed: true, jurisdiction: "US-PA", eligibility: { ageYears: 55 }, election: { riders: [], riderAmounts: {} } }, { policies: createMockPolicyVerificationService([]) });
  expect(result.allowed).toBe(false);
  expect(result.errors).toContain("Applicant does not satisfy association eligibility");
  const edited = structuredClone(db);
  const row = edited.configurationValues.find(row => row.key === "isitrust.li-10yr.association-eligibility")!;
  row.value = { version: 9 };
  expect(resolveEffectiveEligibility(resolveEffectiveSite(edited, "isitrust"), product.id, "member", { ageYears: 30, associationKey: atpeAssociationKey }).status).toBe("unresolved");
  expect(validateMigrationDatabase(edited)).toContain(`Invalid association eligibility policy ${row.key}`);
});

it("uses dedicated ATPE adult ages and unmarried birth-through-25 child participation", () => {
  const library = resolvePrototypeLibrary(db, "isitrust", "atpe-age-boundaries"); installPrototypeLibrary(library);
  for (const productKey of ["li-group-term", "li-add", "sh-hospital-income", "sh-critical-illness", "li-50plus"]) for (const applicantKey of ["member", "spouse"]) {
    for (const [ageYears, eligible] of [[17, false], [18, true], [64, true], [65, false]] as const) expect(resolveEffectiveEligibility(library.site, productKey, applicantKey, { ageYears, associationKey: atpeAssociationKey, selectedPlans: [{ productKey, categoryKey: "LI", applicantKey: "member" }] })).toMatchObject({ status: "resolved", eligible });
  }
  for (const productKey of ["li-group-term", "sh-hospital-income"]) {
    for (const [ageYears, unmarried, eligible] of [[0, true, true], [25, true, true], [26, true, false], [15, false, false]] as const) expect(resolveEffectiveEligibility(library.site, productKey, "child", { ageYears, ageDays: ageYears * 366, unmarried, associationKey: atpeAssociationKey, selectedPlans: [{ productKey, categoryKey: productKey === "li-group-term" ? "LI" : "SH", applicantKey: "member" }] })).toMatchObject({ status: "resolved", eligible });
    expect(resolveEffectiveEligibility(library.site, productKey, "child", { ageYears: 10, ageDays: 3660, associationKey: atpeAssociationKey }).status).toBe("needs-information");
  }
  for (const ageYears of [19, 20, 54, 55]) expect(resolveEffectiveEligibility(library.site, "li-20yr", "member", { ageYears, associationKey: atpeAssociationKey })).toMatchObject({ status: "resolved", eligible: ageYears >= 20 && ageYears <= 54 });
  const graded = library.products.find(product => product.id === "li-50plus")!;
  expect(applicationCoverageName(graded, { membership: atpeAssociationKey })).toBe("Graded Benefit Life");
  expect(applicationCoverageName(graded, { membership: "akron-bar-association" })).toBe(graded.name);
  expect(resolveApplicationCoverage(graded, "member", { membership: atpeAssociationKey, "birth-date": dayjs().subtract(30, "year").format("YYYY-MM-DD"), state: "KS" }).eligibility).toBe("eligible");
  expect(resolveApplicationCoverage(graded, "member", { membership: "akron-bar-association", "birth-date": dayjs().subtract(30, "year").format("YYYY-MM-DD"), state: "KS" }).eligibility).toBe("eligible");
  for (const [ageYears, fullTimeStudent, eligible] of [[19, undefined, true], [20, true, true], [20, false, false], [26, true, true], [27, true, false]] as const) expect(resolveEffectiveEligibility(library.site, "li-add", "child", { ageYears, fullTimeStudent, associationKey: atpeAssociationKey, selectedPlans: [{ productKey: "li-add", categoryKey: "LI", applicantKey: "member" }] })).toMatchObject({ status: "resolved", eligible });
  expect(resolveEffectiveEligibility(library.site, "li-add", "child", { ageYears: 20, associationKey: atpeAssociationKey }).status).toBe("needs-information");
});
