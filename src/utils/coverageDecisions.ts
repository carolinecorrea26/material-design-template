import { getPrototypeLibrary, type PrototypeLibrary } from "../domain/prototypeLibrary";
import { selectedProductApplicants } from '../domain/applicantParticipation';
import { applicationCoverageName, applicationUnderwriting, type UnderwritingOutcome } from "../domain/coverageRuntime";
import { getContent } from "../content";
import type {
  CoverageApplicantId,
  CoverageDefinition,
  CoverageUnderwritingType,
} from "../config/coverages/types";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";

export type QdDecisionResult =
  | "conditionally-approved"
  | "referred"
  | "soft-declined"
  | "database-unavailable";

export type SelectedCoverageEntry = {
  coverageId: string;
  applicant: CoverageApplicantId;
  coverage: CoverageDefinition;
  underwriting: UnderwritingOutcome;
};

export type DecisionStatus = {
  label: string;
  color: string;
  description: string;
  /** Which step the stepper should highlight (0=Submitted, 1=Reviewing, 2=Decision) */
  activeStep: number;
};

const APPLICANT_SORT_ORDER: Record<CoverageApplicantId, number> = {
  member: 0,
  spouse: 1,
  child: 2,
};

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

export function isQdDecisionResult(value: unknown): value is QdDecisionResult {
  return value === 'conditionally-approved' || value === 'referred' || value === 'soft-declined' || value === 'database-unavailable';
}

export function readQdDecisionResult(
  values: ApplicationFormValues,
  coverageId: string,
  applicant: CoverageApplicantId,
): QdDecisionResult | undefined {
  const decisions = values.qdDecisions;

  if (decisions && typeof decisions === "object" && !Array.isArray(decisions)) {
    const key = `${coverageId}:${applicant}`;
    const result = (decisions as Record<string, string>)[key];

    if (isQdDecisionResult(result)) return result;
  }

}

export function getDecisionStatus(opts: {
  underwritingType: CoverageUnderwritingType;
  decisionResult?: QdDecisionResult;
  content?: import('../content/types').ReceiptContent;
}): DecisionStatus {
  const receiptContent = opts.content ?? getContent().receipt;
  const { underwritingType, decisionResult } = opts;
  const type = underwritingType.toUpperCase();
  if (type === "UNRESOLVED") throw new Error("Unresolved Receipt underwriting requirements");

  if (type !== "QD") {
    return {
      label: receiptContent.decisionStatuses.fullyUnderwritten.label,
      color: "primary.main",
      activeStep: 1,
      description:
        receiptContent.decisionStatuses.fullyUnderwritten.description,
    };
  }

  if (!decisionResult) throw new Error("Missing Receipt QD result");
  switch (decisionResult) {
    case "conditionally-approved":
      return {
        label: receiptContent.decisionStatuses.conditionallyApproved.label,
        color: "primary.main",
        activeStep: 2,
        description: receiptContent.decisionStatuses.conditionallyApproved.description,
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
  library: PrototypeLibrary | null = getPrototypeLibrary(),
): SelectedCoverageEntry[] {
  const selectedCoverageIds = getSelectedCoverageIds(values);
  const coverageById = new Map(
    coverages.map((coverage) => [coverage.id, coverage]),
  );

  return selectedCoverageIds.flatMap((coverageId) => {
    const coverage = coverageById.get(coverageId);
    if (!coverage) return [];

    const applicants = selectedProductApplicants(values, coverage);

    return applicants.map(
      (applicant) =>
        ({
          coverageId,
          applicant,
          coverage: { ...coverage, name: applicationCoverageName(coverage, values, library), underwritingType: applicationUnderwriting(coverage, applicant, values, library).underwritingType ?? "UNRESOLVED" },
          underwriting: applicationUnderwriting(coverage, applicant, values, library),
        }) satisfies SelectedCoverageEntry,
    );
  });
}

export function getOrderedDecisionEntries(
  values: ApplicationFormValues,
  coverages: CoverageDefinition[],
  library: PrototypeLibrary | null = getPrototypeLibrary(),
): SelectedCoverageEntry[] {
  const rank = new Map(coverages.map((coverage, index) => [coverage.id, index]));
  return buildSelectedCoverageEntries(values, coverages, library).sort((a, b) =>
    rank.get(a.coverageId)! - rank.get(b.coverageId)! || APPLICANT_SORT_ORDER[a.applicant] - APPLICANT_SORT_ORDER[b.applicant]);
}
