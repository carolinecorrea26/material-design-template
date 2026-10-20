import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isBenefitPolicy, type BenefitPolicy, type BenefitApplicantPolicy } from "../domain/benefitPolicy";
import { applyActiveSiteNumericAdoption, type AmountSlice } from "./activeSiteNumericAdoption";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { mcrSource, type SourceCell } from "./mcr";
import { provisionalDecisionAuthority, provisionalDecisionReference } from "./provisionalSourceDecisions";

const waits = (...days: number[]) => days.map(day => ({ key: `${day}-days`, accidentDays: day, sicknessDays: day }));
const bands = (minimumAge: number, entries: [number, number][]) => entries.map(([maximumAge, maximum]) => { const band = { minimumAge, maximumAge, maximum }; minimumAge = maximumAge + 1; return band; });
const applicant = (applicantKey: string, minimum: number, maximum: number, increment: number, waitingDays: number[], benefitPeriods: string[] = []): BenefitApplicantPolicy => ({ applicantKey, minimum, maximum, increment, waitingPeriods: waits(...waitingDays), benefitPeriods });
type Slice = { siteKey: string; productKey: string; references: string[]; policy: BenefitPolicy };
const policy = (applicants: BenefitApplicantPolicy[], additions: Partial<Omit<BenefitPolicy, "applicants" | "version">> = {}): BenefitPolicy => ({ version: 1, applicants, exclusiveProducts: [], provisional: false, revisit: [], ...additions });
const abeProducts = ["di-ltd", "di-ltd-plus", "di-mtd"];

