import { resolvePageCatalog } from "./pageCatalog";
import { isBenefitPolicy } from './benefitPolicy';
import { validateEligibilityConstraint } from './coveragePolicyValidation';
import { linkBenefitPolicy } from './structuredBenefitPolicy';
import { riderOverrideProperties } from './riderOverrides';
import { isApplicantExperience, type ApplicantExperience } from "./applicantExperience";
import type { RiderDefinition } from "./coverage";
import { isCoverageJourneyPolicy, resolveCoverageJourneyPolicy, type CoverageJourneyPolicy } from "./coverageJourneyPolicy";
import type { PortalRevision } from "../repositories/portalDataRepository";
import { effectiveSiteSnapshotTables } from "../repositories/portalDataRepository";
import { resolveEffectiveSite, type EffectiveSiteData } from "./effectiveSite";
import { isRatePresentationPolicy, isReferenceRateTable, type RatePresentationPolicy, type ReferenceRateTable } from "./ratePresentation";
import type { FieldDefinition } from "./fields";
import { freshStartSource } from './freshStartCatalog';
import type { Json } from "../persistence/types";
import { validateSnapshotData } from "../persistence/snapshot";
import { libraryMetadata } from "./provenance";
import globalPages from '../../requirements/parked/pages.json';

/** Declared permissions, shared by the editor and its mutation boundary. */
export function sitePageRequirementOptions(key: string): string[] {
  const settings = globalPages.pages[key as keyof typeof globalPages.pages];
  return settings && 'siteRequirementOptions' in settings ? settings.siteRequirementOptions : [];
}

export function editDraftPageRequirement(draft: LibraryDraft, key: string, requirement: 'required' | 'optional' | 'none') {
  if (!sitePageRequirementOptions(key).includes(requirement)) throw new Error(`Page participation is global: ${key}`);
  return edit(draft, db => {
    const row = db.sitePages.find(row => row.siteKey === draft.siteKey && row.pageKey === key);
    if (!row) throw new Error('Unknown Site page');
    row.requirement = requirement;
  });
}

