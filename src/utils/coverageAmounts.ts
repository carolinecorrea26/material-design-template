import type {
  CoverageApplicantId,
  CoverageDefinition,
} from "../config/coverages/types";

export function getCoverageAmountRange(
  coverage: Pick<
    CoverageDefinition,
    | "minAmount"
    | "maxAmount"
    | "amountStep"
    | "spouseMinAmount"
    | "spouseMaxAmount"
    | "spouseAmountStep"
    | "childMinAmount"
    | "childMaxAmount"
    | "childAmountStep"
  >,
  applicantId: CoverageApplicantId = "member",
) {
  if (applicantId === "spouse") {
    return {
      minAmount: coverage.spouseMinAmount ?? coverage.minAmount,
      maxAmount: coverage.spouseMaxAmount ?? coverage.maxAmount,
      step: coverage.spouseAmountStep ?? coverage.amountStep,
    };
  }

  if (applicantId === "child") {
    return {
      minAmount: coverage.childMinAmount ?? coverage.minAmount,
      maxAmount: coverage.childMaxAmount ?? coverage.maxAmount,
      step: coverage.childAmountStep ?? coverage.amountStep,
    };
  }

  return {
    minAmount: coverage.minAmount,
    maxAmount: coverage.maxAmount,
    step: coverage.amountStep,
  };
}
