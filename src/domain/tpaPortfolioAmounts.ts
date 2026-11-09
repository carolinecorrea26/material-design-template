import portfolioFixture from "../../requirements/global/prototype-fixtures/portfolio.json";
import type { ClientConfig } from "./configuration";
import type { CoverageApplicantId, CoverageDefinition } from "./coverage";
import type { EffectiveSite } from "./effectiveSite";
import { canViewCoveragePortfolio } from "./tpaIntegration";
import { coverageRequirementValue } from "./requirementCoveragePolicy";
import { isLifeAggregatePolicy } from "./lifeAggregatePolicy";

export type TpaPortfolio = {
  portfolios: Array<{ applicant: string; coverages: Array<{ productKey: string; amount: number }> }>;
};

/** Prototype adapter boundary. Display and amount rules read the same numeric
 * fixture; no currency-label parsing or live TPA request is involved. */
export function verifiedPortfolioAmount(client: ClientConfig | undefined, values: Record<string, unknown>, applicant: CoverageApplicantId, productKeys: string[], portfolio: TpaPortfolio = portfolioFixture) {
  if (!client || !canViewCoveragePortfolio(client, values)) return 0;
  const person = applicant === "member" ? "self" : applicant;
  return portfolio.portfolios.filter(row => row.applicant === person).flatMap(row => row.coverages)
    .filter(row => productKeys.includes(row.productKey))
    .reduce((sum, row) => sum + row.amount, 0);
}

export function coverageInForceAmount(client: ClientConfig, product: CoverageDefinition, applicant: CoverageApplicantId, values: Record<string, unknown>) {
  return coverageRequirementValue(product, applicant, "coverage-deduct-inforce-amount") === true
    ? verifiedPortfolioAmount(client, values, applicant, [product.id]) : 0;
}

/** Reuses the single authored Life group/ceiling; no second maximum is stored. */
export function coverageInForceLife(site: EffectiveSite, client: ClientConfig | undefined, products: CoverageDefinition[], applicant: CoverageApplicantId, values: Record<string, unknown>) {
  const policy = site.configuration.lifeAggregates[0]?.value;
  const group = isLifeAggregatePolicy(policy) ? policy.groups.find(group => group.applicantKeys.includes(applicant)) : undefined;
  if (!group || !products.some(product => group.productKeys.includes(product.id) && coverageRequirementValue(product, applicant, "coverage-deduct-inforce-amount") === true)) return undefined;
  return { maximum: group.maximum, productKeys: group.productKeys, amount: verifiedPortfolioAmount(client, values, applicant, group.productKeys) };
}
