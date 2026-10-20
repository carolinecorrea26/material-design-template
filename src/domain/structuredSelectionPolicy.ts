import { isSelectionPolicy, type RiderAmount } from "./coverageSelectionPolicy";
import type { BenefitAmountSource } from "./structuredBenefitPolicy";
import type { RuleProvenance } from "./effectiveSite";

type RiderSource = { key: string; amounts: Array<Omit<BenefitAmountSource, "status" | "value"> & { value: { riderKey: string; baseProductKey: string | null; applicantTypeKey: string | null; conditionKey: string | null } }> };
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);

/** Visits only explicit v2 amount references, for Site-copy remapping. */
export function mapSelectionAmountReferences(value: unknown, map: (key: string) => string) {
  if (!object(value) || value.version !== 2 || value.amountSource !== "rider-amount-rules") return;
  if (!Array.isArray(value.riders)) throw new Error("Invalid structured selection riders");
  for (const rider of value.riders) {
    if (!object(rider)) throw new Error("Invalid structured selection rider");
    if (rider.amountByApplicant !== undefined && !object(rider.amountByApplicant)) throw new Error("Invalid structured rider applicants");
    for (const amount of [rider.amount, ...Object.values(rider.amountByApplicant ?? {})]) {
      if (!object(amount)) throw new Error("Invalid structured rider amount");
      if (amount.kind === "rule") {
        if (typeof amount.key !== "string") throw new Error("Invalid structured rider amount key");
        amount.key = map(amount.key);
      }
    }
  }
}

/** Stored v2 choices reference exact relational assignments. v1 captured policies
 * retain their original behavior; reads never upgrade them. Caps and dependencies
 * remain selection-policy modifiers, not a second amount-choice authority. */
export function materializeSelectionPolicy(value: unknown, productKey: string, riders: RiderSource[]) {
  const unchanged = { value, provenance: [] as RuleProvenance[], error: undefined as string | undefined };
  if (!object(value) || value.version !== 2) return unchanged;
  const invalid = () => ({ ...unchanged, error: "Invalid or unresolved structured rider amount reference" });
  if (value.amountSource !== "rider-amount-rules" || !Array.isArray(value.riders)) return invalid();
  const provenance: RuleProvenance[] = [];
  const rows: Record<string, unknown>[] = [];
  for (const rider of value.riders) {
    if (!object(rider) || typeof rider.key !== "string" || !Array.isArray(rider.applicants)) return invalid();
    const matches = riders.filter(row => row.key === rider.key);
    if (matches.length !== 1) return invalid();
    const resolve = (a: unknown, applicant: string | null): RiderAmount | null => {
      if (!object(a)) return null;
      if (a.kind !== "rule") {
        if (a.kind === "none") return { kind: "none" };
        if (a.kind === "fixed" && typeof a.value === "number") return { kind: "fixed", value: a.value };
        if (a.kind === "base-multiplier" && typeof a.multiplier === "number" && typeof a.maximum === "number") return { kind: "base-multiplier", multiplier: a.multiplier, maximum: a.maximum };
        return null;
      }
      if (Object.keys(a).some(key => !["kind", "key", "default"].includes(key)) || typeof a.key !== "string") return null;
      const rules = matches[0].amounts.filter(row => row.key === a.key);
      if (rules.length !== 1) return null;
      const source = rules[0], amount = source.amount;
      if (source.value.riderKey !== rider.key || source.value.baseProductKey !== productKey || source.value.applicantTypeKey !== applicant
        || source.value.conditionKey !== null || amount?.status !== "resolved") return null;
      let values: number[];
      if (amount.pattern.value.amountType === "set" && !amount.bands.length && amount.options.length) values = amount.options.map(option => Number(option.value.value));
      else if (amount.pattern.value.amountType === "range" && amount.bands.length === 1 && !amount.options.length) {
        const { minimum, maximum, increment } = amount.bands[0].value;
        if (minimum === null || maximum === null || increment === null || increment <= 0 || maximum < minimum || (maximum - minimum) / increment > 10000) return null;
        values = Array.from({ length: Math.floor((maximum - minimum) / increment) + 1 }, (_, i) => minimum + i * increment);
      } else return null;
      if (!values.length || values.some(n => !Number.isFinite(n) || n < 0) || new Set(values).size !== values.length || typeof a.default !== "number" || !values.includes(a.default)) return null;
      provenance.push(...source.provenance, ...amount.pattern.provenance, ...amount.bands.flatMap(b => b.provenance), ...amount.options.flatMap(o => o.provenance));
      return { kind: "choices", values, default: a.default };
    };
    const amount = resolve(rider.amount, null);
    if (!amount) return invalid();
    const amountByApplicant: Record<string, RiderAmount> = {};
    if (rider.amountByApplicant !== undefined) {
      if (!object(rider.amountByApplicant)) return invalid();
      for (const [applicant, amount] of Object.entries(rider.amountByApplicant)) {
        const resolved = resolve(amount, applicant);
        if (!resolved) return invalid();
        amountByApplicant[applicant] = resolved;
      }
    }
    rows.push({ ...rider, amount, ...(rider.amountByApplicant === undefined ? {} : { amountByApplicant }) });
  }
  const policy = { ...value, version: 1, riders: rows };
  if (!isSelectionPolicy(policy)) return invalid();
  return { value: policy, provenance, error: undefined };
}
