import type { CoverageApplicantId, CoverageDefinition } from "./coverage";
import { getCoverageAmountChoices } from "../utils/coverageAmounts";

/** Standalone eligibility is explicit rider data, never inferred from $0. */
export function getRiderOnlyOptions(product: CoverageDefinition, applicant: CoverageApplicantId) {
  if (!product.applicants.includes(applicant)) return [];
  return (product.riders ?? []).filter(rider =>
    rider.riderOnlyApplicants?.includes(applicant) &&
    (!rider.applicants || rider.applicants.includes(applicant)),
  );
}

export function selectedRiderOnly(product: CoverageDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>) {
  const key = `${product.id}:${applicant}`;
  const amounts = values.coverageAmounts as Record<string, number> | undefined;
  const elections = values.coverageRiderOnly as Record<string, string> | undefined;
  if (amounts?.[key] !== 0) return undefined;
  return getRiderOnlyOptions(product, applicant).find(rider => rider.id === elections?.[key]);
}

/** Keep the mode and its required rider in the same form-state update. */
export function changeCoverageAmount(product: CoverageDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>, amount: number, riderId?: string) {
  const key = `${product.id}:${applicant}`;
  const standalone = amount === 0 && riderId ? getRiderOnlyOptions(product, applicant).find(rider => rider.id === riderId) : undefined;
  if (riderId && !standalone) throw new Error("This rider is not available on its own for this applicant.");
  const coverageRiderOnly = { ...(values.coverageRiderOnly as Record<string, string> ?? {}) };
  const coverageRiders = { ...(values.coverageRiders as Record<string, boolean> ?? {}) };
  const coverageRiderAmounts = { ...(values.coverageRiderAmounts as Record<string, number> ?? {}) };
  delete coverageRiderOnly[key];
  if (standalone) {
    coverageRiderOnly[key] = standalone.id;
    for (const rider of product.riders ?? []) {
      const riderKey = `${product.id}:${rider.id}:${applicant}`;
      coverageRiders[riderKey] = rider.id === standalone.id;
      if (rider.id !== standalone.id) delete coverageRiderAmounts[riderKey];
    }
    const riderKey = `${product.id}:${standalone.id}:${applicant}`;
    const defaultAmount = standalone.defaultAmount ?? getCoverageAmountChoices({ coverageAmounts: standalone.coverageAmounts }, applicant).find(value => value > 0);
    if (standalone.hasAmount && coverageRiderAmounts[riderKey] === undefined && defaultAmount !== undefined) coverageRiderAmounts[riderKey] = defaultAmount;
  }
  return {
    coverageAmounts: { ...(values.coverageAmounts as Record<string, number> ?? {}), [key]: amount },
    coverageRiderOnly, coverageRiders, coverageRiderAmounts,
  };
}
