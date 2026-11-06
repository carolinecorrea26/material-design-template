import { validatePaymentPolicy, type PaymentPolicy } from "../domain/paymentPolicy";
import type { DatabaseSchema } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import type { SourceCell } from "./mcr";

const siteKey = "waepa-gi";
const productKey = "li-group-term";
const decisionKey = "migration-decision.waepa-gi.member-fixed-offer";
const reference = "docs/archive/step3-active-site-adoption.md#waepagi-fixed-offer";
const metadata = (table: string, key: string, source: string) => ({ id: key, key, ...libraryMetadata(table, key, source) });

/** First reviewed Step 3 slice. Mutates only an explicitly cloned review database.
 * Amount adoption does not approve the inherited GI portfolio, eligibility or rates.
 */
export function applyWaepaGiAmountAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const expected: Record<string, string | number> = {
    B386: "WAEPA - GI\n\nSite turn on on May21st 2024", E386: "G-30280-0", G386: 101,
    H386: "Guaranteed Issue Amounts Available:  $100,000\n\n",
  };
  for (const [cell, value] of Object.entries(expected)) {
    const matches = cells.filter(source => source.sheet === "Main" && source.cell === cell);
    if (matches.length !== 1 || matches[0].value !== value || matches[0].formula !== null) throw new Error(`WAEPAGI adoption source mismatch: Main!${cell}`);
  }
  const sites = db.sites.filter(site => site.key === siteKey);
  const site = sites[0];
  if (sites.length !== 1 || db.clients.find(client => client.id === site.clientId)?.key !== "waepa" || db.siteProducts.filter(row => row.siteId === site.id && row.productKey === productKey && row.enabled).length !== 1) throw new Error("WAEPAGI adoption target is unavailable");
  const amountKey = `${siteKey}.${productKey}.mcr-fixed-member-offer`;
  const patternKey = `${amountKey}.pattern`;
  const targets: Array<{ table: "productIdentifiers" | "coverageAmountPatterns" | "productAmountRules"; key: string; cell: string }> = [];
  // Replace member/all-applicant amount assignments; preserve other applicant rules
  // as unresolved review work rather than implicitly approving dependent coverage.
  db.productAmountRules = db.productAmountRules.filter(row => !(row.siteKey === siteKey && row.productKey === productKey && (row.applicantTypeKey === "member" || row.applicantTypeKey === null)));
  db.productAmountRules.push({ ...metadata("productAmountRules", amountKey, "Main!H386"), siteKey, clientKey: null, productKey, applicantTypeKey: "member", applicantClass: null, amountPatternKey: patternKey, conditionKey: null, position: 0 });
  db.coverageAmountPatterns = db.coverageAmountPatterns.filter(row => row.key !== patternKey);
  db.coverageAmountPatterns.push({ ...metadata("coverageAmountPatterns", patternKey, "Main!H386"), patternKey: "coverage-amount-options", amountType: "fixed", minimum: 100000, maximum: 100000, increment: null, formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
  targets.push({ table: "productAmountRules", key: amountKey, cell: "H386" }, { table: "coverageAmountPatterns", key: patternKey, cell: "H386" });
  for (const [kind, cell, primary] of [["gNumber", "E386", "G-30280-0"], ["planCode", "G386", "101"]] as const) {
    const key = `${siteKey}.${productKey}.${kind}.mcr`;
    db.productIdentifiers = db.productIdentifiers.filter(row => !(row.scope === "site" && row.siteKey === siteKey && row.productKey === productKey && row.kind === kind));
    db.productIdentifiers.push({ ...metadata("productIdentifiers", key, `Main!${cell}`), scope: "site", siteKey, clientKey: null, productKey, kind, definition: { primary }, position: 0 });
    targets.push({ table: "productIdentifiers", key, cell });
  }
  for (const target of targets) {
    const requirementKey = `mcr.main.${target.cell}`;
    const source = db.sourceRequirements.find(row => row.key === requirementKey);
    if (!source) throw new Error(`Missing adoption provenance: ${requirementKey}`);
    source.promotionState = "SITE_CONFIGURATION";
    source.promotionReason = `Reviewed ${siteKey} fixed member offer only; ${reference}. Other policy domains remain pending.`;
    source.activeSiteKeys = [...new Set([...(Array.isArray(source.activeSiteKeys) ? source.activeSiteKeys as string[] : []), siteKey])];
    const key = `${decisionKey}.${target.table}.${target.cell}`;
    db.requirementTargets = db.requirementTargets.filter(row => row.key !== key);
    db.requirementTargets.push({ ...metadata("requirementTargets", key, `Main!${target.cell}`), requirementKey, targetTable: target.table, targetKey: target.key, targetColumn: target.table === "productIdentifiers" ? "definition" : target.table === "productAmountRules" ? "amountPatternKey" : "minimum" });
  }
  db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
  db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, reference), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: siteKey, predicate: "fixed-member-offer", status: "documented", value: {
    productKey, amount: 100000, sourceReferences: ["Main!E386", "Main!G386", "Main!H386"],
    authority: "User instruction to use MCR/siteconfig amounts for WAEPAGI", runtimeActivation: "pending",
    exclusions: ["Legacy $250,000 spouse branch", "Other WAEPA GI campaigns"],
    pendingDomains: ["GI portfolio", "Applicant availability", "Eligibility and military exclusions", "Residency", "Riders", "Payment conflict AE386/AK386", "Rates", "Question/attestation applicability"],
  } });
}


