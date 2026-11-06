import type { DatabaseSchema, Json, TableName } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { mcrSource, type SourceCell } from "./mcr";

export const provisionalDecisionReference = "docs/step3-provisional-decisions.md";
export const provisionalDecisionAuthority = 'User, October 2, 2026: "these can all be ignored for now (take whatever value if a value is needed and note in docs it needs to be revisited)"';
const metadata = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, provisionalDecisionReference) });
type Destination = { table: TableName; key: string; column: string };

/** Working choices authorized by the user. Literal workbook values/classifications
 * are retained; these records do not assert that conflicting sources agree.
 */
export function applyProvisionalSourceDecisions(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const actual = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const expected = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const references = ["B246", "E246", "G246", "O246", "O321", "R321", "O189", "P189", "J124", "Q124", "D286", "H286", "I286", "J286", "O286", "P286", "AH318", "AI318"].map(cell => `Main!${cell}`);
  for (const reference of references) if (!actual.has(reference) || JSON.stringify(actual.get(reference)) !== JSON.stringify(expected.get(reference)) || !db.sourceRequirements.some(row => row.sheetKey === "main" && `Main!${row.cell}` === reference)) throw new Error(`Provisional source changed: ${reference}`);
  for (const scoped of activeSiteMigrationScope.sites) {
    const sites = db.sites.filter(site => site.key === scoped.key);
    if (sites.length !== 1 || db.clients.find(client => client.id === sites[0].clientId)?.key !== scoped.clientKey) throw new Error(`Invalid provisional Site: ${scoped.key}`);
  }
  const decision = (siteKey: string, suffix: string, issue: string, selected: Json, sourceReferences: string[], destinations: Destination[]) => {
    const key = `provisional-decision.${siteKey}.${suffix}`;
    db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== key);
    db.semanticRequirements.push({ ...metadata("semanticRequirements", key), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: siteKey, predicate: suffix, status: "documented", value: {
      authority: provisionalDecisionAuthority, adoptedOn: "2026-10-02", sourceReconciliation: "deferred", revisit: true,
      issue, selected, sourceReferences, destinations, runtimeActivation: "pending", reference: provisionalDecisionReference,
    } });
    // Link the disputed evidence to the selected targets, without changing the
    // literal source label, age text, owner, or extraction classification.
    for (const reference of sourceReferences) {
      const [sheet, cell] = reference.split("!");
      if (sheet !== "Main") continue;
      const requirement = db.sourceRequirements.find(row => row.sheetKey === "main" && row.cell === cell);
      if (!requirement) throw new Error(`Missing provisional source: ${reference}`);
      requirement.promotionState = "SITE_CONFIGURATION";
      requirement.promotionReason = `Provisional working decision ${key}; source reconciliation deferred by user. ${provisionalDecisionReference}`;
      requirement.activeSiteKeys = [...new Set([...(Array.isArray(requirement.activeSiteKeys) ? requirement.activeSiteKeys as string[] : []), siteKey])];
      for (const destination of destinations) {
        const targetKey = `${key}.${cell}.${destination.table}.${destination.key}.${destination.column}`;
        db.requirementTargets = db.requirementTargets.filter(row => row.key !== targetKey);
        db.requirementTargets.push({ ...metadata("requirementTargets", targetKey), requirementKey: requirement.key, targetTable: destination.table, targetKey: destination.key, targetColumn: destination.column });
      }
    }
  };
  const age = (siteKey: string, productKey: string, applicantTypeKey: string, minimumAgeYears: number | null, maximumAgeYears: number, overrides: { minimumAgeDays?: number; studentMaximumAgeYears?: number | null; minimumWorkHours?: number } = {}) => {
    const previous = db.eligibilityConstraints.find(row => row.siteKey === siteKey && row.productKey === productKey && row.applicantTypeKey === applicantTypeKey);
    // Keep existing canonical destinations valid when a provisional choice
    // supersedes an earlier reviewed age slice.
    const key = previous?.key ?? `${siteKey}.${productKey}.provisional-age.${applicantTypeKey}`;
    db.eligibilityConstraints = db.eligibilityConstraints.filter(row => row.siteKey !== siteKey || row.productKey !== productKey || row.applicantTypeKey !== applicantTypeKey);
    db.eligibilityConstraints.push({ ...metadata("eligibilityConstraints", key), siteKey, productKey, applicantTypeKey,
      ...(previous && db.semanticRequirements.some(row => row.domain === "reviewed-work-eligibility" && row.subjectKey === key) ? { sourceReference: previous.sourceReference } : {}),
      minimumAgeDays: previous?.minimumAgeDays ?? null, minimumAgeYears, maximumAgeYears,
      studentMaximumAgeYears: previous?.studentMaximumAgeYears ?? null,
      minimumWorkHours: previous?.minimumWorkHours ?? null, ...overrides,
    });
    return { table: "eligibilityConstraints", key, column: "maximumAgeYears" } satisfies Destination;
  };
  const configuration = (siteKey: string, productKey: string, suffix: string, kind: "product-rate-outcome" | "product-rating-adjustments", value: Json) => {
    const key = `${siteKey}.${productKey}.${suffix}`;
    db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== key);
    db.configurationDefinitions.push({ ...metadata("configurationDefinitions", key), definition: { path: null, metadata: { provisional: true, revisit: true }, target: { kind, productKey } }, position: 0 });
    db.configurationValues = db.configurationValues.filter(row => row.key !== key);
    db.configurationValues.push({ ...metadata("configurationValues", key), scope: "site", clientKey: null, siteKey, configurationKey: key, value, position: 0 });
    return { table: "configurationValues", key, column: "value" } satisfies Destination;
  };

  const cseaIdentifiers: Destination[] = [];
  for (const [kind, primary] of [["gNumber", "G-11628-0"], ["planCode", "601"]] as const) {
    const key = `csea.di-ltd.provisional-identity.${kind}`;
    db.productIdentifiers = db.productIdentifiers.filter(row => !(row.scope === "site" && row.siteKey === "csea" && row.productKey === "di-ltd" && row.kind === kind));
    db.productIdentifiers.push({ ...metadata("productIdentifiers", key), scope: "site", clientKey: null, siteKey: "csea", productKey: "di-ltd", kind, definition: { primary }, position: 0 });
    cseaIdentifiers.push({ table: "productIdentifiers", key, column: "definition" });
  }
  const cseaAge = age("csea", "di-ltd", "member", 17, 65);
  decision("csea", "identity", "Main row 246 is labeled CSEA GI although its dependent benefits match standard CSEA cross-sheet evidence.", { sourceRow: 246, productKey: "di-ltd", gNumber: "G-11628-0", planCode: "601", siteVariant: "standard" }, ["Main!B246", "Main!E246", "Main!G246", "Main!O246"], [...cseaIdentifiers, cseaAge]);

  const nsoAge = age("nso", "di-ltd", "member", 17, 59, { minimumWorkHours: 20 });
  decision("nso", "disability-entry-age", "Main O321 contains both 64 and 59; use 59 provisionally. The work requirement is 20 hours in R321.", { minimumAgeYears: 17, maximumAgeYears: 59, minimumWorkHours: 20 }, ["Main!O321", "Main!R321"], [nsoAge]);
  const avmaAges = ["member", "spouse"].map(applicant => age("avma", "li-20yr", applicant, 17, 59));
  decision("avma", "20-year-entry-age", "Main O189/P189 contain both 69 and 59; use 59 provisionally.", { minimumAgeYears: 17, maximumAgeYears: 59 }, ["Main!O189", "Main!P189"], avmaAges);
  const amaAge = age("ama", "li-preferred", "child", null, 26, { minimumAgeDays: 14, studentMaximumAgeYears: null });
  decision("ama", "preferred-child-age", "J124 conflicts with Q124; use Q124's 14 days through age 26 without a student extension provisionally.", { minimumAgeDays: 14, maximumAgeYears: 26, fullTimeStudentRequired: false }, ["Main!J124", "Main!Q124"], [amaAge]);

  const nsoFeeTargets = ["li-term", "li-50plus", "li-add", "di-ltd", "li-10yr", "li-20yr"].map(productKey => configuration("nso", productKey, "provisional-billing-fee", "product-rating-adjustments", { billMeFee: 0, provisional: true, revisit: true }));
  decision("nso", "billing-fee", "The Direct Bill fee awaits source confirmation; apply a zero fee provisionally.", { billMeFee: 0 }, ["Main!AH318", "Main!AI318"], nsoFeeTargets);
  const amaCredit = configuration("ama", "li-term", "provisional-term-credit", "product-rating-adjustments", { premiumCredit: 0, provisional: true, revisit: true });
  decision("ama", "term-member-credit", "Term member-credit wording remains ambiguous; use zero rather than borrowing another product's credit.", { premiumCredit: 0 }, [], [amaCredit]);

  const isiKey = "isitrust.sh-critical-illness.provisional-amount";
  const isiTargets: Destination[] = [];
  db.productAmountRules = db.productAmountRules.filter(row => row.siteKey !== "isitrust" || row.productKey !== "sh-critical-illness");
  db.siteProductApplicants = db.siteProductApplicants.filter(row => row.siteKey !== "isitrust" || row.productKey !== "sh-critical-illness");
  db.productApplicantEligibility = db.productApplicantEligibility.filter(row => row.siteKey !== "isitrust" || row.productKey !== "sh-critical-illness");
  for (const [position, applicantTypeKey] of ["member", "spouse", "child"].entries()) {
    const key = `${isiKey}.${applicantTypeKey}`;
    const available = applicantTypeKey !== "child";
    db.productApplicantEligibility.push({ ...metadata("productApplicantEligibility", key), siteKey: "isitrust", productKey: "sh-critical-illness", applicantTypeKey, eligible: available, conditionKey: null });
    isiTargets.push({ table: "productApplicantEligibility", key, column: "eligible" });
    if (!available) continue;
    db.siteProductApplicants.push({ ...metadata("siteProductApplicants", key), siteKey: "isitrust", productKey: "sh-critical-illness", applicantKey: applicantTypeKey, position });
    const patternKey = `${key}.pattern`;
    db.coverageAmountPatterns = db.coverageAmountPatterns.filter(row => row.key !== patternKey);
    db.coverageAmountPatterns.push({ ...metadata("coverageAmountPatterns", patternKey), patternKey: "coverage-amount-options", amountType: "range", minimum: null, maximum: null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
    db.amountBands = db.amountBands.filter(row => row.amountPatternKey !== patternKey);
    const bandKey = `${patternKey}.band`;
    db.amountBands.push({ ...metadata("amountBands", bandKey), amountPatternKey: patternKey, minimum: 5000, maximum: 100000, increment: 5000, conditionKey: null, position: 0 });
    db.productAmountRules.push({ ...metadata("productAmountRules", key), siteKey: "isitrust", clientKey: null, productKey: "sh-critical-illness", applicantTypeKey, applicantClass: null, amountPatternKey: patternKey, conditionKey: null, position });
    isiTargets.push({ table: "productAmountRules", key, column: "amountPatternKey" }, { table: "amountBands", key: bandKey, column: "maximum" }, age("isitrust", "sh-critical-illness", applicantTypeKey, 18, 64));
  }
  decision("isitrust", "critical-illness-stage2", "Stage 2 requirements are incomplete; retain this existing product with the recorded numeric choices and ages, and preserve other existing candidate terms provisionally.", { enabled: true, applicants: ["member", "spouse"], minimum: 5000, maximum: 100000, increment: 5000, minimumAgeYears: 18, maximumAgeYears: 64, remainingTerms: "existing-candidate-provisional" }, ["Main!D286", "Main!H286", "Main!I286", "Main!J286", "Main!O286", "Main!P286"], isiTargets);

  for (const scoped of activeSiteMigrationScope.sites.filter(site => site.mcrRequired)) {
    const site = db.sites.find(site => site.key === scoped.key)!;
    const targets = db.siteProducts.filter(row => row.siteId === site.id && row.enabled).map(row => configuration(scoped.key, row.productKey, "provisional-rate-outcome", "product-rate-outcome", { status: "unavailable", reason: "Authoritative base premiums are not supplied", provisional: true, revisit: true }));
    decision(scoped.key, "base-premiums", "Base premiums are missing or unverified. Return an unavailable rate with no price; preserve source rate material for later integration.", { status: "unavailable", displayPrice: null, prototypePriceFallback: false }, [], targets);
  }
}
