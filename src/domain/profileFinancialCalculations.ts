import { numericFact } from '../utils/applicantFacts';

export type ProfileFinancialCalculations = {
  version: 1;
  currency: 'USD';
  incompleteTotal: 0;
  calculations: Array<{ id: string; label: string; add: string[]; subtract: string[]; afterField: string; when: Array<{ field: string; equals: string | boolean }> }>;
};

export function isProfileFinancialCalculations(value: unknown): value is ProfileFinancialCalculations {
  const policy = value as ProfileFinancialCalculations | null;
  return !!policy && policy.version === 1 && policy.currency === 'USD' && policy.incompleteTotal === 0 &&
    Array.isArray(policy.calculations) && policy.calculations.length > 0 &&
    policy.calculations.every(row => row && typeof row.id === 'string' && !!row.id && typeof row.label === 'string' && !!row.label &&
      typeof row.afterField === 'string' && !!row.afterField && Array.isArray(row.when) && row.when.length > 0 && row.when.every(clause => clause && typeof clause.field === 'string' && !!clause.field && ['string', 'boolean'].includes(typeof clause.equals)) &&
      Array.isArray(row.add) && row.add.length > 0 && Array.isArray(row.subtract) &&
      [...row.add, ...row.subtract].every(key => typeof key === 'string' && !!key) &&
      new Set([...row.add, ...row.subtract]).size === row.add.length + row.subtract.length) &&
    new Set(policy.calculations.map(row => row.id)).size === policy.calculations.length;
}

/** Totals are a projection of current answers, never independently stored answers. */
export function profileFinancialTotal(policy: ProfileFinancialCalculations, id: string, values: Record<string, unknown>) {
  const calculation = policy.calculations.find(row => row.id === id);
  if (!calculation) throw new Error(`Missing Profile financial calculation: ${id}`);
  const amounts = [...calculation.add, ...calculation.subtract].map(key => numericFact(values[key]));
  if (amounts.some(value => value === undefined)) return policy.incompleteTotal;
  return Math.round((calculation.add.reduce((sum, key) => sum + numericFact(values[key])!, 0) - calculation.subtract.reduce((sum, key) => sum + numericFact(values[key])!, 0)) * 100) / 100;
}

export function profileCalculationApplies(calculation: ProfileFinancialCalculations['calculations'][number], values: Record<string, unknown>) {
  return calculation.when.every(clause => values[clause.field] === clause.equals);
}
