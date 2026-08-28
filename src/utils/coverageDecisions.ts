import { coverageCategories } from "../config/coverageCategories";
import { getContent } from "../content";
import type {
  CoverageApplicantId,
  CoverageDefinition,
  CoverageUnderwritingType,
} from "../config/coverages/types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";

const QUICK_DECISION_UNDERWRITING_TYPES = new Set(["SI", "GI", "NA", "QD"]);

export type QdDecisionResult =
  | "conditionally-approved"
  | "referred"
  | "soft-declined"
  | "database-unavailable";

export type SelectedCoverageEntry = {
  coverageId: string;
  applicant: CoverageApplicantId;
  coverage: CoverageDefinition;
};

export type DecisionStatus = {
  label: string;
  color: string;
  description: string;
  /** Which step the stepper should highlight (0=Submitted, 1=Reviewing, 2=Decision) */
  activeStep: number;
};

const receiptContent = getContent().receipt;

export const APPLICANT_LABELS: Record<CoverageApplicantId, string> =
  getContent().shared.applicantLabels;

const APPLICANT_SORT_ORDER: Record<CoverageApplicantId, number> = {
  member: 0,
  spouse: 1,
  child: 2,
};

const DEMO_QD_DECISION_RESULTS: QdDecisionResult[] = [
  "conditionally-approved",
  "referred",
  "soft-declined",
  "database-unavailable",
];

export const DECISION_STEPS = receiptContent.decisionSteps;

export function isQuickDecisionUnderwritingType(
  underwritingType: string,
): boolean {
  return QUICK_DECISION_UNDERWRITING_TYPES.has(underwritingType.toUpperCase());
}

export function formatCurrencyAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function toPositiveAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function normalizeApplicant(value: unknown): CoverageApplicantId | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "self") return "member";

  if (
    normalized === "member" ||
    normalized === "spouse" ||
    normalized === "child"
  ) {
    return normalized;
  }

  return null;
}

function getUniqueApplicants(values: unknown[]): CoverageApplicantId[] {
  const applicants: CoverageApplicantId[] = [];

  for (const value of values) {
    const applicant = normalizeApplicant(value);

    if (applicant && !applicants.includes(applicant)) {
      applicants.push(applicant);
    }
  }

  return applicants;
}

export function getQdDecisionResult(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: CoverageApplicantId,
  fallbackIndex: number,
): QdDecisionResult {
  const decisions = values.qdDecisions;

  if (decisions && typeof decisions === "object" && !Array.isArray(decisions)) {
    const key = `${coverageId}:${applicant}`;
    const result = (decisions as Record<string, string>)[key];

    if (
      result === "conditionally-approved" ||
      result === "referred" ||
      result === "soft-declined" ||
      result === "database-unavailable"
    ) {
      return result;
    }
  }

  return DEMO_QD_DECISION_RESULTS[
    fallbackIndex % DEMO_QD_DECISION_RESULTS.length
  ];
}

export function getDecisionStatus(opts: {
  underwritingType: CoverageUnderwritingType;
  decisionResult: QdDecisionResult;
}): DecisionStatus {
  const { underwritingType, decisionResult } = opts;
  const type = underwritingType.toUpperCase();

  if (!QUICK_DECISION_UNDERWRITING_TYPES.has(type)) {
    return {
      label: receiptContent.decisionStatuses.fullyUnderwritten.label,
      color: "primary.main",
      activeStep: 1,
      description:
        receiptContent.decisionStatuses.fullyUnderwritten.description,
    };
  }

  switch (decisionResult) {
    case "conditionally-approved":
      return {
        label: receiptContent.decisionStatuses.conditionallyApproved.label,
        color: "primary.main",
        activeStep: 2,
        description:
          receiptContent.decisionStatuses.conditionallyApproved.description,
      };

    case "referred":
      return {
        label: receiptContent.decisionStatuses.referred.label,
        color: "primary.main",
        activeStep: 1,
        description: receiptContent.decisionStatuses.referred.description,
      };

    case "soft-declined":
      return {
        label: receiptContent.decisionStatuses.softDeclined.label,
        color: "primary.main",
        activeStep: 2,
        description: receiptContent.decisionStatuses.softDeclined.description,
      };

    case "database-unavailable":
      return {
        label: receiptContent.decisionStatuses.databaseUnavailable.label,
        color: "primary.main",
        activeStep: 1,
        description:
          receiptContent.decisionStatuses.databaseUnavailable.description,
      };
  }
}

function getSelectedCoverageIds(values: ApplicationFormValues): string[] {
  return Array.isArray(values.coverageSelections)
    ? values.coverageSelections.map(String)
    : [];
}

function getSelectedDependents(
  values: ApplicationFormValues,
): CoverageApplicantId[] {
  return Array.isArray(values.dependents)
    ? getUniqueApplicants(values.dependents).filter(
        (applicant) => applicant === "spouse" || applicant === "child",
      )
    : [];
}

function getProductApplicants(
  values: ApplicationFormValues,
): Record<string, CoverageApplicantId[]> {
  if (
    values.productApplicants != null &&
    typeof values.productApplicants === "object" &&
    !Array.isArray(values.productApplicants)
  ) {
    return values.productApplicants as Record<string, CoverageApplicantId[]>;
  }

  return {};
}

export function getCoverageAmountRequested(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: CoverageApplicantId,
): number | null {
  const coverageAmounts = values.coverageAmounts;

  if (
    !coverageAmounts ||
    typeof coverageAmounts !== "object" ||
    Array.isArray(coverageAmounts)
  ) {
    return null;
  }

  return toPositiveAmount(
    (coverageAmounts as Record<string, unknown>)[`${coverageId}:${applicant}`],
  );
}

export function buildSelectedCoverageEntries(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[],
): SelectedCoverageEntry[] {
  const selectedCoverageIds = getSelectedCoverageIds(values);
  const selectedDependents = getSelectedDependents(values);
  const productApplicants = getProductApplicants(values);

  const coverageById = new Map(
    coverages.map((coverage) => [coverage.id, coverage]),
  );

  return selectedCoverageIds.flatMap((coverageId) => {
    const coverage = coverageById.get(coverageId);
    if (!coverage) return [];

    let applicants: CoverageApplicantId[];

    if (Object.prototype.hasOwnProperty.call(productApplicants, coverageId)) {
      const selectedApplicants = Array.isArray(productApplicants[coverageId])
        ? productApplicants[coverageId]
        : [];

      applicants = coverage.applicants.filter((applicant) =>
        selectedApplicants.includes(applicant),
      );
    } else if (selectedDependents.length > 0) {
      applicants = coverage.applicants.filter((applicant) => {
        if (applicant === "member") return true;
        return selectedDependents.includes(applicant);
      });
    } else {
      applicants = coverage.applicants.includes("member") ? ["member"] : [];
    }

    return applicants.map(
      (applicant) =>
        ({
          coverageId,
          applicant,
          coverage,
        }) satisfies SelectedCoverageEntry,
    );
  });
}

export function getOrderedDecisionEntries(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[],
): SelectedCoverageEntry[] {
  const selectedEntries = buildSelectedCoverageEntries(values, coverages);

  return coverageCategories.flatMap((category) =>
    selectedEntries
      .filter((entry) => entry.coverage.categoryId === category.id)
      .sort((a, b) => {
        const coverageCompare = a.coverage.name.localeCompare(
          b.coverage.name,
        );

        if (coverageCompare !== 0) return coverageCompare;

        return (
          APPLICANT_SORT_ORDER[a.applicant] - APPLICANT_SORT_ORDER[b.applicant]
        );
      }),
  );
}
