import { isBenefitPolicy, type BenefitPolicy } from "./benefitPolicy";
import type { RuleProvenance } from "./effectiveSite";

/** Version 2 stores benefit modifiers and references an exact amount assignment.
 * Version 1 remains readable for captured historical drafts and releases. */
export type BenefitAmountSource = {
  key: string;
  status: string;
  value: { applicantTypeKey: string | null; applicantClass: string | null };
  provenance: RuleProvenance[];
  amount: null | {
    status: string;
    pattern: { value: { amountType: string; increment: number | null }; provenance: RuleProvenance[] };
    bands: { value: { minimum: number | null; maximum: number | null; increment: number | null }; provenance: RuleProvenance[] }[];
    options: { value: { value: string }; provenance: RuleProvenance[] }[];
  };
};
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);

export function linkBenefitPolicy(policy: BenefitPolicy, amountRuleKeys: string[]) {
  if (policy.applicants.length !== amountRuleKeys.length) throw new Error("Incomplete benefit amount references");
  return { ...policy, version: 2, amountSource: "product-amount-rules", applicants: policy.applicants.map((applicant, index) => {
    const { minimum: _min, maximum: _max, increment: _increment, amountChoices: _choices, ...modifiers } = applicant;
    void _min; void _max; void _increment; void _choices;
    return { ...modifiers, amountRuleKey: amountRuleKeys[index] };
  }) };
}

export function materializeBenefitPolicy(value: unknown, sources: BenefitAmountSource[]) {
  const unchanged = { value, provenance: [] as RuleProvenance[], error: undefined as string | undefined };
  if (!object(value) || value.version !== 2) return unchanged;
  const invalid = () => ({ ...unchanged, error: "Invalid or unresolved structured benefit amount reference" });
  if (value.amountSource !== "product-amount-rules" || !Array.isArray(value.applicants)) return invalid();
  const applicants: Record<string, unknown>[] = [];
  const provenance: RuleProvenance[] = [];
  const referenced = new Set<string>();
  for (const row of value.applicants) {
    if (!object(row) || typeof row.amountRuleKey !== "string" || referenced.has(row.amountRuleKey)
      || ["minimum", "maximum", "increment", "amountChoices"].some(key => key in row)) return invalid();
    const matches = sources.filter(source => source.key === row.amountRuleKey);
    if (matches.length !== 1) return invalid();
    const source = matches[0], amount = source.amount;
    if (source.status !== "resolved" || amount?.status !== "resolved"
      || source.value.applicantTypeKey !== row.applicantKey
      || source.value.applicantClass !== (row.applicantClass ?? null)) return invalid();
    referenced.add(row.amountRuleKey);
    const { amountRuleKey: _reference, ...modifiers } = row;
    void _reference;
    let base: { minimum: number | null; maximum: number | null; increment: number | null; amountChoices?: number[] };
    if (amount.pattern.value.amountType === "range" && amount.bands.length === 1 && !amount.options.length) {
      const { minimum, maximum, increment } = amount.bands[0].value;
      base = { minimum, maximum, increment };
    } else if (amount.pattern.value.amountType === "set" && !amount.bands.length && amount.options.length) {
      const choices = amount.options.map(option => Number(option.value.value));
      base = { minimum: Math.min(...choices), maximum: Math.max(...choices), increment: amount.pattern.value.increment, amountChoices: choices };
    } else return invalid();
    applicants.push({ ...modifiers, ...base });
    provenance.push(...source.provenance, ...amount.pattern.provenance, ...amount.bands.flatMap(band => band.provenance), ...amount.options.flatMap(option => option.provenance));
  }
  // Every amount scope must participate; a stray unreferenced class cannot gain
  // a different UI path from the benefit evaluator.
  if (sources.length !== referenced.size) return invalid();
  const policy = { ...value, version: 1, applicants };
  if (!isBenefitPolicy(policy)) return invalid();
  return { value: policy, provenance, error: undefined };
}
