import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { mcrSource, type SourceCell } from "./mcr";

const siteKey = "waepa", productKey = "li-group-term";
const policyKey = `${siteKey}.${productKey}.amount-cap-policy`;
const authority = "User-confirmed MCR amount authority and WAEPA Life decision, October 19, 2026";
const slices = [
  { applicant: "member", cell: "H379", minimum: 25000, maximum: 2000000, increment: 25000, caps: [1200000, 550000] },
  { applicant: "spouse", cell: "I379", minimum: 10000, maximum: 800000, increment: 10000, caps: [500000, 275000] },
] as const;
const meta = (table: string, key: string, source: string) => ({ id: key, key, ...libraryMetadata(table, key, source) });

/** New reviewed revisions only. Zero remains an explicit rider-only election;
 * child schedules and existing policy/service rules retain their prior scope. */
export function applyWaepaLifeAmountAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const site = db.sites.find(row => row.key === siteKey);
  if (!site || db.clients.find(row => row.id === site.clientId)?.key !== "waepa"
    || !db.siteProducts.some(row => row.siteId === site.id && row.productKey === productKey && row.enabled)) throw new Error("Missing WAEPA Life target");
  for (const slice of slices) {
    const expected = mcrSource.cells.filter(row => row.sheet === "Main" && row.cell === slice.cell);
    const actual = cells.filter(row => row.sheet === "Main" && row.cell === slice.cell);
    if (expected.length !== 1 || actual.length !== 1 || JSON.stringify(expected[0]) !== JSON.stringify(actual[0])
      || !db.sourceRequirements.some(row => row.key === `mcr.main.${slice.cell}`)) throw new Error(`WAEPA Life amount source changed: Main!${slice.cell}`);
    const rules = db.productAmountRules.filter(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantTypeKey === slice.applicant);
    if (rules.length !== 1 || rules[0].applicantClass !== null || rules[0].conditionKey !== null) throw new Error(`No unique WAEPA Life amount assignment: ${slice.applicant}`);
  }
  const limitKeys: string[] = [];
  for (const slice of slices) {
    const reference = `Main!${slice.cell}`;
    const rule = db.productAmountRules.find(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantTypeKey === slice.applicant)!;
    const prefix = `${siteKey}.${productKey}.mcr-amount.${slice.applicant}`;
    const patternKey = `${prefix}.pattern`, bandKey = `${patternKey}.band`, limitKey = `${prefix}.age-cap`;
    const evidenceKey = `ownership-evidence.${prefix}`;
    if (!db.semanticRequirements.some(row => row.key === evidenceKey)) db.semanticRequirements.push({ ...meta("semanticRequirements", evidenceKey, reference),
      domain: "information-ownership", subjectTable: "sites", subjectKey: siteKey, predicate: "mcr-life-amounts", status: "documented",
      value: { authority, productKey, applicantKey: slice.applicant, previousRule: JSON.parse(JSON.stringify(rule)),
        previousPattern: JSON.parse(JSON.stringify(db.coverageAmountPatterns.find(row => row.key === rule.amountPatternKey) ?? null)),
        previousBands: JSON.parse(JSON.stringify(db.amountBands.filter(row => row.amountPatternKey === rule.amountPatternKey))),
        previousOptions: JSON.parse(JSON.stringify(db.amountOptions.filter(row => row.amountPatternKey === rule.amountPatternKey))),
        zeroMeaning: "Explicit eligible rider-only election; ordinary base amounts start at the first positive increment.",
        sourceReferences: [reference], amountRuleKey: rule.key, limitKey } });
    db.coverageAmountPatterns = db.coverageAmountPatterns.filter(row => row.key !== patternKey);
    db.coverageAmountPatterns.push({ ...meta("coverageAmountPatterns", patternKey, reference), patternKey: "coverage-amount-options", amountType: "range",
      minimum: null, maximum: null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
    db.amountBands = db.amountBands.filter(row => row.amountPatternKey !== patternKey);
    db.amountBands.push({ ...meta("amountBands", bandKey, reference), amountPatternKey: patternKey,
      minimum: slice.minimum, maximum: slice.maximum, increment: slice.increment, conditionKey: null, position: 0 });
    rule.amountPatternKey = patternKey;
    rule.sourceReference = reference;
    db.aggregateLimits = db.aggregateLimits.filter(row => row.key !== limitKey);
    // No copied default maximum: ages below 60 use the structured base range.
    db.aggregateLimits.push({ ...meta("aggregateLimits", limitKey, reference), siteKey, productKey, categoryKey: "LI", applicantTypeKey: slice.applicant,
      maximum: null, formula: null, conditionKey: null });
    db.benefitCaps = db.benefitCaps.filter(row => row.aggregateLimitKey !== limitKey);
    for (const [position, maximum] of slice.caps.entries()) db.benefitCaps.push({ ...meta("benefitCaps", `${limitKey}.${position}`, reference), aggregateLimitKey: limitKey,
      minimumAgeYears: position === 0 ? 60 : 65, maximumAgeYears: position === 0 ? 64 : null, maximum,
      selfEmployedLessThanYears: null, requiredWaitingPeriod: null, requiredBenefitPeriod: null, position });
    limitKeys.push(limitKey);
    const targets = [
      { table: "productAmountRules", key: rule.key, column: "amountPatternKey" },
      ...["minimum", "maximum", "increment"].map(column => ({ table: "amountBands", key: bandKey, column })),
      ...[0, 1].flatMap(index => ["minimumAgeYears", "maximumAgeYears", "maximum"].map(column => ({ table: "benefitCaps", key: `${limitKey}.${index}`, column }))),
    ];
    for (const target of targets) {
      const key = `${prefix}.${target.table}.${target.key}.${target.column}`;
      db.requirementTargets = db.requirementTargets.filter(row => row.key !== key);
      db.requirementTargets.push({ ...meta("requirementTargets", key, reference), requirementKey: `mcr.main.${slice.cell}`, targetTable: target.table, targetKey: target.key, targetColumn: target.column });
    }
    const source = db.sourceRequirements.find(row => row.key === `mcr.main.${slice.cell}`)!;
    source.promotionState = "SITE_CONFIGURATION";
    source.promotionReason = `${authority}; base choices and age caps only. Other Life/rider/child requirements retain their separate decisions.`;
    source.activeSiteKeys = [...new Set([...(Array.isArray(source.activeSiteKeys) ? source.activeSiteKeys as string[] : []), siteKey])];
  }
  const reference = "Main!H379; Main!I379";
  db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== policyKey);
  db.configurationDefinitions.push({ ...meta("configurationDefinitions", policyKey, reference), position: 0,
    definition: { path: null, metadata: { authority }, target: { kind: "product-amount-cap-policy", productKey } } });
  db.configurationValues = db.configurationValues.filter(row => row.key !== policyKey);
  db.configurationValues.push({ ...meta("configurationValues", policyKey, reference), position: 0, scope: "site", siteKey, clientKey: null,
    configurationKey: policyKey, value: { version: 1, limitKeys } satisfies Json });
}
