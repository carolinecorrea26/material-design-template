import { resolveCoverageJourneyPolicy } from '../domain/coverageJourneyPolicy';
import { getFormTemplate } from './template/resolveTemplate';
import { ruleAppliesToTemplate } from '../domain/ruleTemplates.mjs';
import { collectsBeneficiaries } from "../domain/beneficiaryParticipation";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getPrototypeLibrary, getRelatedPrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { possibleProductHealthPages } from '../domain/coverageJourneyUnderwriting';
import { getEffectiveSiteConfig } from '../repositories/sites';
import type { EffectiveSite } from '../domain/effectiveSite';
import type { FormTemplate } from './template/resolveTemplate';
import { resolveActiveAssociationFromApplication } from '../data/activeAssociation';
import { resolveSiteId } from '../data/activeSite';
import { applicationCoverageName } from "../domain/coverageRuntime";
import { buildSelectedCoverageEntries, getCoverageAmountRequested } from "../utils/coverageDecisions";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import type { PageId } from "../types";
import { getActiveClientCoverages } from "./client/getActiveClientCoverages";
import { getClientPageRequirement } from "./client/getClientPageRequirement";
import type { ClientPageRequirement } from "./clients/types";
import type {
  CoverageCategoryId,
  CoverageDefinition,
} from "./coverages/types";

import type { FlowGate, FlowGateDefinition } from "../domain/routingRules";
export type { FlowGate, FlowGateDefinition } from "../domain/routingRules";
export type FlowInspectionContext = { site?: EffectiveSite; template: FormTemplate; definitions: FlowGateDefinition[] };
export function libraryFlowContext(library: PrototypeLibrary): FlowInspectionContext {
  return { site: library.site, template: library.client.features?.defaultTemplate ?? 'multi', definitions: library.site.configuration.routing?.definitions ?? [] };
}
export function siteFlowContext(siteKey: string): FlowInspectionContext {
  const library = getRelatedPrototypeLibrary(siteKey);
  if (library) return libraryFlowContext(library);
  const client = getEffectiveSiteConfig(siteKey);
  return { template: client.features?.defaultTemplate ?? 'multi', definitions: client.routingGates ?? flowGateDefinitions };
}

/** Canonical business requirements controlling page participation. */
export const flowGateDefinitions: FlowGateDefinition[] = [
  {
    pageId: "beneficiary",
    gate: { kind: "selected-category", categoryIds: ["LI", "AD"] },
  },
  {
    pageId: "health-si",
    gate: { kind: "selected-underwriting-type", underwritingTypes: ["SI"] },
  },
  {
    pageId: "health-qd",
    gate: { kind: "selected-underwriting-type", underwritingTypes: ["QD"] },
  },
  { pageId: "health-tele", gate: { kind: "selected-underwriting-type", underwritingTypes: ["TELE"] } },
  {
    pageId: "health-di-supp",
    gate: {
      kind: "selected-coverage",
      categoryId: "DI",
      underwritingType: "TELE",
    },
  },
  {
    pageId: "health-cir",
    gate: { kind: "selected-rider", riderId: "cir" },
  },
];

export function getFlowGateDefinition(
  pageId: PageId,
  context?: FlowInspectionContext,
): FlowGateDefinition | undefined {
  const library = getPrototypeLibrary();
  const definitions = context?.definitions ?? (library ? library.site.configuration.routing?.definitions ?? [] : flowGateDefinitions);
  return definitions.find((definition) => definition.pageId === pageId && (!definition.templates || ruleAppliesToTemplate(definition, context?.template ?? getFormTemplate())));
}

export function getSelectedCoverages(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[] = getActiveClientCoverages(),
): CoverageDefinition[] {
  const selectedIds = new Set(
    Array.isArray(values.coverageSelections) ? values.coverageSelections : [],
  );
  return selectedIds.size === 0
    ? []
    : coverages.filter((coverage) => selectedIds.has(coverage.id)).map(coverage => ({ ...coverage, name: applicationCoverageName(coverage, values) }));
}

