import type { FieldId } from "./fields";

export type ReviewSelection = { productKey: string; category: string; applicants: string[]; accidentRider?: boolean; mode?: string };
export type ReviewBlock = {
  key: string; title: string; paragraphs: string[]; fields: FieldId[]; sourceReferences: string[];
  listItems?: string[]; afterList?: string[]; placement?: "read-and-sign-appendix" | "before-signature" | "before-member-signature" | "before-consent" | "before-review" | "after-electronic-consent"; fontSizePt?: number; emphasis?: "bold"; appearance?: "info";
  when?: { applicant?: string; products?: string[]; modes?: string[]; jurisdictions?: string[]; associationKeys?: string[]; healthQuestions?: true };
};
export type ReviewPolicy = {
  version: 1;
  premiumContributionStatement?: string | null;
  authorization?: {
    when: "participating-health-questions" | "health-questions-or-underwriting"; underwritingTypes?: Array<"FUW" | "TELE">; pageIds: Array<"health-li" | "health-si" | "health-di" | "health-qd" | "health-ci">; sourceReferences: string[];
    introductoryStatement?: string;
    wording?: { defaultText: string; processingVariants?: Array<{ when: "qd-disability-or-qd-life-with-disability"; text: string; sourceReferences: string[] }>; variants: Array<{ jurisdictions: string[]; underwritingTypes?: string[]; text: string; afterConsentText?: string }> };
  };
  fraud: { defaultText: string; byJurisdiction: Record<string, string>; overrideText?: string; nyAccidentLifeProducts?: string[]; sourceReferences: string[] };
  blocks: ReviewBlock[];
  consent?: {
    underwrittenWhen: Array<{ productKey: string; applicants: string[] }>;
    underwrittenWhenHealthQuestions?: true;
    underwrittenWhenUnderwritingTypes?: Array<"FUW" | "TELE">;
    variants?: Array<{ jurisdictions: string[]; underwritingTypes: string[]; text: string }>;
    underwrittenText: string; otherText: string; sourceReferences: string[];
    otherOpening?: { fieldId: string; answer: string; acceptedAnswers: string[]; prefix: string };
  };
};

/** The captured policy owns both copy and applicability; no Site-name branches. */
export function resolveReviewConsent(policy: ReviewPolicy, selections: ReviewSelection[], answers: Record<string, unknown>, healthQuestionParticipation?: boolean, context: { jurisdiction?: string; underwritingTypes?: string[] } = {}) {
  if (!isReviewPolicy(policy)) return { status: "unresolved" as const, text: null, missing: [] as string[] };
  if (!policy.consent) return { status: "resolved" as const, text: null, missing: [] as string[] };
  const consent = policy.consent;
  const variant = consent.variants?.find(row => row.jurisdictions.includes((context.jurisdiction ?? "").replace(/^US-/, "")) && row.underwritingTypes.some(type => context.underwritingTypes?.includes(type)));
  if (consent.underwrittenWhenHealthQuestions && healthQuestionParticipation === undefined) return { status: "needs-information" as const, text: null, missing: ["health-question-participation"] };
  if (variant) return { status: "resolved" as const, text: variant.text, missing: [] as string[] };
  if (consent.underwrittenWhenUnderwritingTypes?.some(type => context.underwritingTypes?.includes(type)) || (consent.underwrittenWhenHealthQuestions ? healthQuestionParticipation : selections.some(selection => consent.underwrittenWhen.some(rule => rule.productKey === selection.productKey && selection.applicants.some(applicant => rule.applicants.includes(applicant)))))) return { status: "resolved" as const, text: consent.underwrittenText, missing: [] as string[] };
  const opening = consent.otherOpening;
  if (opening) {
    const answer = answers[opening.fieldId];
    if (answer === undefined || answer === null || answer === "") return { status: "needs-information" as const, text: null, missing: [opening.fieldId] };
    if (typeof answer !== "string" || !opening.acceptedAnswers.includes(answer)) return { status: "unresolved" as const, text: null, missing: [] as string[] };
    if (answer === opening.answer) return { status: "resolved" as const, text: consent.otherText.replace(/^(CONSENT:\s*)By /, (_match, heading: string) => `${heading}${opening.prefix}by `), missing: [] as string[] };
  }
  return { status: "resolved" as const, text: consent.otherText, missing: [] as string[] };
}

export function activeReviewBlocks(policy: ReviewPolicy, selections: ReviewSelection[], facts: { jurisdiction?: string; associationKey?: string; healthQuestionParticipation?: boolean } = {}) {
  return policy.blocks.filter(block => !block.when || (!block.when.healthQuestions || facts.healthQuestionParticipation === true) && selections.some(selection =>
    (!block.when?.applicant || selection.applicants.includes(block.when.applicant)) &&
    (!block.when?.products || block.when.products.includes(selection.productKey)) &&
    (!block.when?.modes || block.when.modes.includes(selection.mode ?? "new")) &&
    (!block.when?.jurisdictions || !!facts.jurisdiction && block.when.jurisdictions.includes(facts.jurisdiction.replace(/^US-/, ""))) &&
    (!block.when?.associationKeys || !!facts.associationKey && block.when.associationKeys.includes(facts.associationKey))));
}

