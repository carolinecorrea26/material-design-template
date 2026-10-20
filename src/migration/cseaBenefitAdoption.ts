import { cseaAddTable } from "./cseaRateTables";
import type { DatabaseSchema, Json, ConfigurationTarget } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isBenefitPolicy, type BenefitPolicy } from "../domain/benefitPolicy";
import { provisionalDecisionAuthority, provisionalDecisionReference } from "./provisionalSourceDecisions";

export function applyCseaBenefitAdoption(db: DatabaseSchema) {
  const key = "csea.di-ltd.reviewed-benefit-policy";
  const value: BenefitPolicy = { version: 1, applicants: ["clerical", "non-clerical"].map(applicantClass => ({
    applicantKey: "member", applicantClass, minimum: applicantClass === "clerical" ? 1000 : 1100, maximum: applicantClass === "clerical" ? 2000 : 3400, increment: 100,
    ...(applicantClass === "clerical" ? { amountChoices: [1000,1200,1300,1400,1600,1700,1800,1900,2000] } : {}),
    income: { fraction: .6, subtractExisting: false },
    waitingPeriods: applicantClass === "clerical" ? [{ key: "0-day-accident-7-day-sickness", accidentDays: 0, sicknessDays: 7 }] : [{ key: "180-days", accidentDays: 180, sicknessDays: 180 }], benefitPeriods: applicantClass === "clerical" ? ["12-months"] : ["2-years", "5-years"],
  })), exclusiveProducts: [], provisional: true, revisit: [
    "Office-work yes maps to clerical, no to non-clerical (Main R246). Clerical uses the supplied October 5 table schedule and 0-day Accident/7-day Sickness, 12-month period. Non-clerical retains the Disability D45 working schedule pending its table; reconcile program identity before publication.",
    "Income cap 60% remains provisional; no existing-disability subtraction or invented collection question is applied. Occupation-specific differences await authoritative benefit table.",
    "User supplied clerical DI and AD&D reference assets October 5, 2026; rates remain reference-only. Reconcile the provisional benefit schedule against the supplied 12-month plan before production pricing.",
    "Spouse Accident Disability and child Outpatient Emergency Room Benefit are attached elections; document identifiers remain subject to reconciliation.",
  ] };
  if (!isBenefitPolicy(value)) throw new Error("Invalid CSEA benefit contract");
  const meta = (table: string, id: string) => ({ id, key: id, ...libraryMetadata(table, id, provisionalDecisionReference) });
  db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== key);
  db.configurationValues = db.configurationValues.filter(r => r.key !== key);
  db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { provisional: true }, target: { kind: "product-benefit-policy", productKey: "di-ltd" } } });
  db.configurationValues.push({ ...meta("configurationValues", key), position: 0, scope: "site", clientKey: null, siteKey: "csea", configurationKey: key, value: value as unknown as Json });
  const riderSetKey = "csea.di-ltd.included-rider-set";
  db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== riderSetKey);
  db.configurationValues = db.configurationValues.filter(r => r.key !== riderSetKey);
  db.configurationDefinitions.push({ ...meta("configurationDefinitions", riderSetKey), position: 0, definition: { path: null, metadata: { source: "Riders!C29" }, target: { kind: "product-rider-set", productKey: "di-ltd" } } });
  db.configurationValues.push({ ...meta("configurationValues", riderSetKey), position: 0, scope: "site", clientKey: null, siteKey: "csea", configurationKey: riderSetKey, value: ["csea.spouse-accident", "csea.child-outpatient"] });
  // AD&D is a separate AD product; the DI rider set contains only dependent benefits.
  db.productRiders = db.productRiders.filter(r => !(r.scope === "site" && r.siteKey === "csea" && r.productKey === "di-ltd" && r.riderKey === "mcr.rider.r25"));
  const benefits = [
    { id: "csea.spouse-accident", name: "Accident Disability", dependentApplicant: "spouse" as const, description: "Optional spouse Accident Disability coverage.", hasAmount: true, defaultAmount: 500, amountLabel: "Spouse Monthly Benefit", coverageAmounts: [{ scope: { applicantType: "member" as const }, selections: [{ type: "amountList" as const, values: [500,1000] }] }] },
    { id: "csea.child-outpatient", name: "Outpatient Emergency Room Benefit", dependentApplicant: "child" as const, description: "Optional Dependent Child(ren) Emergency Accident Benefit pays $50 for a covered outpatient accident visit for children under age 19. Limited to two visits per calendar year; includes hospital, ambulatory surgical center, urgent care or private licensed physician's office.", hasAmount: false },
  ];
  for (const benefit of benefits) {
    db.riders = db.riders.filter(r => r.key !== benefit.id);
    db.riders.push({ ...meta("riders", benefit.id), position: 0, definition: { ...benefit, applicants: ["member"], defaultSelected: true, premiumFactor: null } });
    const assignment = `${riderSetKey}.${benefit.id}`;
    db.productRiders = db.productRiders.filter(r => r.key !== assignment);
    db.productRiders.push({ ...meta("productRiders", assignment), scope: "site", siteKey: "csea", clientKey: null, productKey: "di-ltd", riderKey: benefit.id, position: benefit.dependentApplicant === "spouse" ? 1 : 2 });
  }
  addCseaAccidentProduct(db);
  const experienceKey = "csea.applicant-experience";
  db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== experienceKey);
  db.configurationValues = db.configurationValues.filter(r => r.key !== experienceKey);
  db.configurationDefinitions.push({ ...meta("configurationDefinitions", experienceKey), position: 0, definition: { path: ["applicantExperience"], metadata: { authority: "User clarification October 5, 2026; Main M/I/J/S/T246" } } });
  db.configurationValues.push({ ...meta("configurationValues", experienceKey), position: 0, scope: "site", siteKey: "csea", clientKey: null, configurationKey: experienceKey, value: { factMappings: { applicantClass: { field: "csea-occupation-group", values: { "group-1-clerical": "clerical", "group-2-non-clerical": "non-clerical" } } }, eligibleStatesOnly: true, eligibleStates: ["NY","NJ","VT","PA","CT"], childEligibility: { mode: "notice-only", note: "Child must be under age 19 as of the date of this application." } } });
  const decisionKey = `provisional-decision.${key}`;
  db.semanticRequirements = db.semanticRequirements.filter(r => r.key !== decisionKey);
  db.semanticRequirements.push({ ...meta("semanticRequirements", decisionKey), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: "csea", predicate: "occupation-benefits", status: "documented", value: { authority: provisionalDecisionAuthority, selected: value as unknown as Json, sourceReferences: ["Main!R246", "Disability!D45", "Disability!F45", "Disability!G45"], revisit: true, sourceReconciliation: "deferred", runtimeActivation: "pending", destinations: [{ table: "configurationValues", key, column: "value" }] } });
}

