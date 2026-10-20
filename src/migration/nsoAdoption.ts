import type { DatabaseSchema, TableName } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { validatePaymentPolicy, type PaymentPolicy } from "../domain/paymentPolicy";
import type { SourceCell } from "./mcr";

const siteKey = "nso";
const reference = "docs/step3-active-site-adoption.md#nso-life-amounts-and-payment";
const metadata = (table: string, key: string, source: string) => ({ id: key, key, ...libraryMetadata(table, key, source) });
const plans = [
  { row: 318, productKey: "li-term", gNumber: "G-30330-0", planCode: 101, min: 25000, max: 500000, increment: 25000, minimumAge: 17, maximumAge: 64, child: false },
  { row: 319, productKey: "li-50plus", gNumber: "G-30334-0", planCode: 153, min: 10000, max: 100000, increment: 10000, minimumAge: 50, maximumAge: 74, child: false },
  { row: 322, productKey: "li-10yr", gNumber: "G-30332-0", planCode: 102, min: 50000, max: 200000, increment: 50000, minimumAge: 17, maximumAge: 59, child: true },
  { row: 323, productKey: "li-20yr", gNumber: "G-30333-0", planCode: 121, min: 50000, max: 200000, increment: 50000, minimumAge: 17, maximumAge: 54, child: true },
] as const;