export type LibraryDraft = { mockTransport?: { id: string; version: number; baseReleaseId: string | null }; formatVersion: 1; siteKey: string; baseRevision: string; editVersion: number; data: EffectiveSiteData };
export function createLibraryDraft(revision: PortalRevision, siteKey: string): LibraryDraft {
  const data = Object.fromEntries([...new Set(effectiveSiteSnapshotTables)].map(table => {
    const first = revision.query(table, { limit: 1000 });
    const rows = [...first.rows];
    for (let offset = 1000; offset < first.total; offset += 1000) rows.push(...revision.query(table, { offset, limit: 1000 }).rows);
    return [table, rows];
  })) as EffectiveSiteData;
  resolveEffectiveSite(data, siteKey);
  return { formatVersion: 1, siteKey, baseRevision: revision.revision, editVersion: 0, data: structuredClone(data) };
}
export function hasLibraryDraftSnapshot(value: unknown): value is LibraryDraft {
  if (!value || typeof value !== "object") return false;
  const d = value as LibraryDraft;
  if (d.formatVersion !== 1 || typeof d.siteKey !== "string" || !/^[a-z][a-z0-9-]{2,79}$/.test(d.siteKey) || !/^(local|postgres):v1:sha256:[a-f0-9]{64}$/.test(d.baseRevision) || !Number.isSafeInteger(d.editVersion) || d.editVersion < 0) return false;
  try { validateSnapshotData(d.data, [...new Set(effectiveSiteSnapshotTables)]); resolvePageCatalog(d.data, d.siteKey); return true; } catch { return false; }
}
export function isLibraryDraft(value: unknown): value is LibraryDraft {
  if (!hasLibraryDraftSnapshot(value)) return false;
  try { resolveEffectiveSite(value.data, value.siteKey); return true; } catch { return false; }
}
const meta = (table: string, key: string) => ({ id: key, key, ...libraryMetadata(table, key, "Builder draft") });
function edit(draft: LibraryDraft, mutate: (data: EffectiveSiteData) => void): LibraryDraft {
  if (!isLibraryDraft(draft)) throw new Error("Invalid Library draft");
  const result = structuredClone(draft); mutate(result.data); result.editVersion++;
  if (!isLibraryDraft(result)) throw new Error("Draft edit produced an invalid Site");
  return result;
}
export function editDraftField(draft: LibraryDraft, pageKey: string, fieldKey: string, patch: Pick<Partial<FieldDefinition>, "label" | "required">) {
  if (Object.keys(patch).some(k => !["label", "required"].includes(k)) || patch.label !== undefined && (typeof patch.label !== "string" || !patch.label.trim()) || patch.required !== undefined && typeof patch.required !== "boolean") throw new Error("Invalid field edit");
  const site = resolveEffectiveSite(draft.data, draft.siteKey);
  if (!site.configuration.pages.find(p => p.key === pageKey)?.fields.some(f => f.key === fieldKey)) throw new Error("Field is not assigned to the draft Site page");
  return edit(draft, db => {
    const existing = db.siteFieldConfigurations.filter(r => r.scope === "site" && r.siteKey === draft.siteKey && r.pageKey === pageKey && r.fieldKey === fieldKey);
    if (existing.length > 1) throw new Error("Ambiguous field override");
    if (existing[0]) Object.assign(existing[0].values, patch);
    else { const key = `draft.${draft.siteKey}.${pageKey}.${fieldKey}`; db.siteFieldConfigurations.push({ ...meta("siteFieldConfigurations", key), scope: "site", siteKey: draft.siteKey, hostingAssociationKey: null, pageKey, fieldKey, include: null, hidden: null, values: patch, position: 0 }); }
  });
}
export function editDraftRates(draft: LibraryDraft, policy: RatePresentationPolicy, productKey: string, table: ReferenceRateTable | null) {
  if (!isRatePresentationPolicy(policy) || table !== null && !isReferenceRateTable(table)) throw new Error("Invalid rate presentation edit");
  if (!resolveEffectiveSite(draft.data, draft.siteKey).products.some(p => p.productKey === productKey)) throw new Error("Unavailable draft product");
  return edit(draft, db => {
    const store = (kind: "site-rate-presentation" | "product-reference-rate-table", value: Json | null) => {
      const definitions = db.configurationDefinitions.filter(d => d.definition.target?.kind === kind && (kind === "site-rate-presentation" || "productKey" in d.definition.target && d.definition.target.productKey === productKey));
      const keys = new Set(definitions.map(d => d.key));
      db.configurationValues = db.configurationValues.filter(v => !(v.scope === "site" && v.siteKey === draft.siteKey && keys.has(v.configurationKey)));
      if (value === null) return;
      const key = kind === "site-rate-presentation" ? definitions[0]?.key ?? "site.rate-presentation" : `draft.${draft.siteKey}.${productKey}.reference-rate-table`;
      if (!db.configurationDefinitions.some(d => d.key === key)) db.configurationDefinitions.push({ ...meta("configurationDefinitions", key), position: 0, definition: { path: null, metadata: { draft: true }, target: kind === "site-rate-presentation" ? { kind } : { kind, productKey } } });
      db.configurationValues.push({ ...meta("configurationValues", `${draft.siteKey}.${key}`), configurationKey: key, scope: "site", siteKey: draft.siteKey, hostingAssociationKey: null, value, position: 0 });
    };
    store("site-rate-presentation", policy as unknown as Json);
    store("product-reference-rate-table", table as unknown as Json | null);
  });
}

/** Edit billing on the selected Site/product only, retaining all other journey rules. */
export function editDraftBilling(draft: LibraryDraft, productKey: string, billing: CoverageJourneyPolicy["billing"]) {
  const site = resolveEffectiveSite(draft.data, draft.siteKey);
  const policy = resolveCoverageJourneyPolicy(site, productKey);
  if (!policy || !isCoverageJourneyPolicy({ ...policy, billing })) throw new Error("Invalid billing edit");
  return edit(draft, db => {
    const keys = new Set(db.configurationDefinitions.filter(d => d.definition.target?.kind === "product-journey-policy" && "productKey" in d.definition.target && d.definition.target.productKey === productKey).map(d => d.key));
    const row = db.configurationValues.find(v => v.siteKey === draft.siteKey && v.scope === "site" && keys.has(v.configurationKey));
    if (!row) throw new Error("No Site journey policy to edit");
    row.value = { ...policy, billing } as unknown as Json;
  });
}

