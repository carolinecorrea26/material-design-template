import { afterEach, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from './fixtures';
import { installPrototypeLibrary, resolvePrototypeLibrary } from '../domain/prototypeLibrary';
import { applicationUnderwriting } from '../domain/coverageRuntime';
import type { EffectiveSiteData } from '../domain/effectiveSite';
import { mcrSource } from './mcr';

const library = resolvePrototypeLibrary(createReviewedMigrationDatabase() as EffectiveSiteData, 'asce', 'mcr-parity');
afterEach(() => installPrototypeLibrary(null));
it('uses MCR product codes in the effective ASCE template', () => {
  for (const [id, row] of [['li-10yr', 165], ['li-20yr', 166], ['li-term', 167], ['li-add', 168], ['di-ltd', 169]] as const) {
    const code = mcrSource.cells.find(cell => cell.sheet === 'Main' && cell.cell === `G${row}`)!.value;
    expect(library.products.find(product => product.id === id)!.planCode.primary).toBe(String(code));
  }
});
it('permits child Life without medical underwriting and preserves one-plan exclusivity', () => {
  installPrototypeLibrary(library);
  const term = library.products.find(product => product.id === 'li-10yr')!;
  expect(term.requirements?.maximumPlans).toContainEqual({ applicantType: 'child', categoryId: 'LI', count: 1 });
  expect(applicationUnderwriting(term, 'child', { children: [{ "child-birth-date": '2016-01-01', "child-full-time-student": 'no' }], coverageAmounts: { 'li-10yr:child': 10000 } })).toMatchObject({ status: 'resolved', underwritingType: 'NA' });
});
it('uses the MCR AD&D increments', () => {
  const accident = library.products.find(product => product.id === 'li-add')!;
  expect(accident.coverageAmounts).toEqual(expect.arrayContaining([
    expect.objectContaining({ scope: { applicantType: 'member' }, selections: [expect.objectContaining({ increment: 50000 })] }),
    expect.objectContaining({ scope: { applicantType: 'spouse' }, selections: [expect.objectContaining({ increment: 50000 })] }),
  ]));
});
it('uses MCR CIR increments for member and spouse', () => {
  const rider = library.products.find(product => product.id === 'li-term')!.riders!.find(rider => rider.id === 'cir')!;
  expect(rider.coverageAmounts).toEqual(expect.arrayContaining([
    expect.objectContaining({ scope: { applicantType: 'member' }, selections: [expect.objectContaining({ min: 50000, max: 1000000, increment: 50000 })] }),
    expect.objectContaining({ scope: { applicantType: 'spouse' }, selections: [expect.objectContaining({ min: 25000, max: 1000000, increment: 25000 })] }),
  ]));
});
