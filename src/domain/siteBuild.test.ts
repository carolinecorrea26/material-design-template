import { describe, expect, it } from 'vitest';
import { createReviewedMigrationDatabase } from '../migration/fixtures';
import { LocalStorageAdapter } from '../persistence/localAdapter';
import { createPortalDataRepository } from '../repositories/portalDataRepository';
import { createLibraryDraft, editDraftField, editDraftBenefitPolicy, editDraftEligibility, editDraftMemberId, editDraftMembershipQuestion, editDraftPageCopy, editDraftPageSetting } from './libraryDraft';
import { isBenefitPolicy, resolveNormalizedBenefit } from './benefitPolicy';
import { createSiteBuild, prefillAssociationFromTpa } from './siteBuild';
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
    const association = original.data.associationEntities.find(row => row.id === site.hostingAssociationId)!;
    const organization = original.data.organizations!.find(row => row.id === association.organizationId)!;
    const draft = createSiteBuild(original, {
      siteKey: 'same-host-copy', siteName: 'Same host copy', template: 'multi',
      organizationKey: organization.key, organizationName: organization.name, newOrganization: false,
      hostingAssociationKey: association.key, associationName: association.name, newAssociation: false,
    });
    const context = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision).associationContext;
    expect(context.selection).toMatchObject({ mode: 'fixed', fixedAssociationId: 'american-society-of-civil-engineers' });
    expect(context.associations.map(row => row.hostingAssociationId)).toEqual(['asce']);
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
  it('creates a TPA and its first Association with isolated Site rules', async () => {
    const original = await source();
    const logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jTioAAAAASUVORK5CYII=';
    const identity = {
      siteKey: 'acceptance-site', siteName: 'Acceptance Site', template: 'single' as const,
      organizationKey: 'acceptance-tpa', organizationName: 'Acceptance Services', newOrganization: true,
      organizationWebsite: 'example.invalid', organizationEmail: 'admin@example.invalid', organizationPhone: '(212) 555-0100',
      organizationAddress: { street: '100 Example St', unit: '4', city: 'New York', state: 'NY', zip: '10001' }, organizationLogo: logo,
      hostingAssociationKey: 'acceptance-association', associationName: 'Acceptance Research Association', newAssociation: true,
      associationLogo: logo,
    };
    const prefill = prefillAssociationFromTpa(original, identity);
    expect(prefill).toEqual({ associationWebsite: identity.organizationWebsite, associationEmail: identity.organizationEmail, associationPhone: identity.organizationPhone, associationAddress: identity.organizationAddress });
    const { unit: _unit, ...addressWithoutUnit } = identity.organizationAddress;
    expect(prefillAssociationFromTpa(original, {
      ...identity, organizationAddress: addressWithoutUnit, associationAddress: { unit: 'Old suite' },
    }).associationAddress).toEqual(addressWithoutUnit);
    const associationDetails = { ...identity, ...prefill, associationPhone: '(212) 555-0101' };
    expect(() => createSiteBuild(original, { ...associationDetails, associationAddress: undefined })).toThrow('Enter a street address');
    expect(() => createSiteBuild(original, { ...associationDetails, associationLogo: undefined })).toThrow('required Association logo');
    const draft = createSiteBuild(original, associationDetails);
    const preview = resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
    expect(preview.products.length).toBeGreaterThan(0);
    expect(preview.client.branding.logo).toBe(logo);
    const profile = draft.data.organizationProfiles.find(p => p.organizationKey === identity.organizationKey)?.definition;
    expect(profile).toMatchObject({ acronym: 'AS', branding: { logo }, support: { website: 'https://example.invalid/', address: identity.organizationAddress } });
    expect(profile?.support).not.toHaveProperty('contactName');
    const context = preview.associationContext;
    expect(context.associations).toEqual([]);
    expect(context.selection).toBeUndefined();
    const hosting = draft.data.associationEntities.find(row => row.key === identity.hostingAssociationKey);
    expect(hosting?.acronym).toBe('ARA');
    expect(preview.client.branding.acronym).toBe('ARA');
    const support = draft.data.supportProfiles.find(row => row.scope === 'association' && row.hostingAssociationKey === identity.hostingAssociationKey)?.definition;
    expect(support).toEqual({ website: 'https://example.invalid/', email: identity.organizationEmail, phone: '(212) 555-0101', address: identity.organizationAddress });
    const fromExisting = prefillAssociationFromTpa(draft, { ...identity, newOrganization: false, organizationEmail: 'stale@example.invalid' });
    expect(fromExisting).toEqual({ ...prefill, associationWebsite: 'https://example.invalid/' });
    expect(hosting?.organizationId).toBe(draft.data.organizations.find(row => row.key === 'acceptance-tpa')?.id);
    expect(draft.data.sites.find(s => s.key === draft.siteKey)?.hostingAssociationId).toBe(hosting?.id);
    expect(draft.data.sites.find(s => s.key === draft.siteKey)?.templateType).toBe('single');
    const edited = editDraftField(draft, 'eligibility', 'birth-date', { label: 'Test applicant date' });
    expect(resolvePrototypeLibrary(edited.data, original.siteKey, original.baseRevision).client.fields.eligibility?.overrides?.['birth-date']?.label).not.toBe('Test applicant date');
    expect(original.data.sites.some(s => s.key === draft.siteKey)).toBe(false);
  });
  it('projects saved Site page and eligibility overrides to the applicant prototype', async () => {
    const original = await source();
    const site = original.data.sites.find(row => row.key === original.siteKey)!;
    const association = original.data.associationEntities.find(row => row.id === site.hostingAssociationId)!;
    const tpa = original.data.organizations.find(row => row.id === association.organizationId)!;
    let draft = createSiteBuild(original, {
      siteKey: 'page-settings-test', siteName: 'Page settings test', template: 'multi',
      hostingAssociationKey: association.key, associationName: association.name, newAssociation: false,
      organizationKey: tpa.key, organizationName: tpa.name, newOrganization: false,
    });
    draft = editDraftPageCopy(draft, 'home', 'home.hero.title', 'A new Site title');
    draft = editDraftPageSetting(draft, 'home-variant', 'hero-image');
    const options = [{ value: 'member', label: 'Member', outcome: 'member' }, { value: 'other', label: 'Other', outcome: 'not-eligible' }];
    draft = editDraftMembershipQuestion(draft, 'category', 'Choose your membership type.', options);
    draft = editDraftMemberId(draft, { included: true, required: true, digitsOnly: true, minLength: 7 });
    draft = editDraftEligibility(draft, 'li-10yr', 'member', {
      minimumAgeDays: null, minimumAgeYears: 21, maximumAgeYears: 60, studentMaximumAgeYears: null, minimumWorkHours: null,
    });
    const saved = JSON.parse(JSON.stringify(draft)) as typeof draft;
    const preview = resolvePrototypeLibrary(saved.data, saved.siteKey, saved.baseRevision);
    expect(preview.content.home.hero.title).toBe('A new Site title');
    expect(preview.client.features?.homePageVariant).toBe('hero-image');
    const membership = preview.site.configuration.pages.find(page => page.key === 'membership');
    expect(membership?.fields.find(field => field.key === 'membership')?.definition).toMatchObject({ configuration: 'category', label: 'Choose your membership type.', options });
    expect(membership?.fields.find(field => field.key === 'member-id')).toMatchObject({ included: true, definition: { required: true, format: 'digits', minLength: 7, visibilityConditionId: 'condition-requirements-membership-follow-up' } });
    expect(preview.site.products.find(product => product.productKey === 'li-10yr')?.applicants.find(applicant => applicant.applicantKey === 'member')?.constraints?.value).toMatchObject({ minimumAgeYears: 21, maximumAgeYears: 60 });
    expect(resolvePrototypeLibrary(saved.data, original.siteKey, original.baseRevision).content.home.hero.title).not.toBe('A new Site title');
  });
  it('builds under an existing MCR TPA and Association with its own branding', async () => {
    const draft = await source();
    const association = draft.data.associationEntities.find(c => c.acronym === 'AAFP')!;
    const organization = draft.data.organizations!.find(o => o.id === association.organizationId)!;
    const result = createSiteBuild(draft, { siteKey: 'site-aafp-test', siteName: 'AAFP Test', template: 'multi', newOrganization: false, organizationKey: organization.key, organizationName: organization.name, newAssociation: false, hostingAssociationKey: association.key, associationName: association.name });
    const preview = resolvePrototypeLibrary(result.data, result.siteKey, result.baseRevision);
    expect(preview.client.branding.acronym).toBe('AAFP');
    expect(preview.products.length).toBeGreaterThan(0);
    expect(result.data.associationEntities.find(c => c.id === association.id)?.status).toBe('active');
    expect(draft.data.associationEntities.find(c => c.id === association.id)?.status).toBe('inactive');
    expect(draft.data.organizations!.some(o => o.name.startsWith('Compatibility'))).toBe(false);
  });
  it('rejects duplicate Sites, cross-TPA selection and a new TPA without an Association', async () => {
    const draft = await source(); const association = draft.data.associationEntities.find(c => c.id === draft.data.sites.find(s => s.key === draft.siteKey)!.hostingAssociationId)!;
    const org = draft.data.organizations!.find(o => o.id === association.organizationId)!;
    const identity = { siteKey: 'asce', siteName: 'Copy', template: 'multi' as const, newOrganization: false, organizationKey: org.key, organizationName: org.name, newAssociation: false, hostingAssociationKey: association.key, associationName: association.name };
    expect(() => createSiteBuild(draft, identity)).toThrow('already exists');
    const other = draft.data.organizations!.find(o => o.id !== org.id)!;
    expect(() => createSiteBuild(draft, { ...identity, siteKey: 'cross-tpa-site', organizationKey: other.key })).toThrow('belonging');
    expect(() => createSiteBuild(draft, { ...identity, siteKey: 'new-tpa-site', newOrganization: true })).toThrow('requires its first Association');
  });
});
