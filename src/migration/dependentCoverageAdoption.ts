import type { DatabaseSchema, Json } from "../persistence/types";
import { libraryMetadata } from "../domain/provenance";
import { isDependentPolicy, type DependentPolicy, type DependentRule } from "../domain/dependentPolicy";
import { isLifeAggregatePolicy, type LifeAggregatePolicy } from "../domain/lifeAggregatePolicy";
import { activeSiteMainRows } from "./activeSiteIdentity";
import { applyActiveSiteNumericAdoption, type AmountSlice } from "./activeSiteNumericAdoption";
import { mcrSource, type SourceCell } from "./mcr";
import { provisionalDecisionAuthority, provisionalDecisionReference } from "./provisionalSourceDecisions";

const range = (minimum: number, maximum: number, increment: number) => ({ kind: "range" as const, minimum, maximum, increment });
export const dependentNumericSlices: AmountSlice[] = [
  { siteKey: "ama", productKey: "sh-hospital-income", amounts: [range(100, 600, 100), range(100, 600, 100), range(100, 600, 100)] },
  { siteKey: "ama", productKey: "li-premier-accident", amounts: [[500000, 750000, 1000000], [200000, 250000, 300000, 375000, 400000, 500000], [50000, 75000, 100000, 112500, 150000]] },
  { siteKey: "isitrust", productKey: "li-add", amounts: [range(50000, 750000, 50000), [...new Set(Array.from({ length: 15 }, (_, index) => [(index + 1) * 50000 * .4, (index + 1) * 50000 * .5]).flat())].sort((a, b) => a - b), [...new Set(Array.from({ length: 15 }, (_, index) => [(index + 1) * 50000 * .1, (index + 1) * 50000 * .15]).flat())].sort((a, b) => a - b)] },
  { siteKey: "isitrust", productKey: "sh-hospital-income", amounts: [[100, 200, 300, 400], [100, 200, 300, 400], [100, 200, 300, 400]] },
  { siteKey: "isitrust", productKey: "li-50plus", amounts: [range(5000, 50000, 5000), range(5000, 50000, 5000), null] },
  { siteKey: "nso", productKey: "li-add", amounts: [[100000, 150000, 200000, 250000], [40000, 50000, 60000, 75000, 80000, 100000, 125000], [10000, 15000, 20000, 22500, 25000, 30000, 37500]] },
];
const requireMember = { applicantKeys: ["member"], mode: "covered" as const };
const lifeProducts: Record<string, string[]> = {
  "abe": ["li-term", "li-10yr", "li-20yr", "li-50plus"],
  "ama": ["li-term", "li-10yr", "li-15yr", "li-20yr", "li-preferred"],
  "asce": ["li-term", "li-10yr", "li-20yr"],
  "avma": ["li-group-term", "li-10yr", "li-20yr"],
  "nso": ["li-term", "li-50plus", "li-10yr", "li-20yr"],
};
type Slice = { siteKey: string; productKey: string; references: string[]; policy: DependentPolicy };
const policy = (rules: DependentRule[], revisit: string[] = []): DependentPolicy => ({ version: 1, rules, provisional: revisit.length > 0, revisit });
const onlyOne = (siteKey: string) => ({ productKeys: lifeProducts[siteKey], count: 1 });
const family = (applicantKey: "spouse" | "child"): DependentRule => ({ applicantKey, applicationRole: "included-benefit", requires: { applicantKeys: ["member"], mode: "selected" }, derived: { baseApplicantKey: "member", multiplier: applicantKey === "spouse" ? .5 : .15, siblingApplicantKey: applicantKey === "spouse" ? "child" : "spouse", withSiblingMultiplier: applicantKey === "spouse" ? .4 : .1 } });

