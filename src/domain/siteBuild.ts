import { mapSelectionAmountReferences } from "./structuredSelectionPolicy";
import { libraryDisplayId } from './provenance';
import { isLibraryDraft, type LibraryDraft } from './libraryDraft';
import { resolvePrototypeLibrary } from './prototypeLibrary';
import { isAmountCapPolicy } from './amountCapPolicy';

export type SiteBuildIdentity = { siteKey: string; siteName: string; template: 'single' | 'multi'; organizationKey: string; organizationName: string; clientKey: string; clientName: string; newOrganization: boolean; newClient: boolean; organizationAcronym?: string; organizationContact?: string; organizationEmail?: string; organizationPhone?: string; clientAcronym?: string; clientContact?: string; clientEmail?: string; clientPhone?: string; clientLogo?: string };
/** Copy scoped rows and their references; shared Library definitions retain their identity. */
export function createSiteBuild(source: LibraryDraft, identity: SiteBuildIdentity): LibraryDraft {
  if (!/^[a-z][a-z0-9-]{2,79}$/.test(identity.siteKey) || !identity.organizationKey || !identity.clientKey || !identity.siteName.trim() || !identity.clientName.trim() || !identity.organizationName.trim()) throw new Error('Enter site, TPA and client names and a unique lowercase site key.');
  for (const kind of ['organization', 'client'] as const) {
    if (!(kind === 'organization' ? identity.newOrganization : identity.newClient)) continue;
    if (![identity[`${kind}Acronym`], identity[`${kind}Contact`], identity[`${kind}Phone`]].every(value => value?.trim()) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity[`${kind}Email`] ?? '')) throw new Error('Provide an acronym, contact name, valid email and phone for each new TPA or client.');
  }
  const draft = structuredClone(source);
  if (draft.data.sites.some(s => s.key === identity.siteKey)) throw new Error('That site key already exists. Edit the existing Site instead.');
  const organizations = draft.data.organizations;
  if (!organizations) throw new Error('Load the TPA Library before creating a Site.');
  const sourceSite = draft.data.sites.find(s => s.key === source.siteKey)!;
  const sourceClient = draft.data.clients.find(c => c.id === sourceSite.clientId)!;
  const org = organizations.find(o => o.key === identity.organizationKey);
  if (!identity.newOrganization && !org) throw new Error('Select an existing TPA.');
  if (identity.newOrganization && org) throw new Error('TPA key already exists.');
  const client = draft.data.clients.find(c => c.key === identity.clientKey);
  if (!identity.newClient && (!client || client.organizationId !== org?.id)) throw new Error('Choose a client belonging to the selected TPA.');
  if (identity.newClient && client) throw new Error('Client key already exists.');
  const copyClientDefaults = identity.newClient || !draft.data.configurationValues.some(r => r.scope === 'client' && r.clientKey === identity.clientKey);
  const timestamp = new Date().toISOString();
  const organizationId = org?.id ?? `build-org-${identity.organizationKey}`;
  const clientId = client?.id ?? `build-client-${identity.clientKey}`;
  if (identity.newOrganization) organizations.push({ ...organizations.find(o => o.id === sourceClient.organizationId)!, id: organizationId, key: identity.organizationKey, displayId: libraryDisplayId('organizations', identity.organizationKey), name: identity.organizationName, createdAt: timestamp, updatedAt: timestamp });
  if (identity.newClient) draft.data.clients.push({ ...sourceClient, id: clientId, key: identity.clientKey, displayId: libraryDisplayId('clients', identity.clientKey), name: identity.clientName.trim(), status: 'active', acronym: identity.clientAcronym?.trim() || identity.clientKey.toUpperCase(), organizationId, createdAt: timestamp, updatedAt: timestamp });
  if (identity.newOrganization) {
    draft.data.organizationProfiles ??= [];
    draft.data.organizationProfiles.push({ id: `profile-${organizationId}`, key: `profile-${organizationId}`, organizationKey: identity.organizationKey, position: draft.data.organizationProfiles.length, definition: { name: identity.organizationName, acronym: identity.organizationAcronym, support: { contactName: identity.organizationContact, email: identity.organizationEmail, phone: identity.organizationPhone } } });
  }
  if (client) client.status = 'active';
  const riderAmountKeys = new Set<string>();
  for (const row of draft.data.configurationValues.filter(row => row.siteKey === source.siteKey || row.scope === 'client' && row.clientKey === sourceClient.key)) {
    mapSelectionAmountReferences(structuredClone(row.value), key => { riderAmountKeys.add(key); return key; });
  }
  const riderPatternKeys = new Set(draft.data.riderAmountRules.filter(row => riderAmountKeys.has(row.key)).map(row => row.amountPatternKey));
  const copies: { tableName: string; table: Record<string, unknown>[]; row: Record<string, unknown> }[] = [];
  const ids = new Map<string, string>([[sourceSite.id, `build-site-${identity.siteKey}`]]);
  for (const [tableName, rows] of Object.entries(draft.data)) {
    if (['sites', 'clients', 'organizations', 'organizationProfiles'].includes(tableName)) continue;
    for (const row of rows as unknown as Record<string, unknown>[]) {
      if (row.siteKey === source.siteKey || row.siteId === sourceSite.id || copyClientDefaults && row.clientKey === sourceClient.key && row.scope === 'client'
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
      else if (key === 'clientKey' && value === sourceClient.key) copied[key] = identity.clientKey;
      else if (typeof value === 'string' && (key === 'id' || key.endsWith('Id')) && ids.has(value)) copied[key] = ids.get(value);
    }
    if (copied.scope === 'client' && copied.clientKey === identity.clientKey && !identity.newClient && ['brandingProfiles', 'supportProfiles'].includes(tableName)) continue;
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
  if (copyClientDefaults && !identity.newClient) {
    for (const [table, definition] of [['brandingProfiles', { name: identity.clientName, acronym: client!.acronym, logo: '', logoAlt: identity.clientName }], ['supportProfiles', {}]] as const) {
      if (!draft.data[table].some(r => r.scope === 'client' && r.clientKey === identity.clientKey)) draft.data[table].push({ id: `build-${identity.siteKey}-${table}`, key: `build-${identity.siteKey}-${table}`, position: draft.data[table].length, scope: 'client', clientKey: identity.clientKey, siteKey: null, definition });
    }
  }
  if (identity.newClient && identity.clientAcronym) {
    for (const row of draft.data.supportProfiles.filter(r => r.scope === 'client' && r.clientKey === identity.clientKey)) row.definition = { contactName: identity.clientContact, email: identity.clientEmail, phone: identity.clientPhone };
    for (const row of draft.data.brandingProfiles.filter(r => r.scope === 'client' && r.clientKey === identity.clientKey)) Object.assign(row.definition, { name: identity.clientName, acronym: identity.clientAcronym, logo: identity.clientLogo || '', logoAlt: identity.clientName });
  }
  if (identity.clientKey !== sourceClient.key) {
    // Copied Site overrides must not display another client's identity or contacts.
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
  draft.data.sites.push({ ...sourceSite, id: ids.get(sourceSite.id)!, key: identity.siteKey, displayId: libraryDisplayId('sites', identity.siteKey), clientId, hostingAssociationId: clientId, name: identity.siteName, displayName: identity.siteName, templateType: identity.template, environment: 'prototype', createdAt: timestamp, updatedAt: timestamp });
  draft.siteKey = identity.siteKey; draft.editVersion = 0; delete draft.mockTransport;
  if (!isLibraryDraft(draft)) throw new Error('The selected Library cannot be copied into a valid Site.');
  resolvePrototypeLibrary(draft.data, draft.siteKey, draft.baseRevision);
  return draft;
}

/** Opaque generated IDs are independent of user-facing names and acronyms. */
export function newBuildKey(kind: 'site' | 'client' | 'tpa') { return `${kind}-${crypto.randomUUID()}`; }
