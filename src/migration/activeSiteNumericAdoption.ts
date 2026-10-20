import type { DatabaseSchema, TableName } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMainRows, reviewActiveSiteIdentities } from "./activeSiteIdentity";
import { mcrSource, type SourceCell } from "./mcr";

type Selection = { kind: "range"; minimum: number; maximum: number; increment: number } | readonly number[] | null;
export type AmountSlice = { siteKey: string; productKey: string; amounts: readonly [Selection, Selection, Selection] };
const range = (minimum: number, maximum: number, increment: number): Selection => ({ kind: "range", minimum, maximum, increment });
/** Explicit numeric-dimension review. Prose around these numbers remains separately
 * applicable: this manifest does not flatten income, age, class or dependent caps.
 * Products whose numeric choices themselves are conditional stay outside this slice.
 */
export const activeNumericSlices: readonly AmountSlice[] = [
  { siteKey: "abe", productKey: "li-term", amounts: [range(20000, 2000000, 10000), range(20000, 2000000, 10000), range(5000, 25000, 5000)] },
  { siteKey: "abe", productKey: "li-10yr", amounts: [range(100000, 2000000, 10000), range(100000, 2000000, 10000), range(5000, 25000, 5000)] },
  { siteKey: "abe", productKey: "li-20yr", amounts: [range(100000, 2000000, 10000), range(100000, 2000000, 10000), range(5000, 25000, 5000)] },
  { siteKey: "abe", productKey: "li-50plus", amounts: [range(25000, 100000, 1000), range(25000, 100000, 1000), null] },
  { siteKey: "abe", productKey: "li-add", amounts: [range(100000, 500000, 50000), range(100000, 500000, 50000), [25000, 50000]] },
  { siteKey: "abe", productKey: "sh-critical-illness", amounts: [range(5000, 100000, 5000), range(5000, 100000, 5000), null] },
  { siteKey: "abe", productKey: "sh-hospital-money", amounts: [range(200, 500, 50), range(200, 500, 50), range(200, 500, 50)] },
  { siteKey: "ama", productKey: "li-10yr", amounts: [range(100000, 4000000, 25000), range(100000, 4000000, 25000), [25000]] },
  { siteKey: "ama", productKey: "li-15yr", amounts: [range(100000, 4000000, 25000), range(100000, 4000000, 25000), [25000]] },
  { siteKey: "ama", productKey: "li-20yr", amounts: [range(100000, 4000000, 25000), range(100000, 4000000, 25000), [25000]] },
  { siteKey: "ama", productKey: "li-term", amounts: [range(100000, 1000000, 25000), range(100000, 1000000, 25000), null] },
  // Preferred child age conflicts H/J/Q124 remain unresolved; no child age adopted.
  { siteKey: "ama", productKey: "li-preferred", amounts: [range(25000, 3000000, 25000), range(25000, 3000000, 25000), [25000]] },
  { siteKey: "asce", productKey: "li-10yr", amounts: [range(100000, 2000000, 10000), range(100000, 2000000, 10000), [10000]] },
  { siteKey: "asce", productKey: "li-20yr", amounts: [range(100000, 2000000, 10000), range(100000, 2000000, 10000), [10000]] },
  { siteKey: "asce", productKey: "li-add", amounts: [range(50000, 500000, 50000), range(50000, 250000, 50000), [10000]] },
  { siteKey: "avma", productKey: "li-10yr", amounts: [range(100000, 2000000, 10000), range(100000, 1000000, 10000), [5000, 10000]] },
  { siteKey: "avma", productKey: "li-20yr", amounts: [range(100000, 2000000, 10000), range(100000, 1000000, 10000), [5000, 10000]] },
  { siteKey: "avma", productKey: "li-50plus", amounts: [range(25000, 100000, 1000), range(25000, 100000, 1000), null] },
  { siteKey: "avma", productKey: "li-add", amounts: [range(10000, 200000, 10000), range(10000, 100000, 10000), null] },
  { siteKey: "avma", productKey: "sh-critical-illness", amounts: [range(10000, 100000, 5000), range(10000, 100000, 5000), null] },
  { siteKey: "avma", productKey: "sh-hospital-income", amounts: [range(100, 400, 50), range(100, 400, 50), range(100, 200, 50)] },
];
const metadata = (table: string, key: string, source: string) => ({ id: key, key, ...libraryMetadata(table, key, source) });