export const disabilityBenefitSlices: Slice[] = [
  ...abeProducts.map((productKey): Slice => ({ siteKey: "abe", productKey, references: ["Disability!A21", "Disability!D21", "Disability!D22", "Disability!A23", "Disability!D23", "Disability!F21"], policy: policy([
    { ...applicant("member", 100, 12000, 100, productKey === "di-ltd" ? [30, 60, 90, 180, 365] : productKey === "di-ltd-plus" ? [60, 90, 180, 365] : [14, 30, 60, 90, 180]), ageBands: bands(17, [[64, 12000]]), income: { fraction: .6, tiers: [{ threshold: 7500, inclusive: true, fraction: .6666 }], subtractExisting: false }, retirement: { minimum: 1000, maximum: 3500 } },
    { ...applicant("spouse", 100, 5000, 100, productKey === "di-mtd" ? [90, 180] : [90, 180, 365]), ageBands: bands(17, [[64, 5000]]), income: { fraction: .6666, subtractExisting: false }, requireMemberCoverage: true, memberBenefitMultiplier: 9 },
  ], { exclusiveProducts: productKey === "di-ltd" ? ["di-ltd-plus"] : productKey === "di-ltd-plus" ? ["di-ltd"] : [], aggregate: { productKeys: abeProducts, maximum: 12000, spouseMaximum: 5000, spouseIncomeFraction: .6666, compareMemberTotal: true, income: { fraction: .6, threshold: 7500, lowerFraction: .6666, thresholdInclusive: false }, excludeRetirement: true }, provisional: true, revisit: ["ABE calculation rows use .6666 while Main describes 66 2/3%; keep calculation precision provisionally.", "D21 uses <=7500 for the individual cap and D22 uses <7500 for the aggregate; preserve each threshold separately.", "D21/D23 are marked removed from the old portal, but active Main44–46 still reference D17; retain these working formulas for revisit."] }) })),
  { siteKey: "abe", productKey: "oo-professional", references: ["Main!H48"], policy: policy([{ ...applicant("member", 500, 10000, 100, [30], ["12-months"]), ageBands: bands(17, [[64, 10000]]), expenseCap: true }]) },
  ...["di-step-rated", "di-level-rated"].map((productKey): Slice => ({ siteKey: "ama", productKey, references: [`Main!H${productKey === "di-step-rated" ? 118 : 119}`, "Disability!A46", "Disability!D46", "Disability!E46", "Disability!F46", "Disability!G46", "Disability!D47"], policy: policy([
    { ...applicant("member", 100, 15000, 100, [60, 90, 180, 365], ["to-age-67"]), applicantClass: "practicing", ageBands: bands(17, [[54, 15000], [59, 5000]]), income: { fraction: 2 / 3, subtractExisting: true } },
    { ...applicant("member", 100, 5000, 100, [60, 90, 180, 365], ["to-age-67"]), applicantClass: "resident", ageBands: bands(17, [[39, 5000]]) },
  ], { aggregate: { productKeys: ["di-step-rated", "di-level-rated"], maximum: 15000 } }) })),
  { siteKey: "ama", productKey: "oo-office-overhead", references: ["Main!H125", "Overhead Expense!C2", "Overhead Expense!E2", "Overhead Expense!F2"], policy: policy([{ ...applicant("member", 1000, 20000, 1000, [30, 60, 90], ["6-months", "12-months", "24-months", "36-months"]), ageBands: bands(17, [[59, 20000]]) }], { provisional: true, revisit: ["MainH125 says $1000 increments; Overhead Expense C2 says $100. Prefer Main provisionally."] }) },
  { siteKey: "asce", productKey: "di-ltd", references: ["Disability!A11", "Disability!D11", "Disability!A12", "Disability!D12"], policy: policy([
    { ...applicant("member", 150, 8550, 150, [30, 90, 180, 365], ["5-years", "career"]), ageBands: bands(17, [[64, 8550], [69, 4200]]), income: { fraction: .6, subtractExisting: false }, selfEmployedOverride: { lessThanYears: 1, maximum: 1050, waitingDays: 90, benefitPeriod: "5-years" } },
    { ...applicant("spouse", 500, 500, 100, [30], ["2-years"]), ageBands: bands(17, [[59, 500]]), requireMemberCoverage: true },
  ]) },
  { siteKey: "avma", productKey: "di-ltd", references: ["Main!H192", "Main!I192", "Disability!A29", "Disability!D29", "Disability!F29", "Disability!G29"], policy: policy([
    { ...applicant("member", 1000, 12500, 100, [30, 90, 180, 60]), ageBands: bands(17, [[49, 12500], [54, 9000], [59, 6000], [69, 3000]]), income: { fraction: .6, subtractExisting: false } },
    { ...applicant("spouse", 500, 500, 100, [30], ["2-years"]), ageBands: bands(17, [[69, 500]]), requireMemberCoverage: true },
  ], { provisional: true, revisit: ["MainH192 lists $500 minimum; D29 and its new-applicant note establish $1000. Use $1000 for candidate new benefits; increases to existing policies need a separate mode."] }) },
  { siteKey: "avma", productKey: "di-ltd-plus", references: ["Main!H193", "Disability!A31", "Disability!D31"], policy: policy([{ ...applicant("member", 200, 2000, 100, [90], ["5-years", "10-years"]), ageBands: bands(17, [[49, 2000]]), loanPaymentCap: true }]) },
  { siteKey: "avma", productKey: "di-short-term", references: ["Main!H194", "Disability!A32", "Disability!D32", "Disability!F32"], policy: policy([{ ...applicant("member", 200, 5000, 100, [], ["6-months"]), ageBands: bands(17, [[54, 5000], [59, 3000], [64, 1500]]), income: { fraction: .7, subtractExisting: false }, waitingPeriods: [{ key: "day-1-accident-day-8-sickness", accidentDays: 0, sicknessDays: 7 }, ...waits(30)] }]) },
  { siteKey: "avma", productKey: "oo-professional", references: ["Main!H196", "Overhead Expense!A5", "Overhead Expense!C5", "Overhead Expense!D5", "Overhead Expense!E5"], policy: policy([{ ...applicant("member", 300, 45000, 100, [15, 30], ["12-months", "24-months"]), ageBands: bands(17, [[49, 45000], [59, 30000], [69, 10000]]), expenseCap: true, periodPairs: [{ waitingKey: "15-days", benefitPeriod: "12-months" }, { waitingKey: "30-days", benefitPeriod: "24-months" }] }]) },
  { siteKey: "isitrust", productKey: "di-ltd", references: ["Main!H279", "Disability!A69", "Disability!D69", "Disability!E69", "Disability!F69", "Disability!G69"], policy: policy([{ ...applicant("member", 500, 12000, 500, [60, 90, 180], ["2-years", "5-years", "to-age-65"]), ageBands: bands(18, [[54, 12000], [59, 10000]]), income: { fraction: .7, subtractExisting: false } }], { provisional: true, revisit: ["MainH279/DisabilityE69 say annual earned income, but the explicit E69 formula uses average monthly earnings. Use 70% of monthly earnings provisionally."] }) },
  { siteKey: "isitrust", productKey: "oo-professional", references: ["Main!H280"], policy: policy([{ ...applicant("member", 500, 20000, 500, [15, 30]), ageBands: bands(18, [[54, 20000], [59, 10000]]) }]) },
  { siteKey: "isitrust", productKey: "di-short-term", references: ["Main!H281", "Disability!A70", "Disability!D70", "Disability!E70", "Disability!F70", "Disability!G70"], policy: policy([{ ...applicant("member", 100, 3700, 100, [], ["26-weeks"]), ageBands: bands(18, [[59, 3700], [64, 1300]]), waitingPeriods: [{ key: "0-days-accident-7-days-sickness", accidentDays: 0, sicknessDays: 7 }] }]) },
  { siteKey: "nso", productKey: "di-ltd", references: ["Main!H321", "Disability!A35", "Disability!D35", "Disability!F35", "Disability!G35"], policy: policy([{ ...applicant("member", 500, 5000, 100, [30, 60, 90], ["2-years", "5-years"]), ageBands: bands(17, [[59, 5000]]), income: { fraction: .6, subtractExisting: false } }], { provisional: true, revisit: ["Maximum entry age 59 follows the user-authorized provisional O321 decision."] }) },
  { siteKey: "waepa", productKey: "di-short-term", references: ["Main!H380", "Main!O380", "Disability!A58", "Disability!D58", "Disability!E58", "Disability!F58"], policy: policy([{ ...applicant("member", 100, 6500, 100, [14, 30]), ageBands: bands(18, [[64, 6500]]), income: { fraction: .6, subtractExisting: false } }], { provisional: true, revisit: ["MainO380 allows entry through64 while DisabilityD58 describes benefits through69. Apply the Main entry-age limit; revisit existing-policy increase mode."] }) },
];

