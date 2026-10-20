import type { EffectiveSite } from "./effectiveSite";
import { isLifeAggregatePolicy } from "./lifeAggregatePolicy";
import { isBenefitPolicy } from "./benefitPolicy";

export type AggregateInspectionRow = {
  key: string; siteKey: string; clientKey: string; category: string;
  applicants: string; maximum: string; included: string[]; excluded: string[];
  notes: string[]; sources: string[];
};
const money = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

/** Inspect the same authored policies used by validation. Never infer an aggregate
 * from an individual product maximum or the prototype category defaults. */
export function inspectSiteAggregates(site: EffectiveSite): AggregateInspectionRow[] {
  const products = site.configuration.products;
  const keys = new Set(products.map(product => product.productKey));
  const validateProducts = (selected: string[]) => {
    if (selected.some(key => !keys.has(key))) throw new Error(`Aggregate references an unavailable product: ${site.siteKey}`);
  };
  const label = (key: string) => {
    const name = products.find(product => product.productKey === key)?.catalog?.value.name;
    return name ? `${name} (${key})` : key;
  };
  const row = (key: string, category: string, productKeys: string[], applicants: string, maximum: string, notes: string[], sources: string[]): AggregateInspectionRow => {
    validateProducts(productKeys);
    return { key, siteKey: site.siteKey, clientKey: site.clientKey, category, applicants, maximum,
      included: productKeys.map(label), excluded: products.filter(product => product.catalog?.value.categoryKey === category && !productKeys.includes(product.productKey)).map(product => label(product.productKey)), notes, sources: [...new Set(sources)] };
  };
  const result: AggregateInspectionRow[] = [];
  if (site.configuration.lifeAggregates.length > 1) throw new Error(`Ambiguous life aggregate policy: ${site.siteKey}`);
  for (const policy of site.configuration.lifeAggregates) {
    if (!isLifeAggregatePolicy(policy.value)) throw new Error(`Invalid life aggregate policy: ${site.siteKey}`);
    for (const group of policy.value.groups) result.push(row(group.key, "LI", group.productKeys, `${group.applicantKeys.join(", ")} (per person)`, money(group.maximum), ["Includes existing coverage in this group."], policy.provenance.flatMap(source => source.sourceReference ? [source.sourceReference] : [])));
  }
  const groups = new Map<string, { signature: string; row: AggregateInspectionRow }>();
  for (const product of products) {
    if (product.benefitPolicies.length > 1) throw new Error(`Ambiguous benefit policy: ${product.productKey}`);
    for (const policy of product.benefitPolicies) {
      if (!isBenefitPolicy(policy.value)) throw new Error(`Invalid benefit policy: ${product.productKey}`);
      const aggregate = policy.value.aggregate;
      if (!aggregate) continue;
      const identity = [...aggregate.productKeys].sort().join("/");
      const signature = JSON.stringify(aggregate);
      const sources = policy.provenance.flatMap(source => source.sourceReference ? [source.sourceReference] : []);
      const existing = groups.get(identity);
      if (existing) {
        if (existing.signature !== signature) throw new Error(`Conflicting benefit aggregate policies: ${site.siteKey}`);
        existing.row.sources = [...new Set([...existing.row.sources, ...sources])];
        continue;
      }
      const notes = ["Includes existing coverage in this group."];
      if (aggregate.income) {
        const income = aggregate.income;
        notes.push(`Also capped at ${income.fraction * 100}% of monthly income${income.threshold !== undefined ? `; ${income.lowerFraction! * 100}% when income is ${income.thresholdInclusive ? "at or below" : "below"} ${money(income.threshold)}` : ""}.`);
      }
      if (aggregate.spouseIncomeFraction !== undefined) notes.push(`Spouse: also capped at ${aggregate.spouseIncomeFraction * 100}% of monthly income.`);
      if (aggregate.compareMemberTotal) notes.push("Spouse total cannot exceed member total.");
      if (aggregate.excludeRetirement) notes.push("Retirement benefits are excluded from this aggregate.");
      if (policy.value.provisional) notes.push(`Provisional: ${policy.value.revisit.join(" ")}`);
      const item = row(`${site.siteKey}.benefit.${identity}`, product.catalog?.value.categoryKey ?? "DI", aggregate.productKeys,
        [...new Set(policy.value.applicants.map(applicant => applicant.applicantKey))].join(", "),
        `${money(aggregate.maximum)}/month${aggregate.spouseMaximum !== undefined ? `; spouse ${money(aggregate.spouseMaximum)}/month` : ""}`, notes, sources);
      groups.set(identity, { signature, row: item });
    }
  }
  result.push(...[...groups.values()].map(group => group.row));
  for (const category of ["LI", "DI"]) {
    if (!result.some(item => item.category === category) && products.some(product => product.catalog?.value.categoryKey === category)) {
      result.push({ key: `${site.siteKey}.${category}.pending`, siteKey: site.siteKey, clientKey: site.clientKey, category, applicants: "—", maximum: "Not yet migrated", included: [], excluded: [], notes: ["No reviewed aggregate policy is recorded. Individual product limits are separate."], sources: [] });
    }
  }
  return result;
}