/** User-confirmed member-only AD product, scoped to CSEA without catalog mutations. */
function addCseaAccidentProduct(db: DatabaseSchema) {
  const siteKey = "csea", productKey = "li-add";
  const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, "User clarification October 5, 2026; supplied AD&D rate table") });
  const assignment = db.siteProducts.find(p => p.siteId === siteKey && p.productKey === productKey);
  if (!assignment) throw new Error("Missing CSEA AD catalog assignment");
  assignment.enabled = true;
  db.siteProductApplicants = db.siteProductApplicants.filter(r => r.siteKey !== siteKey || r.productKey !== productKey);
  db.productApplicantEligibility = db.productApplicantEligibility.filter(r => r.siteKey !== siteKey || r.productKey !== productKey);
  const applicantKey = `${siteKey}.${productKey}.member`;
  db.siteProductApplicants.push({ ...meta("siteProductApplicants", applicantKey), siteKey, productKey, applicantKey: "member", position: 0 });
  for (const applicantTypeKey of ["member","spouse","child"]) db.productApplicantEligibility.push({ ...meta("productApplicantEligibility", `${applicantKey}.${applicantTypeKey}`), siteKey, productKey, applicantTypeKey, eligible: applicantTypeKey === "member", conditionKey: null });
  // Standalone AD&D identity is unresolved. Never inherit DI row 246 or another
  // client's shared catalog identifiers into mock submission destinations.
  const identifierDestinations: Array<{ table: string; key: string; column: string }> = [];
  for (const kind of ["gNumber", "planCode"] as const) {
    const key = `${siteKey}.${productKey}.mock-${kind}`;
    db.productIdentifiers = db.productIdentifiers.filter(r => !(r.siteKey === siteKey && r.productKey === productKey && r.kind === kind));
    db.productIdentifiers.push({ ...meta("productIdentifiers", key), position: 0, scope: "site", siteKey, clientKey: null, productKey, kind, definition: { primary: `mock:${siteKey}:${productKey}:${kind}` } });
    identifierDestinations.push({ table: "productIdentifiers", key, column: "definition" });
  }
  const identityDecisionKey = `provisional-decision.${siteKey}.${productKey}.mock-identity`;
  db.semanticRequirements = db.semanticRequirements.filter(r => r.key !== identityDecisionKey);
  db.semanticRequirements.push({ ...meta("semanticRequirements", identityDecisionKey), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: siteKey, predicate: "standalone-ad-identity", status: "documented", value: { authority: provisionalDecisionAuthority, selected: { identifiers: "Explicit mock-only placeholders; exact standalone AD&D identifiers are unresolved", productScope: "User-confirmed October 5 member-only optional AD&D" }, sourceReferences: [], revisit: true, sourceReconciliation: "deferred", serviceDestination: "mock-coverage-v1", destinations: identifierDestinations, runtimeActivation: "pending" } });
  const patternKey = `${siteKey}.${productKey}.amount-pattern`;
  db.productAmountRules = db.productAmountRules.filter(r => r.siteKey !== siteKey || r.productKey !== productKey);
  db.coverageAmountPatterns = db.coverageAmountPatterns.filter(r => r.key !== patternKey);
  db.amountOptions = db.amountOptions.filter(r => r.amountPatternKey !== patternKey);
  db.coverageAmountPatterns.push({ ...meta("coverageAmountPatterns", patternKey), patternKey: "coverage-amount-options", amountType: "set", minimum: 10000, maximum: 100000, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
  for (const [position, amount] of [10000,30000,50000,100000].entries()) db.amountOptions.push({ ...meta("amountOptions", `${patternKey}.${amount}`), amountPatternKey: patternKey, value: String(amount), label: String(amount), position });
  db.productAmountRules.push({ ...meta("productAmountRules", `${patternKey}.rule`), siteKey, clientKey: null, productKey, applicantTypeKey: "member", applicantClass: null, amountPatternKey: patternKey, conditionKey: null, position: 0 });
  const store = (suffix: string, target: ConfigurationTarget, value: Json) => {
    const key = `${siteKey}.${productKey}.${suffix}`;
    db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== key);
    db.configurationValues = db.configurationValues.filter(r => r.key !== key);
    db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { authority: "User clarification October 5, 2026" }, target } });
    db.configurationValues.push({ ...meta("configurationValues", key), position: 0, scope: "site", siteKey, clientKey: null, configurationKey: key, value });
  };
  store("name", { kind: "product-presentation", productKey, property: "name" }, "Group Accidental Death and Dismemberment");
  store("description", { kind: "product-presentation", productKey, property: "definition" }, "Optional member AD&D coverage. Choose a principal sum of $10,000, $30,000, $50,000 or $100,000. $5,000 Basic AD&D coverage is already included in the DI plan.");
  store("options", { kind: "product-presentation", productKey, property: "options" }, [{ id: "amount", type: "amount", label: "Principal Sum", choices: [10000,30000,50000,100000] }]);
  for (const [suffix, path, value] of [
    ["categories", ["coverages","categories"], ["AD","DI"]],
    ["coverage-questions", ["coverageQuestions"], { DI: ["selfCoverageWorkIncome"], always: [] }],
  ] as const) {
    const key = `${siteKey}.${suffix}`;
    db.configurationDefinitions = db.configurationDefinitions.filter(r => r.key !== key);
    db.configurationValues = db.configurationValues.filter(r => r.key !== key);
    db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: [...path], metadata: { authority: "User clarification October 5, 2026" } } });
    db.configurationValues.push({ ...meta("configurationValues", key), position: 0, scope: "site", siteKey, clientKey: null, configurationKey: key, value: JSON.parse(JSON.stringify(value)) as Json });
  }
  store("rider-set", { kind: "product-rider-set", productKey }, []);
  store("reference-table", { kind: "product-reference-rate-table", productKey }, cseaAddTable as unknown as Json);
  store("residency", { kind: "product-residency-policy", productKey }, { version: 1, allowedJurisdictions: ["US-NY","US-NJ","US-VT","US-PA","US-CT"], excludeActiveMilitary: false, provisional: true, revisit: ["Member-only AD product and states confirmed by user; product documents and identifiers require reconciliation."] });
}
