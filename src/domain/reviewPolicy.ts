import type { FieldId } from "./fields";

/** All Review selectors use the same canonical residence code. */
export const normalizeReviewJurisdiction = (value: unknown): string => typeof value === 'string' ? value.trim().replace(/^US-/i, '').toUpperCase() : '';

export type ReviewSelection = { productKey: string; category: string; applicants: string[]; accidentRider?: boolean; mode?: string };
export type ReviewBlock = {
  key: string; title: string; paragraphs: string[]; fields: FieldId[]; sourceReferences: string[];
  listItems?: string[]; afterList?: string[]; placement?: "read-and-sign-appendix" | "before-signature" | "before-member-signature" | "before-consent" | "before-review" | "after-electronic-consent"; fontSizePt?: number; emphasis?: "bold"; appearance?: "info";
  when?: { applicant?: string; products?: string[]; modes?: string[]; jurisdictions?: string[]; associationKeys?: string[]; categories?: string[]; underwritingFlag?: true; healthQuestions?: true };
};
export type ReviewPolicy = {
  version: 1;
  underwritingFlag?: { rules: Array<{ applicants: Array<"member" | "spouse">; categories?: string[]; products?: string[] }> };
  documentLinks?: Array<{ text: string; section: "read-and-sign" | "electronic-consent"; document: "important-notice" | "privacy-notice" }>;
  importantNotice?: { defaultDocument: string; byJurisdiction: Record<string, string> };
  premiumContributionStatement?: string | null;
  authorization?: {
    when: "underwriting-flag" | "participating-health-questions" | "health-questions-or-underwriting"; underwritingTypes?: Array<"FUW" | "TELE">; pageIds: Array<"health-tele" | "health-si" | "health-di-supp" | "health-qd">; sourceReferences: string[];
    introductoryStatement?: string;
    wording?: { defaultText: string; processingVariants?: Array<{ when: "qd-disability-or-qd-life-with-disability"; text: string; sourceReferences: string[] }>; variants: Array<{ jurisdictions: string[]; underwritingTypes?: string[]; text: string; afterConsentText?: string }> };
  };
  fraud: { defaultText: string; byJurisdiction: Record<string, string>; overrideText?: string; nyAccidentLifeProducts?: string[]; sourceReferences: string[] };
  blocks: ReviewBlock[];
  consent?: {
    underwrittenWhen: Array<{ productKey: string; applicants: string[] }>;
    underwrittenWhenHealthQuestions?: true;
    underwrittenWhenUnderwritingFlag?: true;
    underwrittenWhenUnderwritingTypes?: Array<"FUW" | "TELE">;
    variants?: Array<{ jurisdictions: string[]; underwritingTypes: string[]; text: string }>;
    underwrittenText: string; otherText: string; sourceReferences: string[];
    otherOpening?: { fieldId: string; answer: string; acceptedAnswers: string[]; prefix: string };
  };
};

/** Legal underwriting applicability is selected coverage, independent of online questionnaires. */
export function reviewUnderwritingFlag(policy: ReviewPolicy, selections: ReviewSelection[]): boolean {
  if (!policy.underwritingFlag) throw new Error('Missing Review underwriting-flag definition');
  return policy.underwritingFlag.rules.some(rule => selections.some(selection =>
    selection.applicants.some(applicant => rule.applicants.some(candidate => candidate === applicant)) &&
    (!rule.categories || rule.categories.includes(selection.category)) &&
    (!rule.products || rule.products.includes(selection.productKey))));
}

/** The captured policy owns both copy and applicability; no Site-name branches. */
export function resolveReviewConsent(policy: ReviewPolicy, selections: ReviewSelection[], answers: Record<string, unknown>, healthQuestionParticipation?: boolean, context: { jurisdiction?: string; underwritingTypes?: string[] } = {}) {
  if (!isReviewPolicy(policy)) return { status: "unresolved" as const, text: null, missing: [] as string[] };
  if (!policy.consent) return { status: "resolved" as const, text: null, missing: [] as string[] };
  const consent = policy.consent;
  const variant = consent.variants?.find(row => row.jurisdictions.includes(normalizeReviewJurisdiction(context.jurisdiction)) && row.underwritingTypes.some(type => context.underwritingTypes?.includes(type)));
  if (consent.underwrittenWhenHealthQuestions && healthQuestionParticipation === undefined) return { status: "needs-information" as const, text: null, missing: ["health-question-participation"] };
  if (variant && (!consent.underwrittenWhenUnderwritingFlag || reviewUnderwritingFlag(policy, selections))) return { status: "resolved" as const, text: variant.text, missing: [] as string[] };
  if (consent.underwrittenWhenUnderwritingFlag && reviewUnderwritingFlag(policy, selections) || consent.underwrittenWhenUnderwritingTypes?.some(type => context.underwritingTypes?.includes(type)) || (consent.underwrittenWhenHealthQuestions ? healthQuestionParticipation : selections.some(selection => consent.underwrittenWhen.some(rule => rule.productKey === selection.productKey && selection.applicants.some(applicant => rule.applicants.includes(applicant)))))) return { status: "resolved" as const, text: consent.underwrittenText, missing: [] as string[] };
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
  return policy.blocks.filter(block => !block.when || (!block.when.healthQuestions || facts.healthQuestionParticipation === true) && (!block.when.underwritingFlag || reviewUnderwritingFlag(policy, selections)) && selections.some(selection =>
    (!block.when?.applicant || selection.applicants.includes(block.when.applicant)) &&
    (!block.when?.products || block.when.products.includes(selection.productKey)) &&
    (!block.when?.categories || block.when.categories.includes(selection.category)) &&
    (!block.when?.modes || block.when.modes.includes(selection.mode ?? "new")) &&
    (!block.when?.jurisdictions || block.when.jurisdictions.includes(normalizeReviewJurisdiction(facts.jurisdiction))) &&
    (!block.when?.associationKeys || !!facts.associationKey && block.when.associationKeys.includes(facts.associationKey))));
}

