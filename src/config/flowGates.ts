import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import type { PageId } from "../types";
import { getActiveClientCoverages } from "./client/getActiveClientCoverages";
import { getClientPageRequirement } from "./client/getClientPageRequirement";
import type { ClientPageRequirement } from "./clients/types";
import type {
  CoverageCategoryId,
  CoverageDefinition,
  CoverageUnderwritingType,
  RiderDefinition,
} from "./coverages/types";

export type FlowGate =
  | {
      kind: "selected-category";
      categoryIds: CoverageCategoryId[];
    }
  | {
      kind: "selected-underwriting-type";
      underwritingTypes: CoverageUnderwritingType[];
    }
  | {
      kind: "selected-coverage";
      categoryId: CoverageCategoryId;
      underwritingType: CoverageUnderwritingType;
    }
  | {
      kind: "selected-rider";
      riderId: RiderDefinition["id"];
    };

export type FlowGateDefinition = {
  pageId: PageId;
  gate: FlowGate;
};

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
  {
    pageId: "health-cir",
    gate: { kind: "selected-rider", riderId: "cir" },
  },
];

export function getFlowGateDefinition(
  pageId: PageId,
): FlowGateDefinition | undefined {
  return flowGateDefinitions.find((definition) => definition.pageId === pageId);
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
    : coverages.filter((coverage) => selectedIds.has(coverage.id));
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

function getSelectedRiderIds(values: ApplicationFormValues): Set<string> {
  const riderSelections =
    values.coverageRiders != null &&
    typeof values.coverageRiders === "object" &&
    !Array.isArray(values.coverageRiders)
      ? (values.coverageRiders as Record<string, boolean>)
      : {};

  return new Set(
    Object.entries(riderSelections)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key.split(":")[1])
      .filter(Boolean),
  );
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
  if (!definition) return true;
  if (definition.gate.kind === "selected-rider") {
    return getSelectedRiderIds(values).has(definition.gate.riderId);
  }
  return getSelectedCoverages(values, coverages).some((coverage) =>
    coverageSatisfiesFlowGate(coverage, definition.gate),
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