export function editDraftExperience(draft: LibraryDraft, experience: ApplicantExperience) {
  if (!isApplicantExperience(experience)) throw new Error("Invalid applicant experience settings");
  return edit(draft, db => {
    const key = `draft.${draft.siteKey}.applicant-experience`;
    const keys = new Set(db.configurationDefinitions.filter(d => d.definition.path?.join('.') === 'applicantExperience').map(d => d.key));
    db.configurationValues = db.configurationValues.filter(v => !(v.scope === 'site' && v.siteKey === draft.siteKey && keys.has(v.configurationKey)));
    if (!db.configurationDefinitions.some(d => d.key === key)) db.configurationDefinitions.push({ ...meta('configurationDefinitions', key), position: 0, definition: { path: ['applicantExperience'], metadata: { draft: true } } });
    db.configurationValues.push({ ...meta('configurationValues', key), position: 0, configurationKey: key, scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, value: experience as unknown as Json });
  });
}
export function editDraftRiders(draft: LibraryDraft, productKey: string, riders: RiderDefinition[]) {
  if (!resolveEffectiveSite(draft.data, draft.siteKey).products.some(p => p.productKey === productKey) || !Array.isArray(riders) || new Set(riders.map(r => r.id)).size !== riders.length || riders.some(r => !r.id || !r.name || ['included','defaultSelected','displayAsProduct','hasAmount'].some(k => r[k as keyof RiderDefinition] !== undefined && typeof r[k as keyof RiderDefinition] !== 'boolean') || r.defaultAmount !== undefined && (!Number.isFinite(r.defaultAmount) || r.defaultAmount <= 0) || r.coverageAmounts?.some(a => a.selections?.some(s => s.type === 'amountList' && (!s.values.length || s.values.some(v => !Number.isFinite(v) || v <= 0) || new Set(s.values).size !== s.values.length))) || typeof r.description !== 'string' || !Number.isFinite(r.premiumFactor) || r.premiumFactor < 0 || r.dependentApplicant && !['spouse','child'].includes(r.dependentApplicant) || r.referenceRateTable && !isReferenceRateTable(r.referenceRateTable))) throw new Error('Invalid optional benefit configuration');
  return edit(draft, db => {
    const product = resolveEffectiveSite(db, draft.siteKey).configuration.products.find(product => product.productKey === productKey);
    if (product?.riderOwnership === 'relational') {
      if (riders.some(rider => !product.riders.some(current => current.definition?.value.id === rider.id))) throw new Error('Choose an existing rider identity for this product before editing its properties.');
      const store = (riderKey: string, property: string, value: Json) => {
        const definitions = db.configurationDefinitions.filter(definition => {
          const target = definition.definition.target;
          return target?.kind === 'product-rider-override' && target.productKey === productKey && target.riderKey === riderKey && target.property === property;
        });
        const keys = new Set(definitions.map(definition => definition.key));
        db.configurationValues = db.configurationValues.filter(row => !(row.scope === 'site' && row.siteKey === draft.siteKey && keys.has(row.configurationKey)));
        const key = `draft.${draft.siteKey}.${productKey}.${riderKey}.${property}`;
        if (!db.configurationDefinitions.some(definition => definition.key === key)) db.configurationDefinitions.push({ ...meta('configurationDefinitions', key), position: 0,
          definition: { path: null, metadata: { draft: true }, target: { kind: 'product-rider-override', productKey, riderKey, property } } });
        db.configurationValues.push({ ...meta('configurationValues', key), configurationKey: key, scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, position: 0, value });
      };
      for (const [index, current] of product.riders.entries()) {
        const definition = current.definition?.value;
        if (!definition) throw new Error('Missing rider definition');
        const position = riders.findIndex(rider => rider.id === definition.id);
        const incoming = riders[position];
        if (current.enabled !== !!incoming) store(current.key, 'enabled', !!incoming);
        const assignment = db.productRiders.find(row => row.scope === 'site' && row.siteKey === draft.siteKey && row.productKey === productKey && row.riderKey === current.key);
        if (!assignment) throw new Error('Missing Site rider assignment');
        assignment.position = incoming ? position : riders.length + index;
        if (!incoming) continue;
        // A zero compatibility fallback is not approval of an unavailable premium.
        if (incoming.premiumFactor !== (definition.premiumFactor ?? 0)) throw new Error('Rider pricing is managed separately from descriptive overrides.');
        for (const property of riderOverrideProperties) {
          if (property === 'enabled' || JSON.stringify(incoming[property]) === JSON.stringify(definition[property])) continue;
          if (['coverageAmounts', 'defaultAmount'].includes(property) && product.selectionPolicies.some(policy => policy.value !== null && typeof policy.value === 'object' && 'amountSource' in policy.value && policy.value.amountSource === 'rider-amount-rules')) throw new Error('Edit structured rider amounts and selection defaults through their Rules records.');
          store(current.key, property, incoming[property] === undefined ? null : JSON.parse(JSON.stringify(incoming[property])));
        }
      }
      return;
    }
    const key = `draft.${draft.siteKey}.${productKey}.riders`;
    const keys = new Set(db.configurationDefinitions.filter(d => d.definition.target?.kind === 'product-presentation' && d.definition.target.productKey === productKey && d.definition.target.property === 'riders').map(d => d.key));
    db.configurationValues = db.configurationValues.filter(v => !(v.scope === 'site' && v.siteKey === draft.siteKey && keys.has(v.configurationKey)));
    if (!db.configurationDefinitions.some(d => d.key === key)) db.configurationDefinitions.push({ ...meta('configurationDefinitions', key), position: 0, definition: { path: null, metadata: { draft: true }, target: { kind: 'product-presentation', productKey, property: 'riders' } } });
    db.configurationValues.push({ ...meta('configurationValues', key), position: 0, configurationKey: key, scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, value: JSON.parse(JSON.stringify(riders)) as Json });
  });
}

