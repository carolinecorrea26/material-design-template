import { describe, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { LocalStorageAdapter } from '../persistence/localAdapter';
import { createPortalDataRepository } from '../repositories/portalDataRepository';
import { createLibraryDraft, editDraftField, editDraftBenefitPolicy } from './libraryDraft';
import { isBenefitPolicy, resolveNormalizedBenefit } from './benefitPolicy';
import { createSiteBuild } from './siteBuild';
import { resolvePrototypeLibrary } from './prototypeLibrary';
async function source() {
  const db = createReviewedMigrationDatabase();
  const draft = createLibraryDraft(await createPortalDataRepository(new LocalStorageAdapter(db)).open(), 'asce');
  draft.data.organizations = db.organizations;
  draft.data.organizationProfiles = db.organizationProfiles;
  return draft;
}
describe('Site build identity and copied configuration', () => {
  it('retains stored fixed Association context when copying within the same host', async () => {
    const original = await source();
    const site = original.data.sites.find(row => row.key === original.siteKey)!;
    const client = original.data.clients.find(row => row.id === site.clientId)!;
    const organization = original.data.organizations!.find(row => row.id === client.organizationId)!;
    const draft = createSiteBuild(original, {
      siteKey: 'same-host-copy', siteName: 'Same host copy', template: 'multi',
      organizationKey: organization.key, organizationName: organization.name, newOrganization: false,
      clientKey: client.key, clientName: client.name, newClient: false,
    });
    const context = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision).associationContext;
    expect(context.selection).toMatchObject({ mode: 'fixed', fixedAssociationId: 'american-society-of-civil-engineers' });
    expect(context.associations.map(row => row.clientId)).toEqual(['asce']);
    expect(draft.data.siteAssociations.some(row => row.siteKey === draft.siteKey)).toBe(true);
    const preview = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
    const policy = preview.site.configuration.products.find(product => product.productKey === 'di-ltd')!.benefitPolicies[0].value;
    if (!isBenefitPolicy(policy)) throw new Error('Copied benefit references must resolve');
    expect(policy.amountSource).toBe('product-amount-rules');
    const before = JSON.stringify(draft);
    const edited = editDraftBenefitPolicy(draft, 'di-ltd', { ...policy, applicants: policy.applicants.map(row => row.applicantKey === 'member' ? { ...row, increment: 100 } : row) });
    const editedSite = resolvePrototypeLibrary(edited.data, edited.siteKey, edited.baseRevision).site;
    expect(resolveNormalizedBenefit(editedSite, 'di-ltd', 'member', { ageYears: 40, monthlyIncome: 10000, selfEmployed: false, amount: 250 })).toMatchObject({ allowed: true, increment: 100 });
    expect(resolveNormalizedBenefit(resolvePrototypeLibrary(edited.data, 'asce', draft.baseRevision).site, 'di-ltd', 'member', { ageYears: 40, monthlyIncome: 10000, selfEmployed: false, amount: 250 })).toMatchObject({ allowed: false, increment: 150 });
    expect(JSON.stringify(draft)).toBe(before);
  });
  it('creates a TPA and client with isolated Site rules and retains the source journey', async () => {
    const original = await source();
    const draft = createSiteBuild(original, { siteKey: 'acceptance-site', siteName: 'Acceptance Site', template: 'single', newOrganization: true, organizationAcronym: 'TEST', organizationContact: 'Test Administrator', organizationEmail: 'admin@example.invalid', organizationPhone: '555-0100', clientAcronym: 'TESTCLIENT', clientContact: 'Client Contact', clientEmail: 'client@example.invalid', clientPhone: '555-0101', organizationKey: 'acceptance-tpa', organizationName: 'Acceptance TPA', newClient: true, clientKey: 'acceptance-client', clientName: 'Acceptance Client' });
    expect(resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision).products.length).toBeGreaterThan(0);
    const context = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision).associationContext;
    expect(context.associations).toEqual([]);
    expect(context.selection).toBeUndefined();
    expect(draft.data.sites.find(s => s.key === draft.siteKey)?.hostingAssociationId).toBe(draft.data.sites.find(s => s.key === draft.siteKey)?.clientId);
    expect(draft.data.sites.find(s => s.key === draft.siteKey)?.templateType).toBe('single');
    const edited = editDraftField(draft, 'eligibility', 'birth-date', { label: 'Test applicant date' });
    expect(resolvePrototypeLibrary(edited.data, original.siteKey, original.baseRevision).client.fields.eligibility?.overrides?.['birth-date']?.label).not.toBe('Test applicant date');
    expect(original.data.sites.some(s => s.key === draft.siteKey)).toBe(false);
  });
  it('builds under an existing MCR TPA/client with generated identifiers and no inherited client branding', async () => {
    const draft = await source();
    const client = draft.data.clients.find(c => c.acronym === 'AAFP')!;
    const organization = draft.data.organizations!.find(o => o.id === client.organizationId)!;
    const result = createSiteBuild(draft, { siteKey: 'site-aafp-test', siteName: 'AAFP Test', template: 'multi', newOrganization: false, organizationKey: organization.key, organizationName: organization.name, newClient: false, clientKey: client.key, clientName: client.name });
    const preview = resolvePrototypeLibrary(result.data, result.siteKey, result.baseRevision);
    expect(preview.client.branding.acronym).toBe('AAFP');
    expect(preview.products.length).toBeGreaterThan(0);
    expect(result.data.clients.find(c => c.id === client.id)?.status).toBe('active');
    expect(draft.data.clients.find(c => c.id === client.id)?.status).toBe('inactive');
    expect(draft.data.organizations!.some(o => o.name.startsWith('Compatibility'))).toBe(false);
  });
  it('rejects duplicate Sites and cross-TPA client selection', async () => {
    const draft = await source(); const client = draft.data.clients.find(c => c.id === draft.data.sites.find(s => s.key === draft.siteKey)!.clientId)!;
    const org = draft.data.organizations!.find(o => o.id === client.organizationId)!;
    const identity = { siteKey: 'asce', siteName: 'Copy', template: 'multi' as const, newOrganization: false, organizationKey: org.key, organizationName: org.name, newClient: false, clientKey: client.key, clientName: client.name };
    expect(() => createSiteBuild(draft, identity)).toThrow('already exists');
    const other = draft.data.organizations!.find(o => o.id !== org.id)!;
    expect(() => createSiteBuild(draft, { ...identity, siteKey: 'cross-tpa-site', organizationKey: other.key })).toThrow('belonging');
  });
});
