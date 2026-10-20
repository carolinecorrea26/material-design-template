import type { DatabaseSchema } from '../persistence/types';
import type { SourceRequirements } from '../persistence/types/provenanceCanonical';
import { resolveDatabaseSite } from './resolve';
import { inspectAsceBusinessDecisions } from './asceBusinessDecisions';

import { promotionStates } from '../domain/sourcePromotion';
import { activeMigrationSiteKeys } from './activeSiteScope';
export { promotionStates } from '../domain/sourcePromotion';
export const referenceUxSheets = new Set(['new-ux-multi-page-requirements', 'new-ux-single-page-requirements']);
export const implementedSiteKeys = activeMigrationSiteKeys;
export const primarySiteKeys = ['abe', 'ama', 'asce'] as const;

// Adoption is explicit. Extraction success alone never grants canonical status.
const adoptedTargets = new Set(['flagDefinitions:application.has-underwritten-coverage']);
const discoverySheets = new Set(['disability', 'overhead-expense', 'riders', 'qd-li', 'qd-di', 'financial-questions', 'smoker-question']);
export function curateSourcePromotions(db: DatabaseSchema) {
  const targets = new Map<string, typeof db.requirementTargets>();
  for (const target of db.requirementTargets) targets.set(target.requirementKey, [...(targets.get(target.requirementKey) ?? []), target]);
  for (const requirement of db.sourceRequirements) {
    requirement.promotionState = 'SOURCE_ONLY';
    requirement.promotionReason = 'Historical/current-template evidence; no new-template adoption or Site assignment.';
    requirement.activeSiteKeys = [];
    if (referenceUxSheets.has(requirement.sheetKey)) {
      requirement.promotionReason = 'New UX workbook reference only. The implemented prototype owns page, field, flow and layout behavior.';
      continue;
    }
    const links = targets.get(requirement.key) ?? [];
    if (links.some(t => adoptedTargets.has(`${t.targetTable}:${t.targetKey}`))) {
      requirement.promotionState = 'CANONICAL_LIBRARY';
      requirement.promotionReason = 'Evidence for the approved reusable Read & Sign derived flag; no Site activation inferred.';
    } else if (requirement.classification === 'MAPPED' && discoverySheets.has(requirement.sheetKey) && links.length) {
      requirement.promotionState = 'PATTERN_CANDIDATE';
      requirement.promotionReason = 'Extracted reusable business-rule candidate; unadopted and unassigned. Existing five Patterns are retained.';
    }
  }
}

export interface ActiveBlocker { key: string; siteKey: string | null; productKey?: string; category: string; reason: string; source: string | null }
/** Inspect persisted implemented behavior, including unknowns absent from the cell ledger. */
export function implementedSiteBlockers(db: DatabaseSchema): ActiveBlocker[] {
  const blockers: ActiveBlocker[] = [];
  const decisions = inspectAsceBusinessDecisions(db);
  const approvedKeys = new Set(decisions.filter(d => d.approved).map(d => d.key));
  for (const siteKey of implementedSiteKeys) {
    try {
      const site = resolveDatabaseSite(db, siteKey);
      for (const { enabled, effective: product } of site.coverage) {
        if (!enabled) continue;
        for (const unknown of product.requirements?.unresolved ?? []) blockers.push({ key: `${siteKey}.${product.id}.${unknown.id}`, siteKey, productKey: product.id, category: 'ACTIVE_ELIGIBILITY_UNKNOWN', reason: unknown.description, source: unknown.source });
        for (const [index, band] of (product.underwritingBands ?? []).entries()) if (band.status === 'underwriting-unspecified') blockers.push({ key: `${siteKey}.${product.id}.underwriting.${index}`, siteKey, productKey: product.id, category: 'ACTIVE_UNDERWRITING_UNKNOWN', reason: `${band.scope.applicantType ?? 'all applicants'} ages ${band.minimumAgeYears}–${band.maximumAgeYears}, amounts ${band.minimumAmount}–${band.maximumAmount}: underwriting pathway is unspecified.`, source: `prototype:${siteKey}.${product.id}` });
      }
    } catch (error) {
      blockers.push({ key: siteKey, siteKey, category: 'IMPLEMENTED_SITE_INCOMPLETE', reason: String(error), source: null });
    }
  }
  // An approved canonical decision resolves only its exact historical unknown.
  // Keep compatibility configuration unchanged until deliberate runtime activation.
  const remaining = blockers.filter(blocker => !approvedKeys.has(blocker.key));
  for (const decision of decisions.filter(d => !d.approved)) {
    if (!remaining.some(blocker => blocker.key === decision.key)) remaining.push({
      key: decision.key, siteKey: decision.siteKey, category: 'APPROVED_RULE_MISMATCH',
      reason: decision.reason, source: decision.source,
    });
  }
  return remaining;
}

export function promotionIntegrityErrors(db: DatabaseSchema): string[] {
  const errors: string[] = [];
  const implemented = new Set<string>(implementedSiteKeys);
  const activeProducts = new Set(db.siteProducts.filter(r => r.enabled).map(r => r.productKey));
  const activeRiders = new Set(db.siteRiders.filter(r => r.enabled).map(r => r.riderKey));
  const requirements = new Map(db.sourceRequirements.map(r => [r.key, r]));
  for (const target of db.requirementTargets) {
    const active = target.targetTable === 'products' && activeProducts.has(target.targetKey) || target.targetTable === 'riders' && activeRiders.has(target.targetKey);
    const requirement = requirements.get(target.requirementKey);
    if (active && requirement && !isPromotedSource(requirement)) errors.push(`Unadopted evidence feeds active entity ${target.targetTable}.${target.targetKey}: ${requirement.key}`);
  }
  for (const r of db.sourceRequirements) {
    if (!promotionStates.includes(r.promotionState)) errors.push(`Unknown promotion state ${r.key}`);
    if (!r.promotionReason?.trim()) errors.push(`Missing promotion rationale ${r.key}`);
    if (!Array.isArray(r.activeSiteKeys) || r.activeSiteKeys.some(k => typeof k !== 'string' || !implemented.has(k))) errors.push(`Invalid promotion Site scope ${r.key}`);
    if (referenceUxSheets.has(r.sheetKey) && r.promotionState !== 'SOURCE_ONLY') errors.push(`UX source requires explicit reviewed adoption ${r.key}`);
    if (['SOURCE_ONLY', 'PATTERN_CANDIDATE'].includes(r.promotionState) && Array.isArray(r.activeSiteKeys) && r.activeSiteKeys.length) errors.push(`Unadopted source assigned to active Site ${r.key}`);
    if (r.promotionState === 'SITE_CONFIGURATION' && (!Array.isArray(r.activeSiteKeys) || !r.activeSiteKeys.length)) errors.push(`Site promotion without Site assignment ${r.key}`);
    if (['CANONICAL_LIBRARY', 'SITE_CONFIGURATION'].includes(r.promotionState) && !db.requirementTargets.some(t => t.requirementKey === r.key)) errors.push(`Promotion without canonical target ${r.key}`);
  }
  return errors;
}

/** Explicit selection boundary for future Library consumers; audit tables stay in Canonical Review. */
export function isPromotedSource(requirement: SourceRequirements) {
  return requirement.promotionState === 'CANONICAL_LIBRARY' || requirement.promotionState === 'SITE_CONFIGURATION';
}
