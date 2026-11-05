import type { EffectiveSite } from "./effectiveSite";
import { resolveJourneyUnderwriting } from "./coverageJourneyUnderwriting";
import { resolveCoverageJourneyPolicy } from "./coverageJourneyPolicy";
import { applicationApplicantFacts, numericFact } from "../utils/applicantFacts";
import { applicationUnderwritingContext } from "./quickDecisionPolicy";
export type PortfolioProcessing = Array<{ productKey: string; pathway?: string; status: string }>;
export function applicantPortfolioProducts(applicant: string, values: Record<string, unknown>) {
  const role = applicant === "self" ? "member" : applicant;
  const applicants = values.productApplicants as Record<string, string[]> | undefined;
  return (Array.isArray(values.coverageSelections) ? values.coverageSelections.map(String) : []).filter(key => applicants?.[key]?.includes(role) && numericFact((values.coverageAmounts as Record<string, unknown> | undefined)?.[`${key}:${role}`]) !== 0);
}
export function applicantPortfolioProcessing(site: EffectiveSite, applicant: string, values: Record<string, unknown>): PortfolioProcessing {
  const role = applicant === "self" ? "member" : applicant, facts = applicationApplicantFacts(values, role === "spouse" ? "spouse" : "member");
  return applicantPortfolioProducts(role, values).map(productKey => ({ productKey, ...resolveJourneyUnderwriting(site, productKey, role, facts.ageYears, numericFact((values.coverageAmounts as Record<string, unknown> | undefined)?.[`${productKey}:${role}`]), typeof values.applicantClass === "string" ? values.applicantClass : undefined, facts.associationKey, applicationUnderwritingContext(site, productKey, role, values)) }));
}
export function qdLifeWithFuwDisability(site: EffectiveSite, products: string[], processing: PortfolioProcessing) {
  const category = (key: string) => site.configuration.products.find(product => product.productKey === key)?.catalog?.value.categoryKey;
  if (!products.some(key => category(key) === "LI") || !products.some(key => category(key) === "DI")) return "unmatched" as const;
  const relevant = products.filter(key => ["LI", "DI"].includes(category(key) ?? ""));
  if (relevant.some(key => processing.find(row => row.productKey === key)?.status !== "resolved")) return "needs-information" as const;
  return processing.some(row => products.includes(row.productKey) && category(row.productKey) === "LI" && row.pathway === "QD") && processing.some(row => products.includes(row.productKey) && category(row.productKey) === "DI" && row.pathway === "FUW") ? "matched" as const : "unmatched" as const;
}
export function qdLifeWithDisability(site: EffectiveSite, products: string[], processing: PortfolioProcessing) {
  const category = (key: string) => site.configuration.products.find(product => product.productKey === key)?.catalog?.value.categoryKey;
  if (!products.some(key => category(key) === "LI") || !products.some(key => category(key) === "DI")) return "unmatched" as const;
  if (products.filter(key => category(key) === "LI").some(key => processing.find(row => row.productKey === key)?.status !== "resolved")) return "needs-information" as const;
  return processing.some(row => products.includes(row.productKey) && category(row.productKey) === "LI" && row.pathway === "QD") ? "matched" as const : "unmatched" as const;
}
/** Questionnaire participation is explicit captured policy, separate from the
 * person's underlying QD/FUW processing. No Site names occur in this resolver. */
export function portfolioLifeHealthPage(site: EffectiveSite, productKey: string, applicant: string, pathway: string | undefined, products: string[], processing: PortfolioProcessing) {
  const policy = resolveCoverageJourneyPolicy(site, productKey);
  if (applicant !== "child" && policy?.healthPageForPortfolio?.when === "qd-life-with-disability" && site.configuration.products.find(product => product.productKey === productKey)?.catalog?.value.categoryKey === "DI") {
    const match = qdLifeWithDisability(site, products, processing);
    return match === "matched" ? { status: "matched" as const, healthPage: policy.healthPageForPortfolio.pageId } : { status: match };
  }
  if (applicant === "child" || pathway !== "QD" || !policy?.healthPageForPortfolio || site.configuration.products.find(product => product.productKey === productKey)?.catalog?.value.categoryKey !== "LI") return { status: "unmatched" as const };
  const match = qdLifeWithFuwDisability(site, products, processing);
  return match === "matched" ? { status: "matched" as const, healthPage: policy.healthPageForPortfolio.pageId } : { status: match };
}