export function applyActiveSiteNumericAdoption(db: DatabaseSchema, cells: readonly SourceCell[], slices: readonly AmountSlice[] = activeNumericSlices) {
  // Validate *all* evidence before the first mutation. Never accept a changed source
  // with the same cell address, or turn an extracted candidate into a scope decision.
  reviewActiveSiteIdentities(db, cells);
  const source = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  for (const slice of slices) {
    const row = activeSiteMainRows[slice.siteKey][slice.productKey];
    for (const column of ["H", "I", "J"]) {
      const reference = `Main!${column}${row}`;
      const expected = mcrSource.cells.find(cell => cell.sheet === "Main" && cell.cell === `${column}${row}`);
      const actual = source.get(reference);
      if (!expected || !actual || JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Numeric adoption source changed: ${reference}`);
    }
  }
  for (const slice of slices) {
    const { siteKey, productKey } = slice;
    const row = activeSiteMainRows[siteKey][productKey];
    const prefix = `${siteKey}.${productKey}.reviewed-numeric`;
    const targets: Array<{ table: TableName; key: string; column: string; reference: string }> = [];
    db.productAmountRules = db.productAmountRules.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    db.productApplicantEligibility = db.productApplicantEligibility.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    db.siteProductApplicants = db.siteProductApplicants.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    for (const [position, applicantTypeKey] of ["member", "spouse", "child"].entries()) {
      const selection = slice.amounts[position];
      const reference = `Main!${["H", "I", "J"][position]}${row}`;
      const key = `${prefix}.${applicantTypeKey}`;
      db.productApplicantEligibility.push({ ...metadata("productApplicantEligibility", key, reference), siteKey, productKey, applicantTypeKey, eligible: selection !== null, conditionKey: null });
      targets.push({ table: "productApplicantEligibility", key, column: "eligible", reference });
      if (selection === null) continue;
      db.siteProductApplicants.push({ ...metadata("siteProductApplicants", key, reference), siteKey, productKey, applicantKey: applicantTypeKey, position });
      targets.push({ table: "siteProductApplicants", key, column: "applicantKey", reference });
      const patternKey = `${key}.pattern`;
      const isRange = "kind" in selection;
      db.coverageAmountPatterns = db.coverageAmountPatterns.filter(pattern => pattern.key !== patternKey);
      db.amountBands = db.amountBands.filter(band => band.amountPatternKey !== patternKey);
      db.amountOptions = db.amountOptions.filter(option => option.amountPatternKey !== patternKey);
      db.coverageAmountPatterns.push({ ...metadata("coverageAmountPatterns", patternKey, reference), patternKey: "coverage-amount-options", amountType: isRange ? "range" : selection.length === 1 ? "fixed" : "set", minimum: isRange ? null : Math.min(...selection), maximum: isRange ? null : Math.max(...selection), increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
      if (isRange) {
        const bandKey = `${patternKey}.band`;
        db.amountBands.push({ ...metadata("amountBands", bandKey, reference), amountPatternKey: patternKey, minimum: selection.minimum, maximum: selection.maximum, increment: selection.increment, conditionKey: null, position: 0 });
        for (const column of ["minimum", "maximum", "increment"]) targets.push({ table: "amountBands", key: bandKey, column, reference });
      } else if (selection.length > 1) for (const [index, value] of selection.entries()) {
        const optionKey = `${patternKey}.${index}`;
        db.amountOptions.push({ ...metadata("amountOptions", optionKey, reference), amountPatternKey: patternKey, value: String(value), label: String(value), position: index });
        targets.push({ table: "amountOptions", key: optionKey, column: "value", reference });
      }
      const ruleKey = `${key}.amount`;
      db.productAmountRules.push({ ...metadata("productAmountRules", ruleKey, reference), siteKey, clientKey: null, productKey, applicantTypeKey, applicantClass: null, amountPatternKey: patternKey, conditionKey: null, position });
      targets.push({ table: "coverageAmountPatterns", key: patternKey, column: "amountType", reference }, { table: "productAmountRules", key: ruleKey, column: "amountPatternKey", reference });
    }
    const decisionKey = `migration-decision.${prefix}`;
    for (const target of targets) {
      const requirementKey = `mcr.main.${target.reference.split("!")[1]}`;
      const requirement = db.sourceRequirements.find(requirement => requirement.key === requirementKey);
      if (!requirement) throw new Error(`Missing source requirement: ${requirementKey}`);
      requirement.promotionState = "SITE_CONFIGURATION";
      requirement.promotionReason = "Numeric choice/applicant presence dimension adopted only; conditional policy and full Site parity remain pending.";
      requirement.activeSiteKeys = [...new Set([...(Array.isArray(requirement.activeSiteKeys) ? requirement.activeSiteKeys as string[] : []), siteKey])];
      const key = `${decisionKey}.${target.table}.${target.key}.${target.column}`;
      db.requirementTargets = db.requirementTargets.filter(target => target.key !== key);
      db.requirementTargets.push({ ...metadata("requirementTargets", key, target.reference), requirementKey, targetTable: target.table, targetKey: target.key, targetColumn: target.column });
    }
    db.semanticRequirements = db.semanticRequirements.filter(requirement => requirement.key !== decisionKey);
    db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, `Main!H${row}:J${row}`), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: siteKey, predicate: "numeric-choice-dimension", status: "partial", value: { productKey, sourceRow: row, runtimeActivation: "pending", fullPolicyAcceptance: "pending", pendingDomains: ["Conditional eligibility/applicant classes", "Dependent caps and existing coverage", "Income/aggregate limits", "Health/riders/residency/payment/rates"] } });
  }
}