export function getSelectedCategoryIds(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[] = getActiveClientCoverages(),
): CoverageCategoryId[] {
  return [
    ...new Set(
      getSelectedCoverages(values, coverages).map(
        (coverage) => coverage.categoryId,
      ),
    ),
  ];
}

/** Applicant-specific category applicability for post-selection fields and sections. */
export function applicantHasSelectedCategory(values: ApplicationFormValues, applicant: 'self' | 'member' | 'spouse' | 'child', categoryIds: readonly string[], coverages: CoverageDefinition[] = getActiveClientCoverages()) {
  const type = applicant === 'self' ? 'member' : applicant;
  return buildSelectedCoverageEntries(values, coverages).some(entry => entry.applicant === type && categoryIds.includes(entry.coverage.categoryId));
}

function riderIsSelected(values: Record<string, unknown>, coverageId: string, applicant: string, riderId: string): boolean {
  const riderSelections =
    values.coverageRiders != null &&
    typeof values.coverageRiders === "object" &&
    !Array.isArray(values.coverageRiders)
      ? (values.coverageRiders as Record<string, boolean>)
      : {};

  return riderSelections[`${coverageId}:${riderId}:${applicant}`] === true;
}

export function coverageSatisfiesFlowGate(
  coverage: CoverageDefinition,
  gate: FlowGate,
): boolean {
  switch (gate.kind) {
    case "selected-category":
      return gate.categoryIds.includes(coverage.categoryId);
    case "selected-underwriting-type":
      return gate.underwritingTypes.includes(coverage.underwritingType);
    case "selected-coverage":
      return (
        coverage.categoryId === gate.categoryId &&
        coverage.underwritingType === gate.underwritingType
      );
    case "selected-rider":
      return coverage.riders?.some((rider) => rider.id === gate.riderId) ?? false;
  }
}

export function resolveFlowGate(
  pageId: PageId,
  values: ApplicationFormValues,
  coverages: CoverageDefinition[] = getActiveClientCoverages(),
): boolean {
  const definition = getFlowGateDefinition(pageId);
  if (pageId === "beneficiary") return buildSelectedCoverageEntries(values, coverages).some(({ coverage, applicant }) => getCoverageAmountRequested(values, coverage.id, applicant) !== null && collectsBeneficiaries(getPrototypeLibrary()?.site, coverage.id, coverage.categoryId, applicant, resolveActiveAssociationFromApplication(resolveSiteId(), values as ApplicationFormValues).association?.id));
  if (pageId === 'payment') {
    const library = getPrototypeLibrary();
    return !library || buildSelectedCoverageEntries(values, coverages).some(entry => resolveCoverageJourneyPolicy(library.site, entry.coverage.id)?.payment.collection !== 'none');
  }
  if (!definition) return true;
  if (definition.gate.kind === "selected-rider") {
    const gate = definition.gate;
    return buildSelectedCoverageEntries(values, coverages).some(entry => coverageSatisfiesFlowGate(entry.coverage, gate) && riderIsSelected(values, entry.coverageId, entry.applicant, gate.riderId) && riderQuestionnaireApplies(pageId, entry.applicant, values));
  }
  return buildSelectedCoverageEntries(values, coverages).some(({ coverage, underwriting, applicant }) =>
    !questionnaireSuppressesPage(pageId, applicant, values) && (["health-tele", "health-di-supp", "health-si", "health-qd"].includes(pageId) && (underwriting.healthPage !== undefined || pageId === "health-di-supp") ? underwriting.healthPage === pageId : coverageSatisfiesFlowGate(coverage, definition.gate)),
  );
}

