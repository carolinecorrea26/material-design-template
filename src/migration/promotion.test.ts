import { describe, expect, it } from 'vitest';
import { createMigrationDatabase, migrationSiteKeys } from './fixtures';
import { mcrCoverageReport, mcrSource } from './mcr';
import { implementedSiteBlockers, promotionIntegrityErrors, referenceUxSheets } from './promotion';
import { resolveDatabaseSite } from './resolve';

const db = createMigrationDatabase();
describe('Phase 4C curated migration boundary', () => {
  it('preserves every workbook cell and all ten Sites without implicit adoption', () => {
    expect(db.sourceRequirements.length).toBeGreaterThanOrEqual(mcrSource.cells.length);
    expect(db.sites.map(s => s.key).sort()).toEqual([...migrationSiteKeys].sort());
    expect(promotionIntegrityErrors(db)).toEqual([]);
    expect(db.sourceRequirements.filter(r => r.promotionState === 'SOURCE_ONLY').length).toBeGreaterThan(10000);
    expect(db.sourceRequirements.some(r => r.promotionState === 'PATTERN_CANDIDATE')).toBe(true);
    expect(db.patterns).toHaveLength(5);
    expect(db.siteProducts.some(r => r.productKey.startsWith('mcr.'))).toBe(false);
  });
  it('keeps all New UX evidence reference-only, with no extracted UX configuration or copy', () => {
    const ux = db.sourceRequirements.filter(r => referenceUxSheets.has(r.sheetKey));
    expect(ux.length).toBeGreaterThan(0);
    expect(ux.every(r => r.promotionState === 'SOURCE_ONLY' && Array.isArray(r.activeSiteKeys) && !r.activeSiteKeys.length)).toBe(true);
    expect(db.semanticRequirements.some(r => r.domain.startsWith('ux-'))).toBe(false);
    const sample = structuredClone(db);
    const row = sample.sourceRequirements.find(r => referenceUxSheets.has(r.sheetKey))!;
    row.promotionState = 'SITE_CONFIGURATION'; row.activeSiteKeys = ['abe'];
    expect(promotionIntegrityErrors(sample)).toContain(`UX source requires explicit reviewed adoption ${row.key}`);
  });
  it('resolves the six approved decisions without treating historical source unknowns as runtime blockers', () => {
    const report = mcrCoverageReport(db);
    expect(report.phase5Ready).toBe(true);
    expect(report.phase6Ready).toBe(true);
    expect(report.implementedSiteBlockers).toEqual([]);
    expect(report.canonicalModelBlockers).toEqual([]);
    expect(report.identityBlockersAffectingActiveSites).toEqual([]);
    expect(report.integrityBlockers).toEqual([]);
  });
  it('allows source-only parser/identity gaps after active requirements are actually resolved', () => {
    const sample = structuredClone(db);
    expect(implementedSiteBlockers(sample)).toEqual([]);
    expect(mcrCoverageReport(sample).phase5Ready).toBe(true);
    const source = sample.sourceRequirements.find(r => r.classification === 'PARSER_GAP')!;
    expect(source.promotionState).toBe('SOURCE_ONLY');
    source.promotionState = 'UNRESOLVED'; source.activeSiteKeys = ['abe'];
    source.promotionReason = 'Synthetic adopted runtime dependency with unresolved amount grammar.';
    expect(mcrCoverageReport(sample).phase5Ready).toBe(false);
  });
  it('fails readiness for missing Site data, orphan relationships or invalid promotions', () => {
    const sample = structuredClone(db);
    sample.sitePages = sample.sitePages.filter(r => r.siteKey !== 'abe');
    expect(implementedSiteBlockers(sample).some(b => b.siteKey === 'abe')).toBe(true);
    sample.sourceRequirements[0].promotionState = 'PATTERN_CANDIDATE'; sample.sourceRequirements[0].activeSiteKeys = ['ama'];
    expect(promotionIntegrityErrors(sample)).toContain(`Unadopted source assigned to active Site ${sample.sourceRequirements[0].key}`);
    sample.semanticRequirements[0].subjectKey = 'missing';
    expect(mcrCoverageReport(sample).integrityErrors.length).toBeGreaterThan(0);
  });
  it('rejects assigning an extracted archival product to a runnable Site', () => {
    const sample = structuredClone(db);
    const product = sample.products.find(r => r.key.startsWith('mcr.'))!;
    sample.siteProducts.push({ ...sample.siteProducts[0], id: 'synthetic-assignment', key: 'synthetic-assignment', productKey: product.key, enabled: true });
    expect(promotionIntegrityErrors(sample).some(error => error.includes(`Unadopted evidence feeds active entity products.${product.key}`))).toBe(true);
  });
  it('keeps reference UX edits out of every implemented Site resolution', () => {
    const sample = structuredClone(db);
    for (const r of sample.sourceRequirements.filter(r => referenceUxSheets.has(r.sheetKey))) r.value = 'Replace every page; make every field optional';
    for (const site of migrationSiteKeys) expect(resolveDatabaseSite(sample, site)).toEqual(resolveDatabaseSite(db, site));
  });
});