/** Structured editing for Library values; the existing resolver validates the result. */
export function editDraftLibraryValue(draft: LibraryDraft, table: 'configurationValues' | 'contentValues', id: string, value: Json) {
  return edit(draft, db => {
    const rows = db[table] as { id: string; scope: string; siteKey: string | null; value: Json }[];
    const row = rows.find(r => r.id === id && r.scope === 'site' && r.siteKey === draft.siteKey);
    if (!row) throw new Error('Only values scoped to this Site can be edited here.');
    row.value = value;
    // Resolve presentation too: malformed executable policies cannot be saved.
  });
}

/** A concrete preview Site stores its own data on the existing relational rows. */
export function editDraftPageCopy(draft: LibraryDraft, pageKey: string, contentKey: string, value: Json) {
  const source = freshStartSource();
  const slot = source.pages[pageKey]?.contentSlots?.[contentKey];
  if (!slot) throw new Error('This copy is owned by the shared template.');
  const targets = [contentKey, ...[source.contentBindings[contentKey] ?? []].flat()];
  return edit(draft, db => {
    const keys = new Set(db.contentEntries.filter(row => targets.includes(row.key)).map(row => row.key));
    if (!keys.size) throw new Error('This copy has no prototype binding.');
    for (const key of keys) {
      const currentValue = db.contentValues.find(row => row.contentKey === key && row.siteKey === draft.siteKey)?.value
        ?? db.contentValues.find(row => row.contentKey === key && row.scope === 'global')?.value;
      if (slot.kind === 'image') {
        if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.src !== 'string' || !/^(\/(?!\/)|https:\/\/)/.test(value.src) || typeof value.alt !== 'string' || !value.alt.trim()) throw new Error('Enter a local or HTTPS image and a description.');
      } else if (slot.kind === 'notice') {
        if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.title !== 'string' || !value.title.trim() || typeof value.text !== 'string' || !value.text.trim()) throw new Error('Enter a title and message for the entry notice.');
      } else if (typeof currentValue !== 'string' || typeof value !== 'string' || !slot.optional && !value.trim()) {
        throw new Error('Enter the required page text.');
      }
      const row = db.contentValues.find(row => row.contentKey === key && row.scope === 'site' && row.siteKey === draft.siteKey);
      if (row) row.value = value;
      else db.contentValues.push({ ...meta('contentValues', `draft.${draft.siteKey}.${key}`), contentKey: key, value, scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, position: 0 });
    }
  });
}

