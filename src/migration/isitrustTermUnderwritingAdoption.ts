import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isCoverageJourneyPolicy, type CoverageJourneyPolicy } from "../domain/coverageJourneyPolicy";
import { isAssociationEligibilityPolicy } from "../domain/associationEligibilityPolicy";
import type { AssociationUnderwriting } from "../domain/associationUnderwriting";
import { atpeAssociationKey } from "./atpeAssociationAdoption";

export const isitrustTermUnderwritingDecisionKey = "business-decision.rules-review.isitrust-term-underwriting";
const reference = "User decision October 20, 2026; Main!Z278/AA278/O284/P284/AA283:AA284; QD LI!J74:P76: source processing bands and questionnaire scopes; 20-Year ages 20–54; preserve ATPE and amount limits";
export function applyIsitrustTermUnderwritingAdoption(db: DatabaseSchema) {
  const associations = db.siteAssociations.filter(row => row.siteKey === "isitrust" && row.enabled && row.associationKey !== atpeAssociationKey).sort((a, b) => a.position - b.position).map(row => row.associationKey);
  const selected: Array<{ key: string; rules: AssociationUnderwriting[] }> = [];
  for (const productKey of ["li-group-term", "li-10yr", "li-20yr"]) {
    const row = db.configurationValues.find(row => row.key === `isitrust.${productKey}.journey-policy`);
    if (!row || !isCoverageJourneyPolicy(row.value)) throw new Error(`Missing native term journey ${productKey}`);
    const atpeReview = db.semanticRequirements.find(row => row.key === "business-decision.rules-review.atpe-native-owners")?.value as unknown as { owners?: Array<{ table: string; key: string; column?: string; reviewedValue: unknown }> } | undefined;
    const priorReview = atpeReview?.owners?.find(owner => owner.table === "configurationValues" && owner.key === row.key && owner.column === "value");
    const priorAtpeScope = (policy: CoverageJourneyPolicy) => ({ ...policy, associationUnderwriting: policy.associationUnderwriting?.filter(rule => !associations.includes(rule.associationKey)) });
    if (!priorReview || !isCoverageJourneyPolicy(priorReview.reviewedValue) || JSON.stringify(priorAtpeScope(row.value)) !== JSON.stringify(priorAtpeScope(priorReview.reviewedValue))) throw new Error(`ATPE/shared journey changed outside this general-term approval: ${productKey}`);
    const rules: AssociationUnderwriting[] = associations.flatMap(associationKey => ["member", "spouse"].map(applicantKey => ({ associationKey, applicantKey, bands: productKey === "li-group-term" ? [
      { minimumAgeYears: 18, maximumAgeYears: 54, maximumAmount: 500000, pathway: "QD" as const, healthPage: "health-qd" as const },
      { minimumAgeYears: 18, maximumAgeYears: 54, minimumAmount: 500000, minimumAmountExclusive: true, pathway: "QD" as const, healthPage: "health-li" as const },
      { minimumAgeYears: 55, maximumAgeYears: 60, pathway: "QD" as const, healthPage: "health-li" as const },
      { minimumAgeYears: 61, maximumAgeYears: 64, pathway: "FUW" as const, healthPage: "health-li" as const },
    ] : productKey === "li-10yr" ? [
      { minimumAgeYears: 20, maximumAgeYears: 60, pathway: "QD" as const, healthPage: "health-li" as const },
      { minimumAgeYears: 61, maximumAgeYears: 64, pathway: "FUW" as const, healthPage: "health-li" as const },
    ] : [{ minimumAgeYears: 20, maximumAgeYears: 54, pathway: "QD" as const, healthPage: "health-li" as const }] })));
    row.value.associationUnderwriting = [...(row.value.associationUnderwriting ?? []).filter(rule => !associations.includes(rule.associationKey)), ...rules];
    // Reconcile the shared owning record only after proving its ATPE and other
    // properties unchanged; the appended general rules have this approval.
    priorReview.reviewedValue = structuredClone(row.value);
    selected.push({ key: row.key, rules });
  }
  const eligibility = db.configurationValues.find(row => row.key === "isitrust.li-20yr.association-eligibility");
  if (!eligibility || !isAssociationEligibilityPolicy(eligibility.value)) throw new Error("Missing 20-Year Association eligibility owner");
  const review = db.semanticRequirements.find(row => row.key === "business-decision.rules-review.atpe-native-owners")?.value as unknown as { owners?: Array<{ table: string; key: string; column?: string; reviewedValue: unknown }> } | undefined;
  const previous = review?.owners?.find(owner => owner.table === "configurationValues" && owner.key === eligibility.key && owner.column === "value");
  const retained = (value: typeof eligibility.value) => ({ ...value, rules: value.rules.filter(rule => !associations.includes(rule.associationKey)) });
  if (!previous || !isAssociationEligibilityPolicy(previous.reviewedValue) || JSON.stringify(retained(eligibility.value)) !== JSON.stringify(retained(previous.reviewedValue))) throw new Error("20-Year ATPE eligibility changed outside the general age approval");
  const eligibilityRules = associations.flatMap(associationKey => (["member", "spouse"] as const).map(applicantKey => ({ associationKey, applicantKey, eligible: true, minimumAgeYears: 20, maximumAgeYears: 54 })));
  eligibility.value.rules = [...eligibility.value.rules.filter(rule => !associations.includes(rule.associationKey)), ...eligibilityRules];
  previous.reviewedValue = structuredClone(eligibility.value);
  const key = isitrustTermUnderwritingDecisionKey;
  const decision = { id: key, key, ...libraryMetadata("semanticRequirements", key, reference), domain: "approved-business-decision", subjectTable: "sites", subjectKey: "isitrust", predicate: "association-term-underwriting", status: "documented", value: {
    approvalStatus: "approved", authority: reference, sourceReconciliation: "approved-new-template-interpretation", runtimeActivation: "reviewed-seed", sourceReferences: ["Main!Z278", "Main!AA278", "Main!O284", "Main!P284", "QD LI!J74", "QD LI!K74", "QD LI!O74", "QD LI!P74", "Main!Z283", "Main!AA283", "Main!Z284", "Main!AA284", "QD LI!J75", "QD LI!K75", "QD LI!O75", "QD LI!P75", "QD LI!J76", "QD LI!K76", "QD LI!O76", "QD LI!P76"], selected, selectedEligibility: { key: eligibility.key, rules: eligibilityRules },
    interpretation: "For explicitly assigned non-ATPE Associations, Group Term uses QD at 18–60, short questions only at 18–54 and at most $500,000, full Life questions for higher amounts/55–60, and FUW with full Life questions at 61–64. 10-Year uses QD through age 60 and FUW at 61–64; 20-Year eligibility and QD are both ages 20–54 for member and spouse. Every permitted adult fixed-term amount uses the full source Life questionnaire. Supporting QD table bands and this user decision supersede conflicting Main No QD flags. Native captured policies previously fell back to FUW; the older shared catalog QD rule is historical evidence, not the captured owner.",
    preserved: "ATPE's distinct source rules, child processing/question participation, other eligibility and benefit limits, other products and the STD exception",
    destinations: [...selected.map(row => ({ table: "configurationValues", key: row.key, column: "value.associationUnderwriting" })), { table: "configurationValues", key: eligibility.key, column: "value.rules" }],
  } as unknown as Json };
  const index = db.semanticRequirements.findIndex(row => row.key === key);
  if (index < 0) db.semanticRequirements.push(decision); else db.semanticRequirements[index] = decision;
}