const metadata = (table: string, key: string, reference: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });
export function applyDisabilityBenefitAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const actual = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const expected = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  for (const slice of disabilityBenefitSlices) {
    if (!isBenefitPolicy(slice.policy)) throw new Error(`Invalid reviewed benefit policy: ${slice.siteKey}.${slice.productKey}`);
    for (const reference of slice.references) if (!expected.has(reference) || JSON.stringify(actual.get(reference)) !== JSON.stringify(expected.get(reference)) || !db.sourceRequirements.some(row => `${db.sourceSheets.find(sheet => sheet.key === row.sheetKey)?.name}!${row.cell}` === reference)) throw new Error(`Benefit source changed: ${reference}`);
  }
  const numeric: AmountSlice[] = disabilityBenefitSlices.map(slice => ({ siteKey: slice.siteKey, productKey: slice.productKey, amounts: ["member", "spouse", "child"].map(applicantKey => {
    const rows = slice.policy.applicants.filter(row => row.applicantKey === applicantKey);
    if (!rows.length) return null;
    const minimum = Math.min(...rows.map(row => row.minimum)), maximum = Math.max(...rows.map(row => row.maximum));
    return minimum === maximum ? [minimum] : { kind: "range", minimum, maximum, increment: rows[0].increment };
  }) as unknown as AmountSlice["amounts"] }));
  applyActiveSiteNumericAdoption(db, cells, numeric);
  for (const slice of disabilityBenefitSlices) {
    const key = `${slice.siteKey}.${slice.productKey}.reviewed-benefit-policy`;
    const mainRow = activeSiteMainRows[slice.siteKey][slice.productKey];
    const references = [...new Set([`Main!H${mainRow}`, `Main!I${mainRow}`, `Main!J${mainRow}`, ...slice.references])];
    const reference = references.join("; ");
    db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== key);
    db.configurationDefinitions.push({ ...metadata("configurationDefinitions", key, reference), definition: { path: null, metadata: { version: 1, adoptedDimension: "benefits", fullPolicyAcceptance: "pending" }, target: { kind: "product-benefit-policy", productKey: slice.productKey } }, position: 0 });
    db.configurationValues = db.configurationValues.filter(row => row.key !== key);
    db.configurationValues.push({ ...metadata("configurationValues", key, reference), scope: "site", clientKey: null, siteKey: slice.siteKey, configurationKey: key, value: slice.policy as unknown as Json, position: 0 });
    const decisionKey = `migration-decision.${key}`;
    db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
    db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, reference), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: slice.siteKey, predicate: "executable-benefit-dimensions", status: "partial", value: { productKey: slice.productKey, policyVersion: 1, destinations: [{ table: "configurationValues", key, column: "value" }], runtimeActivation: "pending", fullPolicyAcceptance: "pending", implementedDimensions: ["Numeric choices", "Age/class benefit caps", "Applicable income/expense/loan calculations", "Period choices and coupling", "Applicable dependencies/exclusions/aggregates", "Recalculation and election cleanup"], provisional: slice.policy.provisional, revisit: slice.policy.revisit } });
    if (slice.policy.provisional) {
      const provisionalKey = `provisional-decision.${slice.siteKey}.${slice.productKey}.benefit-calculation`;
      db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== provisionalKey);
      db.semanticRequirements.push({ ...metadata("semanticRequirements", provisionalKey, provisionalDecisionReference), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: slice.siteKey, predicate: "benefit-calculation", status: "documented", value: { authority: provisionalDecisionAuthority, adoptedOn: "2026-10-02", sourceReconciliation: "deferred", revisit: true, issues: slice.policy.revisit, selected: slice.policy as unknown as Json, sourceReferences: references, destinations: [{ table: "configurationValues", key, column: "value" }], runtimeActivation: "pending", reference: provisionalDecisionReference } });
    }
    for (const sourceReference of references) {
      const requirement = db.sourceRequirements.find(row => `${db.sourceSheets.find(sheet => sheet.key === row.sheetKey)?.name}!${row.cell}` === sourceReference)!;
      requirement.promotionState = "SITE_CONFIGURATION";
      requirement.promotionReason = "Executable benefit dimensions adopted; health, residency, riders and full product acceptance remain separate gates.";
      requirement.activeSiteKeys = [...new Set([...(Array.isArray(requirement.activeSiteKeys) ? requirement.activeSiteKeys as string[] : []), slice.siteKey])];
      const targetKey = `${decisionKey}.${requirement.key}`;
      db.requirementTargets = db.requirementTargets.filter(row => row.key !== targetKey);
      db.requirementTargets.push({ ...metadata("requirementTargets", targetKey, sourceReference), requirementKey: requirement.key, targetTable: "configurationValues", targetKey: key, targetColumn: "value" });
    }
  }
}
