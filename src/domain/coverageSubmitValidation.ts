import type { EffectiveSite } from "./effectiveSite";
import type { CoverageDefinition } from "./coverage";
import { validateNormalizedLifeAggregate } from "./normalizedCoverageAmounts";
import { requirementText } from "./requirementContent";
import { formatUSD } from "../utils/formatUSD";
import type { ClientConfig } from "./configuration";
import { coverageInForceLife } from "./tpaPortfolioAmounts";

/** Coverage Next checks selections plus verified in-force Life per person.
 * Later Profile other-insurance answers are not prerequisites. */
export function coverageLifeMaximumError(site: EffectiveSite, products: CoverageDefinition[], values: Record<string, unknown>, client?: ClientConfig) {
  const participation = site.configuration.lifeAggregateParticipation[0]?.value as { mode?: string } | undefined;
  if (participation?.mode === "individual-only") return undefined;
  const selected = Array.isArray(values.coverageSelections) ? values.coverageSelections : [];
  const applicants = values.productApplicants as Record<string, string[]> | undefined;
  const amounts = values.coverageAmounts as Record<string, number> | undefined;
  for (const applicant of ["member", "spouse"] as const) {
    const life = products.filter(product => selected.includes(product.id) && product.categoryId === "LI" && applicants?.[product.id]?.includes(applicant));
    if (!life.length) continue;
    const existing = coverageInForceLife(site, client, products, applicant, values)?.amount ?? 0;
    const result = validateNormalizedLifeAggregate(site, applicant, life.map(product => ({ productKey: product.id, amount: amounts?.[`${product.id}:${applicant}`] ?? 0 })), existing);
    if (result.maximum !== undefined && result.total !== undefined && result.total > result.maximum) return requirementText("coverage.error.combined-life-maximum", {
      applicant: requirementText(`people.${applicant === "member" ? "self" : "spouse"}`), maximum: formatUSD(result.maximum, 0),
    });
    if (!result.allowed) return result.reason;
  }
}
