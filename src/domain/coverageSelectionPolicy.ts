import type { EffectiveSite, RuleProvenance } from "./effectiveSite";

export type ApplicationMode = "new" | "increase" | "rider-only";
export type RiderAmount = { kind: "none" } | { kind: "choices"; values: number[]; default: number } | { kind: "fixed"; value: number } | { kind: "base-multiplier"; multiplier: number; maximum: number };
export type SelectionPolicy = {
  version: 1;
  modes: ApplicationMode[];
  amountMeaning: "resulting-total";
  existingPolicyRequired: boolean;
  riderOnlyApplicants: string[];
  riders: Array<{
    key: string; applicants: string[]; included: boolean;
    minimumBase: number; maximumBase?: number; maximumAge: number | null;
    requires: string[]; incompatible: string[];
    amount: RiderAmount;
    amountByApplicant?: Record<string, RiderAmount>;
    minimumAge?: number;
    amountCap?: { baseFraction?: number; combinedMaximum?: number; minimumNewAmount?: number };
    excludedJurisdictions: string[];
  }>;
  childSchedule: null | { bands: Array<{ minimumAgeDays: number; maximumAgeDays: number; amount: number }>; memberMaximumFraction: number; primaryCoverageBasis?: "member-only" | "member-or-spouse"; maximumAgeYears?: number };
  skipPaymentForExisting: boolean;
  skipPaymentForChildOnly: boolean;
  healthForRiderOnly: boolean;
  provisional: boolean;
  revisit: string[];
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === "string" && x.length > 0) && new Set(v).size === v.length;
export function isSelectionPolicy(v: unknown): v is SelectionPolicy {
  if (!object(v) || v.version !== 1 || !strings(v.modes) || !v.modes.length || v.modes.some(m => !["new", "increase", "rider-only"].includes(m)) || v.amountMeaning !== "resulting-total" || !strings(v.riderOnlyApplicants) || !strings(v.revisit) || !["existingPolicyRequired", "skipPaymentForExisting", "skipPaymentForChildOnly", "healthForRiderOnly", "provisional"].every(k => typeof v[k] === "boolean") || !Array.isArray(v.riders)) return false;
  const validAmount = (a: unknown): a is RiderAmount => {
    if (!object(a)) return false;
    if (a.kind === "none") return true;
    if (a.kind === "fixed") return finite(a.value);
    if (a.kind === "base-multiplier") return finite(a.multiplier) && finite(a.maximum);
    return a.kind === "choices" && Array.isArray(a.values) && a.values.length > 0 && a.values.every(finite) && new Set(a.values).size === a.values.length && finite(a.default) && a.values.includes(a.default);
  };
  const keys = new Set<string>();
  for (const r of v.riders) {
    if (!object(r) || typeof r.key !== "string" || !r.key || keys.has(r.key) || !strings(r.applicants) || !r.applicants.length || typeof r.included !== "boolean" || !finite(r.minimumBase) || r.maximumBase !== undefined && (!finite(r.maximumBase) || r.maximumBase < r.minimumBase) || r.maximumAge !== null && (!finite(r.maximumAge) || !Number.isInteger(r.maximumAge)) || !strings(r.requires) || !strings(r.incompatible) || !strings(r.excludedJurisdictions) || !object(r.amount)) return false;
    keys.add(r.key);
    if (!validAmount(r.amount) || r.amountByApplicant !== undefined && (!object(r.amountByApplicant) || !Object.entries(r.amountByApplicant).every(([key, a]) => (r.applicants as string[]).includes(key) && validAmount(a)))) return false;
    if (r.minimumAge !== undefined && (!finite(r.minimumAge) || !Number.isInteger(r.minimumAge) || r.maximumAge !== null && r.minimumAge > Number(r.maximumAge))) return false;
    if (r.amountCap !== undefined && (!object(r.amountCap) || !Object.entries(r.amountCap).every(([key, n]) => ["baseFraction", "combinedMaximum", "minimumNewAmount"].includes(key) && finite(n)))) return false;
  }
  if (v.riders.some(r => !object(r) || (r.requires as string[]).some(k => !keys.has(k) || k === r.key) || (r.incompatible as string[]).some(k => !keys.has(k) || k === r.key))) return false;
  // Dependencies must terminate. An included dependency cycle cannot be satisfied by elections.
  const riderRows = v.riders as Array<{ key: string; requires: string[] }>;
  const visited = new Set<string>(), visiting = new Set<string>();
  const visit = (key: string): boolean => {
    if (visiting.has(key)) return false;
    if (visited.has(key)) return true;
    visiting.add(key);
    const r = riderRows.find(r => r.key === key)!;
    if (!r.requires.every(visit)) return false;
    visiting.delete(key); visited.add(key); return true;
  };
  if (![...keys].every(visit)) return false;
  if (v.childSchedule !== null) {
    if (!object(v.childSchedule) || !finite(v.childSchedule.memberMaximumFraction) || v.childSchedule.memberMaximumFraction > 1 || !Array.isArray(v.childSchedule.bands) || !v.childSchedule.bands.length) return false;
    if (v.childSchedule.primaryCoverageBasis !== undefined && !["member-only", "member-or-spouse"].includes(String(v.childSchedule.primaryCoverageBasis)) || v.childSchedule.maximumAgeYears !== undefined && (!finite(v.childSchedule.maximumAgeYears) || !Number.isInteger(v.childSchedule.maximumAgeYears))) return false;
    let previous = -1;
    for (const b of v.childSchedule.bands) {
      if (!object(b) || !finite(b.minimumAgeDays) || !finite(b.maximumAgeDays) || !Number.isInteger(b.minimumAgeDays) || !Number.isInteger(b.maximumAgeDays) || b.minimumAgeDays > b.maximumAgeDays || b.minimumAgeDays <= previous || !finite(b.amount)) return false;
      previous = b.maximumAgeDays;
    }
  }
  return true;
}
export type SelectionFacts = {
  mode: ApplicationMode; applicantKey: string; baseAmount?: number; ageYears?: number;
  jurisdiction?: string; existingPolicyVerified?: boolean; existingAmount?: number;
  memberAmount?: number; spouseAmount?: number; childAgeDays?: number; onlyChild?: boolean;
};
export type SelectionElection = { riders: string[]; riderAmounts: Record<string, number> };

