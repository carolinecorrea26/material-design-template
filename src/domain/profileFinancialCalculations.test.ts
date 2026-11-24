import { expect, it } from 'vitest';
import application from '../../requirements/global/application.json';
import { isProfileFinancialCalculations, profileFinancialTotal } from './profileFinancialCalculations';

const policy = application.records.configurationValues.find(row => row.configurationKey === 'shared.profile.financialCalculations')!.value;
if (!isProfileFinancialCalculations(policy)) throw new Error('Invalid authored Profile calculations');
const source = policy;

it('calculates sole-proprietor income from gross earnings and expenses, including losses', () => {
  expect(profileFinancialTotal(source, source.calculations[0].id, { 'sole-proprietor-gross-earnings': '$90,000.50', 'sole-proprietor-business-expenses': '25000.25' })).toBe(65000.25);
  expect(profileFinancialTotal(source, source.calculations[0].id, { 'sole-proprietor-gross-earnings': '0', 'sole-proprietor-business-expenses': '100' })).toBe(-100);
});

it('includes each corporate amount once regardless of bonus/commission payment frequency', () => {
  const row = source.calculations[1];
  const values = Object.fromEntries(row.add.map((field, index) => [field, (index + 1) * 1000]));
  expect(profileFinancialTotal(source, row.id, { ...values, 'bonus-payment-frequency': 'one-time', 'commission-payment-frequency': 'annual' })).toBe(21000);
});

it.each([undefined, '', 'not a number'])('shows zero when a required operand is incomplete: %s', missing => {
  expect(profileFinancialTotal(source, source.calculations[0].id, { 'sole-proprietor-gross-earnings': 90000, 'sole-proprietor-business-expenses': missing })).toBe(0);
});

it('rejects malformed or duplicated calculation definitions', () => {
  expect(isProfileFinancialCalculations({ ...source, calculations: [null] })).toBe(false);
  expect(isProfileFinancialCalculations({ ...source, calculations: [source.calculations[0], source.calculations[0]] })).toBe(false);
  expect(isProfileFinancialCalculations({ ...source, calculations: [{ ...source.calculations[0], subtract: source.calculations[0].add }] })).toBe(false);
  expect(() => profileFinancialTotal(source, 'missing-total', {})).toThrow(/Missing Profile financial calculation/);
});
