import { canonicalRelations } from "./review";
import { parseBenefitFormula } from "./benefitFormula";
import { describe, it, expect } from 'vitest';
import { createMigrationDatabase } from './fixtures';
import { mcrCoverageReport, parseAmount } from './mcr';
import { validateMigrationDatabase } from './integrity';
import { reviewCategories } from './reviewCategories';
import { normalizeIdentifier, parseAge } from './semanticExtraction';

const db = createMigrationDatabase();
describe('Phase 4B semantic extraction and truthful readiness', () => {
  it('retains extraction categories independently of promotion readiness', () => {
    expect(db.sourceRequirements.every(r => reviewCategories.includes(r.classification as typeof reviewCategories[number]))).toBe(true);
    const report = mcrCoverageReport(db);
    expect(report.counts.UNMAPPED_SEMANTIC).toBeGreaterThan(10000);
    expect(report.blockingCount).toBe(report.implementedSiteBlockers.length);
    expect(report.phase5Ready).toBe(true);
    expect(report.phase6Ready).toBe(true);
    expect(report.integrityErrors).toEqual([]);
  });
  it('normalizes formatting without fuzzy identity selection', () => {
    expect(normalizeIdentifier(' G- 29289-0 ')).toBe(normalizeIdentifier('G-29289-0'));
    for (const r of db.identityResolutions) {
      if (r.productKey) expect(r.candidateKeys).toEqual([r.productKey]);
      if (['multi-match','no-match'].includes(r.strategy)) expect(r.productKey).toBeNull();
    }
    const altered = structuredClone(db);
    altered.identityResolutions[0].candidateKeys = ['missing'];
    expect(validateMigrationDatabase(altered)).toContain(`Invalid identity candidates ${altered.identityResolutions[0].key}`);
  });
  it('navigates all junction foreign keys to existing canonical records', () => {
    for (const table of ['productRiders', 'productCoveragePlans', 'underwritingBands', 'questionSetQuestions', 'patternRules', 'patternAssignments', 'productAmountRules', 'riderAmountRules', 'productQuestionSets', 'coverageDependencies', 'ruleFlags', 'requirementTargets', 'semanticRequirements'] as const) {
      for (const row of db[table]) for (const relation of canonicalRelations(db, table, row as unknown as Record<string, unknown>)) expect(relation.exists, `${table}.${row.key}.${relation.field}`).toBe(true);
    }
    const row = db.productRiders[0];
    expect(canonicalRelations(db, 'productRiders', row as unknown as Record<string, unknown>).find(r => r.table === 'riders')?.key).toBe(row.riderKey);
    expect(row.riderKey).not.toBe(row.key);
  });
  it('extracts age restrictions, preserves amount options and does not correct malformed QD money', () => {
    expect(parseAge('17 - through age 64')).toEqual({ minimumAgeYears: 17, maximumAgeYears: 64 });
    expect(parseAge('17 - through age 59 64')).toBeNull();
    expect(db.eligibilityConstraints.some(r => r.key.startsWith('mcr.') && r.maximumAgeYears === 64)).toBe(true);
    for (const pattern of db.coverageAmountPatterns.filter(p => p.amountType === 'set' && p.key.startsWith('mcr.'))) expect(db.amountOptions.filter(o => o.amountPatternKey === pattern.key).length).toBeGreaterThan(1);
    expect(db.sourceRequirements.some(r => r.classification === 'SOURCE_CONFLICT' && r.reason.includes('Malformed monetary grouping'))).toBe(true);
  });
  it('represents reusable question dependencies and consent without inventing missing text', () => {
    expect(db.productQuestionSets.some(q => q.questionSetKey === 'mcr.financial-questions')).toBe(true);
    expect(db.semanticRequirements.find(r => r.predicate === 'professional-corporation-income')?.value).toMatchObject({ visibleWhen: { operator: 'includes', value: 'professional-corporation' }, expression: { operation: 'sum' } });
    expect(db.semanticRequirements.find(r => r.domain === 'electronic-consent' && r.predicate === 'document-access')?.value).toMatchObject({ format: 'PDF', mustAccessAndRetain: true });
    expect(db.sourceRequirements.find(r => r.key === 'mcr.waepa-cir-questions.B2')?.classification).toBe('SOURCE_CONFLICT');
    expect(db.sourceRequirements.find(r => r.key === 'mcr.electrconsent.A71')?.classification).toBe('SOURCE_TBD');
  });
  it('shares semantic facts across evidence and links underwriting-driven disclosures', () => {
    const facts = db.semanticRequirements.filter(f => f.subjectKey === 'application.has-underwritten-coverage');
    expect(facts).toHaveLength(1);
    expect(db.requirementTargets.filter(t => t.targetTable === 'semanticRequirements' && t.targetKey === facts[0].key)).toHaveLength(2);
    expect(db.ruleFlags.some(r => r.flagKey === 'application.has-underwritten-coverage' && r.value === false)).toBe(true);
    expect(db.productRiders.some(r => r.productKey.startsWith('mcr.') && r.riderKey.startsWith('mcr.rider.'))).toBe(true);
    expect(db.urlUsages.some(u => u.usage === 'verification-without-analytics')).toBe(true);
    expect(validateMigrationDatabase(db)).toEqual([]);
  });
  it('preserves conflicting caps and malformed source formula syntax', () => {
    const formula = parseBenefitFormula('Max Benefit Calculation:\n(Monthly Earnings * .6 > 15000 ? 10000 : Monthly Earnings * .6');
    expect(formula?.conflicts).toHaveLength(2);
    expect(formula?.expression).toMatchObject({ whenTrue: 10000, predicate: { right: 15000 }, whenFalse: { multiplier: 0.6 } });
    expect(parseBenefitFormula('Monthly Earnings * .6 > 15000 ? 15000 : Monthly Earnings * .6')?.conflicts).toEqual([]);
  });
  it.each([
    ['$100,000', 'fixed'], ['$1,000 or $2,000', 'set'],
    ['$100-$15,000 (increments of $100)', 'range'],
    ['$1,000 to $20,000 Monthly Benefits in $100 increments', 'range'],
    ['$100,000 through $1,000,000 in $50,000 units', 'range'],
    ['50% of coverage up to $100,000', 'base-reference'], ['2x annual salary', 'multiplier'],
    ['$100-$1,000 Increment: $100; $2,000-$10,000 Increment: $1,000', 'tiered-range'],
    ['$100-$1,000 Increment: $100; $2,000', 'range-plus-fixed'],
    ['17-49: $7,500; 50-54: $5,000', 'conditional'],
    ['Option A: $1,000; Option B: $2,000', 'named-option'],
    ['$500 - Resident\n$1,500 - Active - Grade 03', 'attribute-mapped'],
    ['Monthly Earnings * .6 > 15000 ? 15000 : Monthly Earnings * .6', 'calculated'],
    ['Monthly Earnings * .6 > 15000 ? 15000 : Monthly Earnings * .6\n$100-$15,000 Increment: $100', 'formula-capped'],
    ['Yes/No', 'election-only'], ['N/A', 'none'], ['$100-$7,500', 'unspecified-increment'],
  ])('parses authoritative whole-cell grammar %s', (text, type) => expect(parseAmount(text)?.amountType).toBe(type));
  it.each(['$1,5000,000', '$100-$50', '$100-$500 Increment: $0', '$100-$500; if age 65, cap $200', 'Monthly Earnings * .6 > 15000 ? 10000 : Monthly Earnings * .6'])('does not discard unparsed semantics: %s', text => expect(parseAmount(text)).toBeNull());
});
