import type { RateClassPolicy } from "../domain/rateClassPolicy";

/** Reviewed row mappings; complex age/amount/QD rules remain in source evidence. */
export function reviewedRateClass(row: number | undefined, cells: Map<string, string>, hiddenTobacco: boolean): RateClassPolicy {
  const refs = row ? [`Main!AO${row}`, `Main!AP${row}`, `Main!AR${row}`] : ["prototype:rate-class-assumption"];
  const text = refs.map(ref => cells.get(ref) ?? "").join("\n");
  const base = { sourceReferences: refs, sourceText: text };
  if (row === 379 || row === 386) return { ...base, classes: ["Standard"], selection: "single", sourceReferences: [...refs, "User-provided WAEPA documentation: G-30280-0, Std only rateclass (2026-10-05)"], sourceText: `${text}\nUser documentation clarification: G-30280-0 is Std only rateclass; not Preferred/Standard.` };
  if ([120, 121, 122, 124].includes(row ?? 0)) return { ...base, classes: ["Tobacco", "Standard", "Preferred", "Preferred Plus"], selection: "fixed", fixedClass: "Preferred Plus" };
  const mapping: Record<number, [string, string, string[]?]> = {
    39: ["Standard", "Preferred"], 40: ["Standard", "Preferred", ["Super Preferred", "Preferred", "Select", "Standard", "NonSmoker"]], 41: ["Standard", "Preferred", ["Super Preferred", "Preferred", "Select", "Standard", "NonSmoker"]],
    42: ["Smoker", "NonSmoker"], 47: ["Smoker", "NonSmoker"],
    165: ["Standard", "Preferred", ["Preferred", "Select", "Standard"]], 166: ["Standard", "Preferred", ["Preferred", "Select", "Standard"]],
    187: ["Smoker", "Non Smoker"], 188: ["Preferred Smoker", "Preferred NS", ["Super Preferred NS", "Preferred NS", "Non-Smoker", "Preferred Smoker", "Smoker"]], 189: ["Preferred Smoker", "Preferred NS", ["Super Preferred NS", "Preferred NS", "Non-Smoker", "Preferred Smoker", "Smoker"]], 190: ["Smoker", "Non Smoker"],
    278: ["Smoker", "Non smoker"], 283: ["Standard", "Select", ["Preferred", "Select", "Standard"]], 284: ["Standard", "Select", ["Preferred", "Select", "Standard"]], 286: ["Smoker", "Non-Smoker"],
    318: ["Smoker", "Preferred"], 322: ["Standard", "Preferred", ["Preferred", "Select", "Standard"]], 323: ["Standard", "Preferred", ["Preferred", "Select", "Standard"]],
  };
  const mapped = row ? mapping[row] : undefined;
  if (mapped) return { ...base, classes: mapped[2] ?? [mapped[0], mapped[1]], selection: hiddenTobacco ? "unresolved" : "tobacco", byTobacco: { yes: mapped[0], no: mapped[1] }, provisional: [39, 40, 41, 188, 189].includes(row!), revisit: "Full underwriting quote mapping; QD, age/amount exceptions and tobacco lookback must be reconciled separately." };
  if (/unismok|one rate class|1 risk class|one set of rates/i.test(text)) return { ...base, classes: ["Single class"], selection: "single" };
  return { ...base, classes: ["Prototype default"], selection: "single", provisional: true, revisit: "No complete quote-class mapping adopted; synthetic mock assumption only. Source text retained for reconciliation." };
}
