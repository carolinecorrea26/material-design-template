import { parseBenefitFormula } from "./benefitFormula";
import type { Json } from "../persistence/types";
export interface ParsedAmount {
  amountType: string;
  minimum: number | null;
  maximum: number | null;
  increment: number | null;
  options: number[];
  multiplier?: number;
  base?: string;
  schedule?: Json;
}
const number = (s: string) => Number(s.replaceAll(',', '').replace('$', ''));
const money = String.raw`\$?(\d{1,3}(?:,\d{3})+|\d+)(?![\d,])`;
const empty = { minimum: null, maximum: null, increment: null, options: [] as number[] };
/** Anchored grammars: never discard trailing conditions or silently repair source formulas. */
export function parseAmount(value: string): ParsedAmount | null {
  const text = value.trim().replace(/\u00a0/g, ' ');
  if (/^(N\/?A|not applicable|none)$/i.test(text)) return { ...empty, amountType: 'none' };
  if (/^yes\s*\/\s*no$/i.test(text)) return { ...empty, amountType: 'election-only' };
  const fixed = new RegExp(`^${money}$`).exec(text);
  if (fixed) return { ...empty, amountType: 'fixed', minimum: number(fixed[1]), maximum: number(fixed[1]), options: [number(fixed[1])] };
  const range = new RegExp(`^(?:from\\s+)?${money}\\s*(?:[-–]|to|through)\\s*${money}(?:\\s+(?:Monthly Benefits|per month),?)?\\s*(?:[;,]?\\s*(?:in\\s+${money}\\s+(?:increments|units)|\\(?${money}\\s+increments\\)?|\\(?increments?(?:\\s+of)?[: ]+${money}\\)?))?$`, 'i').exec(text);
  if (range) {
    const min = number(range[1]), max = number(range[2]);
    const step = range.slice(3).find(Boolean);
    if (min > max || (step && number(step) <= 0)) return null;
    return { ...empty, amountType: step ? 'range' : 'unspecified-increment', minimum: min, maximum: max, increment: step ? number(step) : null };
  }
  // Comma thousands are consumed by the money token, list separators are outside it.
  if (new RegExp(`^${money}(?:\\s*(?:,\\s*|\\bor\\b\\s*|\\band\\b\\s*)${money})+$`, 'i').test(text)) {
    const options = [...text.matchAll(new RegExp(money, 'g'))].map(m => number(m[1]));
    return { ...empty, amountType: 'set', minimum: Math.min(...options), maximum: Math.max(...options), options };
  }
  const percent = new RegExp(`^(\\d+(?:\\.\\d+)?)% of (coverage|base coverage|member coverage)(?: up to ${money})?$`, 'i').exec(text);
  if (percent) return { ...empty, amountType: 'base-reference', multiplier: Number(percent[1]) / 100, maximum: percent[3] ? number(percent[3]) : null, base: percent[2].toLowerCase() };
  const multiple = /^(\d+(?:\.\d+)?)\s*(?:x|times)\s+(salary|annual salary|monthly salary)$/i.exec(text);
  if (multiple) return { ...empty, amountType: 'multiplier', multiplier: Number(multiple[1]), base: multiple[2].toLowerCase() };
  const formula = parseBenefitFormula(text);
  if (formula && formula.conflicts.length === 0) return { ...empty, amountType: 'calculated', schedule: formula.expression };
  // Composite families retain individual bounds and conditions; never flatten them to a range.
  const parts = text.split(/\s*;\s*|\n+/).map(s => s.trim()).filter(Boolean);
  if (parts.length > 1) {
    const selections = parts.map(part => parseAmount(part));
    if (selections.every((s): s is ParsedAmount => s !== null && ['range', 'fixed'].includes(s.amountType))) {
      const ranges = selections.filter(s => s.amountType === 'range');
      if (ranges.length) return { ...empty, amountType: ranges.length === selections.length ? 'tiered-range' : 'range-plus-fixed', schedule: selections.map(s => ({ minimum: s.minimum, maximum: s.maximum, increment: s.increment, amountType: s.amountType })) };
    }
    if (parts.length === 2) {
      const calculation = parseBenefitFormula(parts[0]), range = parseAmount(parts[1]);
      if (calculation && !calculation.conflicts.length && range?.amountType === 'range') return { ...range, amountType: 'formula-capped', schedule: { expression: calculation.expression, selection: { minimum: range.minimum, maximum: range.maximum, increment: range.increment } } };
    }
  }
  const mappedText = text.replace(/^Select the Monthly Benefit Amount associated with your AAFP\s+Membership Classification and Rank\/Pay Grade:\s+Benefit Amounts\s+/i, '');
  const mappedLines = mappedText.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const attributes = mappedLines.map(line => new RegExp(`^${money}\\s+-\\s+([A-Za-z].*)$`).exec(line));
  if (attributes.length > 1 && attributes.every(m => m !== null)) return { ...empty, amountType: 'attribute-mapped', schedule: attributes.map(m => ({ value: number(m![1]), attribute: m![2] })) };
  const named = parts.map(line => new RegExp(`^(?:Option|Plan)\\s+([A-Za-z0-9]+)\\s*:\\s*${money}$`, 'i').exec(line));
  if (named.length && named.every(m => m !== null)) return { ...empty, amountType: 'named-option', schedule: named.map(m => ({ option: m![1], value: number(m![2]) })) };
  const conditional = parts.map(line => /^(?:Age\s+)?(\d+)\s*(?:through|[-–])\s*(\d+)\s*:\s*(.+)$/i.exec(line));
  if (conditional.length && conditional.every(m => m !== null && Number(m[1]) <= Number(m[2]) && parseAmount(m[3]) !== null)) return { ...empty, amountType: 'conditional', schedule: conditional.map(m => ({ minimumAge: Number(m![1]), maximumAge: Number(m![2]), selection: { ...parseAmount(m![3])! } as unknown as Json })) };
  return null;
}
