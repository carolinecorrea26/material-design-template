/** Quote assumptions are independent from question visibility and underwriting classes. */
export type RateClassPolicy = {
  classes: string[];
  selection: "fixed" | "tobacco" | "single" | "unresolved";
  fixedClass?: string;
  byTobacco?: { yes: string; no: string };
  sourceReferences: string[];
  sourceText?: string;
  provisional?: boolean;
  revisit?: string;
};
export function isRateClassPolicy(value: unknown): value is RateClassPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as RateClassPolicy;
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === "string" && !!s.trim());
  return strings(p.classes) && new Set(p.classes).size === p.classes.length && strings(p.sourceReferences) && (p.sourceText === undefined || typeof p.sourceText === "string") && (p.provisional === undefined || typeof p.provisional === "boolean") && (p.revisit === undefined || typeof p.revisit === "string") && (
    p.selection === "unresolved" || p.selection === "single" && p.classes.length === 1 || p.selection === "fixed" && typeof p.fixedClass === "string" && p.classes.includes(p.fixedClass) || p.selection === "tobacco" && !!p.byTobacco && [p.byTobacco.yes, p.byTobacco.no].every(c => p.classes.includes(c)));
}
export function resolveRateClass(policy: RateClassPolicy, tobacco: unknown) {
  if (policy.selection === "single") return policy.classes[0];
  if (policy.selection === "fixed") return policy.fixedClass;
  if (policy.selection === "tobacco" && (tobacco === "yes" || tobacco === "no")) return policy.byTobacco![tobacco];
  return undefined;
}
