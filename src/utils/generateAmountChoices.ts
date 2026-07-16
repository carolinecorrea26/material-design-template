import type { CoverageCategoryId } from "../config/coverages/types";

export function generateAmountChoices(
  categoryId: CoverageCategoryId,
  minAmount?: number,
  maxAmount?: number,
  options?: { includeZero?: boolean; step?: number },
): number[] {
  const includeZero = options?.includeZero ?? false;

  if (minAmount != null && maxAmount != null) {
    let step = options?.step;

    if (step == null) {
      if (categoryId === "LI" || categoryId === "AD") {
        step = 25000;
      } else if (categoryId === "DI" || categoryId === "OO") {
        step = 500;
      } else {
        step = maxAmount <= 1000 ? 50 : 500;
      }
    }

    const choices = new Set<number>(
      includeZero ? [0, minAmount, maxAmount] : [minAmount, maxAmount],
    );
    for (let value = minAmount; value <= maxAmount; value += step) {
      choices.add(value);
    }

    return [...choices].sort((a, b) => a - b);
  }

  if (categoryId === "LI" || categoryId === "AD") {
    return includeZero
      ? [0, 25000, 50000, 100000, 250000, 500000]
      : [25000, 50000, 100000, 250000, 500000];
  }

  if (categoryId === "DI" || categoryId === "OO") {
    return includeZero
      ? [0, 500, 1000, 1500, 2000, 2500, 3000]
      : [500, 1000, 1500, 2000, 2500, 3000];
  }

  return includeZero ? [0, 100, 250, 500, 1000] : [100, 250, 500, 1000];
}