export function editDraftPageSetting(draft: LibraryDraft, settingId: string, value: Json) {
  const source = freshStartSource();
  const setting = source.configurations.find(row => row.id === settingId);
  const path = source.configurationBindings[settingId];
  if (!setting || setting.globalOnly || !path) throw new Error('This setting is owned by the shared template.');
  if (
    setting.type === 'enum' && (typeof value !== 'string' || !setting.options?.includes(value)) ||
    setting.type === 'boolean' && typeof value !== 'boolean' ||
    setting.type === 'number' && !(value === null && setting.default === null) && (typeof value !== 'number' || !Number.isFinite(value) || setting.minimum !== undefined && value < setting.minimum || setting.maximum !== undefined && value > setting.maximum) ||
    setting.type === 'string-list' && (!Array.isArray(value) || value.some(item => typeof item !== 'string' || !item.trim() || setting.options && !setting.options.includes(item)) || new Set(value).size !== value.length)
  ) throw new Error('Enter a value supported by the template.');
  const projected = typeof value === 'string' ? setting.runtimeValues?.[value] ?? value : value;
  return edit(draft, db => {
    const binding = db.configurationDefinitions.find(row => row.definition.path?.join('.') === path)?.key;
    if (!binding) throw new Error('This setting has no prototype binding.');
    const row = db.configurationValues.find(row => row.configurationKey === binding && row.scope === 'site' && row.siteKey === draft.siteKey);
    if (row) row.value = projected;
    else db.configurationValues.push({ ...meta('configurationValues', `draft.${draft.siteKey}.${binding}`), configurationKey: binding, value: projected, scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, position: 0 });
  });
}

export function editDraftMembershipQuestion(draft: LibraryDraft, configuration: string, label: string, options?: FieldDefinition['options']) {
  const base = draft.data.fields.find(row => row.key === 'membership')?.definition;
  const variant = base?.configurations?.[configuration];
  if (!variant || !label.trim()) throw new Error('Choose a supported Membership question and enter its prompt.');
  const mode = draft.data.sitePolicies.find(row => row.siteKey === draft.siteKey)?.definition.associationSelection?.mode;
  if (configuration === 'association' && mode !== 'select' || mode === 'select' && configuration !== 'association') throw new Error('The question must match this Site’s Association selection policy.');
  if (variant.optionSource === 'site-defined') {
    const outcomes = new Set(Object.values(base.configurations ?? {}).flatMap(choice => choice.options?.map(option => option.outcome) ?? []).filter(Boolean));
    if (!options?.length || options.some(option => !option.label.trim() || !option.value.trim() || !outcomes.has(option.outcome)) || new Set(options.map(option => option.value)).size !== options.length) throw new Error('Give each dropdown choice a unique value, label and eligibility outcome.');
  }
  return edit(draft, db => {
    const row = db.siteFieldConfigurations.find(row => row.scope === 'site' && row.siteKey === draft.siteKey && row.pageKey === 'membership' && row.fieldKey === 'membership');
    if (!row) throw new Error('Membership question is missing from the draft.');
    const { options: _options, optionSource: _source, optionOutcome: _outcome, labelVariant: _label, placeholder: _placeholder, ...previous } = row.values as FieldDefinition;
    row.values = { ...previous, ...variant, configuration, label: label.trim(), ...(variant.optionSource === 'site-defined' && { options }) };
  });
}

export function editDraftMemberId(draft: LibraryDraft, options: { included: boolean; required: boolean; digitsOnly: boolean; minLength: number | null; label?: string }) {
  const conditionId = 'condition-requirements-membership-follow-up';
  const definition = draft.data.fields.find(row => row.key === 'member-id')?.definition;
  if (options.included && options.label !== undefined && !options.label.trim()) throw new Error('Enter a label for the Member ID field.');
  if (!definition || options.minLength !== null && (!Number.isSafeInteger(options.minLength) || options.minLength < 1 || options.minLength > (definition.maxLength ?? Infinity))) throw new Error('Enter a valid Member ID minimum length.');
  return edit(draft, db => {
    if (!db.conditions.some(row => row.key === conditionId) || !db.pageSectionFields.some(row => row.fieldKey === 'member-id' && row.sectionKey.startsWith('membership.'))) throw new Error('Member ID is unavailable in the shared Membership layout.');
    let row = db.siteFieldConfigurations.find(row => row.scope === 'site' && row.siteKey === draft.siteKey && row.pageKey === 'membership' && row.fieldKey === 'member-id');
    if (!row) {
      row = { ...meta('siteFieldConfigurations', `draft.${draft.siteKey}.membership.member-id`), scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, pageKey: 'membership', fieldKey: 'member-id', include: null, hidden: null, position: 0, values: {} };
      db.siteFieldConfigurations.push(row);
    }
    const { format: _format, inputMode: _inputMode, minLength: _length, ...previous } = row.values as FieldDefinition;
    row.include = options.included;
    row.hidden = !options.included;
    row.values = {
      ...previous, required: options.required, visibilityConditionId: conditionId, ...(options.label?.trim() && { label: options.label.trim() }),
      ...(options.digitsOnly && { format: 'digits', inputMode: 'numeric' }),
      ...(options.minLength !== null && { minLength: options.minLength }),
    };
  });
}