export const dependentCoverageSlices: Slice[] = [
  ...["li-term", "li-10yr", "li-20yr", "li-50plus", "li-add", "sh-critical-illness", "sh-hospital-money"].map((productKey): Slice => ({ siteKey: "abe", productKey, references: [`Main!I${activeSiteMainRows["abe"][productKey]}`, `Main!J${activeSiteMainRows["abe"][productKey]}`], policy: policy([
    { applicantKey: "spouse", memberCapMultiplier: 1, ...(!["li-term", "sh-critical-illness"].includes(productKey) ? { requires: requireMember } : {}) },
    ...(!["li-50plus", "sh-critical-illness"].includes(productKey) ? [{ applicantKey: "child" as const, requires: requireMember, ...(productKey === "li-term" || productKey === "sh-hospital-money" ? { memberCapMultiplier: 1 } : {}), ...(["li-term", "li-10yr", "li-20yr"].includes(productKey) ? { maximumPlans: onlyOne("abe") } : {}) }] : []),
  ]) })),
  ...["li-term", "li-10yr", "li-20yr"].map((productKey): Slice => ({ siteKey: "asce", productKey, references: [`Main!J${activeSiteMainRows["asce"][productKey]}`], policy: policy([{ applicantKey: "child", requires: requireMember, maximumPlans: onlyOne("asce") }]) })),
  { siteKey: "asce", productKey: "li-add", references: ["Main!I168", "Main!J168"], policy: policy([{ applicantKey: "spouse", requires: requireMember, memberCapMultiplier: 1 }, { applicantKey: "child", requires: requireMember }]) },
  ...["li-group-term", "li-10yr", "li-20yr"].map((productKey): Slice => ({ siteKey: "avma", productKey, references: [`Main!J${activeSiteMainRows["avma"][productKey]}`], policy: policy([{ applicantKey: "child", requires: { applicantKeys: ["member", "spouse"], mode: "covered" }, maximumPlans: onlyOne("avma") }]) })),
  { siteKey: "avma", productKey: "li-50plus", references: ["Main!I190"], policy: policy([{ applicantKey: "spouse", requires: requireMember, memberCapMultiplier: 1 }]) },
  { siteKey: "ama", productKey: "sh-hospital-income", references: ["Main!I117", "Main!J117"], policy: policy(["spouse", "child"].map(applicantKey => ({ applicantKey: applicantKey as "spouse" | "child", applicationRole: "included-benefit", requires: { applicantKeys: ["member"], mode: "selected" }, derived: { baseApplicantKey: "member", multiplier: 1 } }))) },
  { siteKey: "ama", productKey: "li-premier-accident", references: ["Main!H126", "Main!I126", "Main!J126"], policy: policy([family("spouse"), family("child")]) },
  { siteKey: "isitrust", productKey: "li-add", references: ["Main!H282", "Main!I282", "Main!J282"], policy: policy([family("spouse"), family("child")], ["ISI child percentage with both spouse and child is not stated in Main282. Use 10% provisionally and revisit; other percentages are explicit."]) },
  ...["li-group-term", "li-10yr", "li-20yr", "sh-critical-illness"].map((productKey): Slice => ({ siteKey: "isitrust", productKey, references: [`Main!I${activeSiteMainRows["isitrust"][productKey]}`], policy: policy([{ applicantKey: "spouse", memberCapMultiplier: 1, capBehavior: "notice" }]) })),
  { siteKey: "nso", productKey: "li-add", references: ["Main!H320", "Main!I320", "Main!J320"], policy: policy([family("spouse"), family("child")], ["Main320 establishes family coverage without dependent percentage amounts. Use spouse50%/40% and child15%/10% as provisional working values; revisit the NSO coverage-detail schedule."]) },
  { siteKey: "waepa", productKey: "li-group-term", references: ["Main!I379", "Main!J379"], policy: policy([{ applicantKey: "spouse", requires: requireMember, memberCapMultiplier: .5 }, { applicantKey: "child", requires: requireMember }]) },
];
const metadata = (table: string, key: string, reference: string) => ({ id: key, key, ...libraryMetadata(table, key, reference) });

