import type { DatabaseSchema, Json } from "../persistence/types";
import { isBenefitPolicy } from "../domain/benefitPolicy";
import { libraryMetadata } from "../domain/provenance";
import { activeSiteMigrationScope } from "./activeSiteScope";
import { linkBenefitPolicy } from "../domain/structuredBenefitPolicy";

const reference = "User-confirmed amount ownership, October 19, 2026";
const meta = (table: string, key: string, source = reference) => ({ id: key, key, ...libraryMetadata(table, key, source) });

/** Compile accepted benefit choices into their structured owner. Modifiers keep
 * exact assignment references; superseded copies remain non-executable evidence.
 * This compiler operates on new reviewed exports, never saved drafts/releases. */
export function consolidateAmountOwnership(db: DatabaseSchema) {
  const business = activeSiteMigrationScope.sites.filter(site => site.mcrRequired);
  for (const configuration of db.configurationValues) {
    const target = db.configurationDefinitions.find(row => row.key === configuration.configurationKey)?.definition.target;
    if (target?.kind !== "product-benefit-policy" || !business.some(site => site.key === configuration.siteKey)) continue;
    const policy = configuration.value;
    if (!isBenefitPolicy(policy)) continue; // Already linked v2 or separately invalid; integrity validation owns rejection.
    const siteKey = configuration.siteKey;
    if (!siteKey) throw new Error(`Missing benefit Site: ${configuration.key}`);
    const existing = db.productAmountRules.filter(row => row.siteKey === siteKey && row.productKey === target.productKey);
    const used = new Set<string>();
    const amountRuleKeys = policy.applicants.map(applicant => {
      // Retain existing assignment identities/source links, including the first
      // formerly generic AMA/CSEA member rule. Add explicit class assignments.
      const previous = existing.find(row => !used.has(row.key) && row.applicantTypeKey === applicant.applicantKey
        && (row.applicantClass === (applicant.applicantClass ?? null) || row.applicantClass === null));
      const suffix = `${siteKey}.${target.productKey}.benefit-amount.${applicant.applicantKey}${applicant.applicantClass ? `.${applicant.applicantClass}` : ""}`;
      const ruleKey = previous?.key ?? `${suffix}.rule`;
      used.add(ruleKey);
      const patternKey = `${suffix}.pattern`;
      const source = configuration.sourceReference ?? reference;
      db.coverageAmountPatterns = db.coverageAmountPatterns.filter(row => row.key !== patternKey);
      db.amountBands = db.amountBands.filter(row => row.amountPatternKey !== patternKey);
      db.amountOptions = db.amountOptions.filter(row => row.amountPatternKey !== patternKey);
      db.coverageAmountPatterns.push({ ...meta("coverageAmountPatterns", patternKey, source),
        patternKey: "coverage-amount-options", amountType: applicant.amountChoices ? "set" : "range",
        minimum: null, maximum: null, increment: applicant.amountChoices ? applicant.increment : null,
        formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
      if (applicant.amountChoices) {
        for (const [position, amount] of applicant.amountChoices.entries()) db.amountOptions.push({
          ...meta("amountOptions", `${patternKey}.${amount}`, source), amountPatternKey: patternKey, value: String(amount), label: String(amount), position,
        });
      } else db.amountBands.push({ ...meta("amountBands", `${patternKey}.band`, source), amountPatternKey: patternKey,
        minimum: applicant.minimum, maximum: applicant.maximum, increment: applicant.increment, conditionKey: null, position: 0 });
      db.productAmountRules = db.productAmountRules.filter(row => row.key !== ruleKey);
      db.productAmountRules.push({ ...(previous ?? meta("productAmountRules", ruleKey, source)), siteKey, clientKey: null,
        productKey: target.productKey, applicantTypeKey: applicant.applicantKey, applicantClass: applicant.applicantClass ?? null,
        amountPatternKey: patternKey, conditionKey: null, position: used.size - 1 });
      return ruleKey;
    });
    if (existing.some(row => !used.has(row.key))) throw new Error(`Unaccounted benefit amount scope: ${configuration.key}`);
    configuration.value = JSON.parse(JSON.stringify(linkBenefitPolicy(policy, amountRuleKeys))) as Json;
    const evidenceKey = `ownership-evidence.${configuration.key}`;
    db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== evidenceKey);
    db.semanticRequirements.push({ ...meta("semanticRequirements", evidenceKey), domain: "information-ownership", subjectTable: "sites", subjectKey: siteKey,
      predicate: "structured-benefit-amounts", status: "documented", value: { authority: reference, previousPolicy: JSON.parse(JSON.stringify(policy)),
        configurationKey: configuration.configurationKey, amountRuleKeys: [...used], sourceReconciliation: "Preserves accepted and provisional benefit dimensions; no additional business approval inferred." } });
  }
  // Retire authored compatibility amounts only within the approved business
  // scope. Static inputs and the prior values below retain original evidence.
  const retired = new Set<string>();
  for (const value of db.configurationValues) {
    const definition = db.configurationDefinitions.find(row => row.key === value.configurationKey);
    const path = definition?.definition.path;
    if (path?.length !== 3 || path[0] !== "coverages" || path[1] !== "coverageAmounts"
      || !business.some(site => value.scope === "site" ? site.key === value.siteKey : value.scope === "client" && site.clientKey === value.clientKey)) continue;
    const key = `ownership-evidence.${value.key}`;
    if (!db.semanticRequirements.some(row => row.key === key)) db.semanticRequirements.push({ ...meta("semanticRequirements", key), domain: "information-ownership",
      subjectTable: "configurationDefinitions", subjectKey: value.configurationKey, predicate: "superseded-amount-copy", status: "documented",
      value: { authority: reference, previousValue: value.value, scope: value.scope, clientKey: value.clientKey, siteKey: value.siteKey, productKey: path[2], replacement: "productAmountRules" } });
    retired.add(value.key);
  }
  db.configurationValues = db.configurationValues.filter(row => !retired.has(row.key));
}