export function coverageUnlocksPage(
  pageId: PageId,
  coverage: CoverageDefinition,
  context?: FlowInspectionContext,
): boolean {
  const library = getPrototypeLibrary();
  const effective = context ?? (library ? { ...libraryFlowContext(library), template: getFormTemplate() } : undefined);
  if (effective?.site) {
    if (!effective.site.configuration.pages.some(page => page.key === pageId && page.requirement !== 'none')) return false;
    if (['health-tele', 'health-di-supp', 'health-si', 'health-qd'].includes(pageId)) return possibleProductHealthPages(effective.site, coverage.id, coverage.applicants).some(page => page === pageId);
    if (pageId === 'payment') return resolveCoverageJourneyPolicy(effective.site, coverage.id)?.payment.collection !== 'none';
    if (pageId === 'beneficiary') return coverage.applicants.some(applicant => collectsBeneficiaries(effective.site, coverage.id, coverage.categoryId, applicant)
      || effective.site!.enabledAssociationKeys.some(association => collectsBeneficiaries(effective.site, coverage.id, coverage.categoryId, applicant, association)));
  }
  const definition = getFlowGateDefinition(pageId, effective);
  return definition
    ? coverageSatisfiesFlowGate(coverage, definition.gate)
    : false;
}

export function resolvePageParticipation(
  pageId: PageId,
  values: ApplicationFormValues,
  options: {
    coverages?: CoverageDefinition[];
    pageRequirement?: ClientPageRequirement;
  } = {},
): boolean {
  const pageRequirement =
    options.pageRequirement ?? getClientPageRequirement(pageId);
  return (
    pageRequirement !== "none" &&
    resolveFlowGate(pageId, values, options.coverages)
  );
}

/** Applicant participation uses the same resolved outcome as page participation. */
export function applicantParticipatesInPage(pageId: PageId, applicant: "self" | "member" | "spouse" | "child", values: Record<string, unknown>, coverages: CoverageDefinition[] = getActiveClientCoverages()): boolean {
  if (getClientPageRequirement(pageId) === "none") return false;
  const gate = getFlowGateDefinition(pageId)?.gate;
  const type = applicant === "self" ? "member" : applicant;
  if (pageId === "beneficiary") return buildSelectedCoverageEntries(values as ApplicationFormValues, coverages).some(entry => entry.applicant === type && getCoverageAmountRequested(values as ApplicationFormValues, entry.coverageId, entry.applicant) !== null && collectsBeneficiaries(getPrototypeLibrary()?.site, entry.coverage.id, entry.coverage.categoryId, type, resolveActiveAssociationFromApplication(resolveSiteId(), values as ApplicationFormValues).association?.id));
  if (gate?.kind === "selected-rider") return buildSelectedCoverageEntries(values as ApplicationFormValues, coverages).some(entry => entry.applicant === type && coverageSatisfiesFlowGate(entry.coverage, gate) && riderIsSelected(values, entry.coverageId, type, gate.riderId) && riderQuestionnaireApplies(pageId, type, values));
  return buildSelectedCoverageEntries(values as ApplicationFormValues, coverages).some(entry => entry.applicant === type && !questionnaireSuppressesPage(pageId, type, values) && (["health-tele", "health-di-supp", "health-si", "health-qd"].includes(pageId) && (entry.underwriting.healthPage !== undefined || pageId === "health-di-supp") ? entry.underwriting.healthPage === pageId : !gate || coverageSatisfiesFlowGate(entry.coverage, gate)));
}

function questionnaireSuppressesPage(pageId: string, applicant: string, values: Record<string, unknown>) {
  if (pageId !== "health-si" && pageId !== "health-qd" && pageId !== "health-di-supp") return false;
  const library = getPrototypeLibrary();
  const result = library ? configuredHealthQuestionnaire(library.site, "health-tele", applicant, values) : null;
  return result?.status === "resolved" && result.supersededPages.includes(pageId);
}

function riderQuestionnaireApplies(pageId: string, applicant: string, values: Record<string, unknown>) {
  const library = getPrototypeLibrary();
  return pageId !== 'health-cir' || !library || configuredHealthQuestionnaire(library.site, 'health-cir', applicant, values).status !== 'unassigned';
}
