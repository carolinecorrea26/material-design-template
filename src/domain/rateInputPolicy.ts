import { isRateClassPolicy, resolveRateClass, type RateClassPolicy } from "./rateClassPolicy";
/** Pricing dimensions and field participation are independent. "provisional"
 * explicitly retains a working assumption where source evidence is incomplete. */
export type RateDimension = "rateClass" | "membership" | "age" | "gender" | "tobacco" | "jurisdiction" | "amount" | "applicant" | "waitingPeriod" | "benefitPeriod" | "association" | "riders";
export type RateInputPolicy = { version: 1; rateClass?: RateClassPolicy; dimensions: Partial<Record<RateDimension, "required" | "ignored" | "provisional">>; sourceReferences: string[]; authority: "source" | "provisional"; overrides?: Array<{ jurisdictions: string[]; dimensions: Partial<Record<RateDimension, "required" | "ignored" | "provisional">>; rateClass?: RateClassPolicy; sourceReferences: string[] }> };
export function collectRateInputs(policy: RateInputPolicy, facts: Partial<Record<RateDimension, unknown>>) {
  const inputs: Partial<Record<RateDimension, unknown>> = {};
  const missing: RateDimension[] = [];
  const errors: RateDimension[] = [];
  let rateClass = policy.rateClass;
  const dimensions = { ...policy.dimensions };
  for (const override of policy.overrides ?? []) if (typeof facts.jurisdiction === "string" && override.jurisdictions.includes(facts.jurisdiction.replace(/^US-/, ""))) { Object.assign(dimensions, override.dimensions); rateClass = override.rateClass ?? rateClass; }
  for (const [key, participation] of Object.entries(dimensions)) {
    const dimension = key as RateDimension;
    if (participation === "ignored") continue;
    const value = dimension === "rateClass" && rateClass ? resolveRateClass(rateClass, facts.tobacco) : facts[dimension];
    if (value === undefined || value === null || value === "") missing.push(dimension);
    else {
      const valid = dimension === "membership" ? typeof value === "boolean" : dimension === "age" ? typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 120 : dimension === "amount" ? typeof value === "number" && Number.isFinite(value) && value > 0 : dimension === "riders" ? Array.isArray(value) && value.every(key => typeof key === "string" && !!key) : dimension === "gender" ? ["male", "female"].includes(String(value)) : dimension === "tobacco" ? ["yes", "no"].includes(String(value)) : dimension === "applicant" ? ["member", "spouse", "child"].includes(String(value)) : typeof value === "string" && value.trim().length > 0;
      if (!valid) errors.push(dimension);
      else inputs[dimension] = value;
    }
  }
  return { inputs, missing, errors };
}
export function isRateInputPolicy(value: unknown): value is RateInputPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as RateInputPolicy;
  const dimensions: RateDimension[] = ["rateClass", "membership", "age", "gender", "tobacco", "jurisdiction", "amount", "applicant", "waitingPeriod", "benefitPeriod", "association", "riders"];
  return (policy.rateClass === undefined || isRateClassPolicy(policy.rateClass)) && (policy.overrides === undefined || Array.isArray(policy.overrides) && policy.overrides.every(override => override && Array.isArray(override.jurisdictions) && override.jurisdictions.length > 0 && override.jurisdictions.every(j => typeof j === "string" && /^[A-Z]{2}$/.test(j)) && isRateInputPolicy({ version: 1, rateClass: override.rateClass, dimensions: override.dimensions, sourceReferences: override.sourceReferences, authority: "source" }))) && policy.version === 1 && ["source", "provisional"].includes(policy.authority) && Array.isArray(policy.sourceReferences) && policy.sourceReferences.every(reference => typeof reference === "string" && reference.length > 0) && !!policy.dimensions && typeof policy.dimensions === "object" && !Array.isArray(policy.dimensions) && Object.entries(policy.dimensions).length > 0 && Object.entries(policy.dimensions).every(([key, participation]) => dimensions.includes(key as RateDimension) && ["required", "ignored", "provisional"].includes(participation));
}
