import type { DatabaseSchema } from "../persistence/types";

type AmountPattern = DatabaseSchema["coverageAmountPatterns"][number];
type AmountBand = DatabaseSchema["amountBands"][number];
type AmountOption = DatabaseSchema["amountOptions"][number];
type EligibilityConstraint = DatabaseSchema["eligibilityConstraints"][number];
type UnderwritingBand = DatabaseSchema["underwritingBands"][number];

function isNonnegativeFinite(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function isSupportedAmountBand(band: AmountBand): boolean {
  if (band.conditionKey !== null) return false;
  if (!isNonnegativeFinite(band.minimum) || !isNonnegativeFinite(band.maximum)) return false;
  if (band.increment === null || !Number.isFinite(band.increment) || band.increment <= 0) return false;
  return band.maximum >= band.minimum;
}

function hasDistinctOptions(options: AmountOption[]): boolean {
  return options.length > 0 && new Set(options.map(option => option.value)).size === options.length;
}

function isNumericAmountOption(option: AmountOption): boolean {
  if (option.value.trim() === "") return false;
  const amount = Number(option.value);
  return Number.isFinite(amount) && amount >= 0;
}

/** Supported execution shapes; this does not validate every stored catalog property. */
export function isSupportedAmountPattern(pattern: AmountPattern, bands: AmountBand[], options: AmountOption[]): boolean {
  if (pattern.formula !== null || !bands.every(isSupportedAmountBand)) return false;
  switch (pattern.amountType) {
    case "range":
    case "tiered-range":
      return bands.length > 0;
    case "range-plus-fixed":
      return bands.length > 0 && options.length > 0;
    case "named-option":
      return hasDistinctOptions(options);
    case "set":
      return hasDistinctOptions(options) && options.every(isNumericAmountOption);
    case "fixed":
      return isNonnegativeFinite(pattern.minimum) && pattern.minimum === pattern.maximum;
    case "multiplier":
      return isNonnegativeFinite(pattern.multiplier) && pattern.baseApplicantKey !== null && pattern.baseProductKey !== null;
    default:
      return false;
  }
}

export function validateEligibilityConstraint(constraint: EligibilityConstraint): void {
  const ages = [constraint.minimumAgeDays, constraint.minimumAgeYears, constraint.maximumAgeYears, constraint.studentMaximumAgeYears];
  const numbers = [...ages, constraint.minimumWorkHours];
  const validNumbers = numbers.every(value => value === null || isNonnegativeFinite(value));
  const validAges = ages.every(value => value === null || Number.isInteger(value));
  const validAgeRange = constraint.minimumAgeYears === null || constraint.maximumAgeYears === null || constraint.minimumAgeYears <= constraint.maximumAgeYears;
  const validStudentRange = constraint.maximumAgeYears === null || constraint.studentMaximumAgeYears === null || constraint.studentMaximumAgeYears >= constraint.maximumAgeYears;
  if (!validNumbers || !validAges || !validAgeRange || !validStudentRange) throw new Error(`Invalid eligibility: ${constraint.key}`);
}

export type ExecutableUnderwritingBand = UnderwritingBand & {
  minimumAge: number;
  maximumAge: number;
  minimumAmount: number;
  maximumAmount: number;
  pathway: string;
};

/** Narrow only the properties checked by the supported underwriting contract. */
export function validateUnderwritingBand(band: UnderwritingBand, siteKey: string, applicantKey: string): asserts band is ExecutableUnderwritingBand {
  const pathways = siteKey === "waepa-gi" ? ["QD", "FUW", "GI"] : ["QD", "FUW"];
  const supportedScope = band.siteKey === siteKey && band.applicantTypeKey === applicantKey;
  const unconditional = band.conditionKey === null && band.applicantClass === null && band.mortalityMorbidity === null;
  const supportedPathway = band.status === "documented" && pathways.includes(band.pathway ?? "");
  const validRanges = isNonnegativeFinite(band.minimumAge) && isNonnegativeFinite(band.maximumAge)
    && isNonnegativeFinite(band.minimumAmount) && isNonnegativeFinite(band.maximumAmount)
    && band.minimumAge <= band.maximumAge && band.minimumAmount <= band.maximumAmount;
  if (!supportedScope || !unconditional || !supportedPathway || !validRanges) throw new Error(`Unsupported underwriting rule: ${band.key}`);
}

type UnderwritingRange = Pick<ExecutableUnderwritingBand, "minimumAge" | "maximumAge" | "minimumAmount" | "maximumAmount" | "minimumAmountExclusive">;

export function validateUnderwritingOverlap(bands: readonly UnderwritingRange[], productKey: string, applicantKey: string): void {
  for (let index = 0; index < bands.length; index++) {
    const current = bands[index];
    for (const other of bands.slice(index + 1)) {
      const low = Math.max(current.minimumAmount, other.minimumAmount);
      const high = Math.min(current.maximumAmount, other.maximumAmount);
      const excludedBoundary = (current.minimumAmount === low && current.minimumAmountExclusive)
        || (other.minimumAmount === low && other.minimumAmountExclusive);
      const amountsOverlap = low < high || (low === high && !excludedBoundary);
      const agesOverlap = Math.max(current.minimumAge, other.minimumAge) <= Math.min(current.maximumAge, other.maximumAge);
      if (agesOverlap && amountsOverlap) throw new Error(`Overlapping underwriting: ${productKey}/${applicantKey}`);
    }
  }
}
