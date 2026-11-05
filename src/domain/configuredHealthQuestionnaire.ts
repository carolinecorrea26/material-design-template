import { applicantPortfolioProcessing, applicantPortfolioProducts, qdLifeWithDisability, qdLifeWithFuwDisability, type PortfolioProcessing } from "./portfolioHealthParticipation";
import type { EffectiveSite } from "./effectiveSite";
import type { FieldDefinition } from "./fields";
import { healthFieldError } from "./healthQuestionnaire";

export type HealthItem = {
  key: string; sourceReferences: string[]; questionFieldKey?: string; fieldKeys: string[]; repeated?: boolean;
  /** Same medical question across source variants; answer IDs remain independent. */
  groupKey?: string;
  /** Answer that reveals this question's details; defaults to Yes. */
  detailsAnswer?: string;
  when?: { answerKey?: string; answer?: "yes" | "no"; gender?: string; jurisdictions?: string[]; exceptJurisdictions?: string[] };
};
export type HealthQuestionnairePolicy = {
  detailsGroupLabel?: string;
  version: 1; applicability?: "site"; associationKeys: string[]; pageId: "health-li" | "health-di" | "health-ci" | "health-cir"; whenProcessing?: "qd-life-with-fuw-disability" | "qd-life-with-disability";
  whenRider?: { productKey: string; riderId: string };
  variants: Array<{ key: string; when: { any?: string[]; none?: string[]; only?: string[]; otherThan?: string[] }; items: HealthItem[]; supersededPages?: string[] }>;
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s => typeof s === "string" && s.trim()) && new Set(v).size === v.length;
function isHealthItem(item: unknown): item is HealthItem {
  if (!object(item) || typeof item.key !== "string" || !item.key.trim() || !strings(item.sourceReferences) || !item.sourceReferences.length || !strings(item.fieldKeys)) return false;
  if (item.groupKey !== undefined && (typeof item.groupKey !== "string" || !item.groupKey.trim())) return false;
  if (item.detailsAnswer !== undefined && (typeof item.detailsAnswer !== "string" || !item.detailsAnswer.trim() || !item.questionFieldKey || !item.fieldKeys.length)) return false;
  if (item.questionFieldKey !== undefined && (typeof item.questionFieldKey !== "string" || !item.questionFieldKey.trim())) return false;
  if (!item.questionFieldKey && !item.fieldKeys.length) return false;
  if (item.repeated !== undefined && typeof item.repeated !== "boolean" || item.repeated && (!item.questionFieldKey || !item.fieldKeys.length)) return false;
  if (item.when === undefined) return true;
  const when = item.when;
  if (!object(when) || Object.keys(when).some(key => !["answerKey", "answer", "gender", "jurisdictions", "exceptJurisdictions"].includes(key))) return false;
  if (when.answerKey === undefined ? when.answer !== undefined : typeof when.answerKey !== "string" || !["yes", "no"].includes(String(when.answer))) return false;
  return (when.gender === undefined || typeof when.gender === "string") && (when.jurisdictions === undefined || strings(when.jurisdictions)) && (when.exceptJurisdictions === undefined || strings(when.exceptJurisdictions));
}
export function isHealthQuestionnairePolicy(v: unknown): v is HealthQuestionnairePolicy {
  if (object(v) && v.detailsGroupLabel !== undefined && (typeof v.detailsGroupLabel !== "string" || !v.detailsGroupLabel.trim())) return false;
  if (!object(v) || v.version !== 1 || !["health-li", "health-di", "health-ci", "health-cir"].includes(String(v.pageId)) || !strings(v.associationKeys) || (v.applicability !== undefined && v.applicability !== "site") || (v.applicability === "site" ? v.associationKeys.length !== 0 : !v.associationKeys.length) || !Array.isArray(v.variants) || !v.variants.length) return false;
  if (v.whenRider !== undefined && (!object(v.whenRider) || Object.keys(v.whenRider).some(key => !["productKey", "riderId"].includes(key)) || ![v.whenRider.productKey, v.whenRider.riderId].every(key => typeof key === "string" && key.trim()))) return false;
  if (v.whenProcessing !== undefined && (!["qd-life-with-fuw-disability", "qd-life-with-disability"].includes(String(v.whenProcessing)) || v.pageId !== "health-di" || v.applicability !== "site")) return false;
  if (new Set(v.variants.map(row => row?.key)).size !== v.variants.length) return false;
  return v.variants.every(row => {
    if (!object(row) || typeof row.key !== "string" || !row.key.trim() || !object(row.when) || !Array.isArray(row.items) || !row.items.length) return false;
    if (Object.entries(row.when).some(([key, value]) => !["any", "none", "only", "otherThan"].includes(key) || !strings(value) || !value.length)) return false;
    if (row.supersededPages !== undefined && (!strings(row.supersededPages) || row.supersededPages.some(page => !["health-si", "health-qd", "health-di"].includes(page)))) return false;
    return new Set(row.items.map(item => item?.key)).size === row.items.length && row.items.every(isHealthItem)
      && new Set(row.items.map(item => item.groupKey ?? item.key)).size === row.items.length;
  });
}
export function healthQuestionnaireFieldKeys(policy: HealthQuestionnairePolicy) {
  return [...new Set(policy.variants.flatMap(variant => variant.items.flatMap(item => [...(item.questionFieldKey ? [item.questionFieldKey] : []), ...item.fieldKeys])))];
}
export const healthAnswerId = (key: string, applicant: string) => `${key}-${applicant === "self" ? "member" : applicant}`;

