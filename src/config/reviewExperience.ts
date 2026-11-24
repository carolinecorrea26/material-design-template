import { requirementUrlValues } from '../domain/requirementUrlParameters';
import { resolveActiveAssociationFromApplication } from '../data/activeAssociation';
import { isLegalDocContent } from '../domain/legalDocuments';
import { getPrototypeLibrary } from "../domain/prototypeLibrary";
import { activeReviewBlocks, isReviewPolicy, normalizeReviewJurisdiction, resolveFraudNotice, resolveReviewConsent, reviewUnderwritingFlag, type ReviewSelection } from "../domain/reviewPolicy";
import type { ClientConfig } from "../domain/configuration";
import type { CoverageDefinition } from "../domain/coverage";
import type { ApplicationFormValues } from "../app/ApplicationFormContext";
import { buildSelectedCoverageEntries } from "../utils/coverageDecisions";
import { resolvePageParticipation } from "./flowGates";
import { getClientPageRequirement } from "./client/getClientPageRequirement";

export type ReviewLegalSections = Record<'read-and-sign' | 'electronic-consent', { maxHeight: number | null }>;
export function resolveReviewLegalSections(library: NonNullable<ReturnType<typeof getPrototypeLibrary>>): ReviewLegalSections {
  const sections = library.pages.find(page => page.key === 'review')?.definition.legalSections as ReviewLegalSections | undefined;
  if (!sections || sections['read-and-sign']?.maxHeight !== null || typeof sections['electronic-consent']?.maxHeight !== 'number' || !Number.isFinite(sections['electronic-consent'].maxHeight) || sections['electronic-consent'].maxHeight <= 0) throw new Error('Invalid fresh-start Review disclosure presentation');
  return sections;
}