/** No jurisdiction fallback for missing residence; caller must collect it. */
export function resolveFraudNotice(policy: ReviewPolicy, jurisdiction: string | undefined, selections: ReviewSelection[]) {
  if (!jurisdiction || !selections.length) return null;
  const code = jurisdiction.replace(/^US-/, "").toUpperCase();
  if (policy.fraud.overrideText) return policy.fraud.overrideText;
  if (code === "NY" && !selections.some(selection => selection.category !== "LI" || selection.accidentRider || policy.fraud.nyAccidentLifeProducts?.includes(selection.productKey))) return null;
  return policy.fraud.byJurisdiction[code] ?? policy.fraud.defaultText;
}

export function isReviewPolicy(value: unknown): value is ReviewPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as ReviewPolicy;
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === "string" && s.trim().length > 0);
  const medicalUnderwritingTypes = (v: unknown) => strings(v) && v.length > 0 && new Set(v).size === v.length && v.every(type => ["FUW", "TELE"].includes(type));
  if (policy.premiumContributionStatement !== undefined && policy.premiumContributionStatement !== null && (typeof policy.premiumContributionStatement !== "string" || !policy.premiumContributionStatement.trim())) return false;
  if (policy.authorization !== undefined) {
    const a = policy.authorization;
    if (!a || typeof a !== "object" || Array.isArray(a) || !["participating-health-questions", "health-questions-or-underwriting"].includes(a.when) || !strings(a.pageIds) || !a.pageIds.length || new Set(a.pageIds).size !== a.pageIds.length || !a.pageIds.every(id => ["health-li", "health-si", "health-di", "health-qd", "health-ci"].includes(id)) || !strings(a.sourceReferences) || !a.sourceReferences.length) return false;
    if (a.when === "health-questions-or-underwriting" ? !medicalUnderwritingTypes(a.underwritingTypes) : a.underwritingTypes !== undefined) return false;
    if (a.introductoryStatement !== undefined && (typeof a.introductoryStatement !== "string" || !a.introductoryStatement.trim())) return false;
    if (a.wording !== undefined) {
      const w = a.wording;
      if (!w || typeof w !== "object" || Array.isArray(w) || typeof w.defaultText !== "string" || !w.defaultText.startsWith("AUTHORIZATION:") || !Array.isArray(w.variants) || !w.variants.every(v => v && strings(v.jurisdictions) && v.jurisdictions.length && new Set(v.jurisdictions).size === v.jurisdictions.length && typeof v.text === "string" && v.text.startsWith("AUTHORIZATION:") && (v.underwritingTypes === undefined || strings(v.underwritingTypes) && v.underwritingTypes.length && v.underwritingTypes.every(type => ["SI", "QD", "FUW", "TELE", "GI"].includes(type))) && (v.afterConsentText === undefined || typeof v.afterConsentText === "string" && v.afterConsentText.trim()))) return false;
      if (w.processingVariants !== undefined && (!Array.isArray(w.processingVariants) || w.processingVariants.length !== 1 || w.processingVariants.some(variant => !variant || variant.when !== "qd-disability-or-qd-life-with-disability" || typeof variant.text !== "string" || !variant.text.startsWith("AUTHORIZATION:") || !strings(variant.sourceReferences) || !variant.sourceReferences.length))) return false;
      if (new Set(w.variants.flatMap(v => v.jurisdictions)).size !== w.variants.flatMap(v => v.jurisdictions).length) return false;
    }
  }
  if (policy.consent !== undefined) {
    if (!policy.consent || typeof policy.consent !== "object" || Array.isArray(policy.consent)) return false;
    const c = policy.consent, o = c.otherOpening;
    if (o !== undefined && (!o || typeof o !== "object" || Array.isArray(o))) return false;
    if (c.variants !== undefined && (!Array.isArray(c.variants) || !c.variants.every(v => v && strings(v.jurisdictions) && v.jurisdictions.length && strings(v.underwritingTypes) && v.underwritingTypes.length && v.underwritingTypes.every(type => ["SI", "QD", "FUW", "TELE", "GI"].includes(type)) && typeof v.text === "string" && v.text.startsWith("CONSENT:")))) return false;
    if (c.underwrittenWhenHealthQuestions !== undefined && c.underwrittenWhenHealthQuestions !== true) return false;
    if (c.underwrittenWhenUnderwritingTypes !== undefined && !medicalUnderwritingTypes(c.underwrittenWhenUnderwritingTypes)) return false;
    if (!Array.isArray(c.underwrittenWhen) || !c.underwrittenWhen.length && !c.underwrittenWhenHealthQuestions || new Set(c.underwrittenWhen.map(rule => rule?.productKey)).size !== c.underwrittenWhen.length || !c.underwrittenWhen.every(rule => rule && typeof rule.productKey === "string" && rule.productKey.trim() && strings(rule.applicants) && rule.applicants.length) || !strings(c.sourceReferences) || !c.sourceReferences.length || ![c.underwrittenText, c.otherText].every(text => typeof text === "string" && /^CONSENT:\s*\S/.test(text))) return false;
    if (o && (typeof o.fieldId !== "string" || !o.fieldId.trim() || typeof o.prefix !== "string" || !o.prefix.trim() || !strings(o.acceptedAnswers) || new Set(o.acceptedAnswers).size !== o.acceptedAnswers.length || !o.acceptedAnswers.includes(o.answer) || !/^CONSENT:\s*By /.test(c.otherText))) return false;
  }
  return policy.version === 1 && !!policy.fraud && typeof policy.fraud.defaultText === "string" && !!policy.fraud.byJurisdiction && typeof policy.fraud.byJurisdiction === "object" && Object.values(policy.fraud.byJurisdiction).every(v => typeof v === "string") && strings(policy.fraud.sourceReferences) && (policy.fraud.overrideText === undefined || typeof policy.fraud.overrideText === "string") && (policy.fraud.nyAccidentLifeProducts === undefined || strings(policy.fraud.nyAccidentLifeProducts)) && Array.isArray(policy.blocks) && new Set(policy.blocks.map(block => block?.key)).size === policy.blocks.length && policy.blocks.every(block => !!block && typeof block.key === "string" && typeof block.title === "string" && strings(block.paragraphs) && (block.listItems === undefined || strings(block.listItems)) && (block.afterList === undefined || strings(block.afterList)) && (block.placement === undefined || ["read-and-sign-appendix", "before-signature", "before-member-signature", "before-consent", "before-review", "after-electronic-consent"].includes(block.placement)) && (block.emphasis === undefined || block.emphasis === "bold") && (block.appearance === undefined || block.appearance === "info") && (block.fontSizePt === undefined || typeof block.fontSizePt === "number" && Number.isFinite(block.fontSizePt) && block.fontSizePt > 0 && block.fontSizePt <= 72) && strings(block.fields) && strings(block.sourceReferences) && (!block.when || (block.when.healthQuestions === undefined || block.when.healthQuestions === true) && (block.when.applicant === undefined || typeof block.when.applicant === "string") && (block.when.products === undefined || strings(block.when.products)) && (block.when.modes === undefined || strings(block.when.modes)) && (block.when.jurisdictions === undefined || strings(block.when.jurisdictions)) && (block.when.associationKeys === undefined || strings(block.when.associationKeys))));
}

