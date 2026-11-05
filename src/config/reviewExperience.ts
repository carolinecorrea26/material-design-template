import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { activeReviewBlocks, resolveFraudNotice, resolveReviewConsent, type ReviewSelection } from "../domain/reviewPolicy";
import { reviewPolicyForSite } from "../content/reviewPolicies";
import { fieldCatalog } from "./fields";
import type { ClientConfig } from "../domain/configuration";
import type { CoverageDefinition } from "../domain/coverage";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { resolvePageParticipation } from "./flowGates";
import { getClientPageRequirement } from "./client/getClientPageRequirement";

export function resolveReviewExperience(client: ClientConfig, siteKey: string, products: CoverageDefinition[], values: Record<string, unknown>) {
  const library = getPrototypeLibrary(siteKey);
  const policy = library ? library.client.reviewPolicy! : reviewPolicyForSite(siteKey, client.reviewPolicy);
  const entries = buildSelectedCoverageEntries(values as ApplicationFormValues, products);
  const selections: ReviewSelection[] = entries.map(entry => ({ productKey: entry.coverageId, category: entry.coverage.categoryId, applicants: [entry.applicant], accidentRider: Object.entries(values.coverageRiders as Record<string, boolean> ?? {}).some(([key, selected]) => selected && key.startsWith(`${entry.coverageId}:`) && /ad|accident/i.test(key)), mode: (values.coverageModes as Record<string, string> | undefined)?.[entry.coverageId] ?? "new" }));
  const jurisdiction = String(values["state-province"] || values.state || "");
  const adultUnderwritingTypes = entries.filter(entry => entry.applicant !== "child").flatMap(entry => entry.underwriting.status === "resolved" && entry.underwriting.underwritingType ? [entry.underwriting.underwritingType] : []);
  const healthQuestionParticipation = (["health-li", "health-si", "health-di", "health-qd", "health-ci"] as const).some(pageId => resolvePageParticipation(pageId, values as ApplicationFormValues, { coverages: products, pageRequirement: getClientPageRequirement(pageId, client) }));
  const blocks = activeReviewBlocks(policy, selections, { jurisdiction, healthQuestionParticipation, associationKey: String(values.association ?? values.membership ?? "") }).map(block => ({ ...block, fields: block.fields.filter(id => !client.fields.review?.hidden?.includes(id)).map(id => ({ ...fieldCatalog[id], ...client.fields.review?.overrides?.[id], id })) }));
  const authorization = policy.authorization;
  const underwritingRequiresAuthorization = authorization?.when === "health-questions-or-underwriting" && authorization.underwritingTypes?.some(type => adultUnderwritingTypes.includes(type));
  const authorizationVisible = !authorization || !!underwritingRequiresAuthorization || authorization.pageIds.some(pageId => resolvePageParticipation(pageId, values as ApplicationFormValues, { coverages: products, pageRequirement: getClientPageRequirement(pageId, client) }));
  const consent = resolveReviewConsent(policy, selections, values, healthQuestionParticipation, { jurisdiction, underwritingTypes: adultUnderwritingTypes });
  const variant = policy.authorization?.wording?.variants.find(variant => variant.jurisdictions.includes(jurisdiction.replace(/^US-/, "").toUpperCase()) && (!variant.underwritingTypes || entries.some(entry => !!entry.underwriting.underwritingType && variant.underwritingTypes!.includes(entry.underwriting.underwritingType))));
  const adultEntries = entries.filter(entry => entry.applicant !== "child");
  const qdDisabilityOrCombo = adultEntries.some(entry => entry.coverage.categoryId === "DI" && entry.underwriting.underwritingType === "QD") || adultEntries.some(entry => entry.coverage.categoryId === "LI" && entry.underwriting.underwritingType === "QD") && adultEntries.some(entry => entry.coverage.categoryId === "DI");
  const processingVariant = healthQuestionParticipation && qdDisabilityOrCombo ? policy.authorization?.wording?.processingVariants?.find(variant => variant.when === "qd-disability-or-qd-life-with-disability") : undefined;
  const medicalAuthorization = policy.authorization?.wording ? { introductoryStatement: policy.authorization.introductoryStatement, text: variant?.text ?? processingVariant?.text ?? policy.authorization.wording.defaultText, afterConsentText: variant?.afterConsentText } : undefined;
  return { blocks, consent, authorizationVisible, medicalAuthorization, premiumContributionStatement: policy.premiumContributionStatement, fraudNotice: resolveFraudNotice(policy, jurisdiction, selections), missingResidency: selections.length > 0 && !jurisdiction };
}

/** Preserve legacy content while guaranteeing the applicable notice is rendered. */
export function composeReadAndSign(content: string, fraudNotice: string | null, consentText?: string | null, authorizationVisible = true, medicalAuthorization?: { introductoryStatement?: string; text: string; afterConsentText?: string }, premiumContributionStatement?: string | null) {
  if (premiumContributionStatement !== undefined) {
    content = content.replace(/^(?:PLEASE READ CAREFULLY THE STATEMENTS BELOW\.?\s*)?I understand that payment of a premium contribution[\s\S]*?(?:\n\n|$)/i, "");
    if (premiumContributionStatement !== null) content = `${premiumContributionStatement}\n\n${content}`;
  }
  if (medicalAuthorization) {
    content = content.replace(/(?:^|\n\n)I understand that New York Life has the right to require additional information[\s\S]*?(?=\n\nAUTHORIZATION:)/, "");
    content = content.replace(/(?:^|\n\n)AUTHORIZATION:[\s\S]*?(?=\n\nCONSENT:|$)/, authorizationVisible ? `\n\n${[medicalAuthorization.introductoryStatement, medicalAuthorization.text].filter(Boolean).join("\n\n")}` : "");
  } else if (!authorizationVisible) content = content.replace(/(?:^|\n\n)AUTHORIZATION:[\s\S]*?(?=\n\nCONSENT:|$)/, "");
  if (consentText) {
    const start = content.search(/(?:^|\n\n)CONSENT:/);
    content = `${start < 0 ? content : content.slice(0, start)}\n\n${consentText}`;
  }
  if (authorizationVisible && medicalAuthorization?.afterConsentText) content += `\n\n${medicalAuthorization.afterConsentText}`;
  if (!fraudNotice) return content;
  const consent = "\n\nCONSENT:";
  return content.includes(consent) ? content.replace(consent, `\n\n${fraudNotice}${consent}`) : `${content}\n\n${fraudNotice}`;
}
