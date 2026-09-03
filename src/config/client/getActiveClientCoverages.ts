import { coverages } from "../coverages";
import { getActiveClient } from "./getActiveClient";
import type { ClientConfig } from "../clients/types";

export function getActiveClientCoverages() {
  return getClientCoverages(getActiveClient());
}

/** Same merging logic as {@link getActiveClientCoverages}, for an arbitrary client. */
export function getClientCoverages(client: ClientConfig) {
  const enabledCoverageIds = new Set(client.coverages.enabled ?? []);
  const ranges = client.coverages.ranges ?? {};
  const descriptions = client.coverages.descriptions ?? {};
  const overrides = client.coverages.overrides ?? {};

  return coverages
    .filter((coverage) => enabledCoverageIds.has(coverage.id))
    .map((coverage) => {
      const range = ranges[coverage.id];
      const description = descriptions[coverage.id];
      const override = overrides[coverage.id];

      return {
        ...coverage,
        name: override?.name ?? coverage.name,
        categoryId: override?.categoryId ?? coverage.categoryId,
        minAmount: range?.min ?? coverage.minAmount,
        maxAmount: range?.max ?? coverage.maxAmount,
        amountStep: range?.amountStep ?? coverage.amountStep,
        spouseMinAmount: range?.spouseMin ?? coverage.spouseMinAmount,
        spouseMaxAmount: range?.spouseMax ?? coverage.spouseMaxAmount,
        spouseAmountStep: range?.spouseAmountStep ?? coverage.spouseAmountStep,
        childMinAmount: range?.childMin ?? coverage.childMinAmount,
        childMaxAmount: range?.childMax ?? coverage.childMaxAmount,
        childAmountStep: range?.childAmountStep ?? coverage.childAmountStep,
        description: description ?? coverage.description,
        featured: override?.featured ?? coverage.featured,
        coverageNote: override?.coverageNote ?? coverage.coverageNote,
        applicantNotes: override?.applicantNotes ?? coverage.applicantNotes,
        productWarning: override?.productWarning ?? coverage.productWarning,
        productContent: override?.productContent ?? coverage.productContent,
        riders: override?.riders ?? coverage.riders,
        waitingPeriodOptions:
          override?.waitingPeriodOptions ?? coverage.waitingPeriodOptions,
        maxBenefitPeriodOptions:
          override?.maxBenefitPeriodOptions ?? coverage.maxBenefitPeriodOptions,
        applicants: override?.applicants ?? coverage.applicants,
        underwritingType:
          override?.underwritingType ?? coverage.underwritingType,
      };
    });
}
