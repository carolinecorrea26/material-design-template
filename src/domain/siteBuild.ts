import { mapSelectionAmountReferences } from "./structuredSelectionPolicy";
import { libraryDisplayId } from './provenance';
import { hasLibraryDraftSnapshot, type LibraryDraft } from './libraryDraft';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { withFreshStartCatalog } from './freshStartCatalog';
import { isAmountCapPolicy } from './amountCapPolicy';
import type { ClientSupportContact } from './configuration';
import { isSiteLogo } from './siteLogo';
import { isValidZipOrPostalCode } from '../utils/zipToStateProvince';
import { effectiveSiteSnapshotTables } from '../persistence/catalogTables';

export type SiteBuildIdentity = {
  siteKey: string; siteName: string; template: 'single' | 'multi';
  organizationKey: string; organizationName: string; newOrganization: boolean;
  organizationAcronym?: string; organizationEmail?: string; organizationPhone?: string;
  organizationWebsite?: string; organizationAddress?: ClientSupportContact['address']; organizationLogo?: string;
  hostingAssociationKey: string; associationName: string; newAssociation: boolean;
  associationAcronym?: string; associationEmail?: string; associationPhone?: string;
  associationWebsite?: string; associationAddress?: ClientSupportContact['address']; associationLogo?: string;
};

export function suggestIdentityAcronym(name: string): string {
  const words = name.match(/[\p{L}\p{N}]+/gu) ?? [];
  return (words.length === 1 ? words[0] : words.map(word => [...word][0]).join('')).toUpperCase();
}

