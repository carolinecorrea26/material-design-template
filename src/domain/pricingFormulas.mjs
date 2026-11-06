// Shared by the prototype and the mock platform so both price from requirements/global/formulas.
const finite = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const rateShape = value => object(value) && ['per-thousand', 'percent-of-amount'].includes(value.basis) && finite(value.rate) && Object.keys(value).length === 2;
const frequencies = ['monthly', 'quarterly', 'semiannual', 'annual'];

/** Validate the pricing formula records and index them by type. */
export function pricingFormulas(document) {
  if (!object(document) || !Array.isArray(document.formulas)) throw new Error('Invalid pricing formulas');
  const byType = type => {
    const found = document.formulas.filter(formula => object(formula) && formula.type === type);
    if (found.length !== 1) throw new Error(`Expected one ${type} formula`);
    return found[0];
  };
  const base = byType('category-rates'), rider = byType('rider-factor'), frequency = byType('frequency-factors');
  if (!finite(base.minimumMonthly) || !rateShape(base.default) || !object(base.categories) || !Object.values(base.categories).every(rateShape)) throw new Error('Invalid category-rates formula');
  if (rider.amount !== 'rider-amount-or-base') throw new Error('Invalid rider-factor formula');
  if (!object(frequency.factors) || Object.keys(frequency.factors).length !== frequencies.length || !frequencies.every(key => finite(frequency.factors[key]) && frequency.factors[key] > 0)) throw new Error('Invalid frequency-factors formula');
  return { base, rider, frequency };
}

const cents = value => Math.round((value + Number.EPSILON) * 100) / 100;
const rated = (rate, amount) => rate.basis === 'per-thousand' ? amount / 1000 * rate.rate : amount * rate.rate / 100;

/** Monthly premium for an amount before any minimum. */
export function categoryMonthly(formulas, categoryId, amount) {
  if (!(amount > 0)) return 0;
  return rated(formulas.base.categories[categoryId] ?? formulas.base.default, amount);
}

/** Base plus selected riders. riders: [{ amount, premiumFactor }] already resolved to the rider-or-base amount. */
export function monthlyPremium(formulas, categoryId, amount, riders = []) {
  if (!(amount > 0)) return 0;
  const base = Math.max(formulas.base.minimumMonthly, categoryMonthly(formulas, categoryId, amount));
  return cents(riders.reduce((total, rider) => total + categoryMonthly(formulas, categoryId, rider.amount) * rider.premiumFactor, base));
}

export function premiumForFrequency(formulas, monthly, frequency) {
  const factor = formulas.frequency.factors[frequency];
  if (factor === undefined) throw new Error(`Unknown payment frequency ${frequency}`);
  return cents(monthly * factor);
}
