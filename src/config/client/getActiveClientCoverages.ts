import { coverages } from "../coverages";
import { getActiveClient } from "./getActiveClient";

export function getActiveClientCoverages() {
  const client = getActiveClient();
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
        minAmount: range?.min ?? coverage.minAmount,
        maxAmount: range?.max ?? coverage.maxAmount,
        description: description ?? coverage.description,
        featured: override?.featured ?? coverage.featured,
        coverageNote: override?.coverageNote ?? coverage.coverageNote,
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