/** Candidate Review acceptance reads captured Library fields. Pass the actual
 * health-routing result when the policy requires it; absence fails closed. */
export function validateCapturedReview(site: import("./effectiveSite").EffectiveSite, jurisdiction: string | undefined, selections: ReviewSelection[], answers: Record<string, unknown>, healthQuestionParticipation?: boolean) {
  const policies = site.configuration.reviewPolicies;
  const errors: string[] = [], missing: string[] = [], cleanedAnswers: Record<string, unknown> = {};
  if (policies.length !== 1 || !isReviewPolicy(policies[0].value)) return { allowed: false, errors: ["No unique valid Review policy"], missing, cleanedAnswers, fraudNotice: null };
  if (!jurisdiction) missing.push("member-residence");
  const policy = policies[0].value;
  const consent = resolveReviewConsent(policy, selections, answers, healthQuestionParticipation);
  missing.push(...consent.missing);
  if (consent.status === "unresolved") errors.push("No valid consent selection");
  const fields = site.configuration.pages.find(page => page.key === "review")?.fields ?? [];
  for (const id of new Set(activeReviewBlocks(policy, selections, { jurisdiction, healthQuestionParticipation, associationKey: typeof (answers.association ?? answers.membership) === "string" ? String(answers.association ?? answers.membership) : undefined }).flatMap(block => block.fields))) {
    const field = fields.find(field => field.key === id && field.included)?.definition;
    if (!field) { errors.push(`Missing Review field ${id}`); continue; }
    const answer = answers[id];
    const empty = answer === undefined || answer === null || answer === "" || typeof answer === "string" && !answer.trim();
    if (field.required && (empty || field.inputType === "checkbox" && answer !== true)) { missing.push(id); continue; }
    if (empty) continue;
    if (field.inputType === "checkbox" && typeof answer !== "boolean" || field.inputType !== "checkbox" && typeof answer !== "string") { errors.push(`Invalid Review answer ${id}`); continue; }
    if (field.inputType === "date" && (typeof answer !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(answer) || !Number.isFinite(Date.parse(answer)) || new Date(answer).toISOString().slice(0, 10) !== answer)) { errors.push(`Invalid Review date ${id}`); continue; }
    cleanedAnswers[id] = answer;
  }
  return { allowed: !errors.length && !missing.length, errors, missing, cleanedAnswers, fraudNotice: resolveFraudNotice(policy, jurisdiction, selections) };
}