/** User confirmed source-first portfolio and CC availability, October 1, 2026. */
export function applyWaepaGiPortfolioAndPayment(db: DatabaseSchema) {
  const site = db.sites.find(row => row.key === siteKey);
  if (!site || db.clients.find(client => client.id === site.clientId)?.key !== "waepa") throw new Error("Invalid WAEPAGI portfolio target");
  const decision = "migration-decision.waepa-gi.source-portfolio-and-payment";
  const evidence = "docs/archive/step3-active-site-adoption.md#waepagi-portfolio-and-payment-decision";
  for (const row of db.siteProducts.filter(row => row.siteId === site.id)) row.enabled = row.productKey === productKey;
  for (const row of db.siteCoverages.filter(row => row.siteId === site.id)) row.enabled = row.coverageKey === productKey;
  for (const row of db.siteRiders.filter(row => row.siteId === site.id)) row.enabled = false;
  db.siteProductApplicants = db.siteProductApplicants.filter(row => row.siteKey !== siteKey);
  db.siteProductApplicants.push({ ...metadata("siteProductApplicants", `${siteKey}.${productKey}.member`, evidence), siteKey, productKey, applicantKey: "member", position: 0 });
  db.productApplicantEligibility = db.productApplicantEligibility.filter(row => row.siteKey !== siteKey);
  for (const applicantTypeKey of ["member", "spouse", "child"]) db.productApplicantEligibility.push({ ...metadata("productApplicantEligibility", `${siteKey}.${productKey}.${applicantTypeKey}.gi`, evidence), siteKey, productKey, applicantTypeKey, eligible: applicantTypeKey === "member", conditionKey: null });
  db.productAmountRules = db.productAmountRules.filter(row => row.siteKey !== siteKey || row.productKey === productKey && row.applicantTypeKey === "member");
  db.underwritingBands = db.underwritingBands.filter(row => row.siteKey !== siteKey);
  db.underwritingBands.push({ ...metadata("underwritingBands", `${siteKey}.${productKey}.gi-member`, "Main!O386/U386"), siteKey, productKey, applicantTypeKey: "member", applicantClass: null, pathway: "GI", minimumAge: 18, maximumAge: 39, minimumAmount: 100000, maximumAmount: 100000, minimumAmountExclusive: false, mortalityMorbidity: null, conditionKey: null, status: "documented" });
  // Empty Site rider replacement prevents global/client rider inheritance.
  const riderMarker = `${siteKey}.${productKey}.gi-rider-set`;
  db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== riderMarker);
  db.configurationDefinitions.push({ ...metadata("configurationDefinitions", riderMarker, evidence), definition: { path: null, metadata: { decision }, target: { kind: "product-rider-set", productKey } }, position: 0 });
  db.configurationValues = db.configurationValues.filter(row => row.key !== riderMarker);
  db.configurationValues.push({ ...metadata("configurationValues", riderMarker, evidence), scope: "site", clientKey: null, siteKey, configurationKey: riderMarker, value: [], position: 0 });
  const payment: PaymentPolicy = {
    collection: "required", methods: [{ method: "bank-account", frequencies: ["monthly"] }, { method: "credit-card", frequencies: ["monthly"] }],
    defaultMethod: "bank-account", defaultFrequency: "monthly", frequencyLocked: true, synchronizeAcrossProducts: true,
  };
  validatePaymentPolicy(payment);
  const policies = db.sitePolicies.filter(row => row.siteKey === siteKey);
  if (policies.length !== 1) throw new Error("Ambiguous WAEPAGI Site policy");
  policies[0].definition.payment = payment;
  const page = db.sitePages.find(row => row.siteKey === siteKey && row.pageKey === "payment");
  if (!page) throw new Error("Missing WAEPAGI payment page");
  page.requirement = "required";
  db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decision);
  db.semanticRequirements.push({ ...metadata("semanticRequirements", decision, evidence), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: siteKey, predicate: "gi-portfolio-and-payment", status: "documented", value: {
    authority: "User: take GI source evidence over dummy prototype coverage; WAEPAGI can have CC", approvedOn: "2026-10-01",
    enabledProducts: [productKey], applicants: ["member"], riders: [], payment: JSON.parse(JSON.stringify(payment)),
    sourceReferences: ["Main!D386", "Main!H386", "Main!I386", "Main!J386", "Main!L386", "Main!O386", "Main!U386", "Main!AE386", "Main!AG386", "Main!AK386", "legacy:waepagi"],
    supersedes: "Main!AK386 credit-card prohibition", runtimeActivation: "pending", processorIntegration: "pending",
  } });
  const amountDecision = db.semanticRequirements.find(row => row.key === decisionKey);
  if (amountDecision && amountDecision.value && typeof amountDecision.value === "object" && !Array.isArray(amountDecision.value)) amountDecision.value.pendingDomains = ["Eligibility and military exclusions", "Residency", "Rates", "Question/attestation applicability", "Payment processor integration"];
}