function normalizedWebsite(value = '') {
  const website = value.trim();
  if (!website) return '';
  try {
    const url = new URL(website.includes('://') ? website : `https://${website}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function prefillAssociationFromTpa(draft: LibraryDraft, identity: SiteBuildIdentity): Partial<SiteBuildIdentity> {
  const support = identity.newOrganization
    ? { website: identity.organizationWebsite, email: identity.organizationEmail, phone: identity.organizationPhone, address: identity.organizationAddress }
    : draft.data.organizationProfiles.find(profile => profile.organizationKey === identity.organizationKey)?.definition.support;
  if (!support) return {};
  const { website, email, phone, address } = support;
  const addressFields = ['street', 'unit', 'city', 'state', 'zip'] as const;
  const availableAddress = addressFields.filter(key => address?.[key]?.trim());
  return {
    ...(website?.trim() && { associationWebsite: website }),
    ...(email?.trim() && { associationEmail: email }),
    ...(phone?.trim() && { associationPhone: phone }),
    ...(availableAddress.length > 0 && { associationAddress: Object.fromEntries(availableAddress.map(key => [key, address?.[key]])) }),
  };
}

function identitySupport(identity: SiteBuildIdentity, kind: 'organization' | 'association'): ClientSupportContact {
  const website = normalizedWebsite(identity[`${kind}Website`]);
  return {
    email: identity[`${kind}Email`]?.trim(),
    phone: identity[`${kind}Phone`],
    address: identity[`${kind}Address`],
    ...(website && { website }),
  };
}

export function siteBuildIdentityIssue(identity: SiteBuildIdentity, step: 'tpa' | 'association'): string | undefined {
  const tpa = step === 'tpa';
  const kind = tpa ? 'organization' : 'association';
  const name = identity[`${kind}Name`].trim();
  if (!(tpa ? identity.organizationKey : identity.hostingAssociationKey) || !name) return tpa ? 'Provide TPA details.' : 'Provide Association details.';
  if (tpa ? !identity.newOrganization : !identity.newAssociation) return;
  const acronym = identity[`${kind}Acronym`] ?? suggestIdentityAcronym(name);
  const phone = identity[`${kind}Phone`];
  const email = identity[`${kind}Email`]?.trim();
  const address = identity[`${kind}Address`];
  if (!acronym.trim() || phone?.replace(/\D/g, '').length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) return 'Enter an acronym, a valid email and a 10-digit phone number.';
  if (!address?.street?.trim() || !address.city?.trim() || !address.state?.trim() || !isValidZipOrPostalCode(address.zip ?? '')) return 'Enter a street address, city, state or province, and valid ZIP or postal code.';
  if (normalizedWebsite(identity[`${kind}Website`]) === undefined) return 'Enter a valid website address.';
  if (tpa && identity.organizationLogo && !isSiteLogo(identity.organizationLogo)) return 'Upload a valid TPA logo.';
  if (!tpa && !isSiteLogo(identity.associationLogo)) return 'Upload the required Association logo.';
}
/** Copy scoped rows and their references; shared Library definitions retain their identity. */
export function createSiteBuild(source: LibraryDraft, identity: SiteBuildIdentity): LibraryDraft {
  if (!/^[a-z][a-z0-9-]{2,79}$/.test(identity.siteKey) || !identity.organizationKey || !identity.hostingAssociationKey || !identity.siteName.trim() || !identity.associationName.trim() || !identity.organizationName.trim()) throw new Error('Enter site, TPA and association names and a unique lowercase site key.');
  if (identity.newOrganization && !identity.newAssociation) throw new Error('A new TPA requires its first Association.');
  const identityIssue = siteBuildIdentityIssue(identity, 'tpa') ?? siteBuildIdentityIssue(identity, 'association');
  if (identityIssue) throw new Error(identityIssue);
  const compiled = withFreshStartCatalog(source.data, source.siteKey);
  const data = Object.fromEntries(effectiveSiteSnapshotTables.map(table => [table, compiled[table]])) as LibraryDraft['data'];
  const draft = { ...source, data: structuredClone(data) };
  if (draft.data.sites.some(s => s.key === identity.siteKey)) throw new Error('That site key already exists. Edit the existing Site instead.');
  const organizations = draft.data.organizations;
  if (!organizations) throw new Error('Load the TPA Library before creating a Site.');
  const sourceSite = draft.data.sites.find(s => s.key === source.siteKey)!;
  const sourceAssociation = draft.data.associationEntities.find(c => c.id === sourceSite.hostingAssociationId)!;
  const org = organizations.find(o => o.key === identity.organizationKey);
  if (!identity.newOrganization && !org) throw new Error('Select an existing TPA.');
  if (identity.newOrganization && org) throw new Error('TPA key already exists.');
  const association = draft.data.associationEntities.find(c => c.key === identity.hostingAssociationKey);
  if (!identity.newAssociation && (!association || association.organizationId !== org?.id)) throw new Error('Choose an Association belonging to the selected TPA.');
  if (identity.newAssociation && association) throw new Error('Association key already exists.');
  const copyAssociationDefaults = identity.newAssociation || !draft.data.configurationValues.some(r => r.scope === 'association' && r.hostingAssociationKey === identity.hostingAssociationKey);
  const timestamp = new Date().toISOString();
  const organizationId = org?.id ?? `build-org-${identity.organizationKey}`;
  const hostingAssociationId = association?.id ?? `build-association-${identity.hostingAssociationKey}`;
  const associationAcronym = (identity.associationAcronym ?? suggestIdentityAcronym(identity.associationName)).trim();
  if (identity.newOrganization) organizations.push({ ...organizations.find(o => o.id === sourceAssociation.organizationId)!, id: organizationId, key: identity.organizationKey, displayId: libraryDisplayId('organizations', identity.organizationKey), name: identity.organizationName, createdAt: timestamp, updatedAt: timestamp });
  if (identity.newAssociation) draft.data.associationEntities.push({ ...sourceAssociation, id: hostingAssociationId, key: identity.hostingAssociationKey, displayId: libraryDisplayId('associationEntities', identity.hostingAssociationKey), name: identity.associationName.trim(), status: 'active', acronym: associationAcronym, organizationId, createdAt: timestamp, updatedAt: timestamp });
  if (identity.newOrganization) {
    draft.data.organizationProfiles ??= [];
    const acronym = identity.organizationAcronym ?? suggestIdentityAcronym(identity.organizationName);
    draft.data.organizationProfiles.push({
      id: `profile-${organizationId}`, key: `profile-${organizationId}`, organizationKey: identity.organizationKey, position: draft.data.organizationProfiles.length,
      definition: {
        name: identity.organizationName.trim(), acronym: acronym.trim(),
        ...(identity.organizationLogo && { branding: { logo: identity.organizationLogo, logoAlt: `${identity.organizationName.trim()} logo` } }),
        support: identitySupport(identity, 'organization'),
      },
    });
  }
  if (association) association.status = 'active';
  const riderAmountKeys = new Set<string>();
  for (const row of draft.data.configurationValues.filter(row => row.siteKey === source.siteKey || row.scope === 'association' && row.hostingAssociationKey === sourceAssociation.key)) {
    mapSelectionAmountReferences(structuredClone(row.value), key => { riderAmountKeys.add(key); return key; });
  }
  const riderPatternKeys = new Set(draft.data.riderAmountRules.filter(row => riderAmountKeys.has(row.key)).map(row => row.amountPatternKey));
  const copies: { tableName: string; table: Record<string, unknown>[]; row: Record<string, unknown> }[] = [];
  const ids = new Map<string, string>([[sourceSite.id, `build-site-${identity.siteKey}`]]);
  for (const [tableName, rows] of Object.entries(draft.data)) {
    if (['sites', 'associationEntities', 'organizations', 'organizationProfiles'].includes(tableName)) continue;
    for (const row of rows as unknown as Record<string, unknown>[]) {
      if (row.siteKey === source.siteKey || row.siteId === sourceSite.id || copyAssociationDefaults && row.hostingAssociationKey === sourceAssociation.key && row.scope === 'association'
        || tableName === 'riderAmountRules' && riderAmountKeys.has(String(row.key))
        || tableName === 'coverageAmountPatterns' && riderPatternKeys.has(String(row.key))
        || ['amountBands', 'amountOptions'].includes(tableName) && riderPatternKeys.has(String(row.amountPatternKey))
        || tableName === 'benefitCaps' && draft.data.aggregateLimits.some(limit => limit.siteKey === source.siteKey && limit.key === row.aggregateLimitKey)) {
        ids.set(String(row.id), `build-${identity.siteKey}-${row.id}`);
        copies.push({ tableName, table: rows as unknown as Record<string, unknown>[], row });
      }
    }
  }
  const amountRuleKeys = new Map(copies.filter(copy => copy.tableName === 'productAmountRules' && typeof copy.row.key === 'string')
    .map(copy => [copy.row.key, `build.${identity.siteKey}.${copy.row.key}`]));
  const copiedRiderAmountKeys = new Map([...riderAmountKeys].map(key => [key, `build.${identity.siteKey}.${key}`]));
  const copiedRiderPatternKeys = new Map([...riderPatternKeys].map(key => [key, `build.${identity.siteKey}.${key}`]));
  const limitKeys = new Map(copies.filter(copy => copy.tableName === 'aggregateLimits' && typeof copy.row.key === 'string')
    .map(copy => [copy.row.key, `build.${identity.siteKey}.${copy.row.key}`]));
  for (const { tableName, table, row } of copies) {
    const copied = structuredClone(row);
    for (const [key, value] of Object.entries(copied)) {
      if (key === 'siteKey' && value === source.siteKey) copied[key] = identity.siteKey;
      else if (key === 'hostingAssociationKey' && value === sourceAssociation.key) copied[key] = identity.hostingAssociationKey;
      else if (typeof value === 'string' && (key === 'id' || key.endsWith('Id')) && ids.has(value)) copied[key] = ids.get(value);
    }
    if (copied.scope === 'association' && copied.hostingAssociationKey === identity.hostingAssociationKey && !identity.newAssociation && ['brandingProfiles', 'supportProfiles'].includes(tableName)) continue;
    if (typeof copied.key === 'string') copied.key = `build.${identity.siteKey}.${copied.key}`;
    if (tableName === 'benefitCaps' && limitKeys.has(copied.aggregateLimitKey)) copied.aggregateLimitKey = limitKeys.get(copied.aggregateLimitKey);
    if (['riderAmountRules', 'amountBands', 'amountOptions'].includes(tableName) && typeof copied.amountPatternKey === 'string' && copiedRiderPatternKeys.has(copied.amountPatternKey)) copied.amountPatternKey = copiedRiderPatternKeys.get(copied.amountPatternKey);
    const value = copied.value;
    if (tableName === 'configurationValues') mapSelectionAmountReferences(value, key => {
      const remapped = copiedRiderAmountKeys.get(key);
      if (!remapped) throw new Error('Cannot copy an unresolved rider amount reference');
      return remapped;
    });
    if (tableName === 'configurationValues' && draft.data.configurationDefinitions.some(definition => definition.key === copied.configurationKey && definition.definition.target?.kind === 'product-amount-cap-policy')) {
      if (!isAmountCapPolicy(value)) throw new Error('Cannot copy an invalid amount-cap assignment');
      value.limitKeys = value.limitKeys.map(key => {
        const target = limitKeys.get(key);
        if (typeof target !== 'string') throw new Error('Cannot copy an unresolved amount-cap limit reference');
        return target;
      });
    }
    if (tableName === 'configurationValues' && value !== null && typeof value === 'object' && 'version' in value && value.version === 2
      && 'amountSource' in value && value.amountSource === 'product-amount-rules' && 'applicants' in value && Array.isArray(value.applicants)) {
      for (const applicant of value.applicants) {
        if (!applicant || typeof applicant !== 'object' || typeof applicant.amountRuleKey !== 'string' || !amountRuleKeys.has(applicant.amountRuleKey)) throw new Error('Cannot copy an unresolved benefit amount reference');
        applicant.amountRuleKey = amountRuleKeys.get(applicant.amountRuleKey);
      }
    }
    copied.displayId = libraryDisplayId(tableName, String(copied.key ?? copied.id));
    table.push(copied);
  }
  if (copyAssociationDefaults) {
    for (const [table, definition] of [['brandingProfiles', { name: identity.associationName, acronym: association?.acronym ?? associationAcronym, logo: '', logoAlt: identity.associationName }], ['supportProfiles', {}]] as const) {
      if (!draft.data[table].some(r => r.scope === 'association' && r.hostingAssociationKey === identity.hostingAssociationKey)) draft.data[table].push({ id: `build-${identity.siteKey}-${table}`, key: `build-${identity.siteKey}-${table}`, position: draft.data[table].length, scope: 'association', hostingAssociationKey: identity.hostingAssociationKey, siteKey: null, definition });
    }
  }
  if (identity.newAssociation) {
    for (const row of draft.data.supportProfiles.filter(r => r.scope === 'association' && r.hostingAssociationKey === identity.hostingAssociationKey)) row.definition = identitySupport(identity, 'association');
    for (const row of draft.data.brandingProfiles.filter(r => r.scope === 'association' && r.hostingAssociationKey === identity.hostingAssociationKey)) Object.assign(row.definition, { name: identity.associationName.trim(), acronym: associationAcronym, logo: identity.associationLogo, logoAlt: identity.associationName.trim() });
  }
  if (identity.hostingAssociationKey !== sourceAssociation.key) {
    // Copied Site overrides must not display another association's identity or contacts.
    draft.data.brandingProfiles = draft.data.brandingProfiles.filter(r => r.siteKey !== identity.siteKey);
    draft.data.supportProfiles = draft.data.supportProfiles.filter(r => r.siteKey !== identity.siteKey);
    // Association identities belong to the source host. A different host must
    // configure its own context rather than inherit source membership identities.
    draft.data.siteAssociations = draft.data.siteAssociations.filter(row => row.siteKey !== identity.siteKey);
    for (const policy of draft.data.sitePolicies.filter(row => row.siteKey === identity.siteKey)) {
      delete policy.definition.associationSelection;
      delete policy.definition.associationBranding;
    }
  }
  draft.data.sites.push({ ...sourceSite, id: ids.get(sourceSite.id)!, key: identity.siteKey, displayId: libraryDisplayId('sites', identity.siteKey), hostingAssociationId, name: identity.siteName, displayName: identity.siteName, templateType: identity.template, environment: 'prototype', createdAt: timestamp, updatedAt: timestamp });
  draft.siteKey = identity.siteKey; draft.editVersion = 0; delete draft.mockTransport;
  if (!hasLibraryDraftSnapshot(draft)) throw new Error('The selected Library cannot be copied into a valid Site.');
  resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
  return draft;
}

/** Opaque generated IDs are independent of user-facing names and acronyms. */
export function newBuildKey(kind: 'site' | 'association' | 'tpa') { return `${kind}-${crypto.randomUUID()}`; }
