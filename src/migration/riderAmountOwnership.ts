import type { DatabaseSchema, Json } from "../persistence/types";
import { isSelectionPolicy, type RiderAmount } from "../domain/coverageSelectionPolicy";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { mcrSource, type SourceCell } from "./mcr";

const sourceRows: Record<string, { row: number; member: [number, number, number]; spouse?: [number, number, number] }> = {
  "rider.asce.r37": { row: 43, member: [50000, 1000000, 50000], spouse: [25000, 1000000, 25000] },
  "rider.ama.r39": { row: 45, member: [25000, 1000000, 25000], spouse: [25000, 1000000, 1000] },
  "rider.ama.r40": { row: 46, member: [25000, 1000000, 25000], spouse: [25000, 1000000, 1000] },
  "rider.avma.r32": { row: 36, member: [100, 7000, 100] },
};

const authority = "Rider amount ownership continuation, October 19, 2026";
const meta = (table: string, key: string, source = authority) => ({ id: key, key, ...libraryMetadata(table, key, source) });

/** New reviewed exports only. Preserve current candidate amounts and source
 * dispositions; do not promote provisional caps or missing MCR evidence. */
export function consolidateRiderAmountOwnership(db: DatabaseSchema, cells: readonly SourceCell[] = mcrSource.cells) {
  // Verify pinned amount/cap evidence and current choices before writing anything.
  // CSEA's attached spouse benefit keeps its accepted distinct decision; R25 is
  // standalone AD&D evidence and must not be substituted for that benefit.
  for (const { row } of Object.values(sourceRows)) for (const column of ["C", "D", "G", "H"]) {
    const reference = `${column}${row}`;
    const expected = mcrSource.cells.filter(cell => cell.sheet === "Riders" && cell.cell === reference);
    const actual = cells.filter(cell => cell.sheet === "Riders" && cell.cell === reference);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Rider amount source changed: Riders!${reference}`);
  }
  for (const configuration of db.configurationValues) {
    const target = db.configurationDefinitions.find(row => row.key === configuration.configurationKey)?.definition.target;
    if (target?.kind !== "product-selection-policy" || !activeSiteMigrationScope.sites.some(site => site.mcrRequired && site.key === configuration.siteKey) || !isSelectionPolicy(configuration.value)) continue;
    for (const rider of configuration.value.riders) {
      const source = sourceRows[rider.key];
      if (!source) {
        const choices = [rider.amount, ...Object.values(rider.amountByApplicant ?? {})].filter(amount => amount.kind === "choices");
        if (choices.length && (rider.key !== "csea.spouse-accident" || choices.some(amount => JSON.stringify(amount.values) !== "[500,1000]"))) throw new Error(`Unmapped rider amount decision: ${rider.key}`);
        continue;
      }
      for (const [applicant, dimensions] of [["member", source.member], ["spouse", source.spouse]] as const) {
        if (!dimensions) continue;
        const [min, max, step] = dimensions;
        const expected = Array.from({ length: (max - min) / step + 1 }, (_, i) => min + i * step);
        const amount = rider.amountByApplicant?.[applicant] ?? rider.amount;
        if (amount.kind !== "choices" || JSON.stringify(amount.values) !== JSON.stringify(expected)) throw new Error(`Rider amount differs from source: ${rider.key}/${applicant}`);
      }
      const cap = source.row === 36 ? { baseFraction: 1, combinedMaximum: 12500, minimumNewAmount: 500 } : { baseFraction: 1 };
      if (JSON.stringify(rider.amountCap) !== JSON.stringify(cap)) throw new Error(`Rider cap differs from source: ${rider.key}`);
    }
  }
  for (const configuration of db.configurationValues) {
    const target = db.configurationDefinitions.find(row => row.key === configuration.configurationKey)?.definition.target;
    if (target?.kind !== "product-selection-policy" || !activeSiteMigrationScope.sites.some(site => site.mcrRequired && site.key === configuration.siteKey)) continue;
    const policy = configuration.value;
    if (!isSelectionPolicy(policy) || !policy.riders.some(r => r.amount.kind === "choices" || Object.values(r.amountByApplicant ?? {}).some(a => a.kind === "choices"))) continue;
    const siteKey = configuration.siteKey;
    if (!siteKey) throw new Error("Missing rider amount Site");
    const previousRules = db.riderAmountRules.filter(row => policy.riders.some(r => r.key === row.riderKey) && row.baseProductKey === target.productKey);
    const keys: string[] = [];
    const riders = policy.riders.map(rider => {
      const link = (amount: RiderAmount, applicant: string | null) => {
        if (amount.kind !== "choices") return amount;
        const key = `ownership.${siteKey}.${target.productKey}.${rider.key}.${applicant ?? "all"}.choices`;
        keys.push(key);
        const patternKey = `${key}.pattern`;
        const mapping = sourceRows[rider.key];
        const source = mapping ? `Riders!${applicant === "spouse" ? "D" : "C"}${mapping.row}` : "Preserved provisional CSEA attached spouse accident benefit; src/migration/cseaBenefitAdoption.ts";
        const differences = amount.values.slice(1).map((value, i) => value - amount.values[i]);
        const increment = differences[0];
        const range = differences.length > 0 && increment > 0 && differences.every(n => n === increment);
        db.riderAmountRules = db.riderAmountRules.filter(row => row.key !== key);
        db.riderAmountRules.push({ ...meta("riderAmountRules", key, source), riderKey: rider.key, baseProductKey: target.productKey,
          applicantTypeKey: applicant, amountPatternKey: patternKey, conditionKey: null });
        db.coverageAmountPatterns = db.coverageAmountPatterns.filter(row => row.key !== patternKey);
        db.amountBands = db.amountBands.filter(row => row.amountPatternKey !== patternKey);
        db.amountOptions = db.amountOptions.filter(row => row.amountPatternKey !== patternKey);
        db.coverageAmountPatterns.push({ ...meta("coverageAmountPatterns", patternKey, source), patternKey: "coverage-amount-options", amountType: range ? "range" : "set",
          minimum: null, maximum: null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
        if (range) db.amountBands.push({ ...meta("amountBands", `${patternKey}.band`, source), amountPatternKey: patternKey, minimum: amount.values[0],
          maximum: amount.values[amount.values.length - 1], increment, conditionKey: null, position: 0 });
        else db.amountOptions.push(...amount.values.map((value, position) => ({ ...meta("amountOptions", `${patternKey}.${position}`, source), amountPatternKey: patternKey, value: String(value), label: String(value), position })));
        return { kind: "rule", key, default: amount.default };
      };
      return { ...rider, amount: link(rider.amount, null), ...(rider.amountByApplicant ? { amountByApplicant: Object.fromEntries(Object.entries(rider.amountByApplicant).map(([applicant, amount]) => [applicant, link(amount, applicant)])) } : {}) };
    });
    const evidenceKey = `ownership-evidence.${configuration.key}.rider-amounts`;
    if (!db.semanticRequirements.some(row => row.key === evidenceKey)) db.semanticRequirements.push({ ...meta("semanticRequirements", evidenceKey), domain: "information-ownership",
      subjectTable: "sites", subjectKey: siteKey, predicate: "structured-rider-amounts", status: "documented", value: { authority, previousPolicy: JSON.parse(JSON.stringify(policy)),
        previousRules: JSON.parse(JSON.stringify(previousRules)), amountRuleKeys: keys,
        sourceReferences: [...new Set(policy.riders.flatMap(rider => sourceRows[rider.key] ? [`Riders!C${sourceRows[rider.key].row}`, ...(sourceRows[rider.key].spouse ? [`Riders!D${sourceRows[rider.key].row}`] : [])] : []))],
        disposition: "Choices and caps checked against pinned MCR rows where mapped; CSEA retains its accepted attached-benefit decision. Preserve provisional notices; selection policy owns caps, dependencies, election defaults and applicability." } });
    // Stable-identity amount copies are superseded. Original source identities
    // and their patterns remain evidence, outside the explicit reference contract.
    db.riderAmountRules = db.riderAmountRules.filter(row => !previousRules.includes(row) || keys.includes(row.key));
    configuration.value = JSON.parse(JSON.stringify({ ...policy, version: 2, amountSource: "rider-amount-rules", riders })) as Json;
  }
}