export function applyDependentCoverageAdoption(db: DatabaseSchema, cells: readonly SourceCell[]) {
  const actual = new Map(cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const expected = new Map(mcrSource.cells.map(cell => [`${cell.sheet}!${cell.cell}`, cell]));
  const references = [...new Set([...dependentCoverageSlices.flatMap(slice => slice.references), ...Object.entries(lifeProducts).flatMap(([siteKey, products]) => products.map(productKey => `Main!K${activeSiteMainRows[siteKey][productKey]}`)), "Main!H187", "Main!I187", "Main!H190", "Main!I190"])];
  for (const reference of references) if (!expected.has(reference) || JSON.stringify(actual.get(reference)) !== JSON.stringify(expected.get(reference)) || !db.sourceRequirements.some(row => row.sheetKey === "main" && `Main!${row.cell}` === reference)) throw new Error(`Dependent source changed: ${reference}`);
  for (const slice of dependentCoverageSlices) if (!isDependentPolicy(slice.policy)) throw new Error(`Invalid dependent policy: ${slice.productKey}`);
  applyActiveSiteNumericAdoption(db, cells, dependentNumericSlices);
  const store = (siteKey: string, key: string, kind: "product-dependent-policy" | "site-life-aggregate", value: Json, references: string[], productKey?: string) => {
    const reference = references.join("; ");
    const previousRow = db.configurationValues.find(row => row.key === key);
    const previous = previousRow?.value;
    const configurationKey = previousRow?.configurationKey ?? key;
    if (kind === "product-dependent-policy" && isDependentPolicy(previous) && previous.associationRules && isDependentPolicy(value)) value = { ...value, associationRules: previous.associationRules } as unknown as Json;
    if (configurationKey === key) {
      db.configurationDefinitions = db.configurationDefinitions.filter(row => row.key !== key);
      db.configurationDefinitions.push({ ...metadata("configurationDefinitions", key, reference), definition: { path: null, metadata: { version: 1, fullPolicyAcceptance: "pending" }, target: kind === "site-life-aggregate" ? { kind } : { kind, productKey: productKey! } }, position: 0 });
    }
    db.configurationValues = db.configurationValues.filter(row => row.key !== key);
    db.configurationValues.push({ ...metadata("configurationValues", key, reference), scope: "site", clientKey: null, siteKey, configurationKey, value, position: 0 });
    const decisionKey = `migration-decision.${key}`;
    db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
    db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, reference), domain: "reviewed-site-adoption", subjectTable: "sites", subjectKey: siteKey, predicate: kind, status: "partial", value: { productKey: productKey ?? null, runtimeActivation: "pending", fullPolicyAcceptance: "pending", destinations: [{ table: "configurationValues", key, column: "value" }] } });
    for (const sourceReference of references) {
      const requirement = db.sourceRequirements.find(row => row.sheetKey === "main" && `Main!${row.cell}` === sourceReference)!;
      requirement.promotionState = "SITE_CONFIGURATION";
      if (!requirement.promotionReason.startsWith("Provisional working decision") && !requirement.promotionReason.startsWith("User-confirmed")) requirement.promotionReason = "Dependent or aggregate dimension is executable; full product acceptance remains separate.";
      requirement.activeSiteKeys = [...new Set([...(Array.isArray(requirement.activeSiteKeys) ? requirement.activeSiteKeys as string[] : []), siteKey])];
      const targetKey = `${decisionKey}.${requirement.key}`;
      db.requirementTargets = db.requirementTargets.filter(row => row.key !== targetKey);
      db.requirementTargets.push({ ...metadata("requirementTargets", targetKey, sourceReference), requirementKey: requirement.key, targetTable: "configurationValues", targetKey: key, targetColumn: "value" });
    }
  };
  for (const slice of dependentCoverageSlices) {
    const key = `${slice.siteKey}.${slice.productKey}.reviewed-dependent-policy`;
    store(slice.siteKey, key, "product-dependent-policy", slice.policy as unknown as Json, slice.references, slice.productKey);
    if (slice.policy.provisional) {
      const decisionKey = `provisional-decision.${slice.siteKey}.${slice.productKey}.family-benefits`;
      db.semanticRequirements = db.semanticRequirements.filter(row => row.key !== decisionKey);
      db.semanticRequirements.push({ ...metadata("semanticRequirements", decisionKey, provisionalDecisionReference), domain: "provisional-source-decision", subjectTable: "sites", subjectKey: slice.siteKey, predicate: "family-benefits", status: "documented", value: { authority: provisionalDecisionAuthority, adoptedOn: "2026-10-02", sourceReconciliation: "deferred", revisit: true, issues: slice.policy.revisit, selected: slice.policy as unknown as Json, sourceReferences: slice.references, destinations: [{ table: "configurationValues", key, column: "value" }], runtimeActivation: "pending", reference: provisionalDecisionReference } });
    }
  }
  for (const [siteKey, productKeys] of Object.entries(lifeProducts)) {
    const value: LifeAggregatePolicy = { version: 1, groups: [{ key: `${siteKey}.life-per-person`, applicantKeys: ["member", "spouse", "child"], productKeys, maximum: siteKey === "ama" ? 4000000 : siteKey === "nso" ? 800000 : 2000000 }] };
    if (!isLifeAggregatePolicy(value)) throw new Error(`Invalid aggregate: ${siteKey}`);
    // Main K190 says aggregate, but H/I190 explicitly exclude 45+; H/I187–189
    // explicitly exclude Basic Protection as well. Specific exclusions take precedence.
    const sources = productKeys.map(productKey => `Main!K${activeSiteMainRows[siteKey][productKey]}`);
    if (siteKey === "avma") sources.push("Main!H187", "Main!I187", "Main!H190", "Main!I190");
    store(siteKey, `${siteKey}.reviewed-life-aggregate`, "site-life-aggregate", value as unknown as Json, sources);
  }
}
