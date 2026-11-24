import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizedSnapshotTables } from '../../../persistence/snapshot';
import { configurationOwner, flagOwner, libraryOwners } from '../../../domain/libraryOwnership';
import type { LibraryCatalog } from '../../../services/libraryCatalogService';
import { libraryRequirementRows } from './libraryRequirementRows';
import { configurationRows } from './configurationRows';
import { urlParameterRows } from './UrlParametersLibrary';

const catalog: LibraryCatalog = { ...JSON.parse(readFileSync('public/catalog/portal.json', 'utf8')), revision: 'test' };

describe('Library requirements ownership and relationships', () => {
  it('inherits message show/hide conditions from one global rule under Site filters', () => {
    const recovery = JSON.parse(readFileSync('requirements/global/rules/recovery.json', 'utf8')).rules as Array<{ id: string; statement: string }>;
    const ids = ['recovery-offline-feedback', 'recovery-inline-feedback', 'recovery-transient-notifications', 'recovery-operation-status-boundary', 'application-session-warning'];
    const global = libraryRequirementRows(catalog, 'all').filter(row => ids.includes(row.key));
    expect(global).toHaveLength(ids.length);
    for (const rule of global) {
      expect(rule).toMatchObject({ site: 'Global template', requirementsJson: true, implementation: 'requirements/global/rules/recovery.json', status: 'Confirmed requirement; declarative' });
      expect(rule.behavior).toBe(recovery.find(record => record.id === rule.key)!.statement);
    }
    expect(global.find(row => row.key === 'recovery-offline-feedback')?.behavior).toContain('next browser online event');
    expect(global.find(row => row.key === 'recovery-operation-status-boundary')?.behavior).toContain('remains unimplemented');
    // Shared rules stay global and visible for differing effective-Site families;
    // applicant/product cases and message behavior already have their own tests.
    for (const site of ['asce', 'waepa-gi']) {
      const rows = libraryRequirementRows(catalog, site);
      expect(rows.filter(row => ids.includes(row.key))).toEqual(global);
      const mfa = rows.find(row => row.key === 'resume-mfa-lifecycle');
      expect(mfa).toMatchObject({ site: 'Global template', implementation: 'requirements/global/rules/advisor-resume.json' });
      expect(mfa?.behavior).toContain('hidden before that threshold');
      expect(rows.find(row => row.key === 'resume-request-cooldowns')?.behavior).toContain('Hide that timed issue when the deadline elapses');
    }
  }, 60000);
  it.skipIf(!catalog.data.sites.some(site => site.key === 'ama'))('exposes AMA scoped behavior and shared service/policy owners in the actual Rules view', () => {
    const ama = libraryRequirementRows(catalog, 'ama');
    expect(ama.find(row => row.key === 'rule-coverage-ama-active-work')).toMatchObject({ site: 'ama', implementation: expect.stringContaining('src/domain/effectiveSite.ts') });
    expect(ama.some(row => row.key === 'template.product-eligibility-facts.di-step-rated.member' && row.dataset === 'configurationValues')).toBe(true);
    expect(ama.find(row => row.key === 'resume-verification-and-return')).toMatchObject({ site: 'Global template', implementation: 'requirements/global/rules/advisor-resume.json' });
    expect(ama.find(row => row.key === 'resume-verification-and-return')?.hierarchy).toEqual(['requirements', 'shared rules']);
    expect(libraryRequirementRows(catalog, 'asce').some(row => row.key === 'rule-coverage-ama-active-work')).toBe(false);
  });
  it('accounts for every snapshot table exactly once', () => {
    const tables = Object.values(libraryOwners).flat();
    expect(new Set(tables).size).toBe(tables.length);
    expect([...tables].sort()).toEqual([...new Set(normalizedSnapshotTables)].sort());
  });
  it('separates settings, derived decisions and stored application state', () => {
    expect(flagOwner('configuration')).toBe('configurations');
    expect(flagOwner('derived-runtime')).toBe('rules');
    expect(flagOwner('application-record')).toBe('flows');
    const rules = libraryRequirementRows(catalog, 'asce');
    expect(rules.some(row => row.key === 'application.has-underwritten-coverage')).toBe(true);
    expect(rules.some(row => row.key === 'qd.decision' || row.key === 'site.has-product-rates')).toBe(false);
    expect(configurationRows(catalog, 'asce').find(row => row.key === 'site.has-product-rates')?.values).toBe('Not configured');
  });
  it('keeps business policy values in rules and configuration references free of duplicate values', () => {
    const definition = catalog.data.configurationDefinitions.find(row => row.definition.target?.kind === 'product-benefit-policy' && catalog.data.configurationValues.some(value => value.configurationKey === row.key && value.siteKey === 'asce'))!;
    expect(configurationOwner(definition)).toBe('rules');
    const configurations = configurationRows(catalog, 'all');
    expect(configurations.find(row => row.key === definition.key)).toMatchObject({ owner: 'rules', values: 'See owning requirements' });
    expect(libraryRequirementRows(catalog, 'all').some(row => row.key === definition.key && row.dataset === 'configurationValues')).toBe(true);
  }, 60000);
  it('derives collection settings from canonical Site page assignments despite stale saved values', () => {
    const rows = configurationRows(catalog, 'asce');
    expect(rows.find(row => row.key === 'pages.requirements.beneficiary')).toMatchObject({ owner: 'configurations', values: 'Optional', source: 'site_pages.requirement' });
    expect(rows.find(row => row.key === 'pages.requirements.payment')).toMatchObject({ owner: 'configurations', values: 'Optional' });
    const changed = structuredClone(catalog);
    changed.data.sitePages.find(row => row.siteKey === 'asce' && row.pageKey === 'payment')!.requirement = 'none';
    expect(configurationRows(changed, 'asce').find(row => row.key === 'pages.requirements.payment')?.values).toBe('Optional');
    expect(rows.some(row => row.key === 'ownership.asce.page-participation')).toBe(false);
    expect(rows.some(row => row.key === 'config-pages-requirements-beneficiary-payment')).toBe(false);
  });
  it('shows shared routing execution under Rules while configuration contains references', () => {
    const rows = libraryRequirementRows(catalog, 'asce');
    const routing = rows.find(row => row.key === 'rule-application-flow-beneficiary-routing');
    expect(routing).toMatchObject({ status: 'Executable routing rule' });
    expect(routing?.behavior).toContain('Routing definition:');
    const definition = catalog.data.configurationDefinitions.find(row => row.key === 'routing.gates')!;
    expect(configurationOwner(definition)).toBe('rules');
    expect(configurationRows(catalog, 'asce').find(row => row.key === definition.key)).toMatchObject({ owner: 'rules', values: 'See owning requirements' });
  });
  it('shows canonical amount assignments and ignores stale saved product availability', () => {
    const rows = libraryRequirementRows(catalog, 'asce');
    expect(new Set(rows.map(row => row.id)).size).toBe(rows.length);
    const amounts = rows.filter(row => row.dataset === 'productAmountRules');
    expect(amounts.length).toBeGreaterThan(0);
    expect(amounts.every(row => row.site === 'asce')).toBe(true);
    expect(amounts.some(row => row.behavior.includes('Increment:') && row.behavior.includes('Minimum:'))).toBe(true);
    const changed = structuredClone(catalog);
    const product = amounts[0].product;
    changed.data.siteProducts.find(row => row.productKey === product && row.siteId === 'asce')!.enabled = false;
    expect(libraryRequirementRows(changed, 'asce').some(row => row.product === product && row.dataset !== 'siteProducts')).toBe(true);
    expect(libraryRequirementRows(changed, 'asce').find(row => row.product === product && row.dataset === 'siteProducts')?.status).toBe('Enabled assignment');
  }, 60000);
  it('keeps planned requirements visible and their status explicit', () => {
    const rows = libraryRequirementRows(catalog, 'all');
    expect(rows.some(row => row.status === 'Planned')).toBe(true);
  }, 60000);
  it('joins canonical URL definitions and ignores superseded saved Site assignments', () => {
    const rows = urlParameterRows(catalog, 'asce');
    expect(rows.find(row => row.parameter === 'category')?.values.length).toBeGreaterThan(0);
    expect(rows.every(row => row.siteSettings === 'No site assignment recorded')).toBe(true);
    const changed = structuredClone(catalog);
    const key = rows[0].key;
    changed.data.siteUrlParameters.push({ id: 'test', key: 'test', displayId: 1, providedBy: null, sourceReference: 'test', siteKey: 'asce', urlParameterKey: key, enabled: false, defaultValue: 'test-default' });
    expect(urlParameterRows(changed, 'asce').find(row => row.key === key)?.siteSettings).toBe('No site assignment recorded');
    expect(urlParameterRows(changed, 'waepa').map(row => row.key)).toEqual(rows.map(row => row.key));
  });
});