/** Scope and form-specific question selection are captured data, independent of
 * underwriting processing outcomes. No Site or Association names occur here. */
export type QuestionnaireProcessing = PortfolioProcessing;
export function configuredHealthQuestionnaire(site: EffectiveSite, pageId: string, applicant: string, values: Record<string, unknown>, processing?: QuestionnaireProcessing) {
  if (pageId === "health-cir" && !site.configuration.pages.some(page => page.key === pageId && page.requirement !== "none")) return { status: "unassigned" as const, items: [], fields: [] as FieldDefinition[] };
  const rows = site.configuration.healthQuestionnairePolicies;
  if (!rows.length) return { status: "unassigned" as const, items: [], fields: [] as FieldDefinition[] };
  if (rows.some(row => !isHealthQuestionnairePolicy(row.value))) return { status: "unresolved" as const, items: [], fields: [] as FieldDefinition[] };
  const association = values.association ?? values.membership;
  const matches = rows.filter(row => isHealthQuestionnairePolicy(row.value) && row.value.pageId === pageId && (row.value.applicability === "site" || row.value.associationKeys.includes(String(association))));
  if (!matches.length) return { status: "unassigned" as const, items: [], fields: [] as FieldDefinition[] };
  if (matches.length !== 1 || !isHealthQuestionnairePolicy(matches[0].value)) return { status: "unresolved" as const, items: [], fields: [] as FieldDefinition[] };
  const row = matches[0], policy = row.value as HealthQuestionnairePolicy, type = applicant === "self" ? "member" : applicant;
  const products = applicantPortfolioProducts(type, values);
  if (policy.whenRider && (type === "child" || !products.includes(policy.whenRider.productKey) || !object(values.coverageRiders) || values.coverageRiders[`${policy.whenRider.productKey}:${policy.whenRider.riderId}:${type}`] !== true)) return { status: "unassigned" as const, items: [], fields: [] as FieldDefinition[] };
  if (policy.whenProcessing) {
    const match = type === "child" ? "unmatched" : (policy.whenProcessing === "qd-life-with-disability" ? qdLifeWithDisability : qdLifeWithFuwDisability)(site, products, processing ?? applicantPortfolioProcessing(site, type, values));
    if (match === "needs-information") return { status: "unresolved" as const, items: [], fields: [] as FieldDefinition[] };
    if (match !== "matched") return { status: "unassigned" as const, items: [], fields: [] as FieldDefinition[] };
  }
  const variants = policy.variants.filter(({ when }) => (!when.any || when.any.some(key => products.includes(key))) && (!when.none || when.none.every(key => !products.includes(key))) && (!when.only || products.length > 0 && products.every(key => when.only!.includes(key))) && (!when.otherThan || products.some(key => !when.otherThan!.includes(key))));
  if (variants.length !== 1) return { status: "unresolved" as const, items: [], fields: [] as FieldDefinition[] };
  const definitions = new Map(row.fields.map(field => [field.key, field.definition]));
  const definition = (key: string, id = healthAnswerId(key, type)) => { const field = definitions.get(key); if (!field) throw new Error(`Missing configured health field ${key}`); return { ...field, id }; };
  const jurisdiction = String(values["state-province"] ?? values.state ?? "").replace(/^US-/, "");
  const items = variants[0].items.map((item, position) => ({ ...item, position })).filter(item => (!item.when?.answerKey || values[healthAnswerId(item.when.answerKey, type)] === item.when.answer) && (!item.when?.gender || values[type === "spouse" ? "spouse-gender" : "gender"] === item.when.gender) && (!item.when?.jurisdictions || item.when.jurisdictions.includes(jurisdiction)) && (!item.when?.exceptJurisdictions || !item.when.exceptJurisdictions.includes(jurisdiction))).map(item => {
    const question = item.questionFieldKey ? definition(item.questionFieldKey) : null;
    const showDetails = !question || values[question.id] === (item.detailsAnswer ?? "yes");
    const fields = item.fieldKeys.map(key => definition(key, item.repeated ? key : healthAnswerId(`${item.key}-${key}`, type)));
    return { ...item, question, fields, showDetails, collection: healthAnswerId(`${item.key}-details`, type) };
  });
  return { status: "resolved" as const, items, supersededPages: variants[0].supersededPages ?? [], fields: items.flatMap(item => [...(item.question ? [item.question] : []), ...(!item.repeated && item.showDetails ? item.fields : [])]) };
}
export function validateConfiguredHealthQuestionnaire(result: ReturnType<typeof configuredHealthQuestionnaire>, values: Record<string, unknown>) {
  if (result.status === "unassigned") return undefined;
  if (result.status !== "resolved") return "No unique valid health questionnaire is assigned.";
  const validate = healthFieldError;
  for (const item of result.items) {
    if (item.question) { const error = validate(item.question, values[item.question.id]); if (error) return error; }
    if (!item.showDetails) continue;
    if (item.repeated) {
      const rows = values[item.collection];
      if (!Array.isArray(rows) || !rows.length) return `Add details for ${item.question!.label}`;
      for (const row of rows) {
        if (!object(row)) return `Update details for ${item.question!.label}`;
        for (const field of item.fields) { const error = validate(field, row[field.id]); if (error) return error; }
      }
    } else for (const field of item.fields) { const error = validate(field, values[field.id]); if (error) return error; }
  }
}