/** Review compiler only. Adopt confirmed NSO life dimensions; do not infer DI/family AD&D policy. */
export function applyNsoLifeAndPaymentAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const read = (cell: string) => {
    const matches = cells.filter(source => source.sheet === "Main" && source.cell === cell);
    if (matches.length !== 1 || matches[0].formula !== null) throw new Error(`NSO source missing or ambiguous: Main!${cell}`);
    return matches[0].value;
  };
  // Verify every adopted fact before writing. Never parse a plausible value from a changed row.
  for (const plan of plans) {
    const row = plan.row;
    for (const [column, expected] of [["B", "NSO"], ["E", plan.gNumber], ["G", plan.planCode], ["O", `${plan.minimumAge} - through age ${plan.maximumAge}`], ["P", `${plan.minimumAge} - through age ${plan.maximumAge}`]] as const) {
      if (read(`${column}${row}`) !== expected) throw new Error(`NSO source changed: Main!${column}${row}`);
    }
    const range = `$${plan.min.toLocaleString("en-US")} up to $${plan.max.toLocaleString("en-US")} in increments of $${plan.increment.toLocaleString("en-US")}`;
    for (const column of ["H", "I"]) if (String(read(`${column}${row}`)).split("\n")[0] !== range || !String(read(`${column}${row}`)).includes("$800,000")) throw new Error(`NSO amount source changed: Main!${column}${row}`);
    if (read(`J${row}`) !== (plan.child ? 5000 : "NA")) throw new Error(`NSO child source changed: Main!J${row}`);
    if (plan.child && read(`Q${row}`) !== "15 days through age 18 (full time student through age 25)") throw new Error(`NSO child ages changed: Main!Q${row}`);
    if (read(`AG${row}`) !== "Bill me : Quarterly, Semiannually, Annually. EFT: Monthly, Qtly, SemiA, Annual") throw new Error(`NSO payment choices changed: Main!AG${row}`);
  }
  if (read("AF318") !== "No\npayment required") throw new Error("NSO payment requirement changed");
  const site = db.sites.find(row => row.key === siteKey);
  const policy = db.sitePolicies.filter(row => row.siteKey === siteKey);
  if (!site || db.clients.find(client => client.id === site.clientId)?.key !== "nso" || policy.length !== 1 || plans.some(plan => db.siteProducts.filter(row => row.siteId === site.id && row.productKey === plan.productKey && row.enabled).length !== 1)) throw new Error("Unavailable NSO adoption target");
  const targets: Array<{ table: TableName; key: string; cell: string; column: string }> = [];
  for (const plan of plans) {
    const { productKey, row } = plan;
    const prefix = `${siteKey}.${productKey}.mcr`;
    db.productAmountRules = db.productAmountRules.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    db.siteProductApplicants = db.siteProductApplicants.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    db.productApplicantEligibility = db.productApplicantEligibility.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    db.eligibilityConstraints = db.eligibilityConstraints.filter(rule => rule.siteKey !== siteKey || rule.productKey !== productKey);
    for (const [position, applicantTypeKey] of ["member", "spouse", "child"].entries()) {
      const available = applicantTypeKey !== "child" || plan.child;
      const cell = `${applicantTypeKey === "member" ? "H" : applicantTypeKey === "spouse" ? "I" : "J"}${row}`;
      const key = `${prefix}.${applicantTypeKey}`;
      db.productApplicantEligibility.push({ ...metadata("productApplicantEligibility", key, `Main!${cell}`), siteKey, productKey, applicantTypeKey, eligible: available, conditionKey: null });
      targets.push({ table: "productApplicantEligibility", key, cell, column: "eligible" });
      if (!available) continue;
      db.siteProductApplicants.push({ ...metadata("siteProductApplicants", key, `Main!${cell}`), siteKey, productKey, applicantKey: applicantTypeKey, position });
      targets.push({ table: "siteProductApplicants", key, cell, column: "applicantKey" });
      const patternKey = `${key}.amount-pattern`;
      db.coverageAmountPatterns = db.coverageAmountPatterns.filter(pattern => pattern.key !== patternKey);
      db.amountBands = db.amountBands.filter(band => band.key !== `${patternKey}.band`);
      db.coverageAmountPatterns.push({ ...metadata("coverageAmountPatterns", patternKey, `Main!${cell}`), patternKey: "coverage-amount-options", amountType: applicantTypeKey === "child" ? "fixed" : "range", minimum: applicantTypeKey === "child" ? 5000 : null, maximum: applicantTypeKey === "child" ? 5000 : null, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
      if (applicantTypeKey !== "child") {
        db.amountBands.push({ ...metadata("amountBands", `${patternKey}.band`, `Main!${cell}`), amountPatternKey: patternKey, minimum: plan.min, maximum: plan.max, increment: plan.increment, conditionKey: null, position: 0 });
        targets.push({ table: "amountBands", key: `${patternKey}.band`, cell, column: "minimum" });
      }
      db.productAmountRules.push({ ...metadata("productAmountRules", `${key}.amount-rule`, `Main!${cell}`), productKey, siteKey, clientKey: null, applicantTypeKey, applicantClass: null, amountPatternKey: patternKey, conditionKey: null, position });
      targets.push({ table: "coverageAmountPatterns", key: patternKey, cell, column: "amountType" }, { table: "productAmountRules", key: `${key}.amount-rule`, cell, column: "amountPatternKey" });
      const ageCell = `${applicantTypeKey === "member" ? "O" : applicantTypeKey === "spouse" ? "P" : "Q"}${row}`;
      const eligibilityKey = `${key}.ages`;
      db.eligibilityConstraints.push({ ...metadata("eligibilityConstraints", eligibilityKey, `Main!${ageCell}`), productKey, siteKey, applicantTypeKey, minimumAgeDays: applicantTypeKey === "child" ? 15 : null, minimumAgeYears: applicantTypeKey === "child" ? null : plan.minimumAge, maximumAgeYears: applicantTypeKey === "child" ? 18 : plan.maximumAge, studentMaximumAgeYears: applicantTypeKey === "child" ? 25 : null, unmarried: null, minimumWorkHours: null });
      targets.push({ table: "eligibilityConstraints", key: eligibilityKey, cell: ageCell, column: "maximumAgeYears" });
    }
    for (const [kind, column, primary] of [["gNumber", "E", plan.gNumber], ["planCode", "G", String(plan.planCode)]] as const) {
      const key = `${prefix}.${kind}`;
      db.productIdentifiers = db.productIdentifiers.filter(identifier => !(identifier.scope === "site" && identifier.siteKey === siteKey && identifier.productKey === productKey && identifier.kind === kind));
      db.productIdentifiers.push({ ...metadata("productIdentifiers", key, `Main!${column}${row}`), scope: "site", siteKey, clientKey: null, productKey, kind, definition: { primary }, position: 0 });
      targets.push({ table: "productIdentifiers", key, cell: `${column}${row}`, column: "definition" });
    }
  }
  for (const applicantTypeKey of ["member", "spouse", "child"]) {
    const key = `${siteKey}.life.mcr-aggregate.${applicantTypeKey}`;
    db.aggregateLimits = db.aggregateLimits.filter(limit => !(limit.siteKey === siteKey && limit.categoryKey === "LI" && limit.applicantTypeKey === applicantTypeKey && limit.productKey === null));
    db.aggregateLimits.push({ ...metadata("aggregateLimits", key, "Main!H318:I318/H322:I323"), siteKey, categoryKey: "LI", productKey: null, applicantTypeKey, maximum: 800000, formula: null, conditionKey: null });
    targets.push({ table: "aggregateLimits", key, cell: applicantTypeKey === "spouse" ? "I318" : applicantTypeKey === "child" ? "H322" : "H318", column: "maximum" });
  }
  const payment: PaymentPolicy = { collection: "required", methods: [
    { method: "bill-me", frequencies: ["quarterly", "semiannual", "annual"] },
    { method: "bank-account", frequencies: ["monthly", "quarterly", "semiannual", "annual"] },
  ], defaultMethod: "bill-me", defaultFrequency: null, frequencyLocked: false, synchronizeAcrossProducts: true };
  validatePaymentPolicy(payment);
  policy[0].definition.payment = payment;
  targets.push({ table: "sitePolicies", key: policy[0].key, cell: "AG318", column: "definition" }, { table: "sitePolicies", key: policy[0].key, cell: "AF318", column: "definition" });
  const decisionKey = "migration-decision.nso.life-amounts-and-payment";
  for (const target of targets) {
    const requirementKey = `mcr.main.${target.cell}`;
    const source = db.sourceRequirements.find(source => source.key === requirementKey);
    if (!source) throw new Error(`Missing NSO provenance: ${requirementKey}`);
    source.promotionState = "SITE_CONFIGURATION";
    source.promotionReason = `Reviewed NSO life amount/applicant/age/identity or payment dimension only; ${reference}`;
    source.activeSiteKeys = [...new Set([...(Array.isArray(source.activeSiteKeys) ? source.activeSiteKeys as string[] : []), siteKey])];
    const key = `${decisionKey}.${target.table}.${target.key}.${target.cell}`;
    db.requirementTargets = db.requirementTargets.filter(row => row.key !== key);
    db.requirementTargets.push({ ...metadata("requirementTargets", key, `Main!${target.cell}`), requirementKey, targetTable: target.table, targetKey: target.key, targetColumn: target.column });
  }
  db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
  db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, reference), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: siteKey, predicate: "life-amounts-and-payment", status: "documented", value: {
    products: plans.map(plan => plan.productKey), childAmount: 5000, perPersonLifeAggregate: 800000, existingLifeAmountRequired: true, payment: JSON.parse(JSON.stringify(payment)), runtimeActivation: "pending",
    authority: "User-approved migration of applicable MCR amounts, eligibility and payment rules", sourceReferences: plans.map(plan => `Main!${plan.row}`),
    defaultReconciliation: "Legacy Bill Me/Monthly is invalid under MCR AG318 and legacy option lists; retain Bill Me, require frequency selection.",
    pendingDomains: ["Dependencies and riders", "AD&D family-plan semantics", "DI income cap and age correction", "Underwriting and health rules", "Residency", "Base premiums and Montana rating inputs", "Direct Bill fee awaiting source confirmation", "Age-rule execution/certification"],
  } });
}