/** Execute the exact GI entry-age and active-military exclusion, independently
 * of certification, residency, submission and rate-service readiness.
 */
export function applyWaepaGiEligibilityAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const reference = "Main!O386";
  const age = cells.filter(cell => cell.sheet === "Main" && cell.cell === "O386");
  if (age.length !== 1 || age[0].value !== "\n\n18- through 39\n\nNot available to members called to active military duty\n\n" || age[0].formula !== null) throw new Error("WAEPAGI eligibility source changed");
  const key = `${siteKey}.${productKey}.gi-entry-age`;
  db.eligibilityConstraints = db.eligibilityConstraints.filter(row => row.siteKey !== siteKey || row.productKey !== productKey || row.applicantTypeKey !== "member");
  db.eligibilityConstraints.push({ ...metadata("eligibilityConstraints", key, reference), siteKey, productKey, applicantTypeKey: "member", minimumAgeDays: null, minimumAgeYears: 18, maximumAgeYears: 39, studentMaximumAgeYears: null, minimumWorkHours: null });
  const configurationKey = `${siteKey}.${productKey}.military-exclusion`;
  db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== configurationKey);
  db.configurationDefinitions.push({ ...metadata("configurationDefinitions", configurationKey, reference), position: 0, definition: { path: null, metadata: null, target: { kind: "product-eligibility-facts", productKey, applicantKey: "member" } } });
  db.configurationValues = db.configurationValues.filter(row => row.key !== configurationKey);
  db.configurationValues.push({ ...metadata("configurationValues", configurationKey, reference), scope: "site", siteKey, clientKey: null, configurationKey, value: [{ fact: "activeMilitary", equals: false }], position: 0 });
  const source = db.sourceRequirements.find(row => row.key === "mcr.main.O386");
  if (!source) throw new Error("Missing GI eligibility provenance");
  source.promotionState = "SITE_CONFIGURATION";
  source.promotionReason = "GI entry age and active military exclusion execute; other eligibility/certification rules remain separate.";
  source.activeSiteKeys = [siteKey];
  for (const [targetTable, targetKey, targetColumn] of [["eligibilityConstraints", key, "minimumAgeYears"], ["eligibilityConstraints", key, "maximumAgeYears"], ["configurationValues", configurationKey, "value"]]) {
    const targetId = `migration-decision.${configurationKey}.${targetTable}.${targetColumn}`;
    db.requirementTargets = db.requirementTargets.filter(row => row.key !== targetId);
    db.requirementTargets.push({ ...metadata("requirementTargets", targetId, reference), requirementKey: source.key, targetTable, targetKey, targetColumn });
  }
}
