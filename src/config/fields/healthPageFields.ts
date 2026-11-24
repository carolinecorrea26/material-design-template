import telePage from '../../../requirements/parked/health-tele.json';
import diSuppPage from '../../../requirements/parked/health-di-supp.json';
import siPage from '../../../requirements/parked/health-si.json';
import { resolveMappedFields, type RequirementMapping } from '../../domain/requirementFields';
import { resolveAnswerKey } from '../../domain/requirementFieldDefinitions.mjs';
import { requirementText } from '../../domain/requirementContent';
import type { FieldSurfaceDefinition } from '../../domain/fieldSurfaces';
import type { EffectiveSite } from '../../domain/effectiveSite';
import type { HealthFollowUp } from '../../domain/healthQuestionnaire';

type Page = {
  page: string; fieldMapping: RequirementMapping; answerKeyPatterns?: Partial<Record<'self' | 'spouse', string>>;
  layout: { sections: { questions: { fields: string[] } } };
  surfaces: Record<string, { definition: Omit<FieldSurfaceDefinition, 'pageKey'>; aliases?: Record<string, { field: string }> }>;
};
/** Default/inspection projections of authored questions and modal fields. */
export function healthPageQuestionFields(page: Page, applicant: 'self' | 'spouse') {
  const fields = new Map(resolveMappedFields(page.fieldMapping, { person: applicant }).map(field => [field.id, field]));
  return page.layout.sections.questions.fields.map(id => {
    const field = fields.get(id);
    if (!field) throw new Error(`Missing ${page.page} question: ${id}`);
    return { ...field, id: resolveAnswerKey(id, applicant, page.answerKeyPatterns) };
  });
}
export function healthPageDetailMapping(page: Page, name: string) {
  const surface = page.surfaces[name];
  const raw = new Map(resolveMappedFields(page.fieldMapping).map(field => [field.id, field]));
  const fields = surface.definition.fields.map(binding => {
    const field = raw.get(surface.aliases?.[binding.fieldKey]?.field ?? binding.fieldKey);
    if (!field) throw new Error(`Missing ${page.page} detail: ${binding.fieldKey}`);
    return { ...field, id: binding.valueKey };
  });
  return { fields, fieldToKey: Object.fromEntries(fields.map(field => [field.id, field.id])) };
}

/** Catalog conversion uses authored surface names, bindings, labels and limits too. */
export function healthPageSurfaceDefaults(page: Page) {
  const fields = [];
  const surfaces: Record<string, FieldSurfaceDefinition> = {};
  for (const [name, surface] of Object.entries(page.surfaces)) {
    const local = healthPageDetailMapping(page, name).fields;
    fields.push(...surface.definition.fields.map((binding, index) => ({ ...local[index], id: binding.fieldKey })));
    surfaces[name] = { ...surface.definition, pageKey: page.page, label: requirementText(surface.definition.label),
      ...(surface.definition.libraryGroup ? { libraryGroup: { ...surface.definition.libraryGroup, label: requirementText(surface.definition.libraryGroup.label) } } : {}) };
  }
  return { fields, surfaces };
}

/** Page identities can change without renaming saved answers. */
export function defaultHealthQuestionIds(pageId: 'health-tele' | 'health-si' | 'health-di-supp', applicant: 'self' | 'spouse') {
  const page = [telePage, diSuppPage, siPage].find(page => page.page === pageId)!;
  return new Set(page.layout.sections.questions.fields.map(key => resolveAnswerKey(key, applicant, page.answerKeyPatterns)));
}

export function getHealthDetailSurfaceName(page: 'health-tele' | 'health-si' | 'health-di-supp', answerId: string) {
  if (page === 'health-tele') return 'healthLiDetails';
  if (page === 'health-si') return 'healthSiDetails';
  const question = answerId.replace(/-spouse$/, '') as keyof typeof diSuppPage.questionDetails;
  const details = diSuppPage.questionDetails[question];
  if (!details) throw new Error(`Missing Disability detail placement: ${answerId}`);
  return details.surface;
}

/** UI and submission validation share authored question identities, effective
 * field definitions, detail bindings and collection limits. */
export function effectiveHealthFollowUps(site: EffectiveSite, pageId: 'health-tele' | 'health-si' | 'health-di-supp', applicant: 'self' | 'spouse'): HealthFollowUp[] {
  const page = site.configuration.pages.find(page => page.key === pageId);
  const ids = defaultHealthQuestionIds(pageId, applicant);
  return (page?.fields ?? []).filter(field => field.included && ids.has(field.key)).map(row => {
    const name = getHealthDetailSurfaceName(pageId, row.key);
    const surface = site.fieldSurfaces?.[name];
    if (!surface) throw new Error(`Missing stored field surface: ${name}`);
    return { answer: row.definition, collection: `${row.key}-details`, fields: surface.mapping.fields,
      fieldToKey: surface.mapping.fieldToKey, maxItems: surface.maxItems };
  });
}

/** Presentation kind is authored per question; the standard condition summary is shared. */
export function defaultHealthDetailSummary(pageId: 'health-tele' | 'health-si' | 'health-di-supp', answerId: string): 'condition' | 'general' | 'assistance' | 'fall' {
  if (pageId !== 'health-di-supp') return 'condition';
  const key = answerId.replace(/-spouse$/, '') as keyof typeof diSuppPage.questionDetails;
  const detail = diSuppPage.questionDetails[key];
  if (!detail) throw new Error(`Missing health detail summary: ${answerId}`);
  return detail.summary as 'condition' | 'general' | 'assistance' | 'fall';
}