/** No jurisdiction fallback for missing residence; caller must collect it. */
export function resolveFraudNotice(policy: ReviewPolicy, jurisdiction: string | undefined, selections: ReviewSelection[]) {
  const code = normalizeReviewJurisdiction(jurisdiction);
  if (!code || !selections.length) return null;
  if (policy.fraud.overrideText) return policy.fraud.overrideText;
  if (code === "NY" && !selections.some(selection => selection.category !== "LI" || selection.accidentRider || policy.fraud.nyAccidentLifeProducts?.includes(selection.productKey))) return null;
  return policy.fraud.byJurisdiction[code] ?? policy.fraud.defaultText;
}

export function isReviewPolicy(value: unknown): value is ReviewPolicy {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const policy = value as ReviewPolicy;
  const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === "string" && s.trim().length > 0);
  const uniqueScope = (v: unknown): v is string[] => strings(v) && v.length > 0 && new Set(v).size === v.length;
  const jurisdictions = (v: unknown) => uniqueScope(v) && v.every(code => /^[A-Z]{2}$/.test(code));
  if (!policy.fraud?.byJurisdiction || Array.isArray(policy.fraud.byJurisdiction) || Object.keys(policy.fraud.byJurisdiction).some(code => !/^[A-Z]{2}$/.test(code))) return false;
  if (policy.authorization?.wording?.variants && (!Array.isArray(policy.authorization.wording.variants) || policy.authorization.wording.variants.some(variant => !variant || !jurisdictions(variant.jurisdictions)))) return false;
  if (policy.consent?.variants && (!Array.isArray(policy.consent.variants) || policy.consent.variants.some(variant => !variant || !jurisdictions(variant.jurisdictions)))) return false;
  if (!Array.isArray(policy.blocks) || policy.blocks.some(block => {
    if (!block || !strings(block.fields) || new Set(block.fields).size !== block.fields.length || typeof block.key !== 'string' || !block.key.trim()) return true;
    const when = block.when;
    return when !== undefined && (!when || typeof when !== 'object' || Array.isArray(when) ||
      Object.keys(when).some(key => !['applicant', 'products', 'modes', 'jurisdictions', 'associationKeys', 'categories', 'underwritingFlag', 'healthQuestions'].includes(key)) ||
      when.applicant !== undefined && !['member', 'spouse', 'child'].includes(when.applicant) ||
      [when.products, when.modes, when.associationKeys, when.categories, when.jurisdictions].some(scope => scope !== undefined && !uniqueScope(scope)) ||
      when.jurisdictions?.some(code => !/^[A-Z]{2}$/.test(code)));
  })) return false;
  const medicalUnderwritingTypes = (v: unknown) => strings(v) && v.length > 0 && new Set(v).size === v.length && v.every(type => ["FUW", "TELE"].includes(type));
  if (policy.underwritingFlag !== undefined) {
    const flag = policy.underwritingFlag;
    if (!flag || typeof flag !== 'object' || Array.isArray(flag) || !Array.isArray(flag.rules) || !flag.rules.every(rule => rule && strings(rule.applicants) && rule.applicants.length > 0 && new Set(rule.applicants).size === rule.applicants.length && rule.applicants.every(applicant => ['member', 'spouse'].includes(applicant)) && (rule.categories !== undefined || rule.products !== undefined) && (rule.categories === undefined || strings(rule.categories) && rule.categories.length > 0 && new Set(rule.categories).size === rule.categories.length && rule.categories.every(category => ['LI', 'DI', 'OO', 'AD', 'SH'].includes(category))) && (rule.products === undefined || strings(rule.products) && rule.products.length > 0 && new Set(rule.products).size === rule.products.length))) return false;
  }
  if (policy.documentLinks !== undefined && (!Array.isArray(policy.documentLinks) || !policy.documentLinks.every(link => link && typeof link.text === 'string' && !!link.text.trim() && ['read-and-sign', 'electronic-consent'].includes(link.section) && ['important-notice', 'privacy-notice'].includes(link.document) && (link.document !== 'important-notice' || !!policy.importantNotice)) || new Set(policy.documentLinks.map(link => `${link.section}:${link.text}`)).size !== policy.documentLinks.length)) return false;
  if (policy.importantNotice !== undefined) {
    const notice = policy.importantNotice;
    if (!notice || typeof notice !== 'object' || Array.isArray(notice) || typeof notice.defaultDocument !== 'string' || !notice.defaultDocument.trim() || !notice.byJurisdiction || typeof notice.byJurisdiction !== 'object' || Array.isArray(notice.byJurisdiction) || Object.entries(notice.byJurisdiction).some(([state, key]) => !/^[A-Z]{2}$/.test(state) || typeof key !== 'string' || !key.trim())) return false;
  }
  if (policy.premiumContributionStatement !== undefined && policy.premiumContributionStatement !== null && (typeof policy.premiumContributionStatement !== "string" || !policy.premiumContributionStatement.trim())) return false;
  if (policy.authorization !== undefined) {
    const a = policy.authorization;
    if (!a || typeof a !== "object" || Array.isArray(a) || !["underwriting-flag", "participating-health-questions", "health-questions-or-underwriting"].includes(a.when) || a.when === "underwriting-flag" && !policy.underwritingFlag || !strings(a.pageIds) || a.when !== "underwriting-flag" && !a.pageIds.length || new Set(a.pageIds).size !== a.pageIds.length || !a.pageIds.every(id => ["health-tele", "health-si", "health-di-supp", "health-qd"].includes(id)) || !strings(a.sourceReferences) || !a.sourceReferences.length) return false;
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
    if (c.underwrittenWhenUnderwritingFlag !== undefined && (c.underwrittenWhenUnderwritingFlag !== true || !policy.underwritingFlag || c.underwrittenWhenHealthQuestions)) return false;
    if (c.underwrittenWhenHealthQuestions !== undefined && c.underwrittenWhenHealthQuestions !== true) return false;
    if (c.underwrittenWhenUnderwritingTypes !== undefined && !medicalUnderwritingTypes(c.underwrittenWhenUnderwritingTypes)) return false;
    if (!Array.isArray(c.underwrittenWhen) || !c.underwrittenWhen.length && !c.underwrittenWhenHealthQuestions && !c.underwrittenWhenUnderwritingFlag || new Set(c.underwrittenWhen.map(rule => rule?.productKey)).size !== c.underwrittenWhen.length || !c.underwrittenWhen.every(rule => rule && typeof rule.productKey === "string" && rule.productKey.trim() && strings(rule.applicants) && rule.applicants.length) || !strings(c.sourceReferences) || !c.sourceReferences.length || ![c.underwrittenText, c.otherText].every(text => typeof text === "string" && /^CONSENT:\s*\S/.test(text))) return false;
    if (o && (typeof o.fieldId !== "string" || !o.fieldId.trim() || typeof o.prefix !== "string" || !o.prefix.trim() || !strings(o.acceptedAnswers) || new Set(o.acceptedAnswers).size !== o.acceptedAnswers.length || !o.acceptedAnswers.includes(o.answer) || !/^CONSENT:\s*By /.test(c.otherText))) return false;
  }
  return policy.version === 1 && !!policy.fraud && typeof policy.fraud.defaultText === "string" && !!policy.fraud.byJurisdiction && typeof policy.fraud.byJurisdiction === "object" && Object.values(policy.fraud.byJurisdiction).every(v => typeof v === "string") && strings(policy.fraud.sourceReferences) && (policy.fraud.overrideText === undefined || typeof policy.fraud.overrideText === "string") && (policy.fraud.nyAccidentLifeProducts === undefined || strings(policy.fraud.nyAccidentLifeProducts)) && Array.isArray(policy.blocks) && new Set(policy.blocks.map(block => block?.key)).size === policy.blocks.length && policy.blocks.every(block => !!block && typeof block.key === "string" && typeof block.title === "string" && strings(block.paragraphs) && (block.listItems === undefined || strings(block.listItems)) && (block.afterList === undefined || strings(block.afterList)) && (block.placement === undefined || ["read-and-sign-appendix", "before-signature", "before-member-signature", "before-consent", "before-review", "after-electronic-consent"].includes(block.placement)) && (block.emphasis === undefined || block.emphasis === "bold") && (block.appearance === undefined || block.appearance === "info") && (block.fontSizePt === undefined || typeof block.fontSizePt === "number" && Number.isFinite(block.fontSizePt) && block.fontSizePt > 0 && block.fontSizePt <= 72) && strings(block.fields) && strings(block.sourceReferences) && (!block.when || (block.when.underwritingFlag === undefined || block.when.underwritingFlag === true && !!policy.underwritingFlag) && (block.when.categories === undefined || strings(block.when.categories) && block.when.categories.length > 0 && block.when.categories.every(category => ['LI', 'DI', 'OO', 'AD', 'SH'].includes(category))) && (block.when.healthQuestions === undefined || block.when.healthQuestions === true) && (block.when.applicant === undefined || typeof block.when.applicant === "string") && (block.when.products === undefined || strings(block.when.products)) && (block.when.modes === undefined || strings(block.when.modes)) && (block.when.jurisdictions === undefined || strings(block.when.jurisdictions)) && (block.when.associationKeys === undefined || strings(block.when.associationKeys))));
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