export function resolveReviewExperience(client: ClientConfig, siteKey: string, products: CoverageDefinition[], values: Record<string, unknown>) {
  const library = getPrototypeLibrary(siteKey);
  if (!library?.client.reviewPolicy) throw new Error("Missing fresh-start Review policy");
  const policy = library.client.reviewPolicy;
  const legalSections = resolveReviewLegalSections(library);
  if (!isReviewPolicy(policy)) throw new Error('Invalid fresh-start Review policy');
  const declarations = library.site.configuration.configurations.find(row => row.key === 'field-surfaces')?.value as unknown as { reviewPolicyFields: { fields: Array<{ fieldKey: string }> } };
  const declared = new Set(declarations.reviewPolicyFields.fields.map(field => field.fieldKey));
  const policyFields = library.fieldSurfaces.reviewPolicyFields.mapping.fields;
  const entries = buildSelectedCoverageEntries(values as ApplicationFormValues, products);
  const selections: ReviewSelection[] = entries.map(entry => ({ productKey: entry.coverageId, category: entry.coverage.categoryId, applicants: [entry.applicant], accidentRider: Object.entries(values.coverageRiders as Record<string, boolean> ?? {}).some(([key, selected]) => selected && key.startsWith(`${entry.coverageId}:`) && key.endsWith(`:${entry.applicant}`) && entry.coverage.riders?.some(rider => key === `${entry.coverageId}:${rider.id}:${entry.applicant}` && /ad|accident/i.test(rider.id))), mode: (values.coverageModes as Record<string, string> | undefined)?.[entry.coverageId] ?? "new" }));
  const jurisdiction = normalizeReviewJurisdiction(values['state-province'] || values.state);
  const adultUnderwritingTypes = entries.filter(entry => entry.applicant !== "child").flatMap(entry => entry.underwriting.status === "resolved" && entry.underwriting.underwritingType ? [entry.underwriting.underwritingType] : []);
  const healthQuestionParticipation = (["health-tele", "health-si", "health-di-supp", "health-qd"] as const).some(pageId => resolvePageParticipation(pageId, values as ApplicationFormValues, { coverages: products, pageRequirement: getClientPageRequirement(pageId, client) }));
  const associationKey = resolveActiveAssociationFromApplication(siteKey, values as ApplicationFormValues).association?.id;
  const activeFields = new Set<string>();
  const blocks = activeReviewBlocks(policy, selections, { jurisdiction, healthQuestionParticipation, associationKey }).map(block => ({ ...block, fields: block.fields.map(id => {
    if (!declared.has(id)) throw new Error(`Unmapped Review policy field: ${id}`);
    const field = policyFields.find(field => field.id === id);
    if (!field) throw new Error(`Missing Review policy field: ${id}`);
    if (activeFields.has(id)) throw new Error(`Duplicate active Review policy field: ${id}`);
    activeFields.add(id);
    return field;
  }) }));
  const underwritingFlag = policy.underwritingFlag ? reviewUnderwritingFlag(policy, selections) : undefined;
  const authorization = policy.authorization;
  const underwritingRequiresAuthorization = authorization?.when === "health-questions-or-underwriting" && authorization.underwritingTypes?.some(type => adultUnderwritingTypes.includes(type));
  const authorizationVisible = authorization?.when === "underwriting-flag" ? underwritingFlag === true : !authorization || !!underwritingRequiresAuthorization || authorization.pageIds.some(pageId => resolvePageParticipation(pageId, values as ApplicationFormValues, { coverages: products, pageRequirement: getClientPageRequirement(pageId, client) }));
  const consent = resolveReviewConsent(policy, selections, values, healthQuestionParticipation, { jurisdiction, underwritingTypes: adultUnderwritingTypes });
  const variant = policy.authorization?.wording?.variants.find(variant => variant.jurisdictions.includes(jurisdiction.replace(/^US-/, "").toUpperCase()) && (!variant.underwritingTypes || adultUnderwritingTypes.some(type => variant.underwritingTypes!.includes(type))));
  const adultEntries = entries.filter(entry => entry.applicant !== "child");
  const qdDisabilityOrCombo = adultEntries.some(entry => entry.coverage.categoryId === "DI" && entry.underwriting.underwritingType === "QD") || adultEntries.some(entry => entry.coverage.categoryId === "LI" && entry.underwriting.underwritingType === "QD") && adultEntries.some(entry => entry.coverage.categoryId === "DI");
  const processingVariant = authorizationVisible && qdDisabilityOrCombo ? policy.authorization?.wording?.processingVariants?.find(variant => variant.when === "qd-disability-or-qd-life-with-disability") : undefined;
  const medicalAuthorization = policy.authorization?.wording ? { introductoryStatement: policy.authorization.introductoryStatement, text: variant?.text ?? processingVariant?.text ?? policy.authorization.wording.defaultText, afterConsentText: variant?.afterConsentText } : undefined;
  const notice = policy.importantNotice;
  const documentKey = notice && (notice.byJurisdiction[jurisdiction.replace(/^US-/, '').toUpperCase()] ?? notice.defaultDocument);
  const document = documentKey ? library.content.review.importantNotices?.[documentKey] : undefined;
  if (notice && !isLegalDocContent(document)) throw new Error('Missing fresh-start IMPORTANT NOTICE document');
  const importantNotice = notice && document ? { document } : undefined;
  const legalDocuments = (policy.documentLinks ?? []).map(link => {
    const document = link.document === 'important-notice' ? importantNotice?.document : library.content.footer.privacyNoticeContent;
    if (!isLegalDocContent(document)) throw new Error(`Missing fresh-start Review document: ${link.document}`);
    return { ...link, document };
  });
  return { blocks, consent, importantNotice, legalDocuments, legalSections, underwritingFlag, healthQuestionParticipation, authorizationVisible, medicalAuthorization, premiumContributionStatement: policy.premiumContributionStatement, fraudNotice: resolveFraudNotice(policy, jurisdiction, selections), missingResidency: selections.length > 0 && !jurisdiction };
}

/** Assemble explicitly authored segments; base content never supplies hidden policy wording. */
export function composeReadAndSign(content: string, fraudNotice: string | null, consentText?: string | null, authorizationVisible = true, medicalAuthorization?: { introductoryStatement?: string; text: string; afterConsentText?: string }, premiumContributionStatement?: string | null) {
  return [
    premiumContributionStatement, content,
    ...(authorizationVisible && medicalAuthorization ? [medicalAuthorization.introductoryStatement, medicalAuthorization.text] : []),
    fraudNotice, consentText,
    ...(authorizationVisible && medicalAuthorization ? [medicalAuthorization.afterConsentText] : []),
  ].filter(segment => typeof segment === 'string' && segment.trim()).join('\n\n');
}

export function isAdvisorReviewQuery(params: URLSearchParams): boolean {
  const flow = params.get('flow');
  return flow === 'advisor' && requirementUrlValues('flow').includes(flow);
}
