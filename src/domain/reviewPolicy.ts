import type { FieldId } from "./fields";

export type ReviewSelection = { productKey: string; category: string; applicants: string[]; accidentRider?: boolean; mode?: string };
export type ReviewBlock = {
  key: string; title: string; paragraphs: string[]; fields: FieldId[]; sourceReferences: string[];
  listItems?: string[]; afterList?: string[];
  when?: { applicant?: string; products?: string[]; modes?: string[] };
};
export type ReviewPolicy = {
  version: 1;
  fraud: { defaultText: string; byJurisdiction: Record<string, string>; overrideText?: string; nyAccidentLifeProducts?: string[]; sourceReferences: string[] };
  blocks: ReviewBlock[];
};

export function activeReviewBlocks(policy: ReviewPolicy, selections: ReviewSelection[]) {
  return policy.blocks.filter(block => !block.when || selections.some(selection =>
    (!block.when?.applicant || selection.applicants.includes(block.when.applicant)) &&
    (!block.when?.products || block.when.products.includes(selection.productKey)) &&
    (!block.when?.modes || block.when.modes.includes(selection.mode ?? "new"))));
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
  return policy.version === 1 && !!policy.fraud && typeof policy.fraud.defaultText === "string" && !!policy.fraud.byJurisdiction && typeof policy.fraud.byJurisdiction === "object" && Object.values(policy.fraud.byJurisdiction).every(v => typeof v === "string") && strings(policy.fraud.sourceReferences) && (policy.fraud.overrideText === undefined || typeof policy.fraud.overrideText === "string") && (policy.fraud.nyAccidentLifeProducts === undefined || strings(policy.fraud.nyAccidentLifeProducts)) && Array.isArray(policy.blocks) && new Set(policy.blocks.map(block => block?.key)).size === policy.blocks.length && policy.blocks.every(block => !!block && typeof block.key === "string" && typeof block.title === "string" && strings(block.paragraphs) && (block.listItems === undefined || strings(block.listItems)) && (block.afterList === undefined || strings(block.afterList)) && strings(block.fields) && strings(block.sourceReferences) && (!block.when || (block.when.applicant === undefined || typeof block.when.applicant === "string") && (block.when.products === undefined || strings(block.when.products)) && (block.when.modes === undefined || strings(block.when.modes))));
}

/** Candidate Review acceptance reads captured Library fields, never a static catalog. */
export function validateCapturedReview(site: import("./effectiveSite").EffectiveSite, jurisdiction: string | undefined, selections: ReviewSelection[], answers: Record<string, unknown>) {
  const policies = site.configuration.reviewPolicies;
  const errors: string[] = [], missing: string[] = [], cleanedAnswers: Record<string, unknown> = {};
  if (policies.length !== 1 || !isReviewPolicy(policies[0].value)) return { allowed: false, errors: ["No unique valid Review policy"], missing, cleanedAnswers, fraudNotice: null };
  if (!jurisdiction) missing.push("member-residence");
  const policy = policies[0].value;
  const fields = site.configuration.pages.find(page => page.key === "review")?.fields ?? [];
  for (const id of new Set(activeReviewBlocks(policy, selections).flatMap(block => block.fields))) {
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
