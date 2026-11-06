import { collectsBeneficiaries } from "../domain/beneficiaryParticipation";
import { configuredHealthQuestionnaire } from "../domain/configuredHealthQuestionnaire";
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
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
  {
    pageId: "health-li",
    gate: {
      kind: "selected-coverage",
      categoryId: "LI",
      underwritingType: "TELE",
    },
  },
  {
    pageId: "health-di",
    gate: {
      kind: "selected-coverage",
      categoryId: "DI",
      underwritingType: "TELE",
    },
  },
  { pageId: "health-ci", gate: { kind: "selected-coverage", categoryId: "SH", underwritingType: "FUW" } },
  {
    pageId: "health-cir",
    gate: { kind: "selected-rider", riderId: "cir" },
  },
];

export function getFlowGateDefinition(
  pageId: PageId,
): FlowGateDefinition | undefined {
  const library = getPrototypeLibrary();
  const definitions = library ? library.site.configuration.routing?.definitions ?? [] : flowGateDefinitions;
  return definitions.find((definition) => definition.pageId === pageId);
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
  if (pageId === "beneficiary") return buildSelectedCoverageEntries(values, coverages).some(({ coverage, applicant }) => getCoverageAmountRequested(values, coverage.id, applicant) !== null && collectsBeneficiaries(getPrototypeLibrary()?.site, coverage.id, coverage.categoryId, applicant, typeof values.membership === "string" ? values.membership : undefined, definition ? coverageSatisfiesFlowGate(coverage, definition.gate) : true));
  if (!definition) return true;
  if (definition.gate.kind === "selected-rider") {
    const gate = definition.gate;
    return buildSelectedCoverageEntries(values, coverages).some(entry => coverageSatisfiesFlowGate(entry.coverage, gate) && riderIsSelected(values, entry.coverageId, entry.applicant, gate.riderId));
  }
  return buildSelectedCoverageEntries(values, coverages).some(({ coverage, underwriting, applicant }) =>
    !questionnaireSuppressesPage(pageId, applicant, values) && (["health-li", "health-di", "health-si", "health-qd", "health-ci"].includes(pageId) && underwriting.healthPage !== undefined ? underwriting.healthPage === pageId : coverageSatisfiesFlowGate(coverage, definition.gate)),
  );
}

export function coverageUnlocksPage(
  pageId: PageId,
  coverage: CoverageDefinition,
): boolean {
  const definition = getFlowGateDefinition(pageId);
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
  if (pageId === "beneficiary") return buildSelectedCoverageEntries(values as ApplicationFormValues, coverages).some(entry => entry.applicant === type && getCoverageAmountRequested(values as ApplicationFormValues, entry.coverageId, entry.applicant) !== null && collectsBeneficiaries(getPrototypeLibrary()?.site, entry.coverage.id, entry.coverage.categoryId, type, typeof values.membership === "string" ? values.membership : undefined, !gate || coverageSatisfiesFlowGate(entry.coverage, gate)));
  if (gate?.kind === "selected-rider") return buildSelectedCoverageEntries(values as ApplicationFormValues, coverages).some(entry => entry.applicant === type && coverageSatisfiesFlowGate(entry.coverage, gate) && riderIsSelected(values, entry.coverageId, type, gate.riderId));
  return buildSelectedCoverageEntries(values as ApplicationFormValues, coverages).some(entry => entry.applicant === type && !questionnaireSuppressesPage(pageId, type, values) && (["health-li", "health-di", "health-si", "health-qd", "health-ci"].includes(pageId) && entry.underwriting.healthPage !== undefined ? entry.underwriting.healthPage === pageId : !gate || coverageSatisfiesFlowGate(entry.coverage, gate)));
}

function questionnaireSuppressesPage(pageId: string, applicant: string, values: Record<string, unknown>) {
  if (pageId !== "health-si" && pageId !== "health-qd" && pageId !== "health-di") return false;
  const library = getPrototypeLibrary();
  const result = library ? configuredHealthQuestionnaire(library.site, "health-li", applicant, values) : null;
  return result?.status === "resolved" && result.supersededPages.includes(pageId);
}