export type DraftEligibilityBounds = Pick<EffectiveSiteData['eligibilityConstraints'][number], 'minimumAgeDays' | 'minimumAgeYears' | 'maximumAgeYears' | 'studentMaximumAgeYears' | 'minimumWorkHours'>;
export function editDraftEligibility(draft: LibraryDraft, productKey: string, applicantKey: string, bounds: DraftEligibilityBounds) {
  const row = { ...meta('eligibilityConstraints', `draft.${draft.siteKey}.${productKey}.${applicantKey}.eligibility`), siteKey: draft.siteKey, productKey, applicantTypeKey: applicantKey, ...bounds };
  try { validateEligibilityConstraint(row); }
  catch { throw new Error('Enter nonnegative bounds. Ages must be whole numbers, and the student maximum cannot be below the standard maximum.'); }
  return edit(draft, db => {
    if (!db.siteProductApplicants.some(row => row.siteKey === draft.siteKey && row.productKey === productKey && row.applicantKey === applicantKey)) {
      throw new Error('That applicant is unavailable for the selected product.');
    }
    const current = db.eligibilityConstraints.find(entry => entry.siteKey === draft.siteKey && entry.productKey === productKey && entry.applicantTypeKey === applicantKey);
    if (Object.values(bounds).every(value => value === null)) db.eligibilityConstraints = db.eligibilityConstraints.filter(entry => entry !== current);
    else if (current) Object.assign(current, bounds);
    else db.eligibilityConstraints.push(row);
  });
}

export function editDraftParticipation(draft: LibraryDraft, kind: 'page' | 'product' | 'feature', key: string, included: boolean) {
  if (kind === 'page') return editDraftPageRequirement(draft, key, included ? 'required' : 'none');
  return edit(draft, db => {
    if (kind === 'feature') {
      const row = db.siteFeatures.find(r => r.siteKey === draft.siteKey && r.featureKey === key);
      if (!row) throw new Error('Unknown Site feature');
      row.enabled = included;
    } else {
      const siteId = db.sites.find(s => s.key === draft.siteKey)!.id;
      const row = db.siteProducts.find(r => r.siteId === siteId && r.productKey === key);
      if (!row) throw new Error('Unknown Site product');
      row.enabled = included;
      if (!db.siteProducts.some(r => r.siteId === siteId && r.enabled)) throw new Error('A Site requires at least one product');
    }
  });
}
export function editDraftProfile(draft: LibraryDraft, kind: 'brandingProfiles' | 'supportProfiles', id: string, definition: Json) {
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) throw new Error('Enter a profile object');
  return edit(draft, db => {
    const row = db[kind].find(r => r.id === id);
    if (!row) throw new Error('Unknown profile');
    if (row.scope === 'site' && row.siteKey === draft.siteKey) row.definition = definition;
    else {
      const key = `draft.${draft.siteKey}.${kind}`;
      const old = db[kind].find(r => r.id === key);
      const copy = { ...structuredClone(row), id: key, key, scope: 'site' as const, siteKey: draft.siteKey, hostingAssociationKey: null, definition };
      if (old) Object.assign(old, copy); else db[kind].push(copy);
    }
  });
}

