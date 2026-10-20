import type { Json } from '../persistence/types';
export interface BenefitFormula { expression: Json; conflicts: string[] }
/** Preserve both ternary branches. Different compared/returned caps are source conflicts. */
export function parseBenefitFormula(source: string): BenefitFormula | null {
  const text = source.trim().replace(/^Max(?:imum)?\s+Benefit\s+Calculation\s*:?\s*/i, '');
  const normalized = text.replace(/[()]/g, '').trim();
  const match = /^(Monthly Earnings|Average Monthly Income)\s*\*\s*(\.?\d+(?:\.\d+)?)\s*>\s*\$?([\d,]+)\s*\?\s*\$?([\d,]+)\s*:\s*(Monthly Earnings|Average Monthly Income)\s*\*\s*(\.?\d+(?:\.\d+)?)\s*$/i.exec(normalized);
  if (!match) return null;
  const amount = (s: string) => Number(s.replaceAll(',', ''));
  const conflicts: string[] = [];
  if (amount(match[3]) !== amount(match[4])) conflicts.push('Compared cap differs from returned cap; both branches retained.');
  if ((text.match(/\(/g)?.length ?? 0) !== (text.match(/\)/g)?.length ?? 0)) conflicts.push('Unbalanced source parentheses; original expression remains in source evidence.');
  if (match[1].toLowerCase() !== match[5].toLowerCase() || Number(match[2]) !== Number(match[6])) conflicts.push('Income operand or percentage differs between condition and returned branch.');
  const operand = (name: string, fraction: string) => ({ operation: 'multiply', fact: name.toLowerCase() === 'monthly earnings' ? 'applicant.monthlyEarnings' : 'applicant.averageMonthlyIncome', multiplier: Number(fraction) });
  return { expression: { operation: 'conditional', predicate: { operator: 'greater-than', left: operand(match[1], match[2]), right: amount(match[3]) }, whenTrue: amount(match[4]), whenFalse: operand(match[5], match[6]) }, conflicts };
}