/** Pure reconciliation. Repeated execution converges, discards orphan amounts and
 * recomputes locked benefits from the same persisted policy as validation. */
export function reconcileCoverageSelection(policy: SelectionPolicy, facts: SelectionFacts, election: SelectionElection) {
  const errors: string[] = [], missing = new Set<string>();
  const fail = (reason: string) => ({ status: "unresolved" as const, allowed: false, errors: [reason], missingFacts: [], election: { riders: [], riderAmounts: {} as Record<string, number> }, locked: [] as string[], childAmount: null, skipPayment: false, skipBeneficiary: false, healthRequired: false });
  if (!isSelectionPolicy(policy)) return fail("Invalid selection policy");
  if (typeof facts.applicantKey !== "string" || !["member", "spouse", "child"].includes(facts.applicantKey)) errors.push("Applicant is unavailable");
  if (!policy.modes.includes(facts.mode)) errors.push("Application mode is unavailable");
  if (facts.mode !== "new" && policy.existingPolicyRequired && facts.existingPolicyVerified !== true) missing.add("existingPolicyVerified");
  if (!finite(facts.baseAmount)) missing.add("baseAmount");
  if (facts.mode === "increase") {
    if (!finite(facts.existingAmount)) missing.add("existingAmount");
    else if (finite(facts.baseAmount) && facts.baseAmount <= facts.existingAmount) errors.push("Resulting coverage must exceed existing coverage");
  }
  if (facts.mode === "rider-only" && (!policy.riderOnlyApplicants.includes(facts.applicantKey) || facts.baseAmount !== 0)) errors.push("Rider-only mode requires an eligible applicant and zero new base coverage");
  const base = facts.mode === "rider-only" ? facts.existingAmount : facts.baseAmount;
  if (facts.mode === "rider-only" && !finite(base)) missing.add("existingAmount");
  const eligible = policy.riders.filter(r => {
    if (!r.applicants.includes(facts.applicantKey)) return false;
    if (!finite(base) || base < r.minimumBase || r.maximumBase !== undefined && base > r.maximumBase) return false;
    if ((r.maximumAge !== null || r.minimumAge !== undefined) && (!finite(facts.ageYears) || !Number.isInteger(facts.ageYears))) { if (r.included || election.riders.includes(r.key)) missing.add("ageYears"); return false; }
    if (r.maximumAge !== null && facts.ageYears! > r.maximumAge || r.minimumAge !== undefined && facts.ageYears! < r.minimumAge) return false;
    if (r.excludedJurisdictions.length && !facts.jurisdiction) { if (r.included || election.riders.includes(r.key)) missing.add("jurisdiction"); return false; }
    return finite(base) && base >= r.minimumBase && (r.maximumBase === undefined || base <= r.maximumBase) && !r.excludedJurisdictions.includes(facts.jurisdiction ?? "");
  });
  // Conflicting optional choices both clear; an included benefit wins over an optional choice.
  const selected = new Set(eligible.filter(r => r.included || election.riders.includes(r.key)).map(r => r.key));
  const conflicting = new Set<string>();
  for (const r of eligible) if (selected.has(r.key)) for (const other of r.incompatible) if (selected.has(other)) {
    if (!r.included) conflicting.add(r.key);
    const target = eligible.find(x => x.key === other)!;
    if (!target.included) conflicting.add(other);
    if (r.included && target.included) errors.push("Included benefits are incompatible");
  }
  conflicting.forEach(key => selected.delete(key));
  let changed = true;
  while (changed) { changed = false; for (const r of eligible) if (selected.has(r.key) && r.requires.some(key => !selected.has(key))) { selected.delete(r.key); changed = true; } }
  const riderAmounts: Record<string, number> = {};
  const locked: string[] = [];
  for (const r of eligible.filter(r => selected.has(r.key))) {
    const a = r.amountByApplicant?.[facts.applicantKey] ?? r.amount;
    if (a.kind === "none") continue;
    const cap = Math.min(r.amountCap?.baseFraction === undefined ? Infinity : base! * r.amountCap.baseFraction, r.amountCap?.combinedMaximum === undefined ? Infinity : Math.max(0, r.amountCap.combinedMaximum - base!));
    if (a.kind === "choices") {
      const choices = a.values.filter(v => v <= cap && (facts.mode !== "new" || v >= (r.amountCap?.minimumNewAmount ?? 0)));
      if (!choices.length) { selected.delete(r.key); continue; }
      const elected = election.riderAmounts[r.key];
      riderAmounts[r.key] = choices.includes(elected) ? elected : choices.includes(a.default) ? a.default : choices[0];
    } else {
      const amount = a.kind === "fixed" ? a.value : Math.min(base! * a.multiplier, a.maximum);
      if (amount > cap) { selected.delete(r.key); continue; }
      riderAmounts[r.key] = amount; locked.push(r.key);
    }
  }
  // An amount cap can invalidate a prerequisite; propagate cleanup again.
  changed = true;
  while (changed) { changed = false; for (const r of eligible) if (selected.has(r.key) && r.requires.some(key => !selected.has(key))) { selected.delete(r.key); changed = true; } }
  for (const key of Object.keys(riderAmounts)) if (!selected.has(key)) delete riderAmounts[key];
  const riders = eligible.filter(r => selected.has(r.key));
  if (facts.mode === "rider-only" && !riders.some(r => !r.included)) errors.push("Select an available optional rider");
  let childAmount: number | null = null;
  if (facts.applicantKey === "child" && policy.childSchedule) {
    if (!finite(facts.childAgeDays) || !Number.isInteger(facts.childAgeDays)) missing.add("childAgeDays");
    if (!finite(facts.memberAmount)) missing.add("memberAmount");
    if (policy.childSchedule.primaryCoverageBasis === "member-or-spouse" && !finite(facts.spouseAmount)) missing.add("spouseAmount");
    if (policy.childSchedule.maximumAgeYears !== undefined && (!finite(facts.ageYears) || !Number.isInteger(facts.ageYears))) missing.add("ageYears");
    if (policy.childSchedule.maximumAgeYears !== undefined && finite(facts.ageYears) && facts.ageYears > policy.childSchedule.maximumAgeYears) errors.push("Child age is outside the benefit schedule");
    if (!missing.has("childAgeDays") && !missing.has("memberAmount") && !missing.has("spouseAmount") && !missing.has("ageYears")) {
      const band = policy.childSchedule.bands.find(b => facts.childAgeDays! >= b.minimumAgeDays && facts.childAgeDays! <= b.maximumAgeDays);
      if (!band) errors.push("Child age is outside the benefit schedule");
      else {
        const primary = policy.childSchedule.primaryCoverageBasis === "member-or-spouse" ? Math.max(facts.memberAmount!, facts.spouseAmount!) : facts.memberAmount!;
        if (primary <= 0) errors.push("Primary life coverage is required for child benefits");
        else childAmount = Math.min(band.amount, primary * policy.childSchedule.memberMaximumFraction);
      }
    }
  }
  const allowed = !errors.length && !missing.size;
  return { status: missing.size ? "needs-information" as const : "resolved" as const, allowed, errors, missingFacts: [...missing], election: { riders: riders.map(r => r.key), riderAmounts }, locked: locked.filter(key => selected.has(key)), childAmount,
    skipPayment: allowed && (policy.skipPaymentForExisting && facts.mode !== "new" || policy.skipPaymentForChildOnly && facts.onlyChild === true),
    skipBeneficiary: allowed && facts.mode === "rider-only", healthRequired: facts.mode === "rider-only" && policy.healthForRiderOnly };
}
export function resolveNormalizedSelection(site: EffectiveSite, productKey: string, facts: SelectionFacts, election: SelectionElection) {
  const records = site.configuration.products.find(p => p.productKey === productKey)?.selectionPolicies ?? [];
  const provenance: RuleProvenance[] = records.flatMap(r => r.provenance);
  if (records.length !== 1 || !isSelectionPolicy(records[0].value)) return { status: "unresolved" as const, allowed: false, provenance };
  return { ...reconcileCoverageSelection(records[0].value, facts, election), provenance, provisional: records[0].value.provisional, revisit: records[0].value.revisit };
}