export function editDraftBenefitPolicy(draft: LibraryDraft, productKey: string, policy: import('./benefitPolicy').BenefitPolicy) {
  if (!isBenefitPolicy(policy)) throw new Error('Invalid derived benefit formula');
  return edit(draft, db => {
    const effectivePolicies = resolveEffectiveSite(db, draft.siteKey).configuration.products.find(product => product.productKey === productKey)?.benefitPolicies;
    if (effectivePolicies?.length !== 1) throw new Error('No unique benefit formula defined for this product');
    const definition = db.configurationDefinitions.find(d => d.key === effectivePolicies[0].key);
    if (!definition) throw new Error('No benefit formula defined for this product');
    const key = `draft.${draft.siteKey}.${productKey}.benefit-policy`;
    const rows = db.configurationValues.filter(v => v.scope === 'site' && v.siteKey === draft.siteKey && v.configurationKey === definition.key);
    if (rows.length > 1) throw new Error('Ambiguous benefit formula');
    const stored = rows[0]?.value;
    if (stored !== null && typeof stored === 'object' && !Array.isArray(stored) && stored.version === 2) {
      const rules = db.productAmountRules.filter(row => row.siteKey === draft.siteKey && row.productKey === productKey);
      if (rules.length !== policy.applicants.length) throw new Error('Benefit applicant scopes must match their structured amount assignments');
      const keys = policy.applicants.map(applicant => {
        const matches = rules.filter(row => row.applicantTypeKey === applicant.applicantKey && row.applicantClass === (applicant.applicantClass ?? null));
        if (matches.length !== 1 || matches[0].conditionKey !== null) throw new Error('No unique structured benefit amount assignment');
        const rule = matches[0];
        const original = db.coverageAmountPatterns.find(row => row.key === rule.amountPatternKey);
        if (!original) throw new Error('Missing structured benefit amount pattern');
        if (applicant.amountChoices && (applicant.minimum !== Math.min(...applicant.amountChoices) || applicant.maximum !== Math.max(...applicant.amountChoices))) throw new Error('Benefit limits must match the listed amount choices');
        // A shared pattern is copied before editing; only this Site assignment moves.
        const patternKey = db.productAmountRules.filter(row => row.amountPatternKey === original.key).length > 1
          || db.riderAmountRules.some(row => row.amountPatternKey === original.key)
          || db.planAmountRules.some(row => row.amountPatternKey === original.key)
          ? `draft.${draft.siteKey}.${rule.key}.amount-pattern` : original.key;
        db.coverageAmountPatterns = db.coverageAmountPatterns.filter(row => row.key !== patternKey);
        db.coverageAmountPatterns.push({ ...original, ...(patternKey !== original.key ? meta('coverageAmountPatterns', patternKey) : {}),
          amountType: applicant.amountChoices ? 'set' : 'range', minimum: null, maximum: null, increment: applicant.amountChoices ? applicant.increment : null,
          formula: null, baseProductKey: null, baseApplicantKey: null, baseApplicantClass: null, multiplier: null });
        db.amountBands = db.amountBands.filter(row => row.amountPatternKey !== patternKey);
        db.amountOptions = db.amountOptions.filter(row => row.amountPatternKey !== patternKey);
        if (applicant.amountChoices) for (const [position, amount] of applicant.amountChoices.entries()) db.amountOptions.push({
          ...meta('amountOptions', `${patternKey}.option.${amount}`), amountPatternKey: patternKey, value: String(amount), label: String(amount), position,
        });
        else db.amountBands.push({ ...meta('amountBands', `${patternKey}.band`), amountPatternKey: patternKey,
          minimum: applicant.minimum, maximum: applicant.maximum, increment: applicant.increment, conditionKey: null, position: 0 });
        rule.amountPatternKey = patternKey;
        return rule.key;
      });
      rows[0].value = JSON.parse(JSON.stringify(linkBenefitPolicy(policy, keys)));
      const effective = resolveEffectiveSite(db, draft.siteKey).configuration.products.find(product => product.productKey === productKey)?.benefitPolicies;
      if (effective?.length !== 1 || !isBenefitPolicy(effective[0].value)) throw new Error('Invalid structured derived benefit formula');
    }
    else if (rows[0]) rows[0].value = policy as unknown as Json;
    else db.configurationValues.push({ ...meta('configurationValues', key), scope: 'site', siteKey: draft.siteKey, hostingAssociationKey: null, configurationKey: definition.key, position: 0, value: policy as unknown as Json });
  });
}
